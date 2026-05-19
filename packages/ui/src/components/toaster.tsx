import { useToast } from "./use-toast";
import { Toast } from "./toast";
import { ToastClose } from "./toast";
import { ToastTitle } from "./toast";
import { ToastDescription } from "./toast";
import { ToastAction } from "./toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast}>
          <div className="grid gap-1">
            {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
            {toast.description && (
              <ToastDescription>{toast.description}</ToastDescription>
            )}
          </div>
          {toast.action}
          <ToastClose onClick={() => dismiss(toast.id)} />
        </Toast>
      ))}
    </div>
  );
}
