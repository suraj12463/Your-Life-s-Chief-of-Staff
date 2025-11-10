// components/PaymentHistoryView.tsx
import React from 'react';
import { PaymentDetail } from '../types';
import { formatCurrency } from '../utils/paymentUtils';

interface PaymentHistoryViewProps {
  payments: PaymentDetail[];
}

const PaymentHistoryView: React.FC<PaymentHistoryViewProps> = ({ payments }) => {
  return (
    <div className="flex flex-col h-full mt-6">
      <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4 border-b pb-2">Your Payment History</h2>
      {payments.length === 0 ? (
        <p className="text-gray-600 text-sm">No payments recorded. Ask Ava to pay a bill for you!</p>
      ) : (
        <ul className="space-y-3 overflow-y-auto flex-1">
          {payments.map((payment) => (
            <li key={payment.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-800 text-base">{payment.biller}</h3>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium mr-1">Amount:</span>
                {formatCurrency(payment.amount)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium mr-1">Due Date:</span>
                {payment.dueDate}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Paid on: {payment.paymentDate}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PaymentHistoryView;