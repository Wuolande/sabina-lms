import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envFile = fs.readFileSync(".env.local", "utf8");
const supabaseUrl = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const serviceKey = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
const anonKey = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();

const adminSb = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const clientSb = createClient(supabaseUrl, anonKey);

async function setupProfiles() {
  console.log("=== Setting Up User Profiles & Roles ===");

  // 1. Get public.users records
  const { data: users, error: uErr } = await adminSb
    .from("users")
    .select("id, auth_id, email, display_name")
    .in("email", ["leackyotieno4@gmail.com", "stellarleack@gmail.com"]);

  if (uErr || !users) {
    console.error("Failed to query users:", uErr);
    process.exit(1);
  }

  const studentUser = users.find((u) => u.email === "leackyotieno4@gmail.com");
  const tutorUser = users.find((u) => u.email === "stellarleack@gmail.com");

  console.log("Found student user ID:", studentUser?.id);
  console.log("Found tutor user ID:", tutorUser?.id);

  if (studentUser) {
    // Role
    await adminSb.from("user_roles").upsert(
      { user_id: studentUser.id, role_id: "STUDENT" },
      { onConflict: "user_id,role_id" }
    );
    // Student profile
    await adminSb.from("student_profiles").upsert(
      {
        user_id: studentUser.id,
        current_level: "Intermediate",
        weekly_study_hours_target: 6,
      },
      { onConflict: "user_id" }
    );
    console.log("✓ Configured student roles & student_profile for leackyotieno4@gmail.com");
  }

  if (tutorUser) {
    // Role
    await adminSb.from("user_roles").upsert(
      { user_id: tutorUser.id, role_id: "TUTOR" },
      { onConflict: "user_id,role_id" }
    );
    // Tutor profile
    const tutorSlug = `stellar-leack-${tutorUser.id.slice(0, 6)}`;
    await adminSb.from("tutor_profiles").upsert(
      {
        user_id: tutorUser.id,
        slug: tutorSlug,
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
    console.log("✓ Configured tutor roles & tutor_profile for stellarleack@gmail.com (APPROVED, slug: " + tutorSlug + ")");
  }

  // Verify login for both with password 12345678
  console.log("\n=== Verifying Authentication for Both Users ===");
  const studentAuth = await clientSb.auth.signInWithPassword({
    email: "leackyotieno4@gmail.com",
    password: "12345678",
  });
  console.log("Student Login Test:", studentAuth.data?.user ? "SUCCESS (Authenticated)" : `FAILED: ${studentAuth.error?.message}`);

  const tutorAuth = await clientSb.auth.signInWithPassword({
    email: "stellarleack@gmail.com",
    password: "12345678",
  });
  console.log("Tutor Login Test:", tutorAuth.data?.user ? "SUCCESS (Authenticated)" : `FAILED: ${tutorAuth.error?.message}`);
}

setupProfiles().catch(console.error);
