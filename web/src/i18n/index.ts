import { it, type Messages } from "./locales/it";
import { en } from "./locales/en";

export type Locale = "it" | "en";

const catalogs: Record<Locale, Messages> = { it, en };

export const defaultLocale: Locale = "it";

export function getMessages(locale: Locale = defaultLocale): Messages {
  return catalogs[locale] ?? catalogs[defaultLocale];
}

/** Simple nested key lookup with `{param}` interpolation */
export function t(
  messages: Messages,
  path: string,
  params?: Record<string, string | number>
): string {
  const parts = path.split(".");
  let cur: unknown = messages;
  for (const part of parts) {
    if (cur && typeof cur === "object" && part in cur) {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return path;
    }
  }
  if (typeof cur !== "string") return path;
  if (!params) return cur;
  return Object.entries(params).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    cur
  );
}

export type { Messages };
