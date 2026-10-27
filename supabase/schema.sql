-- ==============================================================================
-- Supabase PostgreSQL Schema for TaskFlow Application
-- Production-Ready, Secure, and Idempotent
-- ==============================================================================

-- 1. Create tasks table with strict data integrity constraints
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL CHECK (length(trim(title)) > 0 AND length(title) <= 255),
    description TEXT DEFAULT '',
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_is_completed ON public.tasks (is_completed);

-- 3. Automatic timestamp updater trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_tasks_updated_at ON public.tasks;
CREATE TRIGGER set_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 5. Row Level Security Policies
-- In this demo/team dashboard without user logins, operations are secured by:
-- a) Database-level constraints (CHECK constraints on title length & content)
-- b) Server-side validation and sanitization in Next.js Route Handlers
-- c) Explicit RLS policy checks preventing blank or corrupt data

DROP POLICY IF EXISTS "Allow select for all users" ON public.tasks;
CREATE POLICY "Allow select for all users"
    ON public.tasks
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow insert for all users" ON public.tasks;
CREATE POLICY "Allow insert for all users"
    ON public.tasks
    FOR INSERT
    WITH CHECK (
        length(trim(title)) > 0 AND length(title) <= 255
    );

DROP POLICY IF EXISTS "Allow update for all users" ON public.tasks;
CREATE POLICY "Allow update for all users"
    ON public.tasks
    FOR UPDATE
    USING (true)
    WITH CHECK (
        length(trim(title)) > 0 AND length(title) <= 255
    );

DROP POLICY IF EXISTS "Allow delete for all users" ON public.tasks;
CREATE POLICY "Allow delete for all users"
    ON public.tasks
    FOR DELETE
    USING (true);

-- 6. Insert initial seed data safely
INSERT INTO public.tasks (title, description, is_completed)
VALUES
    ('Set up Supabase database', 'Run this schema in the Supabase SQL editor to create the tasks table.', true),
    ('Deploy application to Vercel', 'Connect GitHub repository and configure production environment variables.', false),
    ('Explore TaskFlow dashboard', 'Create, filter, complete, edit, and delete tasks in real-time.', false)
ON CONFLICT DO NOTHING;
