export function getStatusBadge(status?: string): {
  variant: 'success' | 'warning' | 'destructive' | 'secondary';
  text: string;
} {
  switch (status) {
    case 'active':
      return { variant: 'success', text: 'Active' };
    case 'pending':
      return { variant: 'warning', text: 'Pending' };
    case 'inactive':
      return { variant: 'secondary', text: 'Inactive' };
    case 'suspended':
      return { variant: 'destructive', text: 'Suspended' };
    default:
      return { variant: 'secondary', text: status || 'Unknown' };
  }
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function getUserInitials(firstName?: string, lastName?: string, email?: string): string {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  if (email) {
    return email.charAt(0).toUpperCase();
  }
  return 'U';
}
