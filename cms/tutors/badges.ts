/** Tutor badges: what each one means, in the words students and tutors see. */
export const BADGES = [
  { value: "top_rated", label: "Top rated", hint: (p: Thresholds) => `An average of ${p.badgeTopRatedRating}★ or more from at least ${p.badgeTopRatedReviews} reviews.` },
  { value: "fast_responder", label: "Fast responder", hint: (p: Thresholds) => `Usually replies to students within ${p.badgeFastReplyHours} hours.` },
  { value: "in_demand", label: "In demand", hint: (p: Thresholds) => `${p.badgeInDemandLessons} or more lessons booked in the last 30 days.` },
  { value: "lessons_500", label: "500+ lessons", hint: () => "Has taught 500 lessons or more." },
  { value: "lessons_100", label: "100+ lessons", hint: () => "Has taught 100 lessons or more." },
  { value: "lessons_50", label: "50+ lessons", hint: () => "Has taught 50 lessons or more." },
  { value: "lessons_10", label: "10+ lessons", hint: () => "Has taught 10 lessons or more." },
  { value: "new_tutor", label: "New on Sabina", hint: (p: Thresholds) => `Joined in the last ${p.badgeNewTutorDays} days.` },
] as const;
export type BadgeValue = (typeof BADGES)[number]["value"];
export type Thresholds = { badgeTopRatedRating: number; badgeTopRatedReviews: number; badgeFastReplyHours: number; badgeInDemandLessons: number; badgeNewTutorDays: number };
export const badgeLabel = (v: string) => BADGES.find((b) => b.value === v)?.label ?? v;
/** Badges in display order (strongest first). */
export const sortBadges = (list: string[]) => BADGES.map((b) => b.value).filter((v) => list.includes(v));
