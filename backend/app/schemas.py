from pydantic import BaseModel, validator, field_validator, model_validator, ConfigDict
from typing import Optional, List
from datetime import date, datetime


class UserCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    full_name: Optional[str] = None


class User(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    avatar: Optional[str] = None
    cpf: Optional[str] = None
    phone: Optional[str] = None
    birth_date: Optional[date] = None
    address: Optional[str] = None
    currency: Optional[str] = "BRL"

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    avatar: Optional[str] = None
    cpf: Optional[str] = None
    phone: Optional[str] = None
    birth_date: Optional[date] = None
    address: Optional[str] = None
    currency: Optional[str] = None

    @validator('avatar')
    def validate_avatar_size(cls, v):
        # base64 de 1 MB = ~1.37 MB em string; limite de 1.5 MB na string
        MAX_AVATAR_CHARS = 1_500_000
        if v is not None and len(v) > MAX_AVATAR_CHARS:
            raise ValueError('Avatar muito grande. Tamanho máximo: 1 MB.')
        return v

    class Config:
        validate_assignment = True


class UserOnly(BaseModel):
    """Resposta do login — dados do usuário (token vai no cookie httpOnly)."""
    id: int
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    avatar: Optional[str] = None
    currency: Optional[str] = "BRL"

    class Config:
        from_attributes = True


class Token(BaseModel):
    token: str
    token_type: str = "bearer"
    user: User


VALID_EXPENSE_KINDS = {"fixed", "variable"}


class CategoryCreate(BaseModel):
    name: str
    icon: Optional[str] = None
    expense_kind: Optional[str] = None

    @field_validator("expense_kind")
    @classmethod
    def validate_expense_kind(cls, v):
        if v is not None and v not in VALID_EXPENSE_KINDS:
            raise ValueError(
                "expense_kind deve ser 'fixed' ou 'variable'"
            )
        return v


class Category(BaseModel):
    id: int
    name: str
    icon: Optional[str] = None
    expense_kind: Optional[str] = None

    class Config:
        from_attributes = True


VALID_ACCOUNT_TYPES = {"checking", "savings", "credit_card", "investment"}


class AccountCreate(BaseModel):
    name: str
    account_type: str
    initial_balance: float = 0.0
    currency: str = "BRL"

    @validator('account_type')
    def validate_account_type(cls, v):
        if v not in VALID_ACCOUNT_TYPES:
            raise ValueError(
                'Tipo de conta inválido. Deve ser um de: '
                f'{", ".join(sorted(VALID_ACCOUNT_TYPES))}'
            )
        return v


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    account_type: Optional[str] = None
    is_active: Optional[bool] = None


class Account(BaseModel):
    id: int
    name: str
    account_type: str
    initial_balance: float
    balance: float
    currency: str
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AccountBalanceAudit(BaseModel):
    account_id: int
    account_name: str
    initial_balance: float
    current_balance: float
    calculated_balance: float
    total_transactions: int
    is_consistent: bool
    difference: float


class TransactionCreate(BaseModel):
    amount: float
    date: date
    description: Optional[str] = None
    transaction_type: str
    category_id: int
    account_id: Optional[int] = None
    transfer_id: Optional[str] = None
    transfer_account_id: Optional[int] = None


class UserBasic(BaseModel):
    """User schema sem avatar para evitar payload gigante"""
    id: int
    username: str
    full_name: Optional[str] = None

    class Config:
        from_attributes = True


class Transaction(BaseModel):
    id: int
    amount: float
    date: date
    description: Optional[str]
    raw_description: Optional[str] = None
    transaction_type: str
    category: Optional[Category] = None
    account: Optional[Account] = None
    user: UserBasic  # Usar UserBasic em vez de User completo
    transfer_id: Optional[str] = None
    transfer_account_id: Optional[int] = None

    class Config:
        from_attributes = True


class TransferCreate(BaseModel):
    """Schema para criar uma transferência entre contas"""
    from_account_id: int
    to_account_id: int
    amount: float
    date: date
    description: Optional[str] = "Transferência entre contas"
    category_id: Optional[int] = None  # Categoria opcional para transferências


class TransferResponse(BaseModel):
    """Response da transferência com os dois lançamentos criados"""
    transfer_id: str
    from_transaction: Transaction
    to_transaction: Transaction
    amount: float
    date: date
    description: str


# ===== SCHEMAS DE INVESTIMENTOS =====

class InvestmentAssetCreate(BaseModel):
    name: str
    type: str  # TESOURO, CDB, ETF, FII, ACAO, CRIPTO, OUTRO
    broker: Optional[str] = None
    currency: str = "BRL"

    @validator('type')
    def validate_asset_type(cls, v):
        valid_types = ['TESOURO', 'CDB', 'ETF', 'FII', 'ACAO', 'CRIPTO', 'OUTRO']
        if v not in valid_types:
            raise ValueError(
                'Tipo de ativo inválido. Deve ser um de: '
                f'{", ".join(valid_types)}'
            )
        return v


class InvestmentAssetUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    broker: Optional[str] = None
    currency: Optional[str] = None


class InvestmentAsset(BaseModel):
    id: int
    name: str
    type: str
    broker: Optional[str]
    currency: str
    created_at: datetime

    class Config:
        from_attributes = True


class InvestmentTransactionCreate(BaseModel):
    asset_id: int
    date: date
    type: str  # APORTE, RESGATE, RENDIMENTO, TAXA
    amount_brl: float
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    notes: Optional[str] = None
    account_id: Optional[int] = None  # Conta bancária para débito/crédito automático

    @validator('type')
    def validate_transaction_type(cls, v):
        valid_types = ['APORTE', 'RESGATE', 'RENDIMENTO', 'TAXA']
        if v not in valid_types:
            raise ValueError(
                'Tipo de transação inválido. Deve ser um de: '
                f'{", ".join(valid_types)}'
            )
        return v

    @validator('amount_brl')
    def validate_amount(cls, v, values):
        transaction_type = values.get('type')
        if transaction_type in ['APORTE', 'RENDIMENTO']:
            if v <= 0:
                raise ValueError(
                    'Valor deve ser positivo para APORTE ou RENDIMENTO'
                )
        elif transaction_type in ['RESGATE', 'TAXA']:
            if v >= 0:
                raise ValueError(
                    'Valor deve ser negativo para RESGATE ou TAXA'
                )
        return v


class InvestmentTransactionUpdate(BaseModel):
    date: Optional[date] = None
    type: Optional[str] = None
    amount_brl: Optional[float] = None
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    notes: Optional[str] = None


class InvestmentTransaction(BaseModel):
    id: int
    asset_id: int
    date: date
    type: str
    amount_brl: float
    quantity: Optional[float]
    unit_price: Optional[float]
    notes: Optional[str]
    created_at: datetime
    asset: Optional[InvestmentAsset] = None
    account_id: Optional[int] = None
    account_transaction_id: Optional[int] = None

    class Config:
        from_attributes = True


class GoalPlanStepCreate(BaseModel):
    start_month: int
    end_month: int
    monthly_contribution_brl: float

    @validator('start_month', 'end_month')
    def validate_month(cls, v):
        if v < 1:
            raise ValueError('Mês deve ser maior que 0')
        return v

    @validator('end_month')
    def validate_end_after_start(cls, v, values):
        if 'start_month' in values and v < values['start_month']:
            raise ValueError(
                'Mês final deve ser maior ou igual ao mês inicial'
            )
        return v


class GoalPlanStep(BaseModel):
    id: int
    start_month: int
    end_month: int
    monthly_contribution_brl: float

    class Config:
        from_attributes = True


class GoalPlanCreate(BaseModel):
    goal_name: str
    target_value_brl: float
    start_date: date
    months: int = 120
    default_monthly_rate: float = 0.009
    plan_mode: str = "ESCADA"
    steps: Optional[List[GoalPlanStepCreate]] = None

    @validator('target_value_brl')
    def validate_target(cls, v):
        if v <= 0:
            raise ValueError('Meta deve ser maior que 0')
        return v

    @validator('months')
    def validate_months(cls, v):
        if v <= 0:
            raise ValueError('Prazo deve ser maior que 0')
        return v

    @validator('plan_mode')
    def validate_plan_mode(cls, v):
        valid_modes = ['ESCADA', 'FIXO', 'PERSONALIZADO']
        if v not in valid_modes:
            raise ValueError(
                'Modo de plano inválido. Deve ser um de: '
                f'{", ".join(valid_modes)}'
            )
        return v


class GoalPlanUpdate(BaseModel):
    goal_name: Optional[str] = None
    target_value_brl: Optional[float] = None
    months: Optional[int] = None
    default_monthly_rate: Optional[float] = None
    plan_mode: Optional[str] = None
    steps: Optional[List[GoalPlanStepCreate]] = None


class GoalPlan(BaseModel):
    id: int
    goal_name: str
    target_value_brl: float
    start_date: date
    months: int
    default_monthly_rate: float
    plan_mode: str
    created_at: datetime
    updated_at: datetime
    steps: List[GoalPlanStep] = []

    class Config:
        from_attributes = True


class SimulationRequest(BaseModel):
    rate_monthly: float
    months: int
    steps: Optional[List[GoalPlanStepCreate]] = None

    @validator('rate_monthly')
    def validate_rate(cls, v):
        if v < 0:
            raise ValueError('Taxa mensal não pode ser negativa')
        return v

    @validator('months')
    def validate_months(cls, v):
        if v <= 0:
            raise ValueError('Prazo deve ser maior que 0')
        return v


class SimulationMonthData(BaseModel):
    month: int
    contribution: float
    interest: float
    balance: float


class SimulationResponse(BaseModel):
    series: List[SimulationMonthData]
    final_value: float
    contributed_total: float
    interest_total: float
    monthly_rate: float
    total_months: int


class InvestmentSummary(BaseModel):
    total_invested: float
    total_contributions_month: float
    by_asset: List[dict]
    last_12_months: List[dict]


class GoalProgress(BaseModel):
    current_value: float
    target_value: float
    progress_percentage: float
    months_elapsed: int
    months_remaining: int
    projected_final_value: float
    on_track: bool


# ============================================================
# CARTÃO DE CRÉDITO
# ============================================================

class CreditCardConfigCreate(BaseModel):
    account_id: int
    closing_day: int
    due_day: int
    bank_name: Optional[str] = None
    credit_limit: Optional[float] = None

    @validator('closing_day', 'due_day')
    def validate_day(cls, v):
        if not 1 <= v <= 31:
            raise ValueError('Dia deve estar entre 1 e 31')
        return v


class CreditCardConfigUpdate(BaseModel):
    closing_day: Optional[int] = None
    due_day: Optional[int] = None
    bank_name: Optional[str] = None
    credit_limit: Optional[float] = None

    @validator('closing_day', 'due_day')
    def validate_day(cls, v):
        if v is not None and not 1 <= v <= 31:
            raise ValueError('Dia deve estar entre 1 e 31')
        return v


class CreditCardConfig(BaseModel):
    id: int
    account_id: int
    closing_day: int
    due_day: int
    bank_name: Optional[str]
    credit_limit: Optional[float]

    class Config:
        from_attributes = True


class CreditCardStatementPaymentCreate(BaseModel):
    from_account_id: int
    amount: float
    date: date
    description: Optional[str] = None


class CreditCardStatementPayment(BaseModel):
    id: int
    statement_id: int
    from_account_id: int
    transfer_id: str
    date: date
    amount: float
    description: Optional[str] = None
    user_id: int
    created_at: datetime
    from_account: Optional[Account] = None

    class Config:
        from_attributes = True


class CreditCardStatement(BaseModel):
    id: int
    batch_id: int
    account_id: int
    user_id: int
    reference_month: date
    due_date: Optional[date] = None
    total_amount: float
    paid_amount: float
    status: str
    created_at: datetime
    updated_at: datetime
    payments: List[CreditCardStatementPayment] = []

    class Config:
        from_attributes = True


class ImportItemCreate(BaseModel):
    """Usado para lançamento manual de um item na fatura."""
    description: str
    amount: float
    date: date
    category_id: Optional[int] = None
    transaction_type: Optional[str] = None  # 'income' | 'expense'
    installment_current: Optional[int] = None
    installment_total: Optional[int] = None


class ImportItemUpdate(BaseModel):
    """Edição de um item importado antes de confirmar."""
    model_config = ConfigDict(coerce_numbers_to_str=False)

    description: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None  # recebe string YYYY-MM-DD, convertida no crud
    category_id: Optional[int] = None
    transaction_type: Optional[str] = None  # 'income' | 'expense'
    installment_current: Optional[int] = None
    installment_total: Optional[int] = None
    status: Optional[str] = None  # 'pending' | 'ignored'

    @field_validator('date', mode='before')
    @classmethod
    def normalize_date(cls, v):
        if not v or v in ('', 'undefined', 'null'):
            return None
        return v


class ImportItem(BaseModel):
    id: int
    batch_id: int
    raw_description: Optional[str]
    raw_amount: float
    raw_date: date
    description: Optional[str]
    amount: float
    date: date
    category_id: Optional[int]
    category: Optional[Category] = None
    transaction_type: Optional[str] = None
    installment_current: Optional[int]
    installment_total: Optional[int]
    status: str
    transaction_id: Optional[int]

    class Config:
        from_attributes = True


class ImportBatchCreate(BaseModel):
    account_id: int
    reference_month: date   # Qualquer dia do mês (normalizado para dia 1)


class ImportBatch(BaseModel):
    id: int
    account_id: int
    user_id: int
    reference_month: date
    file_name: Optional[str]
    file_type: Optional[str]
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    confirmed_at: Optional[datetime]
    statement: Optional[CreditCardStatement] = None
    items: List[ImportItem] = []

    class Config:
        from_attributes = True


class ImportBatchStatementInfo(BaseModel):
    """Informações resumidas do statement vinculado ao batch."""
    id: int
    total_amount: float
    paid_amount: float
    status: str
    due_date: Optional[date] = None

    class Config:
        from_attributes = True


class ImportBatchSummary(BaseModel):
    """Versão sem itens para listagem."""
    id: int
    account_id: int
    reference_month: date
    file_name: Optional[str]
    file_type: Optional[str]
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    item_count: int
    total_amount: float
    statement: Optional[ImportBatchStatementInfo] = None

    class Config:
        from_attributes = True


class ConfirmImportResponse(BaseModel):
    batch_id: int
    confirmed_count: int
    ignored_count: int
    transactions_created: List[int]  # IDs das transactions criadas


class ClassifyResult(BaseModel):
    """Resultado da classificação (cache + IA) de um lote."""
    classified: int       # total de itens que receberam categoria
    classified_by_cache: int = 0  # resolvidos pelo histórico aprendido
    unmatched: int        # itens sem sugestão de categoria
    ai_skipped: bool = False  # IA não respondeu (erro/timeout do Groq)
    items: List[ImportItem] = []


class ClassifyJobCreated(BaseModel):
    """Resposta ao iniciar a classificação assíncrona."""
    job_id: str
    status: str           # pending | running | done | error


class ClassifyJobStatus(BaseModel):
    """Andamento de um job de classificação (consultado por polling)."""
    job_id: str
    status: str           # pending | running | done | error
    processed: int = 0
    total: int = 0
    error: Optional[str] = None
    result: Optional[ClassifyResult] = None
