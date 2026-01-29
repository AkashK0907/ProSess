import { StudySession } from "@/lib/sessionStorage";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek, isSameDay } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FocusHeatmapProps {
  sessions: StudySession[];
  currentDate?: Date;
}

export const FocusHeatmap = ({ sessions, currentDate: propDate }: FocusHeatmapProps) => {
  const currentDate = propDate || new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const getIntensity = (minutes: number) => {
    if (minutes === 0) return "bg-secondary/50"; // Empty
    if (minutes < 20) return "bg-orange-200/50 dark:bg-orange-900/40"; // Light
    if (minutes < 40) return "bg-orange-300 dark:bg-orange-700/60"; // Medium-Light
    if (minutes <= 60) return "bg-orange-400 dark:bg-orange-600/80"; // Medium
    return "bg-orange-600 dark:bg-orange-500"; // Dark (Max)
  };

  const getTooltipText = (minutes: number) => {
    if (minutes === 0) return "No focus time";
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs > 0 ? `${hrs}h ` : ""}${mins}m focus`;
  };

  return (
    <div className="w-full">
      {/* Month Header */}
      <div className="mb-6 flex items-center justify-between px-2">
        <h3 className="font-medium text-muted-foreground">
          {format(currentDate, "MMMM yyyy")}
        </h3>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-secondary/50" />
            <div className="w-2.5 h-2.5 rounded-sm bg-orange-200/50 dark:bg-orange-900/40" />
            <div className="w-2.5 h-2.5 rounded-sm bg-orange-300 dark:bg-orange-700/60" />
            <div className="w-2.5 h-2.5 rounded-sm bg-orange-400 dark:bg-orange-600/80" />
            <div className="w-2.5 h-2.5 rounded-sm bg-orange-600 dark:bg-orange-500" />
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-[300px] mx-auto">
        <div className="grid grid-cols-7 gap-1">
          {/* Day Headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-[9px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-1">
              {day.slice(0, 1)}
            </div>
          ))}

          {days.map((day, idx) => {
            // Calculate stats for this day
            const dayStr = format(day, "yyyy-MM-dd");
            const dayMinutes = sessions
              .filter((s) => s.date === dayStr)
              .reduce((sum, s) => sum + s.minutes, 0);

            const isCurrentMonth = isSameMonth(day, monthStart);
            const isCurrentDay = isToday(day);

            return (
              <TooltipProvider key={idx}>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <div
                      className={`
                        aspect-square rounded-sm transition-all duration-200
                        ${isCurrentMonth ? getIntensity(dayMinutes) : "bg-transparent opacity-0 pointer-events-none"}
                        ${isCurrentDay ? "ring-1 ring-primary ring-offset-1 ring-offset-card z-10" : "hover:ring-1 hover:ring-border hover:z-10"}
                        ${isCurrentMonth ? "cursor-default" : ""}
                      `}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p className="font-semibold">{format(day, "EEE, MMM d")}</p>
                    <p className="text-muted-foreground">
                      {getTooltipText(dayMinutes)}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>
    </div>
  );
};
