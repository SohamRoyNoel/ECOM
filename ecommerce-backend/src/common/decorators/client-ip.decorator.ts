import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Extracts the client IP
export const ClientIp = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  return request.ip || request.connection?.remoteAddress || 'unknown';
});
