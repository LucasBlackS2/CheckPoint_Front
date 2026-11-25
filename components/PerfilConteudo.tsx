import { useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { alterarSenha, mensagemDeErro } from "@/services/api";
import { NOME_PERFIL } from "@/utils/formatar";

import { Destaque } from "./Destaque";
import { Aviso, Botao, Campo, Cartao, Linha, Tela, Titulo } from "./ui";

export function PerfilConteudo() {
  const { usuario, sair } = useAuth();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "erro" | "sucesso"; texto: string } | null>(null);

  if (!usuario) return null;

  async function trocarSenha() {
    if (novaSenha !== confirmacao) {
      setAviso({ tipo: "erro", texto: "A confirmação não é igual à nova senha." });
      return;
    }
    setSalvando(true);
    setAviso(null);
    try {
      await alterarSenha(senhaAtual, novaSenha);
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmacao("");
      setAviso({ tipo: "sucesso", texto: "Senha alterada com sucesso." });
    } catch (erro) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(erro) });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Tela>
      <Destaque id={usuario.tipo_acesso === "aluno" ? "aluno-perfil" : "prof-conta"}>
      <Cartao>
        <Titulo>{usuario.nome}</Titulo>
        <Linha rotulo="Perfil" valor={NOME_PERFIL[usuario.tipo_acesso]} />
        <Linha rotulo="Matrícula" valor={usuario.matricula} />
        <Linha rotulo="E-mail" valor={usuario.email} />
        {usuario.turma ? <Linha rotulo="Turma" valor={usuario.turma} /> : null}
        {usuario.contato ? <Linha rotulo="Contato" valor={usuario.contato} /> : null}
      </Cartao>
      </Destaque>

      {usuario.demonstracao ? null : (
      <Cartao>
        <Titulo>Trocar senha</Titulo>
        <Campo rotulo="Senha atual" secureTextEntry value={senhaAtual} onChangeText={setSenhaAtual} />
        <Campo rotulo="Nova senha" secureTextEntry value={novaSenha} onChangeText={setNovaSenha} />
        <Campo rotulo="Confirmar nova senha" secureTextEntry value={confirmacao} onChangeText={setConfirmacao} />
        <Aviso tipo={aviso?.tipo ?? "info"} texto={aviso?.texto ?? null} />
        <Botao
          titulo="Salvar nova senha"
          aoPressionar={trocarSenha}
          carregando={salvando}
          desabilitado={!senhaAtual || novaSenha.length < 6}
        />
      </Cartao>
      )}

      <Botao titulo="Sair da conta" variante="perigo" aoPressionar={() => void sair()} />
    </Tela>
  );
}
