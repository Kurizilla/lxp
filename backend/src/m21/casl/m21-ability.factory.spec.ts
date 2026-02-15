import { M21AbilityFactory, M21UserWithPermissions, M21_ROLES } from './m21-ability.factory';

describe('M21AbilityFactory', () => {
  let factory: M21AbilityFactory;

  beforeEach(() => {
    factory = new M21AbilityFactory();
  });

  describe('createForUser', () => {
    it('should grant full access to admin_nacional', () => {
      const user: M21UserWithPermissions = {
        id: 'user-1',
        email: 'admin@test.com',
        roles: [{ id: 'r1', name: 'admin_nacional', role_permissions: [] }],
      };

      const ability = factory.createForUser(user);

      expect(ability.can('manage', 'all')).toBe(true);
      expect(ability.can('create', 'StorageBucket')).toBe(true);
      expect(ability.can('delete', 'ObservationRecording')).toBe(true);
    });

    it('should grant full access to super_admin', () => {
      const user: M21UserWithPermissions = {
        id: 'user-1',
        email: 'superadmin@test.com',
        roles: [{ id: 'r1', name: 'super_admin', role_permissions: [] }],
      };

      const ability = factory.createForUser(user);

      expect(ability.can('manage', 'all')).toBe(true);
    });

    it('should grant supervisor_pedagogico appropriate permissions', () => {
      const user: M21UserWithPermissions = {
        id: 'user-1',
        email: 'supervisor@test.com',
        roles: [{ id: 'r1', name: 'supervisor_pedagogico', role_permissions: [] }],
      };

      const ability = factory.createForUser(user);

      expect(ability.can('read', 'StorageBucket')).toBe(true);
      expect(ability.can('read', 'ObservationRecording')).toBe(true);
      expect(ability.can('read', 'Transcript')).toBe(true);
      expect(ability.can('read', 'AIReport')).toBe(true);
      expect(ability.can('manage', 'Annotation')).toBe(true);
      expect(ability.can('manage', 'ReviewProgress')).toBe(true);
      expect(ability.can('create', 'StorageBucket')).toBe(false);
    });

    it('should grant observador appropriate permissions', () => {
      const user: M21UserWithPermissions = {
        id: 'user-1',
        email: 'observador@test.com',
        roles: [{ id: 'r1', name: 'observador', role_permissions: [] }],
      };

      const ability = factory.createForUser(user);

      expect(ability.can('read', 'StorageBucket')).toBe(true);
      expect(ability.can('create', 'ObservationRecording')).toBe(true);
      expect(ability.can('upload', 'ObservationRecording')).toBe(true);
      expect(ability.can('read', 'ObservationRecording')).toBe(true);
      expect(ability.can('update', 'ObservationRecording')).toBe(true);
      expect(ability.can('delete', 'ObservationRecording')).toBe(false);
      expect(ability.can('create', 'Annotation')).toBe(false);
    });

    it('should grant revisor appropriate permissions', () => {
      const user: M21UserWithPermissions = {
        id: 'user-1',
        email: 'revisor@test.com',
        roles: [{ id: 'r1', name: 'revisor', role_permissions: [] }],
      };

      const ability = factory.createForUser(user);

      expect(ability.can('read', 'StorageBucket')).toBe(true);
      expect(ability.can('read', 'ObservationRecording')).toBe(true);
      expect(ability.can('read', 'Transcript')).toBe(true);
      expect(ability.can('read', 'AIReport')).toBe(true);
      expect(ability.can('create', 'Annotation')).toBe(true);
      expect(ability.can('read', 'Annotation')).toBe(true);
      expect(ability.can('update', 'Annotation')).toBe(true);
      expect(ability.can('manage', 'ReviewProgress')).toBe(true);
      expect(ability.can('create', 'ObservationRecording')).toBe(false);
    });

    it('should respect role_permissions for custom permissions', () => {
      const user: M21UserWithPermissions = {
        id: 'user-1',
        email: 'custom@test.com',
        roles: [
          {
            id: 'r1',
            name: 'custom_role',
            role_permissions: [
              {
                permission: {
                  id: 'p1',
                  name: 'read_transcripts',
                  resource: 'transcript',
                  action: 'read',
                },
              },
            ],
          },
        ],
      };

      const ability = factory.createForUser(user);

      expect(ability.can('read', 'Transcript')).toBe(true);
      expect(ability.can('create', 'Transcript')).toBe(false);
    });

    it('should handle users with no roles', () => {
      const user: M21UserWithPermissions = {
        id: 'user-1',
        email: 'noroles@test.com',
        roles: [],
      };

      const ability = factory.createForUser(user);

      expect(ability.can('read', 'StorageBucket')).toBe(false);
      expect(ability.can('manage', 'all')).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin_nacional', () => {
      const user: M21UserWithPermissions = {
        id: 'user-1',
        email: 'admin@test.com',
        roles: [{ id: 'r1', name: 'admin_nacional', role_permissions: [] }],
      };

      expect(factory.isAdmin(user)).toBe(true);
    });

    it('should return true for admin role', () => {
      const user: M21UserWithPermissions = {
        id: 'user-1',
        email: 'admin@test.com',
        roles: [{ id: 'r1', name: 'admin', role_permissions: [] }],
      };

      expect(factory.isAdmin(user)).toBe(true);
    });

    it('should return false for non-admin roles', () => {
      const user: M21UserWithPermissions = {
        id: 'user-1',
        email: 'observador@test.com',
        roles: [{ id: 'r1', name: 'observador', role_permissions: [] }],
      };

      expect(factory.isAdmin(user)).toBe(false);
    });
  });

  describe('isSupervisor', () => {
    it('should return true for supervisor_pedagogico', () => {
      const user: M21UserWithPermissions = {
        id: 'user-1',
        email: 'supervisor@test.com',
        roles: [{ id: 'r1', name: 'supervisor_pedagogico', role_permissions: [] }],
      };

      expect(factory.isSupervisor(user)).toBe(true);
    });

    it('should return false for non-supervisor roles', () => {
      const user: M21UserWithPermissions = {
        id: 'user-1',
        email: 'observador@test.com',
        roles: [{ id: 'r1', name: 'observador', role_permissions: [] }],
      };

      expect(factory.isSupervisor(user)).toBe(false);
    });
  });

  describe('isObservador', () => {
    it('should return true for observador role', () => {
      const user: M21UserWithPermissions = {
        id: 'user-1',
        email: 'observador@test.com',
        roles: [{ id: 'r1', name: 'observador', role_permissions: [] }],
      };

      expect(factory.isObservador(user)).toBe(true);
    });
  });

  describe('isRevisor', () => {
    it('should return true for revisor role', () => {
      const user: M21UserWithPermissions = {
        id: 'user-1',
        email: 'revisor@test.com',
        roles: [{ id: 'r1', name: 'revisor', role_permissions: [] }],
      };

      expect(factory.isRevisor(user)).toBe(true);
    });
  });

  describe('hasObservationRole', () => {
    it('should return true for any observation role', () => {
      const roles = [
        M21_ROLES.ADMIN_NACIONAL,
        M21_ROLES.SUPERVISOR_PEDAGOGICO,
        M21_ROLES.OBSERVADOR,
        M21_ROLES.REVISOR,
      ];

      roles.forEach((roleName) => {
        const user: M21UserWithPermissions = {
          id: 'user-1',
          email: `${roleName}@test.com`,
          roles: [{ id: 'r1', name: roleName, role_permissions: [] }],
        };

        expect(factory.hasObservationRole(user)).toBe(true);
      });
    });

    it('should return false for users without observation roles', () => {
      const user: M21UserWithPermissions = {
        id: 'user-1',
        email: 'teacher@test.com',
        roles: [{ id: 'r1', name: 'teacher', role_permissions: [] }],
      };

      expect(factory.hasObservationRole(user)).toBe(false);
    });
  });
});
