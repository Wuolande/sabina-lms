#!/usr/bin/env node
/**
 * Creates demo tutors through the real flow (sign up -> confirm -> apply -> submit -> admin approves),
 * so the marketplace has realistic data in development. Never run against production.
 *
 *   BASE_URL=http://localhost:3000 DATABASE_URI=... ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/seed-demo-tutors.mjs
 */
import pg from "pg";
import sharp from "sharp";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const PW = "Teach2026x";
if (/sabina\.education/.test(BASE)) throw new Error("Refusing to seed demo data on production.");

const TUTORS = [
  { first: "Wanjiru", last: "Kamau", country: "Kenya", subject: "mathematics", others: ["kcse-revision", "physics"], levels: ["secondary", "exam"], rate: 22, colour: "#2A4ED6", headline: "KCSE Maths specialist who makes algebra click", about: "I taught mathematics at a national school in Nyeri for nine years before tutoring full time. I break hard topics into small steps, use plenty of past papers, and track progress every lesson so students and parents can see the improvement.", featured: true },
  { first: "Daniel", last: "Mwangi", country: "Kenya", subject: "python-and-data-science", others: ["computer-science", "web-development"], levels: ["university", "adult"], rate: 35, colour: "#0F766E", headline: "Software engineer teaching practical Python and data", about: "I build data products at a fintech in Nairobi and have mentored junior developers for six years. Lessons are hands-on: we write real code from minute one, review it together and build small projects you can show employers." },
  { first: "Amina", last: "Hassan", country: "Kenya", subject: "kiswahili", others: ["english"], levels: ["primary", "secondary"], rate: 15, colour: "#B45309", headline: "Patient Kiswahili and English teacher for young learners", about: "Mwalimu wa Kiswahili kwa miaka saba. I help primary and secondary students read, write and speak with confidence through stories, games and lots of conversation practice. Parents get a short summary after every lesson." },
  { first: "James", last: "Okoro", country: "Nigeria", subject: "physics", others: ["mathematics", "chemistry"], levels: ["secondary", "university", "exam"], rate: 28, colour: "#7C3AED", headline: "Physics made visual: simulations, sketches and real examples", about: "I hold an MSc in Physics and have prepared students for WAEC, KCSE, A-levels and first-year university exams. I use simulations and quick sketches so concepts stick, then lock them in with exam-style questions." },
  { first: "Sarah", last: "Thompson", country: "United Kingdom", subject: "ielts-and-toefl", others: ["english-conversation", "business-english"], levels: ["adult", "exam"], rate: 40, colour: "#BE123C", headline: "Former IELTS examiner: band 7+ strategies that work", about: "I spent five years as an IELTS speaking and writing examiner. I know exactly what earns marks and what loses them. We'll target your weakest band with focused practice and detailed feedback on every essay." },
  { first: "Kevin", last: "Otieno", country: "Kenya", subject: "accounting", others: ["economics"], levels: ["secondary", "university", "adult"], rate: 25, colour: "#1D4ED8", headline: "CPA-qualified tutor for accounting students and professionals", about: "Certified Public Accountant with eight years in audit. I help KCSE business students, university accounting majors and CPA candidates master the fundamentals with clear worked examples and real company accounts." },
];

