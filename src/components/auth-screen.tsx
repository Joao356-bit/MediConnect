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

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function changeMode(nextMode: "login" | "register") {
    setMode(nextMode);
    setError("");
    setNotice("");
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit() {
    setError("");
    setNotice("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError("Preencha o e-mail e a senha.");
      return;
    }

    if (mode === "register") {
      if (!fullName.trim()) {
        setError("Informe seu nome completo.");
        return;
      }

      if (password.length < 6) {
        setError("A senha deve possuir pelo menos 6 caracteres.");
        return;
      }

      if (password !== confirmPassword) {
        setError("As senhas não coincidem.");
        return;
      }
    }

    try {
      setSubmitting(true);

      if (mode === "login") {
        const result = await signIn(normalizedEmail, password);

        if (result.error) {
          setError(result.error);
        }

        return;
      }

      const result = await signUp(fullName, normalizedEmail, password);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.needsEmailConfirmation) {
        setNotice(
          "Cadastro realizado! Verifique seu e-mail para confirmar sua conta antes de entrar.",
        );

        setMode("login");
        setPassword("");
        setConfirmPassword("");
      }
    } catch {
      setError("Não foi possível concluir a operação. Tente novamente.");
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
          <Text style={styles.title}>
            {mode === "login" ? "Bem-vindo de volta!" : "Criar conta"}
          </Text>

          <Text style={styles.description}>
            {mode === "login"
              ? "Entre na sua conta para continuar."
              : "Cadastre-se para começar a utilizar o MediConnect."}
          </Text>

          {mode === "register" && (
            <View style={styles.field}>
              <Text style={styles.label}>Nome completo</Text>

              <TextInput
                style={styles.input}
                placeholder="Seu nome completo"
                placeholderTextColor="#94A3B8"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                editable={!submitting}
              />
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>E-mail</Text>

            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!submitting}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Senha</Text>

            <TextInput
              style={styles.input}
              placeholder="Digite sua senha"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!submitting}
            />
          </View>

          {mode === "register" && (
            <View style={styles.field}>
              <Text style={styles.label}>Confirmar senha</Text>

              <TextInput
                style={styles.input}
                placeholder="Digite sua senha novamente"
                placeholderTextColor="#94A3B8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!submitting}
              />
            </View>
          )}

          {!!error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {!!notice && (
            <View style={styles.noticeContainer}>
              <Text style={styles.noticeText}>{notice}</Text>
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
              <Text style={styles.submitButtonText}>
                {mode === "login" ? "Entrar" : "Criar minha conta"}
              </Text>
            )}
          </Pressable>

          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>
              {mode === "login"
                ? "Ainda não possui uma conta?"
                : "Já possui uma conta?"}
            </Text>

            <Pressable
              onPress={() =>
                changeMode(mode === "login" ? "register" : "login")
              }
              disabled={submitting}
            >
              <Text style={styles.switchLink}>
                {mode === "login" ? "Cadastre-se" : "Fazer login"}
              </Text>
            </Pressable>
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
  noticeContainer: {
    backgroundColor: "#DCFCE7",
    padding: 12,
    borderRadius: 9,
    marginBottom: 12,
  },
  noticeText: {
    color: "#166534",
    fontSize: 13,
    lineHeight: 19,
  },
  switchContainer: {
    alignItems: "center",
    marginTop: 24,
    gap: 8,
  },
  switchText: {
    color: "#64748B",
    fontSize: 13,
  },
  switchLink: {
    color: "#176B87",
    fontWeight: "700",
    fontSize: 14,
  },
  footer: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 32,
  },
});
