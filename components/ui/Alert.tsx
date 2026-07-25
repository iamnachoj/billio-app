import clsx from 'clsx';
import { ReactNode } from 'react';

type AlertVariant = 'error' | 'success' | 'warning' | 'info';

type AlertProps = {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
};

const variants = {
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: '❌',
  },
  success: {
    container: 'bg-green-50 border-green-200 text-green-800',
    icon: '✅',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: '⚠️',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: 'ℹ️',
  },
};

export default function Alert({
  variant = 'info',
  title,
  children,
  className,
}: AlertProps) {
  const style = variants[variant];

  return (
    <div
      role="alert"
      className={clsx(
        'flex gap-3 rounded-xl border p-4',
        style.container,
        className
      )}
    >
      <span className="text-lg leading-none mt-1">{style.icon}</span>

      <div>
        {title && <h3 className="font-semibold inline">{title}: </h3>}

        <span className="mt-1 text-sm leading-6">{children}</span>
      </div>
    </div>
  );
}
