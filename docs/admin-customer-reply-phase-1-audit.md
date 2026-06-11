# Admin Reply to Customer Inbox - Phase 1 Audit

Generated at: 2026-06-11T00:34:08.043Z

Status: AUDIT ONLY  
Scope: admin can reply to customer and reply appears in customer inbox.

---

## 1. File Map

| Area | File | Purpose |
|---|---|---|
| Store | `src/store/useClientMessageStore.js` | Source of truth for clientMessages subscription and mutation actions |
| Admin inbox | `src/pages/ClientMessagesPage.jsx` | Admin-side inbox UI and follow-up actions |
| Customer inbox | `src/pages/ClientMessageCenterPage.jsx` | Customer-side message center and history rendering |
| Customer nav | `src/components/ClientPortalNav.jsx` | Potential unread badge surface |
| Firestore rules | `firestore.rules` | Read/write security for clientMessages |

---

## 2. Current Architecture Map

```txt
Customer sends message
↓
useClientMessageStore.addMessage()
↓
Firestore collection: clientMessages
↓
Admin/staff subscribes all allowed clientMessages
↓
Admin updates message using updateMessageStatus()
↓
Customer subscribes own clientMessages by clientUid
↓
Customer page renders message history
```

Current data is already realtime because both admin and customer subscribe to `clientMessages`.

---

## 3. Store Audit

### src/store/useClientMessageStore.js

| Check | Found | Line | Needle |
|---|---:|---:|---|
| Firestore collection clientMessages | YES | 28 | `collection(db, 'clientMessages')` |
| Client-scoped query by clientUid | YES | 44 | `where('clientUid', '==', user.uid)` |
| Admin/staff reads all messages | YES | 50 | `role === 'admin' \|\| role === 'staff'` |
| Client addMessage action exists | YES | 77 | `addMessage: async` |
| Message direction client_to_admin exists | YES | 98 | `direction: 'client_to_admin'` |
| Admin update status action exists | YES | 125 | `updateMessageStatus: async` |
| Admin reply action exists | NO | - | `sendAdminReply: async` |
| Replies array exists | NO | - | `replies:` |
| Latest admin reply field exists | NO | - | `latestAdminReply` |


### Store Notes

- Existing `addMessage()` is customer-originated.
- Existing `updateMessageStatus()` is admin/staff mutation path.
- There is no confirmed dedicated `sendAdminReply()` action unless the check above says YES.
- Recommended next safe patch: add dedicated `sendAdminReply()`, not overload `adminReplyNote`.

---

## 4. Admin Inbox Audit

### src/pages/ClientMessagesPage.jsx

| Check | Found | Line | Needle |
|---|---:|---:|---|
| Admin page component exists | YES | 18 | `ClientMessagesPage` |
| Uses client message store | YES | 16 | `useClientMessageStore` |
| Reply draft state exists | YES | 101 | `replyDrafts` |
| Internal note save exists | YES | 192 | `saveReplyNote` |
| Admin reply note field exists | YES | 140 | `adminReplyNote` |
| WhatsApp follow-up exists | YES | 481 | `Balas WhatsApp` |
| Mark replied action exists | YES | 490 | `Tandai Dibalas` |
| Mark done action exists | YES | 61 | `Selesai` |
| Dedicated sendAdminReply usage exists | NO | - | `sendAdminReply` |


### Admin Inbox Notes

- Current reply UI may still behave as internal follow-up note.
- Do not remove existing WhatsApp/action buttons in next phase.
- Next phase should add customer-facing reply path beside/above internal note behavior.

---

## 5. Customer Inbox Audit

### src/pages/ClientMessageCenterPage.jsx

| Check | Found | Line | Needle |
|---|---:|---:|---|
| Customer message center exists | YES | 80 | `ClientMessageCenterPage` |
| Customer can add message | YES | 82 | `addMessage` |
| Renders adminReplyNote | YES | 119 | `adminReplyNote` |
| Search includes adminReplyNote | YES | 119 | `adminReplyNote` |
| Renders replies array | NO | - | `message.replies` |
| Reply icon exists | YES | 234 | `<Reply` |
| History list exists | YES | 381 | `client-message-thread-list` |


### Customer Inbox Notes

