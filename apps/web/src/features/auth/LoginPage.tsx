import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Blur validation (UX-DR12)
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  function validate() {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    return newErrors;
  }

  function handleBlur(field: 'email' | 'password') {
    if (field === 'email') {
      setTouchedEmail(true);
      if (!email.trim()) setErrors((e) => ({ ...e, email: 'Email is required' }));
      else setErrors((e) => ({ ...e, email: undefined }));
    }
    if (field === 'password') {
      setTouchedPassword(true);
      if (!password) setErrors((e) => ({ ...e, password: 'Password is required' }));
      else setErrors((e) => ({ ...e, password: undefined }));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    setTouchedEmail((current) => current || Boolean(validationErrors.email));
    setTouchedPassword((current) => current || Boolean(validationErrors.password));
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      // Focus first invalid field
      const firstField = validationErrors.email ? 'email' : 'password';
      document.getElementById(firstField)?.focus();
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const apiErr = err as {
        message?: string;
        field?: 'email' | 'password';
        statusCode?: number;
      };

      if (apiErr.statusCode === 401) {
        setErrors({ general: INVALID_CREDENTIALS_MESSAGE });
      } else if (apiErr.field === 'email') {
        setTouchedEmail(true);
        setErrors({ email: apiErr.message });
      } else if (apiErr.field === 'password') {
        setTouchedPassword(true);
        setErrors({ password: apiErr.message });
      } else {
        setErrors({ general: apiErr.message || INVALID_CREDENTIALS_MESSAGE });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="w-full max-w-sm">
        <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-[var(--color-primary)]">
              Rewards App
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-2">
              Sign in to your account
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* General error */}
            {errors.general && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-4 rounded-md border border-[var(--color-error)] bg-red-50 p-3 text-sm text-[var(--color-error)]"
              >
                {errors.general}
              </div>
            )}

            {/* Email */}
            <div className="mb-4">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur('email')}
                placeholder="you@company.com"
                autoComplete="email"
                className={
                  touchedEmail && errors.email
                    ? 'border-[var(--color-error)] focus-visible:ring-[var(--color-error)]'
                    : ''
                }
              />
              {touchedEmail && errors.email && (
                <p className="mt-1 text-xs text-[var(--color-error)]" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="mb-6">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur('password')}
                placeholder="Enter your password"
                autoComplete="current-password"
                className={
                  touchedPassword && errors.password
                    ? 'border-[var(--color-error)] focus-visible:ring-[var(--color-error)]'
                    : ''
                }
              />
              {touchedPassword && errors.password && (
                <p className="mt-1 text-xs text-[var(--color-error)]" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
