import type { RichTextField, Validate } from "payload";
import { FixedToolbarFeature, lexicalEditor } from "@payloadcms/richtext-lexical";
import { richLength } from "../content/rich";

/**
 * The full editor: every formatting tool Payload ships (headings, bold, italic, underline,
 * strikethrough, sub/superscript, code, alignment, indent, lists, checklists, links, quotes,
 * dividers, images) with the toolbar always showing above the text.
 */
export const fullEditor = lexicalEditor({
  features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature()],
});

/**
 * Description boxes get every text formatting tool. Images and links to other records are left
 * out: descriptions are shown in places (cards, profiles) where only text belongs.
 */
export const descriptionEditor = lexicalEditor({
  features: ({ defaultFeatures }) => [...defaultFeatures.filter((f) => f.key !== "upload" && f.key !== "relationship"), FixedToolbarFeature()],
});

/** A description box with formatting, limited to `maxChars` characters of text. */
export const richDescription = (name: string, opts: { maxChars?: number; label?: string; description?: string; required?: boolean; access?: RichTextField["access"] } = {}): RichTextField => ({
  name,
  type: "richText",
  label: opts.label,
  required: opts.required,
  access: opts.access,
  editor: descriptionEditor,
  admin: opts.description ? { description: opts.description } : undefined,
  validate: ((value: unknown) => {
    if (opts.required && richLength(value) === 0) return "This field is required.";
    if (opts.maxChars && richLength(value) > opts.maxChars) return `Keep it under ${opts.maxChars} characters (now ${richLength(value)}).`;
    return true;
  }) as Validate,
});
