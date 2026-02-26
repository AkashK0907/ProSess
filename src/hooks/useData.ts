import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionsApi, subjectsApi, tasksApi } from "@/lib/api";
import { isTokenValid } from "@/lib/auth";
import { getSessions, StudySession, addSession, updateSession, deleteSession, syncOfflineSessions } from "@/lib/sessionStorage";
import { getSubjects, Subject, addSubject, updateSubject, deleteSubject } from "@/lib/subjectStorage";
import { getTasks, getTaskCompletions, TrackedTask, TaskCompletion, addTask, updateTask, deleteTask } from "@/lib/taskStorage";

// Keys
export const QUERY_KEYS = {
  sessions: "sessions",
  subjects: "subjects",
  tasks: "tasks",
  completions: "completions",
  stats: "stats",
  user: "user",
};

// User Hook
import { getCurrentUser } from "@/lib/auth";
import { authApi } from "@/lib/api";

export const useUser = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.user],
    queryFn: async () => {
      // Re-check at query time — the token may have expired since mount
      if (!isTokenValid()) return null;
      return await getCurrentUser();
    },
    enabled: isTokenValid(),
    staleTime: 5 * 60 * 1000, // 5 minutes (reduced from 1h to fix stale nulls)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnMount: true, // Ensure we check on navigation
    refetchOnWindowFocus: true,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name?: string; email?: string; phone?: string; password?: string }) => {
      return await authApi.updateUser(data);
    },
    onSuccess: (data) => {
      queryClient.setQueryData([QUERY_KEYS.user], data.user);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.user] });
    },
  });
};

// Sessions Hook
export const useSessions = () => {
  const queryClient = useQueryClient();

  // Run offline sync once on mount — OUTSIDE the query fn so React Query
  // doesn't get confused by side-effects inside queryFn.
  useEffect(() => {
    (async () => {
      const synced = await syncOfflineSessions();
      if (synced) {
        // Force a fresh fetch from the server so the just-synced sessions appear.
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.sessions] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useQuery({
    queryKey: [QUERY_KEYS.sessions],
    queryFn: async () => {
      // Use storage function which handles API + Cache + Retry + Offline fallback
      return await getSessions();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

// Subjects Hook
export const useSubjects = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.subjects],
    queryFn: async () => {
      return await getSubjects();
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
  });
};

// Tasks Hook
export const useTasks = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.tasks],
    queryFn: async () => {
      return await getTasks();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
};

// Task Completions Hook
export const useTaskCompletions = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.completions],
    queryFn: async () => {
      return await getTaskCompletions();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

// Add Session Mutation

export const useAddSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ subject, minutes, date, notes }: { subject: string; minutes: number; date?: Date; notes?: string }) => {
      return await addSession(subject, minutes, date, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.sessions] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
    },
  });
};

export const useUpdateSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<StudySession> }) => {
      return await updateSession(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.sessions] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
    },
  });
};

export const useDeleteSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await deleteSession(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.sessions] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
    },
  });
};

// --- Subject Mutations ---

export const useAddSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => await addSubject(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.subjects] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.sessions] }); // In case deleted subjects affect sessions
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
    },
  });
};

export const useUpdateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => await updateSubject(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.subjects] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
    },
  });
};

export const useDeleteSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => await deleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.subjects] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
    },
  });
};

// --- Task Mutations ---

export const useAddTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => await addTask(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tasks] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => await updateTask(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tasks] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => await deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tasks] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
    },
  });
};
