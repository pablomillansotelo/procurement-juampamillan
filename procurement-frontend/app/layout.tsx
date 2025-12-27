import './globals.css';

import { Analytics } from '@vercel/analytics/react';

export const metadata = {
  title: 'Procurement - Sistema de Compras',
  description:
    'Sistema de gestión de compras. Administra proveedores, órdenes de compra y recepciones.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="flex min-h-screen w-full flex-col">{children}</body>
      <Analytics />
    </html>
  );
}

