"use client";
import { createContext, useContext } from 'react';

export const ORG_SEARCH_KEY = 'org';

export interface OrganizationContextType {
  activeOrgId?: string | null;
  setActiveOrgId?: (id: string) => void;
}

export const OrganizationContext = createContext<OrganizationContextType>({});

export function useOrganization() {
  return useContext(OrganizationContext);
}