- Customer currently has a place to see admin note if `adminReplyNote` exists.
- Recommended next safe patch: render `message.replies || []` as customer-facing admin replies.
- Keep backward compatibility for existing `adminReplyNote`.

---

## 6. Customer Nav Audit

### src/components/ClientPortalNav.jsx

| Check | Found | Line | Needle |
|---|---:|---:|---|
| Client nav exists | YES | 85 | `ClientPortalNav` |
| Messages route likely exists | YES | 16 | `/client/messages` |
| Unread/read field isReadByClient exists | NO | - | `isReadByClient` |
| clientMessages referenced | NO | - | `clientMessages` |


### Customer Nav Notes

- Badge/read state should be treated as later phase.
- Do not touch nav in first feature patch unless required.

---

## 7. Firestore Rules Audit

### firestore.rules

| Check | Found | Line | Needle |
|---|---:|---:|---|
| clientMessages rules block exists | YES | 277 | `match /clientMessages/{messageId}` |
| Admin read allowed | YES | 278 | `allow read: if isAdmin()` |
| Client read own message allowed | YES | 204 | `resource.data.clientUid == request.auth.uid` |
| Client create allowed | YES | 286 | `allow create: if signedInNonAnonymous()` |
| Client direction constrained | YES | 312 | `request.resource.data.direction == 'client_to_admin'` |
| Admin/staff update allowed | YES | 323 | `allow update: if isAdmin()` |
| Admin delete allowed | YES | 327 | `allow delete: if isAdmin()` |


### Rules Notes

- Admin/staff update is already permitted.
- Customer read own message is already permitted.
- Admin reply can work without changing rules if admin updates existing message document.
- Customer mark-read would require a separate guarded rules phase.

---

## 8. Logic Guardrail

Do not change without explicit approval:

- Auth flow
- Role/permission system
- Client query scoping by `clientUid`
- Existing `addMessage()`
- Existing `updateMessageStatus()`
- Existing WhatsApp follow-up behavior
- Existing status labels unless phase specifically asks
- Firestore rules unless the phase is security/rules-focused

Recommended data approach:

```js
{
  replies: [
    {
      id: string,
      senderRole: "admin",
      senderUid: string,
      senderName: string,
      message: string,
      createdAt: string,
      isReadByClient: false
    }
  ],
  latestAdminReply: string,
  latestAdminReplyAt: string,
  lastMessagePreview: string,
  lastMessageAt: string,
  status: "replied",
  isReadByClient: false,
  isReadByAdmin: true,
  updatedAt: string
}
```

---

## 9. UI/UX Risk Notes

- Risk: admin note and customer reply become semantically mixed.
- Risk: existing admin inbox action label may mislead users.
- Risk: customer history may show only one reply if using `adminReplyNote`.
- Risk: reply composer may need separate labels:
  - customer-facing reply
  - internal admin note

Recommended UI language:

- Admin button: "Kirim Balasan"
- Internal note button remains: "Simpan Catatan Internal"
- Customer label: "Balasan Admin"

---

## 10. Responsive Risk Notes

- Admin inbox currently has 3-pane layout risk on narrow screens.
- Customer reply rendering must not create oversized cards.
- Long replies need wrapping and max-width.
- Later CSS phase should use markers and avoid global selectors.

---

## 11. Dependency Notes

No new dependency required.

Existing stack appears enough:

- React state
- Zustand store
- Firebase Firestore
- lucide-react icons
- existing notification store

Potential Firestore helper needed in next phase:

```js
arrayUnion
```

---

## 12. Next Safe Patch

Recommended Phase 2:

- File: `src/store/useClientMessageStore.js`
- Add Firestore `arrayUnion` import.
- Add dedicated `sendAdminReply(messageId, reply)` action.
- Do not touch UI yet.
- Do not alter `addMessage()`.
- Do not alter `updateMessageStatus()`.
- Do not alter Firestore rules.

Success criteria for Phase 2:

- Lint pass
- Build pass
- Store exports `sendAdminReply`
- Existing add/update behavior still intact

---

## 13. Known Limitations After Phase 1

- No admin customer-facing reply yet.
- No client render for replies array yet.
- No unread badge update yet.
- No customer mark-read yet.
- No CSS chat bubble yet.
