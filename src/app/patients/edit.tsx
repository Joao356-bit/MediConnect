import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

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

  useEffect(() => {
    async function loadPatient() {
      try {
        const patient = await db.getFirstAsync<Patient>(
          "SELECT * FROM patients WHERE id = ?",
          Number(patientId),
        );

        if (!patient) {
          Alert.alert("Erro", "Paciente não encontrado.");
          router.back();
          return;
        }

        setName(patient.name);
        setBirthDate(patient.birth_date);
        setPhone(patient.phone ?? "");
      } catch (error) {
        console.error("Erro ao carregar paciente:", error);
        Alert.alert("Erro", "Não foi possível carregar os dados do paciente.");
      } finally {
        setLoading(false);
      }
    }

    if (patientId) {
      loadPatient();
    }
  }, [db, patientId]);

  async function handleSave() {
    const cleanName = name.trim();
    const cleanBirthDate = birthDate.trim();
    const cleanPhone = phone.trim();

    if (!cleanName || !cleanBirthDate) {
      Alert.alert(
        "Campos obrigatórios",
        "Informe o nome e a data de nascimento.",
      );
      return;
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!datePattern.test(cleanBirthDate)) {
      Alert.alert(
        "Data inválida",
        "Informe a data no formato AAAA-MM-DD. Exemplo: 1990-05-20.",
      );
      return;
    }

    const parsedDate = new Date(`${cleanBirthDate}T00:00:00`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== cleanBirthDate
    ) {
      Alert.alert("Data inválida", "Informe uma data válida.");
      return;
    }

    if (saving) return;

    setSaving(true);

    try {
      await db.runAsync(
        `UPDATE patients
         SET name = ?, birth_date = ?, phone = ?
         WHERE id = ?`,
        cleanName,
        cleanBirthDate,
        cleanPhone || null,
        Number(patientId),
      );

      Alert.alert("Sucesso", "Dados do paciente atualizados.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Erro ao atualizar paciente:", error);
      Alert.alert("Erro", "Não foi possível atualizar os dados.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Carregando dados...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Editar paciente</Text>
        <Text style={styles.subtitle}>
          Atualize as informações cadastrais do paciente.
        </Text>

        <Text style={styles.label}>Nome completo *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Nome do paciente"
          placeholderTextColor="#8492A6"
          autoCapitalize="words"
        />

        <Text style={styles.label}>Data de nascimento *</Text>
        <TextInput
          style={styles.input}
          value={birthDate}
          onChangeText={setBirthDate}
          placeholder="AAAA-MM-DD"
          placeholderTextColor="#8492A6"
          keyboardType="numbers-and-punctuation"
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
          placeholderTextColor="#8492A6"
          keyboardType="phone-pad"
        />

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F7FB",
  },
  loadingText: {
    color: "#183153",
    fontSize: 16,
  },
  title: {
    color: "#183153",
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    color: "#64748B",
    fontSize: 15,
    marginBottom: 28,
  },
  label: {
    color: "#183153",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8E1EC",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#183153",
  },
  helper: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 6,
  },
  saveButton: {
    backgroundColor: "#176B87",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 32,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    padding: 15,
    alignItems: "center",
    marginTop: 8,
  },
  cancelButtonText: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "600",
  },
});
