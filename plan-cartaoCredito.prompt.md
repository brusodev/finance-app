## Plan: Cartao de Credito

Implementar um fluxo de dividas do cartao que suporte lancamentos manuais e importacao de PDF/CSV/OFX, com revisao edicao antes de salvar. A recomendacao e tratar o cartao como uma conta `credit_card` com lancamentos detalhados, e adicionar uma camada de fatura/importacao para agrupar os itens do mes corrente e permitir edicao de classificacao e descricao antes de persistir.

**Steps**
1. Definir o modelo de dominio para cartao e fatura, aproveitando a base existente de `Account` e `Transaction` em `backend/app/models.py` e o padrao de lista/edicao em `backend/app/routes/transactions.py` e `frontend/src/pages/NewTransaction.jsx`.
2. Criar novas entidades backend para importar e revisar itens: lote de importacao, item importado, fatura/fechamento mensal e metadados de revisao. Isso deve cobrir estado do item, origem do arquivo, categoria manual, descricao editada, data de lancamento, valor, parcelas e vinculo com conta/cartao.
3. Expor rotas backend para: criar lancamento manual de divida, importar arquivo, listar itens importados por lote/fatura, editar itens importados, confirmar importacao e converter itens em transactions oficiais. Reaproveitar a logica de mutacao de saldo que ja existe em `backend/app/crud.py`.
4. Implementar parser de arquivos em backend para PDF, CSV e OFX. Para PDF, definir um extrator tolerante a diferentes formatos e manter fallback para revisao manual quando a leitura automatica falhar. Para CSV/OFX, normalizar colunas e datas com validacao forte.
5. Construir uma tela frontend de importacao e revisao, preferencialmente em duas etapas: upload do arquivo e grade editavel dos itens extraidos. Reaproveitar padroes de formularios/listas de `frontend/src/components/TransactionForm.jsx`, `frontend/src/pages/Transactions.jsx` e `frontend/src/pages/InvestmentTransactions.jsx`.
6. Adicionar suporte a fatura corrente e meses anteriores na interface, permitindo filtrar por mes de fechamento, editar classificacao/descricao antes do salvamento e revisar totais por cartao, por fatura e por vencimento.
7. Atualizar `frontend/src/services/api.jsx` com endpoints de importacao/revisao e invalidacao de cache apos confirmacao, seguindo o padrao ja usado para transactions.
8. Cobrir o novo fluxo com testes backend e frontend: importacao valida, edicao de itens importados, confirmacao, calculo do mes corrente e agregacao por fatura, alem de casos de erro de arquivo invalido e itens sem categoria.

**Relevant files**
- `backend/app/models.py` - novos modelos para lote/importacao/fatura e possivel relacao com `Transaction`/`Account`.
- `backend/app/schemas.py` - schemas para upload, item importado, revisao e confirmacao.
- `backend/app/crud.py` - parser/normalizacao e conversao dos itens importados em transactions oficiais.
- `backend/app/routes/transactions.py` - ou novo `backend/app/routes/credit_cards.py` para rotas do dominio.
- `backend/app/main.py` - registrar novas rotas e migrações.
- `frontend/src/pages/NewTransaction.jsx` - reaproveitar edicao manual para itens importados.
- `frontend/src/pages/Transactions.jsx` - referencia de listagem, filtro e edicao por mes.
- `frontend/src/pages/Report.jsx` - referencia de agregacao mensal e selecao de mes.
- `frontend/src/services/api.jsx` - novos metodos para upload, listagem e confirmacao de importacoes.
- `README.md` - documentar formatos aceitos, fluxo de revisao e comportamento da fatura.

**Verification**
1. Validar que um upload de PDF/CSV/OFX gera um lote com itens revisaveis e que cada item pode ser editado antes de confirmar.
2. Confirmar que ao finalizar a importacao os itens viram transactions persistidas e entram no mes corrente/fatura correta.
3. Rodar testes unitarios e de integracao para importacao, edicao, confirmacao e agregacao mensal.
4. Verificar manualmente no Docker que a tela de revisao funciona com arquivos pequenos, com itens incompletos e com datas de meses anteriores.

**Decisions**
- Usar o cartao como conta `credit_card` e manter o ledger em `Transaction`.
- Tratar o arquivo importado como staging, nao como dado final, ate o usuario revisar e confirmar.
- Suportar PDF, CSV e OFX desde o inicio, mas aceitar fallback manual quando o PDF nao puder ser extraido com confianca.
- Permitir edicao de classificacao e descricao dos itens importados antes de salvar.

**Further Considerations**
1. Se o PDF vier de varios bancos/emissores, vale definir um parser por layout ou com adaptadores por marca?
2. Você quer que parcelas futuras sejam geradas automaticamente ou apenas registradas como texto no item importado?
3. A fatura deve fechar por data fixa do mes ou por limite customizavel por cartao?