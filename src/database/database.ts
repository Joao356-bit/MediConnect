import type { SQLiteDatabase } from "expo-sqlite";

export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      birth_date TEXT NOT NULL,
      phone TEXT,
      created_at TEXT NOT NULL,
      organization_id TEXT
    );

    CREATE TABLE IF NOT EXISTS health_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      systolic_pressure INTEGER,
      diastolic_pressure INTEGER,
      temperature REAL,
      symptoms TEXT,
      notes TEXT,
      recorded_at TEXT NOT NULL,

      FOREIGN KEY (patient_id)
        REFERENCES patients(id)
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );
  `);

  // Migração de bancos existentes:
  // adiciona organization_id sem apagar os pacientes cadastrados.
  const patientColumns = await db.getAllAsync<{
    name: string;
  }>("PRAGMA table_info(patients)");

  const hasOrganizationId = patientColumns.some(
    (column) => column.name === "organization_id",
  );

  if (!hasOrganizationId) {
    await db.execAsync(`
      ALTER TABLE patients
      ADD COLUMN organization_id TEXT;
    `);
  }

  // Índices para melhorar as consultas por clínica.
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_patients_organization
    ON patients(organization_id);

    CREATE INDEX IF NOT EXISTS idx_health_records_patient
    ON health_records(patient_id);
  `);
}
