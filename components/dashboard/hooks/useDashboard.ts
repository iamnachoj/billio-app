'use client';

import { useMemo, useState } from 'react';

import { Group } from '@/lib/models/group';
import { applyGroupOrder, GROUP_ORDER_COOKIE } from '@/lib/utils/groupOrder';

export type DashboardGroup = Group & {
  archivedAt?: Date | string | null;
};

// The server already renders groups in the stored order (it reads the
// cookie), so the initial order comes from props and there is no flash.
// This override only exists after the user drags within this session.
function persistOrder(ids: string[]) {
  document.cookie = `${GROUP_ORDER_COOKIE}=${encodeURIComponent(
    JSON.stringify(ids)
  )}; path=/; max-age=31536000; samesite=lax`;
}

export function useDashboard(groups: DashboardGroup[]) {
  const [showArchived, setShowArchived] = useState(false);
  const [orderOverride, setOrderOverride] = useState<string[] | null>(null);

  const activeGroups = useMemo(
    () => groups.filter((g) => !g.archivedAt),
    [groups]
  );

  const archivedGroups = useMemo(
    () => groups.filter((g) => g.archivedAt),
    [groups]
  );

  const orderedActiveGroups = useMemo(
    () =>
      orderOverride
        ? applyGroupOrder(activeGroups, orderOverride)
        : activeGroups,
    [activeGroups, orderOverride]
  );

  function reorderActiveGroup(activeId: string, overId: string) {
    const currentIds = orderedActiveGroups.map((g) => g.id);
    const from = currentIds.indexOf(activeId);
    const to = currentIds.indexOf(overId);
    if (from === -1 || to === -1) return;
    const next = [...currentIds];
    next.splice(to, 0, ...next.splice(from, 1));
    setOrderOverride(next);
    persistOrder(next);
  }

  function toggleArchived() {
    setShowArchived((v) => !v);
  }

  return {
    activeGroups: orderedActiveGroups,
    archivedGroups,
    showArchived,
    toggleArchived,
    reorderActiveGroup,
  };
}