const H = { "Content-Type": "application/json", "Sec-Fetch-Site": "same-origin" };
async function call(path, { cookie, ...init } = {}) {
  const res = await fetch(BASE + path, { ...init, headers: { ...H, ...(init.headers || {}), ...(cookie ? { cookie } : {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path}: ${res.status} ${JSON.stringify(data).slice(0, 200)}`);
  return { data, cookie: res.headers.get("set-cookie")?.split(";")[0] };
}

const db = new pg.Client({ connectionString: process.env.DATABASE_URI });
await db.connect();
const admin = await call("/api/auth/login", { method: "POST", body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }) });
const subjects = Object.fromEntries((await db.query("select id, slug from payload.subjects")).rows.map((r) => [r.slug, r.id]));
const langs = Object.fromEntries((await db.query("select id, code from payload.languages")).rows.map((r) => [r.code, r.id]));

const tzOf = (t) => (t.country === "Kenya" ? "Africa/Nairobi" : t.country === "Nigeria" ? "Africa/Lagos" : "Europe/London");
/** Weekday evenings plus Saturday mornings in the tutor's zone, unless they already set hours. */
async function setHours(email, t, i) {
  const { cookie } = await call("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password: PW }) });
  const { data } = await call("/api/tutor/schedule", { cookie });
  if (data.schedule.weekly.length) return;
  const evening = i % 2 ? { start: "16:00", end: "20:00" } : { start: "09:00", end: "13:00" };
  const weekly = [1, 2, 3, 4, 5].map((day) => ({ day, ...evening })).concat([{ day: 6, start: "08:00", end: "12:00" }]);
  await call("/api/tutor/schedule", { method: "PUT", cookie, body: JSON.stringify({ timezone: tzOf(t), weekly, timeOff: [], noticeHours: 4, bufferMinutes: 0, instantBooking: i !== 2 }) });
  console.log("hours set", email);
}

for (const [i, t] of TUTORS.entries()) {
  const email = `demo.${t.first.toLowerCase()}.${t.last.toLowerCase()}@example.com`;
  if ((await db.query("select 1 from payload.users where email=$1", [email])).rowCount) {
    console.log("exists", email);
    await setHours(email, t, i);
    continue;
  }
  await call("/api/auth/register", { method: "POST", body: JSON.stringify({ email, password: PW, firstName: t.first, lastName: t.last, role: "tutor", acceptTerms: true, timezone: tzOf(t) }) });
  const token = (await db.query("select _verificationtoken t from payload.users where email=$1", [email])).rows[0].t;
  await call("/api/auth/verify-email", { method: "POST", body: JSON.stringify({ token }) });
  const { cookie } = await call("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password: PW }) });
  await call("/api/account/profile", { method: "PATCH", cookie, body: JSON.stringify({ country: t.country, phone: "+254 700 000 000" }) });

  // Photo: a soft gradient with initials (stands in for a real headshot).
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.colour}"/><stop offset="1" stop-color="#0B123E"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><text x="200" y="235" font-family="Arial" font-size="150" font-weight="700" fill="#fff" text-anchor="middle">${t.first[0]}${t.last[0]}</text></svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  const fd = new FormData();
  fd.append("file", new Blob([png], { type: "image/png" }), "photo.png");
  const up = await fetch(BASE + "/api/account/avatar", { method: "POST", body: fd, headers: { cookie, "Sec-Fetch-Site": "same-origin" } });
  if (!up.ok) throw new Error("avatar " + (await up.text()));

  const pdf = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n164\n%%EOF\n");
  const docFd = new FormData();
  docFd.append("kind", "identity");
  docFd.append("file", new Blob([pdf], { type: "application/pdf" }), "id.pdf");
  const doc = await (await fetch(BASE + "/api/tutor/documents", { method: "POST", body: docFd, headers: { cookie, "Sec-Fetch-Site": "same-origin" } })).json();
  if (!doc.id) throw new Error("document " + JSON.stringify(doc));

  await call("/api/tutor/application", {
    method: "PATCH",
    cookie,
    body: JSON.stringify({
      headline: t.headline,
      about: t.about,
      teachingStyle: "Every lesson starts with a quick recap, then new material with lots of practice, and ends with a short summary and homework.",
      languages: [{ language: langs.en, level: t.country === "United Kingdom" ? "native" : "c2" }, ...(t.country === "Kenya" ? [{ language: langs.sw, level: "native" }] : [])],
      primarySubject: subjects[t.subject],
      subjects: [subjects[t.subject], ...t.others.map((s) => subjects[s]).filter(Boolean)],
      levelsTaught: t.levels,
      hourlyRate: t.rate,
      offersTrial: true,
      instantBooking: t.rate < 30,
      education: [{ degree: "Bachelor's degree", institution: t.country === "Kenya" ? "University of Nairobi" : t.country === "Nigeria" ? "University of Lagos" : "University of Leeds", field: t.subject.replace(/-/g, " "), startYear: 2010, endYear: 2014 }],
      experience: [{ role: "Teacher", organization: "Secondary school", startYear: 2015, endYear: 2021, description: "Taught exam classes and led the department's revision programme." }],
      identity: { documentType: "national_id", document: doc.id },
    }),
  });
  await call("/api/tutor/application/submit", { method: "POST", cookie });
  const id = (await db.query("select t.id from payload.tutor_profiles t join payload.users u on u.id=t.user_id where u.email=$1", [email])).rows[0].id;
  await call(`/api/tutor-profiles/${id}/review`, { method: "POST", cookie: admin.cookie, body: JSON.stringify({ action: "approve" }) });
  if (t.featured) await db.query("update payload.tutor_profiles set is_featured=true, is_super_tutor=true where id=$1", [id]);
  console.log("approved", email);
  await setHours(email, t, i);
}
await db.end();
