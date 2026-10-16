import React, { useState } from "react";
import { FlatList, Alert } from "react-native";
import { useApp, type Route } from "../../app/context";
import {
  Page,
  Field,
  Button,
  Card,
  Label,
  Row,
  Toggle,
  Empty,
  Money,
} from "../../components/ui";
import { normalize, money, stockState } from "../../domain/rules";
import type { Client, Service, Material } from "../../domain/models";
const singular = {
  clients: "cliente",
  services: "serviço",
  materials: "material",
};
export function CatalogList({ route }: { route: Route }) {
  const { repo, push, pop } = useApp();
  const kind = route.kind ?? "clients";
  const [query, setQuery] = useState(""),
    [selected, setSelected] = useState<string[]>(route.selectedIds ?? []);
  const items = repo
    .list(kind)
    .filter((x) => normalize(x.name).includes(normalize(query)))
    .sort((a, b) => a.name.localeCompare(b.name));
  const add = () =>
    push({
      screen: "form",
      kind,
      afterSave: (id) => {
        if (route.selectClient) {
          const c = repo.get("clients", id);
          if (c) {
            route.selectClient(c);
            pop();
          }
        }
      },
    });
  return (
    <Page scroll={false}>
      <Field
        label="Buscar"
        value={query}
        onChangeText={setQuery}
        testID={`${kind}-search`}
      />
      <Button title={`Adicionar ${singular[kind]}`} onPress={add} />
      <FlatList
        data={items}
        keyExtractor={(x) => x.id}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Empty />}
        renderItem={({ item }) => (
          <Card>
            <Button
              secondary
              title={item.name}
              onPress={() => {
                if (route.selectClient) {
                  route.selectClient(item as Client);
                  pop();
                } else if (route.selectServices)
                  setSelected(
                    selected.includes(item.id)
                      ? selected.filter((x) => x !== item.id)
                      : [...selected, item.id],
                  );
                else push({ screen: "form", kind, id: item.id });
              }}
            />
            {kind === "clients" && (
              <Label muted>{(item as Client).phone || "Sem telefone"}</Label>
            )}
            {kind === "services" && (
              <>
                <Money cents={(item as Service).priceCents} />
                <Label
                  muted
                >{`${(item as Service).duration} min${selected.includes(item.id) ? " · Selecionado ✓" : ""}`}</Label>
              </>
            )}
            {kind === "materials" && <Stock item={item as Material} />}
            <Label
              muted
            >{`${items.length} ${kind === "clients" ? "clientes" : kind === "services" ? "serviços" : "materiais"} cadastrados`}</Label>
            {(route.selectClient || route.selectServices) && (
              <Button
                title="Editar"
                secondary
                onPress={() => push({ screen: "form", kind, id: item.id })}
              />
            )}
          </Card>
        )}
      />
      {route.selectServices && (
        <Button
          title="Confirmar seleção"
          onPress={() => {
            route.selectServices?.(
              repo.list("services").filter((s) => selected.includes(s.id)),
            );
            pop();
          }}
        />
      )}
    </Page>
  );
}
function Stock({ item }: { item: Material }) {
  const { repo, run } = useApp();
  return (
    <>
      <Label>{`${item.stock} · ${stockState(item.stock, item.minStock)}`}</Label>
      <Label
        muted
      >{`Atualizado: ${new Date(item.updatedAt).toLocaleDateString()}`}</Label>
      <Row>
        <Button
          title="− 1"
          secondary
          disabled={item.stock < 1}
          onPress={() => run(() => repo.adjustStock(item.id, -1))}
        />
        <Button
          title="+ 1"
          secondary
          onPress={() => run(() => repo.adjustStock(item.id, 1))}
        />
      </Row>
    </>
  );
}
export function CatalogForm({ route }: { route: Route }) {
  const { repo, run, pop, notify } = useApp();
  const kind = route.kind ?? "clients";
  const item = route.id ? repo.get(kind, route.id) : undefined;
  const [name, setName] = useState(item?.name ?? ""),
    [notes, setNotes] = useState(item?.notes ?? ""),
    [phone, setPhone] = useState((item as Client)?.phone ?? ""),
    [consent, setConsent] = useState((item as Client)?.consent ?? false),
    [price, setPrice] = useState(
      item && kind === "services"
        ? ((item as Service).priceCents / 100).toFixed(2)
        : "",
    ),
    [duration, setDuration] = useState(
      String((item as Service)?.duration ?? 30),
    ),
    [stock, setStock] = useState(String((item as Material)?.stock ?? 0)),
    [minimum, setMinimum] = useState(
      (item as Material)?.minStock != null
        ? String((item as Material).minStock)
        : "",
    );
  const save = () =>
    run(() => {
      const common = { id: item?.id, name, notes };
      const saved =
        kind === "clients"
          ? repo.saveCatalog("clients", { ...common, phone, consent })
          : kind === "services"
            ? repo.saveCatalog("services", {
                ...common,
                priceCents: money(price),
                duration: Number(duration),
              })
            : repo.saveCatalog("materials", {
                ...common,
                stock: Number(stock.replace(",", ".")),
                minStock: minimum.trim()
                  ? Number(minimum.replace(",", "."))
                  : null,
              });
      pop();
      route.afterSave?.(saved.id);
      notify("Salvo com sucesso.");
    });
  return (
    <Page>
      <Label title>{`${item ? "Editar" : "Novo"} ${singular[kind]}`}</Label>
      <Field label="Nome" value={name} onChangeText={setName} maxLength={120} />
      {kind === "clients" && (
        <>
          <Field
            label="Telefone com DDI"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="5511999999999"
            maxLength={20}
          />
          <Toggle
            label="Consentimento para contato por WhatsApp"
            value={consent}
            onChange={setConsent}
          />
        </>
      )}
      {kind === "services" && (
        <>
          <Field
            label="Preço"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />
          <Field
            label="Duração em minutos"
            value={duration}
            onChangeText={setDuration}
            keyboardType="number-pad"
          />
        </>
      )}
      {kind === "materials" && (
        <>
          <Field
            label="Estoque atual"
            value={stock}
            onChangeText={setStock}
            keyboardType="decimal-pad"
          />
          <Field
            label="Estoque mínimo (opcional)"
            value={minimum}
            onChangeText={setMinimum}
            keyboardType="decimal-pad"
          />
        </>
      )}
      <Field
        label="Observações"
        value={notes}
        onChangeText={setNotes}
        multiline
        maxLength={2000}
      />
      <Button title="Salvar" onPress={save} />
      {item && (
        <Button
          title="Excluir"
          danger
          onPress={() =>
            Alert.alert(
              "Arquivar cadastro?",
              "O histórico de atendimentos será preservado.",
              [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Excluir",
                  style: "destructive",
                  onPress: () =>
                    run(() => {
                      repo.remove(kind, item.id);
                      pop();
                      notify("Cadastro arquivado.", () =>
                        repo.restore(kind, item.id),
                      );
                    }),
                },
              ],
            )
          }
        />
      )}
    </Page>
  );
}
