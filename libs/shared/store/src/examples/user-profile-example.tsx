import React from 'react';
import { useUserStore } from '../user-store';
import {
  hasOrganization,
  isEmailVerified,
  isUserActive,
  isUserPending,
  isProfileComplete,
  getUserFullName,
  getUserInitials,
  needsOrganization,
  getLastLoginInfo,
  getUserStatusInfo,
  getOnboardingSteps,
} from '../utils/user-utils';

export function UserProfileExample() {
  const { user } = useUserStore();

  if (!user) {
    return (
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">User Profile</h3>
        <p className="text-gray-500">No user logged in</p>
      </div>
    );
  }

  const statusInfo = getUserStatusInfo(user);
  const lastLogin = getLastLoginInfo(user);
  const onboardingSteps = getOnboardingSteps(user);

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <h3 className="text-lg font-semibold">User Profile</h3>
      
      {/* Basic Info */}
      <div className="bg-gray-50 p-3 rounded">
        <h4 className="font-medium mb-2">Basic Information</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-medium">Name:</span> {getUserFullName(user)}
          </div>
          <div>
            <span className="font-medium">Initials:</span> {getUserInitials(user)}
          </div>
          <div>
            <span className="font-medium">Email:</span> {user.email}
          </div>
          <div>
            <span className="font-medium">Phone:</span> {user.phone}
          </div>
          <div>
            <span className="font-medium">User Type:</span> {user.user_type}
          </div>
          <div>
            <span className="font-medium">Language:</span> {user.language}
          </div>
          <div>
            <span className="font-medium">Timezone:</span> {user.timezone}
          </div>
        </div>
      </div>

      {/* Account Status */}
      <div className="bg-gray-50 p-3 rounded">
        <h4 className="font-medium mb-2">Account Status</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div 
              className={`w-3 h-3 rounded-full ${
                statusInfo.color === 'green' ? 'bg-green-500' :
                statusInfo.color === 'yellow' ? 'bg-yellow-500' :
                statusInfo.color === 'orange' ? 'bg-orange-500' :
                statusInfo.color === 'red' ? 'bg-red-500' : 'bg-gray-500'
              }`}
            />
            <span className="text-sm">{statusInfo.message}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium">Active:</span> {isUserActive(user) ? 'Yes' : 'No'}
            </div>
            <div>
              <span className="font-medium">Email Verified:</span> {isEmailVerified(user) ? 'Yes' : 'No'}
            </div>
            <div>
              <span className="font-medium">Status:</span> {user.status}
            </div>
            <div>
              <span className="font-medium">Pending:</span> {isUserPending(user) ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      </div>

      {/* Organization */}
      <div className="bg-gray-50 p-3 rounded">
        <h4 className="font-medium mb-2">Organization</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div 
              className={`w-3 h-3 rounded-full ${
                hasOrganization(user) ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm">
              {hasOrganization(user) ? 'Has Organization' : 'No Organization'}
            </span>
          </div>
          
          {user.organization_id && (
            <div className="text-sm">
              <span className="font-medium">Organization ID:</span> {user.organization_id}
            </div>
          )}
          
          {needsOrganization(user) && (
            <div className="bg-yellow-100 border border-yellow-300 p-2 rounded text-sm">
              ⚠️ User needs to create an organization
            </div>
          )}
        </div>
      </div>

      {/* Profile Completion */}
      <div className="bg-gray-50 p-3 rounded">
        <h4 className="font-medium mb-2">Profile Status</h4>
        <div className="flex items-center space-x-2">
          <div 
            className={`w-3 h-3 rounded-full ${
              isProfileComplete(user) ? 'bg-green-500' : 'bg-yellow-500'
            }`}
          />
          <span className="text-sm">
            {isProfileComplete(user) ? 'Profile Complete' : 'Profile Incomplete'}
          </span>
        </div>
      </div>

      {/* Last Login */}
      <div className="bg-gray-50 p-3 rounded">
        <h4 className="font-medium mb-2">Last Login</h4>
        <div className="text-sm">
          <div>{lastLogin.formatted}</div>
          {user.email_verified_at && (
            <div className="mt-1">
              <span className="font-medium">Email verified:</span> {new Date(user.email_verified_at).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Onboarding Steps */}
      {onboardingSteps.length > 0 && (
        <div className="bg-blue-50 p-3 rounded">
          <h4 className="font-medium mb-2">Required Actions</h4>
          <div className="space-y-2">
            {onboardingSteps.map((step) => (
              <div key={step.id} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-medium text-sm">{step.title}</div>
                  <div className="text-xs text-gray-600">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw User Data */}
      <details className="bg-gray-100 p-3 rounded">
        <summary className="font-medium cursor-pointer">Raw User Data</summary>
        <pre className="text-xs mt-2 overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
      </details>
    </div>
  );
}