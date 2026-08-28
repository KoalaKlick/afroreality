// src/components/event/voting-manager/VotingManager.tsx
import { CategoryList } from "./CategoryList";
import type { CategoryItem } from "./CategorySheet";

interface VotingManagerProps {
	readonly event: {
		id: string;
		title: string;
		votingMode?: string;
	};
	readonly categories: CategoryItem[];
	readonly onRefresh?: () => void;
	readonly canEdit?: boolean;
	readonly isSheetOpen?: boolean;
	readonly onSheetOpenChange?: (open: boolean) => void;
}

export function VotingManager({
	event,
	categories,
	onRefresh,
	canEdit = true,
	isSheetOpen,
	onSheetOpenChange,
}: VotingManagerProps) {
	return (
		<div className="space-y-6">
			<CategoryList
				eventId={event.id}
				categories={categories}
				votingMode={event.votingMode}
				onRefresh={onRefresh}
				canEdit={canEdit}
				isSheetOpen={isSheetOpen}
				onSheetOpenChange={onSheetOpenChange}
			/>
		</div>
	);
}
