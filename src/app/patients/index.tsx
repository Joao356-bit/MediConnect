import { useFocusEffect, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
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

function formatBirthDate(value: string): string {
  const parts = value.split("-");

  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  return value;
}

export default function PatientsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadPatients() {
        try {
          setLoading(true);
          setError(false);

          const result = await db.getAllAsync<Patient>(
            "SELECT * FROM patients ORDER BY name ASC",
          );

          if (active) {
            setPatients(result);
          }
        } catch (err) {
          console.error("Erro ao carregar pacientes:", err);

          if (active) {
            setError(true);
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      loadPatients();

      return () => {
        active = false;
      };
    }, [db]),
  );

  const filteredPatients = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();

    if (!normalizedSearch) {
      return patients;
    }

    return patients.filter((patient) => {
      const name = patient.name.toLocaleLowerCase();
      const phone = (patient.phone ?? "").toLowerCase();

      return (
        name.includes(normalizedSearch) || phone.includes(normalizedSearch)
      );
    });
  }, [patients, search]);

  function openPatient(id: number) {
    router.push({
      pathname: "/patients/[id]",
      params: { id: id.toString() },
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredPatients}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Pacientes</Text>

            <Text style={styles.description}>
              Gerencie os pacientes cadastrados no MediConnect.
            </Text>

            <Pressable
              style={styles.addButton}
              onPress={() => router.push("/patients/create")}
            >
              <Text style={styles.addButtonText}>+ Cadastrar paciente</Text>
            </Pressable>

            <Text style={styles.sectionTitle}>Lista de pacientes</Text>

            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar por nome ou telefone..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              accessibilityLabel="Pesquisar pacientes por nome ou telefone"
            />

            <View style={styles.resultsHeader}>
              <Text style={styles.resultsText}>
                {search.trim()
                  ? `${filteredPatients.length} resultado(s)`
                  : `${patients.length} paciente(s) cadastrado(s)`}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.patientCard,
              pressed && styles.patientCardPressed,
            ]}
            onPress={() => openPatient(item.id)}
          >
            <View style={styles.patientHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.name.trim().charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.patientMain}>
                <Text style={styles.patientName}>{item.name}</Text>

                <Text style={styles.patientInfo}>
                  Nascimento: {formatBirthDate(item.birth_date)}
                </Text>

                <Text style={styles.patientInfo}>
                  Telefone: {item.phone || "Não informado"}
                </Text>
              </View>

              <Text style={styles.arrow}>›</Text>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.patientAction}>Ver detalhes</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            {loading ? (
              <>
                <ActivityIndicator size="large" color="#176B87" />
                <Text style={styles.emptyDescription}>
                  Carregando pacientes...
                </Text>
              </>
            ) : error ? (
              <>
                <Text style={styles.emptyTitle}>
                  Não foi possível carregar os pacientes
                </Text>

                <Text style={styles.emptyDescription}>
                  Verifique sua conexão com o banco de dados e tente novamente
                  ao retornar à tela.
                </Text>
              </>
            ) : search.trim() ? (
              <>
                <Text style={styles.emptyTitle}>
                  Nenhum resultado encontrado
                </Text>

                <Text style={styles.emptyDescription}>
                  Não encontramos pacientes com esse nome ou telefone.
                </Text>

                <Pressable onPress={() => setSearch("")}>
                  <Text style={styles.clearSearch}>Limpar pesquisa</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.emptyTitle}>
                  Nenhum paciente cadastrado
                </Text>

                <Text style={styles.emptyDescription}>
                  Utilize o botão acima para cadastrar o primeiro paciente.
                </Text>
              </>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    width: "100%",
    maxWidth: 1000,
    alignSelf: "center",
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#183153",
  },
  description: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 8,
    lineHeight: 21,
  },
  addButton: {
    backgroundColor: "#176B87",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#183153",
    marginTop: 30,
    marginBottom: 14,
  },
  searchInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: "#183153",
  },
  resultsHeader: {
    marginTop: 14,
    marginBottom: 4,
  },
  resultsText: {
    fontSize: 13,
    color: "#64748B",
  },
  patientCard: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E8EEF4",
  },
  patientCardPressed: {
    opacity: 0.75,
  },
  patientHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#E6F2F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: {
    color: "#176B87",
    fontSize: 19,
    fontWeight: "bold",
  },
  patientMain: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#183153",
    marginBottom: 6,
  },
  patientInfo: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 3,
  },
  arrow: {
    fontSize: 28,
    color: "#94A3B8",
    marginLeft: 8,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    marginTop: 14,
    paddingTop: 12,
  },
  patientAction: {
    color: "#176B87",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    padding: 26,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8EEF4",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#183153",
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 9,
    lineHeight: 21,
    textAlign: "center",
  },
  clearSearch: {
    color: "#176B87",
    fontWeight: "600",
    marginTop: 16,
    fontSize: 14,
  },
});
