import { useRouter } from "expo-router";
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

export default function CreatePatientScreen() {
  const db = useSQLiteContext();
  const router = useRouter();

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

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

  async function handleSave() {
    if (saving) return;

    const cleanName = name.trim();
    const cleanBirthDate = birthDate.trim();
    const cleanPhone = phone.trim();

    if (!cleanName || !cleanBirthDate) {
      showMessage(
        "Campos obrigatórios",
        "Preencha o nome completo e a data de nascimento.",
      );
      return;
    }

    if (!isValidDate(cleanBirthDate)) {
      showMessage(
        "Data inválida",
        "Informe uma data válida, que não seja futura, no formato AAAA-MM-DD. Exemplo: 1995-08-21.",
      );
      return;
    }

    setSaving(true);

    try {
      await db.runAsync(
        `INSERT INTO patients (name, birth_date, phone, created_at)
         VALUES (?, ?, ?, ?)`,
        cleanName,
        cleanBirthDate,
        cleanPhone || null,
        new Date().toISOString(),
      );

      if (Platform.OS === "web") {
        window.alert("Sucesso\n\nPaciente cadastrado com sucesso!");
        router.replace("/patients");
      } else {
        Alert.alert("Sucesso", "Paciente cadastrado com sucesso!", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (error) {
      console.error("Erro ao cadastrar paciente:", error);

      showMessage(
        "Erro",
        "Não foi possível cadastrar o paciente. Tente novamente.",
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
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>‹ Voltar</Text>
            </Pressable>

            <Text style={styles.title}>Novo paciente</Text>

            <Text style={styles.description}>
              Cadastre as informações básicas para iniciar o acompanhamento do
              paciente.
            </Text>

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Informações pessoais</Text>

              <Text style={styles.label}>
                Nome completo <Text style={styles.required}>*</Text>
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Digite o nome completo"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
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
                placeholder="AAAA-MM-DD"
                placeholderTextColor="#94A3B8"
                value={birthDate}
                onChangeText={setBirthDate}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                returnKeyType="next"
                accessibilityLabel="Data de nascimento do paciente"
              />

              <Text style={styles.helperText}>
                Utilize o formato ano-mês-dia. Exemplo: 1995-08-21.
              </Text>

              <Text style={styles.label}>Telefone</Text>

              <TextInput
                style={styles.input}
                placeholder="Digite o telefone"
                placeholderTextColor="#94A3B8"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                returnKeyType="done"
                accessibilityLabel="Telefone do paciente"
              />

              <Text style={styles.helperText}>Campo opcional.</Text>

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
                  <Text style={styles.saveButtonText}>Salvar paciente</Text>
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
    fontSize: 28,
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
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#183153",
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
  helperText: {
    fontSize: 12,
    color: "#94A3B8",
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
