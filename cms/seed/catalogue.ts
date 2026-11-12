import type { Payload } from "payload";

/** Starter catalogue. Edit freely in the admin afterwards; seeding only runs on an empty table. */
const SUBJECTS: { name: string; category: string; icon: string; description: string; featured?: boolean }[] = [
  { name: "Mathematics", category: "mathematics", icon: "Calculator", description: "From arithmetic to calculus, for school, exams and university.", featured: true },
  { name: "English", category: "languages", icon: "BookOpen", description: "Grammar, writing, literature and comprehension.", featured: true },
  { name: "English Conversation", category: "languages", icon: "Languages", description: "Speak confidently: fluency, pronunciation and everyday English.", featured: true },
  { name: "Business English", category: "languages", icon: "Briefcase", description: "Meetings, presentations, emails and interviews." },
  { name: "Kiswahili", category: "languages", icon: "Languages", description: "Lugha, fasihi na mazungumzo kwa wanafunzi wa viwango vyote.", featured: true },
  { name: "French", category: "languages", icon: "Languages", description: "Beginner to advanced French, DELF preparation." },
  { name: "Spanish", category: "languages", icon: "Languages", description: "Conversational and academic Spanish." },
  { name: "German", category: "languages", icon: "Languages", description: "German for travel, study and work." },
  { name: "Physics", category: "sciences", icon: "Atom", description: "Mechanics, electricity, waves and modern physics.", featured: true },
  { name: "Chemistry", category: "sciences", icon: "FlaskConical", description: "Organic, inorganic and physical chemistry with practicals." },
  { name: "Biology", category: "sciences", icon: "Dna", description: "Cells, genetics, human biology and ecology." },
  { name: "Computer Science", category: "coding", icon: "Cpu", description: "Algorithms, data structures and computing theory." },
  { name: "Python & Data Science", category: "coding", icon: "Code", description: "Python programming, data analysis and machine learning.", featured: true },
  { name: "Web Development", category: "coding", icon: "Terminal", description: "HTML, CSS, JavaScript, React and Node." },
  { name: "KCSE Revision", category: "exam-prep", icon: "GraduationCap", description: "Targeted revision and past-paper practice for KCSE." },
  { name: "IELTS & TOEFL", category: "exam-prep", icon: "GraduationCap", description: "Strategies and practice for top band scores." },
  { name: "SAT & ACT", category: "exam-prep", icon: "GraduationCap", description: "Maths and verbal preparation with timed drills." },
  { name: "History & Government", category: "humanities", icon: "Landmark", description: "History, civics and government for school and exams." },
  { name: "Geography", category: "humanities", icon: "Globe2", description: "Physical and human geography." },
  { name: "Accounting", category: "business", icon: "Receipt", description: "Bookkeeping, financial accounting and CPA support." },
  { name: "Economics", category: "business", icon: "TrendingUp", description: "Micro and macroeconomics for school and university." },
  { name: "Music", category: "arts", icon: "Music", description: "Theory, piano, guitar and voice." },
];

const LANGUAGES: [string, string, string][] = [
  ["English", "en", "English"],
  ["Kiswahili", "sw", "Kiswahili"],
  ["French", "fr", "Français"],
  ["Spanish", "es", "Español"],
  ["German", "de", "Deutsch"],
  ["Arabic", "ar", "العربية"],
  ["Portuguese", "pt", "Português"],
  ["Mandarin Chinese", "zh", "中文"],
  ["Hindi", "hi", "हिन्दी"],
  ["Italian", "it", "Italiano"],
  ["Russian", "ru", "Русский"],
  ["Japanese", "ja", "日本語"],
  ["Somali", "so", "Soomaali"],
  ["Amharic", "am", "አማርኛ"],
  ["Luganda", "lg", "Luganda"],
  ["Kinyarwanda", "rw", "Ikinyarwanda"],
];

export async function seedCatalogue(payload: Payload) {
  const [s, l] = await Promise.all([
    payload.count({ collection: "subjects", overrideAccess: true }),
    payload.count({ collection: "languages", overrideAccess: true }),
  ]);
  if (s.totalDocs === 0) {
    let i = 0;
    for (const sub of SUBJECTS) {
      i += 10;
      await payload.create({ collection: "subjects", overrideAccess: true, data: { name: sub.name, category: sub.category as never, icon: sub.icon, description: sub.description, isFeatured: Boolean(sub.featured), isActive: true, sortOrder: i } });
    }
    payload.logger.info(`Seeded ${SUBJECTS.length} subjects`);
  }
  if (l.totalDocs === 0) {
    for (const [name, code, nativeName] of LANGUAGES) await payload.create({ collection: "languages", overrideAccess: true, data: { name, code, nativeName, isActive: true } });
    payload.logger.info(`Seeded ${LANGUAGES.length} languages`);
  }
}
