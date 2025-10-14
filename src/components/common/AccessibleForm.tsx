import React, { ReactNode, forwardRef } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { generateA11yId } from '../../utils/accessibility';

// Form Field Container
interface FormFieldProps {
  children: ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ children, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {children}
  </div>
);

// Label Component
interface LabelProps {
  htmlFor: string;
  children: ReactNode;
  required?: boolean;
  className?: string;
}

export const Label: React.FC<LabelProps> = ({ 
  htmlFor, 
  children, 
  required = false, 
  className = '' 
}) => (
  <label
    htmlFor={htmlFor}
    className={`
      block text-sm font-medium text-gray-700 dark:text-gray-300
      ${className}
    `}
  >
    {children}
    {required && (
      <span className="text-red-500 ml-1" aria-label="required">
        *
      </span>
    )}
  </label>
);

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  showPasswordToggle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helpText,
  required = false,
  showPasswordToggle = false,
  type = 'text',
  className = '',
  id,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const inputId = id || generateA11yId('input');
  const errorId = generateA11yId('error');
  const helpId = generateA11yId('help');
  const isPassword = type === 'password';
  const actualType = isPassword && showPassword ? 'text' : type;

  return (
    <FormField>
      {label && (
        <Label htmlFor={inputId} required={required}>
          {label}
        </Label>
      )}
      
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={actualType}
          className={`
            w-full px-3 py-2 border rounded-lg
            bg-white dark:bg-gray-800
            border-gray-300 dark:border-gray-600
            text-gray-900 dark:text-white
            placeholder-gray-500 dark:placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${isPassword && showPasswordToggle ? 'pr-10' : ''}
            ${className}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={`${error ? errorId : ''} ${helpText ? helpId : ''}`.trim()}
          aria-required={required}
          {...props}
        />
        
        {isPassword && showPasswordToggle && (
          <button
            type="button"
            className="
              absolute right-3 top-1/2 transform -translate-y-1/2
              text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
              focus:outline-none focus:text-gray-600 dark:focus:text-gray-300
            "
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      
      {error && (
        <div
          id={errorId}
          className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {helpText && !error && (
        <div
          id={helpId}
          className="text-sm text-gray-500 dark:text-gray-400"
        >
          {helpText}
        </div>
      )}
    </FormField>
  );
});

Input.displayName = 'Input';

// Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  helpText,
  required = false,
  className = '',
  id,
  ...props
}, ref) => {
  const textareaId = id || generateA11yId('textarea');
  const errorId = generateA11yId('error');
  const helpId = generateA11yId('help');

  return (
    <FormField>
      {label && (
        <Label htmlFor={textareaId} required={required}>
          {label}
        </Label>
      )}
      
      <textarea
        ref={ref}
        id={textareaId}
        className={`
          w-full px-3 py-2 border rounded-lg
          bg-white dark:bg-gray-800
          border-gray-300 dark:border-gray-600
          text-gray-900 dark:text-white
          placeholder-gray-500 dark:placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          resize-vertical
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={`${error ? errorId : ''} ${helpText ? helpId : ''}`.trim()}
        aria-required={required}
        {...props}
      />
      
      {error && (
        <div
          id={errorId}
          className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {helpText && !error && (
        <div
          id={helpId}
          className="text-sm text-gray-500 dark:text-gray-400"
        >
          {helpText}
        </div>
      )}
    </FormField>
  );
});

Textarea.displayName = 'Textarea';

// Select Component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  helpText,
  required = false,
  options,
  placeholder,
  className = '',
  id,
  ...props
}, ref) => {
  const selectId = id || generateA11yId('select');
  const errorId = generateA11yId('error');
  const helpId = generateA11yId('help');

  return (
    <FormField>
      {label && (
        <Label htmlFor={selectId} required={required}>
          {label}
        </Label>
      )}
      
      <select
        ref={ref}
        id={selectId}
        className={`
          w-full px-3 py-2 border rounded-lg
          bg-white dark:bg-gray-800
          border-gray-300 dark:border-gray-600
          text-gray-900 dark:text-white
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={`${error ? errorId : ''} ${helpText ? helpId : ''}`.trim()}
        aria-required={required}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <div
          id={errorId}
          className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {helpText && !error && (
        <div
          id={helpId}
          className="text-sm text-gray-500 dark:text-gray-400"
        >
          {helpText}
        </div>
      )}
    </FormField>
  );
});

Select.displayName = 'Select';

// Checkbox Component
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  helpText?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  label,
  error,
  helpText,
  className = '',
  id,
  ...props
}, ref) => {
  const checkboxId = id || generateA11yId('checkbox');
  const errorId = generateA11yId('error');
  const helpId = generateA11yId('help');

  return (
    <FormField>
      <div className="flex items-start space-x-3">
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className={`
            mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded
            focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-offset-gray-900
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={`${error ? errorId : ''} ${helpText ? helpId : ''}`.trim()}
          {...props}
        />
        
        <div className="flex-1">
          <Label htmlFor={checkboxId} className="cursor-pointer">
            {label}
          </Label>
          
          {error && (
            <div
              id={errorId}
              className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400 mt-1"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {helpText && !error && (
            <div
              id={helpId}
              className="text-sm text-gray-500 dark:text-gray-400 mt-1"
            >
              {helpText}
            </div>
          )}
        </div>
      </div>
    </FormField>
  );
});

Checkbox.displayName = 'Checkbox';

// Form Success Message
interface FormSuccessProps {
  message: string;
  className?: string;
}

export const FormSuccess: React.FC<FormSuccessProps> = ({ message, className = '' }) => (
  <div
    className={`
      flex items-center space-x-2 p-3 rounded-lg
      bg-green-50 dark:bg-green-900/20
      border border-green-200 dark:border-green-800
      text-green-700 dark:text-green-300
      ${className}
    `}
    role="alert"
    aria-live="polite"
  >
    <CheckCircle className="w-5 h-5 flex-shrink-0" />
    <span className="text-sm font-medium">{message}</span>
  </div>
);

// Form Error Message
interface FormErrorProps {
  message: string;
  className?: string;
}

export const FormError: React.FC<FormErrorProps> = ({ message, className = '' }) => (
  <div
    className={`
      flex items-center space-x-2 p-3 rounded-lg
      bg-red-50 dark:bg-red-900/20
      border border-red-200 dark:border-red-800
      text-red-700 dark:text-red-300
      ${className}
    `}
    role="alert"
    aria-live="assertive"
  >
    <AlertCircle className="w-5 h-5 flex-shrink-0" />
    <span className="text-sm font-medium">{message}</span>
  </div>
);