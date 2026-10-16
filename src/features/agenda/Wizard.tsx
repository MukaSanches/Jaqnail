import React, { useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useApp, zone, type Route } from "../../app/context";
import {
  Page,
  Label,
  Card,
  Button,
  Row,
  Field,
  Money,
  Toggle,
} from "../../components/ui";
import { cost, money, slots, localDateTime } from "../../domain/rules";
import type { Line, Appointment } from "../../domain/models";
import { dateLabel, timeLabel, dayKey } from "./dates";
export function Wizard({ route }: { route: Route }) {
  const { repo, run, push, pop, p, notify } = useApp();
  const old = route.id ? repo.get("appointments", route.id) : undefined;
  const initial = old ?? route.draft;
  const [step, setStep] = useState(0),
    [clientId, setClientId] = useState(initial?.clientId ?? ""),
    [lines, setLines] = useState<Line[]>(initial?.services ?? []),
    [date, setDate] = useState(new Date(initial?.startsAt ?? Date.now())),
    [discount, setDiscount] = useState(
      ((initial?.discountCents ?? 0) / 100).toFixed(2),
    ),
    [payment, setPayment] = useState<Appointment["payment"]>(
      initial?.payment ?? "credit-card",
    ),
    [notes, setNotes] = useState(initial?.notes ?? ""),
    [repeat, setRepeat] = useState(false),
    [count, setCount] = useState("2"),
    [picker, setPicker] = useState<"date" | "time" | null>(null);
  const client = repo.get("clients", clientId);
  let totals: ReturnType<typeof cost> | null = null;
  try {
    totals = cost(lines, money(discount));
  } catch {
    /* invalid draft is shown and rejected on next/save */
  }
  const choose = () =>
    push({
      screen: "catalog",
      kind: "services",
      selectedIds: lines.map((x) => x.serviceId),
      selectServices: (services) =>
        setLines(
          services.map(
            (s) =>
              lines.find((l) => l.serviceId === s.id) ?? {
                serviceId: s.id,
                name: s.name,
                priceCents: s.priceCents,
                duration: s.duration,
                amount: 1,
              },
          ),
        ),
    });
  const next = () =>
    run(() => {
      if (step === 0 && !client) throw new Error("Selecione um cliente.");
      if (step === 1) cost(lines, money(discount));
      setStep(step + 1);
    });
  const save = () =>
    run(() => {
      repo.saveAppointment(
        {
          id: old?.id,
          clientId,
          services: lines,
          startsAt: date.toISOString(),
          timezone: initial?.timezone ?? zone(),
          discountCents: money(discount),
          payment,
          notes,
        },
        repeat && !old ? Number(count) : 1,
      );
      pop();
      notify("Agendamento salvo.");
    });
  return (
    <Page>
      <Label muted>{`AGENDAMENTO · ${step + 1} DE 3`}</Label>
      <Label title>{["Cliente", "Serviços", "Confirmação"][step]}</Label>
      {step === 0 && (
        <>
          <Card>
            <Label>{client?.name ?? "Escolha quem você vai atender."}</Label>
            <Button
              title="Selecionar cliente"
              onPress={() =>
                push({
                  screen: "catalog",
                  kind: "clients",
                  selectClient: (c) => setClientId(c.id),
                })
              }
            />
          </Card>
          <Card>
            <Label>Data e horário</Label>
            <Button
              title={dateLabel(date, p)}
              secondary
              onPress={() => setPicker("date")}
            />
            <Button
              title={timeLabel(date, p)}
              secondary
              onPress={() => setPicker("time")}
            />
            <Label muted>{zone()}</Label>
          </Card>
          <Button
            title="Copiar do histórico"
            secondary
            onPress={() => push({ screen: "history" })}
          />
        </>
      )}
      {picker && (
        <DateTimePicker
          value={date}
          mode={picker}
          is24Hour={p.hour24}
          onChange={(_, d) => {
            const mode = picker;
            setPicker(null);
            if (d)
              run(() => {
                const candidate = new Date(date);
                if (mode === "date")
                  candidate.setFullYear(
                    d.getFullYear(),
                    d.getMonth(),
                    d.getDate(),
                  );
                else candidate.setHours(d.getHours(), d.getMinutes(), 0, 0);
                const iso = localDateTime(
                  dayKey(candidate),
                  `${String(candidate.getHours()).padStart(2, "0")}:${String(candidate.getMinutes()).padStart(2, "0")}`,
                  zone(),
                );
                setDate(new Date(iso));
              });
          }}
        />
      )}
      {step === 1 && (
        <>
          <Button title="Escolher serviços" onPress={choose} />
          {lines.map((l, i) => (
            <Card key={l.serviceId}>
              <Label>{l.name}</Label>
              <Money cents={l.priceCents} />
              <Label>{`${l.duration} min por unidade`}</Label>
              <Row>
                <Button
                  title={`− ${l.name}`}
                  secondary
                  disabled={l.amount <= 1}
                  onPress={() =>
                    setLines(
                      lines.map((x, j) =>
                        j === i ? { ...x, amount: x.amount - 1 } : x,
                      ),
                    )
                  }
                />
                <Label>{`${l.amount} unidade(s)`}</Label>
                <Button
                  title={`+ ${l.name}`}
                  secondary
                  disabled={l.amount >= 100}
                  onPress={() =>
                    setLines(
                      lines.map((x, j) =>
                        j === i ? { ...x, amount: x.amount + 1 } : x,
                      ),
                    )
                  }
                />
              </Row>
              <Button
                title={`Remover ${l.name}`}
                secondary
                onPress={() => setLines(lines.filter((_, j) => i !== j))}
              />
            </Card>
          ))}
        </>
      )}
      {step === 2 && (
        <>
          <Card>
            <Label title>{client?.name}</Label>
            <Label>{`${dateLabel(date, p)} · ${timeLabel(date, p)}`}</Label>
            {lines.map((l) => (
              <Label key={l.serviceId}>{`${l.amount}× ${l.name}`}</Label>
            ))}
            <Label>{`${totals?.duration ?? 0} minutos`}</Label>
            <Label>Subtotal</Label>
            <Money cents={totals?.subtotalCents ?? 0} />
            <Field
              label="Desconto"
              value={discount}
              onChangeText={setDiscount}
              keyboardType="decimal-pad"
            />
            <Label>Total</Label>
            <Money cents={totals?.totalCents ?? 0} />
          </Card>
          <Label>Pagamento</Label>
          <Row>
            {(
              [
                ["credit-card", "Crédito"],
                ["debit-card", "Débito"],
                ["pix", "Pix"],
                ["cash", "Dinheiro"],
                ["other", "Outro"],
              ] as const
            ).map(([v, t]) => (
              <Button
                key={v}
                title={t}
                secondary={payment !== v}
                onPress={() => setPayment(v)}
              />
            ))}
          </Row>
          <Field
            label="Observações"
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={2000}
          />
          {!old && (
            <>
              <Toggle
                label="Repetir semanalmente"
                value={repeat}
                onChange={setRepeat}
              />
              {repeat && (
                <>
                  <Field
                    label="Ocorrências (inclui esta)"
                    value={count}
                    onChangeText={setCount}
                    keyboardType="number-pad"
                  />
                  <Label muted>
                    De 1 a 52. Se houver conflito em qualquer semana, nada será
                    gravado.
                  </Label>
                </>
              )}
            </>
          )}
          <Label>Alternativas de horário</Label>
          {slots(
            dayKey(date),
            totals?.duration ?? 60,
            repo.list("appointments"),
            zone(),
            old?.id,
          ).map((s) => (
            <Button
              key={s}
              title={timeLabel(s, p)}
              secondary
              onPress={() => setDate(new Date(s))}
            />
          ))}
          <Button title="Salvar agendamento" onPress={save} />
        </>
      )}
      {step < 2 && <Button title="Próximo" onPress={next} />}
      <Button
        title="Voltar"
        secondary
        onPress={() => (step > 0 ? setStep(step - 1) : pop())}
      />
    </Page>
  );
}
