export interface SafeUserDto {
  id: string;
  email: string;
  fullName: string;
  username?: string | null;
  role?: string;
  avatarUrl?: string | null;
  phone?: string | null;
  createdAt: string | Date;
}

export interface SessionPayload {
  userId: string;
  email: string;
  username?: string;
  fullName?: string;
  role?: string;
  currentOrganizationId?: string | null;
  onboardingCompleted?: boolean;
}

export interface AuthSession {
  userId: string;
  email: string;
  role?: string;
  currentOrganizationId?: string | null;
  onboardingCompleted?: boolean;
}

export interface AuthResponseDto {
  success: boolean;
  user?: SafeUserDto | null;
  error?: string;
  token?: string;
  message?: string;
}
