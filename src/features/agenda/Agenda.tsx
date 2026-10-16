import React, { useState } from "react";
import { FlatList, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useApp, zone, type Route } from "../../app/context";
import {
  Label,
  Button,
  Field,
  Card,
  Row,
  Money,
  Empty,
  Page,
} from "../../components/ui";
import { normalize, slots, stats } from "../../domain/rules";
import { dateLabel, timeLabel, dayKey, nextDay } from "./dates";
import type { Appointment } from "../../domain/models";
export function AppointmentCard({
  a,
  copy = false,
}: {
  a: Appointment;
  copy?: boolean;
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
            push({
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
export function Agenda({ history = false }: { history?: boolean }) {
  const { repo, p, run, push } = useApp();
  const [date, setDate] = useState(dayKey(new Date())),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState("all"),
    [picker, setPicker] = useState(false);
  const all = repo.list("appointments");
  const days = p.view === "week" ? 7 : 1;
  const items = all
    .filter(
      (a) =>
        (history ||
          query ||
          (dayKey(a.startsAt) >= date &&
            dayKey(a.startsAt) < nextDay(date, days))) &&
        (status === "all" || a.status === status) &&
        normalize(
          [a.clientName, ...a.services.map((s) => s.name), a.notes].join(" "),
        ).includes(normalize(query)),
    )
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const today = stats(
    all,
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)),
    zone(),
  );
  const blank = (start?: string) =>
    push({
      screen: "wizard",
      draft: start
        ? {
            clientId: "",
            services: [],
            startsAt: start,
            timezone: zone(),
            discountCents: 0,
            payment: "credit-card",
            notes: "",
          }
        : undefined,
    });
  const header = (
    <>
      <Label title>
        {history ? "Histórico e cópias" : "Seu dia, com leveza."}
      </Label>
      <Label muted>
        {history
          ? "Busque um atendimento para revisar ou copiar."
          : "JAQNAIL · SEU ESTÚDIO ORGANIZADO"}
      </Label>
      <Field label="Buscar em tudo" value={query} onChangeText={setQuery} />
      {query.trim() && <GlobalResults query={query} />}
      <Button title="Novo agendamento" onPress={() => blank()} />
      {!history && (
        <>
          <Row>
            <Button
              secondary
              title="‹"
              onPress={() => setDate(nextDay(date, -days))}
            />
            <Button
              secondary
              title={dateLabel(new Date(date + "T12:00:00"), p)}
              onPress={() => setPicker(true)}
            />
            <Button
              secondary
              title="›"
              onPress={() => setDate(nextDay(date, days))}
            />
          </Row>
          {picker && (
            <DateTimePicker
              value={new Date(date + "T12:00:00")}
              mode="date"
              onChange={(_, d) => {
                setPicker(false);
                if (d) setDate(dayKey(d));
              }}
            />
          )}
          <Row>
            <Button
              secondary
              title="Hoje"
              onPress={() => setDate(dayKey(new Date()))}
            />
            <Button
              secondary
              title="Amanhã"
              onPress={() => setDate(nextDay(dayKey(new Date()), 1))}
            />
            <Button
              title={p.view === "day" ? "Semana" : "Dia"}
              secondary
              onPress={() =>
                run(() =>
                  repo.setPreferences({
                    view: p.view === "day" ? "week" : "day",
                  }),
                )
              }
            />
          </Row>
          {p.view === "week" && (
            <Row>
              {Array.from({ length: 7 }, (_, i) => (
                <Button
                  key={i}
                  secondary
                  title={nextDay(date, i).slice(8)}
                  onPress={() => {
                    setDate(nextDay(date, i));
                    run(() => repo.setPreferences({ view: "day" }));
                  }}
                />
              ))}
            </Row>
          )}
          <Card>
            <Label muted>Resumo do mês · atendimentos ativos</Label>
            <Row>
              <Money cents={today.revenueCents} />
              <Label>{`${today.count} atendimentos`}</Label>
            </Row>
            <Button
              title="Estatísticas"
              secondary
              onPress={() => push({ screen: "stats" })}
            />
          </Card>
        </>
      )}
      <Row>
        {[
          ["all", "Todos"],
          ["active", "Ativos"],
          ["cancelled", "Cancelados"],
        ].map(([v, t]) => (
          <Button
            key={v}
            title={t!}
            secondary={status !== v}
            onPress={() => setStatus(v!)}
          />
        ))}
      </Row>
    </>
  );
  return (
    <Page scroll={false}>
      <FlatList
        data={items}
        keyExtractor={(a) => a.id}
        ListHeaderComponent={header}
        ListEmptyComponent={<Empty text="Nenhum atendimento neste período" />}
        renderItem={({ item }) => <AppointmentCard a={item} copy={history} />}
        ListFooterComponent={
          !history && !query ? (
            <View>
              <Label title>Horários livres</Label>
              <Label muted>Exemplos para 60 minutos · 08h–21h</Label>
              {slots(date, 60, all, zone()).map((start) => (
                <Button
                  key={start}
                  title={`${timeLabel(start, p)} · Agendar`}
                  secondary
                  onPress={() => blank(start)}
                />
              ))}
              {slots(date, 60, all, zone()).length === 0 && (
                <Label>Nenhum horário livre de 60 minutos neste dia.</Label>
              )}
            </View>
          ) : null
        }
      />
    </Page>
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
