# Sistema de Transferências entre Contas

## Visão Geral

O sistema de transferências permite que o usuário mova valores entre suas próprias contas de forma automática, registrando corretamente nos lançamentos.

## Como Funciona

### Backend

#### Modelo de Dados
- **Transaction Model** ([models.py:46](../backend/app/models.py#L46))
  - `transfer_id`: UUID único que vincula as duas transações da transferência
  - `transfer_account_id`: ID da conta relacionada (destino para débito, origem para crédito)
  - `transaction_type`: Novo tipo "transfer" além de "income" e "expense"

#### API Endpoints
- **POST /transfers/** - Criar transferência
- **GET /transfers/{transfer_id}/transactions** - Obter transações de uma transferência
- **DELETE /transfers/{transfer_id}** - Deletar transferência (remove ambos lançamentos)

#### Lógica de Negócio ([crud.py:515](../backend/app/crud.py#L515))

Quando uma transferência é criada:

1. **Validações**:
   - Ambas contas existem e pertencem ao usuário
   - Contas são diferentes
   - Valor é positivo

2. **Criação de Lançamentos**:
   - **Transação de Débito** (conta origem):
     - `amount`: Valor negativo
     - `transaction_type`: "transfer"
     - `account_id`: Conta de origem
     - `transfer_account_id`: Conta de destino
     - `transfer_id`: UUID compartilhado

   - **Transação de Crédito** (conta destino):
     - `amount`: Valor positivo
     - `transaction_type`: "transfer"
     - `account_id`: Conta de destino
     - `transfer_account_id`: Conta de origem
     - `transfer_id`: UUID compartilhado (mesmo da transação de débito)

3. **Atualização de Saldos**:
   - Conta origem: `balance -= valor`
   - Conta destino: `balance += valor`

4. **Categoria Padrão**:
   - Se não especificada, cria/usa categoria "Transferência" automaticamente

### Frontend

#### Componentes
- **TransferForm** ([TransferForm.jsx](../frontend/src/components/TransferForm.jsx))
  - Formulário de criação de transferência
  - Preview com saldos antes/depois
  - Validações de saldo insuficiente
  - Seleção de contas com saldos atuais

- **Transfers Page** ([Transfers.jsx](../frontend/src/pages/Transfers.jsx))
  - Interface principal de transferências
  - Lista de contas ativas
  - Histórico de transferências recentes
  - Agrupamento de transações por transfer_id

#### API Service ([api.jsx:377](../frontend/src/services/api.jsx#L377))
```javascript
transfersAPI.create({
  from_account_id: 1,
  to_account_id: 2,
  amount: 100.00,
  date: "2024-02-07",
  description: "Transferência entre contas"
})
```

## Exemplo de Uso

### Cenário
- **Conta A** (Corrente): R$ 1.000,00
- **Conta B** (Poupança): R$ 500,00
- **Transferência**: R$ 200,00 de A para B

### Resultado
1. **Lançamentos Criados**:
   ```
   Transaction 1:
   - ID: 123
   - account_id: A
   - transfer_account_id: B
   - amount: -200.00
   - type: transfer
   - transfer_id: "uuid-123-456"

   Transaction 2:
   - ID: 124
   - account_id: B
   - transfer_account_id: A
   - amount: +200.00
   - type: transfer
   - transfer_id: "uuid-123-456"
   ```

2. **Saldos Atualizados**:
   - Conta A: R$ 800,00 (1.000 - 200)
   - Conta B: R$ 700,00 (500 + 200)

## Vantagens

1. **Integridade**: Sempre cria dois lançamentos vinculados
2. **Rastreabilidade**: `transfer_id` permite localizar ambas transações
3. **Saldos Corretos**: Atualização automática dos saldos
4. **Reversível**: Deletar transferência reverte ambos lançamentos e saldos
5. **Auditável**: Mantém histórico completo de movimentações

## Migrações

As migrações adicionam os novos campos automaticamente:
- `ALTER TABLE transactions ADD COLUMN transfer_id VARCHAR`
- `ALTER TABLE transactions ADD COLUMN transfer_account_id INTEGER`

Executadas automaticamente no startup do backend ([main.py:32](../backend/app/main.py#L32))
