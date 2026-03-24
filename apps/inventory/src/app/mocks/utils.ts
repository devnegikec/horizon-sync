import { tokenPayloads } from "./data/auth";

/**
 * Resolves tenant_id from the Bearer token in the request.
 * Falls back to "tenant-001" for unauthenticated mock calls.
 */
export function resolveTenant(request: Request): string {
  const auth = request.headers.get("Authorization") ?? "";
  const token = auth.replace("Bearer ", "");
  const payload = tokenPayloads[token] as any;
  return payload?.tenant_id ?? "tenant-001";
}

/**
 * Generic paginator — wraps any array into the standard paginated response shape.
 */
export function paginate<T>(items: T[], page: number, pageSize: number) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    items: items.slice(start, end),
    pagination: {
      page,
      page_size: pageSize,
      total_items: totalItems,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1,
    },
  };
}
