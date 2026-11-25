import axios, { AxiosError } from "axios";
import { Platform } from "react-native";

import type {
  Contrato,
  DemoResponse,
  Endereco,
  Localizacao,
  Ponto,
  QrAoVivo,
  ResumoHoras,
  TipoUsuario,
  TokenResponse,
  Usuario,
  VerificacaoLocalizacao,
} from "@/types/api";

/**
 * Endereço do back-end. Configure no arquivo .env:
 *   EXPO_PUBLIC_API_URL=http://SEU_IP:8080
 * No celular físico use o IP do computador na rede (não "localhost").
 * No emulador Android use http://10.0.2.2:8080.
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080";

export const api = axios.create({ baseURL: API_URL, timeout: 15000 });

let tokenAtual: string | null = null;
let aoExpirarSessao: (() => void) | null = null;

export function definirToken(token: string | null) {
  tokenAtual = token;
}

export function obterToken(): string | null {
  return tokenAtual;
}

export function definirAoExpirarSessao(callback: (() => void) | null) {
  aoExpirarSessao = callback;
}

api.interceptors.request.use((config) => {
  if (tokenAtual) {
    config.headers.Authorization = `Bearer ${tokenAtual}`;
  }
  return config;
});

api.interceptors.response.use(
  (resposta) => resposta,
  (erro: AxiosError) => {
    const ehLogin = erro.config?.url === "/login";
    if (erro.response?.status === 401 && tokenAtual && !ehLogin) {
      aoExpirarSessao?.();
    }
    return Promise.reject(erro);
  }
);

interface ErroApi {
  detail?: string;
  campos?: Record<string, string>;
}

/** Converte qualquer erro da API numa mensagem amigável em português. */
export function mensagemDeErro(erro: unknown): string {
  if (axios.isAxiosError(erro)) {
    if (!erro.response) {
      return `Não foi possível conectar à API (${API_URL}). Verifique se o back-end está rodando e o EXPO_PUBLIC_API_URL.`;
    }
    const dados = erro.response.data as ErroApi | undefined;
    if (dados?.campos) {
      const primeiro = Object.values(dados.campos)[0];
      if (primeiro) return primeiro;
    }
    if (dados?.detail) return dados.detail;
    return `Erro ${erro.response.status} ao falar com a API.`;
  }
  return erro instanceof Error ? erro.message : "Erro inesperado.";
}

export function statusDoErro(erro: unknown): number | undefined {
  return axios.isAxiosError(erro) ? erro.response?.status : undefined;
}

// ------------------------------------------------------------ autenticação

export async function login(matricula: string, senha: string) {
  const { data } = await api.post<TokenResponse>("/login", { matricula, senha });
  return data;
}

export async function buscarMe() {
  const { data } = await api.get<Usuario>("/me");
  return data;
}

export async function alterarSenha(senhaAtual: string, novaSenha: string) {
  await api.patch("/me/senha", { senha_atual: senhaAtual, nova_senha: novaSenha });
}

// ------------------------------------------------------------------- aluno

export async function buscarPontoAberto(): Promise<Ponto | null> {
  try {
    const { data } = await api.get<Ponto>("/ponto/aberto");
    return data;
  } catch (erro) {
    if (statusDoErro(erro) === 404) return null;
    throw erro;
  }
}

export interface DadosRegistro {
  local: Localizacao;
  qrCode: string;
  wifiSsid: string | null;
  wifiBssid: string | null;
  fotoUri: string | null;
}

