import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

function parseDate(str: string): Date | null {
  if (!str) return null;
  const parts = str.split(/[/: ]/).map(Number);
  if (parts.length >= 5) return new Date(parts[2], parts[1] - 1, parts[0], parts[3], parts[4]);
  return new Date(str);
}

export async function POST(req: NextRequest) {
  try {
    const { taskId, opIndex, shutdownId, action } = await req.json();

    if (!taskId || opIndex === undefined || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const ops = [...(task.ops || [])];
    const op = ops[opIndex];
    if (!op) {
      return NextResponse.json({ error: 'Op not found' }, { status: 404 });
    }

    if (action === 'on_track') {
      const start = parseDate(op.start);
      const end = parseDate(op.end);
      const now = new Date();
      let progress = op.progress || 0;

      if (start && end) {
        const total = end.getTime() - start.getTime();
        const elapsed = now.getTime() - start.getTime();
        progress = Math.min(99, Math.max(progress, Math.round((elapsed / total) * 100)));
      }

      ops[opIndex] = { ...op, progress, status: 'IN PROGRESS' };
    } else if (action === 'complete') {
      ops[opIndex] = { ...op, progress: 100, status: 'COMPLETE' };
    }

    const overallProgress = Math.round(
      ops.reduce((sum: number, o: any) => sum + (o.progress || 0), 0) / ops.length
    );

    const allComplete = ops.every((o: any) => o.status === 'COMPLETE' || o.progress === 100);
    const anyDelayed = ops.some((o: any) => o.status === 'DELAYED');
    const anyInProgress = ops.some((o: any) => (o.status === 'IN PROGRESS') || (o.progress > 0 && o.progress < 100));

    const newStatus = allComplete ? 'COMPLETE'
      : anyDelayed ? 'DELAYED'
      : anyInProgress ? 'IN PROGRESS'
      : 'PENDING';

    await supabase
      .from('tasks')
      .update({ ops, progress: overallProgress, status: newStatus })
      .eq('id', taskId);

    return NextResponse.json({ success: true, progress: overallProgress, status: newStatus });
  } catch (error: any) {
    console.error('Quick update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
