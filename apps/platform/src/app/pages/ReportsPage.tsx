import * as React from 'react';

import { Boxes, Users, Warehouse } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components';
import { cn } from '@horizon-sync/ui/lib';

import { WMSReports } from '../components/reports';

type ReportSection = 'wms' | 'stock' | 'users';

interface SectionTabProps {
    active: boolean;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick: () => void;
}

function SectionTab({ active, icon: Icon, label, onClick }: SectionTabProps) {
    return (
        <Button variant={active ? 'default' : 'ghost'}
            className={cn('gap-2 justify-start', active && 'bg-primary text-primary-foreground')}
            onClick={onClick}>
            <Icon className="h-4 w-4" />
            {label}
        </Button>
    );
}

function SectionPlaceholder({ title, description }: { title: string; description: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center mb-6">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{title}</h2>
            <p className="text-muted-foreground max-w-md">{description}</p>
        </div>
    );
}

export function ReportsPage() {
    const [section, setSection] = React.useState<ReportSection>('wms');

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                <p className="text-muted-foreground mt-1">Generate and view operational reports</p>
            </div>

            {/* Horizontal sub-navigation (mirrors Warehouse Management) */}
            <div className="border-b">
                <nav className="flex items-center gap-1 pb-0 overflow-x-auto">
                    <SectionTab active={section === 'wms'} icon={Warehouse} label="WMS" onClick={() => setSection('wms')} />
                    <SectionTab active={section === 'stock'} icon={Boxes} label="Stock" onClick={() => setSection('stock')} />
                    <SectionTab active={section === 'users'} icon={Users} label="Users" onClick={() => setSection('users')} />
                </nav>
            </div>

            {section === 'wms' && <WMSReports />}
            {section === 'stock' && (
                <SectionPlaceholder
                    title="Stock Reports"
                    description="Stock-level reporting is coming soon. Select WMS for warehouse reporting."
                />
            )}
            {section === 'users' && (
                <SectionPlaceholder
                    title="User Reports"
                    description="User activity and access reporting is coming soon. Select WMS for warehouse reporting."
                />
            )}
        </div>
    );
}

export default ReportsPage;
