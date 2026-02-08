from pydantic import BaseModel, validator
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

    class Config:
        # Permitir valores None explícitos
        validate_assignment = True


class Token(BaseModel):
    token: str
    token_type: str = "bearer"
    user: User


class CategoryCreate(BaseModel):
    name: str
    icon: Optional[str] = None


class Category(BaseModel):
    id: int
    name: str
    icon: Optional[str] = None

    class Config:
        from_attributes = True


class AccountCreate(BaseModel):
    name: str
    account_type: str
    initial_balance: float = 0.0
    currency: str = "BRL"


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
    transaction_type: str
    category: Category
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
            raise ValueError(f'Tipo de ativo inválido. Deve ser um de: {", ".join(valid_types)}')
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

    @validator('type')
    def validate_transaction_type(cls, v):
        valid_types = ['APORTE', 'RESGATE', 'RENDIMENTO', 'TAXA']
        if v not in valid_types:
            raise ValueError(f'Tipo de transação inválido. Deve ser um de: {", ".join(valid_types)}')
        return v

    @validator('amount_brl')
    def validate_amount(cls, v, values):
        transaction_type = values.get('type')
        if transaction_type in ['APORTE', 'RENDIMENTO']:
            if v <= 0:
                raise ValueError('Valor deve ser positivo para APORTE ou RENDIMENTO')
        elif transaction_type in ['RESGATE', 'TAXA']:
            if v >= 0:
                raise ValueError('Valor deve ser negativo para RESGATE ou TAXA')
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
            raise ValueError('Mês final deve ser maior ou igual ao mês inicial')
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
            raise ValueError(f'Modo de plano inválido. Deve ser um de: {", ".join(valid_modes)}')
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
