import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { name, email, role, link, client } = await req.json();

    if (!name || !email || !role || !link) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: `Sentient Field Access — ${client || 'Client'} Shutdown`,
      text: `Hi ${name},

You have been assigned as the ${role} Supervisor for the ${client || 'Client'} shutdown.

Use the link below to access your field view:

${link}

This link is personalised for you. Do not share it with others.

— Sentient`,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (error: any) {
    console.error('Email send error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
