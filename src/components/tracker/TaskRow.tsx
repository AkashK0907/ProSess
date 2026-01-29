import { TrackedTask, TaskCompletion } from "@/lib/taskStorage";
import { Check } from "lucide-react";
import { formatDate } from "@/lib/sessionStorage";

interface TaskRowProps {
  task: TrackedTask;
  dates: Date[];
  currentDate: Date;
  completions: TaskCompletion;
  onToggle: (taskId: string, date: Date) => void;
  totalCompletions?: number;
}

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const isBeforeDay = (date1: Date, date2: Date): boolean => {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return d1 < d2;
};

export function TaskRow({
  task,
  dates,
  currentDate,
  completions,
  onToggle,
  totalCompletions = 0,
}: TaskRowProps) {
  return (
    <div className="grid grid-cols-[1fr_repeat(7,60px)_80px] gap-2 py-3 border-b border-border last:border-0 items-center hover:bg-muted/20 transition-colors">
      {/* Task name */}
      <div className="flex items-center gap-2 px-2">
        <span className="font-medium truncate">{task.name}</span>
      </div>

      {/* Checkboxes for days */}
      {dates.map((date, index) => {
        const dateKey = formatDate(date);
        const isCompleted = completions[dateKey]?.[task.id] || false;
        const isToday = isSameDay(date, currentDate);
        const taskCreated = new Date(task.createdAt);
        taskCreated.setHours(0, 0, 0, 0);
        
        const currentLoopDate = new Date(date);
        currentLoopDate.setHours(0, 0, 0, 0);
        
        const isBeforeCreation = currentLoopDate < taskCreated;
        const isEditable = isToday && !isBeforeCreation;

        return (
          <div
            key={index}
            className={`flex justify-center ${
              isToday ? "bg-primary/5 rounded-md py-1" : ""
            }`}
          >
            <button
              onClick={() => isEditable && onToggle(task.id, date)}
              disabled={!isEditable || isBeforeCreation}
              className={`w-6 h-6 rounded flex items-center justify-center transition-all relative ${
                isBeforeCreation 
                  ? "bg-muted/30 text-muted-foreground/20 cursor-not-allowed" 
                  : isCompleted
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary"
              } ${
                isEditable
                  ? "cursor-pointer hover:scale-110 hover:shadow-md"
                  : isBeforeCreation
                    ? ""
                    : "cursor-default opacity-60"
              }`}
              aria-label={`${task.name} on ${date.toLocaleDateString()}`}
            >
              {isCompleted ? <Check className="w-3.5 h-3.5" /> : null}
              {isBeforeCreation && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-[1px] bg-muted-foreground/30 rotate-[-45deg]" />
                </div>
              )}
            </button>
          </div>
        );
      })}

      {/* Total Completions */}
      <div className="flex justify-center items-center px-2">
        <div className="bg-secondary/50 px-2 py-1 rounded text-xs font-medium text-muted-foreground">
          {totalCompletions}
        </div>
      </div>
    </div>
  );
}
