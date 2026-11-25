import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Destaque } from "@/components/Destaque";
import { Aviso, Botao, Campo, Cartao, Chips, Selo, Tela, TextoSuave, Titulo } from "@/components/ui";
import { cores } from "@/constants/tema";
import { useAuth } from "@/contexts/AuthContext";
import * as api from "@/services/api";
import { obterLocalizacaoAtual } from "@/services/localizacao";
import { lerWifiAtual } from "@/services/rede";
import { buscarCep } from "@/services/viacep";
import type { Endereco, TipoUsuario, Usuario } from "@/types/api";
import { NOME_PERFIL } from "@/utils/formatar";

type Aba = "usuario" | "endereco" | "contrato";
type Mensagem = { tipo: "erro" | "sucesso"; texto: string } | null;

const ABAS: Aba[] = ["contrato", "usuario", "endereco"];

export default function Cadastros() {
  // O tour pode abrir esta tela já numa aba (ex.: /cadastros?aba=endereco).
  const { aba: abaParam } = useLocalSearchParams<{ aba?: string }>();
  const [aba, setAba] = useState<Aba>("contrato");
  const [versaoLocais, setVersaoLocais] = useState(0);

  useEffect(() => {
    if (abaParam && (ABAS as string[]).includes(abaParam)) setAba(abaParam as Aba);
  }, [abaParam]);

  return (
    <Tela>
      <Destaque id="prof-cadastros">
        <Chips<Aba>
          opcoes={[
            { valor: "contrato", rotulo: "Contrato" },
            { valor: "usuario", rotulo: "Usuário" },
            { valor: "endereco", rotulo: "Local / QR Code" },
          ]}
          selecionado={aba}
          aoSelecionar={setAba}
        />
      </Destaque>
      {aba === "usuario" ? (
        <FormUsuario />
      ) : aba === "endereco" ? (
        <>
          <ListaLocais versao={versaoLocais} />
          <FormEndereco aoSalvar={() => setVersaoLocais((v) => v + 1)} />
        </>
      ) : (
        <FormContrato />
      )}
    </Tela>
  );
}

// ------------------------------------------------------------- Usuário

/** Quais perfis cada um pode criar (mesma regra do back-end). */
function perfisPermitidos(meuPerfil: TipoUsuario): TipoUsuario[] {
  switch (meuPerfil) {
    case "admin":
      return ["aluno", "professor", "coordenador", "admin"];
    case "coordenador":
      return ["aluno", "professor", "coordenador"];
    case "professor":
      return ["aluno"];
    default:
      return [];
  }
}

