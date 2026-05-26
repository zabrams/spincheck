import { NextRequest, NextResponse } from 'next/server';
import { analyzeArticle } from '@/lib/claude';
import type { AnalyzeRequest } from '@/types/analysis';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();

    if (!body.content || body.content.trim().length < 100) {
      return NextResponse.json(
        { success: false, error: 'Article content must be at least 100 characters' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (body.content.length > 100_000) {
      return NextResponse.json(
        { success: false, error: 'Article content too long (max 100,000 characters)' },
        { status: 400, headers: corsHeaders }
      );
    }

    const analysis = await analyzeArticle(body.content, body.title);
    return NextResponse.json({ success: true, data: analysis }, { headers: corsHeaders });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze article' },
      { status: 500, headers: corsHeaders }
    );
  }
}
