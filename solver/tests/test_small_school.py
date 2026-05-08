from montar_horario_solver.solver import solve_school_schedule
from fixtures import small_snapshot


def test_small_school_returns_feasible_schedule_without_hard_conflicts():
    result = solve_school_schedule(small_snapshot())

    assert result["status"] == "SOLVED"
    assert result["hardConflicts"] == 0
    assert len(result["scheduleEntries"]) == 4