function FormUsuario() {
  const { usuario } = useAuth();
  const permitidos = perfisPermitidos(usuario?.tipo_acesso ?? "aluno");
  const [tipo, setTipo] = useState<TipoUsuario>("aluno");
  const [nome, setNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [turma, setTurma] = useState("");
  const [contato, setContato] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<Mensagem>(null);

  async function salvar() {
    setSalvando(true);
    setMensagem(null);
    try {
      const novo = await api.criarUsuario({
        nome,
        matricula,
        email,
        senha,
        tipo_acesso: tipo,
        turma: turma || undefined,
        contato: contato || undefined,
      });
      setMensagem({ tipo: "sucesso", texto: `${NOME_PERFIL[novo.tipo_acesso]} ${novo.nome} cadastrado(a).` });
      setNome("");
      setMatricula("");
      setEmail("");
      setSenha("");
      setTurma("");
      setContato("");
    } catch (e) {
      setMensagem({ tipo: "erro", texto: api.mensagemDeErro(e) });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Cartao>
      <Titulo>Novo usuário</Titulo>
      {permitidos.length > 1 ? (
        <Chips<TipoUsuario>
          opcoes={permitidos.map((p) => ({ valor: p, rotulo: NOME_PERFIL[p] }))}
          selecionado={tipo}
          aoSelecionar={setTipo}
        />
      ) : null}
      <Campo rotulo="Nome completo" value={nome} onChangeText={setNome} />
      <Campo rotulo="Matrícula" value={matricula} onChangeText={setMatricula} autoCapitalize="none" />
      <Campo rotulo="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <Campo rotulo="Senha inicial (mín. 6)" value={senha} onChangeText={setSenha} secureTextEntry />
      {tipo === "aluno" ? <Campo rotulo="Turma" value={turma} onChangeText={setTurma} /> : null}
      <Campo rotulo="Telefone (opcional)" value={contato} onChangeText={setContato} keyboardType="phone-pad" />
      <Aviso tipo={mensagem?.tipo ?? "erro"} texto={mensagem?.texto ?? null} />
      <Botao
        titulo="Cadastrar"
        aoPressionar={salvar}
        carregando={salvando}
        desabilitado={!nome || !matricula || !email || senha.length < 6}
      />
    </Cartao>
  );
}

// ------------------------------------------------------------ Locais

/** Locais já cadastrados, com o botão para ver/imprimir o QR Code de cada um. */
function ListaLocais({ versao }: { versao: number }) {
  const router = useRouter();
  const [locais, setLocais] = useState<Endereco[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      api
        .listarEnderecos()
        .then((l) => {
          setLocais(l);
          setErro(null);
        })
        .catch((e) => setErro(api.mensagemDeErro(e)));
      // versao muda quando um local novo é salvo
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [versao])
  );

  return (
    <Destaque id="prof-locais">
      <Cartao>
        <Titulo>Locais cadastrados</Titulo>
        <Aviso tipo="erro" texto={erro} />
        {locais.length === 0 ? <TextoSuave>Nenhum local ainda. Cadastre abaixo.</TextoSuave> : null}
        {locais.map((l) => {
          const nome = `${l.logradouro}${l.numero ? ", " + l.numero : ""}`;
          return (
            <View key={l.id} style={estilos.local}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={estilos.localNome}>{nome}</Text>
                <Text style={estilos.localDetalhe}>{l.cidade} - {l.estado}</Text>
                <View style={estilos.selos}>
                  {l.latitude != null ? <Selo texto="GPS" cor="verde" /> : <Selo texto="Sem GPS" cor="cinza" />}
                  {l.wifi_ssid ? <Selo texto={`Wi-Fi: ${l.wifi_ssid}`} cor="azul" /> : null}
                  {l.ip_publico ? <Selo texto="IP da rede" cor="azul" /> : null}
                  {l.raio_metros ? <Selo texto={`Raio ${l.raio_metros} m`} cor="cinza" /> : null}
                  {!l.aceita_qr_impresso ? <Selo texto="Só QR ao vivo" cor="verde" /> : null}
                </View>
              </View>
              <Pressable
                onPress={() => router.push({ pathname: "/qrcode/[id]", params: { id: String(l.id), nome } })}
                style={estilos.botaoQr}
              >
                <Text style={estilos.botaoQrTexto}>QR Code</Text>
              </Pressable>
            </View>
          );
        })}
      </Cartao>
    </Destaque>
  );
}

// ------------------------------------------------------------ Endereço

function FormEndereco({ aoSalvar }: { aoSalvar: () => void }) {
  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiBssid, setWifiBssid] = useState("");
  const [ipPublico, setIpPublico] = useState("");
  const [raio, setRaio] = useState("");
  const [ocupado, setOcupado] = useState<null | "cep" | "gps" | "wifi" | "ip" | "salvar">(null);
  const [mensagem, setMensagem] = useState<Mensagem>(null);

  async function preencherPorCep() {
    setOcupado("cep");
    setMensagem(null);
    try {
      const r = await buscarCep(cep);
      setLogradouro(r.logradouro);
      setBairro(r.bairro);
      setCidade(r.cidade);
      setEstado(r.estado);
    } catch (e) {
      setMensagem({ tipo: "erro", texto: api.mensagemDeErro(e) });
    } finally {
      setOcupado(null);
    }
  }

  async function usarMinhaLocalizacao() {
    setOcupado("gps");
    setMensagem(null);
    try {
      const local = await obterLocalizacaoAtual();
      setLatitude(local.latitude.toFixed(6));
      setLongitude(local.longitude.toFixed(6));
    } catch (e) {
      setMensagem({ tipo: "erro", texto: api.mensagemDeErro(e) });
    } finally {
      setOcupado(null);
    }
  }

  /** Lê a rede em que o celular está agora (use estando no local do estágio). */
  async function usarWifiAtual() {
    setOcupado("wifi");
    setMensagem(null);
    try {
      await obterLocalizacaoAtual(); // no Android, o nome da rede só é liberado com a localização permitida
      const wifi = await lerWifiAtual();
      if (!wifi) {
        setMensagem({ tipo: "erro", texto: "O celular não está conectado a um Wi-Fi agora." });
      } else if (!wifi.ssid) {
        setMensagem({
          tipo: "erro",
          texto: "Não foi possível ler o nome da rede (o iPhone/Expo Go não permite). Digite o nome ou use o IP da rede.",
        });
      } else {
        setWifiSsid(wifi.ssid);
        setWifiBssid(wifi.bssid ?? "");
      }
    } catch (e) {
      setMensagem({ tipo: "erro", texto: api.mensagemDeErro(e) });
    } finally {
      setOcupado(null);
    }
  }

  async function usarIpAtual() {
    setOcupado("ip");
    setMensagem(null);
    try {
      setIpPublico(await api.buscarMeuIp());
    } catch (e) {
      setMensagem({ tipo: "erro", texto: api.mensagemDeErro(e) });
    } finally {
      setOcupado(null);
    }
  }

  async function salvar() {
    const lat = latitude ? Number(latitude.replace(",", ".")) : null;
    const lon = longitude ? Number(longitude.replace(",", ".")) : null;
    if ((lat == null) !== (lon == null) || (lat != null && Number.isNaN(lat)) || (lon != null && Number.isNaN(lon))) {
      setMensagem({ tipo: "erro", texto: "Preencha latitude e longitude válidas (ou deixe as duas vazias)." });
      return;
    }
    setOcupado("salvar");
    setMensagem(null);
    try {
      const novo = await api.criarEndereco({
        cep: cep || null,
        logradouro,
        numero: numero || null,
        bairro: bairro || null,
        cidade,
        estado,
        latitude: lat,
        longitude: lon,
        wifi_ssid: wifiSsid || null,
        wifi_bssid: wifiBssid || null,
        ip_publico: ipPublico || null,
        raio_metros: raio ? Number(raio) : null,
        aceita_qr_impresso: true,
      });
      setMensagem(
        novo.latitude == null
          ? { tipo: "erro", texto: "Endereço salvo, mas SEM coordenadas. Edite e informe latitude/longitude para o ponto funcionar." }
          : { tipo: "sucesso", texto: "Local salvo! Toque em \"QR Code\" na lista acima para imprimir." }
      );
      aoSalvar();
      setCep("");
      setLogradouro("");
      setNumero("");
      setBairro("");
      setCidade("");
      setEstado("");
      setLatitude("");
      setLongitude("");
      setWifiSsid("");
      setWifiBssid("");
      setIpPublico("");
      setRaio("");
    } catch (e) {
      setMensagem({ tipo: "erro", texto: api.mensagemDeErro(e) });
    } finally {
      setOcupado(null);
    }
  }

  return (
    <Cartao>
      <Titulo>Local do estágio</Titulo>
      <Campo rotulo="CEP" value={cep} onChangeText={setCep} keyboardType="number-pad" placeholder="55000-000" />
      <Botao titulo="Buscar CEP" variante="secundario" aoPressionar={preencherPorCep} carregando={ocupado === "cep"} desabilitado={!cep} />
      <Campo rotulo="Rua / Avenida" value={logradouro} onChangeText={setLogradouro} />
      <Campo rotulo="Número" value={numero} onChangeText={setNumero} />
      <Campo rotulo="Bairro" value={bairro} onChangeText={setBairro} />
      <Campo rotulo="Cidade" value={cidade} onChangeText={setCidade} />
      <Campo rotulo="Estado (UF)" value={estado} onChangeText={setEstado} autoCapitalize="characters" maxLength={2} />
      <TextoSuave>
        As coordenadas definem onde o aluno pode bater o ponto. Se estiver no local, use o GPS; senão, copie do Google
        Maps ou deixe vazio para a API tentar buscar.
      </TextoSuave>
      <Botao titulo="Usar minha localização atual" variante="secundario" aoPressionar={usarMinhaLocalizacao} carregando={ocupado === "gps"} />
      <Campo rotulo="Latitude" value={latitude} onChangeText={setLatitude} keyboardType="numbers-and-punctuation" placeholder="-8.283500" />
      <Campo rotulo="Longitude" value={longitude} onChangeText={setLongitude} keyboardType="numbers-and-punctuation" placeholder="-35.976100" />
      <Campo
        rotulo="Raio permitido em metros (opcional)"
        value={raio}
        onChangeText={setRaio}
        keyboardType="number-pad"
        placeholder="200"
      />

      <Titulo>Wi-Fi do local (opcional)</Titulo>
      <TextoSuave>
        Se preencher, o aluno só bate o ponto conectado a esta rede. Estando no local, toque em "Usar Wi-Fi atual". No
        iPhone o nome da rede não pode ser lido: prefira o IP da rede.
      </TextoSuave>
      <Botao titulo="Usar Wi-Fi atual" variante="secundario" aoPressionar={usarWifiAtual} carregando={ocupado === "wifi"} />
      <Campo rotulo="Nome da rede (SSID)" value={wifiSsid} onChangeText={setWifiSsid} autoCapitalize="none" placeholder="Empresa-WiFi" />
      <Campo rotulo="MAC do roteador (BSSID, opcional)" value={wifiBssid} onChangeText={setWifiBssid} autoCapitalize="none" placeholder="aa:bb:cc:dd:ee:ff" />
      <Botao titulo="Usar IP desta rede" variante="secundario" aoPressionar={usarIpAtual} carregando={ocupado === "ip"} />
      <Campo rotulo="IP público da rede (opcional)" value={ipPublico} onChangeText={setIpPublico} autoCapitalize="none" placeholder="177.12.34.56" />
      <Aviso tipo={mensagem?.tipo ?? "erro"} texto={mensagem?.texto ?? null} />
      <Botao
        titulo="Salvar endereço"
        aoPressionar={salvar}
        carregando={ocupado === "salvar"}
        desabilitado={!logradouro || !cidade || !estado}
      />
    </Cartao>
  );
}

