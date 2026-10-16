import React from "react";
import {
  render,
  fireEvent,
  screen,
  act,
  cleanup,
} from "@testing-library/react-native";
import { DatabaseSync } from "node:sqlite";
import { Repository, Sqlite } from "../data/repository";
import { AppRoot } from "../app/AppRoot";
function repo() {
  const db = new DatabaseSync(":memory:");
  const adapter: Sqlite = {
    execSync: (s) => db.exec(s),
    runSync: (s, ...p) => db.prepare(s).run(...p),
    getAllSync: <T,>(s: string, ...p: (string | number | null)[]) =>
      db.prepare(s).all(...p) as T[],
    withTransactionSync: (fn) => {
      db.exec("BEGIN");
      try {
        fn();
        db.exec("COMMIT");
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    },
  };
  let id = 0;
  return new Repository(adapter, () => `ui-${++id}`);
}
beforeEach(() => jest.useFakeTimers());
afterEach(async () => {
  await act(async () => {
    jest.runOnlyPendingTimers();
  });
  cleanup();
  jest.useRealTimers();
});
test("onboarding completes and persists, client CRUD is operational", async () => {
  const r = repo();
  render(<AppRoot repository={r} />);
  fireEvent.press(screen.getByText("Continuar"));
  fireEvent.press(screen.getByText("Continuar"));
  fireEvent.press(screen.getByText("Começar"));
  expect(r.preferences().onboarded).toBe(true);
  fireEvent.press(screen.getByText("Clientes"));
  fireEvent.press(screen.getByText("Adicionar cliente"));
  fireEvent.changeText(screen.getByLabelText("Nome"), "Maria Teste");
  fireEvent.press(screen.getByText("Salvar"));
  expect(r.list("clients")[0]?.name).toBe("Maria Teste");
  expect(screen.getByText("Maria Teste")).toBeTruthy();
});
test("wizard validates steps and creates a persisted appointment", () => {
  const r = repo();
  r.setPreferences({ onboarded: true });
  r.saveCatalog("clients", {
    name: "Ana Cliente",
    phone: "",
    notes: "",
    consent: false,
  });
  r.saveCatalog("services", {
    name: "Manicure",
    priceCents: 5000,
    duration: 30,
    notes: "",
  });
  render(<AppRoot repository={r} />);
  fireEvent.press(screen.getByText("Novo agendamento"));
  fireEvent.press(screen.getByText("Selecionar cliente"));
  fireEvent.press(screen.getByText("Ana Cliente"));
  fireEvent.press(screen.getByText("Próximo"));
  fireEvent.press(screen.getByText("Escolher serviços"));
  fireEvent.press(screen.getByText("Manicure"));
  fireEvent.press(screen.getByText("Confirmar seleção"));
  fireEvent.press(screen.getByText("Próximo"));
  fireEvent.press(screen.getByText("Salvar agendamento"));
  expect(r.list("appointments")).toHaveLength(1);
  expect(r.list("appointments")[0]?.totalCents).toBe(5000);
});
test("service and material forms save real rows and stock controls persist", () => {
  const r = repo();
  r.setPreferences({ onboarded: true });
  render(<AppRoot repository={r} />);
  fireEvent.press(screen.getByText("Serviços"));
  fireEvent.press(screen.getByText("Adicionar serviço"));
  fireEvent.changeText(screen.getByLabelText("Nome"), "Pedicure");
  fireEvent.changeText(screen.getByLabelText("Preço"), "40,50");
  fireEvent.changeText(screen.getByLabelText("Duração em minutos"), "45");
  fireEvent.press(screen.getByText("Salvar"));
  expect(r.list("services")[0]?.priceCents).toBe(4050);
  fireEvent.press(screen.getByText("Fechar aviso"));
  fireEvent.press(screen.getByText("Estoque"));
  fireEvent.press(screen.getByText("Adicionar material"));
  fireEvent.changeText(screen.getByLabelText("Nome"), "Lixa");
  fireEvent.changeText(screen.getByLabelText("Estoque atual"), "2");
  fireEvent.press(screen.getByText("Salvar"));
  fireEvent.press(screen.getByText("− 1"));
  expect(r.list("materials")[0]?.stock).toBe(1);
});
test("wizard blocks missing client and preserves draft when adding a client inline", () => {
  const r = repo();
  r.setPreferences({ onboarded: true });
  render(<AppRoot repository={r} />);
  fireEvent.press(screen.getByText("Novo agendamento"));
  fireEvent.press(screen.getByText("Próximo"));
  expect(screen.getByText("Selecione um cliente.")).toBeTruthy();
  fireEvent.press(screen.getByText("Fechar aviso"));
  fireEvent.press(screen.getByText("Selecionar cliente"));
  fireEvent.press(screen.getByText("Adicionar cliente"));
  fireEvent.changeText(screen.getByLabelText("Nome"), "Nova Cliente");
  fireEvent.press(screen.getByText("Salvar"));
  expect(screen.getByText("Nova Cliente")).toBeTruthy();
  fireEvent.press(screen.getByText("Próximo"));
  expect(screen.getByText("Escolher serviços")).toBeTruthy();
  expect(r.list("appointments")).toHaveLength(0);
});
test("theme changes persist and about contains author and free access", () => {
  const r = repo();
  r.setPreferences({ onboarded: true });
  render(<AppRoot repository={r} />);
  fireEvent.press(screen.getByText("Ajustes"));
  fireEvent.press(screen.getByText("Tema"));
  fireEvent.press(screen.getByText("Escuro"));
  expect(r.preferences().theme).toBe("dark");
  fireEvent.press(screen.getByText("Tudo gratuito"));
  expect(screen.getByText("Desenvolvido por Samuel Sanches")).toBeTruthy();
});
