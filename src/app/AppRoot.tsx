import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  BackHandler,
  Alert,
  useColorScheme,
  AppState as NativeState,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ZodError } from "zod";
import { Context, type Route } from "./context";
import type { Repository } from "../data/repository";
import { light, dark } from "../theme/theme";
import { Label, Button } from "../components/ui";
import { Onboarding } from "../features/onboarding/Onboarding";
import { CatalogList, CatalogForm } from "../features/catalog/Catalog";
import { Agenda } from "../features/agenda/Agenda";
import { Wizard } from "../features/agenda/Wizard";
import { Details } from "../features/agenda/Details";
import { Statistics } from "../features/statistics/Statistics";
import { Settings, Choice, About } from "../features/settings/Settings";
import { Backup } from "../features/backup/Backup";
import { syncReminders } from "../integrations/native";
import { translate } from "../i18n";
import { TabIcon } from "../components/TabIcon";
const titles: Record<Route["screen"], string> = {
  agenda: "Agenda",
  catalog: "Cadastros",
  form: "Cadastro",
  wizard: "Agendamento",
  details: "Detalhes",
  history: "Histórico",
  stats: "Estatísticas",
  settings: "Ajustes",
  backup: "Backup",
  about: "Sobre",
  choice: "Preferências",
};
export function AppRoot({ repository: repo }: { repository: Repository }) {
  const [revision, setRevision] = useState(0),
    [stack, setStack] = useState<(Route & { key: number })[]>([
      { screen: "agenda", key: 0 },
    ]),
    [message, setMessage] = useState<{
      text: string;
      undo?: () => void;
    } | null>(null);
  const counter = useRef(1);
  const p = repo.preferences(),
    system = useColorScheme(),
    colors =
      p.theme === "dark" || (p.theme === "system" && system === "dark")
        ? dark
        : light;
  const refresh = useCallback(() => setRevision((x) => x + 1), []);
  const pop = useCallback(
    () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
    [],
  );
  const push = (r: Route) =>
    setStack((s) => [...s, { ...r, key: counter.current++ }]);
  const go = (r: Route) => setStack([{ ...r, key: counter.current++ }]);
  const notify = (text: string, undo?: () => void) =>
    setMessage({ text, undo });
  const run = (fn: () => void) => {
    try {
      fn();
      refresh();
      return true;
    } catch (e) {
      notify(
        e instanceof ZodError
          ? e.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join("\n")
          : e instanceof Error
            ? e.message
            : "Não foi possível concluir. Tente novamente.",
      );
      return false;
    }
  };
  const back = useCallback(() => {
    if (stack.length <= 1) return false;
    const top = stack[stack.length - 1];
    if (top?.screen === "form" || top?.screen === "wizard")
      Alert.alert(
        "Sair do formulário?",
        "Alterações não salvas serão descartadas.",
        [
          { text: "Continuar editando", style: "cancel" },
          { text: "Sair", onPress: pop },
        ],
      );
    else pop();
    return true;
  }, [stack, pop]);
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", back);
    return () => sub.remove();
  }, [back]);
  const syncing = useRef(Promise.resolve());
  useEffect(() => {
    syncing.current = syncing.current
      .catch(() => {})
      .then(() => syncReminders(repo))
      .catch(() =>
        setMessage({
          text: "Dados salvos. Não foi possível sincronizar os alertas; confira as permissões do Android.",
        }),
      );
  }, [repo, revision]);
  useEffect(() => {
    const listener = NativeState.addEventListener("change", (s) => {
      if (s === "active") refresh();
    });
    return () => listener.remove();
  }, [refresh]);
  const active = stack[stack.length - 1]!;
  const outdated =
    p.onboarded &&
    Date.now() -
      Date.parse(
        p.lastBackup ??
          repo.db.getAllSync<{ applied_at: string }>(
            "SELECT applied_at FROM schema_migrations WHERE version=1",
          )[0]?.applied_at ??
          new Date().toISOString(),
      ) >
      p.backupDays * 86400000 &&
    Date.now() - Date.parse(p.backupDismissed ?? "1970-01-01") > 86400000;
  return (
    <SafeAreaProvider>
      <Context.Provider
        value={{
          repo,
          revision,
          refresh,
          p,
          colors,
          push,
          pop,
          go,
          run,
          notify,
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
          <StatusBar style={colors === dark ? "light" : "dark"} />
          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderColor: colors.border,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              accessibilityRole="header"
              style={{
                fontSize: 25,
                fontWeight: "700",
                letterSpacing: -1,
                color: colors.ink,
              }}
            >
              jaqnail
              <Text style={{ color: colors.muted, fontSize: 14 }}>
                {" "}
                / {translate(titles[active.screen], p.lang)}
              </Text>
            </Text>
            {stack.length > 1 && (
              <Button title="Retornar" secondary onPress={back} />
            )}
          </View>
          {message && (
            <View
              accessibilityLiveRegion="polite"
              style={{
                paddingHorizontal: 16,
                paddingVertical: 4,
                backgroundColor: colors.accent,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <View style={{ flex: 1 }}>
                <Label style={{ fontSize: 14 }}>{message.text}</Label>
              </View>
              {message.undo && (
                <Button
                  title="Desfazer"
                  secondary
                  onPress={() => {
                    if (run(message.undo!)) setMessage(null);
                  }}
                />
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fechar aviso"
                onPress={() => setMessage(null)}
                style={{
                  minHeight: 48,
                  minWidth: 48,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Label style={{ fontSize: 25 }}>×</Label>
              </Pressable>
            </View>
          )}
          {!p.onboarded ? (
            <Onboarding />
          ) : (
            <>
              <View style={{ flex: 1 }}>
                {stack.map((route, i) => (
                  <View
                    key={route.key}
                    style={{
                      flex: 1,
                      display: i === stack.length - 1 ? "flex" : "none",
                    }}
                    accessibilityElementsHidden={i !== stack.length - 1}
                    importantForAccessibility={
                      i === stack.length - 1 ? "auto" : "no-hide-descendants"
                    }
                  >
                    <RouteScreen route={route} />
                  </View>
                ))}
              </View>
              {outdated && stack.length === 1 && (
                <View
                  style={{
                    paddingHorizontal: 16,
                    backgroundColor: colors.accent,
                  }}
                >
                  <Label>Proteja sua agenda: exporte um backup.</Label>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <Button
                      title="Fazer backup"
                      secondary
                      onPress={() => push({ screen: "backup" })}
                    />
                    <Button
                      title="Lembrar amanhã"
                      secondary
                      onPress={() =>
                        run(() =>
                          repo.setPreferences({
                            backupDismissed: new Date().toISOString(),
                          }),
                        )
                      }
                    />
                  </View>
                </View>
              )}
              {stack.length === 1 && (
                <View style={{ borderTopWidth: 1, borderColor: colors.border }}>
                  <View
                    style={{
                      flexDirection: "row",
                      paddingVertical: 5,
                      paddingHorizontal: 4,
                    }}
                  >
                    {(
                      [
                        { title: "Agenda", route: { screen: "agenda" } },
                        {
                          title: "Clientes",
                          route: { screen: "catalog", kind: "clients" },
                        },
                        {
                          title: "Serviços",
                          route: { screen: "catalog", kind: "services" },
                        },
                        {
                          title: "Estoque",
                          route: { screen: "catalog", kind: "materials" },
                        },
                        { title: "Ajustes", route: { screen: "settings" } },
                      ] as { title: string; route: Route }[]
                    ).map((tab) => (
                      <Pressable
                        key={tab.title}
                        accessibilityRole="tab"
                        accessibilityLabel={translate(tab.title, p.lang)}
                        accessibilityState={{
                          selected:
                            active.screen === tab.route.screen &&
                            active.kind === tab.route.kind,
                        }}
                        onPress={() => go(tab.route)}
                        style={{
                          minHeight: 60,
                          flex: 1,
                          padding: 4,
                          alignItems: "center",
                          gap: 3,
                          justifyContent: "center",
                          borderRadius: 16,
                          backgroundColor:
                            active.screen === tab.route.screen &&
                            active.kind === tab.route.kind
                              ? colors.accent
                              : colors.bg,
                        }}
                      >
                        <TabIcon
                          name={tab.title}
                          color={
                            active.screen === tab.route.screen &&
                            active.kind === tab.route.kind
                              ? colors.ink
                              : colors.muted
                          }
                        />
                        <Label style={{ fontSize: 11, fontWeight: "600" }}>
                          {tab.title}
                        </Label>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}
        </SafeAreaView>
      </Context.Provider>
    </SafeAreaProvider>
  );
}
function RouteScreen({ route }: { route: Route }) {
  switch (route.screen) {
    case "agenda":
      return <Agenda />;
    case "catalog":
      return <CatalogList route={route} />;
    case "form":
      return <CatalogForm route={route} />;
    case "wizard":
      return <Wizard route={route} />;
    case "details":
      return <Details route={route} />;
    case "history":
      return <Agenda history selectTemplate={route.selectTemplate} />;
    case "stats":
      return <Statistics route={route} />;
    case "settings":
      return <Settings />;
    case "choice":
      return <Choice route={route} />;
    case "backup":
      return <Backup />;
    case "about":
      return <About />;
  }
}
