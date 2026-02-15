import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma';
import { M01AbilityFactory, M01UserWithPermissions } from '../casl/m01-ability.factory';

/**
 * Extended request with user and CASL ability
 */
export interface M01AdminRequest {
  user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    session_id: string;
  };
  ability?: ReturnType<M01AbilityFactory['createForUser']>;
  userWithPermissions?: M01UserWithPermissions;
}

/**
 * Guard that enforces admin-only access using CASL RBAC
 */
@Injectable()
export class M01AdminGuard implements CanActivate {
  private readonly logger = new Logger(M01AdminGuard.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly abilityFactory: M01AbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<M01AdminRequest>();
    const user = request.user;

    if (!user) {
      this.logger.warn('Admin guard: No authenticated user found');
      throw new ForbiddenException('Authentication required');
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
      this.logger.warn(`Admin guard: User not found: ${user.id}`);
      throw new ForbiddenException('User not found');
    }

    // Transform to M01UserWithPermissions format
    const userWithPermissions: M01UserWithPermissions = {
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

    // Check if user is admin
    const isAdmin = this.abilityFactory.isAdmin(userWithPermissions);

    if (!isAdmin) {
      this.logger.warn(
        `Admin guard: User ${user.email} attempted admin access without admin role`,
      );
      throw new ForbiddenException('Admin access required');
    }

    // Attach ability and user with permissions to request for use in controllers
    request.ability = ability;
    request.userWithPermissions = userWithPermissions;

    this.logger.log(`Admin guard: Admin access granted for user ${user.email}`);
    return true;
  }
}
