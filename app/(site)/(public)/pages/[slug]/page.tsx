import { ContentPage, pageMetadata } from "@/components/content/ContentPage";

export const revalidate = 60;
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return pageMetadata(slug, `/pages/${slug}`);
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <ContentPage slug={(await params).slug} />;
}
