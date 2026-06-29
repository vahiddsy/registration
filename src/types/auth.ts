export type UserRole = 'ADMIN' | 'OPERATOR';

export interface AppUser {
  id: string;
  fullname: string;
  username: string;
  role: UserRole;
  active: boolean;
  forcePasswordChange: boolean;
}
