import { Test, TestingModule } from '@nestjs/testing';
import { M01AbilityFactory, M01UserWithPermissions } from './m01-ability.factory';

describe('M01AbilityFactory', () => {
  let factory: M01AbilityFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [M01AbilityFactory],
    }).compile();

    factory = module.get<M01AbilityFactory>(M01AbilityFactory);
  });

  describe('createForUser', () => {
    it('should grant manage all permissions for admin role', () => {
      const adminUser: M01UserWithPermissions = {
        id: 'user-123',
        email: 'admin@example.com',
        roles: [
          {
            id: 'role-123',
            name: 'admin',
            role_permissions: [],
          },
        ],
      };

      const ability = factory.createForUser(adminUser);

      expect(ability.can('manage', 'all')).toBe(true);
      expect(ability.can('create', 'User')).toBe(true);
      expect(ability.can('update', 'Role')).toBe(true);
      expect(ability.can('delete', 'Permission')).toBe(true);
    });

    it('should grant manage all permissions for super_admin role', () => {
      const superAdminUser: M01UserWithPermissions = {
        id: 'user-123',
        email: 'superadmin@example.com',
        roles: [
          {
            id: 'role-123',
            name: 'super_admin',
            role_permissions: [],
          },
        ],
      };

      const ability = factory.createForUser(superAdminUser);

      expect(ability.can('manage', 'all')).toBe(true);
    });

    it('should build abilities from permissions for non-admin user', () => {
      const regularUser: M01UserWithPermissions = {
        id: 'user-123',
        email: 'user@example.com',
        roles: [
          {
            id: 'role-123',
            name: 'viewer',
            role_permissions: [
              {
                permission: {
                  id: 'perm-1',
                  name: 'users:read',
                  resource: 'users',
                  action: 'read',
                },
              },
              {
                permission: {
                  id: 'perm-2',
                  name: 'roles:read',
                  resource: 'roles',
                  action: 'read',
                },
              },
            ],
          },
        ],
      };

      const ability = factory.createForUser(regularUser);

      expect(ability.can('read', 'User')).toBe(true);
      expect(ability.can('read', 'Role')).toBe(true);
      expect(ability.can('create', 'User')).toBe(false);
      expect(ability.can('delete', 'User')).toBe(false);
      expect(ability.can('manage', 'all')).toBe(false);
    });

    it('should handle user with no roles', () => {
      const noRolesUser: M01UserWithPermissions = {
        id: 'user-123',
        email: 'user@example.com',
        roles: [],
      };

      const ability = factory.createForUser(noRolesUser);

      expect(ability.can('read', 'User')).toBe(false);
      expect(ability.can('manage', 'all')).toBe(false);
    });

    it('should handle multiple roles with different permissions', () => {
      const multiRoleUser: M01UserWithPermissions = {
        id: 'user-123',
        email: 'user@example.com',
        roles: [
          {
            id: 'role-1',
            name: 'viewer',
            role_permissions: [
              {
                permission: {
                  id: 'perm-1',
                  name: 'users:read',
                  resource: 'users',
                  action: 'read',
                },
              },
            ],
          },
          {
            id: 'role-2',
            name: 'editor',
            role_permissions: [
              {
                permission: {
                  id: 'perm-2',
                  name: 'users:update',
                  resource: 'users',
                  action: 'update',
                },
              },
            ],
          },
        ],
      };

      const ability = factory.createForUser(multiRoleUser);

      expect(ability.can('read', 'User')).toBe(true);
      expect(ability.can('update', 'User')).toBe(true);
      expect(ability.can('delete', 'User')).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin role', () => {
      const adminUser: M01UserWithPermissions = {
        id: 'user-123',
        email: 'admin@example.com',
        roles: [
          {
            id: 'role-123',
            name: 'admin',
            role_permissions: [],
          },
        ],
      };

      expect(factory.isAdmin(adminUser)).toBe(true);
    });

    it('should return true for super_admin role', () => {
      const superAdminUser: M01UserWithPermissions = {
        id: 'user-123',
        email: 'superadmin@example.com',
        roles: [
          {
            id: 'role-123',
            name: 'super_admin',
            role_permissions: [],
          },
        ],
      };

      expect(factory.isAdmin(superAdminUser)).toBe(true);
    });

    it('should return false for non-admin user', () => {
      const regularUser: M01UserWithPermissions = {
        id: 'user-123',
        email: 'user@example.com',
        roles: [
          {
            id: 'role-123',
            name: 'viewer',
            role_permissions: [],
          },
        ],
      };

      expect(factory.isAdmin(regularUser)).toBe(false);
    });

    it('should return false for user with no roles', () => {
      const noRolesUser: M01UserWithPermissions = {
        id: 'user-123',
        email: 'user@example.com',
        roles: [],
      };

      expect(factory.isAdmin(noRolesUser)).toBe(false);
    });

    it('should return true if one of many roles is admin', () => {
      const mixedRolesUser: M01UserWithPermissions = {
        id: 'user-123',
        email: 'user@example.com',
        roles: [
          {
            id: 'role-1',
            name: 'viewer',
            role_permissions: [],
          },
          {
            id: 'role-2',
            name: 'admin',
            role_permissions: [],
          },
        ],
      };

      expect(factory.isAdmin(mixedRolesUser)).toBe(true);
    });
  });
});
