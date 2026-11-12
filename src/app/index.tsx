import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.brand}>MediConnect</Text>

        <Text style={styles.subtitle}>
          Sistema de cadastro e acompanhamento de pacientes
        </Text>

        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Bem-vindo!</Text>

          <Text style={styles.welcomeDescription}>
            Utilize o aplicativo para registrar pacientes e acompanhar suas
            informações de saúde.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Acesso rápido</Text>

        <Link href="/patients" style={styles.button}>
          <Text style={styles.buttonText}>Consultar pacientes</Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },
  content: {
    flex: 1,
    padding: 24,
  },
  brand: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#176B87",
  },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 8,
    lineHeight: 22,
  },
  welcomeCard: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 14,
    marginTop: 36,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#183153",
  },
  welcomeDescription: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 10,
    lineHeight: 23,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#183153",
    marginTop: 32,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#176B87",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
