import React, { useState, useMemo } from "react";
import { FlatList, View, Pressable } from "react-native";
import { useApp, zone, type Route } from "../../app/context";
import {
  Label,
  Button,
  Field,
  Card,
  Row,
  Money,
} from "../../components/ui";
import { normalize, localDateTime } from "../../domain/rules";
import { dateLabel, timeLabel, dayKey, nextDay } from "./dates";
import type { Appointment } from "../../domain/models";
export function AppointmentCard({
  a,
  copy = false,
  onCopy,
}: {
  a: Appointment;
  copy?: boolean;
  onCopy?: (a: Appointment) => void;
}) {
  const { push, p } = useApp();
  return (
    <Card>
      <Label
        muted
      >{`${dateLabel(a.startsAt, p)} · ${timeLabel(a.startsAt, p)} · ${a.status === "active" ? "Ativo" : "Cancelado"}`}</Label>
      <Button
        title={a.clientName}
        secondary
        onPress={() => push({ screen: "details", id: a.id })}
      />
      <Label>
        {a.services.map((s) => `${s.amount}× ${s.name}`).join(", ")}
      </Label>
      <Row>
        <Money cents={a.totalCents} />
        <Label muted>{`${a.duration} min`}</Label>
      </Row>
      {copy && (
        <Button
          title="Duplicar"
          onPress={() =>
            onCopy
              ? onCopy(a)
              : push({
                  screen: "wizard",
                  draft: {
                    ...a,
                    id: undefined,
                    startsAt: new Date().toISOString(),
                  },
                })
          }
        />
      )}
    </Card>
  );
}
import { Calendar } from "./Calendar";
import {
  timelineRows,
  weekDays,
  type TimelineRow,
} from "../../domain/calendar";
type Heading = { kind: "heading"; id: string; day: string; count: number };
export function Agenda({
  history = false,
  selectTemplate,
}: {
  history?: boolean;
  selectTemplate?: (a: Appointment) => void;
}) {
  const { repo, p, run, push, pop, colors, revision } = useApp();
  const [date, setDate] = useState(dayKey(new Date())),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState("all"),
    [expanded, setExpanded] = useState(false),
    [search, setSearch] = useState(false);
  const all = useMemo(() => repo.list("appointments"), [repo, revision]);
  const byId = useMemo(() => new Map(all.map((a) => [a.id, a])), [all]);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of all)
      if (a.status === "active")
        m.set(dayKey(a.startsAt), (m.get(dayKey(a.startsAt)) ?? 0) + 1);
    return m;
  }, [all]);
  const matches = (a: Appointment) =>
    (status === "all" || a.status === status) &&
    normalize(
      [a.clientName, ...a.services.map((s) => s.name), a.notes].join(" "),
    ).includes(normalize(query));
  const selected = all.filter(
    (a) => dayKey(a.startsAt) === date && a.status === "active",
  );
  const dailyTotal = selected.reduce((n, a) => n + a.totalCents, 0);
  const blank = (start?: string) =>
    push({
      screen: "wizard",
      draft: {
        clientId: "",
        services: [],
        startsAt: start ?? localDateTime(date, "09:00", zone()),
        timezone: zone(),
        discountCents: 0,
        payment: "credit-card",
        notes: "",
      },
    });
  const shiftMonth = (n: number) => {
    const d = new Date(date + "T12:00:00");
    d.setDate(1);
    d.setMonth(d.getMonth() + n);
    setDate(dayKey(d));
  };
  let rows: (TimelineRow | Heading)[];
  if (history || query)
    rows = all
      .filter(matches)
      .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
      .map((a) => ({
        kind: "appointment",
        id: a.id,
        startsAt: a.startsAt,
        minute: 0,
      }));
  else if (p.view === "week")
    rows = weekDays(date).flatMap((day) => {
      const entries = all
        .filter((a) => dayKey(a.startsAt) === day && matches(a))
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
      return [
        {
          kind: "heading",
          id: "day-" + day,
          day,
          count: entries.length,
        } as Heading,
        ...entries.map((a) => ({
          kind: "appointment" as const,
          id: a.id,
          startsAt: a.startsAt,
          minute: 0,
        })),
      ];
    });
  else
    rows = timelineRows(date, all, zone()).filter((row) =>
      row.kind === "free" ? status !== "cancelled" : matches(byId.get(row.id)!),
    );
  const chip = (title: string, onPress: () => void, active = false) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{
        minHeight: 48,
        paddingHorizontal: 10,
        minWidth: 48,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 14,
        backgroundColor: active ? colors.primary : colors.card,
      }}
    >
      <Label
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: active ? colors.onPrimary : colors.ink,
        }}
      >
        {title}
      </Label>
    </Pressable>
  );
  const header = (
    <View style={{ gap: 8, paddingBottom: 12 }}>
      {history ? (
        <Label title>Histórico e cópias</Label>
      ) : (
        <>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir calendário mensal"
              onPress={() => setExpanded(!expanded)}
              style={{ minHeight: 48, justifyContent: "center", flex: 1 }}
            >
              <Label
                style={{
                  fontSize: 23,
                  fontWeight: "700",
                  textTransform: "capitalize",
                }}
              >
                {new Date(date + "T12:00:00").toLocaleDateString(p.lang, {
                  month: "long",
                  year: "numeric",
                }) + " ⌄"}
              </Label>
            </Pressable>
            {chip("‹", () =>
              expanded
                ? shiftMonth(-1)
                : setDate(nextDay(date, p.view === "week" ? -7 : -1)),
            )}
            {chip("›", () =>
              expanded
                ? shiftMonth(1)
                : setDate(nextDay(date, p.view === "week" ? 7 : 1)),
            )}
          </View>
          <Calendar
            selected={date}
            expanded={expanded}
            counts={counts}
            onSelect={(day) => {
              setDate(day);
              setExpanded(false);
            }}
          />
          <View
            style={{
              flexDirection: "row",
              gap: 6,
              justifyContent: "space-between",
            }}
          >
            {chip("Hoje", () => setDate(dayKey(new Date())))}
            {chip("Amanhã", () => setDate(nextDay(dayKey(new Date()), 1)))}
            {chip(
              "Dia",
              () => run(() => repo.setPreferences({ view: "day" })),
              p.view === "day",
            )}
            {chip(
              "Semana",
              () => run(() => repo.setPreferences({ view: "week" })),
              p.view === "week",
            )}
            {chip("Buscar", () => setSearch(!search), search)}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Estatísticas"
            onPress={() => push({ screen: "stats" })}
            style={{
              borderRadius: 16,
              padding: 14,
              backgroundColor: colors.accent,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View>
              <Label style={{ fontSize: 12, fontWeight: "600" }}>SEU DIA</Label>
              <Label style={{ fontWeight: "700" }}>
                {selected.length + " atendimentos"}
              </Label>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Money cents={dailyTotal} />
              <Label muted style={{ fontSize: 11 }}>
                receita agendada · ver estatísticas
              </Label>
            </View>
          </Pressable>
        </>
      )}
      {(search || history) && (
        <Field
          label="Buscar em tudo"
          value={query}
          onChangeText={setQuery}
          placeholder="Clientes, serviços ou observações"
        />
      )}
      {!!query.trim() && <GlobalResults query={query} />}
      <View style={{ flexDirection: "row", gap: 6 }}>
        {[
          ["all", "Todos"],
          ["active", "Ativos"],
          ["cancelled", "Cancelados"],
        ].map(([v, t]) => (
          <View key={v}>{chip(t!, () => setStatus(v!), status === v)}</View>
        ))}
      </View>
    </View>
  );
  return (
    <View style={{ flex: 1 }}>
      <FlatList
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        data={rows}
        keyExtractor={(r) => r.id}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <Label style={{ fontSize: 20, fontWeight: "700" }}>
              Agenda sem resultados
            </Label>
            <Label muted>Escolha outra data ou ajuste sua busca.</Label>
          </View>
        }
        renderItem={({ item }) => {
          if (item.kind === "heading")
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={"Abrir dia " + item.day}
                onPress={() => {
                  setDate(item.day);
                  run(() => repo.setPreferences({ view: "day" }));
                }}
                style={{
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderColor: colors.border,
                  marginTop: 8,
                }}
              >
                <Label style={{ fontSize: 18, fontWeight: "700" }}>
                  {new Date(item.day + "T12:00:00").toLocaleDateString(p.lang, {
                    weekday: "long",
                    day: "numeric",
                    month: "short",
                  })}
                </Label>
                <Label muted style={{ fontSize: 13 }}>
                  {item.count
                    ? item.count + " atendimentos"
                    : "Dia livre · toque para agendar"}
                </Label>
              </Pressable>
            );
          if (item.kind === "free")
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={"Agendar às " + timeLabel(item.startsAt, p)}
                onPress={() => blank(item.startsAt)}
                style={{
                  flexDirection: "row",
                  minHeight: 64,
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <Label muted style={{ fontSize: 12, width: 46 }}>
                  {timeLabel(item.startsAt, p)}
                </Label>
                <View
                  style={{
                    flex: 1,
                    borderTopWidth: 1,
                    borderStyle: "dashed",
                    borderColor: colors.border,
                    paddingVertical: 16,
                  }}
                >
                  <Label muted style={{ fontSize: 13 }}>
                    + Horário livre
                  </Label>
                </View>
              </Pressable>
            );
          const a = byId.get(item.id)!;
          if (history)
            return (
              <AppointmentCard
                a={a}
                copy
                onCopy={
                  selectTemplate
                    ? (value) => {
                        selectTemplate(value);
                        pop();
                      }
                    : undefined
                }
              />
            );
          return (
            <View style={{ flexDirection: "row", gap: 14, marginVertical: 7 }}>
              <Label muted style={{ fontSize: 12, width: 46, paddingTop: 16 }}>
                {timeLabel(a.startsAt, p)}
              </Label>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={a.clientName}
                onPress={() => push({ screen: "details", id: a.id })}
                style={{
                  flex: 1,
                  borderRadius: 16,
                  padding: 16,
                  borderLeftWidth: 4,
                  borderLeftColor:
                    a.status === "active" ? colors.primary : colors.border,
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <Label style={{ fontWeight: "700", fontSize: 17, flex: 1 }}>
                    {a.clientName}
                  </Label>
                  <Label muted style={{ fontSize: 11 }}>
                    {a.status === "active" ? "CONFIRMADO" : "CANCELADO"}
                  </Label>
                </View>
                <Label muted style={{ fontSize: 13 }}>
                  {a.services.map((s) => s.name).join(" · ")}
                </Label>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 10,
                  }}
                >
                  <Label muted style={{ fontSize: 12 }}>
                    {a.duration + " min · " + a.payment}
                  </Label>
                  <Label style={{ fontWeight: "700", fontSize: 14 }}>
                    {p.hideMoney
                      ? "••••"
                      : new Intl.NumberFormat(p.lang, {
                          style: "currency",
                          currency: p.currency,
                        }).format(a.totalCents / 100)}
                  </Label>
                </View>
              </Pressable>
            </View>
          );
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 14,
          right: 16,
          left: history ? 16 : undefined,
          elevation: 5,
          shadowColor: "#000",
          shadowOpacity: 0.16,
          shadowRadius: 8,
        }}
      >
        <Button title="Novo agendamento" onPress={() => blank()} />
      </View>
    </View>
  );
}
function GlobalResults({ query }: { query: string }) {
  const { repo, push } = useApp();
  return (
    <Card>
      {(["clients", "services"] as const).flatMap((kind) =>
        repo
          .list(kind)
          .filter((x) => normalize(x.name).includes(normalize(query)))
          .slice(0, 5)
          .map((x) => (
            <Button
              key={x.id}
              secondary
              title={`${kind === "clients" ? "Cliente" : "Serviço"} · ${x.name}`}
              onPress={() => push({ screen: "form", kind, id: x.id })}
            />
          )),
      )}
    </Card>
  );
}
export const historyRoute: Route = { screen: "history" };
