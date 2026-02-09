import type { User } from '../user-store.types';

/**
 * Check if user has an organization
 */
export const hasOrganization = (user: User | null): boolean => {
  return !!(user?.organization_id);
};

/**
 * Check if user's email is verified
 */
export const isEmailVerified = (user: User | null): boolean => {
  return !!(user?.email_verified);
};

/**
 * Check if user account is active
 */
export const isUserActive = (user: User | null): boolean => {
  return !!(user?.is_active);
};

/**
 * Check if user account is pending
 */
export const isUserPending = (user: User | null): boolean => {
  return user?.status === 'pending';
};

/**
 * Check if user profile is complete
 */
export const isProfileComplete = (user: User | null): boolean => {
  if (!user) return false;
  
  return !!(
    user.first_name &&
    user.last_name &&
    user.email &&
    user.phone &&
    user.display_name
  );
};

/**
 * Get user's full name
 */
export const getUserFullName = (user: User | null): string => {
  if (!user) return 'Unknown User';
  
  if (user.display_name) {
    return user.display_name;
  }
  
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return fullName || user.email || 'Unknown User';
};

/**
 * Get user's display name with fallback logic
 */
export const getUserDisplayName = (user: User | null): string => {
  return getUserFullName(user);
};

/**
 * Check if user account is active (alias for isUserActive with status check)
 */
export const isAccountActive = (user: User | null): boolean => {
  if (!user) return false;
  return user.is_active === true && user.status === 'active';
};

/**
 * Get user's initials
 */
export const getUserInitials = (user: User | null): string => {
  if (!user) return '';
  
  const firstName = user.first_name || '';
  const lastName = user.last_name || '';
  
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

/**
 * Check if user needs to create an organization
 */
export const needsOrganization = (user: User | null): boolean => {
  if (!user) return false;
  
  // User needs organization if:
  // 1. They don't have one
  // 2. Their account is active
  // 3. Their email is verified
  return !hasOrganization(user) && isUserActive(user) && isEmailVerified(user);
};

/**
 * Get user's last login information
 */
export const getLastLoginInfo = (user: User | null) => {
  if (!user?.last_login_at) {
    return { date: null, ip: null, formatted: 'Never logged in' };
  }
  
  const date = new Date(user.last_login_at);
  const formatted = date.toLocaleString();
  
  return {
    date,
    ip: user.last_login_ip,
    formatted: `${formatted}${user.last_login_ip ? ` from ${user.last_login_ip}` : ''}`,
  };
};

/**
 * Get user's account status information
 */
export const getUserStatusInfo = (user: User | null) => {
  if (!user) {
    return { status: 'unknown', message: 'No user data', color: 'gray' };
  }
  
  if (!user.is_active) {
    return { status: 'inactive', message: 'Account is inactive', color: 'red' };
  }
  
  if (user.status === 'pending') {
    return { status: 'pending', message: 'Account is pending verification', color: 'yellow' };
  }
  
  if (!user.email_verified) {
    return { status: 'unverified', message: 'Email not verified', color: 'orange' };
  }
  
  return { status: 'active', message: 'Account is active', color: 'green' };
};

/**
 * Check what onboarding steps the user needs
 */
export const getOnboardingSteps = (user: User | null) => {
  if (!user) return [];
  
  const steps = [];
  
  if (!isEmailVerified(user)) {
    steps.push({
      id: 'verify-email',
      title: 'Verify Email',
      description: 'Please verify your email address',
      required: true,
    });
  }
  
  if (!isProfileComplete(user)) {
    steps.push({
      id: 'complete-profile',
      title: 'Complete Profile',
      description: 'Fill in your profile information',
      required: true,
    });
  }
  
  if (needsOrganization(user)) {
    steps.push({
      id: 'create-organization',
      title: 'Create Organization',
      description: 'Set up your organization to get started',
      required: true,
    });
  }
  
  return steps;
};