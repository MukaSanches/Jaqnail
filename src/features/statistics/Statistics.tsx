import React, { useState, useMemo } from "react";
import { FlatList, View, Pressable } from "react-native";
import { useApp, zone, type Route } from "../../app/context";
import { Button, Label, Card, Row, Money, Page } from "../../components/ui";
import { stats } from "../../domain/rules";
import { AppointmentCard } from "../agenda/Agenda";
import { dayKey } from "../agenda/dates";
import { exportCSV } from "../../integrations/native";
export function Statistics({ route }: { route: Route }) {
  const { repo, p, push, run, notify, revision, colors } = useApp();
  const [year, setYear] = useState(route.year ?? new Date().getFullYear());
  const all = useMemo(() => repo.list("appointments"), [repo, revision]);
  const month = route.month ?? null;
  const summary = useMemo(
    () => stats(all, year, month, zone()),
    [all, year, month],
  );
  const monthly = useMemo(
    () => Array.from({ length: 12 }, (_, i) => stats(all, year, i + 1, zone())),
    [all, year],
  );
  const peak = Math.max(1, ...monthly.map((s) => s.revenueCents));
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
            {!month && (
              <View style={{ paddingVertical: 12, gap: 4 }}>
                <Label style={{ fontWeight: "700", fontSize: 18 }}>
                  Evolução mensal
                </Label>
                <Label muted style={{ fontSize: 12 }}>
                  Toque em um mês para ver os atendimentos
                </Label>
                {monthly.map((s, i) => (
                  <Pressable
                    key={i}
                    accessibilityRole="button"
                    accessibilityLabel={new Intl.DateTimeFormat(p.lang, {
                      month: "long",
                    }).format(new Date(year, i, 1))}
                    onPress={() =>
                      push({ screen: "stats", year, month: i + 1 })
                    }
                    style={{
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderColor: colors.border,
                      minHeight: 64,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Label
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          textTransform: "capitalize",
                        }}
                      >
                        {new Intl.DateTimeFormat(p.lang, {
                          month: "short",
                        }).format(new Date(year, i, 1))}
                      </Label>
                      <Label muted style={{ fontSize: 12 }}>
                        {s.count + " atendimentos"}
                      </Label>
                      <Label style={{ fontWeight: "700", fontSize: 14 }}>
                        {p.hideMoney
                          ? "••••"
                          : new Intl.NumberFormat(p.lang, {
                              style: "currency",
                              currency: p.currency,
                            }).format(s.revenueCents / 100)}
                      </Label>
                    </View>
                    {!p.hideMoney && (
                      <View
                        style={{
                          height: 5,
                          borderRadius: 5,
                          backgroundColor: colors.border,
                          marginTop: 9,
                        }}
                      >
                        <View
                          style={{
                            height: 5,
                            borderRadius: 5,
                            width: `${(s.revenueCents / peak) * 100}%`,
                            backgroundColor: colors.primary,
                          }}
                        />
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </>
        }
        renderItem={({ item }) => <AppointmentCard a={item} />}
      />
    </Page>
  );
}
