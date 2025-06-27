// migration-manager.ts
// Simple migration manager for Alyssium Core

import { DBClient } from "./db-client";
import * as fs from "fs";
import * as path from "path";

export interface Migration {
  id: string;           // Unique identifier, e.g., timestamp_name
  up: string;           // SQL to apply migration
  down?: string;        // SQL to rollback migration
}

export class MigrationManager {
  private db: DBClient;
  private migrationsTable = "schema_migrations";
  private migrationsDir: string;

  constructor(dbClient: DBClient, migrationsDir = path.join(__dirname, "migrations")) {
    this.db = dbClient;
    this.migrationsDir = migrationsDir;
  }

  // Ensure migrations table exists
  async init(): Promise<void> {
    await this.db.query(
      `CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
        id VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`
    );
  }

  // Load all migration files from directory
  private loadMigrations(): Migration[] {
    const files = fs.readdirSync(this.migrationsDir).filter(f => f.endsWith('.sql'));
    return files.map(file => {
      const id = path.basename(file, '.sql');
      const sql = fs.readFileSync(path.join(this.migrationsDir, file), 'utf-8');
      return { id, up: sql };
    });
  }

  // Get already applied migrations
  private async getApplied(): Promise<Set<string>> {
    const res = await this.db.query<{ id: string }>(
      `SELECT id FROM ${this.migrationsTable}`
    );
    return new Set(res.rows.map(r => r.id));
  }

  // Apply pending migrations
  async migrate(): Promise<void> {
    await this.init();

    const applied = await this.getApplied();
    const all = this.loadMigrations();

    for (const mig of all) {
      if (applied.has(mig.id)) continue;

      console.log(`Applying migration ${mig.id}`);
      await this.db.query(mig.up);
      await this.db.query(
        `INSERT INTO ${this.migrationsTable}(id) VALUES($1)`,
        [mig.id]
      );
    }

    console.log('All migrations applied');
  }
}

// Example usage:
// const db = new DBClient();
// const migrator = new MigrationManager(db);
// await migrator.migrate();
