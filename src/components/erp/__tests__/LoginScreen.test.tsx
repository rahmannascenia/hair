import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginScreen from '../LoginScreen';
import { useErpStore } from '@/lib/store';

// Mock the store
vi.mock('@/lib/store', () => ({
  useErpStore: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('LoginScreen Component', () => {
  const setUser = vi.fn();
  const setActiveSection = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useErpStore as any).mockReturnValue({
      setUser,
      setActiveSection,
    });

    // Mock fetch for the API call
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          user: {
            username: 'admin',
            roleKey: 'admin',
            role: 'Admin',
            displayName: 'Administrator'
          }
        }),
      } as Response)
    );
  });

  it('renders login form correctly', () => {
    render(<LoginScreen />);
    // Use getByLabelText for better accessibility and reliability
    expect(screen.getByLabelText(/Username/i)).toBeDefined();
    expect(screen.getByLabelText(/Password/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /login/i })).toBeDefined();
  });

  it('updates input fields on change', () => {
    render(<LoginScreen />);
    const usernameInput = screen.getByLabelText(/Username/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/Password/i) as HTMLInputElement;

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(usernameInput.value).toBe('testuser');
    expect(passwordInput.value).toBe('password123');
  });

  it('calls API and updates store on successful login', async () => {
    render(<LoginScreen />);

    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth', expect.any(Object));
      expect(setUser).toHaveBeenCalledWith({
        username: 'admin',
        roleKey: 'admin',
        role: 'Admin',
        displayName: 'Administrator'
      });
    });
  });

  it('shows error toast on failed login', async () => {
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      })
    );

    render(<LoginScreen />);

    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'wrong' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    const { toast } = await import('sonner');
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
    });
  });
});
