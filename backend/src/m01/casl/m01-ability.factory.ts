import {
  AbilityBuilder,
  AbilityClass,
  PureAbility,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';

/**
 * Subjects that CASL can check permissions against
 */
export type M01Subjects =
  | 'User'
  | 'Role'
  | 'Permission'
  | 'Session'
  | 'Institution'
  | 'Subject'
  | 'Classroom'
  | 'Enrollment'
  | 'all';

/**
 * Actions that can be performed on subjects
 */
export type M01Action = 'manage' | 'create' | 'read' | 'update' | 'delete';

/**
 * CASL ability type for M01 module
 */
export type M01Ability = PureAbility<[M01Action, M01Subjects]>;

/**
 * User with roles and permissions for ability building
 */
export interface M01UserWithPermissions {
  id: string;
  email: string;
  roles: Array<{
    id: string;
    name: string;
    role_permissions: Array<{
      permission: {
        id: string;
        name: string;
        resource: string;
        action: string;
      };
    }>;
  }>;
}

/**
 * Factory for creating CASL abilities based on user roles and permissions
 */
@Injectable()
export class M01AbilityFactory {
  /**
   * Create ability instance for a user
   */
  createForUser(user: M01UserWithPermissions): M01Ability {
    const { can, build } = new AbilityBuilder<M01Ability>(
      PureAbility as AbilityClass<M01Ability>,
    );

    // Check if user has admin role
    const isAdmin = user.roles.some(
      (role) => role.name === 'admin' || role.name === 'super_admin',
    );

    if (isAdmin) {
      // Admins can manage everything
      can('manage', 'all');
    } else {
      // Build abilities from user permissions
      for (const role of user.roles) {
        for (const rolePermission of role.role_permissions) {
          const { resource, action } = rolePermission.permission;
          const subject = this.mapResourceToSubject(resource);
          const caslAction = this.mapActionToCaslAction(action);

          if (subject && caslAction) {
            can(caslAction, subject);
          }
        }
      }
    }

    return build();
  }

  /**
   * Map resource string to CASL subject
   */
  private mapResourceToSubject(resource: string): M01Subjects | null {
    const resourceMap: Record<string, M01Subjects> = {
      user: 'User',
      users: 'User',
      role: 'Role',
      roles: 'Role',
      permission: 'Permission',
      permissions: 'Permission',
      session: 'Session',
      sessions: 'Session',
      institution: 'Institution',
      institutions: 'Institution',
      subject: 'Subject',
      subjects: 'Subject',
      classroom: 'Classroom',
      classrooms: 'Classroom',
      enrollment: 'Enrollment',
      enrollments: 'Enrollment',
    };

    return resourceMap[resource.toLowerCase()] || null;
  }

  /**
   * Map action string to CASL action
   */
  private mapActionToCaslAction(action: string): M01Action | null {
    const actionMap: Record<string, M01Action> = {
      manage: 'manage',
      create: 'create',
      read: 'read',
      update: 'update',
      delete: 'delete',
      '*': 'manage',
    };

    return actionMap[action.toLowerCase()] || null;
  }

  /**
   * Check if user is an admin
   */
  isAdmin(user: M01UserWithPermissions): boolean {
    return user.roles.some(
      (role) => role.name === 'admin' || role.name === 'super_admin',
    );
  }
}
