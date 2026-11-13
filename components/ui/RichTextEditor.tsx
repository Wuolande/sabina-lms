"use client";
import { useEffect, useMemo, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isListNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, ListItemNode, ListNode, REMOVE_LIST_COMMAND } from "@lexical/list";
import { $getNearestNodeOfType, mergeRegister } from "@lexical/utils";
import { $getRoot, $getSelection, $isRangeSelection, COMMAND_PRIORITY_LOW, FORMAT_TEXT_COMMAND, SELECTION_CHANGE_COMMAND, type EditorState } from "lexical";
import { Bold, Italic, List, ListOrdered, Underline } from "lucide-react";
import { forSiteEditor, type Lexical } from "@/cms/content/rich";

const theme = {
  paragraph: "mb-2 last:mb-0",
  list: { ul: "mb-2 ml-5 list-disc space-y-1", ol: "mb-2 ml-5 list-decimal space-y-1", listitem: "pl-1", nested: { listitem: "list-none" } },
  text: { bold: "font-semibold", italic: "italic", underline: "underline" },
};

function Toolbar({ disabled }: { disabled?: boolean }) {
  const [editor] = useLexicalComposerContext();
  const [s, setS] = useState({ bold: false, italic: false, underline: false, list: "" as "" | "bullet" | "number" });
  useEffect(() => {
    const read = () => {
      const sel = $getSelection();
      if (!$isRangeSelection(sel)) return;
      const anchor = sel.anchor.getNode();
      const list = $getNearestNodeOfType(anchor, ListNode);
      setS({ bold: sel.hasFormat("bold"), italic: sel.hasFormat("italic"), underline: sel.hasFormat("underline"), list: list && $isListNode(list) ? (list.getListType() as "bullet" | "number") : "" });
    };
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => editorState.read(read)),
      editor.registerCommand(SELECTION_CHANGE_COMMAND, () => (read(), false), COMMAND_PRIORITY_LOW),
    );
  }, [editor]);
  const btn = (on: boolean, label: string, icon: React.ReactNode, run: () => void) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={on}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={run}
      className={`grid h-8 w-8 place-items-center rounded-lg transition disabled:opacity-40 ${on ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
    >
      {icon}
    </button>
  );
  return (
    <div className="flex items-center gap-0.5 border-b border-slate-100 px-2 py-1.5" role="toolbar" aria-label="Formatting">
      {btn(s.bold, "Bold", <Bold size={16} />, () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold"))}
      {btn(s.italic, "Italic", <Italic size={16} />, () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic"))}
      {btn(s.underline, "Underline", <Underline size={16} />, () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline"))}
      <span className="mx-1 h-5 w-px bg-slate-200" />
      {btn(s.list === "bullet", "Bulleted list", <List size={16} />, () => editor.dispatchCommand(s.list === "bullet" ? REMOVE_LIST_COMMAND : INSERT_UNORDERED_LIST_COMMAND, undefined))}
      {btn(s.list === "number", "Numbered list", <ListOrdered size={16} />, () => editor.dispatchCommand(s.list === "number" ? REMOVE_LIST_COMMAND : INSERT_ORDERED_LIST_COMMAND, undefined))}
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
 * A small rich text box for the site: bold, italic, underline and lists. Saves Lexical JSON,
 * the same format as Payload's editor, so the admin and the site edit the same content.
 */
export function RichTextEditor({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  minHeight = 140,
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
      nodes: [ListNode, ListItemNode],
      editable: !disabled,
      editorState: initial,
      onError: (e: Error) => console.error(e),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  return (
    <LexicalComposer initialConfig={config}>
      <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-600/15 ${disabled ? "bg-slate-50" : ""}`}>
        <Toolbar disabled={disabled} />
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
