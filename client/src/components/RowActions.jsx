import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/** Menu "..." cuối mỗi dòng. items: [{ label, icon, onSelect, danger?, separatorBefore? }] */
export default function RowActions({ items, label = 'Thao tác' }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={label} onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44" onClick={(e) => e.stopPropagation()}>
        {items.filter(Boolean).map((it) => (
          <div key={it.label}>
            {it.separatorBefore && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onSelect={it.onSelect}
              className={cn(it.danger && 'text-rose-600 focus:bg-rose-50 focus:text-rose-700 [&_svg]:text-rose-500')}
            >
              {it.icon && <it.icon />} {it.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
