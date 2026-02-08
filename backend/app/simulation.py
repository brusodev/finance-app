"""
Simulation module for investment goal planning
Implements compound interest calculations with ladder strategy
"""
from typing import List, Dict
from . import schemas


def simulate_investment(
    rate_monthly: float,
    months: int,
    steps: List[schemas.GoalPlanStepCreate]
) -> schemas.SimulationResponse:
    """
    Simulate investment with compound interest and contribution steps

    Args:
        rate_monthly: Monthly interest rate (e.g., 0.009 for 0.9%)
        months: Total months to simulate
        steps: List of contribution steps (ladder strategy)

    Returns:
        SimulationResponse with series data and totals
    """

    # Initialize
    balance = 0.0
    contributed_total = 0.0
    series = []

    # Create a map of month -> contribution
    contribution_map = {}
    for step in steps:
        for month in range(step.start_month, step.end_month + 1):
            if month <= months:
                contribution_map[month] = step.monthly_contribution_brl

    # Simulate month by month
    for month in range(1, months + 1):
        # Get contribution for this month
        contribution = contribution_map.get(month, 0.0)

        # Add contribution
        balance += contribution
        contributed_total += contribution

        # Apply interest
        interest = balance * rate_monthly
        balance += interest

        # Store month data
        series.append(schemas.SimulationMonthData(
            month=month,
            contribution=contribution,
            interest=interest,
            balance=round(balance, 2)
        ))

    # Calculate totals
    final_value = balance
    interest_total = final_value - contributed_total

    return schemas.SimulationResponse(
        series=series,
        final_value=round(final_value, 2),
        contributed_total=round(contributed_total, 2),
        interest_total=round(interest_total, 2),
        monthly_rate=rate_monthly,
        total_months=months
    )


def calculate_goal_progress(
    current_invested: float,
    target_value: float,
    months_elapsed: int,
    total_months: int,
    rate_monthly: float,
    steps: List[schemas.GoalPlanStepCreate]
) -> schemas.GoalProgress:
    """
    Calculate progress towards investment goal

    Args:
        current_invested: Current total invested
        target_value: Target value to reach
        months_elapsed: Months passed since start
        total_months: Total months in plan
        rate_monthly: Monthly interest rate
        steps: Contribution steps

    Returns:
        GoalProgress with progress metrics
    """

    # Calculate progress percentage
    progress_percentage = (current_invested / target_value * 100) if target_value > 0 else 0.0

    # Calculate remaining months
    months_remaining = max(0, total_months - months_elapsed)

    # Project final value using simulation
    # Start with current value and simulate remaining months
    remaining_steps = []
    for step in steps:
        # Adjust step months to remaining period
        if step.end_month > months_elapsed:
            adjusted_start = max(1, step.start_month - months_elapsed)
            adjusted_end = step.end_month - months_elapsed
            if adjusted_end > 0:
                remaining_steps.append(schemas.GoalPlanStepCreate(
                    start_month=adjusted_start,
                    end_month=adjusted_end,
                    monthly_contribution_brl=step.monthly_contribution_brl
                ))

    # Simulate from current value
    balance = current_invested
    for month in range(1, months_remaining + 1):
        # Find contribution for this month
        contribution = 0.0
        for step in remaining_steps:
            if step.start_month <= month <= step.end_month:
                contribution = step.monthly_contribution_brl
                break

        # Add contribution and interest
        balance += contribution
        balance += balance * rate_monthly

    projected_final_value = balance

    # Check if on track (projected >= target)
    on_track = projected_final_value >= target_value

    return schemas.GoalProgress(
        current_value=round(current_invested, 2),
        target_value=round(target_value, 2),
        progress_percentage=round(progress_percentage, 2),
        months_elapsed=months_elapsed,
        months_remaining=months_remaining,
        projected_final_value=round(projected_final_value, 2),
        on_track=on_track
    )


def create_default_ladder_steps(months: int = 120) -> List[Dict]:
    """
    Create default ladder steps (1k/2k/3k)

    Args:
        months: Total months (default 120 = 10 years)

    Returns:
        List of step dictionaries
    """
    if months <= 36:
        return [
            {"start_month": 1, "end_month": months, "monthly_contribution_brl": 1000.0}
        ]
    elif months <= 72:
        return [
            {"start_month": 1, "end_month": 36, "monthly_contribution_brl": 1000.0},
            {"start_month": 37, "end_month": months, "monthly_contribution_brl": 2000.0}
        ]
    else:
        return [
            {"start_month": 1, "end_month": 36, "monthly_contribution_brl": 1000.0},
            {"start_month": 37, "end_month": 72, "monthly_contribution_brl": 2000.0},
            {"start_month": 73, "end_month": months, "monthly_contribution_brl": 3000.0}
        ]
