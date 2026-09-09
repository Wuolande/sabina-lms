import { getHomepageServerData, DEFAULT_HERO_IMAGE } from "@/src/modules/homepage/getHomepageData";
import { HomePageClient } from "@/components/home/HomePageClient";

export const revalidate = 60;

export default async function HomePage() {
  const { cms, featuredTutors, popularSubjects } = await getHomepageServerData();
  const heroImage = cms?.heroSection?.heroStudentImage || DEFAULT_HERO_IMAGE;

  return (
    <>
      <link rel="preload" as="image" href={heroImage} fetchPriority="high" />
      <HomePageClient
        initialCms={cms}
        initialFeaturedTutors={featuredTutors}
        initialPopularSubjects={popularSubjects}
      />
    </>
  );
}
