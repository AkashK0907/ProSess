import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Play,
  Pause,
  Square,
  Music,
  Music2,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  FileText,
} from "lucide-react";
import { StudySession, formatDate } from "@/lib/sessionStorage";
import { toast } from "sonner";
import { LoadingScreen } from "@/components/ui/spinner";
import { StreakCounter } from "@/components/gamification/StreakCounter";
import { useMusic } from "@/context/MusicContext";
import { getSessionStats } from "@/lib/sessionStorage";
import {
  useSessions,
  useSubjects,
  useAddSession,
  useUpdateSession,
  useDeleteSession,
} from "@/hooks/useData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Assuming Select component exists, if not I'll use native select or simple buttons

type PomodoroMode = "free" | "25/5" | "50/10";

// Same color palette as Stats page for consistency
const subjectColors = [
  "#B85C38",
  "#6B7280",
  "#059669",
  "#7C3AED",
  "#DC2626",
  "#F59E0B",
  "#14B8A6",
];

interface ActiveSession {
  isRunning: boolean;
  startTime: number; // timestamp when session started
  activeSubject: string | null;
  activeSubjectName?: string; // Cache name for offline saving
  pomodoroMode: PomodoroMode;
  isBreak: boolean; // whether in break mode
  cycleCount: number; // number of completed pomodoro cycles
  lastUpdated?: number; // timestamp of last heartbeat
}

// Simple internal interface for the form
interface SessionForm {
  id?: string;
  subject: string;
  minutes: number;
  date: string;
  notes: string;
}

const ACTIVE_SESSION_KEY = "focus-flow-active-session";
const SESSION_TIMEOUT_MS = 10000; // 10 seconds timeout for "session closed" detection

