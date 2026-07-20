import { UserRole } from '../../modules/users/entities/user.entity';

export interface DemoUserSeed {
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
}

export const DEMO_USERS: DemoUserSeed[] = [
  { email: 'admin@demo.local', username: 'admin', fullName: 'Ava Administrator', role: UserRole.ADMIN },
  { email: 'alice@demo.local', username: 'alice', fullName: 'Alice Nguyen', role: UserRole.CUSTOMER },
  { email: 'bob@demo.local', username: 'bob', fullName: 'Bob Martinez', role: UserRole.CUSTOMER },
  { email: 'carol@demo.local', username: 'carol', fullName: 'Carol Singh', role: UserRole.CUSTOMER },
  { email: 'dave@demo.local', username: 'dave', fullName: 'Dave O\u2019Brien', role: UserRole.CUSTOMER },
  { email: 'erin@demo.local', username: 'erin', fullName: 'Erin Kowalski', role: UserRole.CUSTOMER },
  { email: 'frank@demo.local', username: 'frank', fullName: 'Frank Osei', role: UserRole.CUSTOMER },
  { email: 'grace@demo.local', username: 'grace', fullName: 'Grace Kim', role: UserRole.CUSTOMER },
  { email: 'heidi@demo.local', username: 'heidi', fullName: 'Heidi Larsen', role: UserRole.CUSTOMER },
  { email: 'ivan@demo.local', username: 'ivan', fullName: 'Ivan Petrov', role: UserRole.CUSTOMER },
];
