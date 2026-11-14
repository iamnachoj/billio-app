import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { useDashboard, type DashboardGroup } from '../useDashboard';

describe('useDashboard', () => {
  it('separates active and archived groups and hides archived groups initially', () => {
    const now = new Date();
    const groups: DashboardGroup[] = [
      {
        id: 'active',
        name: 'Active',
        createdBy: 'user',
        createdAt: now,
        updatedAt: now,
        archivedAt: null,
      },
      {
        id: 'archived',
        name: 'Archived',
        createdBy: 'user',
        createdAt: now,
        updatedAt: now,
        archivedAt: now,
      },
    ];

    function Probe() {
      const dashboard = useDashboard(groups);
      return (
        <div>
          <span>
            {dashboard.activeGroups.map((group) => group.id).join(',')}
          </span>
          <span>
            {dashboard.archivedGroups.map((group) => group.id).join(',')}
          </span>
          <span>{String(dashboard.showArchived)}</span>
        </div>
      );
    }

    expect(renderToStaticMarkup(<Probe />)).toBe(
      '<div><span>active</span><span>archived</span><span>false</span></div>'
    );
  });
});
