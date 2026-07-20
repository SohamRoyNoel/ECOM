import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Session } from './entities/session.entity';
import { CreateSessionParams } from '../../common/interfaces/createSessionParams';

export type SessionValidation =
  | { valid: true; session: Session }
  | { valid: false; reason: 'not_found' | 'revoked' | 'inactivity_timeout' | 'absolute_expiry' };

@Injectable()
export class SessionsService {
  private readonly inactivityTimeoutSeconds: number;

  constructor(
    @InjectRepository(Session) private readonly sessionRepo: Repository<Session>,
    private readonly config: ConfigService,
  ) {
    this.inactivityTimeoutSeconds = this.config.get<number>(
      'auth.sessionInactivityTimeoutSeconds',
    )!;
  }

  async create(params: CreateSessionParams, absoluteExpiresAt: Date): Promise<Session> {
    const now = new Date();
    const session = this.sessionRepo.create({
      userId: params.userId,
      jti: params.jti,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent?.slice(0, 512) ?? null,
      lastActivityAt: now,
      expiresAt: absoluteExpiresAt,
      revokedAt: null,
    });
    return this.sessionRepo.save(session);
  }

  async validateAndTouch(jti: string): Promise<SessionValidation> {
    const session = await this.sessionRepo.findOne({ where: { jti } });
    if (!session) return { valid: false, reason: 'not_found' };
    if (session.revokedAt) return { valid: false, reason: 'revoked' };

    const now = new Date();
    if (now.getTime() >= session.expiresAt.getTime()) {
      return { valid: false, reason: 'absolute_expiry' };
    }

    const inactiveForMs = now.getTime() - session.lastActivityAt.getTime();
    if (inactiveForMs > this.inactivityTimeoutSeconds * 1000) {
      await this.sessionRepo.update({ id: session.id }, { revokedAt: now });
      return { valid: false, reason: 'inactivity_timeout' };
    }

    session.lastActivityAt = now;
    await this.sessionRepo.update({ id: session.id }, { lastActivityAt: now });
    return { valid: true, session };
  }

  async revokeByJti(jti: string): Promise<void> {
    await this.sessionRepo.update({ jti }, { revokedAt: new Date() });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.sessionRepo.update({ userId, revokedAt: undefined }, { revokedAt: new Date() });
  }

  async purgeExpired(): Promise<number> {
    const result = await this.sessionRepo.delete({ expiresAt: LessThan(new Date()) });
    return result.affected ?? 0;
  }
}
