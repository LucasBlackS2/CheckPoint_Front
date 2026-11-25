// Passos do tour guiado do modo demonstração. Cada passo destaca (piscando)
// o componente <Destaque id="..."> da tela indicada em "rota".

export type PerfilDemo = "aluno" | "professor";

export interface PassoTour {
  id: string;
  rota: string;
  /** Parâmetros da rota; "{contrato}" e "{local}" são trocados pelos ids da demonstração. */
  params?: Record<string, string>;
  titulo: string;
  texto: string;
}

export const PASSOS_TOUR: Record<PerfilDemo, PassoTour[]> = {
  aluno: [
    {
      id: "aluno-progresso",
      rota: "/ponto",
      titulo: "Seu progresso",
      texto: "O aluno acompanha aqui quantas horas já cumpriu da carga horária do estágio.",
    },
    {
      id: "aluno-registrar",
      rota: "/ponto",
      titulo: "Bater o ponto",
      texto:
        "Ao chegar na empresa, o aluno toca aqui. O app pede o QR Code fixado no local e uma selfie, e confere o GPS e o Wi-Fi. Experimente tocar no botão!",
    },
    {
      id: "aluno-verificar",
      rota: "/ponto",
      titulo: "Conferir a localização",
      texto: "Antes de bater o ponto, dá para ver se você já está dentro do raio permitido do local.",
    },
    {
      id: "aluno-historico",
      rota: "/historico",
      titulo: "Histórico",
      texto: "Todos os registros ficam aqui: horários, tempo, distância, rede Wi-Fi e as selfies.",
    },
    {
      id: "aluno-perfil",
      rota: "/perfil",
      titulo: "Perfil",
      texto: "Dados da conta e troca de senha. Fim do tour! Continue explorando à vontade.",
    },
  ],
  professor: [
    {
      id: "prof-resumo",
      rota: "/contratos",
      titulo: "Painel do professor",
      texto: "O professor vê quantos estagiários estão ativos e quantos estão no estágio neste momento.",
    },
    {
      id: "prof-estagiario",
      rota: "/contratos",
      titulo: "Seus estagiários",
      texto: "Cada cartão mostra o progresso de horas do estagiário. Tocar no cartão abre os detalhes.",
    },
    {
      id: "prof-progresso",
      rota: "/contrato/[id]",
      params: { id: "{contrato}" },
      titulo: "Detalhes do contrato",
      texto: "Local do estágio, período e as horas cumpridas em relação à carga horária.",
    },
    {
      id: "prof-registros",
      rota: "/contrato/[id]",
      params: { id: "{contrato}" },
      titulo: "Provas de presença",
      texto: "Cada registro mostra o horário, a distância do local, a rede Wi-Fi e a selfie que o aluno tirou.",
    },
    {
      id: "prof-cadastros",
      rota: "/cadastros",
      params: { aba: "contrato" },
      titulo: "Cadastros",
      texto: "Aqui o professor cadastra alunos, locais de estágio e contratos com a carga horária.",
    },
    {
      id: "prof-locais",
      rota: "/cadastros",
      params: { aba: "endereco" },
      titulo: "QR Code e Wi-Fi do local",
      texto: "Cada local tem um QR Code para imprimir e fixar na empresa, e pode exigir o Wi-Fi de lá.",
    },
    {
      id: "prof-qr-ao-vivo",
      rota: "/qrcode/[id]",
      params: { id: "{local}", nome: "Empresa Demonstração" },
      titulo: "QR Code ao vivo",
      texto:
        "O professor mostra no celular um QR Code que muda a cada 30 s e só aparece quando ele está no local que definiu como válido. Toque em \"Mostrar QR ao vivo\" para ver.",
    },
    {
      id: "prof-conta",
      rota: "/conta",
      titulo: "Conta",
      texto: "Dados da conta. Fim do tour! Continue explorando o app como professor.",
    },
  ],
};

export const NOME_PERFIL_DEMO: Record<PerfilDemo, string> = {
  aluno: "Aluno",
  professor: "Professor",
};
