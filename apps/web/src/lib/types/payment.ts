export interface Transaction {
  id: string;
  reference: string;
  walletId: string;
  paymentId?: string | null;
  type: 'credit' | 'debit';
  category: 'ticket_purchase' | 'vote_purchase' | 'subscription' | 'refund' | 'commission_payout' | 'wallet_topup' | 'wallet_withdrawal' | 'transfer' | 'fee' | 'bonus' | 'adjustment';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'reversed';
  amount: number;
  currency: string;
  feeAmount?: number;
  balanceBefore?: number | null;
  balanceAfter?: number | null;
  description?: string | null;
  completedAt?: string | Date | null;
  createdAt: string | Date;
}

export interface PayoutAccount {
  id?: string;
  accountType: 'bank' | 'momo';
  accountNumber: string;
  accountName: string;
  bankName?: string | null;
  bankCode?: string | null;
  momoProvider?: string | null;
}

export interface PayoutRecord {
  id: string;
  reference: string;
  walletId?: string | null;
  recipientName: string;
  bankCode?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  amount: number;
  currency: string;
  feeAmount?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'reversed';
  description?: string | null;
  notes?: string | null;
  processedAt?: string | Date | null;
  completedAt?: string | Date | null;
  failedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ActivityLogRecord {
  id: string;
  organizationId?: string | null;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  description: string;
  metadata?: any;
  createdAt: string | Date;
  user?: {
    id: string;
    fullName?: string | null;
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  } | null;
}

export interface Wallet {
  id?: string;
  balance: number;
  availableBalance?: number;
  currency: string;
  pendingCredits?: number;
  pendingDebits?: number;
  payoutAccount?: PayoutAccount | null;
  payouts?: PayoutRecord[];
}

