"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@belezafoco/ui";
import {
  getJson,
  postJson,
  readCookie
} from "@/lib/browser-auth";

interface WorkspaceSummary {
  id: string;
  name: string;
  role: {
    code: string;
    name: string;
  };
}

interface SessionState {
  authenticated: boolean;
  user: {
    email: string;
    fullName: string;
  } | null;
  workspace: WorkspaceSummary | null;
  workspaces: WorkspaceSummary[];
}

const emptyState: SessionState = {
  authenticated: false,
  user: null,
  workspace: null,
  workspaces: []
};

export function AppSessionControls() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<SessionState>(emptyState);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    if (!readCookie("bf_csrf_token")) {
      setSession(emptyState);
      router.replace(`/login?next=${encodeURIComponent(pathname || "/app")}`);
      return () => {
        active = false;
      };
    }

    void getJson<SessionState>("/api/me/session")
      .then((payload) => {
        if (!active) {
          return;
        }

        setSession(payload);
        if (!payload.authenticated) {
          router.replace(`/login?next=${encodeURIComponent(pathname || "/app")}`);
        }
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setError("Nao foi possivel carregar a sessao.");
      });

    return () => {
      active = false;
    };
  }, [pathname, router]);

  const activeWorkspaceId = session.workspace?.id ?? "";
  const roleLabel = useMemo(() => session.workspace?.role.name ?? "Sessao", [session.workspace]);

  function handleWorkspaceChange(nextWorkspaceId: string) {
    if (!nextWorkspaceId || nextWorkspaceId === activeWorkspaceId) {
      return;
    }

    startTransition(async () => {
      try {
        const payload = await postJson<SessionState>("/api/me/workspaces/select", {
          workspaceId: nextWorkspaceId
        });
        setSession(payload);
        setError(null);
        router.refresh();
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Nao foi possivel trocar o workspace."
        );
      }
    });
  }

  function handleLogout() {
    startTransition(async () => {
      try {
        await postJson("/api/auth/logout", {});
        setSession(emptyState);
        router.replace("/login");
        router.refresh();
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Nao foi possivel encerrar a sessao."
        );
      }
    });
  }

  if (!session.authenticated) {
    return (
      <div className="rounded-[24px] border border-amber-200 bg-white/80 px-4 py-3 text-sm font-medium text-slate-600">
        Verificando sessao...
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-[220px] items-center gap-3 rounded-full border border-slate-200 bg-white/80 px-4 py-3 text-sm font-medium text-slate-600">
          <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
            Workspace
          </span>
          <select
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-950 outline-none"
            disabled={isPending}
            value={activeWorkspaceId}
            onChange={(event) => handleWorkspaceChange(event.target.value)}
          >
            {session.workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
        </label>
        <div className="rounded-full border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600">
          <span className="font-semibold text-slate-950">{session.user?.fullName}</span>
          <span className="mx-2 text-slate-300">•</span>
          <span>{roleLabel}</span>
        </div>
        <Button variant="secondary" size="sm" disabled={isPending} onClick={handleLogout}>
          Sair
        </Button>
      </div>
      {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
    </>
  );
}