/** Envia entrada ou saída com todas as provas de presença (multipart, com a selfie). */
export async function registrarPonto(modo: "entrada" | "saida", dados: DadosRegistro) {
  const form = new FormData();
  form.append("latitude", String(dados.local.latitude));
  form.append("longitude", String(dados.local.longitude));
  form.append("qr_code", dados.qrCode);
  if (dados.wifiSsid) form.append("wifi_ssid", dados.wifiSsid);
  if (dados.wifiBssid) form.append("wifi_bssid", dados.wifiBssid);
  if (dados.fotoUri) {
    if (Platform.OS === "web") {
      const blob = await (await fetch(dados.fotoUri)).blob();
      form.append("foto", blob, "selfie.jpg");
    } else {
      // No celular o FormData aceita {uri, name, type} apontando para o arquivo da câmera.
      form.append("foto", { uri: dados.fotoUri, name: "selfie.jpg", type: "image/jpeg" } as unknown as Blob);
    }
  }
  const { data } = await api.post<Ponto>(`/ponto/${modo}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 30000,
  });
  return data;
}

export async function verificarLocalizacao(local: Localizacao) {
  const { data } = await api.post<VerificacaoLocalizacao>("/ponto/verificar-localizacao", local);
  return data;
}

export async function buscarMeuResumo() {
  const { data } = await api.get<ResumoHoras>("/ponto/resumo");
  return data;
}

export async function buscarMeuHistorico() {
  const { data } = await api.get<Ponto[]>("/ponto/historico");
  return data;
}

// --------------------------------------------- professor / coordenação

export async function listarContratos() {
  const { data } = await api.get<Contrato[]>("/contratos");
  return data;
}

export async function buscarContrato(id: number) {
  const { data } = await api.get<Contrato>(`/contratos/${id}`);
  return data;
}

export async function buscarResumoContrato(id: number) {
  const { data } = await api.get<ResumoHoras>(`/contratos/${id}/resumo`);
  return data;
}

export async function listarPontosContrato(id: number) {
  const { data } = await api.get<Ponto[]>(`/contratos/${id}/pontos`);
  return data;
}

export async function alterarStatusContrato(id: number, status: boolean) {
  const { data } = await api.patch<Contrato>(`/contratos/${id}/status`, { status });
  return data;
}

export async function encerrarPonto(idPonto: number, minutos: number) {
  const { data } = await api.patch<Ponto>(`/ponto/${idPonto}/encerrar`, {
    tempo_trabalhado_minutos: minutos,
  });
  return data;
}

export interface NovoUsuario {
  nome: string;
  matricula: string;
  senha: string;
  email: string;
  contato?: string;
  turma?: string;
  tipo_acesso: TipoUsuario;
}

export async function criarUsuario(dados: NovoUsuario) {
  const { data } = await api.post<Usuario>("/utilizadores", dados);
  return data;
}

export async function listarUsuarios(tipo?: TipoUsuario) {
  const { data } = await api.get<Usuario[]>("/utilizadores", { params: tipo ? { tipo } : undefined });
  return data;
}

export type NovoEndereco = Omit<Endereco, "id" | "demonstracao">;

export async function criarEndereco(dados: NovoEndereco) {
  const { data } = await api.post<Endereco>("/enderecos", dados);
  return data;
}

export async function listarEnderecos() {
  const { data } = await api.get<Endereco[]>("/enderecos");
  return data;
}

export interface NovoContrato {
  id_aluno: number;
  id_professor: number;
  id_endereco: number;
  data_inicio: string | null;
  data_final: string | null;
  carga_horaria_total: number | null;
}

export async function criarContrato(dados: NovoContrato) {
  const { data } = await api.post<Contrato>("/contratos", dados);
  return data;
}

// ------------------------------------------------------- QR Code e rede

/** Caminho da imagem PNG do QR Code de um local (use com <ImagemAutenticada />). */
export function caminhoQrCode(idEndereco: number, versao = 0) {
  return `/enderecos/${idEndereco}/qrcode?v=${versao}`;
}

export async function buscarEndereco(id: number) {
  const { data } = await api.get<Endereco>(`/enderecos/${id}`);
  return data;
}

export interface LocalValido {
  latitude?: number;
  longitude?: number;
  raio_metros?: number;
  aceita_qr_impresso?: boolean;
}

/** Professor define onde o QR Code vale (posição, raio e se o impresso é aceito). */
export async function definirLocalValido(id: number, dados: LocalValido) {
  const { data } = await api.patch<Endereco>(`/enderecos/${id}/local-valido`, dados);
  return data;
}

/** QR Code ao vivo: a API só gera se o professor estiver dentro do local válido. */
export async function gerarQrAoVivo(id: number, posicao: Localizacao) {
  const { data } = await api.post<QrAoVivo>(`/enderecos/${id}/qrcode-ao-vivo`, posicao);
  return data;
}

export async function gerarNovoQrCode(idEndereco: number) {
  await api.post(`/enderecos/${idEndereco}/qrcode/novo`);
}

/** Caminho da selfie de um registro de ponto. */
export function caminhoFoto(idPonto: number, momento: "entrada" | "saida") {
  return `/ponto/${idPonto}/foto/${momento}`;
}

/** IP com que esta rede chega ao servidor (para preencher o IP público do local). */
export async function buscarMeuIp() {
  const { data } = await api.get<{ ip: string }>("/rede/meu-ip");
  return data.ip;
}

// ----------------------------------------------------------- demonstração

export async function entrarDemo(perfil: "aluno" | "professor") {
  const { data } = await api.post<DemoResponse>("/demo/entrar", { perfil });
  return data;
}

/** Conteúdo do QR Code do local de demonstração (simula a leitura). */
export async function buscarQrCodeDemo() {
  const { data } = await api.get<{ qr_code: string }>("/demo/qrcode");
  return data.qr_code;
}
