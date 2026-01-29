import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoadingScreen } from "@/components/ui/spinner";
import {
  useSubjects,
  useTasks,
  useAddSubject,
  useUpdateSubject,
  useDeleteSubject,
  useAddTask,
  useUpdateTask,
  useDeleteTask
} from "@/hooks/useData";

interface EditableItem {
  id: string;
  name: string;
}

export default function Edit() {
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);

  // Data Hooks
  const { data: subjects = [], isLoading: loadingSubjects } = useSubjects();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();

  // Mutations
  const addSubjectMutation = useAddSubject();
  const updateSubjectMutation = useUpdateSubject();
  const deleteSubjectMutation = useDeleteSubject();
  const addTaskMutation = useAddTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const loading = loadingSubjects || loadingTasks;

  const handleSubjectRename = (id: string, newName: string) => {
    updateSubjectMutation.mutate({ id, name: newName });
    setEditingSubject(null);
  };

  const handleTaskRename = (id: string, newName: string) => {
    updateTaskMutation.mutate({ id, name: newName });
    setEditingTask(null);
  };

  const addNewSubject = () => {
    addSubjectMutation.mutate("New Subject", {
      onSuccess: () => {
        // You might want to auto-edit the new subject here, but identifying it requires
        // the mutation to return the new ID, which it does, but we are refetching list.
        // For simplicity, we just add it.
      }
    });
  };

  const handleAddTask = () => {
    addTaskMutation.mutate("New Task");
  };

  const archiveSubject = (id: string) => {
    if (confirm("Are you sure? This will hide the subject from lists.")) {
      deleteSubjectMutation.mutate(id);
    }
  };

  const archiveTask = (id: string) => {
    deleteTaskMutation.mutate(id);
  };

  if (loading) {
    return (
      <AppLayout>
        <LoadingScreen message="Loading..." />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-12">
        {/* Subjects */}
        <section className="animate-fade-up">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="section-title mb-0">Subjects</h2>
            <button
              onClick={addNewSubject}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subject</span>
            </button>
          </div>

          <div className="surface-card divide-y divide-border">
            {subjects.map((subject, index) => (
              <div
                key={subject.id}
                className="flex items-center justify-between px-4 py-3 group animate-fade-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {editingSubject === subject.id ? (
                  <input
                    type="text"
                    defaultValue={subject.name}
                    autoFocus
                    className="input-minimal flex-1 mr-4"
                    onBlur={(e) => handleSubjectRename(subject.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSubjectRename(subject.id, e.currentTarget.value);
                      }
                      if (e.key === "Escape") {
                        setEditingSubject(null);
                      }
                    }}
                  />
                ) : (
                  <span
                    className="font-medium cursor-pointer hover:text-primary transition-colors"
                    onClick={() => setEditingSubject(subject.id)}
                  >
                    {subject.name}
                  </span>
                )}
                <button
                  onClick={() => archiveSubject(subject.id)}
                  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 text-muted-foreground hover:text-destructive transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label={`Delete ${subject.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {subjects.length === 0 && (
              <div className="px-4 py-8 text-center text-muted-foreground">
                No subjects yet. Add one to get started.
              </div>
            )}
          </div>
        </section>

        {/* Tasks */}
        <section className="animate-fade-up stagger-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="section-title mb-0">Tasks</h2>
            <button
              onClick={handleAddTask}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>

          <div className="surface-card divide-y divide-border">
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className="flex items-center justify-between px-4 py-3 group animate-fade-up"
                style={{ animationDelay: `${(index + 5) * 50}ms` }}
              >
                {editingTask === task.id ? (
                  <input
                    type="text"
                    defaultValue={task.name}
                    autoFocus
                    className="input-minimal flex-1 mr-4"
                    onBlur={(e) => handleTaskRename(task.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleTaskRename(task.id, e.currentTarget.value);
                      }
                      if (e.key === "Escape") {
                        setEditingTask(null);
                      }
                    }}
                  />
                ) : (
                  <span
                    className="font-medium cursor-pointer hover:text-primary transition-colors"
                    onClick={() => setEditingTask(task.id)}
                  >
                    {task.name}
                  </span>
                )}
                <button
                  onClick={() => archiveTask(task.id)}
                  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 text-muted-foreground hover:text-destructive transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label={`Delete ${task.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="px-4 py-8 text-center text-muted-foreground">
                No tasks yet. Add one to get started.
              </div>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
