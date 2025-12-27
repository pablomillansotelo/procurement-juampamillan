'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useDebounce } from '@/lib/hooks/use-debounce';

interface TableSearchProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  initialValue?: string;
}

/**
 * Componente de búsqueda reutilizable para tablas con debounce
 */
export function TableSearch({
  placeholder = 'Buscar...',
  onSearch,
  initialValue = '',
}: TableSearchProps) {
  const [searchValue, setSearchValue] = useState(initialValue);
  const debouncedSearch = useDebounce(searchValue, 300);

  useEffect(() => {
    onSearch(debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  return (
    <div className="relative mb-4">
      <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className="pl-8 w-full md:w-[300px]"
      />
    </div>
  );
}

