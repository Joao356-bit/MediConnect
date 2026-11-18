import { useCallback } from "react";

import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SQLiteProvider } from "expo-sqlite";

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AppTabs from "@/components/app-tabs";
import AuthScreen from "@/components/auth-screen";
import OrganizationSelectionScreen from "@/components/organization-selection-screen";
import OrganizationSetupScreen from "@/components/organization-setup-screen";

import { AuthProvider, useAuth } from "@/context/auth-context";
import {
  OrganizationProvider,
  useOrganization,
} from "@/context/organization-context";

import { initializeDatabase } from "@/database/database";

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { user, loading: authLoading } = useAuth();

  const {
    organizations,
    activeOrganization,
    loading: organizationLoading,
    error: organizationError,
    refreshOrganizations,
  } = useOrganization();

  const retry = useCallback(() => {
    refreshOrganizations();
  }, [refreshOrganizations]);

  if (authLoading || (user && organizationLoading)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#176B87" />

        <Text style={styles.loadingText}>
          {authLoading
            ? "Verificando autenticação..."
            : "Carregando suas clínicas..."}
        </Text>
      </View>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (organizationError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorTitle}>
          Não foi possível carregar suas clínicas
        </Text>

        <Text style={styles.errorText}>{organizationError}</Text>

        <Pressable style={styles.retryButton} onPress={retry}>
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  if (organizations.length === 0) {
    return <OrganizationSetupScreen onCreated={retry} />;
  }

  if (!activeOrganization) {
    return <OrganizationSelectionScreen />;
  }

  return <AppTabs />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SQLiteProvider databaseName="mediconnect.db" onInit={initializeDatabase}>
      <AuthProvider>
        <OrganizationProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <AnimatedSplashOverlay />
            <AppContent />
          </ThemeProvider>
        </OrganizationProvider>
      </AuthProvider>
    </SQLiteProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F4F7FB",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 14,
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
  },
  errorTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#183153",
    textAlign: "center",
  },
  errorText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },
  retryButton: {
    marginTop: 22,
    backgroundColor: "#176B87",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
