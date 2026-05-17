import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

const ADMIN_EMAIL = 'flooklimited@outlook.com';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email === ADMIN_EMAIL;
}

export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdmin(request);
  console.log('[admin/route] verifyAdmin:', isAdmin);

  if (!isAdmin) {
    console.log('[admin/route] Unauthorized — session cookie may be missing or email mismatch');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log('[admin/route] type:', type, '| service key set:', !!serviceKey && serviceKey !== 'your_service_role_key_here');

  const admin = adminClient();

  if (type === 'users') {
    const { data, error } = await admin.auth.admin.listUsers();
    console.log('[admin/route] listUsers — count:', data?.users?.length ?? 0, '| error:', error?.message ?? null);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ users: data.users });
  }

  if (type === 'shutdowns') {
    const { data, error } = await admin
      .from('shutdowns')
      .select('*')
      .order('created_at', { ascending: false });
    console.log('[admin/route] shutdowns — count:', data?.length ?? 0, '| error:', error?.message ?? null);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ shutdowns: data });
  }

  if (type === 'tasks') {
    const shutdownId = searchParams.get('shutdownId');
    if (!shutdownId) return NextResponse.json({ error: 'Missing shutdownId' }, { status: 400 });
    const { data, error } = await admin
      .from('tasks')
      .select('id, wo, name, team, status, progress, start, end, duration, ops, critical, predecessors, successors, actual_start, actual_finish, created_at')
      .eq('shutdown_id', shutdownId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ tasks: data });
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { email, password } = await request.json();
  const admin = adminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ user: data.user });
}

export async function DELETE(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { userId, shutdownId } = body;

  const admin = adminClient();

  if (shutdownId) {
    console.log('[admin/route] DELETE shutdown:', shutdownId);
    const { error: tasksErr } = await admin.from('tasks').delete().eq('shutdown_id', shutdownId);
    if (tasksErr) console.error('[admin/route] tasks delete error:', tasksErr.message);
    const { error: supervisorsErr } = await admin.from('supervisors').delete().eq('shutdown_id', shutdownId);
    if (supervisorsErr) console.error('[admin/route] supervisors delete error:', supervisorsErr.message);
    const { error: shutdownErr } = await admin.from('shutdowns').delete().eq('id', shutdownId);
    if (shutdownErr) {
      console.error('[admin/route] shutdown delete error:', shutdownErr.message);
      return NextResponse.json({ error: shutdownErr.message }, { status: 500 });
    }
    console.log('[admin/route] shutdown deleted successfully:', shutdownId);
    return NextResponse.json({ success: true });
  }

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId or shutdownId' }, { status: 400 });
  }

  console.log('[admin/route] DELETE user:', userId);

  // Delete tasks first, then shutdowns, then the auth user
  const { error: tasksError } = await admin.from('tasks').delete().eq('user_id', userId);
  if (tasksError) console.error('[admin/route] tasks delete error:', tasksError.message);

  const { error: shutdownsError } = await admin.from('shutdowns').delete().eq('user_id', userId);
  if (shutdownsError) console.error('[admin/route] shutdowns delete error:', shutdownsError.message);

  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) {
    console.error('[admin/route] deleteUser error:', authError.message);
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  console.log('[admin/route] user deleted successfully:', userId);
  return NextResponse.json({ success: true });
}
