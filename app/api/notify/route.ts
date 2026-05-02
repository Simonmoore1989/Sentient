import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { subscription, title, body } = await req.json();

    if (!subscription) {
      return NextResponse.json({ error: 'No subscription provided' }, { status: 400 });
    }

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      }
    };

    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify({ title, body })
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Push notification error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}