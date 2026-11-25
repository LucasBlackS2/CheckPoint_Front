/** Matrícula só tem números: remove qualquer outro caractere digitado. */
export function somenteNumeros(texto: string): string {
  return texto.replace(/\D/g, "");
}

/** "2026-11-11" -> "11/11/2026" */
export function formatarData(data: string | null | undefined): string {
  if (!data) return "—";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

/** Horário ISO (UTC) -> "14:05" no horário do aparelho. */
export function formatarHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** 200 -> "3h 20min" */
export function formatarMinutos(minutos: number | null | undefined): string {
  if (minutos == null) return "—";
  const h = Math.floor(minutos / 60);
  const m = Math.round(minutos % 60);
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

export function minutosDesde(iso: string, agora: number = Date.now()): number {
  return Math.max(0, Math.floor((agora - new Date(iso).getTime()) / 60000));
}

export function formatarDistancia(metros: number | null | undefined): string {
  if (metros == null) return "—";
  return metros >= 1000 ? `${(metros / 1000).toFixed(1)} km` : `${Math.round(metros)} m`;
}

export const NOME_PERFIL: Record<string, string> = {
  aluno: "Aluno",
  professor: "Professor",
  coordenador: "Coordenador",
  admin: "Administrador",
};
