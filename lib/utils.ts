import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const diasDaSemana = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

export function formatarStatusJob(status: string) {
  const labels: Record<string, string> = {
    queued: "Na fila",
    running: "Gerando",
    succeeded: "Concluido",
    failed: "Falhou",
    cancelled: "Cancelado",
    timeout: "Tempo esgotado",
  };

  return labels[status] ?? status;
}
