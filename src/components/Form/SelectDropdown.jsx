import React from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './FormControls.module.css';

const SelectDropdown = ({
  label,
  name,
  value,
  onChange,
  options = [], // [{ label: "Doctor", value: "doctor" }] or ["admin", "user"]
  placeholder = 'Select an option',
  icon: Icon,
  error,
  required = false,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`${styles.fieldGroup} ${className}`}>
      {label && (
        <label className={styles.label}>
          {label} {required && <span className={styles.requiredStar}>*</span>}
        </label>
      )}

      <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''} ${disabled ? styles.isDisabled : ''}`}>
        {Icon && (
          <div className={styles.prefixIcon}>
            <Icon size={18} />
          </div>
        )}

        <select
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`${styles.select} ${Icon ? styles.hasPrefix : ''}`}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt, idx) => {
            const isObj = typeof opt === 'object' && opt !== null;
            const optValue = isObj ? opt.value : opt;
            const optLabel = isObj ? opt.label : opt;
            return (
              <option key={idx} value={optValue}>
                {optLabel}
              </option>
            );
          })}
        </select>

        <div className={styles.selectArrow}>
          <ChevronDown size={18} />
        </div>
      </div>

      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};

export default SelectDropdown;
