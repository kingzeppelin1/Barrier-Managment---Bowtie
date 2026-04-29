import Link, { type LinkProps } from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface KpiCardProps {
  label: string;
  value: number | string;
  hint?: string;
  tone?: 'default' | 'red' | 'yellow' | 'green';
  /** When set, the whole card becomes a clickable link to a filtered destination. */
  href?: LinkProps['href'];
  className?: string;
}

const TONE: Record<NonNullable<KpiCardProps['tone']>, string> = {
  default: '',
  red: 'text-status-red',
  yellow: 'text-status-yellow',
  green: 'text-status-green',
};

export function KpiCard({ label, value, hint, tone = 'default', href, className }: KpiCardProps) {
  const inner = (
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        {href && (
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
        )}
      </div>
      <div className={cn('mt-1 text-3xl font-semibold tabular-nums', TONE[tone])}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </CardContent>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          'group block rounded-lg outline-none ring-offset-background transition-shadow',
          'hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className,
        )}
      >
        <Card className="h-full border-2 border-transparent transition-colors group-hover:border-primary group-focus-visible:border-primary">
          {inner}
        </Card>
      </Link>
    );
  }

  return <Card className={className}>{inner}</Card>;
}
