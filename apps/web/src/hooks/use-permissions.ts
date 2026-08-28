"use client";
export function usePermissions(role?: string | null) {
  const isOwner = role === 'owner' || role === 'admin' || !role;
  return {
    canManageEvents: true,
    canManageTickets: true,
    canManageVoting: true,
    canManageMembers: isOwner,
    canManageOrganization: isOwner,
    canManageSettings: isOwner,
    canManagePayouts: isOwner,
    canWithdraw: isOwner,
    role: (role || 'owner') as 'owner',
  };
}
