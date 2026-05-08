from montar_horario_solver.solver import solve_school_schedule
from fixtures import small_snapshot


def test_solver_uses_room_capacity_without_duplicate_room_slot():
    snapshot = small_snapshot()
    snapshot["rooms"] = [snapshot["rooms"][0]]

    result = solve_school_schedule(snapshot)

    assert result["status"] == "SOLVED"
    used_room_slots = {
        (entry["roomId"], entry["timeSlotId"])
        for entry in result["scheduleEntries"]
    }
    assert len(used_room_slots) == len(result["scheduleEntries"])
