import { NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID parameter is required' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching task by ID:', error);
      return NextResponse.json(
        { error: error.message || 'Database error' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: `Task with ID "${id}" was not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ task: data }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('Unexpected error in GET /api/tasks/[id]:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID parameter is required' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
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

    const updates: Record<string, unknown> = {};

    if ('title' in body) {
      if (typeof body.title !== 'string' || body.title.trim().length === 0) {
        return NextResponse.json(
          { error: 'Title cannot be empty.' },
          { status: 400 }
        );
      }
      if (body.title.trim().length > 255) {
        return NextResponse.json(
          { error: 'Title must not exceed 255 characters.' },
          { status: 400 }
        );
      }
      updates.title = body.title.trim();
    }

    if ('description' in body) {
      if (typeof body.description !== 'string') {
        return NextResponse.json(
          { error: 'Description must be a string.' },
          { status: 400 }
        );
      }
      updates.description = body.description.trim();
    }

    if ('is_completed' in body) {
      if (typeof body.is_completed !== 'boolean') {
        return NextResponse.json(
          { error: 'is_completed must be a boolean.' },
          { status: 400 }
        );
      }
      updates.is_completed = body.is_completed;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided for update (title, description, is_completed).' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Check if task exists first
    const { data: existing, error: findError } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (findError) {
      console.error('Error finding task before update:', findError);
      return NextResponse.json({ error: findError.message }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json(
        { error: `Task with ID "${id}" was not found.` },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task in Supabase:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update task' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Task updated successfully',
        task: data,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('Unexpected error in PATCH /api/tasks/[id]:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID parameter is required' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const supabase = getSupabase();

    // Check if task exists
    const { data: existing, error: findError } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (findError) {
      console.error('Error finding task before deletion:', findError);
      return NextResponse.json({ error: findError.message }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json(
        { error: `Task with ID "${id}" was not found.` },
        { status: 404 }
      );
    }

    const { error } = await supabase.from('tasks').delete().eq('id', id);

    if (error) {
      console.error('Error deleting task from Supabase:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to delete task' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Task deleted successfully',
        id,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('Unexpected error in DELETE /api/tasks/[id]:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
