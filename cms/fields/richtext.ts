import type { RichTextField, Validate } from "payload";
import { BoldFeature, FixedToolbarFeature, InlineToolbarFeature, ItalicFeature, LinkFeature, OrderedListFeature, ParagraphFeature, UnderlineFeature, UnorderedListFeature, lexicalEditor } from "@payloadcms/richtext-lexical";
import { richLength } from "../content/rich";

/** A light editor for descriptions: bold, italic, underline, lists and links. */
export const descriptionEditor = lexicalEditor({
  features: () => [ParagraphFeature(), BoldFeature(), ItalicFeature(), UnderlineFeature(), UnorderedListFeature(), OrderedListFeature(), LinkFeature(), FixedToolbarFeature(), InlineToolbarFeature()],
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
