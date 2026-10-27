import { NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error: 'Database not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.',
          tasks: [],
          count: 0,
          configured: false,
        },
        { status: 503 }
      );
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks from Supabase:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch tasks from database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      tasks: data || [],
      count: (data || []).length,
      configured: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('Unexpected error in GET /api/tasks:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error: 'Database not configured. Please configure Supabase credentials.',
        },
        { status: 503 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request payload' },
        { status: 400 }
      );
    }

    const { title, description } = body || {};

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Task title is required and cannot be empty.' },
        { status: 400 }
      );
    }

    if (title.trim().length > 255) {
      return NextResponse.json(
        { error: 'Task title must not exceed 255 characters.' },
        { status: 400 }
      );
    }

    const cleanTitle = title.trim();
    const cleanDescription =
      typeof description === 'string' ? description.trim() : '';

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          title: cleanTitle,
          description: cleanDescription,
          is_completed: false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error inserting task into Supabase:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create task' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Task created successfully',
        task: data,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('Unexpected error in POST /api/tasks:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
