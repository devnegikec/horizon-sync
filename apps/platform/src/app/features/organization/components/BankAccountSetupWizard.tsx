import * as React from 'react';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { Alert, AlertDescription } from '@horizon-sync/ui/components/ui/alert';
import { CheckCircle2, XCircle, Loader2, Building2 } from 'lucide-react';

interface BankAccountSetupWizardProps {
  organizationId: string;
  organizationName: string;
  onComplete: () => void;
  onSkip: () => void;
}

interface SetupState {
  status: 'idle' | 'creating' | 'success' | 'error' | 'skipped';
  error?: string;
}

/**
 * BankAccountSetupWizard Component
 * 
 * Wizard step for creating a default bank account during organization setup.
 * Provides options to create a default bank account or skip this step.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8
 */
export function BankAccountSetupWizard({
  organizationId,
  organizationName,
  onComplete,
  onSkip,
}: BankAccountSetupWizardProps) {
  const [state, setState] = React.useState<SetupState>({ status: 'idle' });

  /**
   * Create default bank account
   * Requirements: 1.2, 1.3, 1.4, 1.5, 1.7
   */
  const handleCreateBankAccount = async () => {
    setState({ status: 'creating' });

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/default-bank-account?skip_on_error=false`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create default bank account');
      }

      setState({ status: 'success' });
      
      // Auto-complete after 2 seconds
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error) {
      setState({
        status: 'error',
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    }
  };

  /**
   * Skip bank account creation
   * Requirements: 1.6
   */
  const handleSkip = () => {
    setState({ status: 'skipped' });
    onSkip();
  };

  /**
   * Retry after error
   * Requirements: 1.7
   */
  const handleRetry = () => {
    setState({ status: 'idle' });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-[#3058EE] to-[#7D97F6] rounded-full">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Set Up Banking</CardTitle>
          <CardDescription className="text-base">
            Create a default bank account for {organizationName}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Idle State - Show Options */}
          {state.status === 'idle' && (
            <>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  We can create a default bank account for your organization to get you started.
                  This account will be linked to your default General Ledger account and marked as your primary bank account.
                </p>

                <Alert>
                  <AlertDescription>
                    <strong>What you'll get:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                      <li>A default bank account linked to your GL</li>
                      <li>Marked as primary and active</li>
                      <li>Ready for transaction imports and reconciliation</li>
                      <li>You can update the details later</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkip}
                >
                  Skip for Now
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateBankAccount}
                  className="bg-gradient-to-r from-[#3058EE] to-[#7D97F6] hover:opacity-90 text-white"
                >
                  Create Default Bank Account
                </Button>
              </div>
            </>
          )}

          {/* Creating State */}
          {state.status === 'creating' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-[#3058EE]" />
              <p className="text-sm text-muted-foreground">
                Creating your default bank account...
              </p>
            </div>
          )}

          {/* Success State */}
          {state.status === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium text-green-900">Bank Account Created!</p>
                <p className="text-sm text-muted-foreground">
                  Your default bank account has been set up successfully.
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {state.status === 'error' && (
            <>
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <XCircle className="h-12 w-12 text-red-600" />
                </div>
                <div className="text-center space-y-2">
                  <p className="font-medium text-red-900">Setup Failed</p>
                  <p className="text-sm text-muted-foreground">
                    {state.error}
                  </p>
                </div>
              </div>

              <Alert variant="destructive">
                <AlertDescription>
                  Don't worry! You can skip this step and set up your bank account later
                  from the Banking section.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkip}
                >
                  Skip for Now
                </Button>
                <Button
                  type="button"
                  onClick={handleRetry}
                  className="bg-gradient-to-r from-[#3058EE] to-[#7D97F6] hover:opacity-90 text-white"
                >
                  Try Again
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
