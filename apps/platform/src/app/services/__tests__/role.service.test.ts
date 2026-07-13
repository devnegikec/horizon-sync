import { RoleService, ErrorType } from '../role.service';
import type { AppError } from '../role.service';
import type { Role, RoleFilters } from '../../types/role.types';

// Polyfill Response for jsdom environment
if (typeof globalThis.Response === 'undefined') {
  globalThis.Response = class Response {
    ok: boolean;
    status: number;
    headers: Map<string, string>;
    body: string | null;

    constructor(body?: string | null, init?: { status?: number; headers?: Record<string, string> }) {
      this.body = body ?? null;
      this.status = init?.status ?? 200;
      this.ok = this.status >= 200 && this.status < 300;
      this.headers = new Map(Object.entries(init?.headers ?? {}));
    }

    async json() {
      return this.body ? JSON.parse(this.body) : undefined;
    }

    async text() {
      return this.body ?? '';
    }
  } as unknown as typeof Response;
}

global.fetch = jest.fn();

const mockToken = 'test-token';

const mockRole: Role = {
  id: 'role-1',
  name: 'Editor',
  description: 'Can edit content',
  organization_id: 'org-1',
  is_system: false,
  is_active: true,
  permissions: [
    {
      id: 'perm-1',
      code: 'inventory.items.create',
      name: 'Create Items',
      resource: 'items',
      action: 'create',
      module: 'Inventory',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ],
  user_count: 5,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const defaultFilters: RoleFilters = {
  search: '',
  isSystem: null,
  isActive: null,
  page: 1,
  pageSize: 20,
};

function okResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

function errorResponse(status: number): Response {
  return new Response(null, { status });
}

describe('RoleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRoles', () => {
    it('should fetch roles with pagination params', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        okResponse({ data: [mockRole], pagination: { total_count: 1 } }),
      );

      const result = await RoleService.getRoles(defaultFilters, mockToken);

      expect(result.data).toHaveLength(1);
      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('skip=0');
      expect(url).toContain('limit=20');
      expect(url).toContain('include_permissions=true');
    });

    it('should include search filter when provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        okResponse({ data: [], pagination: {} }),
      );

      await RoleService.getRoles({ ...defaultFilters, search: 'admin' }, mockToken);

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('search=admin');
    });

    it('should include isSystem filter when not null', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        okResponse({ data: [], pagination: {} }),
      );

      await RoleService.getRoles({ ...defaultFilters, isSystem: true }, mockToken);

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('is_system=true');
    });

    it('should include isActive filter when not null', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        okResponse({ data: [], pagination: {} }),
      );

      await RoleService.getRoles({ ...defaultFilters, isActive: false }, mockToken);

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('is_active=false');
    });

    it('should throw NETWORK_ERROR on fetch TypeError', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new TypeError('Failed to fetch'),
      );

      try {
        await RoleService.getRoles(defaultFilters, mockToken);
        fail('Should have thrown');
      } catch (e) {
        const error = e as AppError;
        expect(error.type).toBe(ErrorType.NETWORK_ERROR);
        expect(error.retryable).toBe(true);
      }
    });

    it('should throw AUTH_ERROR on 401', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(errorResponse(401));

      try {
        await RoleService.getRoles(defaultFilters, mockToken);
        fail('Should have thrown');
      } catch (e) {
        const error = e as AppError;
        expect(error.type).toBe(ErrorType.AUTH_ERROR);
        expect(error.retryable).toBe(false);
      }
    });

    it('should throw PERMISSION_ERROR on 403', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(errorResponse(403));

      try {
        await RoleService.getRoles(defaultFilters, mockToken);
        fail('Should have thrown');
      } catch (e) {
        const error = e as AppError;
        expect(error.type).toBe(ErrorType.PERMISSION_ERROR);
      }
    });
  });

  describe('getRole', () => {
    it('should fetch a single role by ID', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(okResponse(mockRole));

      const result = await RoleService.getRole('role-1', mockToken);

      expect(result).toEqual(mockRole);
      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('/roles/role-1');
      expect(url).toContain('include_permissions=true');
    });

    it('should throw NOT_FOUND on 404', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(errorResponse(404));

      try {
        await RoleService.getRole('nonexistent', mockToken);
        fail('Should have thrown');
      } catch (e) {
        const error = e as AppError;
        expect(error.type).toBe(ErrorType.NOT_FOUND);
      }
    });
  });

  describe('deleteRole', () => {
    it('should delete a role', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(okResponse(undefined));

      await RoleService.deleteRole('role-1', mockToken);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/roles/role-1'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('should throw SERVER_ERROR on 500', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(errorResponse(500));

      try {
        await RoleService.deleteRole('role-1', mockToken);
        fail('Should have thrown');
      } catch (e) {
        const error = e as AppError;
        expect(error.type).toBe(ErrorType.SERVER_ERROR);
        expect(error.retryable).toBe(true);
      }
    });

    it('should throw VALIDATION_ERROR on 422', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(errorResponse(422));

      try {
        await RoleService.deleteRole('role-1', mockToken);
        fail('Should have thrown');
      } catch (e) {
        const error = e as AppError;
        expect(error.type).toBe(ErrorType.VALIDATION_ERROR);
      }
    });
  });

  describe('getGroupedPermissions', () => {
    it('should group permissions by resource field', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        okResponse({
          categories: [
            {
              name: 'Business Operations',
              permissions: [
                { id: 'p1', code: 'item.create', name: 'Item Create', resource: 'item', action: 'create', module: 'core' },
                { id: 'p2', code: 'item.read', name: 'Item Read', resource: 'item', action: 'read', module: 'core' },
                { id: 'p3', code: 'warehouse.read', name: 'Warehouse Read', resource: 'warehouse', action: 'read', module: 'core' },
              ],
            },
            {
              name: 'Identity & Access',
              permissions: [
                { id: 'p4', code: 'user.create', name: 'Create User', resource: 'user', action: 'create', module: 'identity' },
              ],
            },
          ],
        }),
      );

      const result = await RoleService.getGroupedPermissions(mockToken);

      // Grouped by resource, not by category name
      expect(result.data).toHaveProperty('item');
      expect(result.data).toHaveProperty('warehouse');
      expect(result.data).toHaveProperty('user');
      expect(result.data['item']).toHaveLength(2);
      expect(result.data['warehouse']).toHaveLength(1);
      expect(result.data['user']).toHaveLength(1);
    });

    it('should sort permissions within a resource by action order', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        okResponse({
          categories: [
            {
              name: 'Ops',
              permissions: [
                { id: 'p1', code: 'item.delete', name: 'Item Delete', resource: 'item', action: 'delete', module: 'core' },
                { id: 'p2', code: 'item.read', name: 'Item Read', resource: 'item', action: 'read', module: 'core' },
                { id: 'p3', code: 'item.create', name: 'Item Create', resource: 'item', action: 'create', module: 'core' },
              ],
            },
          ],
        }),
      );

      const result = await RoleService.getGroupedPermissions(mockToken);
      const actions = result.data['item'].map((p: { action: string }) => p.action);
      expect(actions).toEqual(['read', 'create', 'delete']);
    });

    it('should handle empty categories', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(okResponse({ categories: [] }));

      const result = await RoleService.getGroupedPermissions(mockToken);
      expect(result.data).toEqual({});
    });
  });

  describe('createRole', () => {
    it('should create a role with permission ID resolution', async () => {
      // First call: getPermissionIds fetches grouped permissions
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        okResponse({
          categories: [
            { name: 'Inventory', permissions: [{ id: 'perm-uuid-1', code: 'inventory.items.create' }] },
          ],
        }),
      );
      // Second call: actual create
      (global.fetch as jest.Mock).mockResolvedValueOnce(okResponse(mockRole));

      const result = await RoleService.createRole(
        { name: 'Editor', description: 'Can edit', permissions: ['inventory.items.create'] },
        mockToken,
        'org-1',
      );

      expect(result).toEqual(mockRole);
      const createCall = (global.fetch as jest.Mock).mock.calls[1];
      const body = JSON.parse(createCall[1].body);
      expect(body.name).toBe('Editor');
      expect(body.code).toBe('editor');
      expect(body.permission_ids).toEqual(['perm-uuid-1']);
      expect(body.organization_id).toBe('org-1');
    });
  });
});
