import AuthenticatedHeader from '@/components/layout/AuthenticatedHeader';

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <AuthenticatedHeader />
      {children}
    </>
  );
}