export default function Sessions() {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0); // Total work time
  const [breakSeconds, setBreakSeconds] = useState(0); // Break timer
  const [pomodoroMode, setPomodoroMode] = useState<PomodoroMode>("free");
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  // Music Context
  const { togglePlay, stop, playNextTrack, isPlaying, currentTrack } =
    useMusic();
  // Initialize music enabled state from localStorage
  const [musicEnabledState, setMusicEnabledState] = useState(() => {
    const saved = localStorage.getItem("focus-flow-music-enabled");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionForm | null>(
    null,
  );

  // Data Hooks
  const { data: allSessions = [], isLoading: loadingSessions } = useSessions();
  const { data: subjects = [], isLoading: loadingSubjects } = useSubjects();
  const addSessionMutation = useAddSession();
  const updateSessionMutation = useUpdateSession();
  const deleteSessionMutation = useDeleteSession(); // Added delete hook

  const loading = loadingSessions || loadingSubjects;

  // Persist Music Enabled Preference
  useEffect(() => {
    localStorage.setItem(
      "focus-flow-music-enabled",
      JSON.stringify(musicEnabledState),
    );
  }, [musicEnabledState]);

  // Derived State (Memoized)
  const { todaySessions, subjectTotals } = useMemo(() => {
    const today = formatDate(new Date());
    const sessions = allSessions.filter((s) => s.date === today);

    // Calculate totals per subject
    const totals: { [key: string]: number } = {};
    sessions.forEach((session) => {
      totals[session.subject] =
        (totals[session.subject] || 0) + session.minutes;
    });

    return { todaySessions: sessions, subjectTotals: totals };
  }, [allSessions]);

  // Load streak data
  useEffect(() => {
    const loadStreak = async () => {
      const stats = await getSessionStats();
      setCurrentStreak(stats.currentStreak);
    };
    loadStreak();
  }, [allSessions]); // Reload specific streak if sessions change

  // Timer logic with Pomodoro break handling
  // Timer logic with Pomodoro break handling
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning) {
      // Calculate start anchors based on current state to handle resumptions/re-renders
      // This ensures we resume exactly where we left off (or kept going)
      const workStartTime = Date.now() - seconds * 1000;
      const breakStartTime = Date.now() - breakSeconds * 1000;

      interval = setInterval(() => {
        const now = Date.now();

        if (isBreak) {
          const newBreakSeconds = Math.floor((now - breakStartTime) / 1000);

          // Logic from original:
          if (pomodoroMode !== "free") {
            const [workMinutes, breakMinutes] =
              pomodoroMode === "25/5" ? [25, 5] : [50, 10];
            const breakDuration = breakMinutes * 60;

            if (newBreakSeconds >= breakDuration) {
              // Break complete, resume work
              toast.success("Break complete! Back to work!");
              setIsBreak(false);
              setBreakSeconds(0);
              setSessionStartTime(new Date());

              // Music: Play next track when returning to work
              if (musicEnabledState) {
                playNextTrack();
              }

              new Audio(
                "https://actions.google.com/sounds/v1/alarms/beep_short.ogg",
              ).play();
              return; // Stop processing this tick as we switched modes
            }
          }
          setBreakSeconds(newBreakSeconds);
        } else {
          const newSeconds = Math.floor((now - workStartTime) / 1000);

          // Free Focus Music Rotation (Every 30 mins)
          if (
            pomodoroMode === "free" &&
            musicEnabledState &&
            newSeconds > 0 &&
            newSeconds % 1800 === 0
          ) {
            // Note: this might skip if the interval drifts significantly or tab was backgrounded exactly at the mark,
            // but self-correcting timer prioritizes accurate time over exact event firing.
            playNextTrack();
          }

          // Pomodoro Logic
          if (pomodoroMode !== "free") {
            const [focusTime] = pomodoroMode.split("/").map(Number);
            const focusSeconds = focusTime * 60;

            if (newSeconds >= focusSeconds) {
              // End of Focus Session
              setIsBreak(true);
              setSeconds(0);
              setCycleCount((c) => c + 1);
              stop(); // Stop music on break start

              // Play notification sound
              new Audio(
                "https://actions.google.com/sounds/v1/alarms/beep_short.ogg",
              ).play();
              toast.success(
                `${focusTime} minutes completed! Starting break...`,
              );

              return; // Stop processing
            }
          }
          setSeconds(newSeconds);
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [
    isRunning,
    pomodoroMode,
    isBreak,
    musicEnabledState,
    isPlaying,
    currentTrack,
  ]);

  // Handle immediate music toggle while running
  useEffect(() => {
    if (isRunning) {
      if (!musicEnabledState && isPlaying) {
        stop();
      } else if (musicEnabledState && !isPlaying) {
        if (currentTrack) {
          togglePlay();
        } else {
          playNextTrack();
        }
      }
    }
  }, [musicEnabledState]);

  // Load today's sessions and subjects + restore active session
  useEffect(() => {
    restoreActiveSession();
  }, []);

  // Restore active session from localStorage
  const restoreActiveSession = async () => {
    try {
      const stored = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (stored) {
        const session: ActiveSession = JSON.parse(stored);
        
        // CHECK TIMEOUT: If last heartbeat was > 10s ago, assume closed and save
        const lastUpdated = session.lastUpdated || session.startTime; // Fallback for old sessions
        const timeSinceLastUpdate = Date.now() - lastUpdated;

        if (timeSinceLastUpdate > SESSION_TIMEOUT_MS && session.activeSubject) {
          // SESSION ENDED (Browser closed)
          // Calculate valid duration up to the last update
          // Duration = LastUpdated - StartTime
          const durationSeconds = Math.floor((lastUpdated - session.startTime) / 1000);
          
          if (durationSeconds >= 60) {
             const minutes = Math.floor(durationSeconds / 60);
             const subjectName = session.activeSubjectName || "Unknown Subject";
             
             try {
                // Must use direct API or sessionStorage helper if mutation isn't ready/bound? 
                // Actually mutation is fine here as we are in effect.
                // But better to use the mutation provided by hook.
                await addSessionMutation.mutateAsync({
                  subject: subjectName,
                  minutes: minutes
                });
                toast.info(`Session restored and saved: ${minutes} mins for ${subjectName}`);
             } catch (e) {
                console.error("Failed to auto-save restored session", e);
                // If api fails, we might want to just keep it in local storage? 
                // For now, just toast error.
                toast.error("Failed to save previous session");
             }
          }

          // CLEAR session
          localStorage.removeItem(ACTIVE_SESSION_KEY);
          // And don't restore state
          return;
        }

        // RESUME (Refresh or quick reopen)
        if (session.isRunning && session.activeSubject) {
          // Calculate elapsed time since session started (Resume timer)
          const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
          setSeconds(elapsed);
          setActiveSubject(session.activeSubject);
          setPomodoroMode(session.pomodoroMode);
          setIsBreak(session.isBreak || false);
          setCycleCount(session.cycleCount || 0);
          setIsRunning(true);

          if (!session.isBreak && session.activeSubjectName) {
              // Toast strictly for debugging/confirmation? No, cleaner to be silent on refresh
              // console.log("Resuming session...");
          }

          // Auto-resume music if persistence check passes
          // Note: using local var check because state update is async/batched
          const savedMusicState = localStorage.getItem(
            "focus-flow-music-enabled",
          );
          const shouldPlay =
            savedMusicState !== null ? JSON.parse(savedMusicState) : true;

          if (shouldPlay && !session.isBreak && !isPlaying) {
            if (currentTrack) {
              togglePlay();
            } else {
              playNextTrack();
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to restore active session:", error);
    }
  };

  // Save active session to localStorage whenever it changes
  useEffect(() => {
    if (isRunning && activeSubject) {
      // Find subject name to cache for offline/restore saving
      const subjectName = subjects.find(s => s.id === activeSubject)?.name;
      
      const session: ActiveSession = {
        isRunning,
        startTime: Date.now() - seconds * 1000, // Calculate start time based on current seconds
        activeSubject,
        activeSubjectName: subjectName,
        pomodoroMode,
        isBreak,
        cycleCount,
        lastUpdated: Date.now() // Heartbeat
      };
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
    } else {
      // Clear when not running
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  }, [isRunning, activeSubject, pomodoroMode, seconds, isBreak, cycleCount, subjects]);

  const formatTime = useCallback((totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const handlePlay = () => {
    if (!activeSubject) {
      setShowSubjectDialog(true);
      return;
    }
    if (musicEnabledState && !isPlaying) {
      if (currentTrack) {
        togglePlay();
      } else {
        playNextTrack();
      }
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
    if (isPlaying) {
      stop();
    }
  };

  const handleStop = async () => {
    if (seconds >= 60 && activeSubject) {
      const minutes = Math.floor(seconds / 60);
      const subjectName =
        subjects.find((s) => s.id === activeSubject)?.name || "Unknown";

      try {
        await addSessionMutation.mutateAsync({
          subject: subjectName,
          minutes,
        });
        toast.success(`Saved ${minutes} minutes for ${subjectName}`);
      } catch (error) {
        toast.error("Failed to save session");
      }
    }

    setIsRunning(false);
    if (isPlaying) stop(); // Ensure music stops
    setSeconds(0);
    setBreakSeconds(0);
    setActiveSubject(null);
    setIsBreak(false);
    setCycleCount(0);
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  };

  const skipBreak = () => {
    if (isBreak) {
      toast.info("Break skipped. Back to work!");
      setIsBreak(false);
      setBreakSeconds(0);
    }
  };

  const startWithSubject = (subjectId: string) => {
    setActiveSubject(subjectId);
    setSeconds(0);
    if (musicEnabledState && !isPlaying) {
      playNextTrack();
    }
    setIsRunning(true);
  };

  // --- Session Management Functions ---

  const handleManualEntry = () => {
    setEditingSession({
      subject: subjects[0]?.name || "",
      minutes: 30,
      date: formatDate(new Date()),
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const handleEditSession = (session: StudySession) => {
    setEditingSession({
      id: session.id,
      subject: session.subject,
      minutes: session.minutes,
      date: session.date,
      notes: session.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDeleteSession = async (id: string) => {
    if (confirm("Are you sure you want to delete this session?")) {
      await deleteSessionMutation.mutateAsync(id);
      toast.success("Session deleted");
    }
  };

  const handleSubmitSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;

    try {
      if (editingSession.id) {
        // Update
        await updateSessionMutation.mutateAsync({
          id: editingSession.id,
          updates: {
            subject: editingSession.subject,
            minutes: parseInt(editingSession.minutes.toString()),
            date: editingSession.date,
            notes: editingSession.notes,
          },
        });
        toast.success("Session updated");
      } else {
        // Create
        await addSessionMutation.mutateAsync({
          subject: editingSession.subject,
          minutes: parseInt(editingSession.minutes.toString()),
          date: new Date(editingSession.date),
          notes: editingSession.notes,
        });
        toast.success("Session logged manually");
      }
      setIsDialogOpen(false);
      setEditingSession(null);
    } catch (error) {
      toast.error("Failed to save session");
    }
  };

  // Calculate total today
  const totalToday = Object.values(subjectTotals).reduce(
    (acc, mins) => acc + mins,
    0,
  );

  if (loading) {
    return <LoadingScreen message="Loading sessions..." />;
  }

  // Get recent sessions (active list, filtered by non-today if needed, or all)
  // Let's show all latest sessions sorted by date descending
  // But we already have 'allSessions' via useSessions which might be default sorted by API.
  // The API sorts { date: -1 }. So allSessions[0] is most recent.
  // We'll show top 5 recent history.
  const recentHistory = allSessions.slice(0, 5);

  return (
    <>
      <div className="space-y-12">
        {/* Current Session Timer */}
        <section className="animate-fade-up relative">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title mb-0">
              {isBreak ? "Break Time 🌿" : "Current Session"}
            </h2>

            {/* Streak Counter - Next to heading on mobile only */}
            {!isBreak && typeof currentStreak === "number" && (
              <div className="md:hidden scale-75">
                <StreakCounter streak={currentStreak} />
              </div>
            )}
          </div>

          <div className="surface-card p-6 md:p-12 relative overflow-hidden">
            {/* Background Gradient Effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            {/* Streak Counter - Inside card on desktop only (hidden on mobile) */}
            {!isBreak && typeof currentStreak === "number" && (
              <div className="hidden md:block absolute top-6 right-6 animate-fade-up">
                <StreakCounter streak={currentStreak} />
              </div>
            )}

            {/* Timer Display */}
            <div className="text-center mb-8">
              {isBreak ? (
                <>
                  <p className="text-6xl md:text-8xl font-light tabular-nums tracking-tight text-foreground mb-2 transition-all">
                    {formatTime(breakSeconds)}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Break Timer
                  </p>
                  <p className="text-xl md:text-2xl font-light tabular-nums text-muted-foreground/70">
                    Session: {formatTime(seconds)}
                  </p>
                  <p className="text-base md:text-lg text-muted-foreground mt-4">
                    Take a break! Relax and recharge 🧘‍♂️
                  </p>
                </>
              ) : (
                <>
                  <p className="text-6xl md:text-8xl font-light tabular-nums tracking-tight text-foreground mb-4 transition-all">
                    {formatTime(seconds)}
                  </p>
                  {activeSubject ? (
                    <p className="text-base md:text-lg text-muted-foreground">
                      Studying:{" "}
                      {subjects.find((s) => s.id === activeSubject)?.name ||
                        "Unknown"}
                      {pomodoroMode !== "free" && ` • ${pomodoroMode} mode`}
                    </p>
                  ) : (
                    <p className="text-base md:text-lg text-muted-foreground">
                      Select a subject to begin
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              {!isRunning ? (
                <button
                  onClick={handlePlay}
                  className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-primary to-primary/90 hover:from-primary/90 hover:to-primary flex items-center justify-center shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 hover:scale-110 active:scale-95"
                  aria-label="Start session"
                >
                  <Play
                    className="w-6 h-6 md:w-7 md:h-7 ml-1 text-primary-foreground"
                    fill="currentColor"
                  />
                </button>
              ) : (
                <>
                  <button
                    onClick={handlePause}
                    className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-secondary/80 to-secondary/60 hover:from-secondary hover:to-secondary/80 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95"
                    aria-label="Pause session"
                  >
                    <Pause
                      className="w-6 h-6 md:w-7 md:h-7 text-foreground"
                      fill="currentColor"
                    />
                  </button>
                  <button
                    onClick={handleStop}
                    disabled={addSessionMutation.isPending}
                    className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-destructive/80 to-destructive/60 hover:from-destructive hover:to-destructive/80 flex items-center justify-center shadow-lg hover:shadow-xl hover:shadow-destructive/20 transition-all duration-300 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    aria-label="Stop session"
                  >
                    {addSessionMutation.isPending ? (
                      <div className="w-6 h-6 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />
                    ) : (
                      <Square
                        className="w-6 h-6 md:w-7 md:h-7 text-destructive-foreground"
                        fill="currentColor"
                      />
                    )}
                  </button>
                  {isBreak && (
                    <button
                      onClick={skipBreak}
                      className="px-4 py-2 md:px-6 md:py-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-medium transition-colors text-sm md:text-base"
                    >
                      Skip Break →
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* Toggles */}
        <section className="animate-fade-up stagger-2">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground mr-2">Mode:</span>
              <button
                onClick={() => setPomodoroMode("free")}
                className={`toggle-pill ${pomodoroMode === "free" ? "toggle-pill-active" : "toggle-pill-inactive"}`}
              >
                Free Focus
              </button>
              <button
                onClick={() => setPomodoroMode("25/5")}
                className={`toggle-pill ${pomodoroMode === "25/5" ? "toggle-pill-active" : "toggle-pill-inactive"}`}
              >
                25/5
              </button>
              <button
                onClick={() => setPomodoroMode("50/10")}
                className={`toggle-pill ${pomodoroMode === "50/10" ? "toggle-pill-active" : "toggle-pill-inactive"}`}
              >
                50/10
              </button>
            </div>
            <div className="flex items-center gap-3">
              {musicEnabledState && currentTrack && (
                <span className="text-xs text-muted-foreground animate-fade-in hidden md:inline-block">
                  🎵 {currentTrack.name}
                </span>
              )}
              <button
                onClick={() => setMusicEnabledState(!musicEnabledState)}
                className={`control-button control-button-secondary ${musicEnabledState ? "bg-primary text-primary-foreground" : ""}`}
                title={
                  musicEnabledState ? "Disable Music" : "Enable Focus Music"
                }
              >
                {musicEnabledState ? (
                  <Music className="w-4 h-4" />
                ) : (
                  <Music2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Today's Summary */}
        <section className="animate-fade-up stagger-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Total (Today)</h2>
            <span className="text-2xl font-light text-foreground">
              {formatMinutes(totalToday)}
            </span>
          </div>

          <div className="surface-card divide-y divide-border/30">
            {subjects.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <p className="text-muted-foreground mb-3">
                  No subjects added yet.
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Add subjects from the{" "}
                  <a
                    href="/edit"
                    className="text-primary hover:underline font-medium"
                  >
                    Edit page
                  </a>{" "}
                  to start tracking study sessions.
                </p>
              </div>
            ) : (
              subjects.map((subject, index) => (
                <div
                  key={subject.id}
                  className="subject-row animate-fade-up group"
                  style={{ animationDelay: `${(index + 4) * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full transition-transform duration-300 group-hover:scale-125"
                      style={{
                        backgroundColor:
                          subjectColors[index % subjectColors.length],
                        boxShadow: `0 0 12px ${subjectColors[index % subjectColors.length]}40`,
                      }}
                    />
                    <span className="font-medium text-foreground">
                      {subject.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground tabular-nums font-medium">
                      {formatMinutes(subjectTotals[subject.name] || 0)}
                    </span>
                    <button
                      onClick={() => startWithSubject(subject.id)}
                      className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary/80 to-secondary/60 hover:from-primary hover:to-primary/90 hover:text-primary-foreground flex items-center justify-center transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:scale-110 active:scale-95 backdrop-blur-sm"
                      aria-label={`Start session for ${subject.name}`}
                    >
                      <Play
                        className="w-3.5 h-3.5 ml-0.5"
                        fill="currentColor"
                      />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Subject Selection Dialog (Timer) */}
      <Dialog open={showSubjectDialog} onOpenChange={setShowSubjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select a Subject</DialogTitle>
            <DialogDescription>
              Choose which subject you want to study to start the timer.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No subjects added yet. Add subjects in the Edit page first.
              </p>
            ) : (
              subjects.map((subject, index) => (
                <button
                  key={subject.id}
                  onClick={() => {
                    startWithSubject(subject.id);
                    setShowSubjectDialog(false);
                  }}
                  className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors text-left"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        subjectColors[index % subjectColors.length],
                    }}
                  />
                  <span className="text-foreground font-medium">
                    {subject.name}
                  </span>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Entry / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingSession?.id ? "Edit Session" : "Log Session"}
            </DialogTitle>
            <DialogDescription>
              {editingSession?.id
                ? "Update the details of your study session."
                : "Manually log a study session you completed."}
            </DialogDescription>
          </DialogHeader>
          {editingSession && (
            <form onSubmit={handleSubmitSession} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subject" className="text-right">
                  Subject
                </Label>
                <div className="col-span-3">
                  {" "}
                  {/* Simple Native Select for reliability */}
                  <select
                    id="subject"
                    value={editingSession.subject}
                    onChange={(e) =>
                      setEditingSession({
                        ...editingSession,
                        subject: e.target.value,
                      })
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="" disabled>
                      Select subject
                    </option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="minutes" className="text-right">
                  Minutes
                </Label>
                <Input
                  id="minutes"
                  type="number"
                  min="1"
                  value={editingSession.minutes}
                  onChange={(e) =>
                    setEditingSession({
                      ...editingSession,
                      minutes: parseInt(e.target.value) || 0,
                    })
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={editingSession.date}
                  onChange={(e) =>
                    setEditingSession({
                      ...editingSession,
                      date: e.target.value,
                    })
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                {" "}
                {/* Aligned start for textarea */}
                <Label htmlFor="notes" className="text-right mt-2">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  value={editingSession.notes}
                  onChange={(e) =>
                    setEditingSession({
                      ...editingSession,
                      notes: e.target.value,
                    })
                  }
                  className="col-span-3"
                  placeholder="What did you work on?"
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingSession.id ? "Save Changes" : "Log Session"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
