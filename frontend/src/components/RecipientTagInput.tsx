import React, { useState, KeyboardEvent } from 'react';
import { X, Mail, AlertCircle } from 'lucide-react';

interface RecipientTagInputProps {
  recipients: string[];
  onChange: (recipients: string[]) => void;
}

export const RecipientTagInput: React.FC<RecipientTagInputProps> = ({
  recipients,
  onChange,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const addEmail = (raw: string) => {
    const trimmed = raw.trim().toLowerCase();
    if (!trimmed) return;

    if (!isValidEmail(trimmed)) {
      setError(`'${trimmed}' is not a valid email address.`);
      return;
    }

    if (recipients.includes(trimmed)) {
      setError(`'${trimmed}' has already been added.`);
      return;
    }

    setError(null);
    onChange([...recipients, trimmed]);
    setInputValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      addEmail(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && recipients.length > 0) {
      removeEmail(recipients.length - 1);
    }
  };

  const handleBlur = () => {
    if (inputValue) {
      addEmail(inputValue);
    }
  };

  const removeEmail = (index: number) => {
    const updated = recipients.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="min-h-[50px] p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus-within:border-brand-500 flex flex-wrap items-center gap-2 transition-colors">
        <Mail className="w-4 h-4 text-slate-500 ml-1.5" />

        {recipients.map((email, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-brand-500/15 text-brand-300 border border-brand-500/30 text-xs font-medium"
          >
            {email}
            <button
              type="button"
              onClick={() => removeEmail(index)}
              className="text-brand-400 hover:text-rose-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}

        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={
            recipients.length === 0
              ? 'Type email address and press Enter or comma...'
              : 'Add another email...'
          }
          className="flex-1 min-w-[200px] bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none px-1"
        />
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-400">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
