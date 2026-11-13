import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
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

type HealthRecord = {
  id: number;
  patient_id: number;
  systolic_pressure: number | null;
  diastolic_pressure: number | null;
  temperature: number | null;
  symptoms: string | null;
  notes: string | null;
  recorded_at: string;
};

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatBirthDate(value: string): string {
  const parts = value.split("-");

  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  return value;
}

export default function PatientDetailsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const patientId = Number(id);

      if (!Number.isInteger(patientId) || patientId <= 0) {
        setPatient(null);
        setRecords([]);
        return;
      }

      const patientResult = await db.getFirstAsync<Patient>(
        "SELECT * FROM patients WHERE id = ?",
        patientId,
      );

      setPatient(patientResult ?? null);

      if (!patientResult) {
        setRecords([]);
        return;
      }

      const recordsResult = await db.getAllAsync<HealthRecord>(
        `SELECT * FROM health_records
         WHERE patient_id = ?
         ORDER BY recorded_at DESC`,
        patientId,
      );

      setRecords(recordsResult);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);

      if (Platform.OS === "web") {
        window.alert("Erro\n\nNão foi possível carregar os dados do paciente.");
      } else {
        Alert.alert("Erro", "Não foi possível carregar os dados do paciente.");
      }
    } finally {
      setLoading(false);
    }
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/patients");
    }
  }

  function handleEditPatient() {
    if (!patient) return;

    router.push({
      pathname: "/patients/edit",
      params: {
        patientId: patient.id.toString(),
      },
    });
  }

  async function deletePatient() {
    if (!patient || deleting) return;

    setDeleting(true);

    try {
      await db.runAsync("DELETE FROM patients WHERE id = ?", patient.id);

      if (Platform.OS === "web") {
        window.alert("Sucesso\n\nPaciente e respectivos registros excluídos.");
        router.replace("/patients");
      } else {
        Alert.alert("Sucesso", "Paciente e respectivos registros excluídos.", [
          {
            text: "OK",
            onPress: () => router.replace("/patients"),
          },
        ]);
      }
    } catch (error) {
      console.error("Erro ao excluir paciente:", error);

      if (Platform.OS === "web") {
        window.alert("Erro\n\nNão foi possível excluir o paciente.");
      } else {
        Alert.alert("Erro", "Não foi possível excluir o paciente.");
      }
    } finally {
      setDeleting(false);
    }
  }

  function handleDeletePatient() {
    if (!patient || deleting) return;

    const message =
      `Tem certeza de que deseja excluir ${patient.name}?\n\n` +
      "Todos os registros de saúde associados também serão excluídos. Essa ação não poderá ser desfeita.";

    if (Platform.OS === "web") {
      if (window.confirm(message)) {
        deletePatient();
      }
      return;
    }

    Alert.alert("Excluir paciente", message, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir definitivamente",
        style: "destructive",
        onPress: deletePatient,
      },
    ]);
  }

  function handleEdit(record: HealthRecord) {
    router.push({
      pathname: "/patients/record-edit",
      params: {
        recordId: record.id.toString(),
        patientId: record.patient_id.toString(),
      },
    });
  }

  async function deleteRecord(record: HealthRecord) {
    try {
      await db.runAsync(
        `DELETE FROM health_records
         WHERE id = ? AND patient_id = ?`,
        record.id,
        record.patient_id,
      );

      await loadData();

      if (Platform.OS === "web") {
        window.alert("Sucesso\n\nRegistro excluído com sucesso.");
      } else {
        Alert.alert("Sucesso", "Registro excluído com sucesso.");
      }
    } catch (error) {
      console.error("Erro ao excluir registro:", error);

      if (Platform.OS === "web") {
        window.alert("Erro\n\nNão foi possível excluir o registro.");
      } else {
        Alert.alert("Erro", "Não foi possível excluir o registro.");
      }
    }
  }

  function handleDelete(record: HealthRecord) {
    const message =
      "Tem certeza de que deseja excluir este registro de saúde? Essa ação não poderá ser desfeita.";

    if (Platform.OS === "web") {
      if (window.confirm(message)) {
        deleteRecord(record);
      }
      return;
    }

    Alert.alert("Excluir registro", message, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => deleteRecord(record),
      },
    ]);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#176B87" />
          <Text style={styles.loadingText}>Carregando informações...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!patient) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFoundCard}>
          <Text style={styles.notFoundTitle}>Paciente não encontrado</Text>
          <Text style={styles.notFoundDescription}>
            Não foi possível localizar os dados deste paciente.
          </Text>

          <Pressable style={styles.primaryButton} onPress={handleBack}>
            <Text style={styles.primaryButtonText}>Voltar para pacientes</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>‹ Voltar para pacientes</Text>
        </Pressable>

        <View style={styles.pageHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {patient.name.trim().charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.title}>{patient.name}</Text>
            <Text style={styles.description}>
              Perfil e acompanhamento do paciente
            </Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Histórico de saúde</Text>
          <Text style={styles.summaryValue}>{records.length}</Text>
          <Text style={styles.summaryDescription}>
            {records.length === 1
              ? "registro cadastrado"
              : "registros cadastrados"}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dados pessoais</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>Cadastro</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.label}>Identificação</Text>
            <Text style={styles.value}>#{patient.id}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.label}>Data de nascimento</Text>
            <Text style={styles.value}>
              {formatBirthDate(patient.birth_date)}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.label}>Telefone</Text>
            <Text style={styles.value}>{patient.phone || "Não informado"}</Text>
          </View>

          <Pressable style={styles.secondaryButton} onPress={handleEditPatient}>
            <Text style={styles.secondaryButtonText}>
              Editar dados do paciente
            </Text>
          </Pressable>

          <Pressable
            style={styles.dangerButton}
            onPress={handleDeletePatient}
            disabled={deleting}
          >
            <Text style={styles.dangerButtonText}>
              {deleting ? "Excluindo..." : "Excluir paciente"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.historyHeader}>
          <View>
            <Text style={styles.sectionTitle}>Histórico de saúde</Text>
            <Text style={styles.historyDescription}>
              Acompanhamento dos registros realizados
            </Text>
          </View>

          <Text style={styles.counter}>{records.length}</Text>
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            router.push({
              pathname: "/patients/record",
              params: { patientId: patient.id.toString() },
            })
          }
        >
          <Text style={styles.primaryButtonText}>+ Novo registro de saúde</Text>
        </Pressable>

        {records.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nenhum registro disponível</Text>
            <Text style={styles.emptyDescription}>
              Os registros de pressão arterial, temperatura, sintomas e
              observações aparecerão aqui após serem cadastrados.
            </Text>
          </View>
        ) : (
          records.map((record) => (
            <View key={record.id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <View>
                  <Text style={styles.recordHeading}>Registro de saúde</Text>
                  <Text style={styles.recordDate}>
                    {formatDate(record.recorded_at)}
                  </Text>
                </View>

                <View style={styles.recordBadge}>
                  <Text style={styles.recordBadgeText}>#{record.id}</Text>
                </View>
              </View>

              {record.systolic_pressure !== null &&
                record.diastolic_pressure !== null && (
                  <View style={styles.recordItem}>
                    <Text style={styles.recordLabel}>Pressão arterial</Text>
                    <Text style={styles.recordValue}>
                      {record.systolic_pressure}/{record.diastolic_pressure}{" "}
                      mmHg
                    </Text>
                  </View>
                )}

              {record.temperature !== null && (
                <View style={styles.recordItem}>
                  <Text style={styles.recordLabel}>Temperatura</Text>
                  <Text style={styles.recordValue}>
                    {record.temperature.toFixed(1).replace(".", ",")} °C
                  </Text>
                </View>
              )}

              {record.symptoms && (
                <View style={styles.recordItem}>
                  <Text style={styles.recordLabel}>Sintomas</Text>
                  <Text style={styles.recordText}>{record.symptoms}</Text>
                </View>
              )}

              {record.notes && (
                <View style={styles.recordItem}>
                  <Text style={styles.recordLabel}>
                    Observações profissionais
                  </Text>
                  <Text style={styles.recordText}>{record.notes}</Text>
                </View>
              )}

              <View style={styles.actions}>
                <Pressable
                  style={styles.editButton}
                  onPress={() => handleEdit(record)}
                >
                  <Text style={styles.editButtonText}>Editar</Text>
                </Pressable>

                <Pressable
                  style={styles.deleteButton}
                  onPress={() => handleDelete(record)}
                >
                  <Text style={styles.deleteButtonText}>Excluir</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },
  content: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    padding: 24,
    paddingBottom: 48,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 12,
  },
  notFoundCard: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  notFoundTitle: {
    color: "#183153",
    fontSize: 21,
    fontWeight: "bold",
    textAlign: "center",
  },
  notFoundDescription: {
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 24,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 24,
    paddingVertical: 8,
  },
  backButtonText: {
    color: "#176B87",
    fontSize: 14,
    fontWeight: "600",
  },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 16,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#DCEFF5",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#176B87",
    fontSize: 27,
    fontWeight: "bold",
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#183153",
  },
  description: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 5,
  },
  summaryCard: {
    backgroundColor: "#176B87",
    padding: 22,
    borderRadius: 16,
    marginBottom: 24,
  },
  summaryLabel: {
    color: "#E7F3F7",
    fontSize: 13,
  },
  summaryValue: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "bold",
    marginTop: 5,
  },
  summaryDescription: {
    color: "#E7F3F7",
    fontSize: 12,
    marginTop: 2,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#E8EEF4",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#183153",
  },
  sectionBadge: {
    backgroundColor: "#E6F4F8",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  sectionBadgeText: {
    fontSize: 11,
    color: "#176B87",
    fontWeight: "600",
  },
  infoItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  label: {
    fontSize: 12,
    color: "#64748B",
  },
  value: {
    fontSize: 15,
    fontWeight: "600",
    color: "#183153",
    marginTop: 5,
  },
  secondaryButton: {
    backgroundColor: "#E6F4F8",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  secondaryButtonText: {
    color: "#176B87",
    fontWeight: "600",
    fontSize: 14,
  },
  dangerButton: {
    backgroundColor: "#FDECEC",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  dangerButtonText: {
    color: "#C62828",
    fontWeight: "600",
    fontSize: 14,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  historyDescription: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 5,
  },
  counter: {
    backgroundColor: "#E6F4F8",
    color: "#176B87",
    fontSize: 15,
    fontWeight: "bold",
    overflow: "hidden",
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  primaryButton: {
    backgroundColor: "#176B87",
    padding: 16,
    borderRadius: 11,
    alignItems: "center",
    marginBottom: 18,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    padding: 24,
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
  recordCard: {
    backgroundColor: "#FFFFFF",
    padding: 19,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E8EEF4",
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 14,
    marginBottom: 5,
  },
  recordHeading: {
    color: "#183153",
    fontSize: 15,
    fontWeight: "bold",
  },
  recordDate: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 5,
  },
  recordBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  recordBadgeText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
  },
  recordItem: {
    marginTop: 12,
  },
  recordLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 5,
  },
  recordValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#183153",
  },
  recordText: {
    fontSize: 14,
    color: "#183153",
    lineHeight: 22,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 15,
  },
  editButton: {
    flex: 1,
    backgroundColor: "#E6F4F8",
    padding: 13,
    borderRadius: 9,
    alignItems: "center",
  },
  editButtonText: {
    color: "#176B87",
    fontWeight: "600",
    fontSize: 14,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#FDECEC",
    padding: 13,
    borderRadius: 9,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#C62828",
    fontWeight: "600",
    fontSize: 14,
  },
});
