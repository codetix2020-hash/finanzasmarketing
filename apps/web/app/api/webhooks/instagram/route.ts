import { NextRequest, NextResponse } from 'next/server';

const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;

if (!VERIFY_TOKEN && process.env.NODE_ENV === "production") {
	throw new Error("INSTAGRAM_WEBHOOK_VERIFY_TOKEN is not set. Set it in Railway environment variables.");
}

// GET: Verificación inicial de Facebook
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && VERIFY_TOKEN && token === VERIFY_TOKEN) {
    console.log('Instagram webhook verified');
    return new NextResponse(challenge, { status: 200 });
  } else {
    return new NextResponse('Forbidden', { status: 403 });
  }
}

// POST: Recibir eventos de Instagram
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Instagram webhook received:', JSON.stringify(body, null, 2));
    
    // TODO: Procesar eventos (comentarios, menciones, etc)
    
    return NextResponse.json({ status: 'received' }, { status: 200 });
  } catch (error) {
    console.error('Instagram webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}











