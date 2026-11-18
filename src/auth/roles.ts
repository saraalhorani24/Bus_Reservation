export const UserRole = {
  ADMIN: 'admin',
  SECRETARY: 'secretary',
  CUSTOMER: 'customer',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ALL_USER_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.SECRETARY,
  UserRole.CUSTOMER,
];
