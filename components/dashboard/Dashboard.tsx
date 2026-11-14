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
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('DASHBOARD');
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
          {t('GREETING', { name: user.name })}
        </h1>
        <Button className="text-sm p-1" onClick={() => setIsOpen(true)}>
          {t('GROUPS.ADD')}
        </Button>
        <Modal
          open={isOpen}
          title={t('GROUPS.CREATE_TITLE')}
          onClose={() => setIsOpen(false)}
        >
          <CreateGroupForm onSuccess={() => setIsOpen(false)} />
        </Modal>
      </header>
      <hr className="my-4 border-gray-300" />
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{t('GROUPS.TITLE')}</h2>

          <button
            onClick={toggleArchived}
            type="button"
            aria-expanded={showArchived}
            aria-controls="archived-groups"
            className="text-white hover:text-gray-300 font-semibold cursor-pointer"
          >
            {showArchived
              ? t('GROUPS.HIDE_ARCHIVED')
              : t('GROUPS.SHOW_ARCHIVED')}
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

        <div
          id="archived-groups"
          className={showArchived ? undefined : 'hidden'}
        >
          <h3 className="mt-12 mb-6 text-xl font-semibold">
            {t('GROUPS.ARCHIVED_TITLE')}
          </h3>
          {archivedGroups.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {archivedGroups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          ) : (
            <p className="text-gray-600">{t('GROUPS.ARCHIVED_EMPTY')}</p>
          )}
        </div>
      </section>
    </main>
  );
}
