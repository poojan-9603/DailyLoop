"use client";

import * as React from "react";
import type { ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 4000;

type ToastInput = Omit<ToastProps, "id"> & {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
};

type ToastState = ToastInput & { id: string; open: boolean };

type Action =
  | { type: "ADD"; toast: ToastState }
  | { type: "DISMISS"; id: string }
  | { type: "REMOVE"; id: string };

let count = 0;
function genId() {
  count = (count + 1) % 999;
  return String(count);
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const listeners: Array<(state: ToastState[]) => void> = [];
let memState: ToastState[] = [];

function dispatch(action: Action) {
  memState = reducer(memState, action);
  listeners.forEach((l) => l(memState));
}

function reducer(state: ToastState[], action: Action): ToastState[] {
  switch (action.type) {
    case "ADD":
      return [action.toast, ...state].slice(0, TOAST_LIMIT);
    case "DISMISS":
      return state.map((t) => (t.id === action.id ? { ...t, open: false } : t));
    case "REMOVE":
      return state.filter((t) => t.id !== action.id);
  }
}

function scheduleRemove(id: string) {
  if (toastTimeouts.has(id)) return;
  toastTimeouts.set(
    id,
    setTimeout(() => {
      toastTimeouts.delete(id);
      dispatch({ type: "REMOVE", id });
    }, TOAST_REMOVE_DELAY),
  );
}

export function toast(props: ToastInput) {
  const id = props.id ?? genId();
  dispatch({ type: "ADD", toast: { ...props, id, open: true } });
  scheduleRemove(id);
  return id;
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastState[]>(memState);

  React.useEffect(() => {
    listeners.push(setToasts);
    return () => {
      const idx = listeners.indexOf(setToasts);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  return {
    toasts,
    toast,
    dismiss: (id: string) => dispatch({ type: "DISMISS", id }),
  };
}
