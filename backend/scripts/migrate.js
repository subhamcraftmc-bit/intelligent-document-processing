#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

// Load .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.resolve(__dirname, '../../supabase/migrations');

// Parse CLI flags
const args = process.argv.slice(2);
const getArg = (flag) => {
  const arg = args.find(a => a.startsWith(`--${flag}=`));
  if (arg) return arg.split('=')[1];
  const idx = args.indexOf(`--${flag}`);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return null;
};

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rcviajizjxiiuqsiqwsn.supabase.co';
const SERVICE_ROLE_KEY = getArg('key') || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const DB_PASSWORD = getArg('password') || process.env.DB_PASSWORD || '';
let DATABASE_URL = getArg('db-url') || process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || '';

// Extract Supabase Project Ref
const projectRefMatch = SUPABASE_URL.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i);
const projectRef = projectRefMatch ? projectRefMatch[1] : 'rcviajizjxiiuqsiqwsn';

// If DB_PASSWORD is provided without full DATABASE_URL, construct standard Supabase pooler/direct URL
if (!DATABASE_URL && DB_PASSWORD) {
  // Try direct connection or transaction pooler
  DATABASE_URL = `postgresql://postgres.${projectRef}:${encodeURIComponent(DB_PASSWORD)}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`;
}

console.log('================================================================');
console.log('🚀 Supabase Cloud Migration Runner');
console.log('================================================================');
console.log(`📡 Target Project: ${SUPABASE_URL}`);
console.log(`🔑 Project Ref:    ${projectRef}`);
console.log(`📁 Migrations Dir: ${MIGRATIONS_DIR}`);
console.log('----------------------------------------------------------------');

async function runDirectPgMigration(connectionString) {
  console.log('🔌 Connecting to Supabase Cloud PostgreSQL...');
  
  const client = new pg.Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL successfully!\n');

    // Read all SQL files from migrations directory
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('⚠️ No SQL migration files found in ' + MIGRATIONS_DIR);
      return;
    }

    for (const file of files) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      console.log(`⏳ Applying migration: ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf8');

      const startTime = Date.now();
      await client.query(sql);
      const elapsed = Date.now() - startTime;

      console.log(`✅ Applied ${file} in ${elapsed}ms`);
    }

    console.log('\n🎉 ALL MIGRATIONS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('\n❌ Migration failed with error:');
    console.error(err.message);
    if (err.position) console.error(`Error position: ${err.position}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

async function runApiMigration(serviceRoleKey) {
  console.log('⚡ Attempting migration via Supabase Management / SQL API using service role key...');

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`⏳ Submitting SQL migration ${file}...`);

    try {
      // 1. Try Supabase Management API
      const resp = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`
        },
        body: JSON.stringify({ query: sql })
      });

      if (resp.ok) {
        console.log(`✅ Successfully executed ${file} via Supabase API`);
        continue;
      }

      // 2. Try Supabase RPC exec_sql if available
      const rpcResp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        },
        body: JSON.stringify({ sql })
      });

      if (rpcResp.ok) {
        console.log(`✅ Successfully executed ${file} via Supabase RPC`);
        continue;
      }

      const errText = await resp.text();
      throw new Error(`API returned HTTP ${resp.status}: ${errText}`);
    } catch (err) {
      console.warn(`⚠️ Direct API execution note: ${err.message}`);
      return false;
    }
  }

  return true;
}

async function main() {
  // If direct DATABASE_URL is available
  if (DATABASE_URL) {
    await runDirectPgMigration(DATABASE_URL);
    return;
  }

  // If Service Role Key is available, attempt API migration
  if (SERVICE_ROLE_KEY && !SERVICE_ROLE_KEY.includes('your-service-role-key')) {
    const apiSuccess = await runApiMigration(SERVICE_ROLE_KEY);
    if (apiSuccess) {
      console.log('\n🎉 ALL MIGRATIONS COMPLETED SUCCESSFULLY VIA SERVICE ROLE KEY!');
      return;
    }
  }

  // If credentials are required, provide clean guidance
  console.log('\n💡 To execute this migration directly against your Supabase Cloud PostgreSQL:');
  console.log('');
  console.log('Option 1: Run with your database password:');
  console.log(`  npm run migrate -- --password=YOUR_DB_PASSWORD`);
  console.log('');
  console.log('Option 2: Run with your full PostgreSQL connection URI:');
  console.log(`  npm run migrate -- --db-url="postgresql://postgres.${projectRef}:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"`);
  console.log('  (You can find your connection string in Supabase Dashboard > Project Settings > Database)');
  console.log('');
  console.log('Option 3: 1-Click via Supabase Dashboard SQL Editor (Instant):');
  console.log(`  1. Open: https://supabase.com/dashboard/project/${projectRef}/sql/new`);
  console.log(`  2. Paste contents of: supabase/migrations/001_initial_schema.sql`);
  console.log(`  3. Click "Run" ▶`);
  console.log('================================================================\n');
}

main().catch(err => {
  console.error('Migration runner exception:', err);
  process.exit(1);
});
