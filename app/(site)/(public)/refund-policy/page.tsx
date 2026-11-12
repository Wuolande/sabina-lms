import { ContentPage, pageMetadata } from "@/components/content/ContentPage";

export const revalidate = 60;
export const generateMetadata = () => pageMetadata("refund-policy", "/refund-policy");

export default function Page() {
  return <ContentPage slug="refund-policy" />;
}
