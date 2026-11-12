import { MessagesPage } from "@/components/messages/MessagesPage";

export const metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

export default function Page({ searchParams }: { searchParams: Promise<{ c?: string; tutor?: string; student?: string }> }) {
  return <MessagesPage role="tutor" searchParams={searchParams} />;
}
