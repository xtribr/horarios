from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class SolverEntry:
    assignment_id: str
    time_slot_id: str
    room_id: str

    def to_json(self) -> dict[str, str]:
        return {
            "assignmentId": self.assignment_id,
            "timeSlotId": self.time_slot_id,
            "roomId": self.room_id,
        }


def normalize_snapshot(raw: dict[str, Any]) -> dict[str, Any]:
    required = ["teachers", "classes", "rooms", "timeSlots", "availability", "assignments"]
    missing = [key for key in required if key not in raw]
    if missing:
        raise ValueError(f"Snapshot sem campos obrigatorios: {', '.join(missing)}")

    return raw
