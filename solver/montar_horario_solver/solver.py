from __future__ import annotations

import time
from collections import defaultdict
from typing import Any

from ortools.sat.python import cp_model

from montar_horario_solver import SOLVER_VERSION
from montar_horario_solver.model import SolverEntry, normalize_snapshot


def _empty_result(status: str, started_at: float, message: str) -> dict[str, Any]:
    return {
        "status": status,
        "scheduleEntries": [],
        "hardConflicts": 0,
        "softScore": None,
        "elapsedMs": int((time.time() - started_at) * 1000),
        "diagnostics": {
            "solver": "ortools-cp-sat",
            "solverVersion": SOLVER_VERSION,
            "message": message,
        },
    }


def solve_school_schedule(raw_snapshot: dict[str, Any]) -> dict[str, Any]:
    started_at = time.time()
    snapshot = normalize_snapshot(raw_snapshot)

    assignments = snapshot["assignments"]
    rooms = snapshot["rooms"]
    slots = snapshot["timeSlots"]
    timeout = int(snapshot.get("options", {}).get("timeoutSeconds", 120))

    if not assignments:
        return _empty_result("UNSAT", started_at, "Nenhuma atribuicao cadastrada.")
    if not rooms:
        return _empty_result("UNSAT", started_at, "Nenhuma sala cadastrada.")
    if not slots:
        return _empty_result("UNSAT", started_at, "Nenhum periodo cadastrado.")

    available_pairs = {
        (item["teacher_id"], item["time_slot_id"])
        for item in snapshot["availability"]
        if item.get("available", True)
    }
    slots_by_id = {slot["id"]: slot for slot in slots}

    model = cp_model.CpModel()
    variables: dict[tuple[str, str, str], cp_model.IntVar] = {}

    for assignment in assignments:
        preferred_room = assignment.get("room_id_preferred")
        candidate_rooms = rooms
        if preferred_room:
            candidate_rooms = sorted(
                rooms,
                key=lambda room: 0 if room["id"] == preferred_room else 1,
            )

        for slot in slots:
            if (assignment["teacher_id"], slot["id"]) not in available_pairs:
                continue
            for room in candidate_rooms:
                key = (assignment["id"], slot["id"], room["id"])
                variables[key] = model.NewBoolVar(f"x_{assignment['id']}_{slot['id']}_{room['id']}")

    for assignment in assignments:
        vars_for_assignment = [
            var
            for (assignment_id, _slot_id, _room_id), var in variables.items()
            if assignment_id == assignment["id"]
        ]
        if len(vars_for_assignment) < int(assignment["weekly_hours"]):
            return _empty_result("UNSAT", started_at, f"Atribuicao {assignment['id']} sem dominio suficiente.")
        model.Add(sum(vars_for_assignment) == int(assignment["weekly_hours"]))

    by_teacher_slot: dict[tuple[str, str], list[cp_model.IntVar]] = defaultdict(list)
    by_class_slot: dict[tuple[str, str], list[cp_model.IntVar]] = defaultdict(list)
    by_room_slot: dict[tuple[str, str], list[cp_model.IntVar]] = defaultdict(list)

    assignments_by_id = {assignment["id"]: assignment for assignment in assignments}

    for (assignment_id, slot_id, room_id), var in variables.items():
        assignment = assignments_by_id[assignment_id]
        by_teacher_slot[(assignment["teacher_id"], slot_id)].append(var)
        by_class_slot[(assignment["class_id"], slot_id)].append(var)
        by_room_slot[(room_id, slot_id)].append(var)

    for vars_in_bucket in by_teacher_slot.values():
        model.Add(sum(vars_in_bucket) <= 1)
    for vars_in_bucket in by_class_slot.values():
        model.Add(sum(vars_in_bucket) <= 1)
    for vars_in_bucket in by_room_slot.values():
        model.Add(sum(vars_in_bucket) <= 1)

    penalties: list[cp_model.IntVar] = []
    for (assignment_id, slot_id, room_id), var in variables.items():
        assignment = assignments_by_id[assignment_id]
        preferred_room = assignment.get("room_id_preferred")
        if preferred_room and room_id != preferred_room:
            penalties.append(var * 3)

        slot = slots_by_id[slot_id]
        if assignment.get("grouping_rule") == "separadas":
            same_day_vars = [
                other_var
                for (other_assignment_id, other_slot_id, _other_room_id), other_var in variables.items()
                if other_assignment_id == assignment_id
                and slots_by_id[other_slot_id]["day_of_week"] == slot["day_of_week"]
                and other_slot_id != slot_id
            ]
            for other_var in same_day_vars:
                both = model.NewBoolVar(f"separadas_{assignment_id}_{slot_id}_{room_id}")
                model.AddBoolAnd([var, other_var]).OnlyEnforceIf(both)
                model.AddBoolOr([var.Not(), other_var.Not()]).OnlyEnforceIf(both.Not())
                penalties.append(both * 2)

    if penalties:
        model.Minimize(sum(penalties))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = timeout
    solver.parameters.num_search_workers = 8

    status = solver.Solve(model)
    elapsed_ms = int((time.time() - started_at) * 1000)

    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        entries = [
            SolverEntry(assignment_id, slot_id, room_id).to_json()
            for (assignment_id, slot_id, room_id), var in variables.items()
            if solver.BooleanValue(var)
        ]
        return {
            "status": "SOLVED",
            "scheduleEntries": entries,
            "hardConflicts": 0,
            "softScore": int(solver.ObjectiveValue()) if penalties else 0,
            "elapsedMs": elapsed_ms,
            "diagnostics": {
                "solver": "ortools-cp-sat",
                "solverVersion": SOLVER_VERSION,
                "exploredBranches": int(solver.NumBranches()),
                "conflicts": int(solver.NumConflicts()),
                "message": "Solucao viavel encontrada.",
            },
        }

    if status == cp_model.INFEASIBLE:
        return _empty_result("UNSAT", started_at, "Modelo inviavel com as restricoes atuais.")

    if status == cp_model.MODEL_INVALID:
        return _empty_result("ERROR", started_at, "Modelo CP-SAT invalido.")

    return _empty_result("TIMEOUT", started_at, "Tempo limite atingido sem solucao viavel.")
