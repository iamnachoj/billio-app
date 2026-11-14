import clsx from 'clsx';
import { ButtonHTMLAttributes } from 'react';
import { useTranslations } from 'next-intl';

type EditButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string;
};

export default function EditButton({
  label,
  className,
  ...props
}: EditButtonProps) {
  const t = useTranslations('UI');
  return (
    <button
      type="button"
      aria-label={label ?? t('EDIT')}
      className={clsx(
        'inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer',
        className
      )}
      {...props}
    >
      <span aria-hidden="true" className="text-lg leading-none">
        ✎
      </span>
    </button>
  );
}
