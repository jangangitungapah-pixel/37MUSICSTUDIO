# Client Inbox CSS Consolidation Audit

Generated at: `2026-06-11T07:29:25.143Z`

## Scope

Audit ini membaca struktur CSS Client Inbox, marker phase, selector overlap, breakpoint, dan risiko conflict. Tidak ada perubahan UI/logic. File yang dibuat hanya dokumentasi audit.

## Page Anchors

| Anchor | Hits in JSX | Hits in CSS targets |
| --- | --- | --- |
| messages-inbox-page | 1 | 547 |
| messages-inbox-shell | 1 | 50 |
| messages-inbox-hero | 1 | 28 |
| inbox-sidebar | 3 | 85 |
| inbox-folder-list | 1 | 38 |
| inbox-list-panel | 1 | 36 |
| inbox-message-list | 1 | 16 |
| inbox-detail-panel | 1 | 37 |
| inbox-detail-header | 1 | 25 |
| inbox-chat-scroll | 1 | 8 |
| inbox-reply-composer | 1 | 36 |
| has-selected-message | 1 | 316 |
| client-inbox-mobile-chat-open | 2 | 17 |

## Imported CSS From ClientMessagesPage.jsx

- `src/pages/ClientMessagesPage.css`

## CSS Target Summary

| File | Imported | Known Candidate | Lines | !important | Marker Blocks | @media | @container |
| --- | --- | --- | --- | --- | --- | --- | --- |
| src/pages/ClientMessagesPage.css | yes | yes | 9551 | 2562 | 12 | 77 | 25 |
| src/pages/ClientMessagesInboxPolish.css | no | yes | 649 | 320 | 0 | 4 | 0 |
| src/pages/ClientMessagesInbox.css | no | yes | 1348 | 0 | 0 | 6 | 2 |

## Marker Blocks Found

| File | Marker | Lines | !important | Selectors | @media | @container | Top Risk Properties |
| --- | --- | --- | --- | --- | --- | --- | --- |
| src/pages/ClientMessagesPage.css | CLIENT_INBOX_HERO_RESPONSIVE_PHASE_2_START | 4722-4964 | 112 | 44 | 2 | 3 | max-width:9, display:8, grid-template-columns:8, padding:7, min-height:6 |
| src/pages/ClientMessagesPage.css | CLIENT_INBOX_PANEL_LAYOUT_PHASE_3_START | 4966-5480 | 222 | 94 | 3 | 4 | min-width:25, display:23, grid-template-columns:19, min-height:19, overflow:16 |
| src/pages/ClientMessagesPage.css | CLIENT_INBOX_MESSENGER_SIMPLIFY_PHASE_4_START | 5482-6610 | 638 | 165 | 3 | 4 | display:49, padding:35, border-radius:28, min-height:27, min-width:25 |
| src/pages/ClientMessagesPage.css | CLIENT_INBOX_CHAT_MARKUP_PHASE_5_START | 6612-6775 | 70 | 25 | 1 | 2 | max-width:8, margin:5, width:5, padding:4, border-radius:3 |
| src/pages/ClientMessagesPage.css | CLIENT_INBOX_MOBILE_CHAT_SCREEN_PHASE_6_START | 6777-7259 | 236 | 77 | 2 | 2 | display:31, min-height:22, padding:18, grid-template-columns:12, height:12 |
| src/pages/ClientMessagesPage.css | CLIENT_INBOX_MOBILE_BACK_ICON_HOTFIX_START | 7261-7289 | 11 | 1 | 0 | 0 | display:1, height:1, width:1 |
| src/pages/ClientMessagesPage.css | CLIENT_INBOX_MOBILE_FULLSCREEN_CHAT_HOTFIX_START | 7291-7728 | 248 | 49 | 2 | 2 | display:23, width:17, padding:16, min-height:14, max-width:13 |
| src/pages/ClientMessagesPage.css | CLIENT_INBOX_MOBILE_LIST_FLATTEN_PHASE_7_START | 7730-8095 | 181 | 48 | 2 | 2 | display:22, padding:17, min-height:13, height:10, width:9 |
| src/pages/ClientMessagesPage.css | CLIENT_INBOX_MOBILE_CHAT_HEADER_COMPOSER_PHASE_8_START | 8097-8483 | 229 | 42 | 1 | 2 | display:19, width:15, height:13, padding:12, overflow:11 |
| src/pages/ClientMessagesPage.css | CLIENT_INBOX_COMPACT_MOBILE_MAILBOX_PHASE_9_START | 8485-8791 | 162 | 38 | 2 | 2 | display:17, height:10, min-height:10, border-radius:9, padding:9 |
| src/pages/ClientMessagesPage.css | CLIENT_INBOX_MODERN_MOBILE_CHAT_PHASE_10_START | 8793-9305 | 306 | 58 | 1 | 2 | display:28, width:20, padding:17, margin:14, height:13 |
| src/pages/ClientMessagesPage.css | CLIENT_INBOX_DESKTOP_VIEWPORT_FIT_PHASE_11_START | 9307-9549 | 115 | 32 | 5 | 0 | padding:15, height:13, min-height:12, display:9, border-radius:5 |

