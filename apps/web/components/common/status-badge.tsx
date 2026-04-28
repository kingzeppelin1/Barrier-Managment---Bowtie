import type { HealthStatus } from '@bowtie/shared';
import { Badge } from '@/components/ui/badge';

const LABEL: Record<HealthStatus, string> = {
  green: 'Green',
  yellow: 'Yellow',
  red: 'Red',
  gray: 'Unknown',
};

export function StatusBadge({ status, withCompensatory }: { status: HealthStatus; withCompensatory?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Badge variant={status}>{LABEL[status]}</Badge>
      {withCompensatory && status === 'red' && (
        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
          + compensatory
        </Badge>
      )}
    </span>
  );
}
