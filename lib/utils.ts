import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Kết hợp class Tailwind an toàn, tránh xung đột (ví dụ: bg-red-500 + bg-blue-500) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
