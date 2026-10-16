import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, Text, Button } from "react-native";
import * as SQLite from "expo-sqlite";
import * as Crypto from "expo-crypto";
import { Repository } from "./src/data/repository";
import { AppRoot } from "./src/app/AppRoot";
export default function App() {
  const [repo, setRepo] = useState<Repository | null>(null),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    try {
      setRepo(
        new Repository(
          SQLite.openDatabaseSync("jaqnail.db"),
          Crypto.randomUUID,
        ),
      );
      setError("");
    } catch {
      setError(
        "Não foi possível abrir os dados. Nenhuma informação foi apagada. Reinicie o app ou tente novamente.",
      );
    }
  }, [attempt]);
  if (error)
    return (
      <View style={{ flex: 1, padding: 32, justifyContent: "center" }}>
        <Text>{error}</Text>
        <Button
          title="Tentar novamente"
          onPress={() => setAttempt(attempt + 1)}
        />
      </View>
    );
  return repo ? (
    <AppRoot repository={repo} />
  ) : (
    <ActivityIndicator accessibilityLabel="Abrindo Jaqnail" />
  );
}
