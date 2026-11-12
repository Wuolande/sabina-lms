import { ContentPage, pageMetadata } from "@/components/content/ContentPage";

export const revalidate = 60;
export const generateMetadata = () => pageMetadata("about", "/about");

export default function Page() {
  return <ContentPage slug="about" />;
}
