import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  success?: boolean;
}

export const Input: React.FC<InputProps> = ({ 
  error, 
  success,
  className = '', 
  ...props 
}) => {
  let statusClass = '';
  if (error) statusClass = 'input-error';
  else if (success) statusClass = 'input-success';
  
  return (
    <div className="flex flex-col w-full relative">
      <input 
        className={`input-field ${statusClass} ${className}`}
        {...props}
      />
      {error && (
        <span className="text-error text-technical mt-2">{error}</span>
      )}
    </div>
  );
};
