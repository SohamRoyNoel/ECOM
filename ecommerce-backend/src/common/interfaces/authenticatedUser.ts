import { UserRole } from "../../modules/users/entities/user.entity";

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
  sessionJti: string;
}