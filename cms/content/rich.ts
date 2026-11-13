/**
 * Rich text (Lexical JSON) helpers shared by the admin, the API and the site.
 * Content written on the site is cleaned to a small, safe set of nodes before it is saved.
 */
export type Lexical = { root: { type: "root"; children: LexNode[]; [k: string]: unknown } };
type LexNode = { type: string; children?: LexNode[]; text?: string; [k: string]: unknown };

const base = { format: "", indent: 0, version: 1, direction: "ltr" as const };
const textNode = (text: string, format = 0) => ({ type: "text", text, format, style: "", mode: "normal", detail: 0, version: 1 });
const para = (children: LexNode[]) => ({ ...base, type: "paragraph", textFormat: 0, textStyle: "", children });

export const isLexical = (v: unknown): v is Lexical => Boolean(v && typeof v === "object" && (v as Lexical).root && Array.isArray((v as Lexical).root.children));

/** Plain text → Lexical, one paragraph per line. Empty → null. */
export function textToLexical(text: string | null | undefined): Lexical | null {
  const lines = String(text ?? "").replace(/\r/g, "").split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return null;
  return { root: { ...base, type: "root", children: lines.map((l) => para([textNode(l)]) as LexNode) } };
}

/** Lexical → plain text (paragraphs and list items on their own lines). */
export function lexicalToText(v: unknown): string {
  if (typeof v === "string") return v;
  if (!isLexical(v)) return "";
  const out: string[] = [];
  const walk = (n: LexNode): string => (n.type === "text" ? (n.text ?? "") : n.type === "linebreak" ? "\n" : (n.children ?? []).map(walk).join(""));
  const block = (n: LexNode) => {
    if (n.type === "list") for (const li of n.children ?? []) out.push(`• ${walk(li)}`);
    else out.push(walk(n));
  };
  v.root.children.forEach(block);
  return out.map((l) => l.trim()).filter(Boolean).join("\n");
}

export const richLength = (v: unknown) => lexicalToText(v).replace(/\n/g, "").length;
export const richEmpty = (v: unknown) => richLength(v) === 0;

const SAFE_URL = /^(https?:\/\/|mailto:)/i;
const FORMAT_MASK = 1 | 2 | 8; // bold, italic, underline

/** Keep only paragraphs, bold/italic/underline text, line breaks, lists and safe links. */
function clean(n: LexNode, depth = 0): LexNode | null {
  if (depth > 6) return null;
  const kids = () => (n.children ?? []).map((c) => clean(c, depth + 1)).filter(Boolean) as LexNode[];
  switch (n.type) {
    case "text":
      return typeof n.text === "string" && n.text ? textNode(n.text.slice(0, 5000), Number(n.format) & FORMAT_MASK) : null;
    case "linebreak":
      return { type: "linebreak", version: 1 };
    case "paragraph":
    case "heading":
    case "quote":
      return para(kids());
    case "list": {
      const listType = n.listType === "number" ? "number" : "bullet";
      return { ...base, type: "list", listType, tag: listType === "number" ? "ol" : "ul", start: 1, children: kids().filter((c) => c.type === "listitem") };
    }
    case "listitem":
      return { ...base, type: "listitem", value: Number(n.value) || 1, children: kids().filter((c) => c.type !== "list" || depth < 4) };
    case "link":
    case "autolink": {
      const fields = (n.fields ?? {}) as { url?: string };
      const url = String(fields.url ?? n.url ?? "");
      const children = kids();
      if (!SAFE_URL.test(url)) return children.length ? (children[0] as LexNode) : null;
      return { ...base, type: "link", version: 3, fields: { url, newTab: true, linkType: "custom" }, children };
    }
    default:
      return null;
  }
}

/**
 * Accepts Lexical JSON or plain text from a form and returns safe Lexical (or null when empty).
 * Throws `RangeError` with a friendly message when it is longer than `max` characters.
 */
export function toSafeLexical(input: unknown, max: number, label = "This text"): Lexical | null {
  let doc: Lexical | null;
  if (input == null || input === "") return null;
  if (typeof input === "string") doc = textToLexical(input);
  else if (isLexical(input)) {
    const children = input.root.children.slice(0, 200).map((c) => clean(c)).filter(Boolean) as LexNode[];
    doc = { root: { ...base, type: "root", children: children.map((c) => (c.type === "text" || c.type === "link" ? (para([c]) as LexNode) : c)) } };
  } else return null;
  if (!doc || richEmpty(doc)) return null;
  if (richLength(doc) > max) throw new RangeError(`${label} is too long. Keep it under ${max} characters.`);
  return doc;
}

/** For the site editor, which has no link node: links become their plain text. */
export function forSiteEditor(v: unknown): Lexical | null {
  if (typeof v === "string") return textToLexical(v);
  if (!isLexical(v)) return null;
  const strip = (n: LexNode): LexNode[] => {
    if (n.type === "link" || n.type === "autolink") return (n.children ?? []).flatMap(strip);
    return [{ ...n, ...(n.children ? { children: n.children.flatMap(strip) } : {}) }];
  };
  return { root: { ...v.root, children: v.root.children.flatMap(strip) } };
}
