import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Habit } from "@/types/habitTypes";
import { Plus } from "lucide-react";

interface HabitDialogProps {
  habit?: Habit;
  onSave: (habit: Omit<Habit, "id"> | Habit) => void;
  trigger?: React.ReactNode;
  children?: React.ReactNode;
}

export function HabitDialog({ habit, onSave, trigger, children }: HabitDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(habit?.name || "");
  const [emoji, setEmoji] = useState(habit?.emoji || "");
  const [goal, setGoal] = useState(habit?.goal?.toString() || "30");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !goal) return;

    const habitData = {
      name: name.trim(),
      emoji: emoji.trim(),
      goal: parseInt(goal, 10),
    };

    if (habit) {
      onSave({ ...habit, ...habitData });
    } else {
      onSave(habitData);
    }

    setOpen(false);
    // Reset form if adding new
    if (!habit) {
      setName("");
      setEmoji("");
      setGoal("30");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Habit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{habit ? "Edit Habit" : "Add New Habit"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Habit Name</Label>
            <Input
              id="name"
              placeholder="e.g., 6:00-9:00 or Morning Exercise"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="emoji">Emoji (optional)</Label>
            <Input
              id="emoji"
              placeholder="🌅"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              maxLength={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="goal">Daily Goal (minutes)</Label>
            <Input
              id="goal"
              type="number"
              min="1"
              placeholder="30"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {habit ? "Save Changes" : "Add Habit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
