import {
  AbilityBuilder,
  AbilityClass,
  PureAbility,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';

/**
 * M21 Observation roles
 * - admin_nacional: Full administrative access to all observations
 * - supervisor_pedagogico: Can view and manage observations in their region/scope
 * - observador: Can create and upload observation recordings
 * - revisor: Can view recordings and create annotations
 */
export const M21_ROLES = {
  ADMIN_NACIONAL: 'admin_nacional',
  SUPERVISOR_PEDAGOGICO: 'supervisor_pedagogico',
  OBSERVADOR: 'observador',
  REVISOR: 'revisor',
} as const;

export type M21Role = typeof M21_ROLES[keyof typeof M21_ROLES];

/**
 * Subjects that CASL can check permissions against for M21
 */
export type M21Subjects =
  | 'StorageBucket'
  | 'ObservationRecording'
  | 'Transcript'
  | 'AIReport'
  | 'Annotation'
  | 'ReviewProgress'
  | 'all';

/**
 * Actions that can be performed on M21 subjects
 */
export type M21Action = 'manage' | 'create' | 'read' | 'update' | 'delete' | 'upload';

/**
 * CASL ability type for M21 module
 */
export type M21Ability = PureAbility<[M21Action, M21Subjects]>;

/**
 * User with roles and permissions for M21 ability building
 */
export interface M21UserWithPermissions {
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
 * Factory for creating CASL abilities based on user roles for M21 Observations module
 */
@Injectable()
export class M21AbilityFactory {
  /**
   * Create ability instance for a user
   */
  createForUser(user: M21UserWithPermissions): M21Ability {
    const { can, build } = new AbilityBuilder<M21Ability>(
      PureAbility as AbilityClass<M21Ability>,
    );

    // Get user's role names
    const roleNames = user.roles.map((role) => role.name.toLowerCase());

    // Check for specific M21 roles
    const isAdminNacional = roleNames.includes(M21_ROLES.ADMIN_NACIONAL) ||
                            roleNames.includes('admin') ||
                            roleNames.includes('super_admin');
    const isSupervisorPedagogico = roleNames.includes(M21_ROLES.SUPERVISOR_PEDAGOGICO);
    const isObservador = roleNames.includes(M21_ROLES.OBSERVADOR);
    const isRevisor = roleNames.includes(M21_ROLES.REVISOR);

    if (isAdminNacional) {
      // Admin nacional has full access to everything
      can('manage', 'all');
    } else {
      // Supervisor pedagogico can manage observations in their scope
      if (isSupervisorPedagogico) {
        can('read', 'StorageBucket');
        can('read', 'ObservationRecording');
        can('read', 'Transcript');
        can('read', 'AIReport');
        can('manage', 'Annotation');
        can('manage', 'ReviewProgress');
      }

      // Observador can upload recordings
      if (isObservador) {
        can('read', 'StorageBucket');
        can('create', 'ObservationRecording');
        can('upload', 'ObservationRecording');
        can('read', 'ObservationRecording');
        can('update', 'ObservationRecording');
      }

      // Revisor can view and annotate
      if (isRevisor) {
        can('read', 'StorageBucket');
        can('read', 'ObservationRecording');
        can('read', 'Transcript');
        can('read', 'AIReport');
        can('create', 'Annotation');
        can('read', 'Annotation');
        can('update', 'Annotation');
        can('manage', 'ReviewProgress');
      }

      // Also check generic permissions from role_permissions
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
   * Map resource string to CASL subject for M21
   */
  private mapResourceToSubject(resource: string): M21Subjects | null {
    const resourceMap: Record<string, M21Subjects> = {
      storage_bucket: 'StorageBucket',
      storage_buckets: 'StorageBucket',
      m21_storage_bucket: 'StorageBucket',
      m21_storage_buckets: 'StorageBucket',
      observation_recording: 'ObservationRecording',
      observation_recordings: 'ObservationRecording',
      m21_observation_recording: 'ObservationRecording',
      m21_observation_recordings: 'ObservationRecording',
      transcript: 'Transcript',
      transcripts: 'Transcript',
      m21_transcript: 'Transcript',
      m21_transcripts: 'Transcript',
      ai_report: 'AIReport',
      ai_reports: 'AIReport',
      m21_ai_report: 'AIReport',
      m21_ai_reports: 'AIReport',
      annotation: 'Annotation',
      annotations: 'Annotation',
      m21_annotation: 'Annotation',
      m21_annotations: 'Annotation',
      review_progress: 'ReviewProgress',
      m21_review_progress: 'ReviewProgress',
    };

    return resourceMap[resource.toLowerCase()] || null;
  }

  /**
   * Map action string to CASL action
   */
  private mapActionToCaslAction(action: string): M21Action | null {
    const actionMap: Record<string, M21Action> = {
      manage: 'manage',
      create: 'create',
      read: 'read',
      update: 'update',
      delete: 'delete',
      upload: 'upload',
      '*': 'manage',
    };

    return actionMap[action.toLowerCase()] || null;
  }

  /**
   * Check if user has admin role
   */
  isAdmin(user: M21UserWithPermissions): boolean {
    return user.roles.some(
      (role) =>
        role.name.toLowerCase() === 'admin' ||
        role.name.toLowerCase() === 'super_admin' ||
        role.name.toLowerCase() === M21_ROLES.ADMIN_NACIONAL,
    );
  }

  /**
   * Check if user has supervisor role
   */
  isSupervisor(user: M21UserWithPermissions): boolean {
    return user.roles.some(
      (role) => role.name.toLowerCase() === M21_ROLES.SUPERVISOR_PEDAGOGICO,
    );
  }

  /**
   * Check if user has observador role
   */
  isObservador(user: M21UserWithPermissions): boolean {
    return user.roles.some(
      (role) => role.name.toLowerCase() === M21_ROLES.OBSERVADOR,
    );
  }

  /**
   * Check if user has revisor role
   */
  isRevisor(user: M21UserWithPermissions): boolean {
    return user.roles.some(
      (role) => role.name.toLowerCase() === M21_ROLES.REVISOR,
    );
  }

  /**
   * Check if user has any M21 observation role
   */
  hasObservationRole(user: M21UserWithPermissions): boolean {
    return (
      this.isAdmin(user) ||
      this.isSupervisor(user) ||
      this.isObservador(user) ||
      this.isRevisor(user)
    );
  }
}
