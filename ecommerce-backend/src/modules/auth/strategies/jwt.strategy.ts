import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SessionsService } from '../../sessions/sessions.service';
import { UsersService } from '../../users/users.service';
import { AuthenticatedUser } from '../../../common/interfaces/authenticatedUser';
import { ERRORS } from '../../../common/Errors';

export interface JwtPayload {
  sub: string;
  jti: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly sessionsService: SessionsService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, 
      secretOrKey: config.get<string>('auth.jwtSecret'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
       console.log("-====> ", payload.jti)
    const validation = await this.sessionsService.validateAndTouch(payload.jti);
    if (!validation.valid) {
      const reasonMessages: Record<string, string> = {
        not_found: ERRORS.SESSION_NOT_FOUND,
        revoked: ERRORS.SESSION_REVOKED,
        inactivity_timeout: ERRORS.SESSION_EXPIRED_INACTIVITY,
        absolute_expiry: ERRORS.SESSION_EXPIRED,
      };
      throw new UnauthorizedException(reasonMessages[validation.reason]);
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException(ERRORS.ACCOUNT_INACTIVE);
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      sessionJti: payload.jti,
    };
  }
}
