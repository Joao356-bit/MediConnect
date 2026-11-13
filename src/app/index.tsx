import { Link, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type DashboardStats = {
  patients: number;
  records: number;
};

type RecentRecord = {
  id: number;
  patient_name: string;
  recorded_at: string;
  systolic_pressure: number | null;
  diastolic_pressure: number | null;
  temperature: number | null;
};

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function HomeScreen() {
  const db = useSQLiteContext();

  const [stats, setStats] = useState<DashboardStats>({
    patients: 0,
    records: 0,
  });

  const [recentRecords, setRecentRecords] = useState<RecentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadDashboard() {
        try {
          setLoading(true);
          setError(false);

          const patientsResult = await db.getFirstAsync<{
            total: number;
          }>("SELECT COUNT(*) AS total FROM patients");

          const recordsResult = await db.getFirstAsync<{
            total: number;
          }>("SELECT COUNT(*) AS total FROM health_records");

          const records = await db.getAllAsync<RecentRecord>(`
            SELECT
              health_records.id,
              patients.name AS patient_name,
              health_records.recorded_at,
              health_records.systolic_pressure,
              health_records.diastolic_pressure,
              health_records.temperature
            FROM health_records
            INNER JOIN patients
              ON patients.id = health_records.patient_id
            ORDER BY health_records.recorded_at DESC
            LIMIT 5
          `);

          if (active) {
            setStats({
              patients: patientsResult?.total ?? 0,
              records: recordsResult?.total ?? 0,
            });

            setRecentRecords(records);
          }
        } catch (err) {
          console.error("Erro ao carregar dashboard:", err);

          if (active) {
            setError(true);
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      loadDashboard();

      return () => {
        active = false;
      };
    }, [db]),
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>MediConnect</Text>
            <Text style={styles.subtitle}>
              Gestão e acompanhamento de pacientes
            </Text>
          </View>
        </View>

        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Bem-vindo!</Text>
          <Text style={styles.welcomeDescription}>
            Acompanhe os pacientes cadastrados e seus registros de saúde em um
            só lugar.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Visão geral</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#176B87" />
            <Text style={styles.loadingText}>Carregando informações...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>
              Não foi possível carregar os dados do dashboard.
            </Text>
          </View>
        ) : (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Pacientes</Text>
              <Text style={styles.statValue}>{stats.patients}</Text>
              <Text style={styles.statDescription}>Cadastrados no sistema</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Registros de saúde</Text>
              <Text style={styles.statValue}>{stats.records}</Text>
              <Text style={styles.statDescription}>Registros realizados</Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Acesso rápido</Text>

        <View style={styles.actionsContainer}>
          <Link href="/patients" asChild>
            <Pressable style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Consultar pacientes</Text>
            </Pressable>
          </Link>

          <Link href="/patients/create" asChild>
            <Pressable style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Cadastrar paciente</Text>
            </Pressable>
          </Link>
        </View>

        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>Atividades recentes</Text>
          <Text style={styles.recentSubtitle}>Últimos 5 registros</Text>
        </View>

        {loading ? null : error ? null : recentRecords.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nenhum registro encontrado</Text>
            <Text style={styles.emptyDescription}>
              Os registros de saúde adicionados aparecerão aqui.
            </Text>
          </View>
        ) : (
          <View style={styles.recordsContainer}>
            {recentRecords.map((record) => (
              <View key={record.id} style={styles.recordCard}>
                <Text style={styles.recordPatient}>{record.patient_name}</Text>

                <Text style={styles.recordDate}>
                  {formatDate(record.recorded_at)}
                </Text>

                <View style={styles.recordDetails}>
                  {record.systolic_pressure !== null &&
                    record.diastolic_pressure !== null && (
                      <Text style={styles.recordDetail}>
                        Pressão: {record.systolic_pressure}/
                        {record.diastolic_pressure} mmHg
                      </Text>
                    )}

                  {record.temperature !== null && (
                    <Text style={styles.recordDetail}>
                      Temperatura: {record.temperature} °C
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.footer}>MediConnect 2.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 28,
  },
  brand: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#176B87",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 6,
  },
  welcomeCard: {
    backgroundColor: "#176B87",
    padding: 24,
    borderRadius: 18,
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 23,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  welcomeDescription: {
    fontSize: 14,
    color: "#E7F3F7",
    marginTop: 10,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#183153",
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8EEF4",
  },
  statLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  statValue: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#176B87",
    marginTop: 10,
  },
  statDescription: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 5,
  },
  loadingContainer: {
    padding: 30,
    alignItems: "center",
    marginBottom: 20,
  },
  loadingText: {
    color: "#64748B",
    marginTop: 12,
  },
  errorCard: {
    backgroundColor: "#FEE2E2",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  errorText: {
    color: "#991B1B",
    fontSize: 14,
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: "#176B87",
    padding: 17,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    padding: 17,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#176B87",
  },
  secondaryButtonText: {
    color: "#176B87",
    fontSize: 15,
    fontWeight: "600",
  },
  recentHeader: {
    marginBottom: 4,
  },
  recentSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: -10,
    marginBottom: 16,
  },
  recordsContainer: {
    gap: 12,
  },
  recordCard: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8EEF4",
  },
  recordPatient: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#183153",
  },
  recordDate: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 5,
  },
  recordDetails: {
    marginTop: 12,
    gap: 5,
  },
  recordDetail: {
    fontSize: 13,
    color: "#64748B",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    padding: 22,
    borderRadius: 14,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#183153",
  },
  emptyDescription: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  footer: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 36,
  },
});
