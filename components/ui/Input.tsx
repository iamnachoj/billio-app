import clsx from 'clsx';
import { forwardRef, InputHTMLAttributes, useId } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

const Input = forwardRef<HTMLInputElement, Props>(
  (
    { label, error, className, id, 'aria-describedby': describedBy, ...props },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [describedBy, error ? errorId : undefined]
              .filter(Boolean)
              .join(' ') || undefined
          }
          className={clsx(
            'w-full rounded-xl border bg-white px-4 py-3 text-gray-900 outline-none transition',

            error
              ? 'border-red-400 focus:border-red-500'
              : 'border-gray-300 focus:border-teal-500',

            className
          )}
          {...props}
        />

        {error && (
          <p id={errorId} className="text-sm text-red-500">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
