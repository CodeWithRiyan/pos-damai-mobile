import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import * as SQLite from "expo-sqlite";
import * as schema from "./schema";
import migrations from "../../drizzle/migrations.js";

const expoDb = SQLite.openDatabaseSync("pos_damai.db");
export const db = drizzle(expoDb, { schema });

export async function initializeDb() {
  try {
    await migrate(db, migrations);
    console.log("Migrations applied successfully");
  } catch (error) {
    console.error("Failed to apply migrations:", error);
    // In some cases, we might need a fallback if the migrator fails
    throw error; // Rethrow to let RootLayout handle it if needed
  }
}

export async function resetDb() {
  try {
    const tableNames = await expoDb.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    );

    for (const { name } of tableNames) {
      await expoDb.execAsync(`DROP TABLE IF EXISTS ${name}`);
      console.log(`Dropped table: ${name}`);
    }

    // Also clear Async Storage to remove stale auth/sync data
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.warn("Silently ignored AsyncStorage clear error:", e);
    }

    console.log("Database and storage reset successfully");
  } catch (error) {
    console.error("Error resetting database:", error);
    throw error;
  }
}

export async function checkAndResetDbOnUpdate() {
  try {
    const lastRunVersion = await AsyncStorage.getItem("last_run_version");
    const currentVersion = Application.nativeApplicationVersion || "1.0.0";
    const buildVersion = Application.nativeBuildVersion || "1";
    // Combine version and build number to be sure
    const fullCurrentVersion = `${currentVersion}-${buildVersion}`;

    console.log(
      `[DB Check] Last: ${lastRunVersion}, Current: ${fullCurrentVersion}`,
    );

    if (lastRunVersion !== fullCurrentVersion) {
      console.warn(
        `[DB Check] App updated from ${lastRunVersion} to ${fullCurrentVersion}. Automatic reset disabled to prevent data loss.`,
      );
      // await resetDb(); // Disabled to prevent accidental data loss of _dirty records
      await AsyncStorage.setItem("last_run_version", fullCurrentVersion);
      // Ensure DB is initialized regardless of version change
      await initializeDb();
      return false; // Indicates no reset happened now
    }
    return false;
  } catch (error) {
    console.error("Error checking for update reset:", error);
    return false;
  }
}
