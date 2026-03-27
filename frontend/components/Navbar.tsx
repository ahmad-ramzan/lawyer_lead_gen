'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(localStorage.getItem('role'));
  }, []);

  function logout() {
    localStorage.clear();
    document.cookie = 'access_token=; Max-Age=0; path=/';
    document.cookie = 'role=; Max-Age=0; path=/';
    router.push('/auth/login');
  }

  const isClient = pathname.startsWith('/dashboard') || pathname.startsWith('/matters') || pathname.startsWith('/chat') || pathname.startsWith('/investigations');
  const isAttorney = pathname.startsWith('/queue') || pathname.startsWith('/attorney');
  const isAdmin = pathname.startsWith('/admin');

  return (
    <header className="flex items-center justify-between px-6 h-12" style={{ backgroundColor: '#0f1623' }}>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-base tracking-tight">LexSelf</span>
          <span className="text-xs font-medium tracking-widest uppercase" style={{ color: '#c9a84c' }}>Signal Law Group</span>
        </div>
        <nav className="flex items-center gap-1">
          {/* Client portal always visible */}
          {(!role || role === 'client') && (
            <>
              <Link href="/matters" className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${pathname === '/matters' ? 'bg-white text-gray-900' : 'text-gray-300 hover:text-white'}`}>
                Client Portal
              </Link>
              <Link href="/investigations" className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${pathname.startsWith('/investigations') ? 'bg-white text-gray-900' : 'text-gray-300 hover:text-white'}`}>
                Submitted Matters
              </Link>
            </>
          )}
          {role === 'attorney' && (
            <Link href="/queue" className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${isAttorney ? 'bg-white text-gray-900' : 'text-gray-300 hover:text-white'}`}>
              Attorney Portal
            </Link>
          )}
          {role === 'admin' && (
            <>
              <Link href="/admin/clients" className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${pathname.startsWith('/admin/clients') ? 'bg-white text-gray-900' : 'text-gray-300 hover:text-white'}`}>
                Clients
              </Link>
              <Link href="/admin/attorneys" className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${pathname.startsWith('/admin/attorneys') ? 'bg-white text-gray-900' : 'text-gray-300 hover:text-white'}`}>
                Attorneys
              </Link>
              <Link href="/admin/dashboard" className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${pathname === '/admin/dashboard' ? 'bg-white text-gray-900' : 'text-gray-300 hover:text-white'}`}>
                Admin
              </Link>
            </>
          )}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#c9a84c', color: '#1a1a1a' }}>
          MVP · v0.1
        </span>
        <span className="text-xs text-gray-400">Signal Law Group · Atlanta, GA</span>
        {role && role !== 'client' ? (
          <button onClick={logout} className="text-xs text-red-400 hover:text-red-300 transition">Sign out</button>
        ) : (
          <Link href="/auth/login" className="text-xs text-gray-300 hover:text-white transition">Login →</Link>
        )}
      </div>
    </header>
  );
}
