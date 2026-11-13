"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isListNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, ListItemNode, ListNode, REMOVE_LIST_COMMAND } from "@lexical/list";
import { $createHeadingNode, $createQuoteNode, $isHeadingNode, $isQuoteNode, HeadingNode, QuoteNode, type HeadingTagType } from "@lexical/rich-text";
import { $isLinkNode, LinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { $setBlocksType } from "@lexical/selection";
import { $findMatchingParent, $getNearestNodeOfType, mergeRegister } from "@lexical/utils";
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $isTextNode,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
  type EditorState,
  type ElementFormatType,
  type TextFormatType,
} from "lexical";
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Check, ChevronDown, Code, Eraser, Heading2, Heading3, Heading4, IndentDecrease, IndentIncrease, Italic,
  Link2, List, ListOrdered, Pilcrow, Quote, Redo2, Strikethrough, Subscript, Superscript, Underline, Undo2, Unlink, X,
} from "lucide-react";
import { forSiteEditor, type Lexical } from "@/cms/content/rich";

const theme = {
  paragraph: "mb-2 last:mb-0",
  heading: { h2: "mb-2 mt-4 first:mt-0 text-xl font-semibold text-slate-900", h3: "mb-2 mt-3 first:mt-0 text-lg font-semibold text-slate-900", h4: "mb-1.5 mt-3 first:mt-0 text-base font-semibold text-slate-900" },
  quote: "my-3 border-l-4 border-brand-200 pl-4 italic text-slate-600",
  list: { ul: "mb-2 ml-5 list-disc space-y-1", ol: "mb-2 ml-5 list-decimal space-y-1", listitem: "pl-1", nested: { listitem: "list-none" } },
  link: "font-medium text-brand-700 underline underline-offset-2",
  text: {
    bold: "font-semibold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    underlineStrikethrough: "[text-decoration:underline_line-through]",
    code: "rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.9em]",
    subscript: "align-sub text-[0.8em]",
    superscript: "align-super text-[0.8em]",
  },
};

type Block = "paragraph" | "h2" | "h3" | "h4" | "quote" | "bullet" | "number";
const BLOCKS: { value: Block; label: string; icon: React.ReactNode }[] = [
  { value: "paragraph", label: "Normal text", icon: <Pilcrow size={16} /> },
  { value: "h2", label: "Heading", icon: <Heading2 size={16} /> },
  { value: "h3", label: "Subheading", icon: <Heading3 size={16} /> },
  { value: "h4", label: "Small heading", icon: <Heading4 size={16} /> },
  { value: "quote", label: "Quote", icon: <Quote size={16} /> },
  { value: "bullet", label: "Bulleted list", icon: <List size={16} /> },
  { value: "number", label: "Numbered list", icon: <ListOrdered size={16} /> },
];
const MARKS: { format: TextFormatType; label: string; key?: string; icon: React.ReactNode }[] = [
  { format: "bold", label: "Bold", key: "Ctrl+B", icon: <Bold size={16} /> },
  { format: "italic", label: "Italic", key: "Ctrl+I", icon: <Italic size={16} /> },
  { format: "underline", label: "Underline", key: "Ctrl+U", icon: <Underline size={16} /> },
  { format: "strikethrough", label: "Strikethrough", icon: <Strikethrough size={16} /> },
  { format: "code", label: "Code", icon: <Code size={16} /> },
  { format: "subscript", label: "Subscript", icon: <Subscript size={16} /> },
  { format: "superscript", label: "Superscript", icon: <Superscript size={16} /> },
];
const ALIGNS: { value: ElementFormatType; label: string; icon: React.ReactNode }[] = [
  { value: "left", label: "Align left", icon: <AlignLeft size={16} /> },
  { value: "center", label: "Align centre", icon: <AlignCenter size={16} /> },
  { value: "right", label: "Align right", icon: <AlignRight size={16} /> },
  { value: "justify", label: "Justify", icon: <AlignJustify size={16} /> },
];

