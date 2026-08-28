export interface Transaction {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  status: 'success' | 'pending' | 'failed';
  type: 'ticket' | 'vote' | 'payout' | 'withdrawal';
  description?: string | null;
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

export interface Wallet {
  id?: string;
  balance: number;
  currency: string;
  pendingCredits?: number;
  pendingDebits?: number;
  payoutAccount?: PayoutAccount | null;
  payouts?: any[];
}
