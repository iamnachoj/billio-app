import PublicHeader from '@/components/layout/PublicHeader';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <PublicHeader />
      {children}
      <footer className="border-t border-gray-200 bg-white px-6 py-6">
        <div className="mx-auto max-w-7xl">
          <LanguageSwitcher />
        </div>
      </footer>
    </>
  );
}
