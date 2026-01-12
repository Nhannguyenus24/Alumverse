import { Fund } from '../entities/Fund';
import { FundReceivingInfo } from '../entities/FundReceivingInfo';
import { FundDonation } from '../entities/FundDonation';
import { FundExpense } from '../entities/FundExpense';

/**
 * Repository interface for fund and donation management operations
 */
export interface IFundRepository {
  // Fund Management
  createFund(fundData: Partial<Fund>): Promise<Fund>;
  updateFund(fundId: number, fundData: Partial<Fund>): Promise<Fund>;
  deleteFund(fundId: number): Promise<boolean>;
  findFundById(fundId: number): Promise<Fund | null>;
  findFundsByOrganization(
    organizationId: number,
    page: number,
    limit: number,
    filters?: { status?: string },
  ): Promise<{ funds: Fund[]; total: number }>;
  updateFundAmount(fundId: number, amount: number): Promise<Fund>;
  updateFundStatus(fundId: number, status: string): Promise<Fund>;

  // Fund Receiving Info Management
  createReceivingInfo(
    receivingInfoData: Partial<FundReceivingInfo>,
  ): Promise<FundReceivingInfo>;
  updateReceivingInfo(
    receivingInfoId: number,
    receivingInfoData: Partial<FundReceivingInfo>,
  ): Promise<FundReceivingInfo>;
  deleteReceivingInfo(receivingInfoId: number): Promise<boolean>;
  findReceivingInfosByFund(fundId: number): Promise<FundReceivingInfo[]>;
  findActiveReceivingInfosByFund(fundId: number): Promise<FundReceivingInfo[]>;
  toggleReceivingInfoStatus(
    receivingInfoId: number,
    isActive: boolean,
  ): Promise<FundReceivingInfo>;

  // Donation Management
  createDonation(donationData: Partial<FundDonation>): Promise<FundDonation>;
  updateDonation(
    donationId: number,
    donationData: Partial<FundDonation>,
  ): Promise<FundDonation>;
  findDonationById(donationId: number): Promise<FundDonation | null>;
  findDonationsByFund(
    fundId: number,
    page: number,
    limit: number,
    filters?: { status?: string },
  ): Promise<{ donations: FundDonation[]; total: number }>;
  findDonationsByDonor(
    donorMemberId: number,
    page: number,
    limit: number,
  ): Promise<{ donations: FundDonation[]; total: number }>;
  approveDonation(donationId: number): Promise<FundDonation>;
  rejectDonation(donationId: number): Promise<FundDonation>;

  // Expense Management
  createExpense(expenseData: Partial<FundExpense>): Promise<FundExpense>;
  updateExpense(
    expenseId: number,
    expenseData: Partial<FundExpense>,
  ): Promise<FundExpense>;
  deleteExpense(expenseId: number): Promise<boolean>;
  findExpenseById(expenseId: number): Promise<FundExpense | null>;
  findExpensesByFund(
    fundId: number,
    page: number,
    limit: number,
  ): Promise<{ expenses: FundExpense[]; total: number }>;

  // Statistics & Reports
  getFundStatistics(fundId: number): Promise<{
    totalDonations: number;
    approvedDonations: number;
    pendingDonations: number;
    totalExpenses: number;
    currentBalance: number;
    donorCount: number;
  }>;

  getTotalDonationsByFund(fundId: number): Promise<number>;
  getTotalExpensesByFund(fundId: number): Promise<number>;
}
