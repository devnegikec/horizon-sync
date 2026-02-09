export function getStatusBadgeProps(status: string): {
  variant: 'success' | 'warning' | 'destructive' | 'secondary';
  label: string;
} {
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

export function formatDate(dateString: string | null): string {
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
    case 'admin':
      return { variant: 'secondary', label: 'Admin' };
    case 'user':
      return { variant: 'outline', label: 'User' };
    default:
      return { variant: 'outline', label: userType };
  }
}
