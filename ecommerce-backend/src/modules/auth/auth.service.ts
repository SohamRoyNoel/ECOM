import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { RateLimiterService } from '../../common/rate-limit/rate-limiter.service';
import { LoginDto } from './dto/login.dto';
import { LoginResult } from '../../common/interfaces/loginResult';
import { CONSTANTS } from '../../common/CONSTANTS';
import { ERRORS } from '../../common/Errors';

export class TooManyRequestsException extends HttpException {
  constructor(message: string, retryAfterSeconds: number) {
    super({ message, retryAfterSeconds }, HttpStatus.TOO_MANY_REQUESTS);
  }
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private readonly ipMax: number;
  private readonly ipWindow: number;
  private readonly lockoutMax: number;
  private readonly lockoutWindow: number;
  private readonly lockoutDuration: number;

  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly jwtService: JwtService,
    private readonly rateLimiter: RateLimiterService,
    private readonly config: ConfigService,
  ) {
    this.ipMax = this.config.get<number>('loginProtection.ipMaxAttempts')!;
    this.ipWindow = this.config.get<number>('loginProtection.ipWindowSeconds')!;
    this.lockoutMax = this.config.get<number>('loginProtection.lockoutMaxAttempts')!;
    this.lockoutWindow = this.config.get<number>('loginProtection.lockoutWindowSeconds')!;
    this.lockoutDuration = this.config.get<number>('loginProtection.lockoutDurationSeconds')!;
  }

  async login(
    dto: LoginDto,
    context: { ip: string; userAgent: string | null },
  ): Promise<LoginResult> {
    const identifierKey = dto.identifier.trim().toLowerCase();

    // EP protection
    const ipResult = await this.rateLimiter.hit(`rl:login:ip:${context.ip}`, this.ipMax, this.ipWindow);
    if (!ipResult.allowed) {
      this.logger.log(`User login attempt failed with:  ${identifierKey}: Reason TOO MANY REQUESTS`);
      throw new TooManyRequestsException(
        ERRORS.TOO_MANY_ATTEMPTS,
        ipResult.retryAfterSeconds,
      );
    }

    // Lock mechanism
    const lockKey = `rl:login:lock:${identifierKey}`;
    const lockState = await this.rateLimiter.peek(lockKey, 1);
    if (!lockState.allowed) {
      this.logger.log(`User login attempt failed with:  ${identifierKey}: Reason FORBIDDEN | TEMP BLOCK`);
      throw new ForbiddenException({
        message: `${ERRORS.TEMPORARY_BLOCK} ${lockState.retryAfterSeconds}s.`,
        retryAfterSeconds: lockState.retryAfterSeconds,
      });
    }

    // Clean flow
    const user = await this.usersService.findByEmailOrUsernameWithPassword(dto.identifier.trim());
    const genericError = ERRORS.INVALID_CREDENTIALS;

    if (!user || !user.isActive) {
      this.logger.log(`User login attempt failed with:  ${identifierKey}: Reason USER NOT ACTIVE`);
      await this.registerFailedAttempt(identifierKey);
      throw new UnauthorizedException(genericError);
    }

    const passwordMatches = await argon2.verify(user.passwordHash, dto.password).catch(() => false);
    if (!passwordMatches) {
      this.logger.log(`User login attempt failed with:  ${identifierKey}: Reason WRONG PASSWORD`);
      await this.registerFailedAttempt(identifierKey);
      throw new UnauthorizedException(genericError);
    }

    // success
    await this.rateLimiter.reset(`rl:login:attempts:${identifierKey}`);
    await this.rateLimiter.reset(lockKey);
    // Last login
    await this.usersService.touchLastLogin(user.id);

    const jti = uuidv4();
    const expiresIn = this.config.get<string>('auth.jwtAbsoluteExpiresIn')!;
    const absoluteExpiresAt = new Date(Date.now() + this.parseDurationMs(expiresIn));

    await this.sessionsService.create(
      { userId: user.id, jti, ipAddress: context.ip, userAgent: context.userAgent },
      absoluteExpiresAt,
    );

    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, jti },
      { expiresIn },
    );

    this.logger.log(`User logged in successfully from ${identifierKey}`);

    return {
      accessToken,
      expiresIn
    };
  }

  async logout(sessionJti: string): Promise<void> {
    await this.sessionsService.revokeByJti(sessionJti);
  }

  private async registerFailedAttempt(identifierKey: string): Promise<void> {
    const result = await this.rateLimiter.hit(
      `rl:login:attempts:${identifierKey}`,
      this.lockoutMax,
      this.lockoutWindow,
    );
    if (!result.allowed) {
      // Attempts > the window: lock account
      await this.rateLimiter.hit(`rl:login:lock:${identifierKey}`, 1, this.lockoutDuration);
      this.logger.warn(`Account "${identifierKey}" ${ERRORS.REPEATED_FAILED_ATTEMPTS}`);
    }
  }

  private parseDurationMs(duration: string): number {
    const match = new RegExp(CONSTANTS.DURATION_REGEX).exec(duration.trim());
    if (!match) return 12 * 60 * 60 * 1000; // 12h
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const unitMs: Record<string, number> = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    return value * unitMs[unit];
  }
}
