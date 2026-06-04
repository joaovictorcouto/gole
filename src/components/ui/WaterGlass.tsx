import { useEffect, useRef, useState } from "react";

interface WaterGlassProps {
  percent: number;
  className?: string;
}

const DROP_PATH = "M100 12 C 60 70, 22 138, 22 200 A 78 78 0 0 0 178 200 C 178 138, 140 70, 100 12 Z";

const DROP_TOP = 12;
const DROP_BOTTOM = 278;
const DROP_H = DROP_BOTTOM - DROP_TOP;

// Wave shapes rendered BEHIND the water rect. Only the peaks above
// y=0 are visible (the rect covers everything from y=0 down). No
// separate visible band on top of the water — just bumpy crests.
const WAVE_BACK_IDLE  = "M-100 0 C -50 -3, 0 3, 50 0 C 100 -3, 150 3, 200 0 C 250 -3, 300 3, 350 0 L 350 100 L -100 100 Z M350 0 C 400 -3, 450 3, 500 0 C 550 -3, 600 3, 650 0 C 700 -3, 750 3, 800 0 L 800 100 L 350 100 Z";
const WAVE_BACK_ACT   = "M-100 0 C -50 -9, 0 9, 50 0 C 100 -9, 150 9, 200 0 C 250 -9, 300 9, 350 0 L 350 100 L -100 100 Z M350 0 C 400 -9, 450 9, 500 0 C 550 -9, 600 9, 650 0 C 700 -9, 750 9, 800 0 L 800 100 L 350 100 Z";

const WAVE_FRONT_IDLE = "M-100 0 C -40 -4, 10 4, 70 0 C 130 -4, 180 4, 240 0 L 320 0 L 320 100 L -100 100 Z M320 0 C 380 -4, 430 4, 490 0 C 550 -4, 600 4, 660 0 L 740 0 L 740 100 L 320 100 Z";
const WAVE_FRONT_ACT  = "M-100 0 C -40 -11, 10 11, 70 0 C 130 -11, 180 11, 240 0 L 320 0 L 320 100 L -100 100 Z M320 0 C 380 -11, 430 11, 490 0 C 550 -11, 600 11, 660 0 L 740 0 L 740 100 L 320 100 Z";

export function WaterGlass({ percent, className = "" }: WaterGlassProps) {
  const fillHeight = Math.min(Math.max(percent, 0), 100);
  const [active, setActive] = useState(false);
  const prevPctRef = useRef(fillHeight);
  const activeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (Math.abs(prevPctRef.current - fillHeight) > 0.5) {
      setActive(true);
      if (activeTimerRef.current) clearTimeout(activeTimerRef.current);
      activeTimerRef.current = setTimeout(() => setActive(false), 2800);
      prevPctRef.current = fillHeight;
    }
    return () => { if (activeTimerRef.current) clearTimeout(activeTimerRef.current); };
  }, [fillHeight]);

  const surfaceY = DROP_BOTTOM - (fillHeight / 100) * DROP_H;

  return (
    <div className={`relative flex justify-center items-center ${className}`}>
      <style>{`
        @keyframes waveDriftSlow    { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes waveDriftSlowRev { 0%{transform:translateX(-50%)} 100%{transform:translateX(0)} }
        @keyframes waveDriftFast    { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes waveDriftFastRev { 0%{transform:translateX(-50%)} 100%{transform:translateX(0)} }
        .wave-back-slow  { animation: waveDriftSlowRev 24s linear infinite; }
        .wave-front-slow { animation: waveDriftSlow   18s linear infinite; }
        .wave-back-fast  { animation: waveDriftFastRev 10s linear infinite; }
        .wave-front-fast { animation: waveDriftFast    7s linear infinite; }
        .water-group     { transition: transform 1400ms cubic-bezier(0.22, 1, 0.36, 1); }
        .wave-fade       { transition: opacity 1800ms cubic-bezier(0.22, 1, 0.36, 1); }
      `}</style>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-[80px] opacity-40"
        style={{ backgroundColor: "#bfe8ff" }} />

      <div
        className="relative"
        style={{ width: 240, height: 360, filter: "drop-shadow(0 18px 36px rgba(15,76,110,0.18))" }}
      >
        <svg width="240" height="360" viewBox="0 0 200 300" fill="none">
          <defs>
            <clipPath id="drop-clip-main">
              <path d={DROP_PATH} />
            </clipPath>
            <linearGradient id="drop-water-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#8AD4FF" />
              <stop offset="50%"  stopColor="#41AFFF" />
              <stop offset="100%" stopColor="#0f76a0" />
            </linearGradient>
            <linearGradient id="drop-glass-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="rgba(255,255,255,0.85)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.55)" />
            </linearGradient>
          </defs>

          <path d={DROP_PATH} fill="url(#drop-glass-grad)" />

          <g clipPath="url(#drop-clip-main)">
            <g
              className="water-group"
              style={{ transform: `translateY(${surfaceY}px)` }}
            >
              {/* Waves BEHIND the water rect. Only peaks above y=0 show. */}
              {/* Far wave (lighter tone, slow) — idle layer always on */}
              <g className="wave-back-slow">
                <path d={WAVE_BACK_IDLE} fill="#BFE8FF" opacity="0.55" />
              </g>
              <g className="wave-back-fast wave-fade" style={{ opacity: active ? 0.7 : 0 }}>
                <path d={WAVE_BACK_ACT} fill="#BFE8FF" />
              </g>

              {/* Near wave (slightly darker tone, sits between back and front) */}
              <g className="wave-front-slow">
                <path d={WAVE_FRONT_IDLE} fill="#7DC8F0" opacity="0.6" />
              </g>
              <g className="wave-front-fast wave-fade" style={{ opacity: active ? 0.8 : 0 }}>
                <path d={WAVE_FRONT_ACT} fill="#7DC8F0" />
              </g>

              {/* Water body — uniform gradient, covers everything from y=0 down */}
              <rect x="-100" y="0" width="400" height="600" fill="url(#drop-water-grad)" opacity="0.92" />
            </g>
          </g>

          <path d={DROP_PATH} fill="none" stroke="#ffffff" strokeWidth="5" strokeLinejoin="round" />
          <path d="M70 70 C 56 102, 50 132, 54 162" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="5" strokeLinecap="round" />
        </svg>
      </div>

      <div className="absolute top-10 right-2 backdrop-blur-[20px] px-4 py-2 rounded-lg shadow-sm border"
        style={{
          backgroundColor: "rgba(255,255,255,0.7)",
          borderColor: "rgba(255,255,255,0.4)"
        }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#257ca3" }}>Nível Atual</p>
        <p className="text-xl font-medium" style={{ color: "#191c1e" }}>{Math.round(fillHeight)}%</p>
      </div>
    </div>
  );
}
