"use client";
import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxVH?: number;
};

export default function BottomSheet({ open, onClose, title, children, maxVH = 100 }: Props) {
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const startY = useRef<number | null>(null);
  const currentY = useRef(0);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => setEntered(true));
      document.documentElement.style.overflow = "hidden";
    } else {
      setEntered(false);
      const t = setTimeout(() => setMounted(false), 280);
      document.documentElement.style.overflow = "";
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!mounted) return null;

  const onPointerDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startY.current == null) return;
    const dy = Math.max(0, e.clientY - startY.current);
    currentY.current = dy;
    if (panelRef.current) panelRef.current.style.transform = `translateY(${dy}px)`;
  };
  const onPointerUp = () => {
    if (startY.current == null) return;
    const dy = currentY.current;
    startY.current = null;
    currentY.current = 0;
    if (dy > 80) { onClose(); return; }
    if (panelRef.current) panelRef.current.style.transform = "";
  };

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${entered ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className={`absolute left-0 right-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${entered ? "translate-y-0" : "translate-y-full"}`}
        style={{ bottom: 0 }}
      >
        <div
          className="mx-auto max-w-screen-md bg-white rounded-t-2xl shadow-xl"
          style={{ maxHeight: `${maxVH}vh` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="flex justify-center pt-2">
            <div className="h-1.5 w-12 rounded-full bg-gray-300" />
          </div>
          <div className="flex items-center justify-between px-4 pt-2 pb-3">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button onClick={onClose} className="rounded-md px-2 py-1 text-sm text-gray-500 hover:text-gray-800">
              Schließen
            </button>
          </div>
          <div className="px-4 pb-6 overflow-y-auto" style={{ maxHeight: `calc(${maxVH}vh - 54px)` }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
