"use client";

import { DndContext, type DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Fragment, useMemo, useState } from "react";
import type { ScheduleEntry, SolverInput } from "@/lib/types";
import { validateHardConflicts } from "@/lib/scheduler/conflicts";
import { diasDaSemana } from "@/lib/utils";

type GridEntry = ScheduleEntry & { id: string };

export function ScheduleGrid({ input, initialEntries }: { input: SolverInput; initialEntries: GridEntry[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [warning, setWarning] = useState<string | null>(null);
  const assignments = useMemo(() => new Map(input.assignments.map((item) => [item.id, item])), [input.assignments]);
  const subjects = useMemo(() => new Map(input.subjects.map((item) => [item.id, item])), [input.subjects]);
  const teachers = useMemo(() => new Map(input.teachers.map((item) => [item.id, item])), [input.teachers]);
  const rooms = useMemo(() => new Map(input.rooms.map((item) => [item.id, item])), [input.rooms]);

  function onDragEnd(event: DragEndEvent) {
    const entryId = String(event.active.id);
    const slotId = event.over?.id ? String(event.over.id) : null;
    if (!slotId) return;

    const next = entries.map((entry) => entry.id === entryId ? { ...entry, timeSlotId: slotId } : entry);
    const conflicts = validateHardConflicts(input, next);
    if (conflicts.length > 0) {
      setWarning(conflicts[0].message);
      return;
    }

    setWarning(null);
    setEntries(next);
  }

  return (
    <DndContext onDragEnd={onDragEnd}>
      {warning ? <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{warning}</div> : null}
      <div className="overflow-auto rounded-lg border border-slate-200 bg-white">
        <div className="grid min-w-[900px]" style={{ gridTemplateColumns: `120px repeat(${input.timeSlots.length}, minmax(130px, 1fr))` }}>
          <div className="border-b border-r bg-slate-50 p-3 text-sm font-medium">Turma</div>
          {input.timeSlots.map((slot) => (
            <DroppableSlot key={slot.id} id={slot.id}>
              <div className="text-xs font-semibold text-slate-600">{diasDaSemana[slot.day_of_week - 1]} P{slot.period_index}</div>
              <div className="text-xs text-slate-400">{slot.start_time} - {slot.end_time}</div>
            </DroppableSlot>
          ))}
          {input.classes.map((klass) => (
            <Fragment key={klass.id}>
              <div key={`${klass.id}-label`} className="border-r border-t bg-slate-50 p-3 text-sm font-medium">{klass.name}</div>
              {input.timeSlots.map((slot) => {
                const cellEntries = entries.filter((entry) => {
                  const assignment = assignments.get(entry.assignmentId);
                  return entry.timeSlotId === slot.id && assignment?.class_id === klass.id;
                });
                return (
                  <div key={`${klass.id}-${slot.id}`} className="min-h-28 border-t border-r p-2">
                    {cellEntries.map((entry) => {
                      const assignment = assignments.get(entry.assignmentId);
                      const subject = assignment ? subjects.get(assignment.subject_id) : null;
                      const teacher = assignment ? teachers.get(assignment.teacher_id) : null;
                      const room = rooms.get(entry.roomId);
                      return (
                        <DraggableEntry key={entry.id} id={entry.id}>
                          <p className="font-medium">{subject?.name ?? "Disciplina"}</p>
                          <p className="text-slate-500">{teacher?.name ?? "Professor"}</p>
                          <p className="text-slate-400">{room?.name ?? "Sala"}</p>
                        </DraggableEntry>
                      );
                    })}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </DndContext>
  );
}

function DroppableSlot({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`border-b border-r bg-slate-50 p-3 ${isOver ? "bg-blue-50" : ""}`}>
      {children}
    </div>
  );
}

function DraggableEntry({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className="mb-2 cursor-grab rounded-md border border-slate-200 bg-white p-2 text-xs shadow-sm"
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
}
