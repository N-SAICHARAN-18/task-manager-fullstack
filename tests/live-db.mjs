import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import fs from 'node:fs';
import path from 'node:path';

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local file not found');
  }

  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

async function runLiveDbVerification() {
  console.log('--- Supabase Live Database Verification ---');

  const env = loadEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes('your-project-id')) {
    console.error('FAIL: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not set in .env.local');
    process.exit(1);
  }

  console.log('✓ Configuration detected in .env.local');
  console.log(`✓ Target Supabase Host: ${new URL(url).hostname}`);

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: ws },
  });

  // 1. Test SELECT on tasks
  console.log('1. Testing SELECT query on tasks table...');
  const { data: initialTasks, error: selectError } = await supabase
    .from('tasks')
    .select('id, title, is_completed, created_at')
    .limit(5);

  if (selectError) {
    console.error('FAIL: SELECT query failed:', selectError.message);
    if (selectError.message.includes('relation "public.tasks" does not exist')) {
      console.error('ACTION REQUIRED: Please execute supabase/schema.sql in the Supabase SQL Editor.');
    }
    process.exit(1);
  }
  console.log(`✓ SELECT succeeded! Found ${initialTasks ? initialTasks.length : 0} existing tasks in database.`);

  // 2. Test INSERT
  console.log('2. Testing INSERT operation...');
  const testTitle = `Verification Test Task [${Date.now()}]`;
  const { data: inserted, error: insertError } = await supabase
    .from('tasks')
    .insert([{
      title: testTitle,
      description: 'Temporary verification task for full-stack deployment checks',
      is_completed: false,
    }])
    .select()
    .single();

  if (insertError) {
    console.error('FAIL: INSERT failed:', insertError.message);
    process.exit(1);
  }
  console.log(`✓ INSERT succeeded! Created task ID: ${inserted.id}`);

  // 3. Test UPDATE
  console.log('3. Testing UPDATE operation...');
  const { data: updated, error: updateError } = await supabase
    .from('tasks')
    .update({ is_completed: true, description: 'Updated during automated verification test' })
    .eq('id', inserted.id)
    .select()
    .single();

  if (updateError || !updated.is_completed) {
    console.error('FAIL: UPDATE failed:', updateError ? updateError.message : 'is_completed not updated');
    process.exit(1);
  }
  console.log('✓ UPDATE succeeded! Task status marked as completed.');

  // 4. Test DELETE (Cleanup)
  console.log('4. Testing DELETE (cleanup test task)...');
  const { error: deleteError } = await supabase
    .from('tasks')
    .delete()
    .eq('id', inserted.id);

  if (deleteError) {
    console.error('FAIL: DELETE failed:', deleteError.message);
    process.exit(1);
  }
  console.log('✓ DELETE succeeded! Temporary verification task cleaned up cleanly.');

  console.log('-------------------------------------------');
  console.log('ALL DATABASE CRUD TESTS PASSED SUCCESSFULLY');
}

runLiveDbVerification().catch((err) => {
  console.error('Unexpected error during database verification:', err.message);
  process.exit(1);
});
