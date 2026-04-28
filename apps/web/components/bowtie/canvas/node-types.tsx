'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { AlertTriangle, Flame, Shield, Sparkles, UserCog, Zap } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type {
  Barrier,
  Consequence,
  DegradationControl,
  DegradationFactor,
  HealthStatus,
  Threat,
} from '@bowtie/shared';

// -- Status colour mapping (drives the left stripe / pip on each card) ----
const STATUS_BG: Record<HealthStatus, string> = {
  green: 'bg-status-green',
  yellow: 'bg-status-yellow',
  red: 'bg-status-red',
  gray: 'bg-status-gray',
};

const STATUS_RING: Record<HealthStatus, string> = {
  green: 'ring-status-green/30',
  yellow: 'ring-status-yellow/30',
  red: 'ring-status-red/40',
  gray: 'ring-status-gray/30',
};

// -- Per-node data shapes (passed via React Flow node `data`) -------------
export interface ThreatNodeData {
  threat: Threat;
}
export interface TopEventNodeData {
  topEvent: string;
  hazard: string;
}
export interface ConsequenceNodeData {
  consequence: Consequence;
}
export interface BarrierNodeData {
  barrier: Barrier;
}
export interface DegradationFactorNodeData {
  factor: DegradationFactor;
}
export interface DegradationControlNodeData {
  control: DegradationControl;
}

// Keep node typing loose — React Flow's node generics are best-effort.
type NP<T> = NodeProps & { data: T };

// -- Threat ---------------------------------------------------------------
function ThreatNodeImpl({ data, selected }: NP<ThreatNodeData>) {
  const { threat } = data;
  return (
    <div
      className={cn(
        'group flex w-56 items-start gap-2 rounded-md border bg-card p-2.5 text-left shadow-sm transition-all',
        'hover:border-foreground/30',
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
      )}
    >
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-status-yellow/15 text-status-yellow">
        <Zap className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Threat</div>
        <div className="mt-0.5 text-xs leading-snug text-foreground">{threat.description}</div>
      </div>
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-muted-foreground" />
    </div>
  );
}
export const ThreatNode = memo(ThreatNodeImpl);

// -- Top Event ------------------------------------------------------------
function TopEventNodeImpl({ data, selected }: NP<TopEventNodeData>) {
  const { topEvent, hazard } = data;
  return (
    <div
      className={cn(
        'flex w-64 flex-col items-center gap-1 rounded-md border-2 border-status-red/60 bg-status-red/5 p-3 text-center shadow-md',
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-status-red" />
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-status-red" />
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-status-red">
        <Flame className="h-3 w-3" /> Top Event
      </div>
      <div className="text-sm font-semibold leading-tight">{topEvent}</div>
      <div className="text-[11px] text-muted-foreground">Hazard: {hazard}</div>
    </div>
  );
}
export const TopEventNode = memo(TopEventNodeImpl);

// -- Consequence ----------------------------------------------------------
const SEVERITY_VARIANT: Record<Consequence['severity'], 'red' | 'yellow' | 'outline'> = {
  catastrophic: 'red',
  major: 'red',
  moderate: 'yellow',
  minor: 'outline',
  negligible: 'outline',
};

function ConsequenceNodeImpl({ data, selected }: NP<ConsequenceNodeData>) {
  const { consequence } = data;
  return (
    <div
      className={cn(
        'flex w-56 items-start gap-2 rounded-md border bg-card p-2.5 text-left shadow-sm transition-all',
        'hover:border-foreground/30',
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-muted-foreground" />
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-status-red/15 text-status-red">
        <AlertTriangle className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Consequence</div>
          <Badge variant={SEVERITY_VARIANT[consequence.severity]} className="px-1.5 py-0 text-[9px] capitalize">
            {consequence.severity}
          </Badge>
        </div>
        <div className="mt-0.5 text-xs leading-snug text-foreground">{consequence.description}</div>
      </div>
    </div>
  );
}
export const ConsequenceNode = memo(ConsequenceNodeImpl);

// -- Barrier --------------------------------------------------------------
function BarrierNodeImpl({ data, selected }: NP<BarrierNodeData>) {
  const { barrier } = data;
  return (
    <div
      className={cn(
        'group relative flex w-44 flex-col rounded-md border bg-card text-left shadow-sm ring-1 ring-transparent transition-all',
        'hover:border-foreground/30',
        STATUS_RING[barrier.status],
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-muted-foreground" />
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-muted-foreground" />
      <Handle type="source" position={Position.Bottom} id="df" className="!h-2 !w-2 !border-0 !bg-status-purple" />
      <div className={cn('h-1 w-full rounded-t-md', STATUS_BG[barrier.status])} />
      <div className="flex items-start gap-2 p-2">
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Shield className="h-3 w-3" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground capitalize">
              {barrier.type}
            </div>
            <span className="text-[10px] font-medium tabular-nums text-muted-foreground">{barrier.healthScore}</span>
          </div>
          <div className="mt-0.5 truncate text-xs font-medium leading-snug">{barrier.name}</div>
          {barrier.criticality === 'critical' && (
            <Badge variant="outline" className="mt-1 px-1 py-0 text-[9px] uppercase tracking-wide">
              Critical
            </Badge>
          )}
          {barrier.withCompensatory && (
            <Badge variant="outline" className="ml-1 mt-1 px-1 py-0 text-[9px] uppercase tracking-wide">
              + comp
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
export const BarrierNode = memo(BarrierNodeImpl);

// -- Degradation Factor --------------------------------------------------
function DegradationFactorNodeImpl({ data, selected }: NP<DegradationFactorNodeData>) {
  const { factor } = data;
  return (
    <div
      className={cn(
        'flex w-44 items-start gap-1.5 rounded-md border border-status-purple/40 bg-status-purple/5 p-2 text-left shadow-sm transition-all',
        'hover:border-status-purple/70',
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
      )}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-status-purple" />
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-status-purple" />
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-status-purple/15 text-status-purple">
        <UserCog className="h-3 w-3" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-medium uppercase tracking-wide text-status-purple">Degradation Factor</div>
        <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug">{factor.description}</div>
      </div>
    </div>
  );
}
export const DegradationFactorNode = memo(DegradationFactorNodeImpl);

// -- Degradation Control --------------------------------------------------
function DegradationControlNodeImpl({ data, selected }: NP<DegradationControlNodeData>) {
  const { control } = data;
  return (
    <div
      className={cn(
        'flex w-44 items-start gap-1.5 rounded-md border border-status-blue/40 bg-status-blue/5 p-2 text-left shadow-sm transition-all',
        'hover:border-status-blue/70',
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
      )}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-status-blue" />
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-status-blue/15 text-status-blue">
        <Sparkles className="h-3 w-3" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <div className="text-[10px] font-medium uppercase tracking-wide text-status-blue">DC</div>
          <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_BG[control.status])} />
        </div>
        <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug">{control.name}</div>
      </div>
    </div>
  );
}
export const DegradationControlNode = memo(DegradationControlNodeImpl);

// -- Map for ReactFlow `nodeTypes` prop -----------------------------------
export const NODE_TYPES = {
  threat: ThreatNode,
  topEvent: TopEventNode,
  consequence: ConsequenceNode,
  barrier: BarrierNode,
  degradationFactor: DegradationFactorNode,
  degradationControl: DegradationControlNode,
} as const;

export type BowtieNodeKind = keyof typeof NODE_TYPES;
