import React, { useState } from 'react';
import { Send, CheckCircle2, Terminal, ChevronUp, ChevronDown } from 'lucide-react';
import { AnswerType } from '../../types/game';
import { CinematicButton } from '../cinematic/CinematicButton';
import { SpotlightCard } from '../cinematic/SpotlightCard';
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

  // Sync selected operation to answer
  React.useEffect(() => {
    if (selectedOperation) {
      if (selectedOperation === 'hex-to-text') {
        setAnswer('RECOVERY FRAGMENT 02');
      } else if (selectedOperation === 'shift-3') {
        setAnswer('RECOVERY FRAGMENT 04');
      }
    }
  }, [selectedOperation]);

  // Sync ordered items to answer
  React.useEffect(() => {
    if (!orderedItems || orderedItems.length === 0) return;
    if (interaction.interaction === 'sequence-reconstruction') {
      const isCorrectOrder = orderedItems[0]?.startsWith('1.') && orderedItems[1]?.startsWith('2.')
        && orderedItems[2]?.startsWith('3.') && orderedItems[3]?.startsWith('4.')
        && orderedItems[4]?.startsWith('5.') && orderedItems[5]?.startsWith('6.');
      if (isCorrectOrder) {
        setAnswer('CORE SEQUENCE VERIFIED');
      }
    } else if (interaction.interaction === 'packet-reassembly') {
      const orderStr = orderedItems.join(' ');
      if (orderStr.indexOf('Header') < orderStr.indexOf('Payload') && orderStr.indexOf('Payload') < orderStr.indexOf('Checksum')) {
        setAnswer('RECOVERY FRAGMENT 03');
      }
    } else if (interaction.interaction === 'fragment-assembly') {
      const orderStr = orderedItems.join(' ');
      if (orderStr.includes('C3') && orderStr.indexOf('C3') < orderStr.indexOf('B7') && orderStr.indexOf('B7') < orderStr.indexOf('41')) {
        setAnswer('HEX-TO-TEXT');
      }
    } else if (interaction.interaction === 'evidence-board') {
      const orderStr = orderedItems.join(' ');
      if (orderStr.indexOf('F-12') < orderStr.indexOf('R-4') && orderStr.indexOf('R-4') < orderStr.indexOf('N-9')) {
        setAnswer('CHAIN F-12/R-4/N-9');
      }
    }
  }, [orderedItems, interaction.interaction]);

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
    soundService.playClick();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isSubmitting) return;

    soundService.playClick();
    onSubmit(
      answer.trim(),
      JSON.stringify({
        interaction: interaction.interaction || 'answer',
        operation: selectedOperation || undefined,
        order: orderedItems,
        node: selectedNode || undefined,
        process: selectedProcess || undefined,
        sequence: selectedSequence || undefined,
      })
    );
    setSubmittedFeedback(`> ACCESS REQUEST RECEIVED: TRANSMITTING "${answer.trim().toUpperCase()}"...`);

    setTimeout(() => {
      setSubmittedFeedback(null);
    }, 4000);
  };

  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border-cyan)',
        borderRadius: 'var(--radius-sm)',
        fontFamily: 'var(--font-mono)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.8)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '12px',
          borderBottom: '1px dashed var(--border-cyan)',
        }}
      >
        <h2
          style={{
            fontSize: '12px',
            letterSpacing: '0.12em',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--accent-cyan)',
            margin: 0,
            textTransform: 'uppercase',
          }}
        >
          <Terminal size={15} />
          <span>SOLUTION DISPATCH CONSOLE</span>
        </h2>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {interaction.interaction === 'final-protocol' ? 'FINAL ACCESS CODE ENTRY' : `${answerType} INPUT MODE`}
        </span>
      </div>

      {submittedFeedback && (
        <div
          className="animate-fade-in"
          style={{
            marginBottom: '20px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-xs)',
            backgroundColor: 'rgba(0, 217, 255, 0.08)',
            border: '1px solid var(--accent-cyan)',
            color: 'var(--accent-cyan)',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <CheckCircle2 size={16} />
          <span className="font-bold">{submittedFeedback}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Level 1 Stage 2: Access Panel Interactive Calibration */}
        {interaction.interaction === 'access-panel' && (
          <SpotlightCard
            variant="cyan"
            style={{
              marginBottom: '20px',
              padding: '20px',
              border: '1px solid var(--border-cyan)',
              background: 'rgba(4, 5, 7, 0.7)',
              borderRadius: 'var(--radius-xs)',
            }}
          >
            <div style={{ fontSize: '12px', marginBottom: '16px', color: 'var(--accent-cyan)', fontWeight: 800, letterSpacing: '0.08em' }}>
              &gt; ACCESS PANEL INTERACTIVE CALIBRATION:
            </div>

            {/* Target Node Selector */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.05em' }}>
                TARGET NODE:
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(interaction.nodes || ['N-2', 'N-4', 'N-7']).map((node) => (
                  <button
                    key={node}
                    type="button"
                    className={`btn ${selectedNode === node ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => {
                      setSelectedNode(node);
                      soundService.playSelect();
                    }}
                    style={{ flex: 1, padding: '10px', fontSize: '12px' }}
                  >
                    {node}
                  </button>
                ))}
              </div>
            </div>

            {/* Process Selector */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.05em' }}>
                PROCESS:
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(interaction.processes || ['relay', 'watcher', 'archive']).map((proc) => (
                  <button
                    key={proc}
                    type="button"
                    className={`btn ${selectedProcess === proc ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => {
                      setSelectedProcess(proc);
                      soundService.playSelect();
                    }}
                    style={{ flex: 1, padding: '10px', fontSize: '12px' }}
                  >
                    {proc}
                  </button>
                ))}
              </div>
            </div>

            {/* Circuit Sequence Selector */}
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.05em' }}>
                SEQUENCE:
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(interaction.sequences || ['K-17', 'R-03', 'M-22']).map((seq) => (
                  <button
                    key={seq}
                    type="button"
                    className={`btn ${selectedSequence === seq ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => {
                      setSelectedSequence(seq);
                      soundService.playSelect();
                    }}
                    style={{ flex: 1, padding: '10px', fontSize: '12px' }}
                  >
                    {seq}
                  </button>
                ))}
              </div>
            </div>
          </SpotlightCard>
        )}

        {/* Level 2 & Level 4: Transformation Pipeline Selection */}
        {interaction.operations && interaction.operations.length > 0 && (
          <SpotlightCard
            variant="cyan"
            style={{
              marginBottom: '20px',
              padding: '18px',
              border: '1px solid var(--border-cyan)',
              background: 'rgba(4, 5, 7, 0.7)',
              borderRadius: 'var(--radius-xs)',
            }}
          >
            <div style={{ fontSize: '11px', marginBottom: '12px', color: 'var(--accent-cyan)', fontWeight: 700, letterSpacing: '0.08em' }}>
              TRANSFORMATION PIPELINE // SELECT DISCOVERED OPERATION:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {interaction.operations.map((operation) => (
                <button
                  key={operation}
                  type="button"
                  className={`btn ${selectedOperation === operation ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    setSelectedOperation(operation);
                    soundService.playSelect();
                  }}
                  style={{ fontSize: '12px', padding: '8px 16px' }}
                >
                  {operation}
                </button>
              ))}
            </div>
          </SpotlightCard>
        )}

        {/* Ordered Reconstruction Items */}
        {orderedItems.length > 0 && (
          <SpotlightCard
            variant="cyan"
            style={{
              marginBottom: '20px',
              padding: '18px',
              border: '1px solid var(--border-cyan)',
              background: 'rgba(4, 5, 7, 0.7)',
              borderRadius: 'var(--radius-xs)',
            }}
          >
            <div style={{ fontSize: '11px', marginBottom: '12px', color: 'var(--accent-cyan)', fontWeight: 700, letterSpacing: '0.08em' }}>
              RECONSTRUCTION SEQUENCE ALIGNMENT // ORDER SPECIFICATION:
            </div>
            {orderedItems.map((item, index) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ width: '28px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 800 }}>
                  0{index + 1}.
                </span>
                <span
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    border: '1px solid var(--border-dim)',
                    background: 'rgba(0, 0, 0, 0.6)',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '13px',
                    color: 'var(--text-cold-white)',
                  }}
                >
                  {item}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={index === 0}
                  onClick={() => moveItem(index, -1)}
                  title="Move element up"
                  style={{ padding: '8px 10px' }}
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={index === orderedItems.length - 1}
                  onClick={() => moveItem(index, 1)}
                  title="Move element down"
                  style={{ padding: '8px 10px' }}
                >
                  <ChevronDown size={14} />
                </button>
              </div>
            ))}
          </SpotlightCard>
        )}

        {/* Level 6 Stage 3: Final Protocol 6-Digit Passkey Entry */}
        {interaction.interaction === 'final-protocol' ? (
          <div
            style={{
              marginBottom: '24px',
              padding: '24px',
              border: '1px solid var(--accent-crimson)',
              background: 'rgba(225, 29, 72, 0.08)',
              borderRadius: 'var(--radius-xs)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--accent-crimson)', letterSpacing: '0.12em', marginBottom: '4px', fontWeight: 800 }}>
              FINAL PROTOCOL // EMERGENCY OVERRIDE
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-cold-white)', marginBottom: '16px', letterSpacing: '0.1em' }}>
              ENTER SIX-DIGIT ACCESS CODE:
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
                    borderRadius: 'var(--radius-xs)',
                    outline: 'none',
                    boxShadow: d ? '0 0 12px rgba(0, 217, 255, 0.4)' : 'none',
                  }}
                />
              ))}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
              &gt; COMBINE RECOVERED SHARD POSITIONS ACROSS BOTH OPERATORS_
            </p>
          </div>
        ) : answerType === 'MULTIPLE_CHOICE' && options && options.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '20px' }}>
            {options.map((option, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setAnswer(option);
                  soundService.playSelect();
                }}
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid',
                  fontSize: '13px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all var(--transition-fast)',
                  backgroundColor: answer === option ? 'rgba(0, 217, 255, 0.12)' : 'rgba(0, 0, 0, 0.5)',
                  borderColor: answer === option ? 'var(--accent-cyan)' : 'var(--border-dim)',
                  color: answer === option ? 'var(--text-cold-white)' : 'var(--text-secondary)',
                  boxShadow: answer === option ? '0 0 12px rgba(0, 217, 255, 0.2)' : 'none',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <span
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: answer === option ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.05)',
                    color: answer === option ? 'var(--bg-void)' : 'var(--text-muted)',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                  }}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{option}</span>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <div
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontWeight: 800,
                fontSize: '16px',
                color: 'var(--accent-cyan)',
                pointerEvents: 'none',
              }}
            >
              &gt;
            </div>
            <input
              type={answerType === 'NUMERIC' ? 'number' : 'text'}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="cyber-input"
              placeholder={placeholderText || (answerType === 'NUMERIC' ? 'INPUT NUMERIC SOLUTION_' : 'INPUT SOLUTION_')}
              disabled={isSubmitting}
              style={{ paddingLeft: '40px', paddingRight: '90px', fontSize: '15px', height: '52px' }}
            />
            <div
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '10px',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-dim)',
              }}
            >
              {answerType}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <CinematicButton
            variant="primary"
            type="submit"
            disabled={!answer.trim() || isSubmitting}
            style={{ width: '100%', padding: '14px', fontSize: '13px' }}
          >
            {isSubmitting ? (
              <span>TRANSMITTING PAYLOAD...</span>
            ) : (
              <>
                <span>TRANSMIT SOLUTION</span>
                <Send size={15} />
              </>
            )}
          </CinematicButton>
        </div>
      </form>
    </div>
  );
};
