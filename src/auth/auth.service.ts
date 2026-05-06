import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { eq, and, lt } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_TOKEN } from '../database/database.module';
import { REDIS_CLIENT } from '../redis/redis.module';
import { users, sessions } from '../database/schema';
import * as schema from '../database/schema';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: NodePgDatabase<typeof schema>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto, ipAddress: string, userAgent: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, dto.email.toLowerCase()))
      .limit(1);

    if (!user) {
      // Timing-safe: still run bcrypt to avoid timing attacks
      await bcrypt.compare(dto.password, '$2b$12$invalidhashtopreventtimingattacks');
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Cuenta desactivada. Contacte al administrador');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Revoke expired sessions
    await this.cleanExpiredSessions(user.id);

    const sessionId = uuidv4();
    const { accessToken, refreshToken } = await this.generateTokens(user, sessionId);

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.db.insert(sessions).values({
      id: sessionId,
      userId: user.id,
      refreshTokenHash,
      ipAddress,
      userAgent,
      deviceInfo: userAgent?.substring(0, 500),
      expiresAt,
    });

    // Update last login
    await this.db
      .update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, user.id));

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async refreshTokens(userId: string, sessionId: string, refreshToken: string) {
    const [session] = await this.db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
      .limit(1);

    if (!session || session.isRevoked || new Date() > session.expiresAt) {
      throw new UnauthorizedException('Sesión inválida o expirada');
    }

    const isTokenValid = await bcrypt.compare(refreshToken, session.refreshTokenHash);
    if (!isTokenValid) {
      // Possible token reuse attack — revoke all sessions
      await this.revokeAllSessions(userId);
      throw new UnauthorizedException('Token de refresco inválido');
    }

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario inválido');
    }

    const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(user, sessionId);
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);

    await this.db
      .update(sessions)
      .set({ refreshTokenHash: newRefreshTokenHash, updatedAt: new Date() })
      .where(eq(sessions.id, sessionId));

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string, sessionId: string) {
    await this.db
      .update(sessions)
      .set({ isRevoked: true, updatedAt: new Date() })
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));

    // Blacklist the access token in Redis (TTL = JWT access expiry)
    const ttl = 15 * 60; // 15 minutes
    await this.redis.setex(`blacklist:${sessionId}`, ttl, '1');
  }

  async logoutAll(userId: string) {
    await this.revokeAllSessions(userId);
  }

  async getSessions(userId: string) {
    return this.db
      .select({
        id: sessions.id,
        deviceInfo: sessions.deviceInfo,
        ipAddress: sessions.ipAddress,
        createdAt: sessions.createdAt,
        expiresAt: sessions.expiresAt,
        isRevoked: sessions.isRevoked,
      })
      .from(sessions)
      .where(eq(sessions.userId, userId));
  }

  async revokeSession(userId: string, sessionId: string) {
    await this.db
      .update(sessions)
      .set({ isRevoked: true, updatedAt: new Date() })
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));
  }

  private async generateTokens(user: typeof users.$inferSelect, sessionId: string) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async cleanExpiredSessions(userId: string) {
    await this.db
      .update(sessions)
      .set({ isRevoked: true })
      .where(and(eq(sessions.userId, userId), lt(sessions.expiresAt, new Date())));
  }

  private async revokeAllSessions(userId: string) {
    await this.db
      .update(sessions)
      .set({ isRevoked: true, updatedAt: new Date() })
      .where(eq(sessions.userId, userId));
  }
}
