import React from 'react';
import { SystemMessage } from '../ui/SystemMessage';

interface GameStatusProps {
  message: string | null;
}

export const GameStatus: React.FC<GameStatusProps> = ({ message }) => {
  if (!message) return null;

  const isWarning = message.includes('WAITING') || message.includes('NOT_STARTED');
  const isDanger = message.includes('CRITICAL') || message.includes('ANOMALY');
  const isSuccess = message.includes('VERIFIED') || message.includes('COMPLETE') || message.includes('SUCCESS');

  const type = isDanger ? 'danger' : isWarning ? 'warning' : isSuccess ? 'success' : 'info';

  return (
    <div style={{ marginBottom: '20px' }}>
      <SystemMessage
        message={message}
        type={type}
        withScramble={false}
      />
    </div>
  );
};
