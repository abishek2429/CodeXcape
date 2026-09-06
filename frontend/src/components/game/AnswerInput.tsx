import React, { useState } from 'react';
import { Send, CheckCircle2, Terminal } from 'lucide-react';
import { AnswerType } from '../../types/game';
import { soundService } from '../../services/soundService';

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

  // Access Panel state for Level 1 Stage 2
  const [selectedNode, setSelectedNode] = useState('');
  const [selectedProcess, setSelectedProcess] = useState('');
  const [selectedSequence, setSelectedSequence] = useState('');

  // 6-digit final protocol passkey state for Level 6 Stage 3
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);

  let interaction: {
    interaction?: string;
    operations?: string[];
    nodes?: string[];
    processes?: string[];
    sequences?: string[];
    discovery?: string;
  } = {};

  try {
    interaction = puzzleMetadata ? JSON.parse(puzzleMetadata) : {};
  } catch {
    interaction = {};
  }

  React.useEffect(() => {
    try {
      const parsed = puzzleMetadata ? JSON.parse(puzzleMetadata) : {};
      setOrderedItems(Array.isArray(parsed.items) ? parsed.items : []);
      if (parsed.discovery && !answer) {
        if (parsed.interaction !== 'final-protocol' && parsed.interaction !== 'access-panel') {
          // Pre-populate suggested discovery if appropriate
        }
      }
    } catch {
      setOrderedItems([]);
    }
  }, [puzzleMetadata]);

  // Sync access panel selections to answer
  React.useEffect(() => {
    if (interaction.interaction === 'access-panel') {
      if (selectedNode && selectedProcess && selectedSequence) {
        if (selectedNode === 'N-4' && selectedProcess === 'relay' && selectedSequence === 'K-17') {
          setAnswer('RECOVERY FRAGMENT 01');
        } else {
          setAnswer(`${selectedNode} ${selectedProcess} ${selectedSequence}`);
        }
      }
    }
  }, [selectedNode, selectedProcess, selectedSequence, interaction.interaction]);

  // Sync 6-digit inputs to answer
  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    setAnswer(next.join(''));

    // Auto-advance to next input if filled
    if (clean && index < 5) {
      const nextInput = document.getElementById(`digit-box-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const prevInput = document.getElementById(`digit-box-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

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

    soundService.playClick();
    onSubmit(answer.trim(), JSON.stringify({
      interaction: interaction.interaction || 'answer',
      operation: selectedOperation || undefined,
      order: orderedItems,
      node: selectedNode || undefined,
      process: selectedProcess || undefined,
      sequence: selectedSequence || undefined,
    }));
    setSubmittedFeedback(`> ACCESS REQUEST RECEIVED: TRANSMITTING "${answer.trim().toUpperCase()}"...`);

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
          {interaction.interaction === 'final-protocol' ? 'FINAL ACCESS CODE ENTRY' : `${answerType} INPUT MODE`}
        </span>
      </div>

      {submittedFeedback && (
        <div className="animate-fade-in" style={{ marginBottom: '20px', padding: '12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-cyan-faded)', border: '1px solid var(--accent-cyan-dim)', color: 'var(--accent-cyan)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={16} />
          <span className="font-bold">{submittedFeedback}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Level 1 Stage 2 Access Panel Controls */}
        {interaction.interaction === 'access-panel' && (
          <div style={{ marginBottom: '20px', padding: '16px', border: '1px solid var(--border-cyan)', background: 'rgba(0,0,0,0.45)', borderRadius: 'var(--radius-sm)' }}>
            <div className="terminal-text" style={{ fontSize: '12px', marginBottom: '14px', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
              &gt; ACCESS PANEL INTERACTIVE CALIBRATION:
            </div>

            {/* Node Selector */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>NODE SELECTION:</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(interaction.nodes || ['N-2', 'N-4', 'N-7']).map(node => (
                  <button
                    key={node}
                    type="button"
                    className={`btn ${selectedNode === node ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSelectedNode(node)}
                    style={{ flex: 1, padding: '10px' }}
                  >
                    {node}
                  </button>
                ))}
              </div>
            </div>

            {/* Process Selector */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>PROCESS SELECTION:</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(interaction.processes || ['relay', 'watcher', 'archive']).map(proc => (
                  <button
                    key={proc}
                    type="button"
                    className={`btn ${selectedProcess === proc ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSelectedProcess(proc)}
                    style={{ flex: 1, padding: '10px' }}
                  >
                    {proc}
                  </button>
                ))}
              </div>
            </div>

            {/* Sequence Selector */}
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>SEQUENCE SELECTION:</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(interaction.sequences || ['K-17', 'R-03', 'M-22']).map(seq => (
                  <button
                    key={seq}
                    type="button"
                    className={`btn ${selectedSequence === seq ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSelectedSequence(seq)}
                    style={{ flex: 1, padding: '10px' }}
                  >
                    {seq}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Transformation Pipeline Selection */}
        {interaction.operations && interaction.operations.length > 0 && (
          <div style={{ marginBottom: '20px', padding: '16px', border: '1px solid var(--border-cyan)', background: 'rgba(0,0,0,0.35)', borderRadius: 'var(--radius-sm)' }}>
            <div className="terminal-text" style={{ fontSize: '11px', marginBottom: '10px', color: 'var(--accent-cyan)' }}>
              SELECT OPERATION DISCOVERED FROM EVIDENCE:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {interaction.operations.map((operation) => (
                <button
                  key={operation}
                  type="button"
                  className={`btn ${selectedOperation === operation ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectedOperation(operation)}
                >
                  {operation}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ordered Reconstruction Items */}
        {orderedItems.length > 0 && (
          <div style={{ marginBottom: '20px', padding: '16px', border: '1px solid var(--border-cyan)', background: 'rgba(0,0,0,0.35)', borderRadius: 'var(--radius-sm)' }}>
            <div className="terminal-text" style={{ fontSize: '11px', marginBottom: '10px', color: 'var(--accent-cyan)' }}>
              RECONSTRUCTION SEQUENCE ALIGNMENT:
            </div>
            {orderedItems.map((item, index) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="terminal-text" style={{ width: '24px', color: 'var(--text-muted)' }}>{index + 1}.</span>
                <span style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border-dim)', background: 'rgba(0,0,0,0.5)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
                  {item}
                </span>
                <button type="button" className="btn btn-secondary" disabled={index === 0} onClick={() => moveItem(index, -1)} title="Move item up">▲</button>
                <button type="button" className="btn btn-secondary" disabled={index === orderedItems.length - 1} onClick={() => moveItem(index, 1)} title="Move item down">▼</button>
              </div>
            ))}
          </div>
        )}

        {/* Level 6 Stage 3 Final Protocol 6-Digit Entry */}
        {interaction.interaction === 'final-protocol' ? (
          <div style={{ marginBottom: '24px', padding: '24px', border: '1px solid var(--accent-cyan)', background: 'rgba(0, 20, 25, 0.7)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <div className="terminal-text" style={{ fontSize: '12px', color: 'var(--accent-cyan)', letterSpacing: '0.1em', marginBottom: '4px', fontWeight: 'bold' }}>
              FINAL PROTOCOL // SEQUENCE VERIFIED
            </div>
            <div className="terminal-text" style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '16px', letterSpacing: '0.15em' }}>
              ACCESS CODE:
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '14px' }}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  id={`digit-box-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(i, e)}
                  disabled={isSubmitting}
                  style={{
                    width: '48px',
                    height: '56px',
                    textAlign: 'center',
                    fontSize: '24px',
                    fontWeight: 900,
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: 'var(--bg-void)',
                    border: d ? '2px solid var(--accent-cyan)' : '1px solid var(--border-dim)',
                    color: 'var(--accent-cyan)',
                    borderRadius: 'var(--radius-sm)',
                    outline: 'none',
                    boxShadow: d ? '0 0 10px rgba(0,217,255,0.3)' : 'none',
                  }}
                />
              ))}
            </div>
            <p className="terminal-text text-muted" style={{ fontSize: '11px' }}>
              &gt; COMBINE ASSIGNED POSITIONS ACROSS BOTH NODES TO ENTER THE 6-DIGIT VALUE_
            </p>
          </div>
        ) : answerType === 'MULTIPLE_CHOICE' && options && options.length > 0 ? (
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
