'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role === 'attorney') router.replace('/queue');
    else if (role === 'admin') router.replace('/admin/dashboard');
    else if (role === 'client') router.replace('/dashboard');
    else router.replace('/auth/login');
  }, [router]);
  return null;
}
