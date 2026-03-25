export function getStatusBadgeProps(status: string | boolean): {
  variant: 'success' | 'warning' | 'destructive' | 'secondary';
  label: string;
} {
  // Handle boolean (is_active) from admin API
  if (typeof status === 'boolean') {
    return status
      ? { variant: 'success', label: 'Active' }
      : { variant: 'destructive', label: 'Inactive' };
  }
  switch (status) {
    case 'active':
      return { variant: 'success', label: 'Active' };
    case 'pending':
      return { variant: 'warning', label: 'Pending' };
    case 'inactive':
      return { variant: 'secondary', label: 'Inactive' };
    case 'suspended':
      return { variant: 'destructive', label: 'Suspended' };
    default:
      return { variant: 'secondary', label: status };
  }
}

export function getUserInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function getUserTypeBadge(userType: string): {
  variant: 'default' | 'secondary' | 'outline';
  label: string;
} {
  switch (userType) {
    case 'system_admin':
      return { variant: 'default', label: 'System Admin' };
    case 'organization_admin':
      return { variant: 'secondary', label: 'Org Admin' };
    case 'admin':
      return { variant: 'secondary', label: 'Admin' };
    case 'user':
      return { variant: 'outline', label: 'User' };
    case 'guest':
      return { variant: 'outline', label: 'Guest' };
    default:
      return { variant: 'outline', label: userType };
  }
}

export function formatUserDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatShortDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
