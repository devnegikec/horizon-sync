export const users = [
  {
    id: "user-001",
    tenant_id: "tenant-001",
    email: "admin@acmepharma.com",
    name: "Admin User",
    roles: ["admin"],
    is_active: true,
  },
  {
    id: "user-002",
    tenant_id: "tenant-001",
    email: "ops@acmepharma.com",
    name: "Ops Manager",
    roles: ["operator"],
    is_active: true,
  },
  {
    id: "user-003",
    tenant_id: "tenant-002",
    email: "admin@luxbrand.com",
    name: "LuxBrand Admin",
    roles: ["admin"],
    is_active: true,
  },
];

// Pre-built JWT-like tokens for MSW — not real JWTs, just mock payloads
export const mockTokens: Record<string, string> = {
  "admin@acmepharma.com": "mock-jwt-tenant001-admin",
  "ops@acmepharma.com": "mock-jwt-tenant001-ops",
  "admin@luxbrand.com": "mock-jwt-tenant002-admin",
};

// What each token decodes to (used by MSW to resolve tenant/user)
export const tokenPayloads: Record<string, object> = {
  "mock-jwt-tenant001-admin": {
    sub: "user-001",
    tenant_id: "tenant-001",
    email: "admin@acmepharma.com",
    roles: ["admin"],
  },
  "mock-jwt-tenant001-ops": {
    sub: "user-002",
    tenant_id: "tenant-001",
    email: "ops@acmepharma.com",
    roles: ["operator"],
  },
  "mock-jwt-tenant002-admin": {
    sub: "user-003",
    tenant_id: "tenant-002",
    email: "admin@luxbrand.com",
    roles: ["admin"],
  },
};
