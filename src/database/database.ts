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
      created_at TEXT NOT NULL
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
  `);
}
