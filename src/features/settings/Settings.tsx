import React, { useState } from "react";
import { Alert, Linking, Share } from "react-native";
import { useApp, type Route } from "../../app/context";
import { Page, Label, Button, Card, Field, Toggle } from "../../components/ui";
import { requestNotifications } from "../../integrations/native";
import { normalize } from "../../domain/rules";
import type { Preferences } from "../../domain/models";
export function Settings() {
  const { repo, p, run, push, notify, go } = useApp();
  const [template, setTemplate] = useState(p.messageTemplate),
    [minutes, setMinutes] = useState(String(p.reminderMinutes));
  return (
    <Page>
      <Label title>Seu Jaqnail</Label>
      {(
        [
          ["theme", "Tema"],
          ["lang", "Idioma"],
          ["currency", "Moeda"],
          ["dateFormat", "Formato de data"],
        ] as const
      ).map(([choice, label]) => (
        <Button
          key={choice}
          title={label}
          secondary
          onPress={() => push({ screen: "choice", choice })}
        />
      ))}
      <Toggle
        label="Horário de 24 horas"
        value={p.hour24}
        onChange={(hour24) => run(() => repo.setPreferences({ hour24 }))}
      />
      <Toggle
        label="Notificações"
        value={p.notifications}
        onChange={(value) => {
          if (!value) {
            run(() => repo.setPreferences({ notifications: false }));
            return;
          }
          void requestNotifications()
            .then((granted) => {
              if (granted)
                run(() => repo.setPreferences({ notifications: true }));
              else
                Alert.alert(
                  "Permissão não concedida",
                  "Você pode permitir notificações nos ajustes do Android.",
                  [
                    { text: "Cancelar" },
                    {
                      text: "Abrir ajustes",
                      onPress: () => void Linking.openSettings(),
                    },
                  ],
                );
            })
            .catch(() => notify("Não foi possível solicitar a permissão."));
        }}
      />
      <Field
        label="Minutos antes do atendimento"
        value={minutes}
        onChangeText={setMinutes}
        keyboardType="number-pad"
      />
      <Button
        title="Salvar antecedência"
        secondary
        onPress={() =>
          run(() => repo.setPreferences({ reminderMinutes: Number(minutes) }))
        }
      />
      <Button
        title="Backup e restauração"
        secondary
        onPress={() => push({ screen: "backup" })}
      />
      <Button
        title="Histórico e cópias"
        secondary
        onPress={() => push({ screen: "history" })}
      />
      <Card>
        <Label>Modelo de mensagem WhatsApp</Label>
        <Label muted>
          Use {"{cliente}, {data}, {hora}, {servicos}"}. Confira sempre a prévia
          antes de abrir o WhatsApp.
        </Label>
        <Field
          label="Mensagem"
          value={template}
          onChangeText={setTemplate}
          multiline
          maxLength={2000}
        />
        <Button
          title="Salvar modelo"
          secondary
          onPress={() =>
            run(() => repo.setPreferences({ messageTemplate: template }))
          }
        />
      </Card>
      <Button
        title="Compartilhar"
        secondary
        onPress={() =>
          void Share.share({
            message:
              "Jaqnail — agenda e gestão gratuita. Desenvolvido por Samuel Sanches. https://github.com/MukaSanches/Jaqnail",
          }).catch(() => notify("Compartilhamento indisponível."))
        }
      />
      <Button
        title="Enviar avaliação e sugestões"
        secondary
        onPress={() =>
          void Linking.openURL(
            "https://github.com/MukaSanches/Jaqnail/issues",
          ).catch(() =>
            notify("Abra o repositório no navegador para enviar sua sugestão."),
          )
        }
      />
      <Button
        title="Tudo gratuito"
        secondary
        onPress={() => push({ screen: "about" })}
      />
      <Button
        title="Sobre o Jaqnail"
        secondary
        onPress={() => push({ screen: "about" })}
      />
      <Button
        title="Apagar todos os dados"
        danger
        onPress={() =>
          Alert.alert(
            "Apagar todos os dados?",
            "Esta ação é permanente e inclui a recuperação interna. Exporte um backup antes.",
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Continuar",
                style: "destructive",
                onPress: () =>
                  Alert.alert(
                    "Confirma a exclusão definitiva?",
                    "Clientes, serviços, estoque e agenda serão removidos deste aparelho.",
                    [
                      { text: "Cancelar", style: "cancel" },
                      {
                        text: "Apagar definitivamente",
                        style: "destructive",
                        onPress: () =>
                          run(() => {
                            repo.eraseAll();
                            go({ screen: "agenda" });
                          }),
                      },
                    ],
                  ),
              },
            ],
          )
        }
      />
      <Label muted>Jaqnail 1.0.0 · Desenvolvido por Samuel Sanches</Label>
    </Page>
  );
}
export function Choice({ route }: { route: Route }) {
  const { repo, p, run, pop } = useApp();
  const [q, setQ] = useState("");
  const key = route.choice ?? "theme";
  const options: Record<NonNullable<Route["choice"]>, [string, string][]> = {
    theme: [
      ["system", "Sistema"],
      ["light", "Claro"],
      ["dark", "Escuro"],
    ],
    lang: [
      ["pt-BR", "Português (Brasil)"],
      ["en-US", "English (US) · tradução parcial"],
    ],
    currency: [
      ["BRL", "BRL · Real brasileiro"],
      ["USD", "USD · Dólar americano"],
      ["EUR", "EUR · Euro"],
    ],
    dateFormat: [
      ["DMY", "Dia/mês/ano · 31/12/2026"],
      ["MDY", "Mês/dia/ano · 12/31/2026"],
      ["YMD", "Ano-mês-dia · 2026-12-31"],
    ],
  };
  return (
    <Page>
      <Field label="Buscar" value={q} onChangeText={setQ} />
      {key === "currency" && (
        <Label>
          A moeda altera a exibição, sem converter preços existentes. Revise
          seus cadastros antes de trocar.
        </Label>
      )}
      {options[key]
        .filter(([v, t]) => normalize(v + t).includes(normalize(q)))
        .map(([v, t]) => (
          <Button
            key={v}
            title={t + (p[key] === v ? " ✓" : "")}
            secondary={p[key] !== v}
            onPress={() =>
              run(() => {
                repo.setPreferences({ [key]: v } as Partial<Preferences>);
                pop();
              })
            }
          />
        ))}
    </Page>
  );
}
export function About() {
  return (
    <Page>
      <Label title>jaqnail</Label>
      <Label>Desenvolvido por Samuel Sanches</Label>
      <Card>
        <Label title>Tudo gratuito</Label>
        <Label>
          Agenda, clientes, serviços, estoque, estatísticas, cópias, repetição e
          alertas sem assinatura, anúncios ou limites comerciais.
        </Label>
      </Card>
      <Label title>Privacidade e dados</Label>
      <Label>
        O Jaqnail armazena dados no SQLite privado deste aparelho. Não exige
        conta nem envia telemetria. Proteja o aparelho com bloqueio de tela. O
        banco não tem criptografia adicional à proteção do Android.
      </Label>
      <Label>
        Backups JSON e CSV contêm dados pessoais em texto legível. Guarde-os em
        local privado. O compartilhamento e o WhatsApp abrem outros aplicativos
        somente após sua ação. Nenhuma mensagem é enviada automaticamente.
      </Label>
      <Label>
        Você pode exportar, restaurar ou remover seus dados em Configurações.
        Desinstalar o aplicativo remove o banco local. Preserve seu backup
        antes.
      </Label>
      <Label muted>
        Aplicativo independente. A equivalência dinâmica integral com a
        referência ainda precisa de validação. Versão 1.0.0 em desenvolvimento.
      </Label>
    </Page>
  );
}
