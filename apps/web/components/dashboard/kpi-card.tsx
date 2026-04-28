import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface KpiCardProps {
  label: string;
  value: number | string;
  hint?: string;
  tone?: 'default' | 'red' | 'yellow' | 'green';
  className?: string;
}

const TONE: Record<NonNullable<KpiCardProps['tone']>, string> = {
  default: '',
  red: 'text-status-red',
  yellow: 'text-status-yellow',
  green: 'text-status-green',
};

export function KpiCard({ label, value, hint, tone = 'default', className }: KpiCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={cn('mt-1 text-3xl font-semibold tabular-nums', TONE[tone])}>{value}</div>
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}
