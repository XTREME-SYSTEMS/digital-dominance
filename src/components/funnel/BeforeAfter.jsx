import React, { useRef, useState } from "react";
import { Image } from "@/components/ui/image";
import { MoveHorizontal } from "lucide-react";

export default function BeforeAfter({ beforeUrl, afterUrl }) {
  const [pos, setPos] = useState(50);
  const ref = useRef(null);
  const dragging = useRef(false);

  const move = (clientX) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(1, Math.min(99, p)));
  };

  return (
    <div
      ref={ref}
      className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden cursor-ew-resize select-none"
      onMouseDown={(e) => { dragging.current = true; move(e.clientX); }}
      onMouseMove={(e) => dragging.current && move(e.clientX)}
      onMouseUp={() => { dragging.current = false; }}
      onMouseLeave={() => { dragging.current = false; }}
      onTouchStart={(e) => move(e.touches[0].clientX)}
      onTouchMove={(e) => move(e.touches[0].clientX)}
    >
      <Image src={afterUrl} alt="After epoxy flake floor" fittingType="fill" className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <Image src={beforeUrl} alt="Before bare concrete" fittingType="fill" className="absolute inset-0 h-full w-full" style={{ width: `${100 / (pos / 100)}%` }} />
      </div>
      <span className="absolute top-3 left-3 text-[10px] font-bold tracking-widest bg-stone-900/80 text-white px-2 py-1 rounded">BEFORE</span>
      <span className="absolute top-3 right-3 text-[10px] font-bold tracking-widest bg-amber-500 text-stone-950 px-2 py-1 rounded">AFTER</span>
      <div className="absolute top-0 bottom-0 w-1 bg-white shadow-lg" style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-10 w-10 rounded-full bg-white shadow-lg flex items-center justify-center">
          <MoveHorizontal className="h-5 w-5 text-stone-900" />
        </div>
      </div>
    </div>
  );
}