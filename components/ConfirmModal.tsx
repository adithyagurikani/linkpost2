"use client";

import { useEffect, createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary" | "warning";
  loading?: boolean;
}

interface ConfirmContextType {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType>({
  confirm: () => Promise.resolve(false),
});

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    opts: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ opts, resolve });
    });
  }, []);

  const handleConfirm = () => {
    state?.resolve(true);
    setState(null);
  };

  const handleCancel = () => {
    state?.resolve(false);
    setState(null);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!state) {
    return <>{children}</>;
  }

  const { opts } = state;
  const isDanger = opts.variant === "danger";
  const isWarning = opts.variant === "warning";

  return (
    <>
      {children}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleCancel}
        />
        <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 animate-modal-in">
          <button
            onClick={handleCancel}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div
              className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                isDanger ? "bg-red-100" : isWarning ? "bg-amber-100" : "bg-gray-100"
              }`}
            >
              <AlertTriangle
                className={`w-5 h-5 ${
                  isDanger ? "text-red-600" : isWarning ? "text-amber-600" : "text-black"
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900">{opts.title}</h3>
              <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
                {opts.message}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={handleCancel}
              disabled={opts.loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              {opts.cancelLabel || "Cancel"}
            </button>
            <button
              onClick={handleConfirm}
              disabled={opts.loading}
              className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 ${
                isDanger
                  ? "bg-red-600 hover:bg-red-700"
                  : isWarning
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-black hover:bg-gray-800"
              }`}
            >
              {opts.loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {opts.confirmLabel || (isDanger ? "Delete" : "Confirm")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
