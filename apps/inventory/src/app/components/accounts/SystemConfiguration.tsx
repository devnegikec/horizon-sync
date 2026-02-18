import { Settings } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components';

export function SystemConfiguration() {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Settings className="h-5 w-5" />
					System Configuration
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-sm text-muted-foreground">Configuration settings are coming soon.</p>
			</CardContent>
		</Card>
	);
}

export default SystemConfiguration;
