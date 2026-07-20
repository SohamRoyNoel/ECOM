export interface CreateSessionParams {
  userId: string;
  jti: string;
  ipAddress: string | null;
  userAgent: string | null;
}