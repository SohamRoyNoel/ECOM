import { Exclude, Expose } from 'class-transformer';
import { UserRole } from '../entities/user.entity';

@Exclude()
export class UserResponseDto {
  @Expose() id!: string;
  @Expose() email!: string;
  @Expose() username!: string;
  @Expose() fullName!: string;
  @Expose() role!: UserRole;
  @Expose() createdAt!: Date;
}
