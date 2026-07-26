import clsx from 'clsx';
import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
};

export default function Button({
  children,
  variant = 'primary',
  loading = false,
  className,
  disabled,
  fullWidth,
  ...props
}: Props) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center rounded-xl px-4 py-3 font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
        fullWidth && 'w-full',

        {
          'bg-teal-500 text-white hover:bg-teal-600': variant === 'primary',

          'border border-gray-300 bg-white text-gray-800 hover:bg-gray-100':
            variant === 'secondary',

          'bg-red-500 text-white hover:bg-red-600': variant === 'danger',
        },

        className
      )}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
