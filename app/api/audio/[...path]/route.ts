import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = path.join(process.cwd(), 'public', 'audio', ...params.path);
    const file = await readFile(filePath);
    
    // Convert Buffer to Uint8Array for NextResponse
    return new NextResponse(new Uint8Array(file), {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    return new NextResponse('File not found', { status: 404 });
  }
}