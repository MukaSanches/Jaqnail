import icon from "../../../assets/icon.png";
import React, { useState } from "react";
import { Image } from "react-native";
import { Page, Label, Button, Field, Card } from "../../components/ui";
import { useApp } from "../../app/context";
export function Onboarding() {
  const { repo, refresh } = useApp();
  const [step, setStep] = useState(0),
    [source, setSource] = useState("");
  const texts = [
    [
      "Seu estúdio, no seu ritmo",
      "Uma agenda tranquila para organizar cada atendimento. Funciona offline, sem login.",
    ],
    [
      "Cuidado que continua",
      "Clientes, serviços e estoque juntos. Seus dados ficam neste aparelho; exporte backups regularmente.",
    ],
    [
      "Bem-vinda ao Jaqnail",
      "Como você conheceu o Jaqnail? Resposta opcional, guardada somente no aparelho.",
    ],
  ];
  return (
    <Page>
      <Image
        source={icon}
        style={{
          width: 96,
          height: 96,
          borderRadius: 24,
          alignSelf: "center",
          marginVertical: 30,
        }}
        accessibilityLabel="Jaqnail"
      />
      <Label muted>{`${step + 1} / 3 · JAQNAIL`}</Label>
      <Label title>{texts[step]?.[0]}</Label>
      <Card>
        <Label>{texts[step]?.[1]}</Label>
      </Card>
      {step === 2 && (
        <Field
          label="Como conheceu? (opcional)"
          value={source}
          onChangeText={setSource}
        />
      )}
      <Button
        title={step === 2 ? "Começar" : "Continuar"}
        onPress={() => {
          if (step < 2) setStep(step + 1);
          else {
            repo.setPreferences({ onboarded: true, referral: source });
            refresh();
          }
        }}
      />
      {step > 0 && (
        <Button title="Voltar" secondary onPress={() => setStep(step - 1)} />
      )}
      <Label muted>Desenvolvido por Samuel Sanches</Label>
    </Page>
  );
}
