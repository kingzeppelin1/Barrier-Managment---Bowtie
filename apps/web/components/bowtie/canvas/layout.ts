import type { Edge, Node } from '@xyflow/react';
import type {
  Barrier,
  Bowtie,
  Consequence,
  DegradationControl,
  DegradationFactor,
  HealthStatus,
  Threat,
} from '@bowtie/shared';

/**
 * Hand-tuned bowtie layout. Deterministic. Pure.
 *
 *   Threats (col 0)  Preventive barriers (cols 1..N)  Top Event (col N+1)
 *                                                                  ↓
 *                              Mitigative barriers (cols N+2..M)  Consequences (col M+1)
 *
 * Each barrier appears exactly once. Threats fan into the preventive barriers
 * referenced by `threat.preventiveBarrierIds`; consequences fan into the
 * mitigative barriers referenced by `consequence.mitigativeBarrierIds`.
 *
 * Degradation Factors hang off their barriers (downwards), and each DC hangs
 * off its DF.
 */

const COL_W = 240;
const ROW_H = 110;
const TE_GAP = 280;
const DF_OFFSET_Y = 140;
const DC_OFFSET_Y = DF_OFFSET_Y + 110;

const STATUS_STROKE: Record<HealthStatus, string> = {
  green: 'hsl(var(--status-green))',
  yellow: 'hsl(var(--status-yellow))',
  red: 'hsl(var(--status-red))',
  gray: 'hsl(var(--status-gray))',
};

export interface BowtieGraphInput {
  bowtie: Bowtie;
  threats: Threat[];
  consequences: Consequence[];
  barriers: Barrier[];
  degradationFactors: DegradationFactor[];
  degradationControls: DegradationControl[];
}

export interface BowtieGraph {
  nodes: Node[];
  edges: Edge[];
}

function chainColumnIndex(barrierId: string, chains: string[][]): number {
  // Pick the maximum index across any chain that contains this barrier.
  let max = 0;
  for (const chain of chains) {
    const idx = chain.indexOf(barrierId);
    if (idx > max) max = idx;
  }
  return max;
}

