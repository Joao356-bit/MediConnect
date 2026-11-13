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

type Patient = {
  id: number;
  name: string;
  birth_date: string;
  phone: string | null;
};

export default function EditPatientScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { patientId } = useLocalSearchParams<{ patientId: string }>();

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);

  function showMessage(title: string, message: string) {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  }

  function isValidDate(value: string): boolean {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (!match) {
      return false;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const date = new Date(year, month - 1, day);

    const valid =
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day;

    if (!valid) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return date <= today;
  }

  useEffect(() => {
    let active = true;

    async function loadPatient() {
      try {
        setLoading(true);
        setLoadError(false);

        const id = Number(patientId);

        if (!Number.isInteger(id) || id <= 0) {
          if (active) {
            setLoadError(true);
          }
          return;
        }

        const patient = await db.getFirstAsync<Patient>(
          "SELECT * FROM patients WHERE id = ?",
          id,
        );

        if (!active) return;

        if (!patient) {
          setLoadError(true);
          return;
        }

        setName(patient.name);
        setBirthDate(patient.birth_date);
        setPhone(patient.phone ?? "");
      } catch (error) {
        console.error("Erro ao carregar paciente:", error);

        if (active) {
          setLoadError(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPatient();

    return () => {
      active = false;
    };
  }, [db, patientId]);

  async function handleSave() {
    if (saving) return;

    const id = Number(patientId);
    const cleanName = name.trim();
    const cleanBirthDate = birthDate.trim();
    const cleanPhone = phone.trim();

    if (!Number.isInteger(id) || id <= 0) {
      showMessage("Erro", "Identificação do paciente inválida.");
      return;
    }

    if (!cleanName || !cleanBirthDate) {
      showMessage(
        "Campos obrigatórios",
        "Informe o nome completo e a data de nascimento.",
      );
      return;
    }

    if (!isValidDate(cleanBirthDate)) {
      showMessage(
        "Data inválida",
        "Informe uma data válida, que não seja futura, no formato AAAA-MM-DD. Exemplo: 1990-05-20.",
      );
      return;
    }

    setSaving(true);

    try {
      const result = await db.runAsync(
        `UPDATE patients
         SET name = ?, birth_date = ?, phone = ?
         WHERE id = ?`,
        cleanName,
        cleanBirthDate,
        cleanPhone || null,
        id,
      );

      if (result.changes === 0) {
        showMessage(
          "Paciente não encontrado",
          "Não foi possível localizar o paciente para atualizar.",
        );
        return;
      }

      if (Platform.OS === "web") {
        window.alert("Sucesso\n\nDados do paciente atualizados.");
        router.back();
      } else {
        Alert.alert("Sucesso", "Dados do paciente atualizados.", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (error) {
      console.error("Erro ao atualizar paciente:", error);

      showMessage(
        "Erro",
        "Não foi possível atualizar os dados do paciente. Tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#176B87" />
          <Text style={styles.loadingText}>
            Carregando dados do paciente...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>
            Não foi possível carregar o paciente
          </Text>

          <Text style={styles.errorDescription}>
            Verifique se o paciente ainda está cadastrado.
          </Text>

          <Pressable style={styles.saveButton} onPress={() => router.back()}>
            <Text style={styles.saveButtonText}>Voltar</Text>
          </Pressable>
        </View>
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

            <Text style={styles.title}>Editar paciente</Text>

            <Text style={styles.subtitle}>
              Atualize as informações cadastrais do paciente.
            </Text>

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Informações pessoais</Text>

              <Text style={styles.label}>
                Nome completo <Text style={styles.required}>*</Text>
              </Text>

              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nome do paciente"
                placeholderTextColor="#94A3B8"
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
                accessibilityLabel="Nome completo do paciente"
              />

              <Text style={styles.label}>
                Data de nascimento <Text style={styles.required}>*</Text>
              </Text>

              <TextInput
                style={styles.input}
                value={birthDate}
                onChangeText={setBirthDate}
                placeholder="AAAA-MM-DD"
                placeholderTextColor="#94A3B8"
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                returnKeyType="next"
                accessibilityLabel="Data de nascimento do paciente"
              />

              <Text style={styles.helper}>
                Utilize o formato ano-mês-dia. Exemplo: 1990-05-20.
              </Text>

              <Text style={styles.label}>Telefone</Text>

              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Telefone (opcional)"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                returnKeyType="done"
                accessibilityLabel="Telefone do paciente"
              />

              <Text style={styles.helper}>Campo opcional.</Text>

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
                  <Text style={styles.saveButtonText}>Salvar alterações</Text>
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
              Os campos marcados com * são obrigatórios.
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 12,
  },
  errorTitle: {
    color: "#183153",
    fontSize: 19,
    fontWeight: "bold",
    textAlign: "center",
  },
  errorDescription: {
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 24,
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
    color: "#183153",
    fontSize: 28,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#64748B",
    fontSize: 14,
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
    marginBottom: 10,
  },
  label: {
    color: "#183153",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 9,
    marginTop: 20,
  },
  required: {
    color: "#DC2626",
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
  helper: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 7,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: "#E8EEF4",
    marginTop: 26,
    marginBottom: 22,
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
    color: "#94A3B8",
    fontSize: 12,
    textAlign: "center",
    marginTop: 20,
  },
});
