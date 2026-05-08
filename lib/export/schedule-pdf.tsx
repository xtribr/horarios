import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

type ExportRow = {
  className: string;
  day: number;
  period: number;
  subject: string;
  teacher: string;
  room: string;
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 8 },
  subtitle: { color: "#475569", marginBottom: 16 },
  row: { flexDirection: "row", borderBottom: "1px solid #e2e8f0", paddingVertical: 6 },
  header: { backgroundColor: "#f1f5f9", fontWeight: 700 },
  cell: { flex: 1, paddingRight: 6 },
});

export function SchedulePdf({ name, rows }: { name: string; rows: ExportRow[] }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.subtitle}>N amostral: {rows.length} aulas alocadas</Text>
        <View style={[styles.row, styles.header]}>
          <Text style={styles.cell}>Turma</Text>
          <Text style={styles.cell}>Dia</Text>
          <Text style={styles.cell}>Periodo</Text>
          <Text style={styles.cell}>Disciplina</Text>
          <Text style={styles.cell}>Professor</Text>
          <Text style={styles.cell}>Sala</Text>
        </View>
        {rows.map((row, index) => (
          <View key={`${row.className}-${row.day}-${row.period}-${index}`} style={styles.row}>
            <Text style={styles.cell}>{row.className}</Text>
            <Text style={styles.cell}>{row.day}</Text>
            <Text style={styles.cell}>{row.period}</Text>
            <Text style={styles.cell}>{row.subject}</Text>
            <Text style={styles.cell}>{row.teacher}</Text>
            <Text style={styles.cell}>{row.room}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}

export type { ExportRow };