export function buildBowtieGraph(input: BowtieGraphInput): BowtieGraph {
  const { bowtie, threats, consequences, barriers, degradationFactors, degradationControls } = input;

  const prevBarriers = barriers.filter((b) => bowtie.preventiveBarrierIds.includes(b.id));
  const mitBarriers = barriers.filter((b) => bowtie.mitigativeBarrierIds.includes(b.id));

  const prevChains = threats.map((t) => t.preventiveBarrierIds);
  const mitChains = consequences.map((c) => c.mitigativeBarrierIds);

  const maxPrevCols = prevChains.reduce((m, c) => Math.max(m, c.length), 0) || 1;
  const maxMitCols = mitChains.reduce((m, c) => Math.max(m, c.length), 0) || 1;

  // Vertical spacing should accommodate the larger of threats / consequences.
  const lanes = Math.max(threats.length, consequences.length, 1);

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // -- Threats (col 0, vertically stacked) --------------------------------
  threats.forEach((t, i) => {
    nodes.push({
      id: `threat-${t.id}`,
      type: 'threat',
      position: { x: 0, y: i * ROW_H + (lanes - threats.length) * (ROW_H / 2) },
      data: { threat: t },
    });
  });

  // -- Preventive barriers (cols 1..maxPrevCols) -------------------------
  // Each barrier placed by its max chain index across threats; ties stack y.
  const prevBarrierPositions = new Map<string, { x: number; y: number }>();
  const prevColAssignments: string[][] = Array.from({ length: maxPrevCols }, () => []);
  for (const b of prevBarriers) {
    const colIdx = chainColumnIndex(b.id, prevChains);
    prevColAssignments[colIdx]!.push(b.id);
  }
  prevColAssignments.forEach((idsInCol, colIdx) => {
    idsInCol.forEach((bid, i) => {
      const x = (colIdx + 1) * COL_W;
      const y = i * ROW_H + (lanes - idsInCol.length) * (ROW_H / 2);
      prevBarrierPositions.set(bid, { x, y });
      const barrier = prevBarriers.find((b) => b.id === bid)!;
      nodes.push({
        id: `barrier-${bid}`,
        type: 'barrier',
        position: { x, y },
        data: { barrier },
      });
    });
  });

  // -- Top Event (centered between sides) --------------------------------
  const topEventX = (maxPrevCols + 1) * COL_W + TE_GAP / 4;
  const topEventY = ((lanes - 1) * ROW_H) / 2;
  nodes.push({
    id: 'top-event',
    type: 'topEvent',
    position: { x: topEventX, y: topEventY },
    data: { topEvent: bowtie.topEvent, hazard: bowtie.hazard },
  });

  // -- Mitigative barriers (cols beyond top event) -----------------------
  const mitBarrierPositions = new Map<string, { x: number; y: number }>();
  const mitColAssignments: string[][] = Array.from({ length: maxMitCols }, () => []);
  for (const b of mitBarriers) {
    const colIdx = chainColumnIndex(b.id, mitChains);
    mitColAssignments[colIdx]!.push(b.id);
  }
  const mitStartX = topEventX + COL_W + TE_GAP / 2;
  mitColAssignments.forEach((idsInCol, colIdx) => {
    idsInCol.forEach((bid, i) => {
      const x = mitStartX + colIdx * COL_W;
      const y = i * ROW_H + (lanes - idsInCol.length) * (ROW_H / 2);
      mitBarrierPositions.set(bid, { x, y });
      const barrier = mitBarriers.find((b) => b.id === bid)!;
      nodes.push({
        id: `barrier-${bid}`,
        type: 'barrier',
        position: { x, y },
        data: { barrier },
      });
    });
  });

  // -- Consequences (right-most column) ---------------------------------
  const consequenceX = mitStartX + maxMitCols * COL_W;
  consequences.forEach((c, i) => {
    nodes.push({
      id: `consequence-${c.id}`,
      type: 'consequence',
      position: { x: consequenceX, y: i * ROW_H + (lanes - consequences.length) * (ROW_H / 2) },
      data: { consequence: c },
    });
  });

  // -- Degradation Factors / Controls (hang under their barrier) -------
  const factorsByBarrier = new Map<string, DegradationFactor[]>();
  for (const f of degradationFactors) {
    const list = factorsByBarrier.get(f.barrierId) ?? [];
    list.push(f);
    factorsByBarrier.set(f.barrierId, list);
  }
  factorsByBarrier.forEach((fs, barrierId) => {
    const pos = prevBarrierPositions.get(barrierId) ?? mitBarrierPositions.get(barrierId);
    if (!pos) return;
    fs.forEach((f, fi) => {
      const dfX = pos.x + (fi - (fs.length - 1) / 2) * 30;
      const dfY = pos.y + DF_OFFSET_Y;
      nodes.push({
        id: `df-${f.id}`,
        type: 'degradationFactor',
        position: { x: dfX, y: dfY },
        data: { factor: f },
      });
      // Edge: barrier (bottom 'df' handle) → DF (navy, dashed)
      edges.push({
        id: `edge-b-${barrierId}-df-${f.id}`,
        source: `barrier-${barrierId}`,
        sourceHandle: 'df',
        target: `df-${f.id}`,
        type: 'smoothstep',
        style: { stroke: 'hsl(var(--star-navy))', strokeWidth: 1.5, strokeDasharray: '4 3' },
      });

      // DCs
      const dcs = degradationControls.filter((dc) => dc.degradationFactorId === f.id);
      dcs.forEach((dc, di) => {
        const dcX = dfX + (di - (dcs.length - 1) / 2) * 30;
        const dcY = pos.y + DC_OFFSET_Y;
        nodes.push({
          id: `dc-${dc.id}`,
          type: 'degradationControl',
          position: { x: dcX, y: dcY },
          data: { control: dc },
        });
        edges.push({
          id: `edge-df-${f.id}-dc-${dc.id}`,
          source: `df-${f.id}`,
          target: `dc-${dc.id}`,
          type: 'smoothstep',
          // DF → DC edge: STAR Teal (information / control link)
          style: { stroke: 'hsl(var(--star-teal))', strokeWidth: 1.5 },
        });
      });
    });
  });

  // -- Edges: threat → preventive barriers (per chain) -----------------
  for (const t of threats) {
    const chain = t.preventiveBarrierIds;
    if (chain.length === 0) {
      edges.push({
        id: `edge-t-${t.id}-te`,
        source: `threat-${t.id}`,
        target: 'top-event',
        type: 'smoothstep',
      });
      continue;
    }
    edges.push({
      id: `edge-t-${t.id}-b-${chain[0]}`,
      source: `threat-${t.id}`,
      target: `barrier-${chain[0]}`,
      type: 'smoothstep',
      style: edgeStyleForBarrier(prevBarriers.find((b) => b.id === chain[0])),
    });
    for (let i = 0; i < chain.length - 1; i += 1) {
      edges.push({
        id: `edge-b-${chain[i]}-b-${chain[i + 1]}-${t.id}`,
        source: `barrier-${chain[i]}`,
        target: `barrier-${chain[i + 1]}`,
        type: 'smoothstep',
        style: edgeStyleForBarrier(prevBarriers.find((b) => b.id === chain[i + 1])),
      });
    }
    edges.push({
      id: `edge-b-${chain[chain.length - 1]}-te-${t.id}`,
      source: `barrier-${chain[chain.length - 1]}`,
      target: 'top-event',
      type: 'smoothstep',
      style: edgeStyleForBarrier(prevBarriers.find((b) => b.id === chain[chain.length - 1])),
    });
  }

  // -- Edges: top event → mitigative barriers → consequences ----------
  for (const c of consequences) {
    const chain = c.mitigativeBarrierIds;
    if (chain.length === 0) {
      edges.push({
        id: `edge-te-c-${c.id}`,
        source: 'top-event',
        target: `consequence-${c.id}`,
        type: 'smoothstep',
      });
      continue;
    }
    edges.push({
      id: `edge-te-b-${chain[0]}-${c.id}`,
      source: 'top-event',
      target: `barrier-${chain[0]}`,
      type: 'smoothstep',
      style: edgeStyleForBarrier(mitBarriers.find((b) => b.id === chain[0])),
    });
    for (let i = 0; i < chain.length - 1; i += 1) {
      edges.push({
        id: `edge-mb-${chain[i]}-${chain[i + 1]}-${c.id}`,
        source: `barrier-${chain[i]}`,
        target: `barrier-${chain[i + 1]}`,
        type: 'smoothstep',
        style: edgeStyleForBarrier(mitBarriers.find((b) => b.id === chain[i + 1])),
      });
    }
    edges.push({
      id: `edge-mb-${chain[chain.length - 1]}-c-${c.id}`,
      source: `barrier-${chain[chain.length - 1]}`,
      target: `consequence-${c.id}`,
      type: 'smoothstep',
      style: edgeStyleForBarrier(mitBarriers.find((b) => b.id === chain[chain.length - 1])),
    });
  }

  return { nodes, edges };
}

function edgeStyleForBarrier(barrier: Barrier | undefined): { stroke: string; strokeWidth: number } {
  if (!barrier) return { stroke: 'hsl(var(--border))', strokeWidth: 1.5 };
  return { stroke: STATUS_STROKE[barrier.status], strokeWidth: 1.75 };
}
