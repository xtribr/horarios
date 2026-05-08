from montar_horario_solver.solver import solve_school_schedule
from fixtures import small_snapshot


def test_solver_returns_unsat_when_teacher_has_no_available_domain():
    snapshot = small_snapshot()
    snapshot["availability"] = [
        item
        for item in snapshot["availability"]
        if item["teacher_id"] != "teacher-1"
    ]

    result = solve_school_schedule(snapshot)

    assert result["status"] == "UNSAT"
    assert result["scheduleEntries"] == []
