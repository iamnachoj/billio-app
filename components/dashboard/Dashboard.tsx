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
    <main className="min-h-[calc(100vh-4rem)] bg-linear-to-br from-[#eef8f3] via-[#f5f8f6] to-[#edf4f7] font-sans text-slate-900">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10 lg:px-8">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
              {t('OVERVIEW')}
            </p>
            <h1 className="mt-2 break-words text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              {t('GREETING', { name: user.name })}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
              {t('INTRO')}
            </p>
          </div>
        </header>

        <section className="pt-4" aria-labelledby="groups-heading">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <div>
              <h2
                id="groups-heading"
                className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl"
              >
                {t('GROUPS.TITLE')}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {t('GROUPS.DESCRIPTION')}
              </p>
            </div>

            <button
              onClick={toggleArchived}
              type="button"
              aria-expanded={showArchived}
              aria-controls="archived-groups"
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm font-medium text-teal-800 transition-colors hover:bg-teal-50 hover:text-teal-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              {showArchived
                ? t('GROUPS.HIDE_ARCHIVED')
                : t('GROUPS.SHOW_ARCHIVED')}
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                className={`h-4 w-4 transition-transform ${showArchived ? 'rotate-180' : ''}`}
                aria-hidden="true"
              >
                <path d="m5 7.5 5 5 5-5" />
              </svg>
            </button>
          </div>

          {activeGroups.length > 0 ? (
            <DndContext
              id={dndContextId}
              sensors={sensors}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={activeGroups.map((g) => g.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {activeGroups.map((group) => (
                    <SortableGroupCard key={group.id} group={group} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
              <div
                aria-hidden="true"
                className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-2xl text-teal-700"
              >
                +
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                {t('GROUPS.EMPTY_TITLE')}
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {t('GROUPS.EMPTY_DESCRIPTION')}
              </p>
            </div>
          )}

          <div
            id="archived-groups"
            className={
              showArchived ? 'mt-10 border-t border-slate-200 pt-8' : 'hidden'
            }
          >
            <h3 className="mb-5 text-lg font-semibold tracking-tight text-slate-900">
              {t('GROUPS.ARCHIVED_TITLE')}
            </h3>
            {archivedGroups.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {archivedGroups.map((group) => (
                  <GroupCard key={group.id} group={group} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                {t('GROUPS.ARCHIVED_EMPTY')}
              </p>
            )}
          </div>
          <Button
            className="mt-6 min-h-11 w-full gap-2 bg-teal-700 text-sm hover:bg-teal-800 sm:w-auto"
            onClick={() => setIsOpen(true)}
          >
            <span
              aria-hidden="true"
              className="text-xl font-normal leading-none"
            >
              +
            </span>
            {t('GROUPS.ADD')}
          </Button>
        </section>
        <Modal
          open={isOpen}
          title={t('GROUPS.CREATE_TITLE')}
          onClose={() => setIsOpen(false)}
        >
          <CreateGroupForm onSuccess={() => setIsOpen(false)} />
        </Modal>
      </div>
    </main>
  );
}
