'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api-client';

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="container login-container" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get('reason') === 'expired';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(identifier, password);
      router.push('/products');
    } catch (err) {
      setError(describeLoginError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container login-container">
      <h1>Log in</h1>

      {sessionExpired && (
        <p className="info-text">Your session expired due to inactivity. Please log in again.</p>
      )}

      <form onSubmit={handleSubmit} className="login-form">
        <label htmlFor="identifier">
          Username or email
          <input
            id="identifier"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoFocus
            required
          />
        </label>

        <label htmlFor="password">
          Password
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <p className="error-text">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>
    </main>
  );
}

function describeLoginError(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 401:
        return err.message;
      case 403:
        return err.message;
      case 429: {
        const details = err.details as { retryAfterSeconds?: number } | null;
        const retry = details?.retryAfterSeconds;
        return retry
          ? `${err.message} (try again in ${retry}s)`
          : err.message;
      }
      case 400:
        return err.message;
      default:
        return err.message || 'Login failed. Please try again.';
    }
  }
  return 'Could not reach the server. Please check your connection and try again.';
}
