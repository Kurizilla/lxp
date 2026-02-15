import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { M21AbilityFactory, M21UserWithPermissions } from '../casl/m21-ability.factory';

/**
 * Extended request with user and CASL ability for M21
 */
export interface M21ObservationsRequest {
  user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    session_id: string;
  };
  ability?: ReturnType<M21AbilityFactory['createForUser']>;
  userWithPermissions?: M21UserWithPermissions;
}

/**
 * Guard that enforces M21 observation module access using CASL RBAC
 * Allows users with roles: admin_nacional, supervisor_pedagogico, observador, revisor
 */
@Injectable()
export class M21ObservationsGuard implements CanActivate {
  private readonly logger = new Logger(M21ObservationsGuard.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly abilityFactory: M21AbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<M21ObservationsRequest>();
    const user = request.user;

    if (!user) {
      this.logger.warn('M21 guard: No authenticated user found');
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'Authentication required',
      });
    }

    // Fetch user with roles and permissions
    const userWithRoles = await this.prisma.m01_users.findUnique({
      where: { id: user.id },
      include: {
        user_roles: {
          include: {
            role: {
              include: {
                role_permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!userWithRoles) {
      this.logger.warn(`M21 guard: User not found: ${user.id}`);
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'User not found',
      });
    }

    // Transform to M21UserWithPermissions format
    const userWithPermissions: M21UserWithPermissions = {
      id: userWithRoles.id,
      email: userWithRoles.email,
      roles: userWithRoles.user_roles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        role_permissions: ur.role.role_permissions.map((rp) => ({
          permission: {
            id: rp.permission.id,
            name: rp.permission.name,
            resource: rp.permission.resource,
            action: rp.permission.action,
          },
        })),
      })),
    };

    // Create CASL ability
    const ability = this.abilityFactory.createForUser(userWithPermissions);

    // Check if user has any observation role
    const hasRole = this.abilityFactory.hasObservationRole(userWithPermissions);

    if (!hasRole) {
      this.logger.warn(
        `M21 guard: User ${user.email} attempted observation access without required role`,
      );
      throw new ForbiddenException({
        type: 'https://httpstatuses.com/403',
        title: 'Forbidden',
        status: 403,
        detail: 'Observation access requires one of: admin_nacional, supervisor_pedagogico, observador, revisor',
      });
    }

    // Attach ability and user with permissions to request for use in controllers
    request.ability = ability;
    request.userWithPermissions = userWithPermissions;

    this.logger.log(`M21 guard: Observation access granted for user ${user.email}`);
    return true;
  }
}
