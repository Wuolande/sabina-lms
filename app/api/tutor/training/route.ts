import { NextResponse } from 'next/server';
import { trainingRepository } from '@/src/modules/training/repositories/trainingRepository';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tutorId = searchParams.get('tutorId') || undefined;

    const courses = await trainingRepository.getCourses(tutorId);
    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Error fetching training courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}
