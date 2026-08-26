"use client";

import * as React from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Minus,
  Eye,
  Code2,
  Columns,
  Sparkles,
  Undo,
  Redo,
  CheckSquare,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface RichTextEditorProps {
  value: string;
  onChange: (contentHtml: string) => void;
  minHeight?: string;
  placeholder?: string;
}

export function RichTextEditor({
  value,
  onChange,
  minHeight = "400px",
  placeholder = "Write or paste formatted content here...",
}: RichTextEditorProps) {
  const [viewMode, setViewMode] = React.useState<"visual" | "html" | "split">("visual");
  const editorRef = React.useRef<HTMLDivElement>(null);
  const isUpdatingRef = React.useRef(false);

  // Sync internal editor innerHTML with external value only when not currently typing
  React.useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value, viewMode]);

  const handleInput = () => {
    if (editorRef.current) {
      isUpdatingRef.current = true;
      const html = editorRef.current.innerHTML;
      onChange(html);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 50);
    }
  };

  const exec = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  const insertLink = () => {
    const url = prompt("Enter URL:", "https://");
    if (url && url !== "https://") {
      exec("createLink", url);
    }
  };

  const insertImage = () => {
    const url = prompt("Enter Image URL:", "https://images.unsplash.com/");
    if (url && url !== "https://") {
      exec("insertImage", url);
    }
  };

  const insertTable = () => {
    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #e2e8f0;">
        <thead>
          <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left; font-weight: bold;">Column 1</th>
            <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left; font-weight: bold;">Column 2</th>
            <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left; font-weight: bold;">Column 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">Data 1</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">Data 2</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">Data 3</td>
          </tr>
        </tbody>
      </table>
    `;
    exec("insertHTML", tableHtml);
  };

  const insertCallout = (type: "info" | "warning" | "success") => {
    const styles = {
      info: "background: #eff6ff; border-left: 4px solid #3b82f6; color: #1e3a8a; padding: 12px 16px; border-radius: 8px; margin: 14px 0;",
      warning: "background: #fffbeb; border-left: 4px solid #f59e0b; color: #78350f; padding: 12px 16px; border-radius: 8px; margin: 14px 0;",
      success: "background: #ecfdf5; border-left: 4px solid #10b981; color: #064e3b; padding: 12px 16px; border-radius: 8px; margin: 14px 0;",
    };
    const title = type.toUpperCase();
    const calloutHtml = `
      <div style="${styles[type]}">
        <strong>${title}:</strong> Important guideline or policy information details go here.
      </div>
    `;
    exec("insertHTML", calloutHtml);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col">
      {/* ── Toolbar ── */}
      <div className="bg-slate-50 border-b border-slate-200 p-2 flex flex-wrap items-center justify-between gap-1.5 select-none">
        <div className="flex flex-wrap items-center gap-1">
          {/* Headings */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => exec("formatBlock", "<h1>")}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition"
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => exec("formatBlock", "<h2>")}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition"
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => exec("formatBlock", "<h3>")}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition"
              title="Heading 3"
            >
              <Heading3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => exec("formatBlock", "<p>")}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition"
              title="Paragraph"
            >
              <Pilcrow className="w-4 h-4" />
            </button>
          </div>

          {/* Formatting */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => exec("bold")}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition"
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => exec("italic")}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition"
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => exec("underline")}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition"
              title="Underline (Ctrl+U)"
            >
              <Underline className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => exec("strikeThrough")}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition"
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4" />
            </button>
          </div>

          {/* Lists & Quotes */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => exec("insertUnorderedList")}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition"
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => exec("insertOrderedList")}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition"
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => exec("formatBlock", "<blockquote>")}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition"
              title="Blockquote"
            >
              <Quote className="w-4 h-4" />
            </button>
          </div>

          {/* Alignment */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => exec("justifyLeft")}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition"
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => exec("justifyCenter")}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition"
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => exec("justifyRight")}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition"
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </button>
          </div>

          {/* Inserts */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-xs">
            <button
              type="button"
              onClick={insertLink}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition"
              title="Insert Link"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={insertImage}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition"
              title="Insert Image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={insertTable}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition"
              title="Insert Table"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => exec("insertHorizontalRule")}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 transition"
              title="Divider Rule"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          {/* Callout Presets */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={() => insertCallout("info")}
              className="px-2 py-1 text-[10px] font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition"
            >
              + Note Callout
            </button>
            <button
              type="button"
              onClick={() => insertCallout("warning")}
              className="px-2 py-1 text-[10px] font-bold rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition"
            >
              + Warning Callout
            </button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-xs">
          <button
            type="button"
            onClick={() => setViewMode("visual")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              viewMode === "visual" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Visual</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("html")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              viewMode === "html" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>HTML</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition hidden sm:flex items-center gap-1 ${
              viewMode === "split" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Split Preview</span>
          </button>
        </div>
      </div>

      {/* ── Editor Canvas Stage ── */}
      <div
        className="w-full flex flex-1 overflow-hidden"
        style={{ minHeight }}
      >
        {/* Visual Editor */}
        {(viewMode === "visual" || viewMode === "split") && (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            className="flex-1 p-6 text-slate-800 focus:outline-none overflow-y-auto prose prose-slate max-w-none prose-headings:font-heading prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:leading-relaxed prose-li:leading-relaxed"
            style={{ minHeight }}
            data-placeholder={placeholder}
          />
        )}

        {/* Split Divider */}
        {viewMode === "split" && (
          <div className="w-[1px] bg-slate-200 shrink-0" />
        )}

        {/* HTML Source Mode */}
        {viewMode === "html" && (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 p-6 font-mono text-xs text-slate-800 bg-slate-950 text-emerald-400 focus:outline-none resize-none leading-relaxed"
            style={{ minHeight }}
            placeholder="<html>..."
          />
        )}

        {/* Live Preview on Split Mode */}
        {viewMode === "split" && (
          <div
            className="flex-1 p-6 bg-slate-50/50 overflow-y-auto prose prose-slate max-w-none prose-headings:font-heading prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:leading-relaxed"
            style={{ minHeight }}
            dangerouslySetInnerHTML={{ __html: value }}
          />
        )}
      </div>
    </div>
  );
}
