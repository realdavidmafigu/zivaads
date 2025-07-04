import React from 'react';
import { FacebookAccount } from '@/types';

interface PaymentStatusAlertProps {
  accounts: FacebookAccount[];
  showDetails?: boolean;
  variant?: 'compact' | 'detailed';
}

export default function PaymentStatusAlert({ 
  accounts, 
  showDetails = true, 
  variant = 'detailed' 
}: PaymentStatusAlertProps) {
  const accountsWithPaymentIssues = accounts.filter(account => 
    account.payment_status === 'unsettled' || account.account_status !== 1
  );

  if (accountsWithPaymentIssues.length === 0) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unsettled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'unsettled':
        return (
          <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'pending':
        return (
          <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  if (variant === 'compact') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
        <div className="flex items-center">
          <svg className="h-4 w-4 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium text-red-800">
            {accountsWithPaymentIssues.length} account{accountsWithPaymentIssues.length > 1 ? 's' : ''} with payment issues
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getStatusIcon('unsettled')}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Payment Issues Detected
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>The following ad accounts have payment issues and may be disabled:</p>
            
            {showDetails && (
              <ul className="mt-3 space-y-2">
                {accountsWithPaymentIssues.map(account => (
                  <li key={account.id} className="flex items-center justify-between p-2 bg-red-100 rounded-md">
                    <div className="flex-1">
                      <div className="font-medium text-red-900">{account.account_name}</div>
                      {account.business_name && (
                        <div className="text-xs text-red-700">{account.business_name}</div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(account.payment_status || 'unknown')}`}>
                        {account.payment_status === 'unsettled' ? 'Unsettled Payment' : 
                         account.disable_reason || 'Account Disabled'}
                      </span>
                      {account.amount_spent && account.amount_spent > 0 && (
                        <span className="text-xs text-red-600">
                          Spent: ${(account.amount_spent / 100).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            
            <div className="mt-4 p-3 bg-red-100 rounded-md">
              <p className="text-sm font-medium text-red-900 mb-2">How to resolve:</p>
              <ol className="text-xs text-red-800 space-y-1 list-decimal list-inside">
                <li>Log into Facebook Ads Manager</li>
                <li>Go to Billing & Payment Methods</li>
                <li>Update your payment information</li>
                <li>Pay any outstanding balances</li>
                <li>Wait 24-48 hours for account reactivation</li>
              </ol>
            </div>
            
            <div className="mt-3 flex items-center justify-between">
              <a 
                href="https://www.facebook.com/adsmanager/manage/accounts" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm font-medium text-red-800 hover:text-red-900 underline"
              >
                Open Facebook Ads Manager →
              </a>
              <button 
                onClick={() => window.location.reload()}
                className="text-sm font-medium text-red-800 hover:text-red-900 underline"
              >
                Refresh Status
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 