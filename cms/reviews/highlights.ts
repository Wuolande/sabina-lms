/** Quick tags students can tap when rating a lesson. Shown on tutor profiles with counts. */
export const HIGHLIGHTS = [
  { value: "clear", label: "Clear explanations" },
  { value: "patient", label: "Patient" },
  { value: "prepared", label: "Well prepared" },
  { value: "encouraging", label: "Encouraging" },
  { value: "feedback", label: "Helpful feedback" },
  { value: "on_time", label: "On time" },
] as const;
export type HighlightValue = (typeof HIGHLIGHTS)[number]["value"];
export const highlightLabel = (v: string) => HIGHLIGHTS.find((h) => h.value === v)?.label ?? v;
