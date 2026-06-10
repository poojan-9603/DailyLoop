import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as a percentage string, e.g. 0.73 -> "73%". */
export function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}
