import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type StartRequest, type InsertConfig } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError, redirectToLogin } from "@/lib/auth-utils";

// ============================================
// AUTOMATION & STATUS HOOKS
// ============================================

export function useAutomationStatus() {
  const { toast } = useToast();
  return useQuery({
    queryKey: [api.automation.status.path],
    queryFn: async () => {
      const res = await fetch(api.automation.status.path);
      if (res.status === 401) {
        redirectToLogin(toast);
        throw new Error("Unauthorized");
      }
      if (!res.ok) throw new Error("Failed to fetch status");
      return api.automation.status.responses[200].parse(await res.json());
    },
    refetchInterval: 2000, // Poll every 2 seconds
    retry: (failureCount, error: any) => {
      if (error?.message === "Unauthorized") return false;
      return failureCount < 3;
    }
  });
}

export function useStartAutomation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: StartRequest) => {
      const res = await fetch(api.automation.start.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (res.status === 401) {
        redirectToLogin(toast);
        throw new Error("Unauthorized");
      }

      if (!res.ok) {
        if (res.status === 400) {
          const errorData = await res.json();
          try {
            const validationError = api.automation.start.responses[400].parse(errorData);
            throw new Error(validationError.message);
          } catch {
             throw new Error(errorData.message || "Failed to start automation");
          }
        }
        throw new Error("Failed to start automation");
      }
      return api.automation.start.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.automation.status.path] });
      toast({
        title: "SYSTEM OVERRIDE: INITIATED",
        description: "Automation loop sequence started successfully.",
        className: "border-primary text-primary bg-black font-mono",
      });
    },
    onError: (error) => {
      if (error.message === "Unauthorized") return;
      toast({
        title: "ACCESS DENIED",
        description: error.message,
        variant: "destructive",
        className: "font-mono bg-black border-destructive text-destructive",
      });
    },
  });
}

export function useStopAutomation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.automation.stop.path, {
        method: "POST",
      });
      if (res.status === 401) {
        redirectToLogin(toast);
        throw new Error("Unauthorized");
      }
      if (!res.ok) throw new Error("Failed to stop automation");
      return api.automation.stop.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.automation.status.path] });
      toast({
        title: "SYSTEM HALTED",
        description: "Automation sequence terminated by user.",
        variant: "destructive",
        className: "font-mono bg-black border-destructive text-destructive",
      });
    },
  });
}

// ============================================
// CONFIGURATION HOOKS
// ============================================

export function useConfigs() {
  const { toast } = useToast();
  return useQuery({
    queryKey: [api.configs.list.path],
    queryFn: async () => {
      const res = await fetch(api.configs.list.path);
      if (res.status === 401) {
        redirectToLogin(toast);
        throw new Error("Unauthorized");
      }
      if (!res.ok) throw new Error("Failed to fetch config");
      return api.configs.list.responses[200].parse(await res.json());
    },
    retry: (failureCount, error: any) => {
      if (error?.message === "Unauthorized") return false;
      return failureCount < 3;
    }
  });
}

export function useSaveConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertConfig) => {
      const validated = api.configs.save.input.parse(data);
      const res = await fetch(api.configs.save.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      if (res.status === 401) {
        redirectToLogin(toast);
        throw new Error("Unauthorized");
      }
      if (!res.ok) throw new Error("Failed to save config");
      return api.configs.save.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.configs.list.path] });
      toast({
        title: "DATA UPLINK ESTABLISHED",
        description: "Configuration parameters saved to local storage matrix.",
        className: "border-primary text-primary bg-black font-mono",
      });
    },
    onError: (error) => {
      if (error.message === "Unauthorized") return;
      toast({
        title: "UPLOAD FAILED",
        description: error.message || "Could not save configuration parameters.",
        variant: "destructive",
        className: "bg-black border-destructive text-destructive font-mono",
      });
    }
  });
}

export function useDeleteConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.configs.delete.path, { id });
      const res = await fetch(url, {
        method: "DELETE",
      });
      if (res.status === 401) {
        redirectToLogin(toast);
        throw new Error("Unauthorized");
      }
      if (!res.ok) throw new Error("Failed to delete config");
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.configs.list.path] });
      toast({
        title: "CONFIG PURGED",
        description: "Configuration entry deleted successfully.",
        variant: "destructive",
        className: "font-mono bg-black border-destructive text-destructive",
      });
    },
  });
}

// ============================================
// UPLOAD HOOKS
// ============================================

export function useUploadImages() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => formData.append("images", file));

      const res = await fetch(api.upload.images.path, {
        method: "POST",
        body: formData,
      });

      if (res.status === 401) {
        redirectToLogin(toast);
        throw new Error("Unauthorized");
      }

      if (!res.ok) throw new Error("Upload failed");
      return api.upload.images.responses[200].parse(await res.json());
    }
  });
}
