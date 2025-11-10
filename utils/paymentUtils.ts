// utils/paymentUtils.ts
import { PaymentDetail } from '../types';

const LOCAL_STORAGE_PAYMENT_HISTORY_KEY = 'ava_payment_history';

/**
 * Saves an array of payment details to localStorage.
 * @param payments The array of PaymentDetail objects to save.
 */
export const savePaymentHistoryToLocalStorage = (payments: PaymentDetail[]): void => {
  try {
    const serializedPayments = JSON.stringify(payments);
    localStorage.setItem(LOCAL_STORAGE_PAYMENT_HISTORY_KEY, serializedPayments);
  } catch (error) {
    console.error("Error saving payment history to localStorage:", error);
  }
};

/**
 * Loads payment details from localStorage.
 * @returns An array of PaymentDetail objects, or an empty array if none are found or an error occurs.
 */
export const loadPaymentHistoryFromLocalStorage = (): PaymentDetail[] => {
  try {
    const serializedPayments = localStorage.getItem(LOCAL_STORAGE_PAYMENT_HISTORY_KEY);
    if (serializedPayments === null) {
      return [];
    }
    const parsedPayments: PaymentDetail[] = JSON.parse(serializedPayments);
    // Sort payments by paymentDate in descending order (most recent first)
    return parsedPayments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  } catch (error) {
    console.error("Error loading payment history from localStorage:", error);
    return [];
  }
};

/**
 * Formats a payment detail for display.
 * @param payment The PaymentDetail object.
 * @returns A user-friendly string describing the payment.
 */
export const formatPaymentDetail = (payment: PaymentDetail): string => {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(payment.amount);
  return `${payment.biller} (${formattedAmount} due ${payment.dueDate}). Paid on: ${payment.paymentDate}`;
};

/**
 * Formats a payment amount for display.
 * @param amount The payment amount.
 * @returns A user-friendly formatted currency string.
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};