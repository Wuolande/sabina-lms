import { ContentPage, pageMetadata } from "@/components/content/ContentPage";

export const revalidate = 60;
export const generateMetadata = () => pageMetadata("cookies", "/cookies");

export default function Page() {
  return <ContentPage slug="cookies" />;
}
