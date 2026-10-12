import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { Button, Modal, cx } from "./ui";

const ToastContext = createContext(null);
const ConfirmContext = createContext(null);

const TOAST_STYLES = {
  success: ["border-emerald-200", CheckCircle2, "text-emerald-500"],
  error: ["border-rose-200", CircleAlert, "text-rose-500"],
  info: ["border-sky-200", Info, "text-sky-500"],
};

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);
  const [dialog, setDialog] = useState(null);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);
  const push = useCallback((tone, message) => {
    const id = nextId.current++;
    setToasts((list) => [...list.slice(-3), { id, tone, message }]);
    setTimeout(() => dismiss(id), tone === "error" ? 6000 : 3500);
  }, [dismiss]);

  const toast = useRef({
    success: (m) => push("success", m),
    error: (m) => push("error", m),
    info: (m) => push("info", m),
  }).current;

  const confirm = useCallback(
    (options) => new Promise((resolve) => setDialog({ ...options, resolve })),
    []
  );
  const close = (result) => { dialog?.resolve(result); setDialog(null); };

  return (
    <ToastContext.Provider value={toast}>
      <ConfirmContext.Provider value={confirm}>
        {children}
        <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-3 sm:items-end sm:pr-5">
          {toasts.map((t) => {
            const [border, Icon, iconColor] = TOAST_STYLES[t.tone];
            return (
              <div key={t.id} role="status" className={cx("animate-fade-up pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg", border)}>
                <Icon className={cx("mt-0.5 h-5 w-5 shrink-0", iconColor)} />
                <p className="flex-1 text-sm text-slate-700">{t.message}</p>
                <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-slate-300 hover:text-slate-500"><X className="h-4 w-4" /></button>
              </div>
            );
          })}
        </div>
        <Modal
          open={Boolean(dialog)} onClose={() => close(false)} title={dialog?.title || "Are you sure?"} size="sm"
          footer={<>
            <Button variant="secondary" onClick={() => close(false)}>Cancel</Button>
            <Button variant={dialog?.danger ? "danger" : "primary"} onClick={() => close(true)}>{dialog?.confirmLabel || "Confirm"}</Button>
          </>}
        >
          <p className="text-sm text-slate-600">{dialog?.message}</p>
        </Modal>
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
/** `const ok = await confirm({ title, message, confirmLabel, danger })` */
export const useConfirm = () => useContext(ConfirmContext);
