import { Link } from '@/i18n/navigation';

type Props = {
  group: {
    id: string;
    name: string;
    description?: string | null;
  };
};

export default function GroupCard({ group }: Props) {
  return (
    <Link
      href={`/dashboard/groups/${group.id}`}
      className="block h-full rounded-2xl border border-slate-200 bg-white p-5 pr-14 shadow-[0_2px_12px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
    >
      <h3 className="break-words text-lg font-semibold leading-snug tracking-tight text-slate-900">
        {group.name}
      </h3>
      {group.description && (
        <p className="mt-2 break-words text-sm leading-5 text-slate-600">
          {group.description}
        </p>
      )}
    </Link>
  );
}
