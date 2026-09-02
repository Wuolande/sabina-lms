import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { adminSupabase } from '@/src/shared/database/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, role } = body;

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // 1. Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: `${firstName} ${lastName}`.trim(),
          role: role, // STUDENT or TUTOR
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ error: 'User creation failed' }, { status: 400 });
    }

    // 2. We use the admin client to insert the profile immediately, ensuring no race conditions with triggers
    const { error: profileError } = await adminSupabase.from('users').insert({
      id: data.user.id,
      auth_id: data.user.id,
      email: email,
      display_name: `${firstName} ${lastName}`.trim(),
    });

    if (profileError && !profileError.message.includes('duplicate key')) {
      console.error('Error creating user profile:', profileError);
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
