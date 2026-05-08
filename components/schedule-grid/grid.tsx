"use client";

import { DndContext, type DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type React from "react";
import { useMemo, useState } from "react";
import { validateHardConflicts } from "@/lib/scheduler/conflicts";
import type { ScheduleEntry, SolverInput, TeachingAssignment } from "@/lib/types";
import { diasDaSemana } from "@/lib/utils";

type GridEntry = ScheduleEntry & { id: string };
type ViewMode = "class" | "teacher";

const weekDays = [1, 2, 3, 4, 5];

export function ScheduleGrid({ input, initialEntries }: { input: SolverInput; initialEntries: GridEntry[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [viewMode, setViewMode] = useState<ViewMode>("class");
  const [selectedClassId, setSelectedClassId] = useState(input.classes[0]?.id ?? "");
  const [selectedTeacherId, setSelectedTeacherId] = useState(input.teachers[0]?.id ?? "");
  const [warning, setWarning] = useState<string | null>(null);

  const assignments = useMemo(() => new Map(input.assignments.map((item) => [item.id, item])), [input.assignments]);
  const subjects = useMemo(() => new Map(input.subjects.map((item) => [item.id, item])), [input.subjects]);
  const teachers = useMemo(() => new Map(input.teachers.map((item) => [item.id, item])), [input.teachers]);
  const classes = useMemo(() => new Map(input.classes.map((item) => [item.id, item])), [input.classes]);
  const rooms = useMemo(() => new Map(input.rooms.map((item) => [item.id, item])), [input.rooms]);
  const slotsByDayPeriod = useMemo(() => {
    return new Map(input.timeSlots.map((slot) => [`${slot.day_of_week}:${slot.period_index}`, slot]));
  }, [input.timeSlots]);
  const periodIndexes = useMemo(() => {
    return Array.from(new Set(input.timeSlots.map((slot) => slot.period_index))).sort((a, b) => a - b);
  }, [input.timeSlots]);

  const selectedEntityName = viewMode === "class"
    ? classes.get(selectedClassId)?.name
    : teachers.get(selectedTeacherId)?.name;

  function isEntryVisibleInCell(entry: GridEntry, assignment: TeachingAssignment, slotId: string) {
    if (entry.timeSlotId !== slotId) return false;
    if (viewMode === "class") return assignment.class_id === selectedClassId;
    return assignment.teacher_id === selectedTeacherId;
  }

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
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[220px_1fr_auto] lg:items-end">
          <label className="block text-sm font-medium text-slate-700">
            Visualizacao
            <select
              value={viewMode}
              onChange={(event) => setViewMode(event.target.value as ViewMode)}
              className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="class">Horario da turma</option>
              <option value="teacher">Horario do professor</option>
            </select>
          </label>
          {viewMode === "class" ? (
            <label className="block text-sm font-medium text-slate-700">
              Turma
              <select
                value={selectedClassId}
                onChange={(event) => setSelectedClassId(event.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              >
                {input.classes.map((klass) => (
                  <option key={klass.id} value={klass.id}>{klass.name}</option>
                ))}
              </select>
            </label>
          ) : (
            <label className="block text-sm font-medium text-slate-700">
              Professor
              <select
                value={selectedTeacherId}
                onChange={(event) => setSelectedTeacherId(event.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
              >
                {input.teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                ))}
              </select>
            </label>
          )}
          <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {viewMode === "class"
              ? "Grade completa para divulgar na sala."
              : "Agenda individual para o professor se organizar."}
          </div>
        </div>
      </div>

      <DndContext onDragEnd={onDragEnd}>
        {warning ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{warning}</div> : null}
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h2 className="text-lg font-semibold text-slate-950">
              {viewMode === "class" ? "Horario da turma" : "Horario do professor"}: {selectedEntityName ?? "sem selecao"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">Timetable completo de segunda a sexta.</p>
          </div>
          <div className="grid grid-cols-[110px_repeat(5,minmax(0,1fr))]">
            <div className="border-b border-r border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">
              Periodo
            </div>
            {weekDays.map((day) => (
              <div key={day} className="border-b border-r border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700 last:border-r-0">
                {diasDaSemana[day - 1]}
              </div>
            ))}
            {periodIndexes.map((period) => (
              <PeriodRow
                key={period}
                period={period}
                entries={entries}
                assignments={assignments}
                subjects={subjects}
                teachers={teachers}
                classes={classes}
                rooms={rooms}
                slotsByDayPeriod={slotsByDayPeriod}
                isEntryVisibleInCell={isEntryVisibleInCell}
                viewMode={viewMode}
              />
            ))}
          </div>
        </div>
      </DndContext>
    </div>
  );
}

function PeriodRow({
  period,
  entries,
  assignments,
  subjects,
  teachers,
  classes,
  rooms,
  slotsByDayPeriod,
  isEntryVisibleInCell,
  viewMode,
}: {
  period: number;
  entries: GridEntry[];
  assignments: Map<string, TeachingAssignment>;
  subjects: Map<string, { name: string }>;
  teachers: Map<string, { name: string }>;
  classes: Map<string, { name: string }>;
  rooms: Map<string, { name: string }>;
  slotsByDayPeriod: Map<string, SolverInput["timeSlots"][number]>;
  isEntryVisibleInCell: (entry: GridEntry, assignment: TeachingAssignment, slotId: string) => boolean;
  viewMode: ViewMode;
}) {
  const referenceSlot = weekDays
    .map((day) => slotsByDayPeriod.get(`${day}:${period}`))
    .find(Boolean);

  return (
    <>
      <div className="border-b border-r border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        <p className="font-semibold">P{period}</p>
        {referenceSlot ? (
          <p className="mt-1 text-xs text-slate-500">{referenceSlot.start_time} - {referenceSlot.end_time}</p>
        ) : null}
      </div>
      {weekDays.map((day) => {
        const slot = slotsByDayPeriod.get(`${day}:${period}`);
        const cellEntries = slot
          ? entries.filter((entry) => {
              const assignment = assignments.get(entry.assignmentId);
              return assignment ? isEntryVisibleInCell(entry, assignment, slot.id) : false;
            })
          : [];

        return (
          <DroppableCell key={`${day}-${period}`} id={slot?.id ?? `${day}:${period}:empty`}>
            {cellEntries.length === 0 ? (
              <span className="text-xs text-slate-300">Livre</span>
            ) : cellEntries.map((entry) => {
              const assignment = assignments.get(entry.assignmentId);
              if (!assignment) return null;
              return (
                <DraggableEntry key={entry.id} id={entry.id}>
                  <p className="font-semibold text-slate-950">{subjects.get(assignment.subject_id)?.name ?? "Disciplina"}</p>
                  <p className="text-slate-600">
                    {viewMode === "class"
                      ? teachers.get(assignment.teacher_id)?.name ?? "Professor"
                      : classes.get(assignment.class_id)?.name ?? "Turma"}
                  </p>
                  <p className="text-slate-400">{rooms.get(entry.roomId)?.name ?? "Sala"}</p>
                </DraggableEntry>
              );
            })}
          </DroppableCell>
        );
      })}
    </>
  );
}

function DroppableCell({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: id.includes(":empty") });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-28 border-b border-r border-slate-200 p-2 last:border-r-0 ${isOver ? "bg-blue-50" : "bg-white"}`}
    >
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
      className="mb-2 cursor-grab rounded-md border border-slate-200 bg-white p-3 text-sm shadow-sm"
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
}
