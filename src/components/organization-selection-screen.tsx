import { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useOrganization } from "@/context/organization-context";

export default function OrganizationSelectionScreen() {
  const { organizations, selectOrganization } = useOrganization();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleSelect(organizationId: string) {
    try {
      setError("");
      setSelectedId(organizationId);

      await selectOrganization(organizationId);
    } catch (err) {
      console.error("Erro ao selecionar clínica:", err);
      setError("Não foi possível selecionar a clínica. Tente novamente.");
      setSelectedId(null);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
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
          <Text style={styles.title}>Selecione sua clínica</Text>

          <Text style={styles.description}>
            Você possui acesso a mais de uma clínica. Escolha aquela que deseja
            utilizar neste momento.
          </Text>

          <View style={styles.list}>
            {organizations.map((organization) => {
              const isSelected = selectedId === organization.id;

              return (
                <Pressable
                  key={organization.id}
                  style={[
                    styles.organizationItem,
                    isSelected && styles.organizationItemSelected,
                  ]}
                  onPress={() => handleSelect(organization.id)}
                  disabled={selectedId !== null}
                >
                  <View style={styles.organizationIcon}>
                    <Text style={styles.organizationIconText}>
                      {organization.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.organizationInfo}>
                    <Text style={styles.organizationName}>
                      {organization.name}
                    </Text>

                    <Text style={styles.organizationDescription}>
                      Acessar esta clínica
                    </Text>
                  </View>

                  {isSelected ? (
                    <ActivityIndicator color="#176B87" />
                  ) : (
                    <Text style={styles.arrow}>›</Text>
                  )}
                </Pressable>
              );
            })}
          </View>

          {!!error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        <Text style={styles.footer}>MediConnect 2.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FB",
  },
  content: {
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
  list: {
    gap: 12,
  },
  organizationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderWidth: 1,
    borderColor: "#DCE5ED",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  organizationItemSelected: {
    borderColor: "#176B87",
    backgroundColor: "#F0F9FF",
  },
  organizationIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  organizationIconText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#176B87",
  },
  organizationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  organizationName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#183153",
  },
  organizationDescription: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  arrow: {
    fontSize: 28,
    color: "#94A3B8",
  },
  errorContainer: {
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 9,
    marginTop: 16,
  },
  errorText: {
    color: "#991B1B",
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 32,
  },
});
