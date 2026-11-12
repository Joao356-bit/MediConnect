import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";
import {
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

export default function CreateHealthRecordScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { patientId } = useLocalSearchParams<{ patientId: string }>();

  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [temperature, setTemperature] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  function showMessage(title: string, message: string) {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  }

  function returnToPatient(id: number) {
    router.replace({
      pathname: "/patients/[id]",
      params: { id: String(id) },
    });
  }

  async function handleSave() {
    if (saving) return;

    const id = Number(patientId);

    if (!Number.isInteger(id) || id <= 0) {
      showMessage("Erro", "Identificação do paciente inválida.");
      return;
    }

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

    setSaving(true);

    try {
      const patient = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM patients WHERE id = ?",
        id,
      );

      if (!patient) {
        showMessage("Erro", "Paciente não encontrado.");
        return;
      }

      await db.runAsync(
        `INSERT INTO health_records (
          patient_id,
          systolic_pressure,
          diastolic_pressure,
          temperature,
          symptoms,
          notes,
          recorded_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        id,
        systolicValue,
        diastolicValue,
        temperatureValue,
        symptoms.trim() || null,
        notes.trim() || null,
        new Date().toISOString(),
      );

      if (Platform.OS === "web") {
        window.alert("Sucesso\n\nRegistro de saúde salvo com sucesso!");
        returnToPatient(id);
      } else {
        Alert.alert("Sucesso", "Registro de saúde salvo com sucesso!", [
          { text: "OK", onPress: () => returnToPatient(id) },
        ]);
      }
    } catch (error) {
      console.error("Erro ao salvar registro:", error);
      showMessage("Erro", "Não foi possível salvar o registro.");
    } finally {
      setSaving(false);
    }
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
          <Text style={styles.title}>Novo registro de saúde</Text>

          <Text style={styles.description}>
            Preencha as informações coletadas durante o acompanhamento.
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
            placeholder="Descreva os sintomas relatados..."
            value={symptoms}
            onChangeText={setSymptoms}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>Observações profissionais</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Adicione observações sobre o atendimento..."
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.helper}>
            A data e o horário serão registrados automaticamente.
          </Text>

          <Pressable
            style={[styles.button, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.buttonText}>
              {saving ? "Salvando..." : "Salvar registro"}
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
    lineHeight: 22,
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
  helper: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 20,
    lineHeight: 20,
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
