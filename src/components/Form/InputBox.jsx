import React, { useState } from 'react';
import { Eye, EyeOff, X, Search } from 'lucide-react';
import styles from './FormControls.module.css';

const InputBox = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder = '',
  icon: Icon,
  error,
  required = false,
  disabled = false,
  rows = 4,
  onClear,
  className = '',
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const isTextarea = type === 'textarea';
  const isSearch = type === 'search';

  const inputType = isPassword ? (showPassword ? 'text' : 'password') : (isSearch ? 'text' : type);

  return (
    <div className={`${styles.fieldGroup} ${className}`}>
      {label && (
        <label className={styles.label}>
          {label} {required && <span className={styles.requiredStar}>*</span>}
        </label>
      )}

      <div className={`${styles.inputWrapper} ${error ? styles.hasError : ''} ${disabled ? styles.isDisabled : ''}`}>
        {Icon && !isSearch && (
          <div className={styles.prefixIcon}>
            <Icon size={18} />
          </div>
        )}
        {isSearch && (
          <div className={styles.prefixIcon}>
            <Search size={18} />
          </div>
        )}

        {isTextarea ? (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            required={required}
            className={styles.textarea}
          />
        ) : (
          <input
            type={inputType}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={`${styles.input} ${Icon || isSearch ? styles.hasPrefix : ''} ${isPassword || (isSearch && value) ? styles.hasSuffix : ''}`}
          />
        )}

        {isPassword && (
          <button
            type="button"
            className={styles.suffixBtn}
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}

        {isSearch && value && onClear && (
          <button
            type="button"
            className={styles.suffixBtn}
            onClick={onClear}
            tabIndex={-1}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};

export default InputBox;
