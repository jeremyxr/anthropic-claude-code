'use client';

import { UserProvider } from '@/lib/user-context';
import { SettingsProvider } from '@/lib/settings-context';
import Sidebar from '@/components/Sidebar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <SettingsProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </SettingsProvider>
    </UserProvider>
  );
}
