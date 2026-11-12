import { Atom, BookOpen, Briefcase, Calculator, Code, Cpu, Dna, FlaskConical, Globe2, GraduationCap, Landmark, Languages, Music, Receipt, Terminal, TrendingUp, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = { Atom, BookOpen, Briefcase, Calculator, Code, Cpu, Dna, FlaskConical, Globe2, GraduationCap, Landmark, Languages, Music, Receipt, Terminal, TrendingUp };

export function SubjectIcon({ name, size = 22, className }: { name?: string | null; size?: number; className?: string }) {
  const C = (name && ICONS[name]) || BookOpen;
  return <C size={size} className={className} aria-hidden />;
}

export const CATEGORY_LABEL: Record<string, string> = {
  languages: "Languages",
  mathematics: "Mathematics",
  sciences: "Sciences",
  "exam-prep": "Exam prep",
  coding: "Coding & tech",
  humanities: "Humanities",
  business: "Business",
  arts: "Arts & music",
};
