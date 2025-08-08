import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// 🔥 ULTRA-OPTIMIZED NEON CONNECTION POOL
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Ultra-performance settings for Neon
  max: 30,                    // Maximum connections for serverless
  min: 5,                     // Keep warm connections
  idleTimeoutMillis: 20000,   // Faster idle cleanup
  connectionTimeoutMillis: 5000, // Quick connection timeout
  acquireTimeoutMillis: 3000, // Fast acquisition
});

export const db = drizzle({ client: pool, schema });

// Monitor pool performance
pool.on('error', (err) => {
  console.error('🔥 Neon Pool Error:', err);
});

console.log('🚀 Ultra-optimized Neon database pool initialized');
