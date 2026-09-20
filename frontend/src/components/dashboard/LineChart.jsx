import { useEffect, useMemo, useRef, useState } from "react";
import { toCurrency } from "../../utils/formatters";

function buildPoints(data, width, height, paddingX, paddingY) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingY * 2;

  return data.map((item, index) => {
    const x = data.length === 1 ? width / 2 : paddingX + (index / (data.length - 1)) * usableWidth;
    const y = height - paddingY - (item.value / maxValue) * usableHeight;
    return { ...item, x, y };
  });
}

export default function LineChart({ data }) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isMobile, setIsMobile] = useState(false);
  const svgRef = useRef(null);
  const width = 960;
  const height = 240;
  const paddingX = 4;
  const paddingY = 18;

  const points = useMemo(() => buildPoints(data, width, height, paddingX, paddingY), [data]);
  const linePath = points.map((point) => `${point.x},${point.y}`).join(" ");

  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth < 640);
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function getClientX(event) {
    if ("clientX" in event) return event.clientX;
    return 0;
  }

  function getNearestPointIndex(event) {
    if (!svgRef.current || points.length === 0) return -1;
    const rect = svgRef.current.getBoundingClientRect();
    const ratio = (getClientX(event) - rect.left) / rect.width;
    const x = Math.max(0, Math.min(width, ratio * width));

    let nearestIndex = 0;
    let minDistance = Math.abs(points[0].x - x);
    for (let i = 1; i < points.length; i += 1) {
      const distance = Math.abs(points[i].x - x);
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    }
    return nearestIndex;
  }

  function handlePointerDown(event) {
    setActiveIndex(getNearestPointIndex(event));
  }

  function handlePointerMove(event) {
    setActiveIndex(getNearestPointIndex(event));
  }

  return (
    <div className="space-y-4">
      {data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-green/20 bg-brand-bg/40 px-4 py-8 text-center text-sm font-bold text-brand-muted">
          Belum ada data tren pemasukan.
        </div>
      ) : (
        <div className="relative">
          {activeIndex >= 0 && points[activeIndex] && (
            <div className="absolute left-0 top-0 z-10 rounded-xl border border-brand-green/15 bg-white/95 px-3 py-2 text-xs shadow-lg">
              <p className="font-black text-brand-green-dark">{points[activeIndex].label}</p>
              <p className="font-bold text-brand-muted">{toCurrency(points[activeIndex].value)}</p>
            </div>
          )}

          <div className="w-full">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-36 sm:h-48 xl:h-40 2xl:h-48 touch-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerLeave={() => {
                setActiveIndex(-1);
              }}
            >
              {[0, 1, 2, 3, 4].map((line) => {
                const y = paddingY + (line / 4) * (height - paddingY * 2);
                return <line key={line} x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#EAF3E2" strokeWidth="1" />;
              })}

              <polyline fill="none" stroke="#2B9348" strokeWidth="3" points={linePath} strokeLinejoin="round" strokeLinecap="round" />

              {activeIndex >= 0 && points[activeIndex] && (
                <line
                  x1={points[activeIndex].x}
                  y1={paddingY}
                  x2={points[activeIndex].x}
                  y2={height - paddingY}
                  stroke="#1B3A1E"
                  strokeDasharray="4 4"
                  strokeWidth="1.5"
                  opacity="0.45"
                />
              )}

              {points.map((point, index) => (
                <g key={point.key}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={activeIndex === index ? 5 : 4}
                    fill="#2B9348"
                    className="cursor-pointer transition-all"
                    onPointerEnter={() => setActiveIndex(index)}
                  />
                </g>
              ))}

              {points.map((point, index) => {
                const step = isMobile ? Math.max(1, Math.ceil(points.length / 8)) : 1;
                const showLabel = index % step === 0 || index === points.length - 1;
                if (!showLabel) return null;
                return (
                  <text key={`x-${point.key}`} x={point.x} y={height - 5} textAnchor="middle" className="fill-brand-muted text-[9px] font-bold">
                    {point.shortLabel}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
