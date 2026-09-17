"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { OrganizationInfo } from "@/lib/constants/navigation";

export const ORG_SEARCH_KEY = "org";

export interface OrganizationContextType {
	organizations: OrganizationInfo[];
	activeOrgId: string | null;
	activeOrg: OrganizationInfo | null;
	role: "owner" | "admin" | "member" | string | null;
	setActiveOrgId: (id: string | null) => void;
}

export const OrganizationContext = createContext<OrganizationContextType>({
	organizations: [],
	activeOrgId: null,
	activeOrg: null,
	role: null,
	setActiveOrgId: () => {},
});

export function OrganizationProvider({
	children,
	organizations = [],
	initialActiveOrgId = null,
}: {
	children: React.ReactNode;
	organizations: OrganizationInfo[];
	initialActiveOrgId?: string | null;
}) {
	const searchParams = useSearchParams();
	const [selectedOrgId, setSelectedOrgId] = useState<string | null>(initialActiveOrgId);

	const searchOrg = searchParams?.get(ORG_SEARCH_KEY);
	const effectiveOrgId =
		(selectedOrgId && organizations.some((o) => o.id === selectedOrgId) ? selectedOrgId : null) ??
		(searchOrg && organizations.some((o) => o.id === searchOrg) ? searchOrg : null) ??
		(initialActiveOrgId && organizations.some((o) => o.id === initialActiveOrgId) ? initialActiveOrgId : null) ??
		organizations[0]?.id ??
		null;

	const activeOrg =
		organizations.find((org) => org.id === effectiveOrgId) ??
		organizations[0] ??
		null;

	const role = (activeOrg?.role as "owner" | "admin" | "member") ?? null;

	useEffect(() => {
		if (searchOrg && organizations.some((o) => o.id === searchOrg)) {
			setSelectedOrgId(searchOrg);
		} else if (initialActiveOrgId && organizations.some((o) => o.id === initialActiveOrgId)) {
			setSelectedOrgId(initialActiveOrgId);
		}
	}, [searchOrg, initialActiveOrgId, organizations]);

	return (
		<OrganizationContext.Provider
			value={{
				organizations,
				activeOrgId: effectiveOrgId,
				activeOrg,
				role,
				setActiveOrgId: setSelectedOrgId,
			}}
		>
			{children}
		</OrganizationContext.Provider>
	);
}

export function useOrganization() {
	return useContext(OrganizationContext);
}
