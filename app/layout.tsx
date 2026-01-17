import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Product Dev Collaboration',
  description: 'Manage product development work with design collaboration on top of JIRA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
