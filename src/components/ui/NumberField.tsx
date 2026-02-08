import React from 'react';
import './NumberField.css';

export interface NumberFieldProps {
  /** Current value */
  value: number;
  /** Change handler */
  onChange: (value: number) => void;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Disable the field */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * NumberField Component (shadcn-style)
 * 
 * A number input with increment/decrement buttons, styled to match
 * the application's color theme using CSS variables.
 */
export function NumberField({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  className = '',
}: NumberFieldProps) {
  // Local state to allow empty/partial input while typing
  const [inputValue, setInputValue] = React.useState<string>('');
  const [isFocused, setIsFocused] = React.useState(false);

  // Calculate display value based on step precision
  const getDisplayValue = (val: number) => {
    return step < 1 
      ? val.toFixed(String(step).split('.')[1]?.length || 1)
      : val.toString();
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setInputValue(rawValue);
    
    // Allow empty input while typing
    if (rawValue === '' || rawValue === '-' || rawValue === '.') {
      return;
    }
    
    const newValue = parseFloat(rawValue);
    if (!isNaN(newValue)) {
      const clampedValue = Math.max(min, Math.min(max, newValue));
      onChange(clampedValue);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setInputValue(getDisplayValue(value));
  };

  const handleBlur = () => {
    setIsFocused(false);
    // On blur, if input is empty or invalid, reset to current value
    const parsed = parseFloat(inputValue);
    if (isNaN(parsed)) {
      setInputValue(getDisplayValue(value));
    } else {
      const clamped = Math.max(min, Math.min(max, parsed));
      onChange(clamped);
      setInputValue(getDisplayValue(clamped));
    }
  };

  // Display value: show local input when focused, otherwise show prop value
  const displayValue = isFocused ? inputValue : getDisplayValue(value);

  return (
    <div className={`number-field ${className}`.trim()} data-disabled={disabled || undefined}>
      <button
        type="button"
        className="number-field__button number-field__decrement"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        aria-label="Decrease value"
      >
        −
      </button>
      <input
        type="number"
        className="number-field__input"
        value={displayValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
      />
      <button
        type="button"
        className="number-field__button number-field__increment"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        aria-label="Increase value"
      >
        +
      </button>
    </div>
  );
}

export default NumberField;
