import React from "react";
import { View, Pressable } from "react-native";
import { useApp } from "../../app/context";
import { Label } from "../../components/ui";
import { calendarCells, weekDays } from "../../domain/calendar";
import { dayKey } from "./dates";
export function Calendar({
  selected,
  expanded,
  counts,
  onSelect,
}: {
  selected: string;
  expanded: boolean;
  counts: Map<string, number>;
  onSelect: (day: string) => void;
}) {
  const { colors, p } = useApp();
  const days = expanded ? calendarCells(selected) : weekDays(selected);
  const today = dayKey(new Date());
  return (
    <View
      accessibilityLabel={expanded ? "Calendário mensal" : "Calendário semanal"}
      style={{ paddingVertical: 8 }}
    >
      <View style={{ flexDirection: "row" }}>
        {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            <Label muted style={{ fontSize: 11, fontWeight: "700" }}>
              {d}
            </Label>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {days.map((day) => {
          const active = day === selected;
          const count = counts.get(day) ?? 0;
          return (
            <Pressable
              key={day}
              accessibilityRole="button"
              accessibilityLabel={
                new Date(day + "T12:00:00").toLocaleDateString(p.lang, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                }) + `, ${count} atendimentos`
              }
              accessibilityState={{ selected: active }}
              onPress={() => onSelect(day)}
              style={{
                width: "14.2857%",
                minHeight: 52,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 15,
                backgroundColor: active ? colors.primary : "transparent",
                opacity: day.slice(0, 7) === selected.slice(0, 7) ? 1 : 0.45,
              }}
            >
              <Label
                style={{
                  fontSize: 17,
                  fontWeight: day === today || active ? "800" : "500",
                  color: active
                    ? colors.onPrimary
                    : day === today
                      ? colors.danger
                      : colors.ink,
                }}
              >
                {String(Number(day.slice(8)))}
              </Label>
              <View
                style={{
                  height: 4,
                  width: count ? Math.min(count, 3) * 5 : 4,
                  borderRadius: 4,
                  backgroundColor: count
                    ? active
                      ? colors.onPrimary
                      : colors.primary
                    : "transparent",
                }}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
