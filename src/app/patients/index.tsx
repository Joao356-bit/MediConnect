import { useFocusEffect, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import {
    Alert,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Patient = {
  id: number;
  name: string;
  birth_date: string;
  phone: string | null;
  created_at: string;
};

export default function PatientsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();

  const [patients, setPatients] = useState<Patient[]>([]);

  const loadPatients = useCallback(async () => {
    try {
      const result = await db.getAllAsync<Patient>(
        "SELECT * FROM patients ORDER BY name ASC",
      );

      setPatients(result);
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error);
      Alert.alert("Erro", "Não foi possível carregar os pacientes.");
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadPatients();
    }, [loadPatients]),
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Pacientes</Text>

        <Text style={styles.description}>
          Gerencie os pacientes cadastrados no aplicativo.
        </Text>

        <Pressable
          style={styles.button}
          onPress={() => router.push("/patients/create")}
        >
          <Text style={styles.buttonText}>+ Cadastrar paciente</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>
          Pacientes cadastrados ({patients.length})
        </Text>

        <FlatList
          data={patients}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Nenhum paciente cadastrado</Text>

              <Text style={styles.emptyDescription}>
                Utilize o botão acima para cadastrar o primeiro paciente.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.patientCard}
              onPress={() =>
                router.push({
                  pathname: "/patients/[id]",
                  params: { id: item.id.toString() },
                })
              }
            >
              <Text style={styles.patientName}>{item.name}</Text>

              <Text style={styles.patientInfo}>
                Nascimento: {item.birth_date}
              </Text>

              <Text style={styles.patientInfo}>
                Telefone: {item.phone || "Não informado"}
              </Text>

              <Text style={styles.patientAction}>Ver detalhes →</Text>
            </Pressable>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#183153",
  },
  description: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 8,
  },
  button: {
    backgroundColor: "#176B87",
    padding: 17,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 24,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#183153",
    marginTop: 30,
    marginBottom: 16,
  },
  list: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#183153",
  },
  emptyDescription: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 8,
    lineHeight: 21,
  },
  patientCard: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
  },
  patientName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#183153",
    marginBottom: 8,
  },
  patientInfo: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
  },
  patientAction: {
    color: "#176B87",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
  },
});
