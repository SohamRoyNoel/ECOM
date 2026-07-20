'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    router.replace(token ? '/products' : '/login');
  }, [isLoading, token, router]);

  return (
    <main className="container">
      <p className="status-text">Loading...</p>
    </main>
  );
}
