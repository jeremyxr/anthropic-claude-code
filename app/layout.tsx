import type { Metadata } from 'next';
import './globals.css';
import ClientLayout from '@/components/ClientLayout';

export const metadata: Metadata = {
  title: 'JaneFlow',
  description: 'Product development collaboration tool',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white dark:bg-gray-950">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
