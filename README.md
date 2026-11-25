# CheckPoint — App (React Native / Expo)

App do **ponto eletrônico de estágio**. O aluno registra entrada e saída pelo
celular, e a API confere se ele está no local do estágio usando o GPS.
Professores e coordenação acompanham as horas de cada estagiário.

Funciona junto com o back-end em Java: **CheckPoint-Back**.

## Telas

**Aluno**
- **Ponto:** entrada/saída em 3 passos — escanear o **QR Code** fixado no local,
  tirar uma **selfie** e enviar (o app manda também **GPS** e **Wi-Fi**).
  Cronômetro do ponto aberto, "verificar minha localização" e progresso das horas.
- **Histórico:** todos os registros com horários, tempo e distância.
- **Perfil:** dados da conta, troca de senha e sair.

**Professor / Coordenação / Admin**
- **Estagiários:** lista de contratos com progresso e quem está no estágio agora.
- **Detalhe do contrato:** horas, registros, fechar ponto esquecido e encerrar contrato.
- **Cadastros:** novo usuário, novo local (CEP, GPS, **Wi-Fi do local** e IP da rede),
  lista de locais e novo contrato.
- **QR Code do local:** o **QR ao vivo** aparece no celular do professor, muda a
  cada 30 s e só é gerado com ele dentro do **local válido** (definido com
  "Definir aqui como local válido" + raio em metros). Também tem o QR impresso,
  que pode ser desligado para valer só o ao vivo. A tela fica acesa enquanto o
  QR ao vivo está aberto.
- **Registros:** cada ponto mostra horário, distância, rede Wi-Fi e as **selfies**.

**Modo demonstração ("Conhecer o app")**
- Na tela de login, escolha **Aluno** ou **Professor**: o app entra numa conta de
  exemplo e faz um **tour guiado** — cada função fica **piscando em laranja** com um
  cartão explicando, e os botões Voltar/Próximo levam de tela em tela.
- O aluno de demonstração pode testar o ponto: "Simular leitura do QR Code" e
  "Pular selfie" (GPS e Wi-Fi são simulados).
- **Conta:** dados, troca de senha e sair.

## Como rodar

1. Suba o back-end (veja o README do CheckPoint-Back).
2. Instale as dependências (o `expo install` ajusta as versões ao SDK do Expo):

   ```bash
   npm install
   npx expo install expo-location expo-secure-store expo-camera @react-native-community/netinfo expo-keep-awake
   ```

3. **Endereço da API (opcional):** no celular com Expo Go, o app usa sozinho o IP do
   computador que está rodando o `npx expo start`, na porta 8080 (o endereço
   aparece embaixo da tela de login). Só precisa configurar se a API estiver em
   outro computador — copie `.env.example` para `.env` e coloque:

   ```
   EXPO_PUBLIC_API_URL=http://192.168.0.10:8080
   ```

   - **Celular físico (Expo Go):** IP do computador na rede Wi-Fi (`ipconfig` no Windows).
     Celular e PC precisam estar na mesma rede, e o firewall deve liberar a porta 8080.
   - **Emulador Android:** `http://10.0.2.2:8080`
   - **Navegador:** `http://localhost:8080`

4. Inicie:

   ```bash
   npx expo start
   ```

   Leia o QR Code com o **Expo Go**, ou aperte `a` (Android) ou `w` (web).

Primeiro acesso: entre com o admin definido no `.env` do back-end
(`ADMIN_MATRICULA` / `ADMIN_SENHA`). Depois cadastre professores, alunos,
endereços e contratos na aba **Cadastros**.

## Estrutura

```
app/
├── _layout.tsx           Login obrigatório e redirecionamento por perfil
├── login.tsx
├── (aluno)/              Abas do aluno: ponto, histórico, perfil
└── (gestor)/             Abas do professor/coordenação: estagiários, cadastros, conta
    └── contrato/[id].tsx Detalhe do contrato
components/               Botões, campos, cartões, item de ponto, perfil
contexts/AuthContext.tsx  Sessão (token salvo com expo-secure-store)
services/api.ts           Todas as chamadas à API (axios + token automático)
services/localizacao.ts   GPS (expo-location)
services/viacep.ts        Busca de endereço pelo CEP
types/api.ts              Tipos das respostas da API
utils/formatar.ts         Datas, horas e distâncias
```

## Sobre o Wi-Fi

- **Android:** o app lê o nome da rede depois que a permissão de localização é dada.
- **iPhone (Expo Go):** o sistema não libera o nome da rede para o Expo Go. Nesses
  casos configure o **IP público** do local (botão "Usar IP desta rede", estando no
  Wi-Fi da empresa) em vez do nome da rede.

## Se o Expo der erro de módulo

Mensagens como `Unable to resolve module ./exports/ScrollView` ou
`Cannot find module '../user/UserSettings'` significam que o `node_modules`
ficou corrompido (instalação interrompida ou antivírus bloqueando arquivos).
Dê dois cliques em **`reinstalar-dependencias.bat`** ou rode:

```powershell
Remove-Item -Recurse -Force node_modules
npm cache verify
npm install
npx expo start -c
```

## Dicas de problemas comuns

- **"Não foi possível conectar à API":** o `EXPO_PUBLIC_API_URL` está errado, o
  back-end não está rodando ou o firewall bloqueou a porta 8080. Depois de
  mudar o `.env`, reinicie com `npx expo start -c`.
- **"O endereço do estágio ainda não tem coordenadas":** edite o endereço e
  informe latitude e longitude (ou use o GPS estando no local).
- **Ponto recusado por distância:** o raio padrão é 200 m
  (`GEOFENCE_RAIO_METROS` no back-end).
