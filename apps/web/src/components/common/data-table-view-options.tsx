import type { Table } from "@tanstack/react-table";
import { Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface DataTableViewOptionsProps<TData> {
	table: Table<TData>;
}

export function DataTableViewOptions<TData>({
	table,
}: DataTableViewOptionsProps<TData>) {
	const columns = table.getAllColumns();
	return (
		<div className="flex items-center space-x-2">
			<Button
				variant="outline"
				size="sm"
				className="ml-auto hidden h-8 lg:flex"
			>
				<Settings2 className="mr-2 h-4 w-4" />
				View ({columns.length})
			</Button>
		</div>
	);
}
