import React from 'react';
import { StatusIndicator, SystemStatusType } from './StatusIndicator';
import './OperatorStatus.css';

export type OperatorConnectionState = 'CONNECTED' | 'WAITING' | 'CONNECTION LOST' | 'RECONNECTING';

interface OperatorStatusProps {
  currentOperatorNumber: 1 | 2;
  operator1Status?: OperatorConnectionState;
  operator2Status?: OperatorConnectionState;
  operator1Name?: string;
  operator2Name?: string;
  className?: string;
}

const mapStateToStatusType = (state: OperatorConnectionState): SystemStatusType => {
  switch (state) {
    case 'CONNECTED':
      return 'connected';
    case 'WAITING':
      return 'waiting';
    case 'RECONNECTING':
      return 'waiting';
    case 'CONNECTION LOST':
      return 'error';
    default:
      return 'offline';
  }
};

export const OperatorStatus: React.FC<OperatorStatusProps> = ({
  currentOperatorNumber,
  operator1Status = 'CONNECTED',
  operator2Status = 'WAITING',
  operator1Name,
  operator2Name,
  className = '',
}) => {
  return (
    <div className={`operator-status-grid ${className}`}>
      {/* Operator 01 */}
      <div className={`operator-status-row ${currentOperatorNumber === 1 ? 'is-current' : ''}`}>
        <div className="operator-title">
          <span>OPERATOR 01</span>
          {operator1Name && <span className="operator-tag">{operator1Name}</span>}
          {currentOperatorNumber === 1 && <span className="text-cyan font-bold text-xs">[YOU]</span>}
        </div>
        <StatusIndicator
          status={mapStateToStatusType(operator1Status)}
          label={operator1Status}
        />
      </div>

      {/* Operator 02 */}
      <div className={`operator-status-row ${currentOperatorNumber === 2 ? 'is-current' : ''}`}>
        <div className="operator-title">
          <span>OPERATOR 02</span>
          {operator2Name && <span className="operator-tag">{operator2Name}</span>}
          {currentOperatorNumber === 2 && <span className="text-cyan font-bold text-xs">[YOU]</span>}
        </div>
        <StatusIndicator
          status={mapStateToStatusType(operator2Status)}
          label={operator2Status}
        />
      </div>
    </div>
  );
};
