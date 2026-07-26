"use client";
/* eslint-disable @next/next/no-img-element -- 画板导入的是浏览器压缩后的本地 data URL。 */

import { useEffect, useRef, useState } from "react";
import type { ProjectDocument } from "@/lib/projects/project-document";

type CanvasElement = ProjectDocument["sketch"]["elements"][number];

export async function compressImageFile(file: File, maxDimension = 1200, quality = 0.72) {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const value = new Image();
    value.onload = () => resolve(value);
    value.onerror = reject;
    value.src = source;
  });
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

export function IdeaCanvas({
  value,
  keywords,
  onChange,
}: {
  value: ProjectDocument["sketch"];
  keywords: string[];
  onChange: (value: ProjectDocument["sketch"], keywords: string[]) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [color, setColor] = useState("#27364A");
  const [width, setWidth] = useState(4);
  const [elements, setElements] = useState<CanvasElement[]>(value.elements);
  const [future, setFuture] = useState<CanvasElement[]>([]);

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context || !canvasRef.current) return;
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    context.lineCap = "round";
    elements.filter((item) => item.type === "stroke").forEach((stroke) => {
      if (stroke.points.length < 2) return;
      context.beginPath();
      context.strokeStyle = stroke.color;
      context.lineWidth = stroke.width;
      context.globalCompositeOperation = stroke.text === "eraser" ? "destination-out" : "source-over";
      context.moveTo(stroke.points[0].x, stroke.points[0].y);
      stroke.points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
      context.stroke();
    });
    context.globalCompositeOperation = "source-over";
  }, [elements]);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (event.currentTarget.width / rect.width),
      y: (event.clientY - rect.top) * (event.currentTarget.height / rect.height),
    };
  };
  const begin = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    setFuture([]);
    setElements((current) => [...current, {
      id: `stroke-${Date.now()}`,
      type: "stroke",
      x: 0,
      y: 0,
      width,
      height: 0,
      color,
      text: tool === "eraser" ? "eraser" : "",
      points: [point(event)],
    }]);
  };
  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const nextPoint = point(event);
    setElements((current) => current.map((item, index) =>
      index === current.length - 1 ? { ...item, points: [...item.points, nextPoint] } : item));
  };
  const end = () => { drawing.current = false; };

  const addElement = (type: CanvasElement["type"], text: string) => {
    setElements((current) => [...current, {
      id: `${type}-${Date.now()}`,
      type,
      x: 90 + (current.length % 4) * 70,
      y: 80 + (current.length % 3) * 60,
      width: type === "arrow" ? 120 : 150,
      height: 52,
      color,
      text,
      points: [],
    }]);
  };

  const save = () => {
    const compressedImage = canvasRef.current?.toDataURL("image/jpeg", 0.62) ?? null;
    onChange({ compressedImage, elements, updatedAt: new Date().toISOString() }, keywords);
  };

  return (
    <section className="idea-canvas">
      <div className="canvas-tools" aria-label="创意画板工具">
        <button aria-pressed={tool === "pen"} onClick={() => setTool("pen")} type="button">画笔</button>
        <button aria-pressed={tool === "eraser"} onClick={() => setTool("eraser")} type="button">橡皮</button>
        <input aria-label="画笔颜色" onChange={(event) => setColor(event.target.value)} type="color" value={color} />
        <input aria-label="画笔粗细" max="18" min="2" onChange={(event) => setWidth(Number(event.target.value))} type="range" value={width} />
        <button disabled={!elements.length} onClick={() => setElements((current) => { const last = current.at(-1); if (last) setFuture((items) => [...items, last]); return current.slice(0, -1); })} type="button">撤销</button>
        <button disabled={!future.length} onClick={() => setFuture((current) => { const last = current.at(-1); if (last) setElements((items) => [...items, last]); return current.slice(0, -1); })} type="button">重做</button>
        <button onClick={() => { setElements([]); setFuture([]); }} type="button">清空</button>
      </div>
      <div className="idea-canvas-stage">
        <canvas
          aria-label="支持鼠标和触控的创意画板"
          height="520"
          onPointerCancel={end}
          onPointerDown={begin}
          onPointerMove={move}
          onPointerUp={end}
          ref={canvasRef}
          width="900"
        />
        {elements.filter((item) => item.type !== "stroke").map((item) => (
          <button
            className={`canvas-object ${item.type}`}
            key={item.id}
            onPointerMove={(event) => {
              if (event.buttons !== 1) return;
              setElements((current) => current.map((entry) =>
                entry.id === item.id ? { ...entry, x: entry.x + event.movementX, y: entry.y + event.movementY } : entry));
            }}
            style={{ left: item.x, top: item.y, color: item.color }}
            type="button"
          >
            {item.type === "image" && item.text.startsWith("data:image/")
              ? <img alt="导入的参考素材" draggable="false" src={item.text} />
              : item.type === "arrow" ? `→ ${item.text}` : item.text}
          </button>
        ))}
      </div>
      <div className="canvas-additions">
        {["谁", "问题", "功能", "感觉"].map((word) => (
          <button key={word} onClick={() => addElement("sticker", word)} type="button">+ {word}</button>
        ))}
        <button onClick={() => addElement("note", window.prompt("便签写什么？") || "我的想法")} type="button">+ 文字便签</button>
        <button onClick={() => addElement("arrow", "操作过程")} type="button">+ 箭头</button>
        <button onClick={() => addElement("shape", "□ 页面区域")} type="button">+ 基础图形</button>
        <label className="upload-chip">
          导入参考图
          <input
            accept="image/*"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const image = await compressImageFile(file);
              addElement("image", image);
            }}
            type="file"
          />
        </label>
      </div>
      <label>
        关键词（用逗号分开）
        <input onChange={(event) => onChange(value, event.target.value.split(/[，,]/).map((item) => item.trim()).filter(Boolean))} value={keywords.join("，")} />
      </label>
      <p className="privacy-note">不要上传真实姓名、清晰人脸或私人信息。图片会在浏览器中缩放压缩后再保存。</p>
      <button className="button button-primary" onClick={save} type="button">保存画板与关键词</button>
    </section>
  );
}