type State = { block: Block; marks: Partial<Record<TextFormatType, boolean>>; align: ElementFormatType; link: string | null; canUndo: boolean; canRedo: boolean };

/** Adds https:// to bare addresses and rejects anything that isn't a web or email link. */
function normaliseUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  if (/^(https?:\/\/|mailto:)/i.test(v)) return v;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return `mailto:${v}`;
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(v)) return `https://${v}`;
  return null;
}

function Btn({ on, label, disabled, onClick, children }: { on?: boolean; label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={on === undefined ? undefined : on}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition disabled:pointer-events-none disabled:opacity-35 ${on ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
    >
      {children}
    </button>
  );
}

const Sep = () => <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-slate-200" />;

/** "Normal text / Heading / Quote / list" picker. */
function BlockMenu({ value, disabled, onPick }: { value: Block; disabled?: boolean; onPick: (b: Block) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  const current = BLOCKS.find((b) => b.value === value) ?? BLOCKS[0]!;
  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-label={`Text style: ${current.label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-35"
      >
        {current.icon}
        <span className="w-[6.5rem] truncate text-left">{current.label}</span>
        <ChevronDown size={14} className={`text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="menu" className="absolute left-0 top-full z-30 mt-1 w-52 rounded-xl bg-white p-1 shadow-lg ring-1 ring-slate-200">
          {BLOCKS.map((b) => (
            <button
              key={b.value}
              type="button"
              role="menuitemradio"
              aria-checked={b.value === value}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onPick(b.value);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition hover:bg-slate-100 ${b.value === value ? "font-semibold text-slate-900" : "text-slate-700"}`}
            >
              <span className="text-slate-500">{b.icon}</span>
              <span className="flex-1">{b.label}</span>
              {b.value === value && <Check size={15} className="text-brand-700" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Toolbar({ disabled }: { disabled?: boolean }) {
  const [editor] = useLexicalComposerContext();
  const [s, setS] = useState<State>({ block: "paragraph", marks: {}, align: "left", link: null, canUndo: false, canRedo: false });
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const urlRef = useRef<HTMLInputElement>(null);

  const read = useCallback(() => {
    const sel = $getSelection();
    if (!$isRangeSelection(sel)) return;
    const anchor = sel.anchor.getNode();
    const top = anchor.getKey() === "root" ? anchor : ($findMatchingParent(anchor, (n) => {
      const p = n.getParent();
      return p !== null && $isRootOrShadowRoot(p);
    }) ?? anchor.getTopLevelElementOrThrow());
    const list = $getNearestNodeOfType(anchor, ListNode);
    const block: Block = list && $isListNode(list) ? (list.getListType() === "number" ? "number" : "bullet") : $isHeadingNode(top) ? (["h2", "h3", "h4"].includes(top.getTag()) ? (top.getTag() as Block) : "h2") : $isQuoteNode(top) ? "quote" : "paragraph";
    const linkNode = $findMatchingParent(anchor, $isLinkNode);
    const marks: State["marks"] = {};
    for (const m of MARKS) marks[m.format] = sel.hasFormat(m.format);
    const align = ($isElementNode(top) ? top.getFormatType() : "") || "left";
    // Read everything now: node methods only work inside this editor read.
    const link = linkNode && $isLinkNode(linkNode) ? linkNode.getURL() : null;
    setS((prev) => ({ ...prev, block, marks, align, link }));
  }, []);

  useEffect(
    () =>
      mergeRegister(
        editor.registerUpdateListener(({ editorState }) => editorState.read(read)),
        editor.registerCommand(SELECTION_CHANGE_COMMAND, () => (read(), false), COMMAND_PRIORITY_LOW),
        editor.registerCommand(CAN_UNDO_COMMAND, (v) => (setS((p) => ({ ...p, canUndo: v })), false), COMMAND_PRIORITY_LOW),
        editor.registerCommand(CAN_REDO_COMMAND, (v) => (setS((p) => ({ ...p, canRedo: v })), false), COMMAND_PRIORITY_LOW),
      ),
    [editor, read],
  );

  const setBlock = (b: Block) => {
    if (b === "bullet" || b === "number") {
      editor.dispatchCommand(s.block === b ? REMOVE_LIST_COMMAND : b === "bullet" ? INSERT_UNORDERED_LIST_COMMAND : INSERT_ORDERED_LIST_COMMAND, undefined);
      return;
    }
    if (s.block === "bullet" || s.block === "number") editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    editor.update(() => {
      const sel = $getSelection();
      if (!$isRangeSelection(sel)) return;
      $setBlocksType(sel, () => (b === "paragraph" ? $createParagraphNode() : b === "quote" ? $createQuoteNode() : $createHeadingNode(b as HeadingTagType)));
    });
  };

  const clearFormatting = () => {
    editor.update(() => {
      const sel = $getSelection();
      if (!$isRangeSelection(sel)) return;
      for (const node of sel.getNodes()) if ($isTextNode(node)) node.setFormat(0);
    });
    if (s.link !== null) editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
  };

  const openLink = () => {
    setUrl(s.link ?? "");
    setUrlError("");
    setLinkOpen(true);
    requestAnimationFrame(() => urlRef.current?.focus());
  };
  const applyLink = () => {
    const href = normaliseUrl(url);
    if (!href) return setUrlError("Enter a web address (like example.com) or an email address.");
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, { url: href, target: "_blank", rel: "noopener noreferrer" });
    setLinkOpen(false);
    editor.focus();
  };

  return (
    <div className="border-b border-slate-100 bg-slate-50/70">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5" role="toolbar" aria-label="Formatting">
        <Btn label="Undo (Ctrl+Z)" disabled={disabled || !s.canUndo} onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}>
          <Undo2 size={16} />
        </Btn>
        <Btn label="Redo (Ctrl+Shift+Z)" disabled={disabled || !s.canRedo} onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}>
          <Redo2 size={16} />
        </Btn>
        <Sep />
        <BlockMenu value={s.block} disabled={disabled} onPick={setBlock} />
        <Sep />
        {MARKS.map((m) => (
          <Btn key={m.format} on={!!s.marks[m.format]} label={m.key ? `${m.label} (${m.key})` : m.label} disabled={disabled} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, m.format)}>
            {m.icon}
          </Btn>
        ))}
        <Sep />
        <Btn on={s.link !== null || linkOpen} label={s.link ? "Edit link" : "Add link"} disabled={disabled} onClick={openLink}>
          <Link2 size={16} />
        </Btn>
        {s.link !== null && (
          <Btn label="Remove link" disabled={disabled} onClick={() => editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)}>
            <Unlink size={16} />
          </Btn>
        )}
        <Sep />
        <Btn on={s.block === "bullet"} label="Bulleted list" disabled={disabled} onClick={() => setBlock("bullet")}>
          <List size={16} />
        </Btn>
        <Btn on={s.block === "number"} label="Numbered list" disabled={disabled} onClick={() => setBlock("number")}>
          <ListOrdered size={16} />
        </Btn>
        <Btn on={s.block === "quote"} label="Quote" disabled={disabled} onClick={() => setBlock(s.block === "quote" ? "paragraph" : "quote")}>
          <Quote size={16} />
        </Btn>
        <Sep />
        {ALIGNS.map((a) => (
          <Btn key={a.value} on={s.align === a.value} label={a.label} disabled={disabled} onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, a.value)}>
            {a.icon}
          </Btn>
        ))}
        <Sep />
        <Btn label="Decrease indent" disabled={disabled} onClick={() => editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)}>
          <IndentDecrease size={16} />
        </Btn>
        <Btn label="Increase indent" disabled={disabled} onClick={() => editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)}>
          <IndentIncrease size={16} />
        </Btn>
        <Sep />
        <Btn label="Clear formatting" disabled={disabled} onClick={clearFormatting}>
          <Eraser size={16} />
        </Btn>
      </div>
      {linkOpen && (
        <div className="border-t border-slate-100 px-3 py-2">
          <div className="flex items-center gap-2">
            <Link2 size={15} className="shrink-0 text-slate-400" />
            <input
              ref={urlRef}
              type="url"
              inputMode="url"
              aria-label="Link address"
              placeholder="Paste or type a link, e.g. example.com"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setUrlError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyLink();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setLinkOpen(false);
                  editor.focus();
                }
              }}
              className="h-8 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15"
            />
            <button type="button" onClick={applyLink} className="h-8 shrink-0 rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white hover:bg-slate-800">
              {s.link ? "Update" : "Add link"}
            </button>
            <button
              type="button"
              aria-label="Close"
              onClick={() => {
                setLinkOpen(false);
                editor.focus();
              }}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <X size={16} />
            </button>
          </div>
          {urlError ? <p className="mt-1.5 text-xs text-red-600">{urlError}</p> : <p className="mt-1.5 text-xs text-slate-500">Select some text first, then add the link to it.</p>}
        </div>
      )}
    </div>
  );
}

function Editable({ disabled }: { disabled?: boolean }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => editor.setEditable(!disabled), [editor, disabled]);
  return null;
}

/** Text length the way people count it (no line breaks), used for the counter and limits. */
const lengthOf = (state: EditorState) => state.read(() => $getRoot().getTextContent().replace(/\n/g, "").length);

/**
 * The site's rich text box: headings, quotes, bold, italic, underline, strikethrough, code,
 * sub/superscript, links, lists, alignment, indent, undo and redo. Saves Lexical JSON, the same
 * format as Payload's editor, so the admin and the site edit the same content.
 */
export function RichTextEditor({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  minHeight = 160,
  onLength,
  "aria-describedby": describedBy,
  "aria-label": ariaLabel,
}: {
  id?: string;
  value: unknown;
  onChange: (v: Lexical | null) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
  onLength?: (n: number) => void;
  "aria-describedby"?: string;
  /** Needed for screen readers: a <label for> can't name an editable area. */
  "aria-label"?: string;
}) {
  // Read the starting value once; after that the editor owns its state.
  const initial = useMemo(() => {
    const doc = forSiteEditor(value);
    return doc ? JSON.stringify(doc) : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const config = useMemo(
    () => ({
      namespace: id ?? "sabina-rich",
      theme,
      nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode],
      editable: !disabled,
      editorState: initial,
      onError: (e: Error) => console.error(e),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  return (
    <LexicalComposer initialConfig={config}>
      <div className={`rounded-xl border border-slate-200 bg-white shadow-sm transition focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-600/15 ${disabled ? "bg-slate-50" : ""}`}>
        <div className="overflow-visible rounded-t-xl">
          <Toolbar disabled={disabled} />
        </div>
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                id={id}
                aria-describedby={describedBy}
                ariaLabel={ariaLabel}
                aria-placeholder={placeholder ?? ""}
                placeholder={<div className="pointer-events-none absolute left-4 top-3 text-[15px] text-slate-400">{placeholder}</div>}
                style={{ minHeight }}
                className="px-4 py-3 text-[15px] leading-relaxed text-slate-900 outline-none"
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
      </div>
      <HistoryPlugin />
      <ListPlugin />
      <LinkPlugin validateUrl={(u) => /^(https?:\/\/|mailto:)/i.test(u)} />
      <Editable disabled={disabled} />
      <OnChangePlugin
        ignoreSelectionChange
        onChange={(state) => {
          const n = lengthOf(state);
          onLength?.(n);
          onChange(n === 0 ? null : (state.toJSON() as unknown as Lexical));
        }}
      />
    </LexicalComposer>
  );
}
