import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

test('Environment Configuration Template', () => {
  const envExamplePath = path.join(rootDir, '.env.example');
  assert.ok(fs.existsSync(envExamplePath), '.env.example file must exist');

  const content = fs.readFileSync(envExamplePath, 'utf-8');
  assert.match(content, /NEXT_PUBLIC_SUPABASE_URL=/, 'Must define NEXT_PUBLIC_SUPABASE_URL');
  assert.match(content, /NEXT_PUBLIC_SUPABASE_ANON_KEY=/, 'Must define NEXT_PUBLIC_SUPABASE_ANON_KEY');
});

test('Supabase SQL Schema Verification', () => {
  const schemaPath = path.join(rootDir, 'supabase', 'schema.sql');
  assert.ok(fs.existsSync(schemaPath), 'supabase/schema.sql must exist');

  const content = fs.readFileSync(schemaPath, 'utf-8');
  assert.match(content, /CREATE TABLE IF NOT EXISTS public\.tasks/i, 'Schema must create tasks table');
  assert.match(content, /ENABLE ROW LEVEL SECURITY/i, 'Schema must enable RLS');
  assert.match(content, /handle_updated_at/i, 'Schema must define updated_at trigger');
  assert.match(content, /CREATE POLICY/i, 'Schema must define security policies');
});

test('Task API Endpoint Files Existence', () => {
  const tasksRoute = path.join(rootDir, 'src', 'app', 'api', 'tasks', 'route.ts');
  const taskByIdRoute = path.join(rootDir, 'src', 'app', 'api', 'tasks', '[id]', 'route.ts');
  const libSupabase = path.join(rootDir, 'src', 'lib', 'supabase.ts');

  assert.ok(fs.existsSync(tasksRoute), 'GET/POST /api/tasks/route.ts must exist');
  assert.ok(fs.existsSync(taskByIdRoute), 'GET/PATCH/DELETE /api/tasks/[id]/route.ts must exist');
  assert.ok(fs.existsSync(libSupabase), 'src/lib/supabase.ts must exist');
});

test('Title Validation Logic', () => {
  const validateTitle = (title) => {
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return { valid: false, error: 'Task title is required and cannot be empty.' };
    }
    if (title.trim().length > 255) {
      return { valid: false, error: 'Task title must not exceed 255 characters.' };
    }
    return { valid: true, cleanTitle: title.trim() };
  };

  assert.equal(validateTitle('').valid, false);
  assert.equal(validateTitle('   ').valid, false);
  assert.equal(validateTitle(null).valid, false);
  assert.equal(validateTitle(undefined).valid, false);
  assert.equal(validateTitle('a'.repeat(256)).valid, false);
  assert.equal(validateTitle('Valid Task Title').valid, true);
  assert.equal(validateTitle('  Trimmed Title  ').cleanTitle, 'Trimmed Title');
});
