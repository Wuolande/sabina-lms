import { notFound } from "next/navigation";
import { WhiteboardHarness } from "@/components/lesson-room/WhiteboardHarness";

export const dynamic = "force-dynamic";
export const metadata = { title: "Whiteboard test", robots: { index: false } };

/** Development only (used by the end-to-end tests). Not available in production. */
export default async function Page({ searchParams }: { searchParams: Promise<{ room?: string; me?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  return <WhiteboardHarness room={String(sp.room ?? "test").slice(0, 40)} me={String(sp.me ?? "a").slice(0, 20)} />;
}
