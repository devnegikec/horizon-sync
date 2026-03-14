import { useState, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@horizon-sync/ui/components/ui/dialog';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Alert, AlertDescription } from '@horizon-sync/ui/components/ui/alert';
import { Progress } from '@horizon-sync/ui/components/ui/progress';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Separator } from '@horizon-sync/ui/components/ui/separator';
import { Checkbox } from '@horizon-sync/ui/components/ui/checkbox';
import { Label } from '@horizon-sync/ui/components/ui/label';
import {
    Upload,
    FileText,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Info,
    FileSpreadsheet,
    FileType,
} from 'lucide-react';
import { useTransactionImport } from '../hooks/useTransactionImport';

interface TransactionImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bankAccountId: string;
    onImportComplete?: () => void;
}

type ImportFormat = 'csv' | 'pdf' | 'mt940';

interface ImportResult {
    imported_count: number;
    skipped_count: number;
    failed_count: number;
    errors: string[];
    warnings: string[];
    batch_id: string;
}

export function TransactionImportDialog({
    open,
    onOpenChange,
    bankAccountId,
    onImportComplete,
}: TransactionImportDialogProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [importFormat, setImportFormat] = useState<ImportFormat | null>(null);
    const [forceImport, setForceImport] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const { importTransactions } = useTransactionImport(bankAccountId);

    // Reset state when dialog closes
    const handleOpenChange = useCallback((newOpen: boolean) => {
        if (!newOpen) {
            setSelectedFile(null);
            setImportFormat(null);
            setForceImport(false);
            setImportResult(null);
            setIsUploading(false);
        }
        onOpenChange(newOpen);
    }, [onOpenChange]);

    // Handle file selection
    const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Detect format from file extension
        const extension = file.name.split('.').pop()?.toLowerCase();
        let format: ImportFormat | null = null;

        if (extension === 'csv') {
            format = 'csv';
        } else if (extension === 'pdf') {
            format = 'pdf';
        } else if (extension === 'mt940' || extension === 'sta') {
            format = 'mt940';
        }

        setSelectedFile(file);
        setImportFormat(format);
        setImportResult(null);
    }, []);

    // Handle file upload and import
    const handleImport = useCallback(async () => {
        if (!selectedFile || !importFormat) return;

        setIsUploading(true);
        setImportResult(null);

        try {
            const result = await importTransactions(selectedFile, importFormat, forceImport);
            setImportResult(result);

            // If import was successful and no errors, call completion callback
            if (result.failed_count === 0 && onImportComplete) {
                onImportComplete();
            }
        } catch (error) {
            setImportResult({
                imported_count: 0,
                skipped_count: 0,
                failed_count: 0,
                errors: [error instanceof Error ? error.message : 'Import failed'],
                warnings: [],
                batch_id: '',
            });
        } finally {
            setIsUploading(false);
        }
    }, [selectedFile, importFormat, forceImport, importTransactions, onImportComplete]);

    // Render file format instructions
    const renderFormatInstructions = () => {
        if (!importFormat) return null;

        const instructions = {
            csv: {
                title: 'CSV Format Requirements',
                icon: <FileSpreadsheet className="h-5 w-5" />,
                description: 'CSV file must contain the following columns:',
                columns: [
                    'date - Transaction date in YYYY-MM-DD format',
                    'amount - Transaction amount (numeric with up to 2 decimals)',
                    'description - Transaction description (up to 500 characters)',
                    'reference - Bank reference or transaction ID',
                    'type - Transaction type (either "debit" or "credit")',
                ],
                example: `date,amount,description,reference,type
2024-01-15,1500.00,Customer Payment,TXN-12345,credit
2024-01-16,-250.50,Office Supplies,TXN-12346,debit`,
            },
            pdf: {
                title: 'PDF Format Requirements',
                icon: <FileType className="h-5 w-5" />,
                description: 'PDF bank statement requirements:',
                columns: [
                    'Must be a standard bank statement format',
                    'Text must be extractable (not scanned images)',
                    'Supports multi-page statements',
                    'Transaction type detected from amount sign or column position',
                ],
                example: null,
            },
            mt940: {
                title: 'MT940 Format Requirements',
                icon: <FileText className="h-5 w-5" />,
                description: 'MT940 SWIFT standard format requirements:',
                columns: [
                    ':60F: - Opening balance',
                    ':61: - Transaction statement',
                    ':86: - Transaction details',
                    ':62F: - Closing balance',
                ],
                example: null,
            },
        };

        const info = instructions[importFormat];

        return (
            <Alert className="mt-4">
                <div className="flex items-start gap-3">
                    {info.icon}
                    <div className="flex-1">
                        <h4 className="font-semibold mb-2">{info.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{info.description}</p>
                        <ul className="text-sm space-y-1 list-disc list-inside">
                            {info.columns.map((col, idx) => (
                                <li key={idx}>{col}</li>
                            ))}
                        </ul>
                        {info.example && (
                            <div className="mt-3">
                                <p className="text-sm font-medium mb-1">Example:</p>
                                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                    {info.example}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            </Alert>
        );
    };

    // Render import summary
    const renderImportSummary = () => {
        if (!importResult) return null;

        const hasErrors = importResult.errors.length > 0;
        const hasWarnings = importResult.warnings.length > 0;
        const totalProcessed =
            importResult.imported_count + importResult.skipped_count + importResult.failed_count;

        return (
            <div className="space-y-4 mt-4">
                <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {importResult.imported_count}
                        </div>
                        <div className="text-sm text-muted-foreground">Imported</div>
                    </div>

                    <div className="flex flex-col items-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                        <AlertTriangle className="h-8 w-8 text-yellow-600 dark:text-yellow-400 mb-2" />
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                            {importResult.skipped_count}
                        </div>
                        <div className="text-sm text-muted-foreground">Skipped</div>
                    </div>

                    <div className="flex flex-col items-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                        <XCircle className="h-8 w-8 text-red-600 dark:text-red-400 mb-2" />
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {importResult.failed_count}
                        </div>
                        <div className="text-sm text-muted-foreground">Failed</div>
                    </div>
                </div>

                {totalProcessed > 0 && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Total Processed</span>
                            <span className="font-medium">{totalProcessed}</span>
                        </div>
                        <Progress
                            value={(importResult.imported_count / totalProcessed) * 100}
                            className="h-2"
                        />
                    </div>
                )}

                {hasWarnings && (
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <div className="font-semibold mb-2">Duplicate Warnings:</div>
                            <ul className="text-sm space-y-1 list-disc list-inside">
                                {importResult.warnings.map((warning, idx) => (
                                    <li key={idx}>{warning}</li>
                                ))}
                            </ul>
                            {importResult.skipped_count > 0 && !forceImport && (
                                <div className="mt-3 p-3 bg-muted rounded">
                                    <p className="text-sm">
                                        {importResult.skipped_count} duplicate transaction(s) were skipped.
                                        Enable "Force Import Duplicates" to import them anyway.
                                    </p>
                                </div>
                            )}
                        </AlertDescription>
                    </Alert>
                )}

                {hasErrors && (
                    <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                            <div className="font-semibold mb-2">Validation Errors:</div>
                            <ul className="text-sm space-y-1 list-disc list-inside max-h-40 overflow-y-auto">
                                {importResult.errors.map((error, idx) => (
                                    <li key={idx}>{error}</li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}

                {importResult.batch_id && (
                    <div className="text-xs text-muted-foreground">
                        Batch ID: {importResult.batch_id}
                    </div>
                )}
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Import Bank Transactions</DialogTitle>
                    <DialogDescription>
                        Upload a CSV, PDF, or MT940 file to import bank transactions. Duplicate
                        transactions will be automatically detected.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* File Upload Section */}
                    <div className="space-y-2">
                        <Label htmlFor="file-upload">Select File</Label>
                        <div className="flex items-center gap-4">
                            <input
                                id="file-upload"
                                type="file"
                                accept=".csv,.pdf,.mt940,.sta"
                                onChange={handleFileSelect}
                                disabled={isUploading}
                                className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50"
                            />
                            {selectedFile && (
                                <Badge variant="outline" className="flex items-center gap-2">
                                    <FileText className="h-3 w-3" />
                                    {importFormat?.toUpperCase()}
                                </Badge>
                            )}
                        </div>
                        {selectedFile && (
                            <p className="text-sm text-muted-foreground">
                                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                            </p>
                        )}
                    </div>

                    {/* Format Instructions */}
                    {renderFormatInstructions()}

                    {/* Force Import Option */}
                    {selectedFile && (
                        <>
                            <Separator />
                            <div className="flex items-start space-x-3">
                                <Checkbox
                                    id="force-import"
                                    checked={forceImport}
                                    onCheckedChange={(checked) => setForceImport(checked === true)}
                                    disabled={isUploading}
                                />
                                <div className="space-y-1">
                                    <Label
                                        htmlFor="force-import"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Force Import Duplicates
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Import duplicate transactions with a duplicate flag. By default,
                                        duplicates are skipped.
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Upload Progress */}
                    {isUploading && (
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                <div className="space-y-2">
                                    <p className="font-medium">Importing transactions...</p>
                                    <Progress value={undefined} className="h-2" />
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Import Summary */}
                    {renderImportSummary()}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={isUploading}
                    >
                        {importResult ? 'Close' : 'Cancel'}
                    </Button>
                    {!importResult && (
                        <Button
                            onClick={handleImport}
                            disabled={!selectedFile || !importFormat || isUploading}
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            Import Transactions
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
