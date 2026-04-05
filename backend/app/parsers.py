"""
Parsers para importação de faturas de cartão de crédito.

Formatos suportados: CSV, OFX.

Cada parser retorna uma lista de dicts com as chaves:
  - raw_description: str
  - raw_amount: float  (valor absoluto; negativo = despesa)
  - raw_date: date
  - installment_current: int | None
  - installment_total: int | None
"""

import csv
import io
import re
from datetime import date, datetime
from typing import List, Dict, Any


# ------------------------------------------------------------------ #
#  Helpers                                                             #
# ------------------------------------------------------------------ #

_INSTALLMENT_RE = re.compile(
    r'(\d{1,3})[/\\](\d{1,3})',  # ex: 3/10 ou 3\10
)


def _extract_installment(text: str):
    """Retorna (current, total) ou (None, None)."""
    if not text:
        return None, None
    m = _INSTALLMENT_RE.search(text)
    if m:
        return int(m.group(1)), int(m.group(2))
    return None, None


def _parse_amount(raw: str) -> float:
    """
    Converte string de valor para float.
    Aceita: '1.234,56' (BR), '1,234.56' (US), '-1234.56'.
    """
    s = raw.strip().replace(' ', '')
    # Remove símbolo de moeda
    s = re.sub(r'[R$€£¥]', '', s)

    # Detecta formato BR: ponto como separador de milhar, vírgula decimal
    if re.search(r'\d\.\d{3},', s):
        s = s.replace('.', '').replace(',', '.')
    else:
        # Formato US ou sem separador de milhar
        s = s.replace(',', '')

    return float(s)


def _parse_date(raw: str) -> date:
    """Tenta múltiplos formatos de data."""
    raw = raw.strip()
    for fmt in ('%d/%m/%Y', '%Y-%m-%d', '%m/%d/%Y',
                '%d-%m-%Y', '%Y%m%d', '%d.%m.%Y'):
        try:
            return datetime.strptime(raw, fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Formato de data não reconhecido: '{raw}'")


# ------------------------------------------------------------------ #
#  Parser CSV                                                          #
# ------------------------------------------------------------------ #

# Mapeamento de possíveis nomes de coluna para campos internos
_CSV_FIELD_MAP = {
    'date': ['data', 'date', 'data_lancamento', 'dt', 'data lançamento'],
    'description': [
        'descricao', 'descrição', 'description', 'historico',
        'histórico', 'estabelecimento', 'lançamento', 'lancamento',
    ],
    'amount': [
        'valor', 'amount', 'value', 'debito', 'débito',
        'credito', 'crédito', 'total',
    ],
}


def _detect_csv_columns(header: List[str]) -> Dict[str, int]:
    """Retorna índices {date, description, amount} no cabeçalho."""
    header_lower = [h.lower().strip() for h in header]
    mapping: Dict[str, int] = {}

    for field, candidates in _CSV_FIELD_MAP.items():
        for candidate in candidates:
            if candidate in header_lower:
                mapping[field] = header_lower.index(candidate)
                break

    missing = [f for f in ('date', 'description', 'amount')
               if f not in mapping]
    if missing:
        raise ValueError(
            f"Colunas não encontradas no CSV: {missing}. "
            f"Cabeçalho detectado: {header}"
        )
    return mapping


def parse_csv(content: bytes) -> List[Dict[str, Any]]:
    """
    Parse de CSV de fatura.

    Tenta detectar automaticamente delimitador e codificação.
    """
    for encoding in ('utf-8-sig', 'latin-1', 'utf-8'):
        try:
            text = content.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    else:
        raise ValueError("Não foi possível decodificar o arquivo CSV.")

    # Detecta delimitador
    sample = text[:4096]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=',;\t|')
    except csv.Error:
        dialect = csv.excel  # fallback

    reader = csv.reader(io.StringIO(text), dialect)
    rows = list(reader)

    if len(rows) < 2:
        raise ValueError("CSV vazio ou sem linhas de dados.")

    # Encontra a linha de cabeçalho (primeira linha não vazia)
    header_idx = 0
    for i, row in enumerate(rows):
        if any(cell.strip() for cell in row):
            header_idx = i
            break

    header = rows[header_idx]
    col = _detect_csv_columns(header)

    items = []
    for row in rows[header_idx + 1:]:
        if not any(cell.strip() for cell in row):
            continue  # Linha em branco
        if len(row) <= max(col.values()):
            continue  # Linha incompleta

        raw_desc = row[col['description']].strip()
        raw_date_str = row[col['date']].strip()
        raw_amount_str = row[col['amount']].strip()

        if not raw_amount_str or not raw_date_str:
            continue

        try:
            amount = _parse_amount(raw_amount_str)
        except (ValueError, TypeError):
            continue

        try:
            parsed_date = _parse_date(raw_date_str)
        except ValueError:
            continue

        curr, total = _extract_installment(raw_desc)

        items.append({
            'raw_description': raw_desc,
            'raw_amount': amount,
            'raw_date': parsed_date,
            'installment_current': curr,
            'installment_total': total,
        })

    return items


