import { NextResponse } from 'next/server';
import { trainingRepository } from '@/src/modules/training/repositories/trainingRepository';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const session = await trainingRepository.createLiveSession(body);
    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error('Error creating live session:', error);
    return NextResponse.json({ error: 'Failed to create live session' }, { status: 500 });
  }
}
