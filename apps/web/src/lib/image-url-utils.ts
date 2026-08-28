export const BUCKETS = {
  AVATARS: "avatars",
  EVENTS: "events",
  ORGANIZATIONS: "organizations",
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

export function isFullUrl(pathOrUrl: string | null | undefined): boolean {
  if (!pathOrUrl) return false;
  return (
    pathOrUrl.startsWith("http://") ||
    pathOrUrl.startsWith("https://") ||
    pathOrUrl.startsWith("blob:") ||
    pathOrUrl.startsWith("data:")
  );
}

export function isLocalPath(pathOrUrl: string | null | undefined): boolean {
  if (!pathOrUrl) return false;
  return pathOrUrl.startsWith("/");
}

export function getImageUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl) return "";
  if (isFullUrl(pathOrUrl) || isLocalPath(pathOrUrl)) {
    return pathOrUrl;
  }
  const prefix = process.env.NEXT_PUBLIC_STORAGE_URL || "";
  if (!prefix) return pathOrUrl;
  return `${prefix.replace(/\/+$/, "")}/${pathOrUrl.replace(/^\/+/, "")}`;
}

export function getAvatarUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl) return "";
  if (isFullUrl(pathOrUrl) || isLocalPath(pathOrUrl)) {
    return pathOrUrl;
  }
  const prefix = process.env.NEXT_PUBLIC_STORAGE_URL || "";
  if (!prefix) return pathOrUrl;
  return `${prefix.replace(/\/+$/, "")}/avatars/${pathOrUrl.replace(/^\/+/, "")}`;
}

export function getEventImageUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl) return "";
  if (isFullUrl(pathOrUrl) || isLocalPath(pathOrUrl)) {
    return pathOrUrl;
  }
  const prefix = process.env.NEXT_PUBLIC_STORAGE_URL || "";
  if (!prefix) return pathOrUrl;
  return `${prefix.replace(/\/+$/, "")}/events/${pathOrUrl.replace(/^\/+/, "")}`;
}

export function getOrgImageUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl) return "";
  if (isFullUrl(pathOrUrl) || isLocalPath(pathOrUrl)) {
    return pathOrUrl;
  }
  const prefix = process.env.NEXT_PUBLIC_STORAGE_URL || "";
  if (!prefix) return pathOrUrl;
  return `${prefix.replace(/\/+$/, "")}/organizations/${pathOrUrl.replace(/^\/+/, "")}`;
}
