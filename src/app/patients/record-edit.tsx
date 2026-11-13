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
  View,
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
    if (saving || loading) return;

    const id = Number(recordId);
    const patient = Number(patientId);

    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      !Number.isInteger(patient) ||
      patient <= 0
    ) {
      showMessage("Erro", "Identificação inválida.");
      return;
    }

    const systolicText = systolic.trim();
    const diastolicText = diastolic.trim();
    const temperatureText = temperature.trim();

    const hasPressure = systolicText !== "" || diastolicText !== "";

    if (hasPressure && (!systolicText || !diastolicText)) {
      showMessage(
        "Pressão incompleta",
        "Preencha os valores sistólico e diastólico.",
      );
      return;
    }

    const systolicValue = systolicText ? Number(systolicText) : null;

    const diastolicValue = diastolicText ? Number(diastolicText) : null;

    const temperatureValue = temperatureText
      ? Number(temperatureText.replace(",", "."))
      : null;

    if (
      (systolicValue !== null &&
        (!Number.isSafeInteger(systolicValue) || systolicValue <= 0)) ||
      (diastolicValue !== null &&
        (!Number.isSafeInteger(diastolicValue) || diastolicValue <= 0))
    ) {
      showMessage(
        "Valor inválido",
        "Confira os valores da pressão arterial. Informe números inteiros positivos.",
      );
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
        showMessage(
          "Aviso",
          "Nenhuma alteração foi realizada. Verifique se o registro ainda existe.",
        );
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
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#176B87" />
        <Text style={styles.loadingText}>Carregando registro...</Text>
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
          <View style={styles.formContainer}>
            <Pressable style={styles.backButton} onPress={goBackToDetails}>
              <Text style={styles.backButtonText}>‹ Voltar ao paciente</Text>
            </Pressable>

            <View style={styles.header}>
              <Text style={styles.title}>Editar registro</Text>

              <Text style={styles.description}>
                Atualize as informações de saúde cadastradas para este paciente.
              </Text>
            </View>

            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                Os campos são opcionais, mas você precisa preencher pelo menos
                uma informação antes de salvar.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Pressão arterial</Text>

              <Text style={styles.sectionDescription}>
                Informe os valores em milímetros de mercúrio (mmHg).
              </Text>

              <Text style={styles.label}>Pressão sistólica</Text>

              <TextInput
                style={styles.input}
                placeholder="Ex.: 120"
                placeholderTextColor="#94A3B8"
                value={systolic}
                onChangeText={setSystolic}
                keyboardType="number-pad"
              />

              <Text style={styles.label}>Pressão diastólica</Text>

              <TextInput
                style={styles.input}
                placeholder="Ex.: 80"
                placeholderTextColor="#94A3B8"
                value={diastolic}
                onChangeText={setDiastolic}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Temperatura corporal</Text>

              <Text style={styles.sectionDescription}>
                Informe a temperatura em graus Celsius.
              </Text>

              <Text style={styles.label}>Temperatura (°C)</Text>

              <TextInput
                style={styles.input}
                placeholder="Ex.: 36,5"
                placeholderTextColor="#94A3B8"
                value={temperature}
                onChangeText={setTemperature}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Informações adicionais</Text>

              <Text style={styles.sectionDescription}>
                Registre sintomas e observações relevantes.
              </Text>

              <Text style={styles.label}>Sintomas</Text>

              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="Descreva os sintomas apresentados..."
                placeholderTextColor="#94A3B8"
                value={symptoms}
                onChangeText={setSymptoms}
                multiline
                textAlignVertical="top"
              />

              <Text style={styles.label}>Observações profissionais</Text>

              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="Adicione observações sobre o registro..."
                placeholderTextColor="#94A3B8"
                value={notes}
                onChangeText={setNotes}
                multiline
                textAlignVertical="top"
              />
            </View>

            <Pressable
              style={[styles.saveButton, saving && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Salvar alterações</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.cancelButton}
              onPress={goBackToDetails}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F7FB",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 14,
  },
  keyboard: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
    paddingBottom: 40,
  },
  formContainer: {
    width: "100%",
    maxWidth: 650,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    marginBottom: 18,
  },
  backButtonText: {
    color: "#176B87",
    fontSize: 15,
    fontWeight: "600",
  },
  header: {
    marginBottom: 22,
  },
  title: {
    color: "#183153",
    fontSize: 28,
    fontWeight: "700",
  },
  description: {
    color: "#64748B",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  notice: {
    backgroundColor: "#E8F3F7",
    borderWidth: 1,
    borderColor: "#C8E1EA",
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  noticeText: {
    color: "#24566B",
    fontSize: 13,
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#183153",
    fontSize: 18,
    fontWeight: "700",
  },
  sectionDescription: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
    marginBottom: 12,
  },
  label: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE3EC",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: "#183153",
  },
  multiline: {
    minHeight: 110,
    paddingTop: 13,
  },
  saveButton: {
    backgroundColor: "#176B87",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 15,
    marginTop: 6,
  },
  cancelButtonText: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "600",
  },
});
