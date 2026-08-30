import React, { useState } from 'react';
import { Send, CheckCircle2, Terminal } from 'lucide-react';
import { AnswerType } from '../../types/game';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface AnswerInputProps {
  answerType: AnswerType;
  placeholderText?: string;
  options?: string[];
  onSubmit: (answer: string) => void;
  isSubmitting?: boolean;
}

export const AnswerInput: React.FC<AnswerInputProps> = ({
  answerType,
  placeholderText,
  options,
  onSubmit,
  isSubmitting = false,
}) => {
  const [answer, setAnswer] = useState('');
  const [submittedFeedback, setSubmittedFeedback] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isSubmitting) return;

    onSubmit(answer.trim());
    setSubmittedFeedback(`Payload "${answer.trim()}" dispatched for verification.`);

    setTimeout(() => {
      setSubmittedFeedback(null);
    }, 4000);
  };

  return (
    <Card style={{ padding: '24px', fontFamily: 'var(--font-mono)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '12px', letterSpacing: '0.1em', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={16} color="var(--accent-cyan)" />
          <span>TERMINAL SOLUTION DISPATCH</span>
        </h2>
        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {answerType} INPUT MODE
        </span>
      </div>

      {submittedFeedback && (
        <div className="animate-fade-in" style={{ marginBottom: '16px', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(0,217,255,0.1)', border: '1px solid rgba(0,217,255,0.4)', color: '#a5f3fc', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          <CheckCircle2 size={16} color="var(--accent-cyan)" />
          <span>{submittedFeedback}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {answerType === 'MULTIPLE_CHOICE' && options && options.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            {options.map((option, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setAnswer(option)}
                style={{
                  padding: '14px', borderRadius: '12px', border: '1px solid', fontSize: '14px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s',
                  backgroundColor: answer === option ? 'rgba(0,217,255,0.2)' : 'rgba(15,23,42,0.8)',
                  borderColor: answer === option ? 'var(--accent-cyan)' : 'var(--border-color)',
                  color: answer === option ? '#a5f3fc' : 'var(--text-primary)',
                  boxShadow: answer === option ? '0 0 20px rgba(0,217,255,0.2)' : 'none',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                <span style={{ width: '24px', height: '24px', borderRadius: '8px', backgroundColor: 'rgba(0,217,255,0.1)', border: '1px solid rgba(0,217,255,0.3)', color: 'var(--accent-cyan)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{option}</span>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-cyan)', fontWeight: 'bold', fontSize: '14px', pointerEvents: 'none' }}>
              &gt;
            </div>
            <Input
              type={answerType === 'NUMERIC' ? 'number' : 'text'}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={placeholderText || (answerType === 'NUMERIC' ? 'Enter numeric solution...' : 'ENTER SOLUTION_')}
              disabled={isSubmitting}
              style={{ paddingLeft: '36px', paddingRight: '80px' }}
            />
            <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', backgroundColor: 'var(--bg-dark)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
              {answerType}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <Button
            type="submit"
            disabled={!answer.trim() || isSubmitting}
            style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {isSubmitting ? (
              <span>VERIFYING PAYLOAD...</span>
            ) : (
              <>
                <span>TRANSMIT SOLUTION</span>
                <Send size={14} />
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
};
