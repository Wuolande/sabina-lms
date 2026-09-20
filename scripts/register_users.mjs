import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envFile = fs.readFileSync(".env.local", "utf8");
const supabaseUrl = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceKey = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

if (!supabaseUrl || !serviceKey) {
  console.error("Missing Supabase configuration");
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function registerAccount({ email, password, role, firstName, lastName }) {
  console.log(`\nRegistering ${role}: ${email}...`);
  const normalizedEmail = email.trim().toLowerCase();
  const displayName = `${firstName} ${lastName}`.trim();

  // 1. Create auth user with email confirmed
  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
    user_metadata: {
      role,
      display_name: displayName,
      first_name: firstName,
      last_name: lastName,
    },
  });

  if (authError) {
    if (authError.code === "email_exists" || authError.message.includes("already")) {
      console.log(`User ${normalizedEmail} already exists in auth.users. Updating credentials...`);
      const { data: list } = await adminSupabase.auth.admin.listUsers();
      const existing = list.users.find((u) => u.email === normalizedEmail);
      if (existing) {
        await adminSupabase.auth.admin.updateUserById(existing.id, {
          password,
          email_confirm: true,
          user_metadata: {
            role,
            display_name: displayName,
            first_name: firstName,
            last_name: lastName,
          },
        });
        console.log(`Updated auth.users credentials for ${existing.id}`);
        return syncDbProfile(existing.id, normalizedEmail, role, firstName, lastName, displayName);
      }
    }
    throw authError;
  }

  const userId = authData.user.id;
  console.log(`Created auth.users record: ${userId}`);
  return syncDbProfile(userId, normalizedEmail, role, firstName, lastName, displayName);
}

async function syncDbProfile(userId, email, role, firstName, lastName, displayName) {
  // 2. Synchronize public.users
  const { error: userError } = await adminSupabase.from("users").upsert(
    {
      id: userId,
      auth_id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      display_name: displayName,
      status: "ACTIVE",
    },
    { onConflict: "id" }
  );

  if (userError) {
    console.error("Error upserting public.users:", userError);
  } else {
    console.log(`Upserted public.users record for ${email}`);
  }

  // 3. Synchronize user_roles
  try {
    await adminSupabase.from("user_roles").upsert(
      {
        user_id: userId,
        role_id: role,
      },
      { onConflict: "user_id,role_id" }
    );
    console.log(`Mapped role ${role} in public.user_roles`);
  } catch (rErr) {
    console.warn("user_roles notice:", rErr.message);
  }

  // 4. If Tutor, seed approved tutor profile
  if (role === "TUTOR") {
    const slug = `stellar-leack-${userId.slice(0, 6)}`;
    const { error: tutorError } = await adminSupabase.from("tutor_profiles").upsert(
      {
        user_id: userId,
        slug,
        headline: "Certified Educator & Academic Coach",
        bio: "Dedicated online tutor specializing in concept mastery, problem solving, and structured curriculum revision. Passionate about empowering students to achieve academic excellence.",
        hourly_rate: 35.0,
        currency: "USD",
        verification_status: "APPROVED",
        account_status: "ACTIVE",
        years_experience: 5,
        total_lessons: 120,
        total_students: 35,
        average_rating: 5.0,
        review_count: 8,
      },
      { onConflict: "user_id" }
    );

    if (tutorError) {
      console.error("Error upserting tutor_profile:", tutorError);
    } else {
      console.log(`Created APPROVED tutor profile with slug: /tutors/${slug}`);
    }
  }

  // 5. If Student, seed student profile
  if (role === "STUDENT") {
    const { error: studentError } = await adminSupabase.from("student_profiles").upsert(
      {
        user_id: userId,
        current_level: "Intermediate",
        weekly_study_hours_target: 6,
      },
      { onConflict: "user_id" }
    );

    if (studentError) {
      console.error("Error upserting student_profile:", studentError);
    } else {
      console.log(`Created student profile for ${email}`);
    }
  }

  return { userId, email, role };
}

async function main() {
  console.log("=== Registering Requested Users ===");

  // 1. Student: leackyotieno4@gmail.com
  const student = await registerAccount({
    email: "leackyotieno4@gmail.com",
    password: "12345678",
    role: "STUDENT",
    firstName: "Leacky",
    lastName: "Otieno",
  });

  // 2. Tutor: stellarleack@gmail.com
  const tutor = await registerAccount({
    email: "stellarleack@gmail.com",
    password: "12345678",
    role: "TUTOR",
    firstName: "Stellar",
    lastName: "Leack",
  });

  console.log("\n=== Registration Complete ===");
  console.log("1. Student Account:");
  console.log("   Email: leackyotieno4@gmail.com");
  console.log("   Password: 12345678");
  console.log("   Role: STUDENT (Active, Email Confirmed)");
  console.log("2. Tutor Account:");
  console.log("   Email: stellarleack@gmail.com");
  console.log("   Password: 12345678");
  console.log("   Role: TUTOR (Approved & Active, Email Confirmed)");
}

main().catch((err) => {
  console.error("Registration failed:", err);
  process.exit(1);
});
