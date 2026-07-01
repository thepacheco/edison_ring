import { cookies } from "next/headers";

export type Theme = "light" | "dark";

/** Read the persisted theme (cookie) for no-flash SSR. */
export async function getTheme(): Promise<Theme> {
  try {
    const jar = await cookies();
    return jar.get("theme")?.value === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}
