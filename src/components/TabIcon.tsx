import React from "react";
import { View, type ViewStyle } from "react-native";
/** Original geometric navigation glyphs, no font downloads or external assets. */
export function TabIcon({ name, color }: { name: string; color: string }) {
  const stroke: ViewStyle = {
    borderColor: color,
    borderWidth: 1.6,
    position: "absolute",
  };
  return (
    <View
      accessible={false}
      importantForAccessibility="no"
      style={{ width: 24, height: 24 }}
    >
      {name === "Agenda" ? (
        <>
          <View
            style={[
              stroke,
              { left: 3, top: 4, width: 18, height: 17, borderRadius: 4 },
            ]}
          />
          <View
            style={{
              position: "absolute",
              top: 9,
              left: 4,
              width: 16,
              height: 1.5,
              backgroundColor: color,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: 2,
              left: 7,
              width: 2,
              height: 5,
              backgroundColor: color,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: 2,
              left: 16,
              width: 2,
              height: 5,
              backgroundColor: color,
            }}
          />
        </>
      ) : name === "Clientes" ? (
        <>
          <View
            style={[
              stroke,
              { left: 8, top: 2, width: 9, height: 9, borderRadius: 9 },
            ]}
          />
          <View
            style={[
              stroke,
              {
                left: 4,
                top: 14,
                width: 17,
                height: 8,
                borderTopLeftRadius: 9,
                borderTopRightRadius: 9,
              },
            ]}
          />
        </>
      ) : name === "Serviços" ? (
        <>
          <View
            style={[
              stroke,
              {
                left: 6,
                top: 2,
                width: 12,
                height: 20,
                borderRadius: 7,
                transform: [{ rotate: "25deg" }],
              },
            ]}
          />
          <View
            style={{
              position: "absolute",
              left: 8,
              top: 11,
              width: 9,
              height: 1.5,
              backgroundColor: color,
              transform: [{ rotate: "25deg" }],
            }}
          />
        </>
      ) : name === "Estoque" ? (
        <>
          <View
            style={[
              stroke,
              { left: 3, top: 6, width: 18, height: 16, borderRadius: 3 },
            ]}
          />
          <View
            style={[
              stroke,
              { left: 7, top: 2, width: 10, height: 5, borderRadius: 2 },
            ]}
          />
          <View
            style={{
              position: "absolute",
              top: 13,
              left: 8,
              width: 8,
              height: 1.5,
              backgroundColor: color,
            }}
          />
        </>
      ) : (
        <>
          <View
            style={[
              stroke,
              {
                left: 3,
                top: 3,
                width: 18,
                height: 18,
                borderRadius: 7,
                transform: [{ rotate: "45deg" }],
              },
            ]}
          />
          <View
            style={[
              stroke,
              { left: 9, top: 9, width: 6, height: 6, borderRadius: 6 },
            ]}
          />
        </>
      )}
    </View>
  );
}
