import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";

import { initializeDatabase } from "@/database/database";

export default function PatientsLayout() {
  return (
    <SQLiteProvider databaseName="mediconnect.db" onInit={initializeDatabase}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#F4F7FB" },
          headerTintColor: "#183153",
          headerTitleStyle: { fontWeight: "bold" },
          headerBackTitle: "Voltar",
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Pacientes",
            headerBackVisible: false,
          }}
        />

        <Stack.Screen name="create" options={{ title: "Novo paciente" }} />

        <Stack.Screen name="[id]" options={{ title: "Detalhes do paciente" }} />

        <Stack.Screen name="edit" options={{ title: "Editar paciente" }} />

        <Stack.Screen
          name="record"
          options={{ title: "Novo registro de saúde" }}
        />

        <Stack.Screen
          name="record-edit"
          options={{ title: "Editar registro" }}
        />
      </Stack>
    </SQLiteProvider>
  );
}
