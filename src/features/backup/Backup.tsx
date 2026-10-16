import React, { useState } from "react";
import { Alert } from "react-native";
import { useApp } from "../../app/context";
import { Label, Page, Button, Card, Field } from "../../components/ui";
import type { Snapshot } from "../../domain/models";
import { parseBackup, importLegacy } from "../../domain/backup";
import { shareBackup, pickBackup, exportCSV } from "../../integrations/native";
export function Backup() {
  const { repo, p, run, notify } = useApp();
  const [preview, setPreview] = useState<Snapshot | null>(null),
    [busy, setBusy] = useState(false),
    [days, setDays] = useState(String(p.backupDays));
  const action = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      run(() => {});
    } catch (e) {
      notify(e instanceof Error ? e.message : "Falha na operação.");
    } finally {
      setBusy(false);
    }
  };
  const pick = (legacy = false) =>
    void action(async () => {
      const text = await pickBackup();
      if (text !== null)
        setPreview(legacy ? importLegacy(JSON.parse(text)) : parseBackup(text));
    });
  return (
    <Page>
      <Label title>Backup e restauração</Label>
      <Card>
        <Label>
          Seus dados são locais. Guarde uma cópia em um local privado.
        </Label>
        <Label muted>
          {p.lastBackup
            ? `Compartilhamento aberto em ${new Date(p.lastBackup).toLocaleString()}`
            : "Nenhum backup exportado."}
        </Label>
        <Label muted>
          Confirme que o arquivo foi salvo no destino escolhido. O Android não
          informa se você concluiu ou cancelou o compartilhamento.
        </Label>
      </Card>
      <Button
        title={busy ? "Processando…" : "Exportar backup"}
        disabled={busy}
        onPress={() => void action(() => shareBackup(repo))}
      />
      <Button
        title="Importar backup"
        secondary
        disabled={busy}
        onPress={() => pick()}
      />
      <Button
        title="Importar formato legado documentado"
        secondary
        disabled={busy}
        onPress={() => pick(true)}
      />
      <Label muted>
        O adaptador legado aceita apenas o esquema documentado v1;
        compatibilidade com exportações reais do AppNail ainda não foi
        comprovada.
      </Label>
      {preview && (
        <Card>
          <Label title>Prévia da restauração</Label>
          <Label>{`${preview.clients.length} clientes · ${preview.services.length} serviços · ${preview.materials.length} materiais · ${preview.appointments.length} agendamentos`}</Label>
          <Label>
            Substitui os dados atuais. Uma cópia interna anterior ficará
            disponível para recuperação.
          </Label>
          <Button
            title="Restaurar"
            danger
            onPress={() =>
              Alert.alert(
                "Substituir todos os dados?",
                "Revise as contagens e confirme. Recomenda-se exportar antes.",
                [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Restaurar",
                    onPress: () =>
                      run(() => {
                        repo.importSnapshot(preview);
                        setPreview(null);
                        notify("Restauração concluída.");
                      }),
                  },
                ],
              )
            }
          />
          <Button title="Cancelar" secondary onPress={() => setPreview(null)} />
        </Card>
      )}
      <Button
        title="Recuperar estado anterior à importação"
        secondary
        onPress={() =>
          Alert.alert(
            "Recuperar estado anterior?",
            "Substitui alterações feitas depois da última importação.",
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Recuperar",
                onPress: () =>
                  run(() => {
                    repo.recover();
                    notify("Estado anterior recuperado.");
                  }),
              },
            ],
          )
        }
      />
      <Field
        label="Lembrar a cada quantos dias?"
        value={days}
        onChangeText={setDays}
        keyboardType="number-pad"
      />
      <Button
        title="Salvar intervalo"
        secondary
        onPress={() =>
          run(() => repo.setPreferences({ backupDays: Number(days) }))
        }
      />
      <Button
        title="Exportar clientes CSV"
        secondary
        onPress={() =>
          void action(() =>
            exportCSV("clientes", [
              ["id", "nome", "telefone", "observacoes"],
              ...repo
                .list("clients")
                .map((c) => [c.id, c.name, c.phone, c.notes]),
            ]),
          )
        }
      />
      <Button
        title="Exportar agendamentos CSV"
        secondary
        onPress={() =>
          void action(() =>
            exportCSV("agendamentos", [
              [
                "id",
                "cliente",
                "inicio_ISO",
                "fuso",
                "status",
                "total_centavos",
                "moeda",
              ],
              ...repo
                .list("appointments")
                .map((a) => [
                  a.id,
                  a.clientName,
                  a.startsAt,
                  a.timezone,
                  a.status,
                  a.totalCents,
                  p.currency,
                ]),
            ]),
          )
        }
      />
      <Label title>Histórico de backups</Label>
      {repo.backupHistory().map((h) => (
        <Label
          key={h.id}
        >{`${new Date(h.created_at).toLocaleString()} · ${h.kind}`}</Label>
      ))}
    </Page>
  );
}
