import React, { useState } from 'react';
import { Send, CheckCircle2, Terminal } from 'lucide-react';
import { AnswerType } from '../../types/game';

interface AnswerInputProps {
  answerType: AnswerType;
  placeholderText?: string;
  options?: string[];
  puzzleMetadata?: string;
  onSubmit: (answer: string, interactionPayload?: string) => void;
  isSubmitting?: boolean;
}

export const AnswerInput: React.FC<AnswerInputProps> = ({
  answerType,
  placeholderText,
  options,
  puzzleMetadata,
  onSubmit,
  isSubmitting = false,
}) => {
  const [answer, setAnswer] = useState('');
  const [submittedFeedback, setSubmittedFeedback] = useState<string | null>(null);
  const [selectedOperation, setSelectedOperation] = useState('');
  const [orderedItems, setOrderedItems] = useState<string[]>([]);

  let interaction: { interaction?: string; operations?: string[] } = {};
  try { interaction = puzzleMetadata ? JSON.parse(puzzleMetadata) : {}; } catch { interaction = {}; }

  React.useEffect(() => {
    try {
      const parsed = puzzleMetadata ? JSON.parse(puzzleMetadata) : {};
      setOrderedItems(Array.isArray(parsed.items) ? parsed.items : []);
    } catch {
      setOrderedItems([]);
    }
  }, [puzzleMetadata]);

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= orderedItems.length) return;
    const next = [...orderedItems];
    [next[index], next[target]] = [next[target], next[index]];
    setOrderedItems(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isSubmitting) return;

    onSubmit(answer.trim(), JSON.stringify({
      interaction: interaction.interaction || 'answer',
      operation: selectedOperation || undefined,
      order: orderedItems,
    }));
    setSubmittedFeedback(`PAYLOAD "${answer.trim().toUpperCase()}" DISPATCHED.`);

    setTimeout(() => {
      setSubmittedFeedback(null);
    }, 4000);
  };

  return (
    <div className="cyber-panel" style={{ padding: '24px', fontFamily: 'var(--font-mono)' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px dashed var(--border-cyan)' }}>
        <h2 className="terminal-text" style={{ fontSize: '13px', letterSpacing: '0.1em', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={16} />
          <span>SOLUTION DISPATCH</span>
        </h2>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {answerType} INPUT MODE
        </span>
      </div>

      {submittedFeedback && (
        <div className="animate-fade-in" style={{ marginBottom: '20px', padding: '12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-cyan-faded)', border: '1px solid var(--accent-cyan-dim)', color: 'var(--accent-cyan)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={16} />
          <span className="font-bold">{submittedFeedback}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {interaction.operations && interaction.operations.length > 0 && (
          <div style={{ marginBottom: '20px', padding: '16px', border: '1px solid var(--border-cyan)', background: 'rgba(0,0,0,0.35)' }}>
            <div className="terminal-text" style={{ fontSize: '11px', marginBottom: '10px' }}>SELECT OPERATION DISCOVERED FROM EVIDENCE</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {interaction.operations.map((operation) => (
                <button key={operation} type="button" className={`btn ${selectedOperation === operation ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSelectedOperation(operation)}>
                  {operation}
                </button>
              ))}
            </div>
          </div>
        )}
        {orderedItems.length > 0 && (
          <div style={{ marginBottom: '20px', padding: '16px', border: '1px solid var(--border-cyan)', background: 'rgba(0,0,0,0.35)' }}>
            <div className="terminal-text" style={{ fontSize: '11px', marginBottom: '10px' }}>RECONSTRUCTION ORDER</div>
            {orderedItems.map((item, index) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="terminal-text" style={{ width: '24px' }}>{index + 1}.</span>
                <span style={{ flex: 1, padding: '8px', border: '1px solid var(--border-dim)' }}>{item}</span>
                <button type="button" className="btn btn-secondary" disabled={index === 0} onClick={() => moveItem(index, -1)} title="Move item up">UP</button>
                <button type="button" className="btn btn-secondary" disabled={index === orderedItems.length - 1} onClick={() => moveItem(index, 1)} title="Move item down">DOWN</button>
              </div>
            ))}
          </div>
        )}
        {answerType === 'MULTIPLE_CHOICE' && options && options.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            {options.map((option, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setAnswer(option)}
                style={{
                  padding: '16px', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid', 
                  fontSize: '14px', 
                  textAlign: 'left', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  transition: 'all var(--transition-fast)',
                  backgroundColor: answer === option ? 'var(--accent-cyan-faded)' : 'rgba(0,0,0,0.4)',
                  borderColor: answer === option ? 'var(--accent-cyan)' : 'var(--border-dim)',
                  color: answer === option ? 'var(--accent-cyan)' : 'var(--text-primary)',
                  boxShadow: answer === option ? 'inset 0 0 15px rgba(0,217,255,0.1)' : 'none',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                <span style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', backgroundColor: answer === option ? 'var(--bg-panel)' : 'rgba(255,255,255,0.05)', border: '1px solid var(--border-dim)', color: answer === option ? 'var(--accent-cyan)' : 'var(--text-muted)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{option}</span>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <div className="terminal-text" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', fontSize: '16px', pointerEvents: 'none' }}>
              &gt;
            </div>
            <input
              type={answerType === 'NUMERIC' ? 'number' : 'text'}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="cyber-input"
              placeholder={placeholderText || (answerType === 'NUMERIC' ? 'INPUT NUMERIC SOLUTION_' : 'INPUT SOLUTION_')}
              disabled={isSubmitting}
              style={{ paddingLeft: '40px', paddingRight: '80px', fontSize: '16px', height: '56px' }}
            />
            <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', backgroundColor: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-dim)' }}>
              {answerType}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!answer.trim() || isSubmitting}
            style={{ width: '100%' }}
          >
            {isSubmitting ? (
              <span>VERIFYING PAYLOAD...</span>
            ) : (
              <>
                <span>TRANSMIT SOLUTION</span>
                <Send size={16} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
