interface WaterGlassProps {
  percent: number;
  className?: string;
}

export function WaterGlass({ percent, className = "" }: WaterGlassProps) {
  const fillHeight = Math.min(percent, 100);

  return (
    <div className={`relative flex justify-center items-center ${className}`}>
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[80px] opacity-40"
        style={{ backgroundColor: "#bfe8ff" }} />

      {/* Glass container */}
      <div className="relative w-[180px] h-[400px] rounded-full border-[4px] border-white overflow-hidden"
        style={{
          backgroundColor: "#ffffff",
          boxShadow: "inset 0 4px 20px rgba(0,0,0,0.05), 0 12px 40px rgba(0,0,0,0.08)"
        }}>

        {/* Measurement marks */}
        <div className="absolute inset-y-0 right-4 w-4 py-8 flex flex-col justify-between items-end opacity-30 z-10 pointer-events-none">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`${i % 2 === 0 ? "w-3" : "w-2"} h-[2px]`} style={{ backgroundColor: "#c1c7cc" }} />
          ))}
        </div>

        {/* Water fill */}
        <div
          className="absolute bottom-0 left-0 w-full rounded-b-full animate-water-fill"
          style={{
            height: `${fillHeight}%`,
            background: "linear-gradient(to top, #0f76a0, #bfe8ff)",
            opacity: 0.9,
            ["--fill-height" as string]: `${fillHeight}%`,
          }}>
          {/* Surface highlight */}
          <div className="absolute top-0 left-0 w-full h-[6px] rounded-full blur-[1px]"
            style={{ backgroundColor: "rgba(255,255,255,0.3)" }} />
        </div>

        {/* Reflection */}
        <div className="absolute inset-y-4 left-4 w-[12px] rounded-full pointer-events-none"
          style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)" }} />
      </div>

      {/* Floating label */}
      <div className="absolute top-12 right-12 backdrop-blur-[20px] px-4 py-2 rounded-lg shadow-sm border"
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
