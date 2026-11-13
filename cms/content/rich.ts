/**
 * Rich text (Lexical JSON) helpers shared by the admin, the API and the site.
 * Content written on the site is cleaned to a safe set of formatting nodes before it is saved.
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
// bold, italic, strikethrough, underline, code, subscript, superscript
const FORMAT_MASK = 1 | 2 | 4 | 8 | 16 | 32 | 64;
const ALIGN = new Set(["", "left", "center", "right", "justify", "start", "end"]);
const HEADINGS = new Set(["h2", "h3", "h4"]);

/** Alignment and indent of a block, kept within safe values. */
const blockBase = (n: LexNode) => ({
  ...base,
  format: ALIGN.has(String(n.format ?? "")) ? String(n.format ?? "") : "",
  indent: Math.min(6, Math.max(0, Number(n.indent) || 0)),
});

/**
 * Keep only formatting nodes: paragraphs, headings, quotes, lists, line breaks, formatted text
 * and safe links. Everything else (images, embeds, unknown nodes) is dropped.
 */
function clean(n: LexNode, depth = 0): LexNode | null {
  if (depth > 8) return null;
  const kids = () => (n.children ?? []).map((c) => clean(c, depth + 1)).filter(Boolean) as LexNode[];
  switch (n.type) {
    case "text":
      return typeof n.text === "string" && n.text ? textNode(n.text.slice(0, 5000), Number(n.format) & FORMAT_MASK) : null;
    case "linebreak":
      return { type: "linebreak", version: 1 };
    case "tab":
      return textNode(" ");
    case "paragraph":
      return { ...para(kids()), ...blockBase(n) };
    case "heading": {
      const tag = String(n.tag ?? "h2");
      return { ...blockBase(n), type: "heading", tag: HEADINGS.has(tag) ? tag : tag === "h1" ? "h2" : "h4", children: kids() };
    }
    case "quote":
      return { ...blockBase(n), type: "quote", children: kids() };
    case "list": {
      const listType = n.listType === "number" ? "number" : "bullet";
      return { ...blockBase(n), type: "list", listType, tag: listType === "number" ? "ol" : "ul", start: 1, children: kids().filter((c) => c.type === "listitem") };
    }
    case "listitem":
      return { ...blockBase(n), type: "listitem", value: Number(n.value) || 1, children: kids().filter((c) => c.type !== "list" || depth < 6) };
    case "link":
    case "autolink": {
      const fields = (n.fields ?? {}) as { url?: string };
      const url = String(fields.url ?? n.url ?? "").trim();
      const children = kids().filter((c) => c.type === "text" || c.type === "linebreak");
      if (!SAFE_URL.test(url)) return children.length === 1 ? (children[0] as LexNode) : children.length ? para(children) : null;
      return { ...base, type: "link", version: 3, fields: { url, newTab: true, linkType: "custom" }, children };
    }
    default:
      return null;
  }
}

const INLINE = new Set(["text", "link", "linebreak"]);

/** Clean a whole document; loose inline nodes at the top are wrapped in paragraphs. */
function cleanDoc(v: Lexical): Lexical {
  const children = v.root.children.slice(0, 300).map((c) => clean(c)).filter(Boolean) as LexNode[];
  return { root: { ...base, type: "root", children: children.map((c) => (INLINE.has(c.type) ? (para([c]) as LexNode) : c)) } };
}

/**
 * Accepts Lexical JSON or plain text from a form and returns safe Lexical (or null when empty).
 * Throws `RangeError` with a friendly message when it is longer than `max` characters.
 */
export function toSafeLexical(input: unknown, max: number, label = "This text"): Lexical | null {
  let doc: Lexical | null;
  if (input == null || input === "") return null;
  if (typeof input === "string") doc = textToLexical(input);
  else if (isLexical(input)) doc = cleanDoc(input);
  else return null;
  if (!doc || richEmpty(doc)) return null;
  if (richLength(doc) > max) throw new RangeError(`${label} is too long. Keep it under ${max} characters.`);
  return doc;
}

/**
 * Prepares saved content for the site editor: drops anything it can't show, and turns Payload's
 * links ({ fields: { url } }) into the editor's own link format ({ url }).
 */
export function forSiteEditor(v: unknown): Lexical | null {
  if (typeof v === "string") return textToLexical(v);
  if (!isLexical(v)) return null;
  const toSite = (n: LexNode): LexNode => {
    const children = n.children?.map(toSite);
    if (n.type === "link") {
      const url = String((n.fields as { url?: string } | undefined)?.url ?? "");
      return { ...base, type: "link", version: 1, url, rel: "noopener noreferrer", target: "_blank", title: null, children };
    }
    return children ? { ...n, children } : n;
  };
  const doc = cleanDoc(v);
  return doc.root.children.length ? { root: { ...doc.root, children: doc.root.children.map(toSite) } } : null;
}
