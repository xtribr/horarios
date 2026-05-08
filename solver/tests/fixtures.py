def small_snapshot():
    org = "org-demo"
    slots = [
        {"id": "slot-1", "organization_id": org, "day_of_week": 1, "period_index": 1},
        {"id": "slot-2", "organization_id": org, "day_of_week": 1, "period_index": 2},
        {"id": "slot-3", "organization_id": org, "day_of_week": 2, "period_index": 1},
        {"id": "slot-4", "organization_id": org, "day_of_week": 2, "period_index": 2},
    ]
    teachers = [
        {"id": "teacher-1", "organization_id": org, "name": "Professor Demo 1", "max_classes_per_day": 4},
        {"id": "teacher-2", "organization_id": org, "name": "Professor Demo 2", "max_classes_per_day": 4},
    ]
    classes = [
        {"id": "class-1", "organization_id": org, "name": "Turma Demo 1"},
        {"id": "class-2", "organization_id": org, "name": "Turma Demo 2"},
    ]
    rooms = [
        {"id": "room-1", "organization_id": org, "name": "Sala Demo 1"},
        {"id": "room-2", "organization_id": org, "name": "Sala Demo 2"},
    ]
    assignments = [
        {
            "id": "assignment-1",
            "organization_id": org,
            "teacher_id": "teacher-1",
            "subject_id": "subject-1",
            "class_id": "class-1",
            "weekly_hours": 2,
            "room_id_preferred": "room-1",
            "grouping_rule": "livre",
        },
        {
            "id": "assignment-2",
            "organization_id": org,
            "teacher_id": "teacher-2",
            "subject_id": "subject-2",
            "class_id": "class-2",
            "weekly_hours": 2,
            "room_id_preferred": "room-2",
            "grouping_rule": "separadas",
        },
    ]
    availability = [
        {"teacher_id": teacher["id"], "time_slot_id": slot["id"], "available": True}
        for teacher in teachers
        for slot in slots
    ]
    return {
        "organizationId": org,
        "teachers": teachers,
        "subjects": [],
        "classes": classes,
        "rooms": rooms,
        "timeSlots": slots,
        "availability": availability,
        "assignments": assignments,
        "options": {"timeoutSeconds": 5},
    }
