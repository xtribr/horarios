import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { pdf } from "@react-pdf/renderer";
import { SchedulePdf, type ExportRow } from "@/lib/export/schedule-pdf";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCurrentOrganization } from "@/lib/tenant/current";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const organization = await requireCurrentOrganization();
  const supabase = await createSupabaseServerClient();
  const { data: schedule, error } = await supabase
    .from("schedules")
    .select("id,name")
    .eq("id", id)
    .eq("organization_id", organization.id)
    .single();

  if (error || !schedule) {
    return NextResponse.json({ error: "Horario nao encontrado." }, { status: 404 });
  }

  const { data: entries } = await supabase
    .from("schedule_entries")
    .select("*, teaching_assignments(*, teachers(name), subjects(name), classes(name)), time_slots(*), rooms(name)")
    .eq("schedule_id", id)
    .eq("organization_id", organization.id);

  const rows: ExportRow[] = (entries ?? []).map((entry) => {
    const assignment = entry.teaching_assignments as { teachers?: { name: string }; subjects?: { name: string }; classes?: { name: string } };
    const slot = entry.time_slots as { day_of_week: number; period_index: number };
    const room = entry.rooms as { name: string };
    return {
      className: assignment.classes?.name ?? "",
      day: slot.day_of_week,
      period: slot.period_index,
      subject: assignment.subjects?.name ?? "",
      teacher: assignment.teachers?.name ?? "",
      room: room.name,
    };
  });

  const format = request.nextUrl.searchParams.get("format") ?? "excel";
  if (format === "pdf") {
    const blob = await pdf(<SchedulePdf name={schedule.name} rows={rows} />).toBlob();
    return new NextResponse(blob, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${schedule.name}.pdf"`,
      },
    });
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Horario");
  sheet.columns = [
    { header: "Turma", key: "className", width: 18 },
    { header: "Dia", key: "day", width: 10 },
    { header: "Periodo", key: "period", width: 10 },
    { header: "Disciplina", key: "subject", width: 24 },
    { header: "Professor", key: "teacher", width: 24 },
    { header: "Sala", key: "room", width: 18 },
  ];
  rows.forEach((row) => sheet.addRow(row));

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="${schedule.name}.xlsx"`,
    },
  });
}
