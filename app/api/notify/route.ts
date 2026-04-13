import webpush from 'web-push';
import { NextRequest, NextResponse } from 'next/server';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { subscription, message } = await req.json();

    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: 'Sentient — Update Required',
        body: message || 'Please log your team progress in Sentient.',
        icon: '/icon.png',
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push notification error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}