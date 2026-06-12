# Staff Phase 1 Audit & Architecture Map

Generated: 2026-06-09T21:18:52.638Z

Phase ini hanya audit. Tidak ada perubahan UI, store, route, auth, atau behavior form.

## File Map

| Area | Value |
|---|---|
| Staff page JSX | `src/pages/StaffPage.jsx` |
| Staff page CSS | `src/pages/StaffPage.css` |
| Settings reference JSX | `src/pages/SettingsPage.jsx` |
| Settings reference CSS | `src/pages/SettingsPage.css` |
| Modal component | `src/components/Modal.jsx` |
| Sidebar JSX | `src/components/Sidebar.jsx` |
| Sidebar CSS | `src/components/Sidebar.css` |
| Staff store | `src/store/useStaffStore.js` |
| Audit log store | `src/store/useAuditLogStore.js` |
| Permissions lib | `src/lib/permissions.js` |
| Animations | Animations file tidak ditemukan di kandidat umum. Ini bukan blocker Phase 1, tapi Phase 2+ harus memastikan import animasi existing di StaffPage.jsx tidak disentuh. |
| Package manifest | `package.json` |

## Staff Architecture Map

### Root & Layout

- Root staff page anchor: `className="app-page staff-page"`
- Current page masih memakai global app page layout.
- Staff list dirender melalui `staff-grid`.
- Staff card memakai `app-panel staff-card`.
- Audit log memakai `app-panel audit-log-panel`.

### Data Flow

- Staff data source: `useStaffStore`
- Audit data source: `useAuditLogStore`
- Search flow uses `Fuse`
- Filtered rendering uses existing `filteredStaff`
- Audit list currently keeps `logs.slice(0, 10)`

### Staff Actions Preserved

- `handleOpenModal`
- `onSubmitStaff`
- `handleOpenResetPassword`
- `onSubmitResetPassword`
- `handleDelete`
- `handleToggleStatus`

### Role & Permission Flow Preserved

- `PERMISSIONS`
- `PERMISSION_LABELS`
- `getDefaultPermissionsForRole`
- `handleRoleChange`
- `handlePermissionToggle`
- `watchedRole`
- `watchedPermissions`

## Settings Design Reference Map

### JSX Hooks

Detected Settings class hooks that matter for Staff redesign:

- .settings-command-copy
- .settings-command-eyebrow
- .settings-command-shell
- .settings-command-text
- .settings-command-top
- .settings-header-icon
- .settings-layout
- .settings-panel
- .settings-panel-header
- .settings-save-btn
- .settings-save-cluster
- .settings-state-pill

### CSS Reference Selectors

Key Settings selectors detected:

- .settings-header-icon
- .settings-layout
- .settings-nav
- .settings-page
- .settings-panel
- .settings-panel-header
- .settings-save-btn

## Current Staff Class Hooks

- .app-card
- .app-page
- .app-page-actions
- .app-page-header
- .app-page-subtitle
- .app-page-title
- .app-panel
- .app-search
- .app-search-clear
- .app-search-icon
- .app-search-input
- .app-search-md
- .app-table-toolbar
- .app-table-toolbar-left
- .app-table-toolbar-right
- .app-table-toolbar-subtitle
- .app-table-toolbar-title
- .audit-icon
- .audit-log-empty
- .audit-log-header
- .audit-log-panel
- .audit-log-timeline
- .bf-actions
- .bf-input
- .bf-label
- .bf-required
- .bf-row
- .btn-primary
- .btn-secondary
- .cf-error-message
- .chip-more
- .delete
- .edit
- .empty-circle
- .f-badge
- .f-badge-neutral
- .form-group
- .icon-btn
- .permission
- .permission-card
- .permission-grid
- .permission-icon
- .permission-label
- .spinner
- .staff-actions
- .staff-avatar
- .staff-avatar-container
- .staff-card
- .staff-card-header
- .staff-form
- .staff-grid
- .staff-info
- .staff-page
- .staff-permission-chips
- .staff-phone
- .staff-status-bar
- .staff-status-ring
- .timeline-action
- .timeline-actor
- .timeline-content
- .timeline-item
- .timeline-marker
- .timeline-meta
- .timeline-time
- .watchedRole

