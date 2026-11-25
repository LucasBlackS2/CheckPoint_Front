// Tipos das respostas da API CheckPoint (JSON em snake_case).

export type TipoUsuario = "aluno" | "professor" | "coordenador" | "admin";

export interface Usuario {
  id: number;
  nome: string;
  matricula: string;
  email: string;
  contato: string | null;
  turma: string | null;
  tipo_acesso: TipoUsuario;
  demonstracao: boolean;
}

export interface UsuarioResumo {
  id: number;
  nome: string;
  matricula: string;
}

export interface Endereco {
  id: number;
  cep: string | null;
  logradouro: string;
  cidade: string;
  estado: string;
  numero: string | null;
  bairro: string | null;
  latitude: number | null;
  longitude: number | null;
  wifi_ssid: string | null;
  wifi_bssid: string | null;
  ip_publico: string | null;
  /** Raio válido em metros definido pelo professor (null = padrão do servidor). */
  raio_metros: number | null;
  /** false = só vale o QR Code ao vivo do celular do professor. */
  aceita_qr_impresso: boolean;
  demonstracao: boolean;
}

export interface QrAoVivo {
  conteudo: string;
  png_base64: string;
  expira_em: string;
  valido_por_segundos: number;
  distancia_metros: number;
  raio_metros: number;
}

export interface Contrato {
  id: number;
  aluno: UsuarioResumo;
  professor: UsuarioResumo;
  endereco: Endereco;
  data_inicio: string | null;
  data_final: string | null;
  status: boolean;
  carga_horaria_total: number | null;
}

export interface Ponto {
  id: number;
  id_contrato: number;
  data: string;
  hora_entrada: string;
  hora_saida: string | null;
  tempo_trabalhado_minutos: number | null;
  ativo: boolean;
  distancia_entrada_metros: number | null;
  distancia_saida_metros: number | null;
  encerrado_manualmente: boolean;
  foto_entrada: boolean;
  foto_saida: boolean;
  wifi_entrada: string | null;
  wifi_saida: string | null;
}

export interface ResumoHoras {
  id_contrato: number;
  minutos_cumpridos: number;
  horas_cumpridas: number;
  carga_horaria_total: number | null;
  horas_restantes: number | null;
  percentual: number | null;
  ponto_aberto: boolean;
}

export interface VerificacaoLocalizacao {
  dentro_do_raio: boolean;
  distancia_metros: number;
  raio_metros: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  tipo_acesso: TipoUsuario;
}

export interface DemoResponse extends TokenResponse {
  id_contrato_demo: number;
  id_local_demo: number;
}

export interface Localizacao {
  latitude: number;
  longitude: number;
}
