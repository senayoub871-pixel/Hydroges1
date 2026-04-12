import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getDocuments,
  getUsers,
  createDocument,
  deleteDocument,
  signDocument,
  sendDocument,
} from "@workspace/api-client-react";
import type {
  Document,
  GetDocumentsStatus,
  CreateDocument,
  SignDocument,
  SendDocument,
} from "@workspace/api-client-react";

type CreateDocumentLocal = CreateDocument & {
  recipientName?: string;
  status?: string;
};

export interface AppDocumentParams {
  status?: GetDocumentsStatus;
  role?: "sender" | "recipient";
  unsignedOnly?: boolean;
}

// ─── Documents ────────────────────────────────────────────────────────────────

export function useAppDocuments(params?: AppDocumentParams) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["app-documents", params?.status, params?.role, params?.unsignedOnly, user?.id],
    queryFn: async () => {
      const apiParams = params?.status ? { status: params.status } : undefined;
      let data: Document[] = await getDocuments(apiParams);

      if (params?.role === "sender") {
        data = data.filter((d) => d.senderId === user?.id);
      } else if (params?.role === "recipient") {
        data = data.filter((d) => d.recipientId === user?.id);
      }

      if (params?.unsignedOnly) {
        data = data.filter((d) => !d.signedAt);
      }

      return data;
    },
    enabled: !!user,
    refetchInterval: 30_000,
  });
}

// ─── Users ────────────────────────────────────────────────────────────────────

export function useAppUsers() {
  return useQuery({
    queryKey: ["app-users"],
    queryFn: () => getUsers(),
  });
}

// ─── Create document ──────────────────────────────────────────────────────────

export function useAppCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDocumentLocal) => {
      const { recipientName: _rn, status: _s, ...apiPayload } = data;
      const body: CreateDocument & { status?: string } = {
        ...apiPayload,
        ...(data.status ? { status: data.status } : {}),
      };
      return await createDocument(body as CreateDocument);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-documents"] });
    },
  });
}

// ─── Sign document ────────────────────────────────────────────────────────────

export function useAppSignDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: SignDocument }) => {
      return await signDocument(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-documents"] });
    },
  });
}

// ─── Send document ────────────────────────────────────────────────────────────

export function useAppSendDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: SendDocument }) => {
      return await sendDocument(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-documents"] });
    },
  });
}

// ─── Delete document ──────────────────────────────────────────────────────────

export function useAppDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await deleteDocument(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-documents"] });
    },
  });
}

// ─── Profile / Signature ──────────────────────────────────────────────────────

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string | null;
  signatureImage: string | null;
}

function getToken() {
  return localStorage.getItem("hydroges_token") || "";
}

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async (): Promise<UserProfile> => {
      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Impossible de charger le profil");
      return res.json();
    },
    enabled: !!user,
  });
}

export function useUpdateSignature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (signatureImage: string | null) => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ signatureImage }),
      });
      if (!res.ok) throw new Error("Impossible de mettre à jour la signature");
      return res.json() as Promise<UserProfile>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

// ─── Scheduled auto-dispatcher ────────────────────────────────────────────────

export function useScheduledDispatcher(onDispatched?: (title: string) => void) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const lastCheckRef = useRef<number>(0);

  useEffect(() => {
    if (!user) return;

    const check = async () => {
      const now = Date.now();
      if (now - lastCheckRef.current < 30_000) return;
      lastCheckRef.current = now;

      try {
        const allDocs = await getDocuments();
        const due = allDocs.filter(
          (d) =>
            d.senderId === user.id &&
            d.status === "scheduled" &&
            d.scheduledAt &&
            new Date(d.scheduledAt).getTime() <= now
        );

        for (const doc of due) {
          try {
            await sendDocument(doc.id, { scheduledAt: null });
            onDispatched?.(doc.title);
          } catch {
            // ignore individual failures
          }
        }

        if (due.length > 0) {
          queryClient.invalidateQueries({ queryKey: ["app-documents"] });
        }
      } catch {
        // ignore network errors
      }
    };

    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, [queryClient, onDispatched, user]);
}
