'use client';

import { useDashboard } from './hooks/useDashboard';
import { Group } from '@/lib/models/group';

import GroupCard from './GroupCard';
import Button from '../ui/Button';

type User = {
  id: string;
  name: string;
  email: string;
};

type Props = {
  user: User;
  groups: Group[];
};

export default function Dashboard({ user, groups }: Props) {
  const { activeGroups, archivedGroups, showArchived, toggleArchived } =
    useDashboard(groups);

  return (
    <main className="mx-auto max-w-6xl px-8 py-12">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl lg:text-4xl font-bold text-gray-800">
          Hello {user.name} 👋
        </h1>
        <Button>Add new Group</Button>
      </header>
      <hr className="my-4 border-gray-300" />
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Your groups</h2>

          <button
            onClick={toggleArchived}
            className="text-white hover:text-gray-300 font-semibold cursor-pointer"
          >
            {showArchived ? 'Hide archived' : 'Show archived'}
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {activeGroups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>

        {showArchived && archivedGroups.length > 0 && (
          <>
            <h3 className="mt-12 mb-6 text-xl font-semibold">Archived</h3>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {archivedGroups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
