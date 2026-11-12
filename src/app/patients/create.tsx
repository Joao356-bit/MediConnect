import { useRouter } from "expo-router";
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

  function isValidDate(value: string) {
    const pattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!pattern.test(value)) {
      return false;
    }

    const date = new Date(`${value}T00:00:00`);

    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  }

  async function handleSave() {
    const cleanName = name.trim();
    const cleanBirthDate = birthDate.trim();
    const cleanPhone = phone.trim();

    if (!cleanName || !cleanBirthDate) {
      showMessage(
        "Campos obrigatórios",
        "Preencha o nome e a data de nascimento.",
      );
      return;
    }

    if (!isValidDate(cleanBirthDate)) {
      showMessage(
        "Data inválida",
        "Informe uma data válida no formato AAAA-MM-DD. Exemplo: 1995-08-21.",
      );
      return;
    }

    if (saving) return;

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
        "Não foi possível cadastrar o paciente. Verifique o console para mais detalhes.",
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
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Novo paciente</Text>

          <Text style={styles.description}>
            Preencha os dados básicos do paciente.
          </Text>

          <Text style={styles.label}>Nome completo *</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o nome completo"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Data de nascimento *</Text>
          <TextInput
            style={styles.input}
            placeholder="AAAA-MM-DD"
            value={birthDate}
            onChangeText={setBirthDate}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />

          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o telefone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Pressable
            style={[styles.button, saving && styles.disabledButton]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.buttonText}>
              {saving ? "Salvando..." : "Salvar paciente"}
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
    marginBottom: 28,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#183153",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE3EC",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#176B87",
    padding: 17,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 32,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
