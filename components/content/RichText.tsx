import { RichText as LexicalRichText } from "@payloadcms/richtext-lexical/react";

/** Lexical content with Sabina's reading styles (see .sb-prose in globals.css). */
export function RichText({ data, className = "" }: { data: unknown; className?: string }) {
  if (!data) return null;
  return <LexicalRichText data={data as never} className={`sb-prose ${className}`} />;
}
