import { renderHook, act } from '@testing-library/react';

import { usePersonalDetailsForm } from '../../../app/hooks/usePersonalDetailsForm';
import { useAuth } from '../../../app/hooks/useAuth';
import { useOnboardingStore } from '../../../app/hooks/useOnboardingStore';
import { UserService } from '../../../app/services/user.service';

// Mock dependencies
jest.mock('../../../app/hooks/useAuth');
jest.mock('../../../app/hooks/useOnboardingStore');
jest.mock('../../../app/services/user.service');

// Mock Intl.DateTimeFormat to ensure consistent timezone in tests
const mockTimezone = 'UTC';
const originalDateTimeFormat = Intl.DateTimeFormat;

describe('usePersonalDetailsForm', () => {
  const mockUser = {
    first_name: 'John',
    last_name: 'Doe',
    phone: '1234567890',
    job_title: 'Developer',
    department: 'Engineering',
    bio: 'Hello world',
    timezone: 'UTC',
    avatar_url: 'avatar.png',
  };

  const mockAccessToken = 'fake-token';
  const mockUpdateData = jest.fn();
  const mockSetCurrentStep = jest.fn();

  beforeAll(() => {
    // @ts-expect-error - Mocking global Intl
    global.Intl.DateTimeFormat = jest.fn().mockImplementation(() => ({
      resolvedOptions: () => ({ timeZone: mockTimezone }),
    }));
  });

  afterAll(() => {
    global.Intl.DateTimeFormat = originalDateTimeFormat;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      accessToken: mockAccessToken,
    });
    (useOnboardingStore as jest.Mock).mockReturnValue({
      data: {},
      updateData: mockUpdateData,
      setCurrentStep: mockSetCurrentStep,
    });
  });

  it('1. should initialize with user data from auth', () => {
    const { result } = renderHook(() => usePersonalDetailsForm());
    
    expect(result.current.form.getValues()).toEqual({
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '1234567890',
      jobTitle: 'Developer',
      department: 'Engineering',
      bio: 'Hello world',
      timezone: 'UTC',
      avatarUrl: 'avatar.png',
    });
    expect(result.current.avatarPreview).toBe('avatar.png');
    expect(result.current.initials).toBe('JD');
  });

  it('2. should initialize with default timezone if not provided in user data', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { ...mockUser, timezone: null },
      accessToken: mockAccessToken,
    });

    const { result } = renderHook(() => usePersonalDetailsForm());
    expect(result.current.form.getValues().timezone).toBe(mockTimezone);
  });

  it('3. should update initials when names change', async () => {
    const { result } = renderHook(() => usePersonalDetailsForm());
    
    await act(async () => {
      result.current.form.setValue('firstName', 'Alice');
      result.current.form.setValue('lastName', 'Smith');
    });

    expect(result.current.initials).toBe('AS');
  });

  it('4. should call UserService.updateMe and transition to step 2 on successful submission', async () => {
    const { result } = renderHook(() => usePersonalDetailsForm());
    
    const formData = {
      firstName: 'Jane',
      lastName: 'Smith',
      phoneNumber: '9876543210',
      jobTitle: 'Manager',
      department: 'Sales',
      bio: 'New bio',
      timezone: 'GMT',
    };

    (UserService.updateMe as jest.Mock).mockResolvedValue({});

    await act(async () => {
      result.current.form.setValue('firstName', 'Jane');
      result.current.form.setValue('lastName', 'Smith');
      result.current.form.setValue('phoneNumber', '9876543210');
      result.current.form.setValue('jobTitle', 'Manager');
      result.current.form.setValue('department', 'Sales');
      result.current.form.setValue('bio', 'New bio');
      result.current.form.setValue('timezone', 'GMT');
    });

    await act(async () => {
      // Calling the handleSubmit wrapper
      await result.current.onSubmit();
    });

    expect(UserService.updateMe).toHaveBeenCalledWith({
      first_name: 'Jane',
      last_name: 'Smith',
      display_name: 'Jane Smith',
      phone: '9876543210',
      timezone: 'GMT',
      avatar_url: 'avatar.png',
      preferences: {
        onboarding_step: 2,
        theme: 'light',
      },
      extra_data: {
        job_title: 'Manager',
        department: 'Sales',
        bio: 'New bio',
      },
    }, mockAccessToken);

    expect(mockUpdateData).toHaveBeenCalledWith({
      ...formData,
      avatarUrl: 'avatar.png',
    });
    expect(mockSetCurrentStep).toHaveBeenCalledWith(2);
  });

  it('5. should handle API error during submission', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {
      // Intentionally empty for mocking
    });
    const { result } = renderHook(() => usePersonalDetailsForm());
    
    (UserService.updateMe as jest.Mock).mockRejectedValue(new Error('API Error'));

    await act(async () => {
      result.current.form.setValue('firstName', 'Jane');
      result.current.form.setValue('lastName', 'Smith');
      result.current.form.setValue('jobTitle', 'Manager');
      result.current.form.setValue('timezone', 'GMT');
    });

    await act(async () => {
      await result.current.onSubmit();
    });

    expect(consoleSpy).toHaveBeenCalledWith("Failed to update personal details:", expect.any(Error));
    // Should NOT transition to next step on error
    expect(mockSetCurrentStep).not.toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});
