import { Habit } from "@/types/habitTypes";
import { isSameDay, isBeforeDay } from "@/types/habitTypes";
import { Check } from "lucide-react";

interface HabitRowProps {
  habit: Habit;
  dates: Date[];
  currentDate: Date;
  completions: { [habitId: string]: boolean }[];
  onToggle: (habitId: string, date: Date) => void;
}

export function HabitRow({
  habit,
  dates,
  currentDate,
  completions,
  onToggle,
}: HabitRowProps) {
  return (
    <div className="grid grid-cols-[200px_60px_repeat(7,1fr)] gap-2 py-3 border-b border-border last:border-0 items-center hover:bg-muted/20 transition-colors">
      {/* Habit name */}
      <div className="flex items-center gap-2 px-2">
        <span className="font-medium truncate flex items-center gap-2">
          {habit.emoji && <span className="text-lg">{habit.emoji}</span>}
          {habit.name}
        </span>
      </div>

      {/* Goal */}
      <div className="text-center text-sm text-muted-foreground">
        {habit.goal}
      </div>

      {/* Checkboxes for 7 days */}
      {dates.map((date, index) => {
        const isCompleted = completions[index]?.[habit.id] || false;
        const isToday = isSameDay(date, currentDate);
        const isPast = isBeforeDay(date, currentDate);
        const isEditable = isToday;

        return (
          <div
            key={index}
            className={`flex justify-center ${
              isToday ? "bg-primary/5 rounded-md" : ""
            }`}
          >
            <button
              onClick={() => isEditable && onToggle(habit.id, date)}
              disabled={!isEditable}
              className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
                isCompleted
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary"
              } ${
                isEditable
                  ? "cursor-pointer hover:scale-110 hover:shadow-md"
                  : "cursor-default opacity-60"
              }`}
              aria-label={`${habit.name} on ${date.toLocaleDateString()}`}
            >
              {isCompleted && <Check className="w-4 h-4" />}
            </button>
          </div>
        );
      })}
    </div>
  );
}
