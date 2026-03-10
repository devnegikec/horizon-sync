import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { BankingDashboard } from './components/BankingDashboard';
import { BankAccountManager } from './components/BankAccountManager';
import { PaymentCenter } from './components/PaymentCenter';
import { TransferWorkflow } from './components/TransferWorkflow';
import { BankApiConnector } from './components/BankApiConnector';
import { CreateBankAccountForm } from './components/forms/CreateBankAccountForm';
import { PaymentForm } from './components/forms/PaymentForm';

export default function BankingRoutes() {
    return (
        <Routes>
            {/* Banking Dashboard - Main landing page */}
            <Route index element={<BankingDashboard />} />

            {/* Bank Account Management */}
            <Route path="accounts" element={<BankAccountManager />} />
            <Route
                path="accounts/new"
                element={
                    <CreateBankAccountForm
                        glAccountId="default-gl-account" // This should come from routing params or context
                        onSuccess={() => window.history.back()}
                        onCancel={() => window.history.back()}
                    />
                }
            />

            {/* Payment Center */}
            <Route path="payments" element={<PaymentCenter />} />
            <Route
                path="payments/new"
                element={
                    <PaymentForm
                        onSuccess={() => window.history.back()}
                        onCancel={() => window.history.back()}
                    />
                }
            />

            {/* Transfer Workflow */}
            <Route path="transfers" element={<TransferWorkflow />} />
            <Route
                path="transfers/new"
                element={
                    <TransferWorkflow glAccountId="default-gl-account" />
                }
            />

            {/* Bank API Integration */}
            <Route path="api" element={<BankApiConnector />} />
            <Route path="api/:accountId" element={<BankApiConnector />} />

            {/* Activity and History */}
            <Route path="activity" element={<div>Banking Activity (To be implemented)</div>} />
            <Route path="analytics" element={<div>Banking Analytics (To be implemented)</div>} />
        </Routes>
    );
}