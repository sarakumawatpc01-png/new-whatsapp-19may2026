import * as React from "react";
import { ToastProps, ToastActionElement } from "./toast";

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const TOAST_LIMIT = 5;
let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

type Action =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "UPDATE_TOAST"; toast: Partial<ToasterToast> }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string };

interface State {
  toasts: ToasterToast[];
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return { ...state, toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };
    case "UPDATE_TOAST":
      return { ...state, toasts: state.toasts.map((t) => t.id === action.toast.id ? { ...t, ...action.toast } : t) };
    case "DISMISS_TOAST":
      return { ...state, toasts: state.toasts.map((t) => t.id === action.toastId ? { ...t, open: false } : t) };
    case "REMOVE_TOAST":
      return { ...state, toasts: action.toastId ? state.toasts.filter((t) => t.id !== action.toastId) : [] };
  }
};

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((l) => l(memoryState));
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => { listeners.splice(listeners.indexOf(setState), 1); };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

function toast({ ...props }: Omit<ToasterToast, "id" | "open" | "onOpenChange">) {
  const id = genId();
  dispatch({
    type: "ADD_TOAST",
    toast: { ...props, id, open: true, onOpenChange: (open) => !open && dispatch({ type: "DISMISS_TOAST", toastId: id }) } as ToasterToast,
  });
  return { id, dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId: id }) };
}

export { toast };
