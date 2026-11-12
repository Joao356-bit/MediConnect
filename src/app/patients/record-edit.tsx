import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type HealthRecord = {
  id: number;
  patient_id: number;
  systolic_pressure: number | null;
  diastolic_pressure: number | null;
  temperature: number | null;
  symptoms: string | null;
  notes: string | null;
};

export default function EditHealthRecordScreen() {
  const db = useSQLiteContext();
  const router = useRouter();

  const { recordId, patientId } = useLocalSearchParams<{
    recordId: string;
    patientId: string;
  }>();

  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [temperature, setTemperature] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  function showMessage(title: string, message: string) {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  }

  function goBackToDetails() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace({
        pathname: "/patients/[id]",
        params: { id: patientId },
      });
    }
  }

  useEffect(() => {
    async function loadRecord() {
      try {
        const id = Number(recordId);
        const patient = Number(patientId);

        if (
          !Number.isInteger(id) ||
          id <= 0 ||
          !Number.isInteger(patient) ||
          patient <= 0
        ) {
          showMessage("Erro", "Identificação inválida.");
          goBackToDetails();
          return;
        }

        const record = await db.getFirstAsync<HealthRecord>(
          `SELECT * FROM health_records
           WHERE id = ? AND patient_id = ?`,
          id,
          patient,
        );

        if (!record) {
          showMessage("Erro", "Registro não encontrado.");
          goBackToDetails();
          return;
        }

        setSystolic(record.systolic_pressure?.toString() ?? "");
        setDiastolic(record.diastolic_pressure?.toString() ?? "");
        setTemperature(record.temperature?.toString().replace(".", ",") ?? "");
        setSymptoms(record.symptoms ?? "");
        setNotes(record.notes ?? "");
      } catch (error) {
        console.error("Erro ao carregar registro:", error);
        showMessage("Erro", "Não foi possível carregar o registro.");
        goBackToDetails();
      } finally {
        setLoading(false);
      }
    }

    loadRecord();
  }, [db, recordId, patientId]);

  async function handleSave() {
    const id = Number(recordId);
    const patient = Number(patientId);

    const hasPressure = systolic.trim() !== "" || diastolic.trim() !== "";

    if (hasPressure && (!systolic.trim() || !diastolic.trim())) {
      showMessage(
        "Pressão incompleta",
        "Preencha os valores sistólico e diastólico.",
      );
      return;
    }

    const systolicValue = systolic.trim() ? Number(systolic) : null;
    const diastolicValue = diastolic.trim() ? Number(diastolic) : null;

    const temperatureValue = temperature.trim()
      ? Number(temperature.replace(",", "."))
      : null;

    if (
      (systolicValue !== null &&
        (!Number.isInteger(systolicValue) || systolicValue <= 0)) ||
      (diastolicValue !== null &&
        (!Number.isInteger(diastolicValue) || diastolicValue <= 0))
    ) {
      showMessage("Valor inválido", "Confira os valores da pressão arterial.");
      return;
    }

    if (
      temperatureValue !== null &&
      (!Number.isFinite(temperatureValue) || temperatureValue <= 0)
    ) {
      showMessage("Valor inválido", "Confira a temperatura informada.");
      return;
    }

    if (
      !hasPressure &&
      temperatureValue === null &&
      !symptoms.trim() &&
      !notes.trim()
    ) {
      showMessage(
        "Registro vazio",
        "Preencha pelo menos uma informação de saúde.",
      );
      return;
    }

    if (saving) return;

    setSaving(true);

    try {
      const result = await db.runAsync(
        `UPDATE health_records
         SET systolic_pressure = ?,
             diastolic_pressure = ?,
             temperature = ?,
             symptoms = ?,
             notes = ?
         WHERE id = ? AND patient_id = ?`,
        systolicValue,
        diastolicValue,
        temperatureValue,
        symptoms.trim() || null,
        notes.trim() || null,
        id,
        patient,
      );

      if (result.changes === 0) {
        showMessage("Aviso", "Nenhuma alteração foi realizada.");
        return;
      }

      if (Platform.OS === "web") {
        window.alert("Sucesso\n\nRegistro atualizado com sucesso!");
        goBackToDetails();
      } else {
        Alert.alert("Sucesso", "Registro atualizado com sucesso!", [
          { text: "OK", onPress: goBackToDetails },
        ]);
      }
    } catch (error) {
      console.error("Erro ao atualizar registro:", error);
      showMessage("Erro", "Não foi possível atualizar o registro.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#176B87" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable style={styles.backButton} onPress={goBackToDetails}>
            <Text style={styles.backButtonText}>‹ Voltar ao paciente</Text>
          </Pressable>

          <Text style={styles.title}>Editar registro</Text>

          <Text style={styles.description}>
            Atualize as informações de saúde cadastradas.
          </Text>

          <Text style={styles.sectionTitle}>Pressão arterial</Text>

          <Text style={styles.label}>Pressão sistólica (mmHg)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex.: 120"
            value={systolic}
            onChangeText={setSystolic}
            keyboardType="number-pad"
          />

          <Text style={styles.label}>Pressão diastólica (mmHg)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex.: 80"
            value={diastolic}
            onChangeText={setDiastolic}
            keyboardType="number-pad"
          />

          <Text style={styles.sectionTitle}>Temperatura corporal</Text>

          <Text style={styles.label}>Temperatura (°C)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex.: 36,5"
            value={temperature}
            onChangeText={setTemperature}
            keyboardType="decimal-pad"
          />

          <Text style={styles.sectionTitle}>Informações adicionais</Text>

          <Text style={styles.label}>Sintomas</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Descreva os sintomas..."
            value={symptoms}
            onChangeText={setSymptoms}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>Observações profissionais</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Adicione observações..."
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />

          <Pressable
            style={[styles.button, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.buttonText}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },
  keyboard: {
    flex: 1,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#183153",
    marginTop: 24,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#183153",
    marginTop: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE3EC",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: "#183153",
  },
  multiline: {
    minHeight: 100,
  },
  button: {
    backgroundColor: "#176B87",
    padding: 17,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 28,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
