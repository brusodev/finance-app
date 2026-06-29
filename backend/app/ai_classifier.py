"""
Classificação de lançamentos importados via Groq (LLM).

O modelo interpreta cada descrição, escolhe uma categoria da lista do
usuário (ou nenhuma) e decide o tipo (income/expense), usando exemplos
do histórico do próprio usuário como referência de padrão pessoal.

Sem fallback hardcoded: se GROQ_API_KEY não estiver definida, levanta
MissingGroqKey — a rota traduz isso em 503.
"""

import json
import os
from typing import Any, Dict, List, Optional

import httpx

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = "llama-3.3-70b-versatile"
TIMEOUT_SECONDS = 30.0
# Itens por chamada à IA — mantém cada request bem abaixo do
# rate limit de tokens/minuto (TPM) do tier free do Groq.
CHUNK_SIZE = 25

VALID_TYPES = ("income", "expense")


class MissingGroqKey(RuntimeError):
    """GROQ_API_KEY não configurada."""


def _system_prompt() -> str:
    return (
        "Você é um classificador de transações financeiras. "
        "Receberá: a lista de categorias disponíveis do usuário, "
        "exemplos do histórico dele e uma lista de lançamentos a "
        "classificar.\n"
        "Cada lançamento tem dois textos:\n"
        "- 'raw': a descrição ÍNTEGRA e bruta do banco (memo completo "
        "do extrato), que contém o contexto real do gasto.\n"
        "- 'description': um nome amigável já existente (pode estar "
        "vago ou enganoso).\n"
        "SEMPRE priorize o 'raw' para entender o que foi a transação. "
        "Ex.: 'Agua CTN' (raw) é uma água comprada no CTN (Centro de "
        "Tradições Nordestinas) — lazer/bar, NÃO conta de água da casa. "
        "Não se deixe enganar por palavras isoladas; leia o contexto "
        "inteiro do raw.\n"
        "Para CADA lançamento, decida:\n"
        "- category_id: o id de UMA categoria da lista, ou null se "
        "nenhuma se encaixar bem.\n"
        "- transaction_type: 'income' ou 'expense'. Use o sinal do "
        "valor como dica (negativo=despesa, positivo=receita), mas "
        "priorize o sentido do raw (ex.: estorno/reembolso é receita "
        "mesmo aparecendo como despesa).\n"
        "- description: um nome amigável CURTO e limpo derivado do raw "
        "(ex.: 'Pix - Adriano (Lotofácil)', 'Uber', 'Água - CTN'). "
        "Remova códigos, agências, contas e ruído; mantenha o essencial "
        "para um humano reconhecer o gasto.\n"
        "- confidence: número de 0 a 1.\n"
        "Use os exemplos do histórico para seguir o padrão pessoal do "
        "usuário. Descrições do mesmo estabelecimento variam muito "
        "('UBER *TRIP', 'Uber viagem'): trate-as como o mesmo merchant.\n"
        "Responda APENAS com um objeto JSON no formato: "
        '{"results": [{"id": <int>, "category_id": <int|null>, '
        '"transaction_type": "income"|"expense", '
        '"description": <string>, "confidence": <float>}]} '
        "incluindo todos os ids recebidos."
    )


def _user_prompt(
    items: List[Dict[str, Any]],
    categories: List[Dict[str, Any]],
    examples: List[Dict[str, Any]],
) -> str:
    cats = [{"id": c["id"], "name": c["name"]} for c in categories]
    ex = [
        {
            "raw": e.get("raw_description") or e.get("description"),
            "description": e["description"],
            "category": e.get("category_name"),
            "type": e.get("transaction_type"),
        }
        for e in examples
    ]
    its = [
        {
            "id": i["id"],
            "raw": i.get("raw_description") or i.get("description") or "",
            "description": i.get("description") or "",
            "amount": i.get("amount"),
        }
        for i in items
    ]
    return (
        "Categorias disponíveis:\n"
        + json.dumps(cats, ensure_ascii=False)
        + "\n\nExemplos do histórico do usuário:\n"
        + json.dumps(ex, ensure_ascii=False)
        + "\n\nLançamentos a classificar:\n"
        + json.dumps(its, ensure_ascii=False)
    )


def _normalize_type(value: Any, amount: Optional[float]) -> str:
    if isinstance(value, str) and value.lower() in VALID_TYPES:
        return value.lower()
    # Fallback pelo sinal do valor
    if amount is not None and amount > 0:
        return "income"
    return "expense"


def classify_items(
    items: List[Dict[str, Any]],
    categories: List[Dict[str, Any]],
    examples: List[Dict[str, Any]],
) -> Dict[int, Dict[str, Any]]:
    """
    Classifica os itens via Groq, dividindo em chunks para não estourar
    o rate limit de tokens/minuto.

    Retorna { item_id: {category_id, transaction_type, confidence} }.
    Levanta MissingGroqKey se a key não estiver setada. Chunks que
    falharem são pulados (seus itens ficam sem sugestão), sem derrubar
    os demais.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise MissingGroqKey(
            "GROQ_API_KEY não definida. Configure a variável de ambiente."
        )

    if not items:
        return {}

    out: Dict[int, Dict[str, Any]] = {}
    for start in range(0, len(items), CHUNK_SIZE):
        chunk = items[start:start + CHUNK_SIZE]
        out.update(
            _classify_chunk(api_key, chunk, categories, examples)
        )
    return out


def _classify_chunk(
    api_key: str,
    items: List[Dict[str, Any]],
    categories: List[Dict[str, Any]],
    examples: List[Dict[str, Any]],
) -> Dict[int, Dict[str, Any]]:
    """Uma única chamada ao Groq para um grupo de itens."""
    model = os.getenv("GROQ_MODEL") or DEFAULT_MODEL
    valid_category_ids = {c["id"] for c in categories}
    amount_by_id = {i["id"]: i.get("amount") for i in items}

    payload = {
        "model": model,
        "temperature": 0,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": _system_prompt()},
            {
                "role": "user",
                "content": _user_prompt(items, categories, examples),
            },
        ],
    }

    try:
        resp = httpx.post(
            GROQ_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=TIMEOUT_SECONDS,
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]
        parsed = json.loads(content)
    except (httpx.HTTPError, KeyError, ValueError, json.JSONDecodeError):
        return {}

    results = parsed.get("results")
    if not isinstance(results, list):
        return {}

    out: Dict[int, Dict[str, Any]] = {}
    for r in results:
        try:
            item_id = int(r["id"])
        except (KeyError, TypeError, ValueError):
            continue
        if item_id not in amount_by_id:
            continue

        raw_cat = r.get("category_id")
        category_id = None
        if raw_cat is not None:
            try:
                cand = int(raw_cat)
            except (TypeError, ValueError):
                cand = None
            # Validação defensiva: só aceita id da lista do usuário
            if cand in valid_category_ids:
                category_id = cand

        confidence = r.get("confidence")
        try:
            confidence = float(confidence)
        except (TypeError, ValueError):
            confidence = None

        clean_desc = r.get("description")
        if isinstance(clean_desc, str):
            clean_desc = clean_desc.strip() or None
        else:
            clean_desc = None

        out[item_id] = {
            "category_id": category_id,
            "transaction_type": _normalize_type(
                r.get("transaction_type"), amount_by_id[item_id]
            ),
            "description": clean_desc,
            "confidence": confidence,
        }

    return out
