/**
 * Build Lexical rich text from a tiny outline, for seeding default pages and courses.
 * Blocks: ["h2", text] | ["h3", text] | ["p", text] | ["ul", items[]] | ["ol", items[]].
 * Inline: **bold** and [label](/url).
 */
type Block = ["h2" | "h3" | "p", string] | ["ul" | "ol", string[]];
const base = { format: "", indent: 0, version: 1, direction: "ltr" as const };

function inline(text: string) {
  const out: unknown[] = [];
  const re = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const t = (s: string, format = 0) => ({ type: "text", text: s, format, style: "", mode: "normal", detail: 0, version: 1 });
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(t(text.slice(last, m.index)));
    if (m[1]) out.push(t(m[1], 1));
    else out.push({ ...base, type: "link", version: 3, fields: { url: m[3], newTab: false, linkType: "custom" }, children: [t(m[2]!)] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(t(text.slice(last)));
  return out;
}

export function lexical(blocks: Block[]) {
  const children = blocks.map(([kind, value]) => {
    if (kind === "p") return { ...base, type: "paragraph", textFormat: 0, textStyle: "", children: inline(value) };
    if (kind === "h2" || kind === "h3") return { ...base, type: "heading", tag: kind, children: inline(value) };
    return {
      ...base,
      type: "list",
      listType: kind === "ul" ? "bullet" : "number",
      tag: kind,
      start: 1,
      children: (value as string[]).map((item, i) => ({ ...base, type: "listitem", value: i + 1, children: inline(item) })),
    };
  });
  return { root: { ...base, type: "root", children } } as never;
}
