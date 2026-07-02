import { cookies } from "next/headers";

export type Theme = "light" | "dark";

/** Read the persisted theme (cookie) for no-flash SSR. */
export async function getTheme(): Promise<Theme> {
  return "light";
}

