import React, { useRef, useEffect } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (otp: string) => void;
  onComplete?: (otp: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  length?: number;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  onComplete,
  disabled = false,
  hasError = false,
  length = 6
}) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Split current value into array of digits up to specified length
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => {
    // Focus first empty box on mount if not disabled
    if (!disabled && inputsRef.current[0]) {
      const firstEmptyIndex = digits.findIndex(d => !d);
      const targetIndex = firstEmptyIndex !== -1 ? firstEmptyIndex : 0;
      inputsRef.current[targetIndex]?.focus();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const rawVal = e.target.value;
    // Handle input digit
    const cleaned = rawVal.replace(/\D/g, '');
    if (!cleaned) return;

    // If user pasted or typed multiple digits
    if (cleaned.length > 1) {
      handlePasteData(cleaned, index);
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleaned[0];
    const newOtp = newDigits.join('');
    onChange(newOtp);

    // Auto-advance focus
    if (index < length - 1 && inputsRef.current[index + 1]) {
      inputsRef.current[index + 1]?.focus();
    }

    if (newOtp.length === length && onComplete) {
      onComplete(newOtp);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        // Clear current digit
        const newDigits = [...digits];
        newDigits[index] = '';
        onChange(newDigits.join(''));
      } else if (index > 0) {
        // Move back and clear previous digit
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pastedData) {
      handlePasteData(pastedData, index);
    }
  };

  const handlePasteData = (pasted: string, startIndex: number) => {
    const newDigits = [...digits];
    let curr = startIndex;
    for (let i = 0; i < pasted.length && curr < length; i++) {
      newDigits[curr] = pasted[i];
      curr++;
    }
    const newOtp = newDigits.join('');
    onChange(newOtp);

    const focusIdx = Math.min(curr, length - 1);
    inputsRef.current[focusIdx]?.focus();

    if (newOtp.length === length && onComplete) {
      onComplete(newOtp);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 my-4">
      {Array.from({ length }).map((_, index) => {
        const isFilled = Boolean(digits[index]);
        return (
          <input
            key={index}
            ref={(el) => { inputsRef.current[index] = el; }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6} // Allows pasting in any input
            value={digits[index] || ''}
            disabled={disabled}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={(e) => handlePaste(e, index)}
            onFocus={(e) => e.target.select()}
            className={`w-11 h-13 sm:w-13 sm:h-15 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 transition-all outline-none duration-150 shadow-xs ${
              hasError
                ? 'border-red-500 bg-red-50 text-red-900 focus:ring-4 focus:ring-red-100'
                : isFilled
                ? 'border-emerald-600 bg-emerald-50/50 text-slate-900 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100'
                : 'border-slate-300 bg-white text-slate-900 focus:border-[#D84E55] focus:ring-4 focus:ring-[#D84E55]/15'
            } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
            aria-label={`Digit ${index + 1} of verification code`}
          />
        );
      })}
    </div>
  );
};
