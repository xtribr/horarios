import { describe, expect, it } from "vitest";
import { validateSnapshotReadiness } from "@/lib/scheduler/readiness";
import type { SolverInput } from "@/lib/types";

describe("validateSnapshotReadiness", () => {
  it("bloqueia geracao sem cadastros minimos", () => {
    const snapshot: SolverInput = {
      organizationId: "org",
      teachers: [],
      subjects: [],
      classes: [],
      rooms: [],
      timeSlots: [],
      availability: [],
      assignments: [],
      options: { timeoutSeconds: 120 },
    };

    expect(validateSnapshotReadiness(snapshot)).toContain("Cadastre pelo menos um professor.");
  });
});
