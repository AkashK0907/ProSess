interface DateHeaderProps {
  dates: Date[];
  currentDate: Date;
}

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export function DateHeader({ dates, currentDate }: DateHeaderProps) {
  return (
    <div className="grid grid-cols-[1fr_repeat(7,60px)_80px] gap-2 mb-4 pb-3 border-b border-border">
      {/* Column header */}
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2">
        Tasks
      </div>

      {/* Day columns */}
      {dates.map((date, index) => {
        const isToday = isSameDay(date, currentDate);
        return (
          <div
            key={index}
            className={`text-center ${
              isToday ? "bg-primary/5 rounded-md px-1 py-2" : "py-2"
            }`}
          >
            <div className={`text-xs font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
              {weekDays[date.getDay()]}
            </div>
            <div
              className={`text-sm font-semibold mt-1 ${
                isToday ? "text-primary" : "text-foreground"
              }`}
            >
              {date.getDate()}
            </div>
          </div>
        );
      })}

      {/* Total Header */}
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center self-end pb-2">
        Total
      </div>
    </div>
  );
}
