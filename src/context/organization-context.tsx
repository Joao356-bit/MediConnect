import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import { useSQLiteContext } from "expo-sqlite";

import { useAuth } from "@/context/auth-context";
import {
    getMyOrganizationRole,
    getMyOrganizations,
    type Organization,
} from "@/services/organization-service";

export type OrganizationRole = "owner" | "admin" | "professional";

type OrganizationContextData = {
  organizations: Organization[];
  activeOrganization: Organization | null;
  activeRole: OrganizationRole | null;
  loading: boolean;
  error: string | null;
  selectOrganization: (organizationId: string) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
};

const OrganizationContext = createContext<OrganizationContextData | undefined>(
  undefined,
);

type OrganizationProviderProps = {
  children: ReactNode;
};

const LEGACY_PATIENTS_MIGRATION_KEY =
  "legacy_patients_organization_migration_v1";

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const db = useSQLiteContext();
  const { user } = useAuth();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrganization, setActiveOrganization] =
    useState<Organization | null>(null);
  const [activeRole, setActiveRole] = useState<OrganizationRole | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Executa a migração dos pacientes antigos apenas uma vez.
   *
   * Os pacientes anteriores à organização não tinham organization_id.
   * Como os dados antigos pertencem à primeira clínica criada pelo usuário,
   * os registros sem organização são associados à clínica escolhida na
   * primeira inicialização desta migração.
   *
   * O marcador impede que pacientes sem organização sejam associados
   * novamente caso o usuário passe a trabalhar com várias clínicas.
   */
  const migrateLegacyPatients = useCallback(
    async (organizationId: string) => {
      const migration = await db.getFirstAsync<{ value: string }>(
        `SELECT value
         FROM app_settings
         WHERE key = ?`,
        LEGACY_PATIENTS_MIGRATION_KEY,
      );

      if (migration?.value === "completed") {
        return;
      }

      await db.runAsync(
        `UPDATE patients
         SET organization_id = ?
         WHERE organization_id IS NULL`,
        organizationId,
      );

      await db.runAsync(
        `INSERT INTO app_settings (key, value)
         VALUES (?, ?)
         ON CONFLICT(key)
         DO UPDATE SET value = excluded.value`,
        LEGACY_PATIENTS_MIGRATION_KEY,
        "completed",
      );
    },
    [db],
  );

  const saveActiveOrganization = useCallback(
    async (organization: Organization, userId: string) => {
      await migrateLegacyPatients(organization.id);

      await db.runAsync(
        `INSERT INTO app_settings (key, value)
         VALUES (?, ?)
         ON CONFLICT(key)
         DO UPDATE SET value = excluded.value`,
        `active_organization_id:${userId}`,
        organization.id,
      );

      const roleResult = await getMyOrganizationRole(organization.id);

      if (roleResult.error) {
        throw new Error(roleResult.error);
      }

      const role = roleResult.data as OrganizationRole | null;

      if (role !== "owner" && role !== "admin" && role !== "professional") {
        throw new Error(
          "Não foi possível identificar seu papel nesta clínica.",
        );
      }

      setActiveOrganization(organization);
      setActiveRole(role);
    },
    [db, migrateLegacyPatients],
  );

  const refreshOrganizations = useCallback(async () => {
    if (!user) {
      setOrganizations([]);
      setActiveOrganization(null);
      setActiveRole(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getMyOrganizations();

      if (result.error) {
        setOrganizations([]);
        setActiveOrganization(null);
        setActiveRole(null);
        setError(result.error);
        return;
      }

      const availableOrganizations = result.data ?? [];

      setOrganizations(availableOrganizations);

      const setting = await db.getFirstAsync<{ value: string }>(
        `SELECT value
         FROM app_settings
         WHERE key = ?`,
        `active_organization_id:${user.id}`,
      );

      const savedOrganization = availableOrganizations.find(
        (organization) => organization.id === setting?.value,
      );

      if (savedOrganization) {
        await saveActiveOrganization(savedOrganization, user.id);
      } else if (availableOrganizations.length === 1) {
        await saveActiveOrganization(availableOrganizations[0], user.id);
      } else {
        setActiveOrganization(null);
        setActiveRole(null);
      }
    } catch (err) {
      console.error("Erro ao carregar organizações:", err);
      setActiveOrganization(null);
      setActiveRole(null);
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar suas clínicas.",
      );
    } finally {
      setLoading(false);
    }
  }, [user, db, saveActiveOrganization]);

  const selectOrganization = useCallback(
    async (organizationId: string) => {
      if (!user) {
        throw new Error("Usuário não autenticado.");
      }

      const organization = organizations.find(
        (item) => item.id === organizationId,
      );

      if (!organization) {
        throw new Error("Clínica não encontrada ou sem acesso.");
      }

      await saveActiveOrganization(organization, user.id);
    },
    [user, organizations, saveActiveOrganization],
  );

  useEffect(() => {
    refreshOrganizations();
  }, [refreshOrganizations]);

  const value = useMemo(
    () => ({
      organizations,
      activeOrganization,
      activeRole,
      loading,
      error,
      selectOrganization,
      refreshOrganizations,
    }),
    [
      organizations,
      activeOrganization,
      activeRole,
      loading,
      error,
      selectOrganization,
      refreshOrganizations,
    ],
  );

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);

  if (!context) {
    throw new Error(
      "useOrganization deve ser utilizado dentro de OrganizationProvider.",
    );
  }

  return context;
}