## Phase Grouping

| Group | Count | Markers |
| --- | --- | --- |
| hero | 1 | CLIENT_INBOX_HERO_RESPONSIVE_PHASE_2_START |
| desktop | 1 | CLIENT_INBOX_DESKTOP_VIEWPORT_FIT_PHASE_11_START |
| mobileList | 1 | CLIENT_INBOX_MOBILE_LIST_FLATTEN_PHASE_7_START |
| mobileChat | 4 | CLIENT_INBOX_MOBILE_CHAT_SCREEN_PHASE_6_START, CLIENT_INBOX_MOBILE_FULLSCREEN_CHAT_HOTFIX_START, CLIENT_INBOX_MOBILE_CHAT_HEADER_COMPOSER_PHASE_8_START, CLIENT_INBOX_MODERN_MOBILE_CHAT_PHASE_10_START |
| mailbox | 1 | CLIENT_INBOX_COMPACT_MOBILE_MAILBOX_PHASE_9_START |
| panelLayout | 3 | CLIENT_INBOX_PANEL_LAYOUT_PHASE_3_START, CLIENT_INBOX_MESSENGER_SIMPLIFY_PHASE_4_START, CLIENT_INBOX_CHAT_MARKUP_PHASE_5_START |
| unknown | 1 | CLIENT_INBOX_MOBILE_BACK_ICON_HOTFIX_START |

## Important Selector Conflicts

Selector di bawah ini muncul berulang dan relevan ke layout Client Inbox. Ini bukan otomatis salah, tapi kandidat paling kuat untuk konsolidasi.

| Selector | Occurrences | Files |
| --- | --- | --- |
| .messages-inbox-shell | 20 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .inbox-detail-panel | 14 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .inbox-list-panel | 14 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .inbox-sidebar | 14 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .messages-inbox-page | 12 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .messages-inbox-page:not(.has-selected-message) .inbox-sidebar | 12 | src/pages/ClientMessagesPage.css |
| .inbox-folder-list | 11 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .messages-inbox-page:not(.has-selected-message) .messages-inbox-shell | 11 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page.has-selected-message .inbox-detail-header | 11 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page.has-selected-message .inbox-detail-status | 11 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page:not(.has-selected-message) .inbox-folder-list | 10 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page:not(.has-selected-message) .inbox-list-panel | 10 | src/pages/ClientMessagesPage.css |
| .inbox-detail-actions | 9 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .inbox-folder-btn | 9 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .messages-inbox-hero | 9 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .messages-inbox-page:not(.has-selected-message) | 9 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page:not(.has-selected-message) .inbox-folder-btn | 9 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page.has-selected-message .inbox-reply-composer | 9 | src/pages/ClientMessagesPage.css |
| .inbox-message-list | 8 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .inbox-sidebar-note | 8 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .messages-inbox-page:not(.has-selected-message) .inbox-sidebar-note | 8 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page.has-selected-message .inbox-detail-actions .inbox-action.primary | 8 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page:not(.has-selected-message) .inbox-list-toolbar | 7 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page.has-selected-message .inbox-chat-scroll | 7 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page.has-selected-message .inbox-detail-panel | 7 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page.has-selected-message .messages-inbox-shell | 7 | src/pages/ClientMessagesPage.css |
| .inbox-detail-header | 6 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .inbox-message-row | 6 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .messages-inbox-page .inbox-sidebar | 6 | src/pages/ClientMessagesInbox.css |
| .messages-inbox-page:not(.has-selected-message) .inbox-detail-panel | 6 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page:not(.has-selected-message) .inbox-folder-list::-webkit-scrollbar | 6 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page.has-selected-message .inbox-detail-actions | 6 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page.has-selected-message .inbox-detail-avatar | 6 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page.has-selected-message .inbox-detail-identity | 6 | src/pages/ClientMessagesPage.css |
| .inbox-list-toolbar | 5 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .messages-inbox-page .messages-inbox-hero | 5 | src/pages/ClientMessagesInbox.css |
| .messages-inbox-page .messages-inbox-shell | 5 | src/pages/ClientMessagesInbox.css |
| .messages-inbox-page:not(.has-selected-message) .inbox-message-list | 5 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page.has-selected-message | 5 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page.has-selected-message .inbox-contact-strip | 5 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page.has-selected-message .inbox-customer-reply-note.inbox-chat-bubble.is-admin | 5 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page.has-selected-message .inbox-detail-identity h2 | 5 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page.has-selected-message .inbox-detail-identity p | 5 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page.has-selected-message .inbox-message-reader.inbox-chat-bubble.is-client | 5 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page.has-selected-message .inbox-reply-composer textarea | 5 | src/pages/ClientMessagesPage.css |
| .inbox-action | 4 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .inbox-folder-list::-webkit-scrollbar | 4 | src/pages/ClientMessagesPage.css |
| .inbox-message-reader | 4 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .inbox-sidebar-header | 4 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .messages-inbox-page .inbox-folder-btn | 4 | src/pages/ClientMessagesInbox.css |
| .messages-inbox-page:not(.has-selected-message) .inbox-folder-copy strong | 4 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page:not(.has-selected-message) .inbox-folder-icon | 4 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page.has-selected-message .inbox-admin-reply-history.inbox-chat-thread | 4 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page.has-selected-message .inbox-list-panel | 4 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page.has-selected-message .inbox-reply-note.inbox-chat-bubble.is-internal-note | 4 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page.has-selected-message .inbox-sidebar | 4 | src/pages/ClientMessagesPage.css |
| .messages-page.messages-inbox-page .inbox-sidebar | 4 | src/pages/ClientMessagesInboxPolish.css |
| .messages-page.messages-inbox-page .messages-inbox-shell | 4 | src/pages/ClientMessagesInboxPolish.css |
| body.client-inbox-mobile-chat-open .bottom-nav-bar | 4 | src/pages/ClientMessagesPage.css |
| .inbox-action.primary | 3 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |

