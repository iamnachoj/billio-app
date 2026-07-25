type BillioLogoProps = {
  className?: string;
};

export default function BillioLogo({ className = '' }: BillioLogoProps) {
  return (
    <h1 className="text-3xl inline">
      <span className="font-bold">
        Bi<span className="text-teal-500">ll</span>io{' '}
      </span>
      <img
        src="/billio-logo.png"
        alt="Billio Logo"
        className={`inline-block h-8 w-8 mb-1 ${className}`}
      />
    </h1>
  );
}
