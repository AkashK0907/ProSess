import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoadingScreen } from "@/components/ui/spinner";
import { FocusHeatmap } from "@/components/stats/FocusHeatmap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Calendar, Clock, Trophy, Target, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/sessionStorage";
import { useSessions, useSubjects, useTasks, useTaskCompletions, useUser } from "@/hooks/useData";

type TimeRange = "daily" | "weekly" | "monthly";

const subjectColors = ["#B85C38", "#6B7280", "#059669", "#7C3AED", "#DC2626", "#F59E0B", "#14B8A6"];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function Stats() {
  const [timeRange, setTimeRange] = useState<TimeRange>("weekly");
  const [monthOffset, setMonthOffset] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);

  const { data: user } = useUser();
  const { data: sessions = [], isLoading: loadingSessions } = useSessions();
  const { data: subjects = [], isLoading: loadingSubjects } = useSubjects();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();
  const { data: completionData = {}, isLoading: loadingCompletions } = useTaskCompletions();

  const loading = loadingSessions || loadingSubjects || loadingTasks || loadingCompletions;

  // Calculate navigation limits based on account creation
  const limits = useMemo(() => {
    if (!user?.createdAt) return { minMonth: -12, minWeek: -12 }; // Default fallback

    const created = new Date(user.createdAt);
    const now = new Date();
    
    // Monthly limit
    // difference in months: (Year2 - Year1) * 12 + (Month2 - Month1)
    // We want negative offset, so (Created - Now)
    const monthDiff = (created.getFullYear() - now.getFullYear()) * 12 + (created.getMonth() - now.getMonth());
    
    // Weekly limit
    // difference in weeks
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    // Align dates to start of day for accurate comparison
    const c = new Date(created); c.setHours(0,0,0,0);
    const n = new Date(now); n.setHours(0,0,0,0);
    // Align to start of week (Sunday) to ensure strict week boundaries if needed, 
    // but simple diff is usually enough for "number of weeks back"
    const weekDiff = Math.floor((c.getTime() - n.getTime()) / oneWeek);

    return { 
      minMonth: monthDiff, 
      minWeek: weekDiff 
    };
  }, [user]);

  // Calculate current date for heatmap
  const heatmapDate = useMemo(() => {
    const d = new Date();
    d.setDate(1); // Set to 1st to avoid overflow
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  // Get data based on time range for bar chart
  const getBarData = () => {
    const now = new Date();
    
    if (timeRange === "daily") {
      // Show all current subjects with their today's minutes
      const today = formatDate(now);
      const todaySessions = sessions.filter(s => s.date === today);
      const subjectTotals: { [key: string]: number } = {};
      
      // Initialize all current subjects with 0
      subjects.forEach(subject => {
        subjectTotals[subject.name] = 0;
      });
      
      // Add session minutes (will show as "Deleted" if subject no longer exists)
      todaySessions.forEach(s => {
        if (subjects.find(sub => sub.name === s.subject)) {
          subjectTotals[s.subject] = (subjectTotals[s.subject] || 0) + s.minutes;
        } else {
          // Subject was deleted
          subjectTotals["(Deleted)"] = (subjectTotals["(Deleted)"] || 0) + s.minutes;
        }
      });
      
      return Object.entries(subjectTotals).map(([name, minutes]) => ({
        name: name.length > 10 ? name.substring(0, 10) : name,
        minutes,
      }));
    } else if (timeRange === "weekly") {
      // Last 7 days with offset
      const weekData = [];
      const endOfPeriod = new Date(now);
      endOfPeriod.setDate(now.getDate() + (weekOffset * 7));
      
      // Calculate start date relative to the "current" day in the offset week
      // If offset is 0, endOfPeriod is today.
      // We want the last 7 days ending on endOfPeriod.
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(endOfPeriod);
        date.setDate(endOfPeriod.getDate() - i);
        const dateStr = formatDate(date);
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
        
        const dayMinutes = sessions
          .filter(s => s.date === dateStr)
          .reduce((sum, s) => sum + s.minutes, 0);
        
        weekData.push({ day: dayName, minutes: dayMinutes });
      }
      return weekData;
    } else {
      // Last 4 weeks
      const monthData = [];
      for (let week = 3; week >= 0; week--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (week * 7 + 6));
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() - (week * 7));
        
        const weekMinutes = sessions
          .filter(s => {
            const sessionDate = new Date(s.date);
            return sessionDate >= weekStart && sessionDate <= weekEnd;
          })
          .reduce((sum, s) => sum + s.minutes, 0);
        
        monthData.push({ week: `Week ${4 - week}`, minutes: weekMinutes });
      }
      return monthData;
    }
  };

  // Get subject breakdown for pie chart
  const getSubjectData = () => {
    const subjectTotals: { [key: string]: number } = {};
    
    sessions.forEach(s => {
      // Check if subject still exists
      if (subjects.find(sub => sub.name === s.subject)) {
        subjectTotals[s.subject] = (subjectTotals[s.subject] || 0) + s.minutes;
      } else {
        // Subject was deleted
        subjectTotals["(Deleted)"] = (subjectTotals["(Deleted)"] || 0) + s.minutes;
      }
    });
    
    return Object.entries(subjectTotals)
      .map(([name, value]) => {
        // Find the original index of this subject in the subjects array
        const subjectIndex = subjects.findIndex(s => s.name === name);
        const color = name === "(Deleted)" 
          ? "#9CA3AF" 
          : subjectColors[subjectIndex % subjectColors.length];
        
        return {
          name,
          value,
          color,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 subjects
  };

  // Calculate task stats
  const getTaskStats = () => {
    const getCurrentWeekDates = (): Date[] => {
      const today = new Date();
      const currentDay = today.getDay();
      const sunday = new Date(today);
      sunday.setDate(today.getDate() - currentDay);
      sunday.setHours(0, 0, 0, 0);
      
      const dates: Date[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(sunday);
        date.setDate(sunday.getDate() + i);
        dates.push(date);
      }
      return dates;
    };

    const dates = getCurrentWeekDates();
    let totalDailyPercentage = 0;
    let totalCompleted = 0;
    let totalPossible = 0;
    
    dates.forEach(date => {
      const dateKey = formatDate(date);
      const dayData = completionData[dateKey] || {};
      
      // Count tasks that existed on this day
      const tasksOnThisDay = tasks.filter(task => {
        const createdStr = (task as any).createdAt;
        const taskCreated = createdStr ? new Date(createdStr) : new Date(0);
        taskCreated.setHours(0, 0, 0, 0);
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d >= taskCreated;
      });

      if (tasksOnThisDay.length > 0) {
        const completedOnDay = tasksOnThisDay.filter(t => dayData[t.id]).length;
        totalCompleted += completedOnDay;
        totalPossible += tasksOnThisDay.length;
        const dayPercentage = (completedOnDay / tasksOnThisDay.length) * 100;
        totalDailyPercentage += dayPercentage;
      }
    });

    // Average daily completion rate
    const taskPercentage = Math.round(totalDailyPercentage / 7);
    
    return {
      totalCompleted,
      totalRemaining: totalPossible - totalCompleted,
      taskPercentage,
      totalPossible,
    };
  };

  const barDataKey = timeRange === "monthly" ? "week" : timeRange === "weekly" ? "day" : "name";
  const barData = useMemo(() => getBarData(), [timeRange, sessions, subjects, weekOffset, monthOffset]); // Added deps
  const subjectData = useMemo(() => getSubjectData(), [sessions, subjects]);
  const taskStats = useMemo(() => getTaskStats(), [tasks, completionData]);

  const taskCompletionData = [
    { name: "Completed", value: taskStats.taskPercentage, color: "#B85C38" },
    { name: "Remaining", value: 100 - taskStats.taskPercentage, color: "#E5E7EB" },
  ];  

  const navigateMonth = (direction: 'prev' | 'next') => {
    setMonthOffset(prev => {
      if (direction === 'prev') {
        return Math.max(prev - 1, limits.minMonth);
      } else {
        return Math.min(prev + 1, 0); // Max 0 (current month)
      }
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setWeekOffset(prev => {
      if (direction === 'prev') {
        return Math.max(prev - 1, limits.minWeek);
      } else {
        return Math.min(prev + 1, 0); // Max 0 (current week)
      }
    });
  };

  const getWeeklyRangeDisplay = () => {
    const now = new Date();
    const end = new Date(now);
    end.setDate(now.getDate() + (weekOffset * 7));
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    
    if (start.getMonth() === end.getMonth()) {
       return `${months[start.getMonth()]} ${start.getDate()}-${end.getDate()}`;
    }
    return `${months[start.getMonth()]} ${start.getDate()} - ${months[end.getMonth()]} ${end.getDate()}`;
  };

  if (loading) {
    return (
      <AppLayout>
        <LoadingScreen message="Loading statistics..." />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-12">
        {/* Session Stats */}
        <section className="animate-fade-up">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="section-title mb-0">Session Stats</h2>
            <div className="flex gap-2">
              {(["daily", "weekly", "monthly"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`toggle-pill capitalize min-h-[44px] ${
                    timeRange === range ? "toggle-pill-active" : "toggle-pill-inactive"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bar Chart or Heatmap */}
            <div className="md:col-span-2 surface-card p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  {timeRange === "daily" && "Time by Subject (Today)"}
                  {timeRange === "weekly" && (
                    <>
                      Time by Day 
                      <span className="text-xs font-normal">({getWeeklyRangeDisplay()})</span>
                    </>
                  )}
                  {timeRange === "monthly" && "Focus Heatmap"}
                </h3>
                
                {timeRange === "monthly" && (
                   <div className="flex items-center bg-secondary/50 rounded-lg p-1">
                    <button 
                      onClick={() => navigateMonth('prev')}
                      disabled={monthOffset <= limits.minMonth}
                      className="p-2 md:p-1 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 hover:bg-background rounded-md transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5 md:w-4 md:h-4" />
                    </button>
                    <button 
                      onClick={() => navigateMonth('next')}
                      disabled={monthOffset >= 0}
                      className="p-2 md:p-1 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 hover:bg-background rounded-md transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5 md:w-4 md:h-4" />
                    </button>
                   </div>
                )}
                
                {timeRange === "weekly" && (
                   <div className="flex items-center bg-secondary/50 rounded-lg p-1">
                    <button 
                      onClick={() => navigateWeek('prev')}
                      disabled={weekOffset <= limits.minWeek}
                      className="p-2 md:p-1 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 hover:bg-background rounded-md transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5 md:w-4 md:h-4" />
                    </button>
                    <button 
                      onClick={() => navigateWeek('next')}
                      disabled={weekOffset >= 0}
                      className="p-2 md:p-1 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 hover:bg-background rounded-md transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5 md:w-4 md:h-4" />
                    </button>
                   </div>
                )}
              </div>

              {subjects.length < 3 ? (
                <div className="flex flex-col items-center justify-center h-60 gap-3">
                  <p className="text-muted-foreground text-sm">Add at least 3 subjects to see session stats</p>
                  <a 
                    href="/edit" 
                    className="text-primary hover:underline text-sm font-medium"
                  >
                    Go to Edit page →
                  </a>
                </div>
              ) : barData.length === 0 && timeRange !== "monthly" ? (
                <div className="flex items-center justify-center h-60 text-muted-foreground">
                  No session data yet. Start tracking!
                </div>
              ) : (
                timeRange === "monthly" ? (
                  <FocusHeatmap sessions={sessions} currentDate={heatmapDate} />
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis
                        dataKey={barDataKey}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(30, 8%, 50%)', fontSize: 12 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(30, 8%, 50%)', fontSize: 12 }}
                        tickFormatter={(v) => `${v}m`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(40, 30%, 99%)',
                          border: '1px solid hsl(35, 20%, 88%)',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                        }}
                        formatter={(value: number) => [`${value} min`, 'Time']}
                      />
                      <Bar 
                        dataKey="minutes" 
                        fill="hsl(18, 52%, 47%)" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )
              )}
            </div>

            {/* Pie Chart */}
            <div className="surface-card p-4 md:p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Subject Distribution</h3>
              {subjects.length < 3 ? (
                <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                  Need more subjects
                </div>
              ) : subjectData.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                  No data yet
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={subjectData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {subjectData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(40, 30%, 99%)',
                          border: '1px solid hsl(35, 20%, 88%)',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number, name: string) => [`${value} min`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1 mt-2">
                    {subjectData.slice(0, 3).map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-muted-foreground">{s.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Task Stats */}
        <section className="animate-fade-up stagger-2">
          <h2 className="section-title">Task Stats (This Week)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Summary */}
            <div className="surface-card p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-6">Overall</h3>
              <div className="grid grid-cols-2 md:grid-cols-1 gap-4 md:space-y-4">
                <div>
                  <p className="text-4xl font-light text-foreground">{taskStats.totalCompleted}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Completed</p>
                </div>
                <div>
                  <p className="text-4xl font-light text-muted-foreground">{taskStats.totalRemaining}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Remaining</p>
                </div>
              </div>
            </div>

            {/* Task List */}
            <div className="surface-card p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Your Tasks</h3>
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks added yet</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {tasks.slice(0, 6).map(task => (
                    <div key={task.id} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="text-sm text-foreground truncate">{task.name}</span>
                    </div>
                  ))}
                  {tasks.length > 6 && (
                    <p className="text-xs text-muted-foreground mt-2">+{tasks.length - 6} more...</p>
                  )}
                </div>
              )}
            </div>

            {/* Donut Chart */}
            <div className="surface-card p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Weekly Completion</h3>
              <div className="relative">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={taskCompletionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={70}
                      paddingAngle={0}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {taskCompletionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-light text-foreground">{taskStats.taskPercentage}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
