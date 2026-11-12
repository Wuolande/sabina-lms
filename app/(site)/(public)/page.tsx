import type { Metadata } from "next";
import { getHomepageServerData, DEFAULT_HERO_IMAGE } from "@/src/modules/homepage/getHomepageData";
import { HomePageClient } from "@/components/home/HomePageClient";
import { siteSeo } from "@/cms/content/server";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await siteSeo();
  return { title: { absolute: seo.title }, description: seo.description, alternates: { canonical: "/" } };
}

export default async function HomePage() {
  const { cms, featuredTutors, popularSubjects, currency, posts } = await getHomepageServerData();
  const heroImage = cms?.heroSection?.heroStudentImage || DEFAULT_HERO_IMAGE;
  return (
    <>
      <link rel="preload" as="image" href={heroImage} fetchPriority="high" />
      <HomePageClient initialCms={cms} initialFeaturedTutors={featuredTutors} initialPopularSubjects={popularSubjects} currency={currency} posts={posts} />
    </>
  );
}
