from montar_horario_solver.solver import solve_school_schedule
from fixtures import small_snapshot


def test_solver_timeout_status_is_controlled():
    snapshot = small_snapshot()
    snapshot["options"]["timeoutSeconds"] = 1

    result = solve_school_schedule(snapshot)

    assert result["status"] in {"SOLVED", "TIMEOUT"}
    assert "diagnostics" in result
