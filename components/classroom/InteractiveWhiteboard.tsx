"use client";

import * as React from "react";
import {
  Pencil,
  Highlighter,
  Eraser,
  Square,
  Circle,
  Slash,
  ArrowUpRight,
  Triangle,
  Grid,
  Type,
  Sparkles,
  Undo2,
  Redo2,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  Plus,
  Compass,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export type WhiteboardTool =
  | "pen"
  | "highlighter"
  | "eraser"
  | "line"
  | "arrow"
  | "rect"
  | "circle"
  | "triangle"
  | "graph"
  | "text"
  | "laser";

export type BackgroundType = "blank" | "math_grid" | "dot_grid" | "lined" | "chalkboard";

export interface StrokeElement {
  id: string;
  tool: WhiteboardTool;
  color: string;
  width: number;
  points: Array<{ x: number; y: number }>;
  text?: string;
  page: number;
}

interface InteractiveWhiteboardProps {
  isTutor: boolean;
  isAuthorized?: boolean;
  onBroadcastStroke?: (stroke: StrokeElement) => void;
  externalStrokes?: StrokeElement[];
  className?: string;
}

const COLOR_PALETTE = [
  "#0F172A", // Dark Slate / Black
  "#2563EB", // Royal Blue
  "#10B981", // Emerald Green
  "#DC2626", // Crimson Red
  "#9333EA", // Purple
  "#F59E0B", // Amber Gold
  "#06B6D4", // Cyan
  "#FFFFFF", // White
];

const STROKE_WIDTHS = [2, 4, 8, 14];

export function InteractiveWhiteboard({
  isTutor,
  isAuthorized = false,
  onBroadcastStroke,
  externalStrokes = [],
  className = "",
}: InteractiveWhiteboardProps) {
  const canDraw = isTutor || isAuthorized;
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const bgCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // Tool & style state
  const [currentTool, setCurrentTool] = React.useState<WhiteboardTool>("pen");
  const [selectedColor, setSelectedColor] = React.useState<string>("#2563EB");
  const [strokeWidth, setStrokeWidth] = React.useState<number>(4);
  const [backgroundType, setBackgroundType] = React.useState<BackgroundType>("math_grid");

  // Multi-page state
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [totalPages, setTotalPages] = React.useState<number>(1);

  // Drawing elements per page
  const [elements, setElements] = React.useState<StrokeElement[]>([]);
  const [redoStack, setRedoStack] = React.useState<StrokeElement[]>([]);

  // Drawing interaction refs
  const isDrawing = React.useRef<boolean>(false);
  const currentPoints = React.useRef<Array<{ x: number; y: number }>>([]);
  const laserTrail = React.useRef<Array<{ x: number; y: number; time: number }>>([]);

  // Text input state
  const [textInput, setTextInput] = React.useState<{ x: number; y: number; value: string } | null>(null);

  // Sync external strokes
  React.useEffect(() => {
    if (externalStrokes.length > 0) {
      setElements((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const newOnes = externalStrokes.filter((e) => !existingIds.has(e.id));
        return [...prev, ...newOnes];
      });
    }
  }, [externalStrokes]);

  // Handle Canvas Resize
  const handleResize = React.useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const bgCanvas = bgCanvasRef.current;
    if (!container || !canvas || !bgCanvas) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    bgCanvas.width = rect.width * dpr;
    bgCanvas.height = rect.height * dpr;

    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);

    const bgCtx = bgCanvas.getContext("2d");
    if (bgCtx) bgCtx.scale(dpr, dpr);

    drawBackground(rect.width, rect.height);
    redrawCanvas();
  }, [backgroundType, elements, currentPage]);

  React.useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  // ─── Draw Background Texture (Math Grid, Dot Grid, Lined, Chalkboard) ───
  const drawBackground = (width: number, height: number) => {
    const bgCanvas = bgCanvasRef.current;
    if (!bgCanvas) return;
    const ctx = bgCanvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (backgroundType === "blank") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
    } else if (backgroundType === "chalkboard") {
      ctx.fillStyle = "#1E293B"; // Dark chalkboard slate
      ctx.fillRect(0, 0, width, height);
    } else if (backgroundType === "math_grid") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "#E2E8F0"; // Subtle grid line
      ctx.lineWidth = 1;
      const gridSize = 24;

      ctx.beginPath();
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    } else if (backgroundType === "dot_grid") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#CBD5E1";
      const dotSize = 2;
      const step = 28;

      for (let x = step; x < width; x += step) {
        for (let y = step; y < height; y += step) {
          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (backgroundType === "lined") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);

      // Margin line (pink/red)
      ctx.strokeStyle = "#FCA5A5";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(60, 0);
      ctx.lineTo(60, height);
      ctx.stroke();

      // Horizontal lines (light blue)
      ctx.strokeStyle = "#BAE6FD";
      ctx.lineWidth = 1;
      const lineSpacing = 32;

      ctx.beginPath();
      for (let y = 60; y < height; y += lineSpacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    }
  };

  // ─── Redraw All Strokes for Current Page ───
  const redrawCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pageElements = elements.filter((e) => e.page === currentPage);

    pageElements.forEach((el) => {
      ctx.save();
      ctx.strokeStyle = el.color;
      ctx.fillStyle = el.color;
      ctx.lineWidth = el.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (el.tool === "highlighter") {
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = el.width * 2.5;
      } else if (el.tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = el.width * 3;
      }

      if (el.tool === "pen" || el.tool === "highlighter" || el.tool === "eraser") {
        if (el.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(el.points[0].x, el.points[0].y);
          for (let i = 1; i < el.points.length; i++) {
            ctx.lineTo(el.points[i].x, el.points[i].y);
          }
          ctx.stroke();
        } else if (el.points.length === 1) {
          ctx.beginPath();
          ctx.arc(el.points[0].x, el.points[0].y, el.width / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (el.tool === "line" && el.points.length >= 2) {
        const start = el.points[0];
        const end = el.points[el.points.length - 1];
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      } else if (el.tool === "arrow" && el.points.length >= 2) {
        const start = el.points[0];
        const end = el.points[el.points.length - 1];
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const headLength = Math.max(12, el.width * 2.5);
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
          end.x - headLength * Math.cos(angle - Math.PI / 6),
          end.y - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          end.x - headLength * Math.cos(angle + Math.PI / 6),
          end.y - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      } else if (el.tool === "rect" && el.points.length >= 2) {
        const start = el.points[0];
        const end = el.points[el.points.length - 1];
        ctx.beginPath();
        ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
      } else if (el.tool === "circle" && el.points.length >= 2) {
        const start = el.points[0];
        const end = el.points[el.points.length - 1];
        const rx = Math.abs(end.x - start.x) / 2;
        const ry = Math.abs(end.y - start.y) / 2;
        const cx = Math.min(start.x, end.x) + rx;
        const cy = Math.min(start.y, end.y) + ry;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (el.tool === "triangle" && el.points.length >= 2) {
        const start = el.points[0];
        const end = el.points[el.points.length - 1];
        ctx.beginPath();
        ctx.moveTo((start.x + end.x) / 2, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.lineTo(start.x, end.y);
        ctx.closePath();
        ctx.stroke();
      } else if (el.tool === "graph" && el.points.length >= 2) {
        // Coordinate axes with arrows and tick marks
        const start = el.points[0];
        const end = el.points[el.points.length - 1];
        const cx = (start.x + end.x) / 2;
        const cy = (start.y + end.y) / 2;

        ctx.beginPath();
        // X axis
        ctx.moveTo(start.x, cy);
        ctx.lineTo(end.x, cy);
        // Y axis
        ctx.moveTo(cx, start.y);
        ctx.lineTo(cx, end.y);
        ctx.stroke();

        // Ticks on X & Y
        const step = 20;
        ctx.lineWidth = 1;
        for (let x = cx + step; x < end.x; x += step) {
          ctx.moveTo(x, cy - 4);
          ctx.lineTo(x, cy + 4);
        }
        for (let x = cx - step; x > start.x; x -= step) {
          ctx.moveTo(x, cy - 4);
          ctx.lineTo(x, cy + 4);
        }
        for (let y = cy + step; y < end.y; y += step) {
          ctx.moveTo(cx - 4, y);
          ctx.lineTo(cx + 4, y);
        }
        for (let y = cy - step; y > start.y; y -= step) {
          ctx.moveTo(cx - 4, y);
          ctx.lineTo(cx + 4, y);
        }
        ctx.stroke();
      } else if (el.tool === "text" && el.text && el.points.length > 0) {
        ctx.font = `bold ${Math.max(16, el.width * 4)}px sans-serif`;
        ctx.fillText(el.text, el.points[0].x, el.points[0].y);
      }

      ctx.restore();
    });
  }, [elements, currentPage]);

  React.useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // ─── Mouse / Pointer Events ───
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canDraw) return;
    const pt = getCanvasCoords(e);

    if (currentTool === "text") {
      setTextInput({ x: pt.x, y: pt.y, value: "" });
      return;
    }

    if (currentTool === "laser") {
      laserTrail.current = [{ x: pt.x, y: pt.y, time: Date.now() }];
      return;
    }

    isDrawing.current = true;
    currentPoints.current = [pt];
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getCanvasCoords(e);

    // Laser pointer mode
    if (currentTool === "laser") {
      laserTrail.current.push({ x: pt.x, y: pt.y, time: Date.now() });
      // Keep only last 15 points
      if (laserTrail.current.length > 20) laserTrail.current.shift();

      redrawCanvas();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx && laserTrail.current.length > 1) {
        ctx.save();
        ctx.strokeStyle = "#EF4444";
        ctx.shadowColor = "#EF4444";
        ctx.shadowBlur = 10;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(laserTrail.current[0].x, laserTrail.current[0].y);
        for (let i = 1; i < laserTrail.current.length; i++) {
          ctx.lineTo(laserTrail.current[i].x, laserTrail.current[i].y);
        }
        ctx.stroke();

        // Laser head dot
        const last = laserTrail.current[laserTrail.current.length - 1];
        ctx.fillStyle = "#FF0000";
        ctx.beginPath();
        ctx.arc(last.x, last.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      return;
    }

    if (!isDrawing.current) return;

    if (currentTool === "pen" || currentTool === "highlighter" || currentTool === "eraser") {
      currentPoints.current.push(pt);
      redrawCanvas();

      // Draw current live stroke
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx && currentPoints.current.length > 1) {
        ctx.save();
        ctx.strokeStyle = selectedColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        if (currentTool === "highlighter") {
          ctx.globalAlpha = 0.35;
          ctx.lineWidth = strokeWidth * 2.5;
        } else if (currentTool === "eraser") {
          ctx.globalCompositeOperation = "destination-out";
          ctx.lineWidth = strokeWidth * 3;
        }

        ctx.beginPath();
        const pts = currentPoints.current;
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();
        ctx.restore();
      }
    } else {
      // Shape tools (line, rect, circle, triangle, graph)
      currentPoints.current = [currentPoints.current[0], pt];
      redrawCanvas();

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx && currentPoints.current.length === 2) {
        ctx.save();
        ctx.strokeStyle = selectedColor;
        ctx.fillStyle = selectedColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = "round";

        const start = currentPoints.current[0];
        const end = currentPoints.current[1];

        if (currentTool === "line") {
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
        } else if (currentTool === "rect") {
          ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
        } else if (currentTool === "circle") {
          const rx = Math.abs(end.x - start.x) / 2;
          const ry = Math.abs(end.y - start.y) / 2;
          const cx = Math.min(start.x, end.x) + rx;
          const cy = Math.min(start.y, end.y) + ry;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else if (currentTool === "triangle") {
          ctx.beginPath();
          ctx.moveTo((start.x + end.x) / 2, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.lineTo(start.x, end.y);
          ctx.closePath();
          ctx.stroke();
        } else if (currentTool === "graph") {
          const cx = (start.x + end.x) / 2;
          const cy = (start.y + end.y) / 2;
          ctx.beginPath();
          ctx.moveTo(start.x, cy);
          ctx.lineTo(end.x, cy);
          ctx.moveTo(cx, start.y);
          ctx.lineTo(cx, end.y);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    if (currentPoints.current.length > 0) {
      const newStroke: StrokeElement = {
        id: `strk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        tool: currentTool,
        color: selectedColor,
        width: strokeWidth,
        points: [...currentPoints.current],
        page: currentPage,
      };

      setElements((prev) => [...prev, newStroke]);
      setRedoStack([]);
      onBroadcastStroke?.(newStroke);
    }
    currentPoints.current = [];
  };

  // Submit Text Input
  const handleTextSubmit = () => {
    if (textInput && textInput.value.trim()) {
      const newStroke: StrokeElement = {
        id: `txt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        tool: "text",
        color: selectedColor,
        width: strokeWidth,
        points: [{ x: textInput.x, y: textInput.y }],
        text: textInput.value.trim(),
        page: currentPage,
      };
      setElements((prev) => [...prev, newStroke]);
      setRedoStack([]);
      onBroadcastStroke?.(newStroke);
    }
    setTextInput(null);
  };

  // ─── Undo & Redo ───
  const handleUndo = () => {
    const pageElements = elements.filter((e) => e.page === currentPage);
    if (pageElements.length === 0) return;
    const last = pageElements[pageElements.length - 1];
    setElements((prev) => prev.filter((e) => e.id !== last.id));
    setRedoStack((prev) => [...prev, last]);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setElements((prev) => [...prev, next]);
  };

  // Clear Board
  const handleClearBoard = () => {
    setElements((prev) => prev.filter((e) => e.page !== currentPage));
    setRedoStack([]);
  };

  // Export as Image
  const handleExportImage = () => {
    const canvas = canvasRef.current;
    const bgCanvas = bgCanvasRef.current;
    if (!canvas || !bgCanvas) return;

    const merged = document.createElement("canvas");
    merged.width = canvas.width;
    merged.height = canvas.height;
    const ctx = merged.getContext("2d");
    if (ctx) {
      ctx.drawImage(bgCanvas, 0, 0);
      ctx.drawImage(canvas, 0, 0);
      const link = document.createElement("a");
      link.download = `sabina-class-whiteboard-page${currentPage}.png`;
      link.href = merged.toDataURL("image/png");
      link.click();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 w-full h-full overflow-hidden bg-slate-900 select-none ${className}`}
    >
      {/* Background canvas layer */}
      <canvas ref={bgCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Interactive drawing canvas layer */}
      <canvas
        ref={canvasRef}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        className={`absolute inset-0 w-full h-full touch-none ${
          currentTool === "laser"
            ? "cursor-crosshair"
            : currentTool === "text"
            ? "cursor-text"
            : currentTool === "eraser"
            ? "cursor-cell"
            : "cursor-crosshair"
        }`}
      />

      {/* Floating Text Input Box */}
      {textInput && (
        <div
          style={{ left: textInput.x, top: textInput.y }}
          className="absolute z-40 bg-white dark:bg-slate-900 p-2 rounded-xl shadow-2xl border-2 border-indigo-500 min-w-[200px]"
        >
          <input
            autoFocus
            type="text"
            placeholder="Type note or equation..."
            value={textInput.value}
            onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTextSubmit();
              if (e.key === "Escape") setTextInput(null);
            }}
            className="w-full text-xs font-bold text-slate-900 dark:text-white bg-transparent outline-none"
          />
          <div className="flex justify-end gap-1 mt-1">
            <button
              onClick={() => setTextInput(null)}
              className="text-[10px] text-slate-400 hover:text-slate-600 px-1.5 py-0.5"
            >
              Cancel
            </button>
            <button
              onClick={handleTextSubmit}
              className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded"
            >
              Place Text
            </button>
          </div>
        </div>
      )}

      {/* ─── CLASSIN-GRADE FLOATING BOTTOM TOOLBAR ─── */}
      {!canDraw ? (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 bg-slate-900/95 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-slate-700/80 shadow-[0_10px_35px_rgba(0,0,0,0.5)] text-slate-300 text-xs font-bold select-none">
          <Lock className="h-4 w-4 text-amber-400 shrink-0" />
          <span>Whiteboard in View Mode • Awaiting Tutor Pen Authorization</span>
        </div>
      ) : (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-700/80 shadow-[0_10px_35px_rgba(0,0,0,0.5)] text-white">
        
        {/* Pen */}
        <button
          type="button"
          onClick={() => setCurrentTool("pen")}
          title="Pen Tool (Draw freehand)"
          className={`p-2 rounded-xl transition ${
            currentTool === "pen"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Pencil className="h-4 w-4" />
        </button>

        {/* Highlighter */}
        <button
          type="button"
          onClick={() => setCurrentTool("highlighter")}
          title="Highlighter Tool (Translucent)"
          className={`p-2 rounded-xl transition ${
            currentTool === "highlighter"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Highlighter className="h-4 w-4" />
        </button>

        {/* Eraser */}
        <button
          type="button"
          onClick={() => setCurrentTool("eraser")}
          title="Eraser Tool"
          className={`p-2 rounded-xl transition ${
            currentTool === "eraser"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Eraser className="h-4 w-4" />
        </button>

        {/* Shapes Group */}
        <div className="h-5 w-px bg-slate-700 mx-1" />

        <button
          type="button"
          onClick={() => setCurrentTool("line")}
          title="Straight Line"
          className={`p-2 rounded-xl transition ${
            currentTool === "line"
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Slash className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => setCurrentTool("arrow")}
          title="Arrow Pointer"
          className={`p-2 rounded-xl transition ${
            currentTool === "arrow"
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <ArrowUpRight className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => setCurrentTool("rect")}
          title="Rectangle Shape"
          className={`p-2 rounded-xl transition ${
            currentTool === "rect"
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Square className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => setCurrentTool("circle")}
          title="Circle / Ellipse"
          className={`p-2 rounded-xl transition ${
            currentTool === "circle"
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Circle className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => setCurrentTool("triangle")}
          title="Triangle Shape"
          className={`p-2 rounded-xl transition ${
            currentTool === "triangle"
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Triangle className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => setCurrentTool("graph")}
          title="Math Coordinate Axes (X-Y Plane)"
          className={`p-2 rounded-xl transition ${
            currentTool === "graph"
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Compass className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => setCurrentTool("text")}
          title="Text Tool"
          className={`p-2 rounded-xl transition ${
            currentTool === "text"
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Type className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => setCurrentTool("laser")}
          title="Laser Pointer (Live glowing trail)"
          className={`p-2 rounded-xl transition ${
            currentTool === "laser"
              ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Sparkles className="h-4 w-4" />
        </button>

        {/* Color Palette */}
        <div className="h-5 w-px bg-slate-700 mx-1" />

        <div className="flex items-center gap-1">
          {COLOR_PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedColor(c)}
              style={{ backgroundColor: c }}
              className={`h-5 w-5 rounded-full border transition ${
                selectedColor === c ? "border-white scale-125 ring-2 ring-indigo-500 shadow-sm" : "border-slate-600 hover:scale-110"
              }`}
            />
          ))}
        </div>

        {/* Stroke Widths */}
        <div className="h-5 w-px bg-slate-700 mx-1" />

        <div className="flex items-center gap-1">
          {STROKE_WIDTHS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setStrokeWidth(w)}
              className={`p-1.5 rounded-lg transition text-[10px] font-bold ${
                strokeWidth === w
                  ? "bg-slate-800 text-white ring-1 ring-slate-500"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <div
                style={{ height: w, width: 14 }}
                className="bg-current rounded-full mx-auto"
              />
            </button>
          ))}
        </div>

        {/* Background Selector */}
        <div className="h-5 w-px bg-slate-700 mx-1" />

        <select
          value={backgroundType}
          onChange={(e) => setBackgroundType(e.target.value as BackgroundType)}
          className="rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="math_grid">📐 Math Grid</option>
          <option value="blank">📄 Blank White</option>
          <option value="dot_grid">⚬ Dot Grid</option>
          <option value="lined">📝 Lined Paper</option>
          <option value="chalkboard">⬛ Chalkboard</option>
        </select>

        {/* Actions (Undo/Redo/Clear/Export) */}
        <div className="h-5 w-px bg-slate-700 mx-1" />

        <button
          type="button"
          onClick={handleUndo}
          title="Undo (Ctrl+Z)"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <Undo2 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={handleRedo}
          title="Redo (Ctrl+Y)"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <Redo2 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={handleClearBoard}
          title="Clear Entire Page"
          className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-900/30 transition"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={handleExportImage}
          title="Export Canvas as PNG"
          className="p-2 rounded-xl text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/30 transition"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>
      )}

      {/* ─── MULTI-PAGE CONTROLLER (Top-Right) ─── */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-700/80 shadow-lg text-white">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="text-xs font-bold text-slate-200">
          Page {currentPage} of {totalPages}
        </span>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => {
            const nextP = totalPages + 1;
            setTotalPages(nextP);
            setCurrentPage(nextP);
          }}
          title="Add New Whiteboard Page"
          className="p-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold ml-1"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
