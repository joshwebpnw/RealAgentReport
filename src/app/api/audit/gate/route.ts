import { NextRequest, NextResponse } from 'next/server';

async function forwardWithRetry(url: string, body: unknown, maxRetries = 3): Promise<void> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) return;
      console.error(`[AUDIT-GATE] Forward attempt ${attempt + 1} failed: ${res.status}`);
    } catch (err) {
      console.error(`[AUDIT-GATE] Forward attempt ${attempt + 1} error:`, err instanceof Error ? err.message : err);
    }

    if (attempt < maxRetries - 1) {
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  console.error('[AUDIT-GATE] All forward attempts failed, lead may be lost');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const MAIN_APP_URL = process.env.MAIN_APP_URL || 'https://agentassistant.io';

    // Fire-and-forget with retry — don't block the response
    forwardWithRetry(`${MAIN_APP_URL}/api/audit/gate`, body).catch(() => {});

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