## Metrics

| Area | Value |
|---|---|
| Staff inline style count | 10 |
| Settings inline style count | 8 |
| Staff className count | 94 |
| Settings className count | 221 |
| Staff Modal usage count | 2 |
| Staff motion usage count | 4 |
| Staff CSS selector count | 29 |
| Settings CSS selector count | 98 |

## Modal Usage Count

- Staff modal usage detected: 2
- Modal component file exists and should remain the wrapper.
- Phase 5 should add Staff-specific class hooks without changing validation or submit handlers.

## Inline Style Notes

Inline style count in StaffPage.jsx: 10

Recommended later movement:

- Reset password icon color
- Username spacing
- Status badge small sizing
- Error message styling
- Reset password submit button highlight

Do this gradually in modal/card phases, not in Phase 2.

## Responsive Risk Notes

- StaffPage.css sudah punya media query.
- Ada token mobile `--mob-*` yang sedang dipakai.
- Ada styling terkait bottom spacing, perlu dicek untuk bottom nav clearance.
- Grid staff memakai CSS grid, aman untuk phase card polish.

Additional visual risks from screenshot baseline:

- Mobile header/title area looks cramped.
- Staff cards are too tall for mobile density.
- Desktop grid leaves too much dead space after the fourth card.
- Audit log consumes too much vertical space.
- Search toolbar feels detached from the Settings-style command shell.

## Animation File Note

Animations file tidak ditemukan di kandidat umum. Ini bukan blocker Phase 1, tapi Phase 2+ harus memastikan import animasi existing di StaffPage.jsx tidak disentuh.

## Logic Guardrail

Do not change these in visual phases unless explicitly approved:

- Store function names and signatures.
- Form schema and validation flow.
- `react-hook-form` register/error usage.
- Role and permission calculations.
- Fuse search state and filtered staff behavior.
- Toast and confetti behavior.
- Sound behavior.
- Audit log data source and `logs.slice(0, 10)`.
- Route/auth/sidebar/public page behavior.

## Package Scripts

Detected package scripts:

- `dev`
- `online`
- `build`
- `lint`
- `test`
- `preview`

## Dependencies Snapshot

Runtime dependencies:

- `@radix-ui/react-dialog`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-popover`
- `@radix-ui/react-tooltip`
- `@radix-ui/themes`
- `@react-pdf/renderer`
- `@tailwindcss/vite`
- `@tanstack/react-table`
- `apexcharts`
- `canvas-confetti`
- `date-fns`
- `exceljs`
- `file-saver`
- `firebase`
- `framer-motion`
- `fuse.js`
- `html2canvas`
- `jspdf`
- `lottie-react`
- `lucide-react`
- `react`
- `react-apexcharts`
- `react-dom`
- `react-hook-form`
- `react-is`
- `react-router-dom`
- `recharts`
- `sonner`
- `tailwindcss`
- `use-sound`
- `zod`
- `zustand`

Dev dependencies:

- `@eslint/js`
- `@types/react`
- `@types/react-dom`
- `@vitejs/plugin-react`
- `concurrently`
- `eslint`
- `eslint-plugin-react-hooks`
- `eslint-plugin-react-refresh`
- `globals`
- `vite`
- `vite-plugin-pwa`
- `vitest`

## Next Safe Patch

### PHASE 2 - Staff Command Header Relayout

Safe target:

- Replace existing Staff header block only.
- Keep `handleOpenModal` intact.
- Add derived summary counts inside component:
  - total staff
  - active staff
  - inactive staff
  - admin count
- Add Staff-specific class hooks:
  - `staff-command-shell`
  - `staff-command-top`
  - `staff-command-copy`
  - `staff-header-icon`
  - `staff-command-text`
  - `staff-command-eyebrow`
  - `staff-action-cluster`
  - `staff-state-pill`
  - `staff-primary-action`

CSS marker for next phase:

```css
/* === START STAFF COMMAND HEADER PHASE 2 === */

/* phase 2 styles */

/* === END STAFF COMMAND HEADER PHASE 2 === */
```

## Phase 1 Result

Audit complete. Ready for Phase 2 after lint/test/build passes and visual baseline is confirmed.
