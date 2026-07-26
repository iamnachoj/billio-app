'use client';

import { useEffect } from 'react';
import clsx from 'clsx';

type Props = {
  open: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg';
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
};

export default function Modal({
  open,
  title,
  children,
  onClose,
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
}: Props) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => {
        if (closeOnOverlayClick) {
          onClose();
        }
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={clsx(
          'relative w-full rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200',

          {
            'max-w-sm': size === 'sm',
            'max-w-xl': size === 'md',
            'max-w-3xl': size === 'lg',
          }
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-8 py-6">
          {title ? (
            <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
          ) : (
            <div />
          )}

          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="cursor-pointer rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              ✕
            </button>
          )}
        </div>

        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}
