import { useRouter } from "expo-router";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

import { NOME_PERFIL_DEMO, PASSOS_TOUR, PassoTour, PerfilDemo } from "@/constants/tour";

import { useAuth } from "./AuthContext";

interface TourContexto {
  /** Tour aberto (cartão com explicação + destaque piscando). */
  ativo: boolean;
  perfil: PerfilDemo | null;
  nomePerfil: string | null;
  passo: PassoTour | null;
  indice: number;
  total: number;
  iniciar: (perfil: PerfilDemo, idContratoDemo: number, idLocalDemo: number) => void;
  proximo: () => void;
  anterior: () => void;
  /** Fecha o cartão, mas continua no modo demonstração. */
  fechar: () => void;
  reabrir: () => void;
}

const Contexto = createContext<TourContexto | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { usuario } = useAuth();
  const [perfil, setPerfil] = useState<PerfilDemo | null>(null);
  const [idContrato, setIdContrato] = useState<number | null>(null);
  const [idLocal, setIdLocal] = useState<number | null>(null);
  const [indice, setIndice] = useState(0);
  const [ativo, setAtivo] = useState(false);

  const passos = perfil ? PASSOS_TOUR[perfil] : [];
  const passo = ativo ? passos[indice] ?? null : null;

  // Saiu da conta: encerra o tour.
  useEffect(() => {
    if (!usuario) {
      setAtivo(false);
      setPerfil(null);
      setIndice(0);
    }
  }, [usuario]);

  // A cada passo, leva o usuário até a tela onde está a função destacada.
  useEffect(() => {
    if (!passo || !usuario) return;
    const params: Record<string, string> = {};
    for (const [chave, valor] of Object.entries(passo.params ?? {})) {
      params[chave] =
        valor === "{contrato}" ? String(idContrato ?? "") : valor === "{local}" ? String(idLocal ?? "") : valor;
    }
    // Pequeno atraso para o redirecionamento do login terminar antes.
    const t = setTimeout(() => {
      router.navigate({ pathname: passo.rota, params } as never);
    }, 250);
    return () => clearTimeout(t);
  }, [passo, idContrato, idLocal, usuario, router]);

  const iniciar = useCallback((novoPerfil: PerfilDemo, idContratoDemo: number, idLocalDemo: number) => {
    setPerfil(novoPerfil);
    setIdContrato(idContratoDemo);
    setIdLocal(idLocalDemo);
    setIndice(0);
    setAtivo(true);
  }, []);

  const proximo = useCallback(() => {
    if (indice + 1 >= passos.length) {
      setAtivo(false);
    } else {
      setIndice(indice + 1);
    }
  }, [indice, passos.length]);

  const anterior = useCallback(() => setIndice((i) => Math.max(0, i - 1)), []);
  const fechar = useCallback(() => setAtivo(false), []);
  const reabrir = useCallback(() => {
    if (!perfil) return;
    setIndice(0);
    setAtivo(true);
  }, [perfil]);

  return (
    <Contexto.Provider
      value={{
        ativo,
        perfil,
        nomePerfil: perfil ? NOME_PERFIL_DEMO[perfil] : null,
        passo,
        indice,
        total: passos.length,
        iniciar,
        proximo,
        anterior,
        fechar,
        reabrir,
      }}
    >
      {children}
    </Contexto.Provider>
  );
}

export function useTour(): TourContexto {
  const ctx = useContext(Contexto);
  if (!ctx) {
    throw new Error("useTour precisa estar dentro de <TourProvider>.");
  }
  return ctx;
}
