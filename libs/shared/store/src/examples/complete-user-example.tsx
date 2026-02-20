import React from 'react';
import { useUserStore } from '../user-store';
import { 
  hasOrganization, 
  isProfileComplete, 
  getUserDisplayName,
  isEmailVerified,
  isAccountActive 
} from '../utils/user-utils';

/**
 * Complete User Example Component
 * 
 * This component demonstrates how to use the complete user store
 * with all the new fields and utility functions.
 * 
 * Note: This is a demonstration component. In a real app, you would
 * import useAuth from your app's hooks directory.
 */
export function CompleteUserExample() {
  const { user, isAuthenticated } = useUserStore();

  // In a real app, you would use the useAuth hook from your app
  const handleFetchProfile = async () => {
    console.log('In a real app, this would call fetchUserProfile() from useAuth hook');
    // Example: await fetchUserProfile();
  };

  if (!isAuthenticated || !user) {
    return <div>Please log in to view user information</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Complete User Profile</h1>
      
      {/* Basic Information */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Basic Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Display Name</label>
            <p className="mt-1">{getUserDisplayName(user)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1">{user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <p className="mt-1">{user.phone || 'Not provided'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">User Type</label>
            <p className="mt-1">{user.user_type || 'user'}</p>
          </div>
        </div>
      </section>

      {/* Account Status */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Account Status</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              isAccountActive(user) 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {user.status || 'unknown'}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Verified</label>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              isEmailVerified(user) 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {isEmailVerified(user) ? 'Verified' : 'Unverified'}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Login</label>
            <p className="mt-1">
              {user.last_login_at 
                ? new Date(user.last_login_at).toLocaleString() 
                : 'Never'
              }
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Login IP</label>
            <p className="mt-1">{user.last_login_ip || 'Unknown'}</p>
          </div>
        </div>
      </section>

      {/* Organization Information */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Organization</h2>
        {hasOrganization(user) ? (
          <div>
            <label className="block text-sm font-medium text-gray-700">Organization ID</label>
            <p className="mt-1">{user.organization_id}</p>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  No Organization
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>You haven't joined an organization yet. Create or join one to get started.</p>
                </div>
                <div className="mt-4">
                  <button className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-2 rounded-md text-sm font-medium">
                    Create Organization
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Profile Completeness */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Profile Completeness</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Profile is {isProfileComplete(user) ? 'complete' : 'incomplete'}
              </p>
              {!isProfileComplete(user) && (
                <p className="text-xs text-blue-600 mt-1">
                  Please complete your profile to access all features.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Additional Information */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Additional Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Job Title</label>
            <p className="mt-1">{user.job_title || 'Not specified'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <p className="mt-1">{user.department || 'Not specified'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Timezone</label>
            <p className="mt-1">{user.timezone || 'UTC'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Language</label>
            <p className="mt-1">{user.language || 'en'}</p>
          </div>
        </div>
        {user.bio && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <p className="mt-1 text-sm text-gray-600">{user.bio}</p>
          </div>
        )}
      </section>

      {/* Actions */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Actions</h2>
        <div className="flex space-x-4">
          <button 
            onClick={handleFetchProfile}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Refresh Profile
          </button>
          <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium">
            Edit Profile
          </button>
        </div>
      </section>

      {/* Debug Information */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Debug Information</h2>
        <details className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <summary className="cursor-pointer text-sm font-medium text-gray-700">
            View Raw User Data
          </summary>
          <pre className="mt-2 text-xs text-gray-600 overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </details>
      </section>
    </div>
  );
}