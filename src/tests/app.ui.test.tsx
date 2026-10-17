import React from "react";
import { Alert } from "react-native";
import { pickBackup } from "../integrations/native";
import { serializeBackup } from "../domain/backup";
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
test("new appointment uses freshly edited service values while preserving quantity", () => {
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
  fireEvent.press(screen.getByText("+ Manicure"));
  fireEvent.press(screen.getByText("Escolher serviços"));
  fireEvent.press(screen.getByText("Editar"));
  fireEvent.changeText(screen.getByLabelText("Preço"), "80");
  fireEvent.changeText(screen.getByLabelText("Duração em minutos"), "60");
  fireEvent.press(screen.getByText("Salvar"));
  fireEvent.press(screen.getByText("Confirmar seleção"));
  fireEvent.press(screen.getByText("Próximo"));
  fireEvent.press(screen.getByText("Salvar agendamento"));
  expect(r.list("appointments")[0]?.totalCents).toBe(16000);
  expect(r.list("appointments")[0]?.duration).toBe(120);
});
test("copying history returns to the existing wizard and saves back to agenda", () => {
  const r = repo();
  r.setPreferences({ onboarded: true });
  const c = r.saveCatalog("clients", {
    name: "Cliente Histórico",
    phone: "",
    notes: "",
    consent: false,
  });
  const s = r.saveCatalog("services", {
    name: "Serviço Histórico",
    priceCents: 2500,
    duration: 30,
    notes: "",
  });
  r.saveAppointment({
    clientId: c.id,
    services: [
      {
        serviceId: s.id,
        name: s.name,
        priceCents: s.priceCents,
        duration: 30,
        amount: 1,
      },
    ],
    startsAt: "2020-01-01T10:00:00Z",
    timezone: "UTC",
    discountCents: 0,
    payment: "pix",
    notes: "Copiada",
  });
  render(<AppRoot repository={r} />);
  fireEvent.press(screen.getByText("Novo agendamento"));
  fireEvent.press(screen.getByText("Copiar do histórico"));
  fireEvent.press(screen.getByText("Duplicar"));
  fireEvent.press(screen.getByText("Próximo"));
  fireEvent.press(screen.getByText("Próximo"));
  fireEvent.press(screen.getByText("Salvar agendamento"));
  expect(r.list("appointments")).toHaveLength(2);
  expect(screen.getByText("Novo agendamento")).toBeTruthy();
  expect(screen.queryByText("Próximo")).toBeNull();
  expect(screen.queryByText("Histórico e cópias")).toBeNull();
});

function confirmAlert(label: string) {
  const call = jest.mocked(Alert.alert).mock.calls.at(-1);
  const button = call?.[2]?.find((b) => b.text === label);
  expect(button?.onPress).toBeDefined();
  act(() => button?.onPress?.());
}
test("backup preview leaves data intact until confirmation, and recovery restores it", async () => {
  const r = repo(),
    incoming = repo();
  r.setPreferences({ onboarded: true });
  incoming.setPreferences({ onboarded: true });
  r.saveCatalog("clients", {
    name: "Cliente Original",
    phone: "",
    notes: "",
    consent: false,
  });
  incoming.saveCatalog("clients", {
    name: "Cliente Importada",
    phone: "",
    notes: "",
    consent: false,
  });
  jest
    .mocked(pickBackup)
    .mockResolvedValueOnce(serializeBackup(incoming.snapshot()));
  const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  render(<AppRoot repository={r} />);
  fireEvent.press(screen.getByText("Ajustes"));
  fireEvent.press(screen.getByText("Backup e restauração"));
  await act(async () => {
    fireEvent.press(screen.getByText("Importar backup"));
  });
  expect(screen.getByText("Prévia da restauração")).toBeTruthy();
  expect(r.list("clients")[0]?.name).toBe("Cliente Original");
  fireEvent.press(screen.getByText("Restaurar"));
  confirmAlert("Restaurar");
  expect(r.list("clients")[0]?.name).toBe("Cliente Importada");
  fireEvent.press(screen.getByText("Recuperar estado anterior à importação"));
  confirmAlert("Recuperar");
  expect(r.list("clients")[0]?.name).toBe("Cliente Original");
  alert.mockRestore();
});
test("details cancellation, reactivation, deletion and undo change persisted appointments", () => {
  const r = repo();
  r.setPreferences({ onboarded: true });
  const c = r.saveCatalog("clients", {
    name: "Cliente Detalhes",
    phone: "",
    notes: "",
    consent: false,
  });
  const s = r.saveCatalog("services", {
    name: "Manicure",
    priceCents: 5000,
    duration: 30,
    notes: "",
  });
  const a = r.saveAppointment({
    clientId: c.id,
    services: [
      {
        serviceId: s.id,
        name: s.name,
        priceCents: s.priceCents,
        duration: 30,
        amount: 1,
      },
    ],
    startsAt: new Date().toISOString(),
    timezone: "UTC",
    discountCents: 0,
    payment: "cash",
    notes: "",
  })[0]!;
  const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  render(<AppRoot repository={r} />);
  fireEvent.press(screen.getByText("Cliente Detalhes"));
  fireEvent.press(screen.getByText("Cancelar agendamento"));
  confirmAlert("Confirmar");
  expect(r.get("appointments", a.id)?.status).toBe("cancelled");
  fireEvent.press(screen.getByText("Reativar"));
  confirmAlert("Confirmar");
  expect(r.get("appointments", a.id)?.status).toBe("active");
  fireEvent.press(screen.getByText("Excluir"));
  confirmAlert("Excluir");
  expect(r.list("appointments")).toHaveLength(0);
  fireEvent.press(screen.getByText("Desfazer"));
  expect(r.list("appointments")).toHaveLength(1);
  alert.mockRestore();
});
