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
  Unlock,
} from "lucide-react";

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

export interface StrokePoint {
  x: number;
  y: number;
  /** Normalized 0..1 coordinates for cross-device resolution independence */
  nx?: number;
  ny?: number;
}

export interface StrokeElement {
  id: string;
  tool: WhiteboardTool;
  color: string;
  width: number;
  points: StrokePoint[];
  text?: string;
  page: number;
  canvasWidth?: number;
  canvasHeight?: number;
  author?: string;
}

export interface WhiteboardSyncSnapshot {
  strokes: StrokeElement[];
  currentPage: number;
  totalPages: number;
  backgroundType: BackgroundType;
  updatedAt?: number;
}

interface InteractiveWhiteboardProps {
  isTutor: boolean;
  isAuthorized?: boolean;
  onToggleAuthorizeStudent?: () => void;
  onBroadcastStroke?: (stroke: StrokeElement) => void;
  onBroadcastLiveStroke?: (stroke: StrokeElement | null) => void;
  onBroadcastLaser?: (point: { nx: number; ny: number } | null) => void;
  onSyncState?: (snapshot: WhiteboardSyncSnapshot) => void;
  externalStrokes?: StrokeElement[];
  externalLiveStroke?: StrokeElement | null;
  externalLaserPoint?: { nx: number; ny: number } | null;
  externalPage?: number;
  externalTotalPages?: number;
  externalBackgroundType?: BackgroundType;
  externalStateVersion?: number;
  currentUserName?: string;
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

const STROKE_WIDTHS = [2, 4, 7, 12];

export function InteractiveWhiteboard({
  isTutor,
  isAuthorized = false,
  onToggleAuthorizeStudent,
  onBroadcastStroke,
  onBroadcastLiveStroke,
  onBroadcastLaser,
  onSyncState,
  externalStrokes = [],
  externalLiveStroke = null,
  externalLaserPoint = null,
  externalPage,
  externalTotalPages,
  externalBackgroundType,
  externalStateVersion = 0,
  currentUserName = "Participant",
  className = "",
}: InteractiveWhiteboardProps) {
  const canDraw = isTutor || isAuthorized;
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const bgCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const sizeRef = React.useRef<{ width: number; height: number }>({ width: 800, height: 500 });

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
  const activePointerId = React.useRef<number | null>(null);
  const currentPoints = React.useRef<StrokePoint[]>([]);
  const liveStrokeIdRef = React.useRef<string>("");
  const lastLiveBroadcastRef = React.useRef<number>(0);
  const laserTrail = React.useRef<Array<{ nx: number; ny: number; time: number }>>([]);

  // Text input state
  const [textInput, setTextInput] = React.useState<{
    x: number;
    y: number;
    nx: number;
    ny: number;
    value: string;
  } | null>(null);

  // Sync full external state replacement (Undo, Redo, Clear, Initial Load, Remote Snapshot)
  React.useEffect(() => {
    if (externalStateVersion > 0) {
      setElements(externalStrokes);
    }
  }, [externalStateVersion, externalStrokes]);

  // Merge incremental external strokes
  React.useEffect(() => {
    if (externalStrokes.length > 0 && externalStateVersion === 0) {
      setElements((prev) => {
        const existingMap = new Map(prev.map((e) => [e.id, e]));
        let changed = false;
        for (const ext of externalStrokes) {
          if (!existingMap.has(ext.id)) {
            existingMap.set(ext.id, ext);
            changed = true;
          }
        }
        return changed ? Array.from(existingMap.values()) : prev;
      });
    }
  }, [externalStrokes, externalStateVersion]);

  // Sync external page, totalPages, and backgroundType when updated remotely
  React.useEffect(() => {
    if (typeof externalPage === "number" && externalPage >= 1) {
      setCurrentPage(externalPage);
    }
  }, [externalPage]);

  React.useEffect(() => {
    if (typeof externalTotalPages === "number" && externalTotalPages >= 1) {
      setTotalPages((prev) => Math.max(prev, externalTotalPages));
    }
  }, [externalTotalPages]);

  React.useEffect(() => {
    if (externalBackgroundType) {
      setBackgroundType(externalBackgroundType);
    }
  }, [externalBackgroundType]);

  // Track external laser trail
  React.useEffect(() => {
    if (externalLaserPoint) {
      laserTrail.current.push({
        nx: externalLaserPoint.nx,
        ny: externalLaserPoint.ny,
        time: Date.now(),
      });
      if (laserTrail.current.length > 20) {
        laserTrail.current.shift();
      }
      redrawCanvas();
    }
  }, [externalLaserPoint]);

  // Resolve a StrokePoint to current canvas pixel coordinates
  const resolvePoint = (
    pt: StrokePoint,
    width: number,
    height: number,
    strokeCanvasWidth?: number,
    strokeCanvasHeight?: number
  ): { x: number; y: number } => {
    if (typeof pt.nx === "number" && typeof pt.ny === "number") {
      return { x: pt.nx * width, y: pt.ny * height };
    }
    if (strokeCanvasWidth && strokeCanvasHeight && strokeCanvasWidth > 0 && strokeCanvasHeight > 0) {
      return {
        x: (pt.x / strokeCanvasWidth) * width,
        y: (pt.y / strokeCanvasHeight) * height,
      };
    }
    if (pt.x >= 0 && pt.x <= 1.01 && pt.y >= 0 && pt.y <= 1.01) {
      return { x: pt.x * width, y: pt.y * height };
    }
    return { x: pt.x, y: pt.y };
  };

  // Draw a single StrokeElement onto a 2D context
  const renderStrokeElement = (
    ctx: CanvasRenderingContext2D,
    el: StrokeElement,
    width: number,
    height: number
  ) => {
    if (!el.points || el.points.length === 0) return;

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
      ctx.lineWidth = el.width * 3.5;
    }

    const pts = el.points.map((p) =>
      resolvePoint(p, width, height, el.canvasWidth, el.canvasHeight)
    );

    if (el.tool === "pen" || el.tool === "highlighter" || el.tool === "eraser") {
      if (pts.length > 1) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();
      } else if (pts.length === 1) {
        ctx.beginPath();
        ctx.arc(pts[0].x, pts[0].y, el.width / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (el.tool === "line" && pts.length >= 2) {
      const start = pts[0];
      const end = pts[pts.length - 1];
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    } else if (el.tool === "arrow" && pts.length >= 2) {
      const start = pts[0];
      const end = pts[pts.length - 1];
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

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
    } else if (el.tool === "rect" && pts.length >= 2) {
      const start = pts[0];
      const end = pts[pts.length - 1];
      ctx.beginPath();
      ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
    } else if (el.tool === "circle" && pts.length >= 2) {
      const start = pts[0];
      const end = pts[pts.length - 1];
      const rx = Math.abs(end.x - start.x) / 2;
      const ry = Math.abs(end.y - start.y) / 2;
      const cx = Math.min(start.x, end.x) + rx;
      const cy = Math.min(start.y, end.y) + ry;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (el.tool === "triangle" && pts.length >= 2) {
      const start = pts[0];
      const end = pts[pts.length - 1];
      ctx.beginPath();
      ctx.moveTo((start.x + end.x) / 2, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.lineTo(start.x, end.y);
      ctx.closePath();
      ctx.stroke();
    } else if (el.tool === "graph" && pts.length >= 2) {
      const start = pts[0];
      const end = pts[pts.length - 1];
      const cx = (start.x + end.x) / 2;
      const cy = (start.y + end.y) / 2;

      ctx.beginPath();
      ctx.moveTo(start.x, cy);
      ctx.lineTo(end.x, cy);
      ctx.moveTo(cx, start.y);
      ctx.lineTo(cx, end.y);
      ctx.stroke();

      const step = 20;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = cx + step; x < Math.max(start.x, end.x); x += step) {
        ctx.moveTo(x, cy - 4);
        ctx.lineTo(x, cy + 4);
      }
      for (let x = cx - step; x > Math.min(start.x, end.x); x -= step) {
        ctx.moveTo(x, cy - 4);
        ctx.lineTo(x, cy + 4);
      }
      for (let y = cy + step; y < Math.max(start.y, end.y); y += step) {
        ctx.moveTo(cx - 4, y);
        ctx.lineTo(cx + 4, y);
      }
      for (let y = cy - step; y > Math.min(start.y, end.y); y -= step) {
        ctx.moveTo(cx - 4, y);
        ctx.lineTo(cx + 4, y);
      }
      ctx.stroke();
    } else if (el.tool === "text" && el.text && pts.length > 0) {
      ctx.font = `bold ${Math.max(15, el.width * 3.5)}px sans-serif`;
      ctx.fillText(el.text, pts[0].x, pts[0].y);
    }

    ctx.restore();
  };

  // Draw Background Texture
  const drawBackground = React.useCallback(
    (width: number, height: number) => {
      const bgCanvas = bgCanvasRef.current;
      if (!bgCanvas || width <= 0 || height <= 0) return;
      const ctx = bgCanvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      if (backgroundType === "blank") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
      } else if (backgroundType === "chalkboard") {
        ctx.fillStyle = "#1E293B";
        ctx.fillRect(0, 0, width, height);
      } else if (backgroundType === "math_grid") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = "#E2E8F0";
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
        const dotSize = 1.8;
        const step = 26;
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
        ctx.strokeStyle = "#FCA5A5";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(48, 0);
        ctx.lineTo(48, height);
        ctx.stroke();

        ctx.strokeStyle = "#BAE6FD";
        ctx.lineWidth = 1;
        const lineSpacing = 28;
        ctx.beginPath();
        for (let y = 36; y < height; y += lineSpacing) {
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
        ctx.stroke();
      }
    },
    [backgroundType]
  );

  // Redraw All Strokes for Current Page + Active Live Strokes
  const redrawCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = sizeRef.current;
    if (width <= 0 || height <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const pageElements = elements.filter((e) => (e.page || 1) === currentPage);
    pageElements.forEach((el) => {
      renderStrokeElement(ctx, el, width, height);
    });

    // Render remote participant's live in-progress stroke if on same page
    if (externalLiveStroke && (externalLiveStroke.page || 1) === currentPage) {
      renderStrokeElement(ctx, externalLiveStroke, width, height);
    }

    // Render local in-progress stroke
    if (isDrawing.current && currentPoints.current.length > 0) {
      const localPreview: StrokeElement = {
        id: "local-preview",
        tool: currentTool,
        color: selectedColor,
        width: strokeWidth,
        points: currentPoints.current,
        page: currentPage,
        canvasWidth: width,
        canvasHeight: height,
      };
      renderStrokeElement(ctx, localPreview, width, height);
    }

    // Render active laser trail
    const now = Date.now();
    laserTrail.current = laserTrail.current.filter((pt) => now - pt.time < 600);
    if (laserTrail.current.length > 1) {
      ctx.save();
      ctx.strokeStyle = "#EF4444";
      ctx.shadowColor = "#EF4444";
      ctx.shadowBlur = 10;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(laserTrail.current[0].nx * width, laserTrail.current[0].ny * height);
      for (let i = 1; i < laserTrail.current.length; i++) {
        ctx.lineTo(laserTrail.current[i].nx * width, laserTrail.current[i].ny * height);
      }
      ctx.stroke();

      const last = laserTrail.current[laserTrail.current.length - 1];
      ctx.fillStyle = "#FF0000";
      ctx.beginPath();
      ctx.arc(last.nx * width, last.ny * height, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }, [elements, currentPage, externalLiveStroke, currentTool, selectedColor, strokeWidth]);

  // Handle Resize via ResizeObserver (responds to window resize, sidebar toggle, layout switch)
  const syncCanvasDimensions = React.useCallback(() => {
    const viewport = viewportRef.current;
    const canvas = canvasRef.current;
    const bgCanvas = bgCanvasRef.current;
    if (!viewport || !canvas || !bgCanvas) return;

    const rect = viewport.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    const dpr = window.devicePixelRatio || 1;

    sizeRef.current = { width, height };

    if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      bgCanvas.width = Math.floor(width * dpr);
      bgCanvas.height = Math.floor(height * dpr);
    }

    drawBackground(width, height);
    redrawCanvas();
  }, [drawBackground, redrawCanvas]);

  React.useEffect(() => {
    syncCanvasDimensions();
    const viewport = viewportRef.current;
    if (!viewport) return;

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        syncCanvasDimensions();
      });
      observer.observe(viewport);
    }
    window.addEventListener("resize", syncCanvasDimensions);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", syncCanvasDimensions);
    };
  }, [syncCanvasDimensions]);

  React.useEffect(() => {
    drawBackground(sizeRef.current.width, sizeRef.current.height);
    redrawCanvas();
  }, [backgroundType, elements, currentPage, externalLiveStroke, drawBackground, redrawCanvas]);

  // Helper to emit full state snapshot
  const emitFullState = (
    nextStrokes: StrokeElement[],
    nextPage: number = currentPage,
    nextTotalPages: number = totalPages,
    nextBg: BackgroundType = backgroundType
  ) => {
    onSyncState?.({
      strokes: nextStrokes,
      currentPage: nextPage,
      totalPages: nextTotalPages,
      backgroundType: nextBg,
      updatedAt: Date.now(),
    });
  };

  // Get normalized + pixel coordinates from PointerEvent
  const getPointerCoords = (e: React.PointerEvent<HTMLCanvasElement>): StrokePoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, nx: 0, ny: 0 };
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const x = Math.max(0, Math.min(width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(height, e.clientY - rect.top));
    return {
      x,
      y,
      nx: Number((x / width).toFixed(4)),
      ny: Number((y / height).toFixed(4)),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canDraw) return;
    if (e.button !== undefined && e.button !== 0 && e.pointerType === "mouse") return;

    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    activePointerId.current = e.pointerId;

    const pt = getPointerCoords(e);

    if (currentTool === "text") {
      setTextInput({ x: pt.x, y: pt.y, nx: pt.nx || 0, ny: pt.ny || 0, value: "" });
      return;
    }

    if (currentTool === "laser") {
      isDrawing.current = true;
      laserTrail.current = [{ nx: pt.nx || 0, ny: pt.ny || 0, time: Date.now() }];
      onBroadcastLaser?.({ nx: pt.nx || 0, ny: pt.ny || 0 });
      redrawCanvas();
      return;
    }

    isDrawing.current = true;
    liveStrokeIdRef.current = `strk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    currentPoints.current = [pt];
    redrawCanvas();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canDraw) return;
    const pt = getPointerCoords(e);

    if (currentTool === "laser") {
      if (!isDrawing.current && e.pointerType !== "mouse") return;
      laserTrail.current.push({ nx: pt.nx || 0, ny: pt.ny || 0, time: Date.now() });
      if (laserTrail.current.length > 20) laserTrail.current.shift();
      redrawCanvas();

      const now = Date.now();
      if (now - lastLiveBroadcastRef.current > 45) {
        lastLiveBroadcastRef.current = now;
        onBroadcastLaser?.({ nx: pt.nx || 0, ny: pt.ny || 0 });
      }
      return;
    }

    if (!isDrawing.current) return;
    e.preventDefault();

    if (currentTool === "pen" || currentTool === "highlighter" || currentTool === "eraser") {
      currentPoints.current.push(pt);
    } else {
      currentPoints.current = [currentPoints.current[0], pt];
    }

    redrawCanvas();

    // Stream live stroke to peer every 45ms so the other party sees drawing in real time
    const now = Date.now();
    if (now - lastLiveBroadcastRef.current > 45 && onBroadcastLiveStroke) {
      lastLiveBroadcastRef.current = now;
      const { width, height } = sizeRef.current;
      onBroadcastLiveStroke({
        id: liveStrokeIdRef.current,
        tool: currentTool,
        color: selectedColor,
        width: strokeWidth,
        points: currentPoints.current.slice(-120),
        page: currentPage,
        canvasWidth: width,
        canvasHeight: height,
        author: currentUserName,
      });
    }
  };

  const finishStroke = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    if (e && activePointerId.current !== null) {
      try {
        if (e.currentTarget.hasPointerCapture(activePointerId.current)) {
          e.currentTarget.releasePointerCapture(activePointerId.current);
        }
      } catch {}
    }
    activePointerId.current = null;

    if (currentTool === "laser") {
      isDrawing.current = false;
      laserTrail.current = [];
      onBroadcastLaser?.(null);
      redrawCanvas();
      return;
    }

    if (!isDrawing.current) return;
    isDrawing.current = false;

    if (currentPoints.current.length > 0) {
      const { width, height } = sizeRef.current;
      const newStroke: StrokeElement = {
        id: liveStrokeIdRef.current || `strk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        tool: currentTool,
        color: selectedColor,
        width: strokeWidth,
        points: [...currentPoints.current],
        page: currentPage,
        canvasWidth: width,
        canvasHeight: height,
        author: currentUserName,
      };

      const nextElements = [...elements, newStroke];
      setElements(nextElements);
      setRedoStack([]);
      onBroadcastLiveStroke?.(null);
      onBroadcastStroke?.(newStroke);
      emitFullState(nextElements, currentPage, totalPages, backgroundType);
    }
    currentPoints.current = [];
  };

  // Submit Text Input
  const handleTextSubmit = () => {
    if (textInput && textInput.value.trim()) {
      const { width, height } = sizeRef.current;
      const newStroke: StrokeElement = {
        id: `txt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        tool: "text",
        color: selectedColor,
        width: strokeWidth,
        points: [{ x: textInput.x, y: textInput.y, nx: textInput.nx, ny: textInput.ny }],
        text: textInput.value.trim(),
        page: currentPage,
        canvasWidth: width,
        canvasHeight: height,
        author: currentUserName,
      };
      const nextElements = [...elements, newStroke];
      setElements(nextElements);
      setRedoStack([]);
      onBroadcastStroke?.(newStroke);
      emitFullState(nextElements, currentPage, totalPages, backgroundType);
    }
    setTextInput(null);
  };

  // Undo, Redo, Clear, Page & Background handlers (all broadcast to peer!)
  const handleUndo = () => {
    if (!canDraw) return;
    const pageElements = elements.filter((e) => (e.page || 1) === currentPage);
    if (pageElements.length === 0) return;
    const last = pageElements[pageElements.length - 1];
    const nextElements = elements.filter((e) => e.id !== last.id);
    setElements(nextElements);
    setRedoStack((prev) => [...prev, last]);
    emitFullState(nextElements, currentPage, totalPages, backgroundType);
  };

  const handleRedo = () => {
    if (!canDraw || redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    const nextElements = [...elements, next];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setElements(nextElements);
    emitFullState(nextElements, currentPage, totalPages, backgroundType);
  };

  const handleClearBoard = () => {
    if (!canDraw) return;
    const nextElements = elements.filter((e) => (e.page || 1) !== currentPage);
    setElements(nextElements);
    setRedoStack([]);
    emitFullState(nextElements, currentPage, totalPages, backgroundType);
  };

  const handleChangeBackground = (nextBg: BackgroundType) => {
    setBackgroundType(nextBg);
    emitFullState(elements, currentPage, totalPages, nextBg);
  };

  const handleSelectPage = (nextPage: number) => {
    const clamped = Math.max(1, Math.min(totalPages, nextPage));
    setCurrentPage(clamped);
    emitFullState(elements, clamped, totalPages, backgroundType);
  };

  const handleAddPage = () => {
    const nextTotal = totalPages + 1;
    setTotalPages(nextTotal);
    setCurrentPage(nextTotal);
    emitFullState(elements, nextTotal, nextTotal, backgroundType);
  };

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
      link.download = `sabina-whiteboard-page-${currentPage}.png`;
      link.href = merged.toDataURL("image/png");
      link.click();
    }
  };

  return (
    <div
      className={`flex flex-col flex-1 w-full h-full overflow-hidden bg-slate-900 select-none ${className}`}
    >
      {/* ─── TOP WHITEBOARD CONTROL BAR (Never overlaps canvas) ─── */}
      <div className="flex items-center justify-between gap-2 px-2.5 sm:px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-white shrink-0 overflow-x-auto scrollbar-none">
        {/* Left: Pen Permission / Live Activity Status */}
        <div className="flex items-center gap-2 shrink-0">
          {isTutor ? (
            <button
              type="button"
              onClick={onToggleAuthorizeStudent}
              title={
                isAuthorized
                  ? "Student can draw on the board (Click to Lock)"
                  : "Student board is locked (Click to Authorize Student Pen)"
              }
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition ${
                isAuthorized
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700"
              }`}
            >
              {isAuthorized ? (
                <>
                  <Unlock className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Student Pen: ON</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5 text-amber-400" />
                  <span>Allow Student Pen</span>
                </>
              )}
            </button>
          ) : (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                canDraw
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-300 border-amber-500/30"
              }`}
            >
              {canDraw ? (
                <>
                  <Pencil className="h-3 w-3 text-emerald-400" />
                  <span>Pen Active</span>
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3 text-amber-400" />
                  <span>View Mode</span>
                </>
              )}
            </div>
          )}

          {externalLiveStroke && (
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-700/50 px-2 py-0.5 rounded-full animate-pulse">
              <span className="h-2 w-2 rounded-full bg-indigo-400" />
              <span>{externalLiveStroke.author || "Peer"} is drawing...</span>
            </span>
          )}
        </div>

        {/* Right: Background Selector, Actions & Multi-Page Controller */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {canDraw && (
            <>
              <select
                value={backgroundType}
                onChange={(e) => handleChangeBackground(e.target.value as BackgroundType)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="math_grid">📐 Math Grid</option>
                <option value="blank">📄 Blank White</option>
                <option value="dot_grid">⚬ Dot Grid</option>
                <option value="lined">📝 Lined Paper</option>
                <option value="chalkboard">⬛ Chalkboard</option>
              </select>

              <div className="h-4 w-px bg-slate-700" />

              <button
                type="button"
                onClick={handleUndo}
                title="Undo"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={handleRedo}
                title="Redo"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                <Redo2 className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={handleClearBoard}
                title="Clear Current Page"
                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-900/30 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleExportImage}
            title="Save Whiteboard as PNG"
            className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/30 transition"
          >
            <Download className="h-3.5 w-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-700" />

          {/* Multi-Page Switcher */}
          <div className="flex items-center gap-1 bg-slate-950/90 px-2 py-0.5 rounded-xl border border-slate-800">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => handleSelectPage(currentPage - 1)}
              className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            <span className="text-[11px] font-bold text-slate-200 whitespace-nowrap px-1">
              Page {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => handleSelectPage(currentPage + 1)}
              className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            {canDraw && (
              <button
                type="button"
                onClick={handleAddPage}
                title="Add New Whiteboard Page"
                className="p-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold ml-0.5"
              >
                <Plus className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── MIDDLE CANVAS VIEWPORT (100% Unobstructed Drawing Surface) ─── */}
      <div ref={viewportRef} className="relative flex-1 min-h-0 w-full overflow-hidden">
        <canvas ref={bgCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
          onPointerLeave={finishStroke}
          className={`absolute inset-0 w-full h-full touch-none ${
            !canDraw
              ? "cursor-default"
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
            style={{
              left: Math.min(textInput.x, Math.max(16, sizeRef.current.width - 220)),
              top: Math.min(textInput.y, Math.max(16, sizeRef.current.height - 90)),
            }}
            className="absolute z-40 bg-slate-900 p-2.5 rounded-xl shadow-2xl border-2 border-indigo-500 min-w-[200px]"
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
              className="w-full text-xs font-bold text-white bg-transparent outline-none"
            />
            <div className="flex justify-end gap-1.5 mt-1.5">
              <button
                type="button"
                onClick={() => setTextInput(null)}
                className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTextSubmit}
                className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2.5 py-0.5 rounded-lg"
              >
                Place Text
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── BOTTOM DOCKED DRAWING TOOLBAR (Never overlaps canvas) ─── */}
      {canDraw && (
        <div className="flex items-center justify-between gap-2 px-2.5 sm:px-3.5 py-1.5 bg-slate-900 border-t border-slate-800 text-white shrink-0 overflow-x-auto scrollbar-none">
          {/* Drawing Tools */}
          <div className="flex items-center gap-1 shrink-0">
            {[
              { id: "pen", icon: Pencil, title: "Pen (Freehand)" },
              { id: "highlighter", icon: Highlighter, title: "Highlighter" },
              { id: "eraser", icon: Eraser, title: "Eraser" },
              { id: "line", icon: Slash, title: "Straight Line" },
              { id: "arrow", icon: ArrowUpRight, title: "Arrow" },
              { id: "rect", icon: Square, title: "Rectangle" },
              { id: "circle", icon: Circle, title: "Circle / Ellipse" },
              { id: "triangle", icon: Triangle, title: "Triangle" },
              { id: "graph", icon: Compass, title: "Math Coordinate Axes" },
              { id: "text", icon: Type, title: "Text Annotation" },
              { id: "laser", icon: Sparkles, title: "Live Laser Pointer" },
            ].map(({ id, icon: Icon, title }) => {
              const active = currentTool === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCurrentTool(id as WhiteboardTool)}
                  title={title}
                  className={`p-1.5 rounded-xl transition ${
                    active
                      ? id === "laser"
                        ? "bg-rose-600 text-white shadow-sm shadow-rose-600/40"
                        : "bg-indigo-600 text-white shadow-sm shadow-indigo-600/40"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>

          {/* Colors & Stroke Widths */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  style={{ backgroundColor: c }}
                  title={`Color ${c}`}
                  className={`h-4 w-4 rounded-full border transition ${
                    selectedColor === c
                      ? "border-white scale-125 ring-2 ring-indigo-500 shadow-xs"
                      : "border-slate-600 hover:scale-110"
                  }`}
                />
              ))}
            </div>

            <div className="h-4 w-px bg-slate-700" />

            <div className="flex items-center gap-1">
              {STROKE_WIDTHS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setStrokeWidth(w)}
                  title={`Stroke size ${w}px`}
                  className={`px-2 py-1 rounded-lg transition ${
                    strokeWidth === w
                      ? "bg-slate-800 text-white ring-1 ring-indigo-500"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <div style={{ height: Math.min(8, w), width: 14 }} className="bg-current rounded-full mx-auto" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
