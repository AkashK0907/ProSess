import { useState, useMemo } from "react";
import { Mail, Phone, Flame, Trophy, Calendar, TrendingUp, LogOut, Edit2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { SessionStats, calculateStats } from "@/lib/sessionStorage";
import { useSessions, useUser, useUpdateUser } from "@/hooks/useData";
import { logout } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Profile() {
  // Data Hooks
  const { data: user, isLoading: loadingUser } = useUser();
  const { data: sessions = [], isLoading: loadingSessions } = useSessions();
  const updateUserMutation = useUpdateUser();
  
  const loading = loadingUser || loadingSessions;

  // Dialog State
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Derived Stats
  const stats = useMemo(() => calculateStats(sessions), [sessions]);

  const handleEditClick = () => {
    setEditForm({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
    setShowEditDialog(true);
  };

  const handleSaveProfile = async () => {
    try {
      await updateUserMutation.mutateAsync(editForm);
      toast.success("Profile updated successfully");
      setShowEditDialog(false);
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handleLogout = () => {
    logout();
  };

  const formatBestDay = (dateStr: string) => {
    if (!dateStr) return "No data yet";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTotalHours = () => {
    return Math.floor(stats.totalMinutes / 60);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-12">
        {/* Profile Info */}
        <section className="animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Profile</h2>
            <div className="flex gap-2">
              <button
                onClick={handleEditClick}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
          
          <div className="surface-card p-8">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-medium text-primary">
                  {user?.name?.split(" ").map((n: string) => n[0]).join("") || "U"}
                </span>
              </div>
              
              {/* Info */}
              <div className="flex-1">
                <h3 className="text-2xl font-medium text-foreground mb-4">{user?.name || "User"}</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{user?.email || "No email"}</span>
                  </div>
                  {user?.phone && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Lifetime Metrics */}
        <section className="animate-fade-up stagger-2">
          <h2 className="section-title">Lifetime Metrics</h2>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Current Streak */}
            <div className="surface-card p-6 animate-fade-up stagger-3">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Current Streak</span>
              </div>
              <p className="text-4xl font-light text-foreground">
                {stats.currentStreak} <span className="text-lg text-muted-foreground">days</span>
              </p>
            </div>

            {/* Highest Streak */}
            <div className="surface-card p-6 animate-fade-up stagger-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">Highest Streak</span>
              </div>
              <p className="text-4xl font-light text-foreground">
                {stats.highestStreak} <span className="text-lg text-muted-foreground">days</span>
              </p>
            </div>

            {/* Best Day */}
            <div className="surface-card p-6 animate-fade-up stagger-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">Best Day</span>
              </div>
              <p className="text-2xl font-light text-foreground mb-1">{formatBestDay(stats.bestDay)}</p>
              <p className="text-sm text-muted-foreground">
                {Math.floor(stats.bestDayMinutes / 60)}h {stats.bestDayMinutes % 60}m studied
              </p>
            </div>

            {/* Total Study Time */}
            <div className="surface-card p-6 animate-fade-up stagger-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">Total Study Time</span>
              </div>
              <p className="text-2xl font-light text-foreground mb-1">{getTotalHours()} hours</p>
              <p className="text-sm text-muted-foreground">{stats.totalMinutes} minutes overall</p>
            </div>
          </div>
        </section>
        {/* Badges */}
        <section className="animate-fade-up stagger-3">
          <h2 className="section-title">Achievements</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { 
                id: "spark", 
                name: "Spark", 
                desc: "3 Day Streak", 
                icon: Flame, 
                color: "text-orange-500", 
                bg: "bg-orange-500/10",
                earned: stats.highestStreak >= 3 
              },
              { 
                id: "fire", 
                name: "On Fire", 
                desc: "7 Day Streak", 
                icon: Flame, 
                color: "text-red-500", 
                bg: "bg-red-500/10",
                earned: stats.highestStreak >= 7 
              },
              { 
                id: "wildfire", 
                name: "Wildfire", 
                desc: "30 Day Streak", 
                icon: Trophy, 
                color: "text-purple-500", 
                bg: "bg-purple-500/10",
                earned: stats.highestStreak >= 30 
              },
              { 
                id: "scholar", 
                name: "Scholar", 
                desc: "10 Hours Total", 
                icon: TrendingUp, 
                color: "text-blue-500", 
                bg: "bg-blue-500/10",
                earned: stats.totalMinutes >= 600 
              },
              { 
                id: "master", 
                name: "Focus Master", 
                desc: "100 Hours Total", 
                icon: Trophy, 
                color: "text-yellow-500", 
                bg: "bg-yellow-500/10",
                earned: stats.totalMinutes >= 6000 
              },
              {
                id: "early-bird",
                name: "Early Bird",
                desc: "Session before 8 AM",
                icon: Calendar,
                color: "text-emerald-500",
                bg: "bg-emerald-500/10",
                earned: false // Placeholder for future logic
              }
            ].map((badge, index) => (
              <div 
                key={badge.id}
                className={`surface-card p-4 transition-all duration-300 ${!badge.earned ? "opacity-50 grayscale" : "hover:scale-105"}`}
              >
                <div className={`w-12 h-12 rounded-full ${badge.bg} flex items-center justify-center mb-3`}>
                  <badge.icon className={`w-6 h-6 ${badge.color}`} />
                </div>
                <h3 className="font-medium text-foreground">{badge.name}</h3>
                <p className="text-xs text-muted-foreground">{badge.desc}</p>
                {badge.earned && (
                  <div className="mt-2 text-[10px] uppercase font-bold tracking-wider text-primary">
                    Unlocked
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your personal information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className="input-field w-full"
                placeholder="Your Name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                className="input-field w-full"
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                className="input-field w-full"
                placeholder="+1 234 567 890"
              />
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={updateUserMutation.isPending}
              className="w-full btn-primary mt-4"
            >
              {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