// ------------------------------------------------------------ Contrato

function FormContrato() {
  const { usuario } = useAuth();
  const souProfessor = usuario?.tipo_acesso === "professor";

  const [alunos, setAlunos] = useState<Usuario[]>([]);
  const [professores, setProfessores] = useState<Usuario[]>([]);
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [idAluno, setIdAluno] = useState<number | null>(null);
  const [idProfessor, setIdProfessor] = useState<number | null>(souProfessor ? usuario?.id ?? null : null);
  const [idEndereco, setIdEndereco] = useState<number | null>(null);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [carga, setCarga] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<Mensagem>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const [a, p, e] = await Promise.all([
            api.listarUsuarios("aluno"),
            api.listarUsuarios("professor"),
            api.listarEnderecos(),
          ]);
          setAlunos(a);
          setProfessores(p);
          setEnderecos(e);
        } catch (erro) {
          setMensagem({ tipo: "erro", texto: api.mensagemDeErro(erro) });
        }
      })();
    }, [])
  );

  /** Aceita "31/12/2026" ou "2026-12-31" e devolve "2026-12-31". */
  function paraIso(data: string): string | null | "invalida" {
    const texto = data.trim();
    if (!texto) return null;
    const br = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (br) return `${br[3]}-${br[2]}-${br[1]}`;
    return /^\d{4}-\d{2}-\d{2}$/.test(texto) ? texto : "invalida";
  }

  async function salvar() {
    const inicio = paraIso(dataInicio);
    const fim = paraIso(dataFinal);
    if (inicio === "invalida" || fim === "invalida") {
      setMensagem({ tipo: "erro", texto: "Use datas no formato DD/MM/AAAA." });
      return;
    }
    if (idAluno == null || idProfessor == null || idEndereco == null) {
      setMensagem({ tipo: "erro", texto: "Escolha o aluno, o professor e o local." });
      return;
    }
    setSalvando(true);
    setMensagem(null);
    try {
      const novo = await api.criarContrato({
        id_aluno: idAluno,
        id_professor: idProfessor,
        id_endereco: idEndereco,
        data_inicio: inicio,
        data_final: fim,
        carga_horaria_total: carga ? Number(carga) : null,
      });
      setMensagem({ tipo: "sucesso", texto: `Contrato de ${novo.aluno.nome} criado.` });
      setIdAluno(null);
      setIdEndereco(null);
      setDataInicio("");
      setDataFinal("");
      setCarga("");
    } catch (e) {
      setMensagem({ tipo: "erro", texto: api.mensagemDeErro(e) });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Cartao>
      <Titulo>Novo contrato de estágio</Titulo>

      <TextoSuave>Aluno</TextoSuave>
      {alunos.length === 0 ? <TextoSuave>Nenhum aluno cadastrado.</TextoSuave> : null}
      <Chips<number>
        opcoes={alunos.map((a) => ({ valor: a.id, rotulo: `${a.nome} (${a.matricula})` }))}
        selecionado={idAluno}
        aoSelecionar={setIdAluno}
      />

      <TextoSuave>Professor orientador</TextoSuave>
      {souProfessor ? (
        <TextoSuave>Você ({usuario?.nome})</TextoSuave>
      ) : (
        <Chips<number>
          opcoes={professores.map((p) => ({ valor: p.id, rotulo: p.nome }))}
          selecionado={idProfessor}
          aoSelecionar={setIdProfessor}
        />
      )}

      <TextoSuave>Local do estágio</TextoSuave>
      {enderecos.length === 0 ? <TextoSuave>Cadastre um endereço primeiro.</TextoSuave> : null}
      <Chips<number>
        opcoes={enderecos.map((e) => ({
          valor: e.id,
          rotulo: `${e.logradouro}${e.numero ? ", " + e.numero : ""} - ${e.cidade}${e.latitude == null ? " ⚠" : ""}`,
        }))}
        selecionado={idEndereco}
        aoSelecionar={setIdEndereco}
      />

      <Campo rotulo="Data de início" value={dataInicio} onChangeText={setDataInicio} placeholder="DD/MM/AAAA" />
      <Campo rotulo="Data final" value={dataFinal} onChangeText={setDataFinal} placeholder="DD/MM/AAAA" />
      <Campo rotulo="Carga horária total (horas)" value={carga} onChangeText={setCarga} keyboardType="number-pad" placeholder="Ex.: 300" />

      <Aviso tipo={mensagem?.tipo ?? "erro"} texto={mensagem?.texto ?? null} />
      <Botao titulo="Criar contrato" aoPressionar={salvar} carregando={salvando} />
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  local: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  localNome: { fontWeight: "700", color: cores.texto },
  localDetalhe: { color: cores.textoSuave, fontSize: 13 },
  selos: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  botaoQr: { backgroundColor: cores.primaria, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  botaoQrTexto: { color: "#FFFFFF", fontWeight: "700" },
});
