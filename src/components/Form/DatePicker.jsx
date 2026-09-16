import React from 'react';
import { Calendar } from 'lucide-react';
import styles from './FormControls.module.css';

const DatePicker = ({
  label,
  name,
  value,
  onChange,
  min,
  max,
  error,
  required = false,
  disabled = false,
  className = '',
  includeTime = false,
}) => {
  return (
    <div className={`${styles.fieldGroup} ${className}`}>
      {label && (
        <label className={styles.label}>
          {label} {required && <span className={styles.requiredStar}>*</span>}
        </label>
      )}

      <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''} ${disabled ? styles.isDisabled : ''}`}>
        <div className={styles.prefixIcon}>
          <Calendar size={18} />
        </div>

        <input
          type={includeTime ? 'datetime-local' : 'date'}
          name={name}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          disabled={disabled}
          required={required}
          className={`${styles.input} ${styles.hasPrefix}`}
        />
      </div>

      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};

export default DatePicker;
