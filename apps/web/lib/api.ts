const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type ApiOptions = RequestInit & {
  token?: string;
};

function formatIssues(issues: unknown) {
  if (!issues || typeof issues !== "object") return "";
  const fieldErrors = (issues as { fieldErrors?: Record<string, string[]> }).fieldErrors;
  if (!fieldErrors) return "";
  return Object.entries(fieldErrors)
    .flatMap(([field, messages]) => (messages ?? []).map((message) => `${field}: ${message}`))
    .join("; ");
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (options.token) headers.set("Authorization", `Bearer ${options.token}`);

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store"
  });

  const payload = await response.json();
  if (!response.ok || payload.success === false) {
    const issueMessage = formatIssues(payload.issues);
    throw new Error(issueMessage || payload.message || "Request failed");
  }
  return payload.data as T;
}

export function apiWebSocketUrl(path: string, params: Record<string, string>) {
  const baseUrl = new URL(API_URL);
  const protocol = baseUrl.protocol === "https:" ? "wss:" : "ws:";
  const normalizedPath = `${baseUrl.pathname.replace(/\/$/, "")}${path}`;
  const url = new URL(`${protocol}//${baseUrl.host}${normalizedPath}`);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}
