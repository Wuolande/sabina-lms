import { Subject } from "@/types";
import { homeContent, listPosts, maybePayload, type PostCard } from "@/cms/content/server";
import { searchTutors, subjectsWithCounts, type PublicTutor } from "@/cms/marketplace/public";

export { DEFAULT_HERO_IMAGE } from "./constants";

export interface HomepageServerData {
  cms: Awaited<ReturnType<typeof homeContent>> | null;
  featuredTutors: PublicTutor[];
  currency: string;
  popularSubjects: Subject[];
  posts: PostCard[];
}

/** Everything the homepage shows, from Payload: editable copy, featured tutors, subjects, latest posts. */
export async function getHomepageServerData(): Promise<HomepageServerData> {
  const payload = await maybePayload();
  if (!payload) return { cms: await homeContent(null), featuredTutors: [], currency: "USD", popularSubjects: [], posts: [] };
  const [cms, featured, popularSubjects, posts] = await Promise.all([
    homeContent(payload).catch((err) => {
      payload.logger.error({ err }, "[home] content failed");
      return homeContent(null);
    }),
    searchTutors(payload, { sort: "recommended" })
      .then((r) => ({ tutors: r.tutors.slice(0, 4), currency: r.policies.currency }))
      .catch(() => ({ tutors: [] as PublicTutor[], currency: "USD" })),
    subjectsWithCounts(payload)
      .then((list) =>
        [...list]
          .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.tutorCount - a.tutorCount)
          .slice(0, 12)
          .map((s) => ({ id: String(s.id), name: s.name, slug: s.slug, category: s.category, description: s.description, iconName: s.icon, tutorCount: s.tutorCount }) as unknown as Subject),
      )
      .catch(() => [] as Subject[]),
    listPosts(payload, { limit: 3 })
      .then((r) => r.posts)
      .catch(() => [] as PostCard[]),
  ]);
  return { cms, featuredTutors: featured.tutors, currency: featured.currency, popularSubjects, posts };
}
