export interface ResultadoCep {
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
}

/** Preenche o endereço a partir do CEP usando a API pública ViaCEP. */
export async function buscarCep(cep: string): Promise<ResultadoCep> {
  const limpo = cep.replace(/\D/g, "");
  if (limpo.length !== 8) {
    throw new Error("O CEP deve ter 8 números.");
  }
  const resposta = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
  const dados = await resposta.json();
  if (!resposta.ok || dados.erro) {
    throw new Error("CEP não encontrado.");
  }
  return {
    logradouro: dados.logradouro ?? "",
    bairro: dados.bairro ?? "",
    cidade: dados.localidade ?? "",
    estado: dados.uf ?? "",
  };
}
