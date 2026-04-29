'use client';

import { useEffect, useMemo, useRef } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type Node,
  type NodeMouseHandler,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { NODE_TYPES } from './node-types';
import { buildBowtieGraph, type BowtieGraphInput } from './layout';

export interface SelectedNode {
  kind: 'threat' | 'topEvent' | 'consequence' | 'barrier' | 'degradationFactor' | 'degradationControl';
  id: string;
}

interface BowtieCanvasProps extends BowtieGraphInput {
  onSelect?: (selected: SelectedNode | null) => void;
  selectedId?: string | null;
  /**
   * When set, the canvas centres + zooms in on the matching node after
   * mount. Used by deep links from the AI Coach Inbox (?focus=<id>).
   */
  focusNodeId?: string | null;
}

export function BowtieCanvas({ onSelect, selectedId, focusNodeId, ...input }: BowtieCanvasProps) {
  const { nodes, edges } = useMemo(() => buildBowtieGraph(input), [input]);

  const selectedKey = selectedId
    ? nodes.find((n) => extractEntityId(n) === selectedId)?.id ?? null
    : null;

  const decoratedNodes = useMemo<Node[]>(
    () => nodes.map((n) => ({ ...n, selected: n.id === selectedKey })),
    [nodes, selectedKey],
  );

  const handleNodeClick: NodeMouseHandler = (_, node) => {
    const kind = (node.type ?? 'threat') as SelectedNode['kind'];
    const id = extractEntityId(node);
    if (id) onSelect?.({ kind, id });
  };

  // Capture the React Flow imperative API so we can centre on a focus node
  // after layout has run.
  const flowRef = useRef<ReactFlowInstance | null>(null);

  useEffect(() => {
    if (!focusNodeId) return;
    const target = nodes.find((n) => extractEntityId(n) === focusNodeId);
    if (!target || !flowRef.current) return;
    // Wait for layout / fitView to settle so our setCenter wins.
    const timer = setTimeout(() => {
      // Centre on the node's middle, with a reasonable zoom.
      const cx = target.position.x + 90;
      const cy = target.position.y + 50;
      flowRef.current?.setCenter(cx, cy, { zoom: 1.1, duration: 600 });
    }, 350);
    return () => clearTimeout(timer);
  }, [focusNodeId, nodes]);

  return (
    <div data-tour="canvas" className="h-full w-full">
      <ReactFlow
        nodes={decoratedNodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodeClick={handleNodeClick}
        onPaneClick={() => onSelect?.(null)}
        onInit={(instance) => {
          flowRef.current = instance;
        }}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls showInteractive={false} className="!shadow-none" />
        <MiniMap
          pannable
          zoomable
          className="!hidden md:!block"
          nodeColor={(n) => {
            switch (n.type) {
              case 'topEvent':
                return 'hsl(var(--status-red))';
              case 'threat':
                return 'hsl(var(--status-yellow))';
              case 'consequence':
                return 'hsl(var(--status-red))';
              case 'degradationFactor':
                return 'hsl(var(--status-purple))';
              case 'degradationControl':
                return 'hsl(var(--status-blue))';
              case 'barrier':
              default:
                return 'hsl(var(--muted-foreground))';
            }
          }}
          maskColor="hsl(var(--muted) / 0.6)"
        />
      </ReactFlow>
    </div>
  );
}

function extractEntityId(node: Node): string | null {
  // ReactFlow node id encodes type+entity id, e.g. `barrier-br-off-001`.
  const match = node.id.match(/^(threat|consequence|barrier|df|dc|top-event)-(.+)$/);
  if (!match) return node.id === 'top-event' ? 'top-event' : null;
  return match[2] ?? null;
}
