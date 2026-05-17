// v2
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

function parseTaskDate(str: string): Date | null {
  if (!str) return null;
  try {
    const parts = str.split(/[/: ]/).map(Number);
    if (parts.length >= 5) return new Date(parts[2], parts[1] - 1, parts[0], parts[3], parts[4]);
    return new Date(str);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== 'Bearer ' + process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: shutdown } = await supabaseAdmin
    .from('shutdowns')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!shutdown) {
    return Response.json({ message: 'No active shutdown' });
  }

  const { data: tasks } = await supabaseAdmin
    .from('tasks')
    .select('id, wo, name, team, start, status')
    .eq('shutdown_id', shutdown.id);

  const { data: supervisors } = await supabaseAdmin
    .from('supervisors')
    .select('id, name, team, push_token, last_notified_at, notif_interval')
    .eq('shutdown_id', shutdown.id)
    .not('push_token', 'is', null);

  const now = new Date();
  const notified: string[] = [];
  const skipped: string[] = [];

  for (const supervisor of supervisors ?? []) {
    const interval = supervisor.notif_interval ?? 2;

    if (supervisor.last_notified_at) {
      const hoursSince = (now.getTime() - new Date(supervisor.last_notified_at).getTime()) / 3_600_000;
      if (hoursSince < interval) {
        skipped.push(supervisor.name);
        continue;
      }
    }

    const supervisorTeams = (supervisor.team ?? '')
      .split(',')
      .map((t: string) => t.trim().toLowerCase())
      .filter(Boolean);

    const pendingTasks = (tasks ?? []).filter((task: any) => {
      if (task.status === 'COMPLETE') return false;
      if (!supervisorTeams.includes((task.team ?? '').toLowerCase())) return false;
      const startDate = parseTaskDate(task.start);
      return startDate !== null && startDate <= now;
    });

    if (pendingTasks.length === 0) {
      skipped.push(supervisor.name);
      continue;
    }

    let pushToken: any;
    try {
      pushToken = JSON.parse(supervisor.push_token);
    } catch {
      continue;
    }

    const task = pendingTasks[0];

    try {
      await webpush.sendNotification(
        {
          endpoint: pushToken.endpoint,
          keys: { p256dh: pushToken.keys.p256dh, auth: pushToken.keys.auth },
        },
        JSON.stringify({
          title: 'Sentient — Update Required',
          body: `Task ${task.wo} — ${task.name} requires a progress update`,
          shutdownId: shutdown.id,
          taskId: task.id,
        })
      );

      await supabaseAdmin
        .from('supervisors')
        .update({ last_notified_at: now.toISOString() })
        .eq('id', supervisor.id);

      notified.push(supervisor.name);
    } catch (err: any) {
      console.error('Push failed for', supervisor.name, ':', err.message);
    }
  }

  return Response.json({ notified, skipped, total: (supervisors ?? []).length });
  } catch (err: any) {
    console.error('[cron/notify] unhandled error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
