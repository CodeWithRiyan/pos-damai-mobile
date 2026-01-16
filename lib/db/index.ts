import { drizzle } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import * as SQLite from 'expo-sqlite';
import * as schema from './schema';
import migrations from '../../drizzle/migrations.js';

const expoDb = SQLite.openDatabaseSync('pos_damai.db');
export const db = drizzle(expoDb, { schema });

export async function initializeDb() {
  try {
    await migrate(db, migrations);
    console.log('Migrations applied successfully');
  } catch (error) {
    console.error('Failed to apply migrations:', error);
    // In some cases, we might need a fallback if the migrator fails
  }
}
