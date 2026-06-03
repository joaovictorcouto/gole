interface CircularProgressProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function CircularProgress({ percent, size = 64, strokeWidth = 2.5, className = "" }: CircularProgressProps) {
  const dashArray = (percent / 100) * 100;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        <path
          fill="none"
          stroke="#e6e8eb"
          strokeWidth={strokeWidth}
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <path
          fill="none"
          stroke="#3b6377"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="animate-progress"
          style={{ strokeDasharray: `${dashArray}, 100` }}
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold" style={{ color: "#3b6377" }}>
          {Math.round(percent)}%
        </span>
      </div>
    </div>
  );
}
