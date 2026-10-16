import React, { useState } from "react";
import { FlatList } from "react-native";
import { useApp, zone, type Route } from "../../app/context";
import { Button, Label, Card, Row, Money, Page } from "../../components/ui";
import { stats } from "../../domain/rules";
import { AppointmentCard } from "../agenda/Agenda";
import { dayKey } from "../agenda/dates";
import { exportCSV } from "../../integrations/native";
export function Statistics({ route }: { route: Route }) {
  const { repo, p, push, run, notify } = useApp();
  const [year, setYear] = useState(route.year ?? new Date().getFullYear());
  const month = route.month ?? null,
    all = repo.list("appointments"),
    summary = stats(all, year, month, zone());
  const items = month
    ? all
        .filter((a) =>
          dayKey(a.startsAt).startsWith(
            `${year}-${String(month).padStart(2, "0")}`,
          ),
        )
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    : [];
  return (
    <Page scroll={false}>
      <FlatList
        data={items}
        keyExtractor={(a) => a.id}
        ListHeaderComponent={
          <>
            <Label title>
              {month
                ? new Intl.DateTimeFormat(p.lang, { month: "long" }).format(
                    new Date(year, month - 1, 1),
                  )
                : "Estatísticas"}
            </Label>
            <Row>
              <Button
                title="Ano anterior"
                secondary
                onPress={() => setYear(year - 1)}
              />
              <Label>{String(year)}</Label>
              <Button
                title="Próximo ano"
                secondary
                onPress={() => setYear(year + 1)}
              />
            </Row>
            <Card>
              <Label muted>Receita agendada · somente ativos</Label>
              <Money cents={summary.revenueCents} />
              <Label>{`${summary.count} atendimentos · ${summary.clients} clientes únicos`}</Label>
              <Button
                title={p.hideMoney ? "Mostrar valores" : "Ocultar valores"}
                secondary
                onPress={() =>
                  run(() => repo.setPreferences({ hideMoney: !p.hideMoney }))
                }
              />
            </Card>
            <Button
              title="Exportar CSV"
              secondary
              onPress={() => {
                void exportCSV("estatisticas", [
                  ["ano", "mes", "atendimentos", "clientes", "centavos"],
                  ...Array.from({ length: 12 }, (_, i) => {
                    const s = stats(all, year, i + 1, zone());
                    return [year, i + 1, s.count, s.clients, s.revenueCents];
                  }),
                ]).catch((e) => notify(String(e)));
              }}
            />
            {!month &&
              Array.from({ length: 12 }, (_, i) => {
                const s = stats(all, year, i + 1, zone());
                return (
                  <Card key={i}>
                    <Button
                      secondary
                      title={new Intl.DateTimeFormat(p.lang, {
                        month: "long",
                      }).format(new Date(year, i, 1))}
                      onPress={() =>
                        push({ screen: "stats", year, month: i + 1 })
                      }
                    />
                    <Money cents={s.revenueCents} />
                    <Label muted>{`${s.count} atendimentos`}</Label>
                  </Card>
                );
              })}
          </>
        }
        renderItem={({ item }) => <AppointmentCard a={item} />}
      />
    </Page>
  );
}
