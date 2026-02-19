import { useState, useEffect } from "react";
import { Edit2, Trash2, Plus, Calendar } from "lucide-react";
import { StudySession, updateSession, deleteSession, getSessions, addSession } from "@/lib/sessionStorage";
import { getCurrentUser } from "@/lib/auth";
import { Subject } from "@/lib/subjectStorage";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SessionHistoryProps {
  subjects: Subject[];
  onSessionsUpdated: () => void;
}

const subjectColors = ["#B85C38", "#6B7280", "##059669", "#7C3AED", "#DC2626", "#F59E0B", "#14B8A6"];

export function SessionHistory({ subjects, onSessionsUpdated }: SessionHistoryProps) {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Form states
  const [formSubject, setFormSubject] = useState("");
  const [formMinutes, setFormMinutes] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formNotes, setFormNotes] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser();
      if (user) {
        setUserEmail(user.email);
      }
    };
    fetchUser();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const allSessions = await getSessions();
      // Sort by date descending
      const sorted = allSessions.sort((a, b) => b.date.localeCompare(a.date));
      setSessions(sorted);
      setShowHistory(true);
    } catch (error) {
      toast.error("Failed to load session history");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (session: StudySession) => {
    setEditingSession(session);
    setFormSubject(session.subject);
    setFormMinutes(session.minutes.toString());
    setFormDate(session.date);
    setFormNotes(session.notes || "");
  };

  const handleSaveEdit = async () => {
    if (!editingSession) return;

    try {
      await updateSession(editingSession.id, {
        subject: formSubject,
        minutes: parseInt(formMinutes),
        date: formDate,
        notes: formNotes || undefined,
      });
      toast.success("Session updated");
      setEditingSession(null);
      loadHistory();
      onSessionsUpdated();
    } catch (error) {
      toast.error("Failed to update session");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this session?")) return;

    try {
      await deleteSession(id);
      toast.success("Session deleted");
      loadHistory();
      onSessionsUpdated();
    } catch (error) {
      toast.error("Failed to delete session");
    }
  };

  const handleAddSession = async () => {
    if (!formSubject || !formMinutes || !formDate) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const dateObj = new Date(formDate);
      const today = new Date();
      // Reset time for accurate date comparison
      const todayZero = new Date(today);
      todayZero.setHours(0,0,0,0);
      const dateZero = new Date(dateObj);
      dateZero.setHours(0,0,0,0);
      
      const diffTime = todayZero.getTime() - dateZero.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 7) {
        toast.error("Cannot add sessions older than 7 days");
        return;
      }
      if (diffDays < 0) {
        toast.error("Cannot add sessions in the future");
        return;
      }

      await addSession(formSubject, parseInt(formMinutes), dateObj, formNotes || undefined);
      toast.success("Session added");
      setShowAddDialog(false);
      setFormSubject("");
      setFormMinutes("");
      setFormDate("");
      setFormNotes("");
      loadHistory();
      onSessionsUpdated();
    } catch (error) {
      toast.error("Failed to add session");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getSubjectColor = (subjectName: string) => {
    const index = subjects.findIndex(s => s.name === subjectName);
    return index >= 0 ? subjectColors[index % subjectColors.length] : "#6B7280";
  };

  return (
    <section className="animate-fade-up stagger-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title mb-0">Session History</h2>
        <div className="flex gap-2">
          {userEmail === "akashk79026@gmail.com" && (
            <button
              onClick={() => setShowAddDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Add Manual Session
            </button>
          )}
          <button
            onClick={loadHistory}
            className="px-4 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            {showHistory ? "Refresh" : "View History"}
          </button>
        </div>
      </div>

      {showHistory && (
        <div className="surface-card divide-y divide-border/30 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              Loading history...
            </div>
          ) : sessions.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              No sessions yet. Start tracking to see history!
            </div>
          ) : (
            sessions.map((session, index) => (
              <div
                key={session.id}
                className="flex items-center justify-between px-4 py-3 group hover:bg-secondary/30 transition-colors"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getSubjectColor(session.subject) }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{session.subject}</span>
                      <span className="text-sm text-muted-foreground">• {session.minutes} min</span>
                      <span className="text-sm text-muted-foreground">• {formatDate(session.date)}</span>
                    </div>
                    {session.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{session.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(session)}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    aria-label="Edit session"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(session.id)}
                    className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                    aria-label="Delete session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingSession} onOpenChange={() => setEditingSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
            <DialogDescription>Update the details of this study session.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <select
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
              >
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.name}>{subject.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Minutes</label>
              <input
                type="number"
                value={formMinutes}
                onChange={(e) => setFormMinutes(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                min="1"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Date</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Notes (Optional)</label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                rows={3}
                placeholder="Add any notes about this session..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSession(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Manual Session Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Manual Session</DialogTitle>
            <DialogDescription>Log a study session manually for any date.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Subject *</label>
              <select
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
              >
                <option value="">Select a subject</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.name}>{subject.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Minutes *</label>
              <input
                type="number"
                value={formMinutes}
                onChange={(e) => setFormMinutes(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                min="1"
                placeholder="e.g., 30"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Date *</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                max={new Date().toISOString().split("T")[0]}
                min={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Notes (Optional)</label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                rows={3}
                placeholder="What did you study? Any key topics?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddSession}>Add Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
