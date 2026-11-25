import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

import * as api from "@/services/api";
import { apagarToken, lerToken, salvarToken } from "@/services/storage";
import type { Usuario } from "@/types/api";

interface AuthContexto {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (matricula: string, senha: string) => Promise<void>;
  /** Usado no modo demonstração: entra direto com um token já emitido pela API. */
  entrarComToken: (token: string) => Promise<void>;
  sair: () => Promise<void>;
}

const Contexto = createContext<AuthContexto | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  const sair = useCallback(async () => {
    api.definirToken(null);
    setUsuario(null);
    await apagarToken();
  }, []);

  // Se o token expirar, a API devolve 401 e o usuário volta para o login.
  useEffect(() => {
    api.definirAoExpirarSessao(() => {
      void sair();
    });
    return () => api.definirAoExpirarSessao(null);
  }, [sair]);

  // Ao abrir o app, tenta reaproveitar o token salvo.
  useEffect(() => {
    (async () => {
      try {
        const token = await lerToken();
        if (token) {
          api.definirToken(token);
          setUsuario(await api.buscarMe());
        }
      } catch {
        api.definirToken(null);
        await apagarToken();
      } finally {
        setCarregando(false);
      }
    })();
  }, []);

  const entrarComToken = useCallback(async (token: string) => {
    api.definirToken(token);
    const eu = await api.buscarMe();
    await salvarToken(token);
    setUsuario(eu);
  }, []);

  const entrar = useCallback(
    async (matricula: string, senha: string) => {
      const { access_token } = await api.login(matricula.trim(), senha);
      await entrarComToken(access_token);
    },
    [entrarComToken]
  );

  return (
    <Contexto.Provider value={{ usuario, carregando, entrar, entrarComToken, sair }}>{children}</Contexto.Provider>
  );
}

export function useAuth(): AuthContexto {
  const ctx = useContext(Contexto);
  if (!ctx) {
    throw new Error("useAuth precisa estar dentro de <AuthProvider>.");
  }
  return ctx;
}
