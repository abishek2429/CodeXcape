import React from 'react';
import './RadarScan.css';

export interface RadarNode {
  id: string;
  label: string;
  xPercent: number; // 0 to 100
  yPercent: number; // 0 to 100
  isAnomaly?: boolean;
}

interface RadarScanProps {
  nodes?: RadarNode[];
  activeNodeId?: string;
  onNodeClick?: (nodeId: string) => void;
  className?: string;
}

const DEFAULT_NODES: RadarNode[] = [
  { id: 'node-01', label: 'NODE 01', xPercent: 28, yPercent: 32 },
  { id: 'node-02', label: 'NODE 02', xPercent: 72, yPercent: 26 },
  { id: 'node-03', label: 'NODE 03', xPercent: 80, yPercent: 68 },
  { id: 'node-04', label: 'NODE 04', xPercent: 25, yPercent: 75 },
  { id: 'node-05', label: 'NODE 05', xPercent: 50, yPercent: 48 },
  { id: 'node-06', label: 'NODE 06 [?]', xPercent: 88, yPercent: 85, isAnomaly: true },
];

export const RadarScan: React.FC<RadarScanProps> = ({
  nodes = DEFAULT_NODES,
  activeNodeId,
  onNodeClick,
  className = '',
}) => {
  return (
    <div className={`radar-scan-container ${className}`} aria-label="Network Radar Topology">
      {/* Concentric distance rings */}
      <div className="radar-ring radar-ring-1" />
      <div className="radar-ring radar-ring-2" />
      <div className="radar-ring radar-ring-3" />

      {/* Crosshair axis */}
      <div className="radar-axis-x" />
      <div className="radar-axis-y" />

      {/* Rotating sweep beam */}
      <div className="radar-sweep" />

      {/* Target Nodes */}
      {nodes.map((node) => {
        const isSelected = activeNodeId === node.id;
        return (
          <div
            key={node.id}
            className={`radar-blip ${node.isAnomaly ? 'blip-anomaly' : ''}`}
            style={{
              left: `${node.xPercent}%`,
              top: `${node.yPercent}%`,
              transform: isSelected ? 'translate(-50%, -50%) scale(1.4)' : undefined,
            }}
            onClick={() => onNodeClick && onNodeClick(node.id)}
            title={`${node.label} (${node.xPercent}%, ${node.yPercent}%)`}
          >
            <span className="radar-blip-label">{node.label}</span>
          </div>
        );
      })}
    </div>
  );
};
