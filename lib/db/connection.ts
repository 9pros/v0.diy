import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Validate POSTGRES_URL is available
// Next.js loads environment variables automatically from .env
if (!process.env.POSTGRES_URL) {
  throw new Error(
    "POSTGRES_URL environment variable is not set. Please check your .env file and ensure it contains a valid PostgreSQL connection string.",
  );
}

console.log("🗄️  Initializing PostgreSQL database connection");

const client = postgres(process.env.POSTGRES_URL);
const db = drizzle(client, { schema });

export default db;
