import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to Italian locale string
 */
export function formatDate(
  date: string | Date | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    ...options,
  });
}

/**
 * Format a date to short format (DD/MM/YYYY)
 */
export function formatDateShort(date: string | Date | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Calculate age from birth date to death date or today
 */
export function calculateAge(
  birthDate: string | Date,
  deathDate?: string | Date | null
): number {
  const birth = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  const end = deathDate
    ? typeof deathDate === "string"
      ? new Date(deathDate)
      : deathDate
    : new Date();

  let age = end.getFullYear() - birth.getFullYear();
  const monthDiff = end.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Generate a URL-friendly slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .trim()
    .replace(/\s+/g, "-"); // Replace spaces with hyphens
}

/**
 * Generate a unique memorial slug
 */
export function generateMemorialSlug(
  firstName: string,
  lastName: string,
  birthYear?: string | null
): string {
  const base = `${firstName}-${lastName}`;
  const slug = generateSlug(base);
  return birthYear ? `${slug}-${birthYear}` : slug;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "…";
}

/**
 * Format file size to human readable
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Get initials from a name
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  const lastPart = parts[parts.length - 1];
  return (
    parts[0].charAt(0).toUpperCase() +
    (lastPart ? lastPart.charAt(0).toUpperCase() : "")
  );
}

/**
 * Check if user can perform action based on memorial permissions
 */
export function checkMemorialPermission(
  userId: string | undefined,
  memorialUserId: string,
  guardianIds: string[]
): {
  isOwner: boolean;
  isGuardian: boolean;
  canEdit: boolean;
} {
  if (!userId) return { isOwner: false, isGuardian: false, canEdit: false };

  const isOwner = userId === memorialUserId;
  const isGuardian = guardianIds.includes(userId);
  const canEdit = isOwner || isGuardian;
  return { isOwner, isGuardian, canEdit };
}

/**
 * Sanitize HTML content (basic)
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Create a debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Generate a nonce for CSP
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}