## General Repeated Selectors

| Selector | Occurrences | Files |
| --- | --- | --- |
| .messages-inbox-shell | 20 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .messages-page | 17 | src/pages/ClientMessagesPage.css |
| .messages-page .messages-hero | 16 | src/pages/ClientMessagesPage.css |
| .inbox-detail-panel | 14 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .inbox-list-panel | 14 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .inbox-sidebar | 14 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .messages-page .message-card.message-ticket | 14 | src/pages/ClientMessagesPage.css |
| .messages-hero | 12 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page | 12 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .messages-inbox-page:not(.has-selected-message) .inbox-sidebar | 12 | src/pages/ClientMessagesPage.css |
| .inbox-folder-list | 11 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .messages-board | 11 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page:not(.has-selected-message) .messages-inbox-shell | 11 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page.has-selected-message .inbox-detail-header | 11 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page.has-selected-message .inbox-detail-status | 11 | src/pages/ClientMessagesPage.css |
| .messages-page .messages-board | 11 | src/pages/ClientMessagesPage.css |
| .messages-page .messages-toolbar.messages-control-deck | 11 | src/pages/ClientMessagesPage.css |
| .messages-toolbar | 11 | src/pages/ClientMessagesPage.css |
| .message-card | 10 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page:not(.has-selected-message) .inbox-folder-list | 10 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page:not(.has-selected-message) .inbox-list-panel | 10 | src/pages/ClientMessagesPage.css |
| .messages-page .messages-summary-card | 10 | src/pages/ClientMessagesPage.css |
| .inbox-detail-actions | 9 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .inbox-folder-btn | 9 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .messages-inbox-hero | 9 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .messages-inbox-page:not(.has-selected-message) | 9 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page:not(.has-selected-message) .inbox-folder-btn | 9 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page.has-selected-message .inbox-reply-composer | 9 | src/pages/ClientMessagesPage.css |
| .messages-page .messages-empty.messages-state-card | 9 | src/pages/ClientMessagesPage.css |
| .inbox-message-list | 8 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .inbox-sidebar-note | 8 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .inbox-status-dot | 8 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .message-action-btn | 8 | src/pages/ClientMessagesPage.css |
| .message-reply-box button | 8 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page:not(.has-selected-message) .inbox-sidebar-note | 8 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page.has-selected-message .inbox-detail-actions .inbox-action.primary | 8 | src/pages/ClientMessagesPage.css |
| .messages-page .message-card-actions-zone | 8 | src/pages/ClientMessagesPage.css |
| .message-actions | 7 | src/pages/ClientMessagesPage.css |
| .message-body | 7 | src/pages/ClientMessagesPage.css |
| .messages-filter-tabs | 7 | src/pages/ClientMessagesPage.css |
| .messages-filter-tabs button | 7 | src/pages/ClientMessagesPage.css |
| .messages-inbox-metrics | 7 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .messages-inbox-page:not(.has-selected-message) .inbox-list-toolbar | 7 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page.has-selected-message .inbox-chat-scroll | 7 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page.has-selected-message .inbox-detail-panel | 7 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page.has-selected-message .messages-inbox-shell | 7 | src/pages/ClientMessagesPage.css |
| .messages-metric-card | 7 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .messages-page .message-card-shell | 7 | src/pages/ClientMessagesPage.css |
| .messages-page .message-card.message-ticket .message-body | 7 | src/pages/ClientMessagesPage.css |
| .messages-page .message-ticket-id | 7 | src/pages/ClientMessagesPage.css |
| .messages-summary-card | 7 | src/pages/ClientMessagesPage.css |
| .inbox-detail-header | 6 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .inbox-message-row | 6 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .inbox-row-avatar | 6 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .message-meta-grid button | 6 | src/pages/ClientMessagesPage.css |
| .messages-empty | 6 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page .inbox-sidebar | 6 | src/pages/ClientMessagesInbox.css |
| .messages-inbox-page:not(.has-selected-message) .inbox-detail-panel | 6 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page:not(.has-selected-message) .inbox-folder-list::-webkit-scrollbar | 6 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page.has-selected-message .inbox-detail-actions | 6 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page.has-selected-message .inbox-detail-avatar | 6 | src/pages/ClientMessagesPage.css |
| .messages-inbox-page.has-selected-message .inbox-detail-identity | 6 | src/pages/ClientMessagesPage.css |
| .messages-page .message-card-compose textarea | 6 | src/pages/ClientMessagesPage.css |
| .messages-page .message-card.message-ticket .message-card-top | 6 | src/pages/ClientMessagesPage.css |
| .messages-page .messages-control-deck .messages-filter-tabs | 6 | src/pages/ClientMessagesPage.css |
| .messages-page .messages-control-deck .messages-filter-tabs button | 6 | src/pages/ClientMessagesPage.css |
| .inbox-contact-strip | 5 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .inbox-detail-empty | 5 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .inbox-folder-copy small | 5 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .inbox-list-toolbar | 5 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .inbox-row-main | 5 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .inbox-row-preview | 5 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .inbox-row-subject | 5 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .inbox-row-topline | 5 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .inbox-row-topline strong | 5 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .inbox-row-topline time | 5 | src/pages/ClientMessagesPage.css, src/pages/ClientMessagesInbox.css |
| .message-card-top | 5 | src/pages/ClientMessagesPage.css |
| .message-meta-grid | 5 | src/pages/ClientMessagesPage.css |
| .message-reply-box | 5 | src/pages/ClientMessagesPage.css |
| .message-reply-box textarea | 5 | src/pages/ClientMessagesPage.css |

