import { Flame } from "lucide-react";

interface StreakCounterProps {
  streak: number;
}

export const StreakCounter = ({ streak }: StreakCounterProps) => {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/50 dark:bg-black/20 backdrop-blur-md border border-orange-500/20 shadow-sm hover:shadow-md transition-all duration-300 group cursor-default">
      <div className={`relative flex items-center justify-center ${streak > 0 ? "text-orange-500" : "text-muted-foreground"}`}>
        <Flame 
          className={`w-5 h-5 ${streak > 0 ? "fill-orange-500 animate-pulse-slow group-hover:scale-110 transition-transform" : ""}`} 
          strokeWidth={2.5}
        />
        {streak > 2 && (
          <div className="absolute inset-0 bg-orange-400/40 blur-md rounded-full animate-pulse-glow" />
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-bold tabular-nums leading-none text-foreground tracking-tight">
          {streak}
        </span>
        <span className="text-[11px] font-bold tracking-widest text-muted-foreground/80 uppercase">
          Day Streak
        </span>
      </div>
    </div>
  );
};
