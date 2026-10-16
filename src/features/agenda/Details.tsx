import React, { useState } from "react";
import { Alert, Linking } from "react-native";
import { useApp, type Route } from "../../app/context";
import { Label, Button, Card, Page, Money } from "../../components/ui";
import { whatsapp } from "../../domain/rules";
import { dateLabel, timeLabel } from "./dates";
export function Details({ route }: { route: Route }) {
  const { repo, push, pop, p, run, notify } = useApp();
  const a = repo.get("appointments", route.id ?? "");
  const [preview, setPreview] = useState(false);
  if (!a || a.deletedAt)
    return (
      <Page>
        <Label>Agendamento não encontrado.</Label>
        <Button title="Retornar" onPress={pop} />
      </Page>
    );
  const c = repo.get("clients", a.clientId);
  const values: Record<string, string> = {
    cliente: a.clientName,
    data: dateLabel(a.startsAt, p),
    hora: timeLabel(a.startsAt, p),
    servicos: a.services.map((s) => s.name).join(", "),
  };
  const message = p.messageTemplate.replace(
    /\{(cliente|data|hora|servicos)\}/g,
    (_, key: string) => values[key] ?? "",
  );
  return (
    <Page>
      <Label title>{a.clientName}</Label>
      <Label
        muted
      >{`${dateLabel(a.startsAt, p)} · ${timeLabel(a.startsAt, p)} · ${a.duration} min`}</Label>
      <Card>
        <Label>{a.status === "active" ? "Ativo" : "Cancelado"}</Label>
        {a.services.map((s, i) => (
          <Label key={i}>{`${s.amount}× ${s.name}`}</Label>
        ))}
        <Money cents={a.totalCents} />
        <Label>{`Pagamento: ${a.payment}`}</Label>
        <Label>{a.notes || "Sem observações"}</Label>
        {c?.deletedAt && (
          <Label muted>Cliente arquivado; histórico preservado.</Label>
        )}
      </Card>
      <Button
        title="Editar"
        onPress={() => push({ screen: "wizard", id: a.id })}
      />
      <Button
        title="Duplicar"
        secondary
        onPress={() =>
          push({
            screen: "wizard",
            draft: { ...a, id: undefined, startsAt: new Date().toISOString() },
          })
        }
      />
      <Button
        title={a.status === "active" ? "Cancelar agendamento" : "Reativar"}
        secondary
        onPress={() =>
          Alert.alert(
            a.status === "active"
              ? "Cancelar atendimento?"
              : "Reativar atendimento?",
            "A disponibilidade e as notificações serão atualizadas.",
            [
              { text: "Voltar", style: "cancel" },
              {
                text: "Confirmar",
                onPress: () =>
                  run(() =>
                    repo.setStatus(
                      a.id,
                      a.status === "active" ? "cancelled" : "active",
                    ),
                  ),
              },
            ],
          )
        }
      />
      {a.seriesId && (
        <Button
          title="Cancelar esta e próximas da série"
          secondary
          onPress={() =>
            Alert.alert(
              "Cancelar série?",
              "Afeta esta e todas as ocorrências posteriores da mesma série.",
              [
                { text: "Voltar", style: "cancel" },
                {
                  text: "Confirmar",
                  onPress: () =>
                    run(() => repo.setStatus(a.id, "cancelled", true)),
                },
              ],
            )
          }
        />
      )}
      <Button
        title="Prévia do WhatsApp"
        secondary
        onPress={() => setPreview(!preview)}
      />
      {preview && (
        <Card>
          <Label>{message}</Label>
          <Label muted>
            A mensagem só será enviada por você no WhatsApp. Consentimento e
            telefone com DDI são necessários.
          </Label>
          <Button
            title="Abrir WhatsApp"
            onPress={() => {
              run(() => {
                const url = whatsapp(
                  c?.phone ?? "",
                  message,
                  c?.consent ?? false,
                );
                void Linking.openURL(url).catch(() =>
                  notify(
                    "Não foi possível abrir. Instale o WhatsApp ou use um navegador.",
                  ),
                );
              });
            }}
          />
        </Card>
      )}
      <Button
        title="Excluir"
        danger
        onPress={() =>
          Alert.alert(
            "Excluir agendamento?",
            "Você poderá desfazer logo após a exclusão.",
            [
              { text: "Voltar", style: "cancel" },
              {
                text: "Excluir",
                style: "destructive",
                onPress: () =>
                  run(() => {
                    repo.remove("appointments", a.id);
                    pop();
                    notify("Agendamento excluído.", () =>
                      repo.restore("appointments", a.id),
                    );
                  }),
              },
            ],
          )
        }
      />
    </Page>
  );
}
