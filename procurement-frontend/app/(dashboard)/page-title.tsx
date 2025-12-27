'use client';

import { usePathname } from 'next/navigation';

export function PageTitle() {
  const pathname = usePathname();
  
  const pageTitles: Record<string, string> = {
    '/': 'Home',
    '/suppliers': 'Proveedores',
    '/purchase-orders': 'Órdenes de Compra',
    '/receipts': 'Recepciones',
    '/users': 'Usuarios',
    '/settings': 'Configuración'
  };
  
  // Intentar encontrar una coincidencia exacta primero
  let title = pageTitles[pathname];
  
  // Si no hay coincidencia exacta, buscar por prefijo (para rutas anidadas)
  if (!title) {
    const matchingPath = Object.keys(pageTitles).find(path => 
      pathname.startsWith(path) && path !== '/'
    );
    title = matchingPath ? pageTitles[matchingPath] : 'Home';
  }
  
  return (
    <h1 className="font-semibold text-lg md:text-xl hidden md:block">
      {title}
    </h1>
  );
}