# ------------------------------------------------------------------ #
#  Parser OFX                                                          #
# ------------------------------------------------------------------ #

def parse_ofx(content: bytes) -> List[Dict[str, Any]]:
    """
    Parse básico de OFX/QFX (formato SGML sem XML declaration).

    Extrai STMTTRN blocks: DTPOSTED, TRNAMT, MEMO/NAME.
    """
    for encoding in ('utf-8-sig', 'latin-1', 'utf-8'):
        try:
            text = content.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    else:
        raise ValueError("Não foi possível decodificar o arquivo OFX.")

    # Normaliza quebras de linha e trata OFX como SGML simples
    text = text.replace('\r\n', '\n').replace('\r', '\n')

    items = []

    # Encontra todos os blocos <STMTTRN>...</STMTTRN>
    block_re = re.compile(
        r'<STMTTRN>(.*?)</STMTTRN>',
        re.DOTALL | re.IGNORECASE,
    )

    def _tag(block: str, tag: str) -> str:
        m = re.search(
            rf'<{tag}>\s*([^\n<]+)', block, re.IGNORECASE
        )
        return m.group(1).strip() if m else ''

    for match in block_re.finditer(text):
        block = match.group(1)

        raw_date_str = _tag(block, 'DTPOSTED')
        raw_amount_str = _tag(block, 'TRNAMT')
        memo = _tag(block, 'MEMO') or _tag(block, 'NAME')

        if not raw_date_str or not raw_amount_str:
            continue

        # OFX usa YYYYMMDD[HHMMSS[.xxx][GMT offset]]
        raw_date_str = raw_date_str[:8]
        try:
            parsed_date = _parse_date(raw_date_str)
        except ValueError:
            continue

        try:
            amount = float(raw_amount_str.replace(',', '.'))
        except ValueError:
            continue

        curr, total = _extract_installment(memo)

        items.append({
            'raw_description': memo,
            'raw_amount': amount,
            'raw_date': parsed_date,
            'installment_current': curr,
            'installment_total': total,
        })

    if not items:
        raise ValueError(
            "Nenhuma transação encontrada no arquivo OFX. "
            "Verifique se o arquivo está no formato correto."
        )

    return items


# ------------------------------------------------------------------ #
#  Entry point                                                         #
# ------------------------------------------------------------------ #

def parse_uploaded_file(
    content: bytes,
    file_type: str,
) -> List[Dict[str, Any]]:
    """
    Despacha para o parser correto com base na extensão.

    Args:
        content: Bytes do arquivo enviado.
        file_type: 'csv' ou 'ofx'.

    Returns:
        Lista de dicts com dados brutos de cada transação.
    """
    ft = file_type.lower().strip('.')
    if ft == 'csv':
        return parse_csv(content)
    if ft in ('ofx', 'qfx'):
        return parse_ofx(content)
    raise ValueError(
        f"Tipo de arquivo não suportado: '{file_type}'. Use CSV ou OFX."
    )
