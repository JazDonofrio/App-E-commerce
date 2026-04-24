import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export const AuthCallback = () => {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash || "";
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const session_id = params.get("session_id");

    if (!session_id) {
      navigate("/", { replace: true });
      return;
    }

    (async () => {
      try {
        const { data } = await api.post("/auth/session", { session_id });
        // Remove hash & redirect to admin
        window.history.replaceState({}, document.title, "/admin");
        navigate("/admin", { replace: true, state: { user: data } });
        // Force a reload to re-run AuthProvider with fresh cookie
        window.location.reload();
      } catch {
        navigate("/", { replace: true });
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505]">
      <div className="text-center">
        <div className="font-display text-3xl uppercase tracking-tight text-[#DFFF00]">Autenticando...</div>
        <p className="text-zinc-500 mt-2 text-xs uppercase tracking-[0.2em]">Un segundo...</p>
      </div>
    </div>
  );
};
