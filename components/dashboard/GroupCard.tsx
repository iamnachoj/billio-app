import Link from 'next/link';

type Props = {
  group: {
    id: string;
    name: string;
    description: string | null;
  };
};

export default function GroupCard({ group }: Props) {
  return (
    <Link
      href={`/dashboard/groups/${group.id}`}
      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <h3 className="text-xl font-semibold text-gray-800">{group.name}</h3>

      {group.description && (
        <p className="mt-3 text-gray-500">{group.description}</p>
      )}
    </Link>
  );
}
