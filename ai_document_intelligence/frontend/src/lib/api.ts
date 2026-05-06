export function getApiBase(): string {
  const raw = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
  return String(raw).replace(/\/+$/, '');
}
