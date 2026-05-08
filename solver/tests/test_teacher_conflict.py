from montar_horario_solver.solver import solve_school_schedule
from fixtures import small_snapshot


def test_solver_respects_teacher_conflict_in_same_slot():
    snapshot = small_snapshot()
    snapshot["assignments"][1]["teacher_id"] = "teacher-1"
    snapshot["assignments"][0]["weekly_hours"] = 4
    snapshot["assignments"][1]["weekly_hours"] = 1

    result = solve_school_schedule(snapshot)

    assert result["status"] == "UNSAT"
