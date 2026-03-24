import * as React from 'react';

import { ThemeProvider } from '@horizon-sync/ui/components/theme-provider';
import { TooltipProvider } from '@horizon-sync/ui/components/ui/tooltip';

import { AdminSidebar } from './Sidebar';
import { AdminTopbar } from './Topbar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleToggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const handleCloseSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <ThemeProvider>
      <TooltipProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          {/* Backdrop for mobile */}
          {isMobile && sidebarOpen && (
            <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={handleCloseSidebar}
              aria-hidden="true" />
          )}

          {/* Sidebar */}
          <AdminSidebar open={sidebarOpen}
            collapsed={sidebarCollapsed}
            isMobile={isMobile}
            onToggle={handleToggleSidebar}
            onClose={handleCloseSidebar} />

          {/* Main Content Area */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <AdminTopbar onMobileToggle={handleToggleSidebar} />

            {/* Page Content */}
            <main className="flex-1 overflow-y-auto">
              <div className="p-6">{children}</div>
            </main>
          </div>
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
}
