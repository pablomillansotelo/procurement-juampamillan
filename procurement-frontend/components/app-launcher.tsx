'use client';

import { useState } from 'react';
import { Grip, ShoppingCart, Package, Factory, Truck, Shield, Banknote, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface App {
  id: string;
  name: string;
  icon: React.ReactNode;
  href: string;
  description?: string;
}

const apps: App[] = [
  {
    id: 'permit',
    name: 'Permit',
    icon: <Shield className="h-6 w-6" />,
    href: 'https://permit.juampamillan.com',
    description: 'Sistema de gestión RBAC',
  },
  {
    id: 'vendor',
    name: 'Vendor',
    icon: <Banknote className="h-6 w-6" />,
    href: 'https://vendor.juampamillan.com',
    description: 'Sistema de ventas',
  },
  {
    id: 'inventory',
    name: 'Inventory',
    icon: <Package className="h-6 w-6" />,
    href: 'https://inventory.juampamillan.com',
    description: 'Catálogo y stock',
  },
  {
    id: 'factory',
    name: 'Factory',
    icon: <Factory className="h-6 w-6" />,
    href: 'https://factory.juampamillan.com',
    description: 'Manufactura',
  },
  {
    id: 'shipments',
    name: 'Shipments',
    icon: <Truck className="h-6 w-6" />,
    href: 'https://shipments.juampamillan.com',
    description: 'Embarques',
  },
  {
    id: 'procurement',
    name: 'Procurement',
    icon: <ShoppingCart className="h-6 w-6" />,
    href: '#',
    description: 'Compras',
  },
  {
    id: 'finance',
    name: 'Finance',
    icon: <Receipt className="h-6 w-6" />,
    href: 'https://finance.juampamillan.com',
    description: 'Finanzas',
  },
];

export function AppLauncher() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Grip className="h-5 w-5" />
          <span className="sr-only">Aplicaciones</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-2">
          <h3 className="font-semibold text-sm mb-3">Aplicaciones</h3>
          <div className="grid grid-cols-2 gap-3">
            {apps.map((app) => (
              <Link
                key={app.id}
                href={app.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-lg border transition-colors",
                  "hover:bg-muted hover:border-primary/50",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  app.id === 'procurement' && "bg-primary/10 border-primary/50"
                )}
              >
                <div className="mb-2 text-primary">
                  {app.icon}
                </div>
                <span className="text-sm font-medium">{app.name}</span>
                {app.description && (
                  <span className="text-xs text-muted-foreground mt-1 text-center">
                    {app.description}
                  </span>
                )}
              </Link>
            ))}
          </div>
          {apps.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay aplicaciones disponibles
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

