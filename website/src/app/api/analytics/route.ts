import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { platform, version } = await req.json();
    const userAgent = req.headers.get('user-agent') || 'unknown';

    const { error } = await supabase
      .from('download_analytics')
      .insert([
        { platform, version, user_agent: userAgent }
      ]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Analytics Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('download_counts')
      .select('*');

    if (error) throw error;

    return NextResponse.json({ counts: data });
  } catch (error: any) {
    console.error('Analytics Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
