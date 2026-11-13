import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";
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

    const cleanSystolic = systolic.trim();
    const cleanDiastolic = diastolic.trim();
    const cleanTemperature = temperature.trim();
    const cleanSymptoms = symptoms.trim();
    const cleanNotes = notes.trim();

    const hasPressure = cleanSystolic !== "" || cleanDiastolic !== "";

    if (hasPressure && (!cleanSystolic || !cleanDiastolic)) {
      showMessage(
        "Pressão incompleta",
        "Preencha os valores sistólico e diastólico.",
      );
      return;
    }

    const systolicValue = cleanSystolic ? Number(cleanSystolic) : null;

    const diastolicValue = cleanDiastolic ? Number(cleanDiastolic) : null;

    const normalizedTemperature = cleanTemperature.replace(",", ".");

    const temperatureValue = normalizedTemperature
      ? Number(normalizedTemperature)
      : null;

    if (
      systolicValue !== null &&
      (!Number.isSafeInteger(systolicValue) || systolicValue <= 0)
    ) {
      showMessage(
        "Valor inválido",
        "Informe um valor sistólico inteiro e positivo.",
      );
      return;
    }

    if (
      diastolicValue !== null &&
      (!Number.isSafeInteger(diastolicValue) || diastolicValue <= 0)
    ) {
      showMessage(
        "Valor inválido",
        "Informe um valor diastólico inteiro e positivo.",
      );
      return;
    }

    if (
      temperatureValue !== null &&
      (!Number.isFinite(temperatureValue) || temperatureValue <= 0)
    ) {
      showMessage(
        "Valor inválido",
        "Informe uma temperatura numérica e positiva.",
      );
      return;
    }

    if (
      !hasPressure &&
      temperatureValue === null &&
      !cleanSymptoms &&
      !cleanNotes
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
        cleanSymptoms || null,
        cleanNotes || null,
        new Date().toISOString(),
      );

      if (Platform.OS === "web") {
        window.alert("Sucesso\n\nRegistro de saúde salvo com sucesso!");
        returnToPatient(id);
      } else {
        Alert.alert("Sucesso", "Registro de saúde salvo com sucesso!", [
          {
            text: "OK",
            onPress: () => returnToPatient(id),
          },
        ]);
      }
    } catch (error) {
      console.error("Erro ao salvar registro:", error);

      showMessage(
        "Erro",
        "Não foi possível salvar o registro de saúde. Tente novamente.",
      );
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
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
              disabled={saving}
            >
              <Text style={styles.backButtonText}>‹ Voltar</Text>
            </Pressable>

            <Text style={styles.title}>Novo registro de saúde</Text>

            <Text style={styles.description}>
              Registre as informações coletadas durante o acompanhamento do
              paciente.
            </Text>

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Pressão arterial</Text>

              <Text style={styles.sectionDescription}>
                Informe os valores sistólico e diastólico.
              </Text>

              <Text style={styles.label}>Pressão sistólica (mmHg)</Text>

              <TextInput
                style={styles.input}
                placeholder="Ex.: 120"
                placeholderTextColor="#94A3B8"
                value={systolic}
                onChangeText={setSystolic}
                keyboardType="number-pad"
                returnKeyType="next"
                accessibilityLabel="Pressão sistólica em milímetros de mercúrio"
              />

              <Text style={styles.label}>Pressão diastólica (mmHg)</Text>

              <TextInput
                style={styles.input}
                placeholder="Ex.: 80"
                placeholderTextColor="#94A3B8"
                value={diastolic}
                onChangeText={setDiastolic}
                keyboardType="number-pad"
                returnKeyType="next"
                accessibilityLabel="Pressão diastólica em milímetros de mercúrio"
              />

              <View style={styles.divider} />

              <Text style={styles.formTitle}>Temperatura corporal</Text>

              <Text style={styles.label}>Temperatura (°C)</Text>

              <TextInput
                style={styles.input}
                placeholder="Ex.: 36,5"
                placeholderTextColor="#94A3B8"
                value={temperature}
                onChangeText={setTemperature}
                keyboardType="decimal-pad"
                returnKeyType="next"
                accessibilityLabel="Temperatura corporal em graus Celsius"
              />

              <View style={styles.divider} />

              <Text style={styles.formTitle}>Informações adicionais</Text>

              <Text style={styles.label}>Sintomas</Text>

              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="Descreva os sintomas relatados..."
                placeholderTextColor="#94A3B8"
                value={symptoms}
                onChangeText={setSymptoms}
                multiline
                textAlignVertical="top"
                accessibilityLabel="Sintomas relatados pelo paciente"
              />

              <Text style={styles.label}>Observações profissionais</Text>

              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="Adicione observações sobre o atendimento..."
                placeholderTextColor="#94A3B8"
                value={notes}
                onChangeText={setNotes}
                multiline
                textAlignVertical="top"
                accessibilityLabel="Observações profissionais"
              />

              <View style={styles.notice}>
                <Text style={styles.noticeText}>
                  A data e o horário do registro serão preenchidos
                  automaticamente.
                </Text>
              </View>

              <View style={styles.divider} />

              <Pressable
                style={[styles.saveButton, saving && styles.disabledButton]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <View style={styles.savingContent}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.saveButtonText}>Salvando...</Text>
                  </View>
                ) : (
                  <Text style={styles.saveButtonText}>Salvar registro</Text>
                )}
              </Pressable>

              <Pressable
                style={styles.cancelButton}
                onPress={() => router.back()}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
            </View>

            <Text style={styles.footer}>
              Preencha pelo menos uma informação de saúde para salvar.
            </Text>
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
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  content: {
    width: "100%",
    maxWidth: 650,
    alignSelf: "center",
    paddingBottom: 30,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    marginBottom: 20,
  },
  backButtonText: {
    color: "#176B87",
    fontSize: 15,
    fontWeight: "600",
  },
  title: {
    fontSize: 27,
    fontWeight: "bold",
    color: "#183153",
  },
  description: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 8,
    marginBottom: 26,
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    padding: 22,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8EEF4",
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#183153",
  },
  sectionDescription: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 6,
    lineHeight: 19,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#183153",
    marginTop: 20,
    marginBottom: 9,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#DCE3EC",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: "#183153",
  },
  multiline: {
    minHeight: 110,
    paddingTop: 14,
  },
  divider: {
    height: 1,
    backgroundColor: "#E8EEF4",
    marginVertical: 26,
  },
  notice: {
    backgroundColor: "#E6F4F8",
    padding: 14,
    borderRadius: 10,
    marginTop: 22,
  },
  noticeText: {
    fontSize: 12,
    color: "#176B87",
    lineHeight: 19,
  },
  saveButton: {
    backgroundColor: "#176B87",
    padding: 16,
    borderRadius: 11,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.65,
  },
  savingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  cancelButton: {
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  cancelButtonText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 20,
    lineHeight: 18,
  },
});