## Risk Notes

- Banyak `!important` di marker phase berarti urutan CSS sangat menentukan.
- Selector mobile chat dan mobile list harus dipisah ketat dengan `.has-selected-message` vs `:not(.has-selected-message)`.
- Selector portal seperti `.bottom-nav-bar` dan `.mobile-command-header` harus tetap dikontrol via `body.client-inbox-mobile-chat-open` karena elemen itu bukan child langsung page.
- Jika marker lama langsung dihapus tanpa blok final, ada risiko desktop/mobile kembali ke layout lama.

## Recommended Phase 13 Cleanup Direction

### Safe consolidation order

1. **Jangan hapus JSX atau handler.** Konsolidasi hanya CSS marker block yang sudah overlap.
2. **Pertahankan latest intent:**
   - Desktop final: Phase 11.
   - Mobile list final: Phase 7 + Phase 9.
   - Mobile chat final: Phase 8 + Phase 10.
3. **Candidate untuk dibuang atau digabung setelah visual check:**
   - Hero responsive lama kalau hero sudah sengaja hidden.
   - Panel layout lama yang ditimpa Messenger/mobile-chat rules.
   - Duplicate mobile chat fullscreen rules yang muncul di beberapa hotfix.
4. **Buat 3 marker final baru:**
   - `CLIENT_INBOX_DESKTOP_FINAL_START/END`
   - `CLIENT_INBOX_MOBILE_LIST_FINAL_START/END`
   - `CLIENT_INBOX_MOBILE_CHAT_FINAL_START/END`
5. Setelah final blocks masuk, remove marker lama satu per satu dengan snapshot visual desktop/mobile.

### Do not touch in cleanup

- Store.
- Data model.
- Route.
- Auth.
- Firebase/API/storage.
- Search/filter logic.
- Reply/follow-up handlers.
- WhatsApp behavior.
