import type { Payload, PayloadRequest } from "payload";
import { HOME_DEFAULTS } from "./defaults";

type C = { value: number | string; suffix?: string; decimals?: number; label: string };
// A value like "{trialMinutes}" follows the platform rules, so it stays empty in the editor.
const counter = (c: C) => ({ value: typeof c.value === "number" ? c.value : null, suffix: c.suffix ?? "", decimals: c.decimals ?? 0, label: c.label });

/** The homepage as it looks out of the box, in the shape of the Homepage editor. */
export function homeEditorDefaults() {
  const D = HOME_DEFAULTS;
  return {
    hero: {
      pretitle: D.hero.pretitle,
      headlines: D.hero.headlines.map((text) => ({ text })),
      subheading: D.hero.subheading,
      searchPlaceholder: D.hero.searchPlaceholder,
      popularTags: D.hero.popularTags.map((t) => ({ ...t })),
      proofText: D.hero.proofText,
      card1: counter(D.hero.card1 as C),
      card2: counter(D.hero.card2 as C),
      card3: counter(D.hero.card3 as C),
    },
    stats: { live: false, stat1: counter(D.stats.stat1 as C), stat2: counter(D.stats.stat2 as C), stat3: counter(D.stats.stat3 as C), stat4: counter(D.stats.stat4 as C) },
    sections: {
      subjects: { ...D.sections.subjects },
      tutors: { ...D.sections.tutors },
      classroom: { ...D.sections.classroom },
      steps: { pretitle: D.sections.steps.pretitle, title: D.sections.steps.title, items: D.sections.steps.items.map((i) => ({ ...i })) },
      teach: { ...D.sections.teach, points: D.sections.teach.points.map((text) => ({ text })) },
      faq: { pretitle: D.sections.faq.pretitle, title: D.sections.faq.title, items: D.sections.faq.items.map((i) => ({ ...i })) },
    },
  };
}

/** Fill the Homepage editor with the default content if it has never been filled in. */
export async function seedHomePage(payload: Payload, req?: Partial<PayloadRequest>) {
  const g = (await payload.findGlobal({ slug: "home-page", depth: 0, overrideAccess: true, req }).catch(() => null)) as { hero?: { pretitle?: string | null; headlines?: unknown[] | null } } | null;
  if (g?.hero?.pretitle || g?.hero?.headlines?.length) return false;
  await payload.updateGlobal({ slug: "home-page", data: homeEditorDefaults() as never, overrideAccess: true, req, context: { skipRefresh: true } });
  return true;
}
