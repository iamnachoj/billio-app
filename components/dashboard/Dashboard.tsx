'use client';

import { DashboardGroup, useDashboard } from './hooks/useDashboard';

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';

import GroupCard from './GroupCard';
import SortableGroupCard from './SortableGroupCard';
import Button from '../ui/Button';
import { useId, useState } from 'react';
import Modal from '../ui/Modal';
import CreateGroupForm from '../groups/CreateGroupForm';

type User = {
  id: string;
  name: string;
  email: string;
};

type Props = {
  user: User;
  groups: DashboardGroup[];
};

export default function Dashboard({ user, groups }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  // Stable id so dnd-kit's aria-describedby matches between server and
  // client renders (otherwise its module-level counter causes a
  // hydration mismatch).
  const dndContextId = useId();

  const {
    activeGroups,
    archivedGroups,
    showArchived,
    toggleArchived,
    reorderActiveGroup,
  } = useDashboard(groups);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderActiveGroup(String(active.id), String(over.id));
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 md:px-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl lg:text-4xl font-bold text-gray-800">
          Hello {user.name} 👋
        </h1>
        <Button className="text-sm p-1" onClick={() => setIsOpen(true)}>
          Add new Group
        </Button>
        <Modal
          open={isOpen}
          title="Create group"
          onClose={() => setIsOpen(false)}
        >
          <CreateGroupForm onSuccess={() => setIsOpen(false)} />
        </Modal>
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

        <DndContext
          id={dndContextId}
          sensors={sensors}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={activeGroups.map((g) => g.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {activeGroups.map((group) => (
                <SortableGroupCard key={group.id} group={group} />
              ))}
            </div>
          </SortableContext>
        </DndContext>

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
