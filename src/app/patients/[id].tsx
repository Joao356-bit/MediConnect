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

  function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("pt-BR");
  }

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
          { text: "OK", onPress: () => router.replace("/patients") },
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
      "Todos os registros de saúde associados a esse paciente também serão excluídos. Essa ação não poderá ser desfeita.";

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
        <ActivityIndicator size="large" color="#176B87" />
      </SafeAreaView>
    );
  }

  if (!patient) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Paciente não encontrado</Text>
          <Text style={styles.description}>
            Não foi possível localizar os dados deste paciente.
          </Text>

          <Pressable style={styles.button} onPress={handleBack}>
            <Text style={styles.buttonText}>Voltar para pacientes</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
      >
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>‹ Voltar para pacientes</Text>
        </Pressable>

        <Text style={styles.title}>{patient.name}</Text>

        <Text style={styles.description}>
          Informações cadastrais do paciente.
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Dados pessoais</Text>

          <Text style={styles.label}>Identificação</Text>
          <Text style={styles.value}>#{patient.id}</Text>

          <Text style={styles.label}>Data de nascimento</Text>
          <Text style={styles.value}>{patient.birth_date}</Text>

          <Text style={styles.label}>Telefone</Text>
          <Text style={styles.value}>{patient.phone || "Não informado"}</Text>

          <Pressable
            style={styles.patientEditButton}
            onPress={handleEditPatient}
          >
            <Text style={styles.patientEditButtonText}>
              Editar dados do paciente
            </Text>
          </Pressable>

          <Pressable
            style={styles.patientDeleteButton}
            onPress={handleDeletePatient}
            disabled={deleting}
          >
            <Text style={styles.patientDeleteButtonText}>
              {deleting ? "Excluindo..." : "Excluir paciente"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>Histórico de saúde</Text>
          <Text style={styles.counter}>{records.length} registro(s)</Text>
        </View>

        <Pressable
          style={styles.button}
          onPress={() =>
            router.push({
              pathname: "/patients/record",
              params: { patientId: patient.id.toString() },
            })
          }
        >
          <Text style={styles.buttonText}>+ Novo registro de saúde</Text>
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
              <Text style={styles.recordDate}>
                {formatDate(record.recorded_at)}
              </Text>

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
    padding: 24,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 18,
    paddingVertical: 8,
  },
  backButtonText: {
    color: "#176B87",
    fontSize: 15,
    fontWeight: "600",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#183153",
  },
  description: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 8,
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#183153",
  },
  label: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 12,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    color: "#183153",
    marginTop: 4,
  },
  patientEditButton: {
    backgroundColor: "#E6F4F8",
    padding: 14,
    borderRadius: 9,
    alignItems: "center",
    marginTop: 20,
  },
  patientEditButtonText: {
    color: "#176B87",
    fontWeight: "600",
    fontSize: 15,
  },
  patientDeleteButton: {
    backgroundColor: "#FDECEC",
    padding: 14,
    borderRadius: 9,
    alignItems: "center",
    marginTop: 10,
  },
  patientDeleteButtonText: {
    color: "#C62828",
    fontWeight: "600",
    fontSize: 15,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  counter: {
    fontSize: 13,
    color: "#64748B",
  },
  button: {
    backgroundColor: "#176B87",
    padding: 17,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    padding: 22,
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#183153",
  },
  emptyDescription: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 8,
    lineHeight: 21,
  },
  recordCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  recordDate: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#176B87",
    marginBottom: 14,
  },
  recordItem: {
    marginTop: 10,
  },
  recordLabel: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 4,
  },
  recordValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#183153",
  },
  recordText: {
    fontSize: 15,
    color: "#183153",
    lineHeight: 22,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
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
