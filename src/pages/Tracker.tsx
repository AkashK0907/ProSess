import { useState, useMemo } from "react";

import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { DateHeader } from "@/components/tracker/DateHeader";
import { TaskRow } from "@/components/tracker/TaskRow";
import { initializeDefaultTasks, toggleTaskCompletion } from "@/lib/taskStorage";
import { LoadingScreen } from "@/components/ui/spinner";
import { useTasks, useTaskCompletions, QUERY_KEYS, useUser } from "@/hooks/useData";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Tracker() {
  const queryClient = useQueryClient();
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [consistencyMonthOffset, setConsistencyMonthOffset] = useState(0);
  
  const { data: user } = useUser();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();
  const { data: completionData = {}, isLoading: loadingCompletions } = useTaskCompletions();
  
  const loading = loadingTasks || loadingCompletions;

  // Calculate navigation limits based on account creation
  const limits = useMemo(() => {
    if (!user?.createdAt) return { minMonth: -12, minWeek: -12 }; // Default fallback

    const created = new Date(user.createdAt);
    const now = new Date();
    
    // Monthly limit
    const monthDiff = (created.getFullYear() - now.getFullYear()) * 12 + (created.getMonth() - now.getMonth());
    
    // Weekly limit
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const c = new Date(created); c.setHours(0,0,0,0);
    const n = new Date(now); n.setHours(0,0,0,0);
    const weekDiff = Math.floor((c.getTime() - n.getTime()) / oneWeek);

    return { 
      minMonth: monthDiff, 
      minWeek: weekDiff 
    };
  }, [user]);

  // Toggle Mutation
  // Toggle Mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ taskId, date }: { taskId: string; date: Date }) => {
      const dateKey = formatDate(date);
      return await toggleTaskCompletion(taskId, dateKey);
    },
    onMutate: async ({ taskId, date }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.completions] });

      // Snapshot the previous value
      const previousCompletions = queryClient.getQueryData([QUERY_KEYS.completions]);

      // Optimistically update to the new value
      queryClient.setQueryData([QUERY_KEYS.completions], (old: any) => {
        const dateKey = formatDate(date);
        const dayData = old?.[dateKey] || {};
        const currentVal = dayData[taskId] || false;
        
        return {
          ...old,
          [dateKey]: {
            ...dayData,
            [taskId]: !currentVal // Toggle immediately
          }
        };
      });

      // Return a context object with the snapshotted value
      return { previousCompletions };
    },
    onError: (_err, _newTodo, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCompletions) {
        queryClient.setQueryData([QUERY_KEYS.completions], context.previousCompletions);
      }
    },
    onSettled: () => {
      // Always refetch after error or success:
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.completions] });
    },
  });

  // Get current week dates
  const dates = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - currentDay + (currentWeekOffset * 7));
    sunday.setHours(0, 0, 0, 0);
    
    const d = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(sunday);
      date.setDate(sunday.getDate() + i);
      d.push(date);
    }
    return d;
  }, [currentWeekOffset]);

  const today = new Date();

  // Navigation for Weekly Tracker
  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekOffset(prev => {
      if (direction === 'prev') {
        return Math.max(prev - 1, limits.minWeek);
      } else {
        return Math.min(prev + 1, 0); // Max 0 (current week)
      }
    });
  };

  const resetToCurrentWeek = () => {
    setCurrentWeekOffset(0);
  };

  // Navigation for Consistency Chart
  const navigateMonth = (direction: 'prev' | 'next') => {
    setConsistencyMonthOffset(prev => {
      if (direction === 'prev') {
        return Math.max(prev - 1, limits.minMonth);
      } else {
        return Math.min(prev + 1, 0); // Max 0 (current month)
      }
    });
  };

  const getConsistencyMonthDisplay = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + consistencyMonthOffset);
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Calculate monthly progress (derived from completionData)
  const monthlyProgress = useMemo(() => {
    const today = new Date();
    const progressData: { date: string; completion: number }[] = [];
    
    // Calculate target month based on offset
    const targetDate = new Date(today);
    targetDate.setDate(1); // Set to 1st to avoid month overflow issues
    targetDate.setMonth(targetDate.getMonth() + consistencyMonthOffset);
    
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    
    for (let day = 1; day <= lastDayOfMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      
      const dateKey = formatDate(date);
      const dayCompletions = completionData[dateKey] || {};
      
      // Count how many tasks existed on this day
      const tasksOnThisDay = tasks.filter(task => {
        const createdStr = (task as any).createdAt;
        const taskCreated = createdStr ? new Date(createdStr) : new Date(0);
        taskCreated.setHours(0, 0, 0, 0);
        return date >= taskCreated;
      });
      
      const completedCount = tasksOnThisDay.filter(t => dayCompletions[t.id]).length;
      const totalTasks = tasksOnThisDay.length;
      const percentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
      
      progressData.push({
        date: `${day}`,
        completion: percentage
      });
    }
    
    return progressData;
  }, [tasks, completionData, consistencyMonthOffset]);

  const handleToggle = (taskId: string, date: Date) => {
    toggleMutation.mutate({ taskId, date });
  };

  // Calculate statistics (Weekly)
  const weeklyStats = useMemo(() => {
    let totalDailyPercentage = 0;
    let daysWithFullCompletion = 0;
    let totalCompletions = 0; 
    
    dates.forEach(date => {
      const dateKey = formatDate(date);
      const dayData = completionData[dateKey] || {};
      
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
        totalCompletions += completedOnDay;
        const dayPercentage = (completedOnDay / tasksOnThisDay.length) * 100;
        totalDailyPercentage += dayPercentage;
        
        if (completedOnDay === tasksOnThisDay.length) {
          daysWithFullCompletion++;
        }
      }
    });

    // Average daily completion rate for the period
    const overallPercentage = dates.length > 0 ? Math.round(totalDailyPercentage / dates.length) : 0;
    
    return {
      totalCompletions,
      overallPercentage,
      daysWithFullCompletion
    };
  }, [dates, completionData, tasks]);

  const { totalCompletions: actualCompletions, overallPercentage } = weeklyStats;

  // Range Display
  const getRangeDisplay = () => {
    const start = dates[0];
    const end = dates[6];
    if (!start || !end) return "";
    if (start.getMonth() === end.getMonth()) {
      return `${months[start.getMonth()]} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
    }
    return `${months[start.getMonth()]} ${start.getDate()} - ${months[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`;
  };



  if (loading) {
     return (
       <LoadingScreen message="Loading tasks..." />
     );
  }

  return (
    <div className="space-y-8 animate-fade-in">
        {/* Consistency Chart */}
        <section className="animate-fade-up">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="section-title mb-0">Consistency</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <button 
                onClick={() => navigateMonth('prev')}
                disabled={consistencyMonthOffset <= limits.minMonth}
                className="p-2 md:p-1 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 hover:bg-background rounded-md transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5 md:w-4 md:h-4" />
              </button>
              <div className="flex items-center gap-2 px-1 min-w-[120px] justify-center">
                <span className="text-sm font-medium">
                  {getConsistencyMonthDisplay()}
                </span>
              </div>
              <button 
                onClick={() => navigateMonth('next')}
                disabled={consistencyMonthOffset >= 0}
                className="p-2 md:p-1 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 hover:bg-background rounded-md transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5 md:w-4 md:h-4" />
              </button>
            </div>
          </div>

          <div className="surface-card p-4 md:p-6">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyProgress} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                {/* ... chart props ... */}
                <defs>
                  <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(18, 52%, 47%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(18, 52%, 47%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(30, 8%, 50%)', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(30, 8%, 50%)', fontSize: 12 }}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(40, 30%, 99%)',
                    border: '1px solid hsl(35, 20%, 88%)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                  }}
                  formatter={(value: number) => [`${value}%`, 'Completion']}
                />
                <Area
                  type="monotone"
                  dataKey="completion"
                  stroke="hsl(18, 52%, 47%)"
                  strokeWidth={2}
                  fill="url(#completionGradient)"
                  isAnimationActive={true}
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Weekly Task Tracker */}
        <section className="animate-fade-up stagger-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="section-title mb-0">Weekly Tracker</h2>
            
            <div className="flex items-center gap-4 flex-wrap">
              {/* Navigation */}
              <div className="flex items-center bg-secondary/50 rounded-lg p-1">
                <button 
                  onClick={() => navigateWeek('prev')}
                   disabled={currentWeekOffset <= limits.minWeek}
                  className="p-2 md:p-1 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 hover:bg-background rounded-md transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5 md:w-4 md:h-4" />
                </button>
                <div className="flex items-center gap-2 px-3 min-w-[140px] justify-center">
                  <span className="text-sm font-medium">
                    {getRangeDisplay()}
                  </span>
                </div>
                <button 
                  onClick={() => navigateWeek('next')}
                  disabled={currentWeekOffset >= 0}
                  className="p-2 md:p-1 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 hover:bg-background rounded-md transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5 md:w-4 md:h-4" />
                </button>
              </div>
              
              {currentWeekOffset !== 0 && (
                <button
                  onClick={resetToCurrentWeek}
                  className="text-xs font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1 min-h-[44px] md:min-h-0"
                >
                  <CalendarIcon className="w-3 h-3" />
                  Current
                </button>
              )}
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
            {/* Tracker Grid - Enable horizontal scroll on mobile */}
            <div className="flex-1 surface-card p-4 md:p-6 overflow-x-auto">
              <div className="min-w-[800px] md:min-w-0">
                <DateHeader dates={dates} currentDate={today} />
                
                {/* Task Rows */}
                <div className="space-y-0">
                  {tasks.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-3">No tasks added yet.</p>
                      <p className="text-sm text-muted-foreground">
                        Add tasks from the <a href="/edit" className="text-primary hover:underline font-medium">Edit page</a> to start tracking.
                      </p>
                    </div>
                  ) : (
                    tasks.map((task) => {
                      const totalCompletions = Object.values(completionData).reduce((acc, dayData) => {
                        return acc + (dayData[task.id] ? 1 : 0);
                      }, 0);

                      return (
                        <TaskRow
                          key={task.id}
                          task={task}
                          dates={dates}
                          currentDate={today}
                          completions={completionData}
                          onToggle={handleToggle}
                          totalCompletions={totalCompletions} 
                        />
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Summary - Grid on mobile, vertical stack on desktop */}
            <div className="w-full md:w-48 grid grid-cols-2 md:grid-cols-1 gap-4">
              <div className="glass-card p-5 text-center animate-fade-up stagger-3 bg-gradient-to-br from-card/90 to-card/70">
                <p className="text-3xl font-light text-foreground">{actualCompletions}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Completed</p>
              </div>
              <div className="glass-card p-5 text-center animate-fade-up stagger-4 bg-gradient-to-br from-card/90 to-card/70">
                <p className="text-3xl font-light text-foreground">{tasks.length}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Tasks</p>
              </div>
              <div className="glass-card p-5 text-center animate-fade-up stagger-5 bg-gradient-to-br from-primary/10 to-accent/5 col-span-2 md:col-span-1">
                <p className="text-3xl font-light gradient-text">{overallPercentage}%</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">This Week</p>
              </div>
            </div>
          </div>
        </section>
    </div>
  );
}
