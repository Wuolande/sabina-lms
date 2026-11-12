import { ContentPage, pageMetadata } from "@/components/content/ContentPage";

export const revalidate = 60;
export const generateMetadata = () => pageMetadata("pricing", "/pricing");

export default function Page() {
  return <ContentPage slug="pricing" />;
}
