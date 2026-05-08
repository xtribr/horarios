import { spawn } from "node:child_process";
import path from "node:path";
import type { SolverInput, SolverResult } from "@/lib/types";

export interface SolverAdapter {
  solve(input: SolverInput): Promise<SolverResult>;
}

export class PythonOrToolsSolverAdapter implements SolverAdapter {
  async solve(input: SolverInput): Promise<SolverResult> {
    const solverPath = path.join(process.cwd(), "solver", "montar_horario_solver", "cli.py");
    const startedAt = Date.now();

    return new Promise((resolve, reject) => {
      const child = spawn("python3", [solverPath], {
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      child.on("error", reject);
      child.on("close", (code) => {
        if (code !== 0) {
          resolve({
            status: "ERROR",
            scheduleEntries: [],
            hardConflicts: 0,
            softScore: null,
            elapsedMs: Date.now() - startedAt,
            diagnostics: {
              solver: "ortools-cp-sat",
              solverVersion: "unknown",
              message: stderr || `Solver finalizou com codigo ${code}.`,
            },
          });
          return;
        }

        try {
          resolve(JSON.parse(stdout) as SolverResult);
        } catch (error) {
          reject(error);
        }
      });

      child.stdin.write(JSON.stringify(input));
      child.stdin.end();
    });
  }
}
