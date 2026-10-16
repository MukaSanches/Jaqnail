import React from "react";
import {
  Text,
  Pressable,
  View,
  TextInput,
  ScrollView,
  Switch,
  StyleSheet,
  type TextStyle,
  type TextInputProps,
  ActivityIndicator,
} from "react-native";
import { useApp } from "../app/context";
import { translate } from "../i18n";
export function Label({
  children,
  style,
  muted = false,
  title = false,
}: {
  children: React.ReactNode;
  style?: TextStyle;
  muted?: boolean;
  title?: boolean;
}) {
  const { colors, p } = useApp();
  return (
    <Text
      style={[
        {
          color: muted ? colors.muted : colors.ink,
          fontSize: title ? 28 : 16,
          lineHeight: title ? 35 : 24,
          fontWeight: title ? "700" : "400",
        },
        style,
      ]}
    >
      {typeof children === "string" ? translate(children, p.lang) : children}
    </Text>
  );
}
export function Button({
  title,
  onPress,
  secondary = false,
  danger = false,
  disabled = false,
  testID,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  testID?: string;
}) {
  const { colors, p } = useApp();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={translate(title, p.lang)}
      accessibilityState={{ disabled }}
      testID={testID}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: secondary
          ? colors.card
          : danger
            ? colors.danger
            : colors.primary,
        borderWidth: secondary ? 1 : 0,
        borderColor: colors.border,
        opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
        justifyContent: "center",
        alignItems: "center",
        marginVertical: 4,
      })}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: secondary ? colors.ink : danger ? "#fff" : colors.onPrimary,
          textAlign: "center",
        }}
      >
        {translate(title, p.lang)}
      </Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const { colors, p } = useApp();
  return (
    <View style={{ gap: 5, marginVertical: 7 }}>
      <Label>{label}</Label>
      <TextInput
        accessibilityLabel={translate(label, p.lang)}
        placeholderTextColor={colors.muted}
        style={{
          minHeight: 50,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 12,
          fontSize: 17,
          color: colors.ink,
          backgroundColor: colors.card,
          textAlignVertical: props.multiline ? "top" : "center",
        }}
        {...props}
      />
    </View>
  );
}
export function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (b: boolean) => void;
}) {
  const { p } = useApp();
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Label>{label}</Label>
      </View>
      <Switch
        accessibilityLabel={translate(label, p.lang)}
        value={value}
        onValueChange={onChange}
      />
    </View>
  );
}
export function Card({ children }: { children: React.ReactNode }) {
  const { colors } = useApp();
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 6,
        marginVertical: 7,
      }}
    >
      {children}
    </View>
  );
}
export function Page({
  children,
  scroll = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
}) {
  return scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 20, paddingBottom: 36, gap: 8 }}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={{ flex: 1, padding: 20, gap: 8 }}>{children}</View>
  );
}
export function Row({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}
export function Money({ cents }: { cents: number }) {
  const { p } = useApp();
  return (
    <Label style={{ fontSize: 22, fontWeight: "700" }}>
      {p.hideMoney
        ? "••••"
        : new Intl.NumberFormat(p.lang, {
            style: "currency",
            currency: p.currency,
          }).format(cents / 100)}
    </Label>
  );
}
export function Empty({ text = "Sem registros" }: { text?: string }) {
  return (
    <Card>
      <Label>{text}</Label>
      <Label muted>Seus dados aparecem aqui assim que você cadastrar.</Label>
    </Card>
  );
}
export function Loading() {
  return (
    <View style={{ padding: 30 }}>
      <ActivityIndicator accessibilityLabel="Carregando" />
    </View>
  );
}
export const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginVertical: 4,
  },
});
