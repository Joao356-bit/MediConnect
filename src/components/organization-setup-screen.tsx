import { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { useAuth } from "@/context/auth-context";
import { createOrganization } from "@/services/organization-service";
type OrganizationSetupScreenProps = {
  onCreated: () => void;
};

export default function OrganizationSetupScreen({
  onCreated,
}: OrganizationSetupScreenProps) {
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");

    const normalizedName = name.trim();

    if (!normalizedName) {
      setError("Informe o nome da clínica.");
      return;
    }

    if (!user) {
      setError("Não foi possível identificar o usuário autenticado.");
      return;
    }

    try {
      setSubmitting(true);

      const result = await createOrganization(normalizedName, user.id);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (!result.data) {
        setError("Não foi possível confirmar a criação da clínica.");
        return;
      }

      onCreated();
    } catch (error) {
      console.error("Erro ao cadastrar clínica:", error);
      setError("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>M</Text>
          </View>

          <Text style={styles.brand}>MediConnect</Text>

          <Text style={styles.subtitle}>
            Gestão e acompanhamento de pacientes
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Cadastre sua clínica</Text>

          <Text style={styles.description}>
            Para começar a utilizar o MediConnect, você precisa cadastrar uma
            organização. Você será definido automaticamente como proprietário da
            clínica.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Nome da clínica</Text>

            <TextInput
              style={styles.input}
              placeholder="Ex.: Clínica Saúde Integrada"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!submitting}
              maxLength={120}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>

          {!!error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            style={[styles.submitButton, submitting && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Criar minha clínica</Text>
            )}
          </Pressable>

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Ao criar a clínica, sua conta receberá automaticamente o papel de
              proprietário (owner).
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>MediConnect 2.0</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    paddingVertical: 40,
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#176B87",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  logoText: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  brand: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#176B87",
  },
  subtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 6,
    textAlign: "center",
  },
  card: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 26,
    borderWidth: 1,
    borderColor: "#E8EEF4",
  },
  title: {
    fontSize: 23,
    fontWeight: "bold",
    color: "#183153",
  },
  description: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 24,
  },
  field: {
    marginBottom: 17,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#183153",
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#DCE5ED",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#183153",
    backgroundColor: "#FFFFFF",
  },
  submitButton: {
    height: 52,
    backgroundColor: "#176B87",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.65,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  errorContainer: {
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 9,
    marginBottom: 12,
  },
  errorText: {
    color: "#991B1B",
    fontSize: 13,
    lineHeight: 19,
  },
  infoContainer: {
    backgroundColor: "#F0F9FF",
    padding: 12,
    borderRadius: 9,
    marginTop: 18,
  },
  infoText: {
    color: "#075985",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
  },
  footer: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 32,
  },
});
