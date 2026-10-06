export interface FulfillmentResult {
	success: boolean;
	alreadyCompleted?: boolean;
	message?: string;
	error?: string;
	payment?: any;
	tickets?: any[];
	votesCount?: number;
}
