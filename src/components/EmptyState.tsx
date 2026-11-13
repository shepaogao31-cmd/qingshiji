import { UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: typeof UtensilsCrossed;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  icon: Icon = UtensilsCrossed,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-10 text-center',
        className,
      )}
    >
      <div className="mb-3 flex size-12 items-center justify-center rounded-md bg-muted/60">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
