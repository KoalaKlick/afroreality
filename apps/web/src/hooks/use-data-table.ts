"use client";
import type { ColumnDef, Table, TableOptions } from "@tanstack/react-table";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";

export type { ColumnDef, Table };

export function useDataTable<TData>(
	data: TData[],
	columns: ColumnDef<TData, unknown>[],
	options?: Omit<TableOptions<TData>, "columns" | "data" | "getCoreRowModel">,
) {
	return useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		...options,
	});
}

export type {
	ColumnFiltersState,
	PaginationState,
	SortingState,
	VisibilityState,
} from "@tanstack/react-table";
