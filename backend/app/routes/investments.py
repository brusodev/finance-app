"""
Investment routes for managing assets, transactions, goals, and simulations
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from .. import schemas, crud
from ..database import get_db
from .auth import get_current_user
from ..simulation import simulate_investment, calculate_goal_progress

router = APIRouter(prefix="/investments", tags=["investments"])


# ===== ASSETS =====

@router.post("/assets", response_model=schemas.InvestmentAsset)
def create_asset(
    asset: schemas.InvestmentAssetCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Create a new investment asset"""
    return crud.create_investment_asset(db, asset, current_user.id)


@router.get("/assets", response_model=List[schemas.InvestmentAsset])
def list_assets(
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """List all investment assets for the current user"""
    return crud.get_investment_assets(db, current_user.id)


@router.get("/assets/{asset_id}", response_model=schemas.InvestmentAsset)
def get_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Get a specific investment asset"""
    asset = crud.get_investment_asset(db, asset_id, current_user.id)
    if not asset:
        raise HTTPException(status_code=404, detail="Ativo não encontrado")
    return asset


@router.put("/assets/{asset_id}", response_model=schemas.InvestmentAsset)
def update_asset(
    asset_id: int,
    asset: schemas.InvestmentAssetUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Update an investment asset"""
    updated = crud.update_investment_asset(db, asset_id, asset, current_user.id)
    if not updated:
        raise HTTPException(status_code=404, detail="Ativo não encontrado")
    return updated


@router.delete("/assets/{asset_id}")
def delete_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Delete an investment asset"""
    success = crud.delete_investment_asset(db, asset_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Ativo não encontrado")
    return {"message": "Ativo deletado com sucesso"}


# ===== TRANSACTIONS =====

@router.post("/transactions", response_model=schemas.InvestmentTransaction)
def create_transaction(
    transaction: schemas.InvestmentTransactionCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Create a new investment transaction"""
    try:
        return crud.create_investment_transaction(db, transaction, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/transactions", response_model=List[schemas.InvestmentTransaction])
def list_transactions(
    asset_id: Optional[int] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """List investment transactions with filters"""
    return crud.get_investment_transactions(
        db,
        current_user.id,
        asset_id=asset_id,
        from_date=from_date,
        to_date=to_date,
        transaction_type=type
    )


@router.get("/transactions/{transaction_id}", response_model=schemas.InvestmentTransaction)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Get a specific investment transaction"""
    transaction = crud.get_investment_transaction(db, transaction_id, current_user.id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    return transaction


@router.put("/transactions/{transaction_id}", response_model=schemas.InvestmentTransaction)
def update_transaction(
    transaction_id: int,
    transaction: schemas.InvestmentTransactionUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Update an investment transaction"""
    updated = crud.update_investment_transaction(db, transaction_id, transaction, current_user.id)
    if not updated:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    return updated


@router.delete("/transactions/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Delete an investment transaction"""
    success = crud.delete_investment_transaction(db, transaction_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    return {"message": "Transação deletada com sucesso"}


# ===== SUMMARY =====

@router.get("/summary", response_model=schemas.InvestmentSummary)
def get_summary(
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Get investment portfolio summary"""
    return crud.get_investment_summary(db, current_user.id)


# ===== GOAL PLAN =====

@router.post("/goal", response_model=schemas.GoalPlan)
def create_or_update_goal(
    goal: schemas.GoalPlanCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Create or update goal plan (only one goal per user)"""
    return crud.create_goal_plan(db, goal, current_user.id)


@router.get("/goal", response_model=Optional[schemas.GoalPlan])
def get_goal(
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Get the user's goal plan"""
    goal = crud.get_goal_plan(db, current_user.id)
    if not goal:
        return None
    return goal


@router.get("/goal/progress", response_model=schemas.GoalProgress)
def get_goal_progress(
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Get goal progress with projections"""
    goal = crud.get_goal_plan(db, current_user.id)
    if not goal:
        raise HTTPException(status_code=404, detail="Nenhuma meta configurada")

    # Get current invested amount
    summary = crud.get_investment_summary(db, current_user.id)
    current_invested = summary["total_invested"]

    # Calculate months elapsed
    start_date = goal.start_date
    today = date.today()
    months_elapsed = (today.year - start_date.year) * 12 + (today.month - start_date.month)
    months_elapsed = max(0, months_elapsed)

    # Convert steps to schema objects
    steps = [
        schemas.GoalPlanStepCreate(
            start_month=s.start_month,
            end_month=s.end_month,
            monthly_contribution_brl=s.monthly_contribution_brl
        )
        for s in goal.steps
    ]

    # Calculate progress
    progress = calculate_goal_progress(
        current_invested=current_invested,
        target_value=goal.target_value_brl,
        months_elapsed=months_elapsed,
        total_months=goal.months,
        rate_monthly=goal.default_monthly_rate,
        steps=steps
    )

    return progress


# ===== SIMULATION =====

@router.post("/simulate", response_model=schemas.SimulationResponse)
def simulate(
    request: schemas.SimulationRequest,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Simulate investment with compound interest"""
    # Use provided steps or get from user's goal
    steps = request.steps
    if not steps:
        goal = crud.get_goal_plan(db, current_user.id)
        if goal and goal.steps:
            steps = [
                schemas.GoalPlanStepCreate(
                    start_month=s.start_month,
                    end_month=s.end_month,
                    monthly_contribution_brl=s.monthly_contribution_brl
                )
                for s in goal.steps
            ]
        else:
            # Default ladder
            from ..simulation import create_default_ladder_steps
            default_steps = create_default_ladder_steps(request.months)
            steps = [
                schemas.GoalPlanStepCreate(**step_data)
                for step_data in default_steps
            ]

    # Run simulation
    result = simulate_investment(
        rate_monthly=request.rate_monthly,
        months=request.months,
        steps=steps
    )

    return result
