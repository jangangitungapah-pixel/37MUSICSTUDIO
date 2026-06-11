# Phase 3 Admin Inbox Anchor Inspection

Generated at: 2026-06-11T00:44:08.354Z

Status: INSPECTION ONLY

Tujuan dokumen ini:

- Menangkap bentuk aktual `ClientMessagesPage.jsx` setelah anchor Phase 3 gagal.
- Menghindari scroll limit terminal.
- Jadi bahan untuk bikin Phase 3 Hotfix Script yang anchor-nya sesuai file lokal.

## Summary Check - Admin Inbox

| Check | Found | Line | Needle |
|---|---:|---:|---|
| Store usage | YES | 16 | `useClientMessageStore` |
| sendAdminReply referenced | NO | - | `sendAdminReply` |
| sendCustomerReply handler | NO | - | `sendCustomerReply` |
| replyDrafts state | YES | 101 | `replyDrafts` |
| saveReplyNote handler | YES | 192 | `saveReplyNote` |
| inbox-detail-actions | YES | 458 | `inbox-detail-actions` |
| Simpan Catatan label | YES | 461 | `Simpan Catatan` |
| Simpan Catatan Internal label | NO | - | `Simpan Catatan Internal` |
| Kirim Balasan label | NO | - | `Kirim Balasan` |
| Balas WhatsApp preserved | YES | 481 | `Balas WhatsApp` |
| Tandai Dibalas preserved | YES | 490 | `Tandai Dibalas` |
| Selesai preserved | YES | 61 | `Selesai` |

## Summary Check - Store

| Check | Found | Line | Needle |
|---|---:|---:|---|
| arrayUnion import | YES | 5 | `arrayUnion` |
| sendAdminReply action | YES | 126 | `sendAdminReply: async` |
| replies arrayUnion | YES | 152 | `replies: arrayUnion` |
| latestAdminReply | YES | 153 | `latestAdminReply` |
| isReadByClient false | YES | 147 | `isReadByClient: false` |

## Admin Store Destructure Context

File: `src/pages/ClientMessagesPage.jsx`
Needle: `useClientMessageStore`
Status: **FOUND line 16**

```jsx
   6 |   Inbox,
   7 |   Mail,
   8 |   MessageCircle,
   9 |   Phone,
  10 |   RefreshCw,
  11 |   Reply,
  12 |   Search,
  13 |   Send,
  14 |   UserRound,
  15 | } from 'lucide-react';
  16 | import { useClientMessageStore } from '../store/useClientMessageStore';
  17 | import { useNotificationStore } from '../store/useNotificationStore';
  18 | import './ClientMessagesPage.css';
  19 | 
  20 | const clean = (value) => String(value || '').trim().toLowerCase();
  21 | const digits = (value) => String(value || '').replace(/\D/g, '');
  22 | 
  23 | const normalizeWaNumber = (value) => {
  24 |   const raw = digits(value);
  25 |   if (!raw) return '';
  26 |   if (raw.startsWith('62')) return raw;
  27 |   if (raw.startsWith('0')) return '62' + raw.slice(1);
  28 |   return raw;
  29 | };
  30 | 
  31 | const formatDateTime = (value) => {
  32 |   if (!value) return 'Waktu tidak tersedia';
  33 | 
  34 |   try {
  35 |     return new Intl.DateTimeFormat('id-ID', {
  36 |       dateStyle: 'medium',
  37 |       timeStyle: 'short',
  38 |     }).format(new Date(value));
  39 |   } catch {
  40 |     return value;
  41 |   }
  42 | };
  43 | 
  44 | const formatShortTime = (value) => {
  45 |   if (!value) return '—';
  46 | 
```

## Reply Drafts Context

File: `src/pages/ClientMessagesPage.jsx`
Needle: `replyDrafts`
Status: **FOUND line 101**

```jsx
  91 |   { key: 'replied', label: 'Dibalas', description: 'Sudah difollow up', icon: Reply },
  92 |   { key: 'done', label: 'Selesai', description: 'Closed thread', icon: CheckCircle2 },
  93 |   { key: 'all', label: 'Semua Pesan', description: 'Arsip operasional', icon: Mail },
  94 | ];
  95 | 
  96 | const ClientMessagesPage = () => {
  97 |   const { messages, isLoaded, error, updateMessageStatus } = useClientMessageStore();
  98 |   const [activeFilter, setActiveFilter] = useState('open');
  99 |   const [searchTerm, setSearchTerm] = useState('');
 100 |   const [selectedMessageId, setSelectedMessageId] = useState(null);
 101 |   const [replyDrafts, setReplyDrafts] = useState({});
 102 | 
 103 |   const addNotification = useNotificationStore((state) => state.addNotification);
 104 | 
 105 |   const sortedMessages = useMemo(() => {
 106 |     return [...(messages || [])].sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));
 107 |   }, [messages]);
 108 | 
 109 |   const mailboxCounts = useMemo(() => {
 110 |     const open = sortedMessages.filter(isOpenMessage).length;
 111 |     const replied = sortedMessages.filter((message) => getMessageStatus(message) === 'replied').length;
 112 |     const done = sortedMessages.filter((message) => getMessageStatus(message) === 'done').length;
 113 | 
 114 |     return {
 115 |       all: sortedMessages.length,
 116 |       open,
 117 |       replied,
 118 |       done,
 119 |     };
 120 |   }, [sortedMessages]);
 121 | 
 122 |   const filteredMessages = useMemo(() => {
 123 |     const query = clean(searchTerm);
 124 | 
 125 |     return sortedMessages.filter((message) => {
 126 |       const normalizedStatus = getMessageStatus(message);
 127 |       const passFilter = activeFilter === 'all'
 128 |         ? true
 129 |         : activeFilter === 'open'
 130 |           ? normalizedStatus !== 'done' && normalizedStatus !== 'replied'
 131 |           : normalizedStatus === activeFilter;
 132 | 
 133 |       const haystack = clean([
 134 |         message.clientName,
 135 |         message.clientEmail,
 136 |         message.clientPhone,
```

## saveReplyNote Handler Context

File: `src/pages/ClientMessagesPage.jsx`
Needle: `const saveReplyNote`
Status: **FOUND line 192**

```jsx
 180 |         title: 'Berhasil disalin',
 181 |         message: label + ' sudah masuk clipboard.',
 182 |       });
 183 |     } catch {
 184 |       addNotification({
 185 |         type: 'error',
 186 |         title: 'Gagal menyalin',
 187 |         message: 'Browser tidak mengizinkan akses clipboard.',
 188 |       });
 189 |     }
 190 |   };
 191 | 
 192 |   const saveReplyNote = async (message) => {
 193 |     const note = String(replyDrafts[message.id] || '').trim();
 194 | 
 195 |     if (!note) {
 196 |       addNotification({
 197 |         type: 'warning',
 198 |         title: 'Catatan kosong',
 199 |         message: 'Tulis catatan follow up dulu.',
 200 |       });
 201 |       return;
 202 |     }
 203 | 
 204 |     await updateMessageStatus(message.id, 'replied', {
 205 |       adminReplyNote: note,
 206 |       repliedAt: new Date().toISOString(),
 207 |       isReadByAdmin: true,
 208 |     });
 209 | 
 210 |     setReplyDrafts((current) => ({ ...current, [message.id]: '' }));
 211 | 
 212 |     addNotification({
 213 |       type: 'success',
 214 |       title: 'Catatan disimpan',
 215 |       message: 'Pesan ditandai sudah dibalas.',
 216 |     });
 217 |   };
 218 | 
 219 |   const markReplied = async (message) => {
 220 |     await updateMessageStatus(message.id, 'replied', {
 221 |       isReadByAdmin: true,
 222 |       repliedAt: new Date().toISOString(),
 223 |     });
 224 |   };
 225 | 
 226 |   const markDone = async (message) => {
 227 |     await updateMessageStatus(message.id, 'done', {
 228 |       isReadByAdmin: true,
 229 |       doneAt: new Date().toISOString(),
 230 |     });
 231 |   };
 232 | 
 233 |   const getWhatsAppHref = (message) => {
 234 |     const waNumber = normalizeWaNumber(message?.clientPhone);
 235 |     const waText = encodeURIComponent(
 236 |       'Halo ' + (message?.clientName || 'kak') + ', kami dari 37 Music Studio mau follow up pesan kamu di Client Portal: "' + (message?.message || '') + '"'
 237 |     );
```

## markReplied Handler Context

File: `src/pages/ClientMessagesPage.jsx`
Needle: `const markReplied`
Status: **FOUND line 219**

```jsx
 207 |       isReadByAdmin: true,
 208 |     });
 209 | 
 210 |     setReplyDrafts((current) => ({ ...current, [message.id]: '' }));
 211 | 
 212 |     addNotification({
 213 |       type: 'success',
 214 |       title: 'Catatan disimpan',
 215 |       message: 'Pesan ditandai sudah dibalas.',
 216 |     });
 217 |   };
 218 | 
 219 |   const markReplied = async (message) => {
 220 |     await updateMessageStatus(message.id, 'replied', {
 221 |       isReadByAdmin: true,
 222 |       repliedAt: new Date().toISOString(),
 223 |     });
 224 |   };
 225 | 
 226 |   const markDone = async (message) => {
 227 |     await updateMessageStatus(message.id, 'done', {
 228 |       isReadByAdmin: true,
 229 |       doneAt: new Date().toISOString(),
 230 |     });
 231 |   };
 232 | 
 233 |   const getWhatsAppHref = (message) => {
 234 |     const waNumber = normalizeWaNumber(message?.clientPhone);
 235 |     const waText = encodeURIComponent(
 236 |       'Halo ' + (message?.clientName || 'kak') + ', kami dari 37 Music Studio mau follow up pesan kamu di Client Portal: "' + (message?.message || '') + '"'
 237 |     );
 238 | 
 239 |     return waNumber ? 'https://wa.me/' + waNumber + '?text=' + waText : '';
 240 |   };
 241 | 
 242 |   const activeFolder = folderOptions.find((folder) => folder.key === activeFilter) || folderOptions[0];
 243 |   const selectedWaHref = selectedMessage ? getWhatsAppHref(selectedMessage) : '';
 244 | 
 245 |   return (
 246 |     <div className="messages-page messages-inbox-page">
 247 |       <header className="messages-inbox-hero" aria-labelledby="messagesHeroTitle">
 248 |         <div className="messages-inbox-titleblock">
 249 |           <span className="messages-kicker">
 250 |             <MessageCircle size={16} />
 251 |             37 Admin Inbox
 252 |           </span>
 253 |           <h1 id="messagesHeroTitle">Client Inbox</h1>
 254 |           <p>
 255 |             Kelola pesan client dengan workflow inbox profesional: baca, cari, follow up, beri catatan, dan tutup percakapan dari satu layar.
 256 |           </p>
 257 |         </div>
 258 | 
 259 |         <div className="messages-inbox-metrics" aria-label="Ringkasan pesan client">
 260 |           <article className="messages-metric-card is-open">
 261 |             <span>Open</span>
 262 |             <strong>{isLoaded ? mailboxCounts.open : '...'}</strong>
 263 |             <small>Butuh follow up</small>
 264 |           </article>
```

## inbox-detail-actions Context

File: `src/pages/ClientMessagesPage.jsx`
Needle: `inbox-detail-actions`
Status: **FOUND line 458**

```jsx
 434 |               </section>
 435 | 
 436 |               {selectedMessage.adminReplyNote && (
 437 |                 <section className="inbox-reply-note">
 438 |                   <Reply size={16} />
 439 |                   <div>
 440 |                     <strong>Catatan admin</strong>
 441 |                     <p>{selectedMessage.adminReplyNote}</p>
 442 |                   </div>
 443 |                 </section>
 444 |               )}
 445 | 
 446 |               <section className="inbox-reply-composer" aria-label="Catatan follow up admin">
 447 |                 <label htmlFor={'reply-note-' + selectedMessage.id}>Catatan follow up</label>
 448 |                 <textarea
 449 |                   id={'reply-note-' + selectedMessage.id}
 450 |                   value={replyDrafts[selectedMessage.id] || ''}
 451 |                   onChange={(event) => setReplyDrafts((current) => ({
 452 |                     ...current,
 453 |                     [selectedMessage.id]: event.target.value,
 454 |                   }))}
 455 |                   placeholder="Tulis catatan internal. Contoh: Sudah dibalas via WA, client minta Sabtu malam."
 456 |                   rows={5}
 457 |                 />
 458 |                 <div className="inbox-detail-actions">
 459 |                   <button type="button" className="inbox-action primary" onClick={() => saveReplyNote(selectedMessage)}>
 460 |                     <Send size={15} />
 461 |                     Simpan Catatan
 462 |                   </button>
 463 |                   <a
 464 |                     className={'inbox-action whatsapp' + (!selectedWaHref ? ' is-disabled' : '')}
 465 |                     href={selectedWaHref || undefined}
 466 |                     target="_blank"
 467 |                     rel="noreferrer"
 468 |                     aria-disabled={!selectedWaHref}
 469 |                     onClick={(event) => {
 470 |                       if (!selectedWaHref) {
 471 |                         event.preventDefault();
 472 |                         addNotification({
 473 |                           type: 'warning',
 474 |                           title: 'Nomor WhatsApp kosong',
 475 |                           message: 'Client belum menyimpan nomor WhatsApp.',
 476 |                         });
 477 |                       }
 478 |                     }}
 479 |                   >
 480 |                     <MessageCircle size={15} />
 481 |                     Balas WhatsApp
 482 |                   </a>
 483 |                   <button
 484 |                     type="button"
 485 |                     className="inbox-action"
 486 |                     onClick={() => markReplied(selectedMessage)}
 487 |                     disabled={selectedMessage.status === 'replied' || selectedMessage.status === 'done'}
 488 |                   >
 489 |                     <Reply size={15} />
 490 |                     Tandai Dibalas
 491 |                   </button>
 492 |                   <button
 493 |                     type="button"
 494 |                     className="inbox-action success"
 495 |                     onClick={() => markDone(selectedMessage)}
 496 |                     disabled={selectedMessage.status === 'done'}
 497 |                   >
 498 |                     <CheckCircle2 size={15} />
 499 |                     Selesai
 500 |                   </button>
 501 |                 </div>
 502 |               </section>
 503 |             </>
 504 |           )}
 505 |         </article>
 506 |       </section>
 507 |     </div>
 508 |   );
 509 | };
 510 | 
 511 | export default ClientMessagesPage;
 512 | 
```

## Simpan Catatan Context

File: `src/pages/ClientMessagesPage.jsx`
Needle: `Simpan Catatan`
Status: **FOUND line 461**

```jsx
 437 |                 <section className="inbox-reply-note">
 438 |                   <Reply size={16} />
 439 |                   <div>
 440 |                     <strong>Catatan admin</strong>
 441 |                     <p>{selectedMessage.adminReplyNote}</p>
 442 |                   </div>
 443 |                 </section>
 444 |               )}
 445 | 
 446 |               <section className="inbox-reply-composer" aria-label="Catatan follow up admin">
 447 |                 <label htmlFor={'reply-note-' + selectedMessage.id}>Catatan follow up</label>
 448 |                 <textarea
 449 |                   id={'reply-note-' + selectedMessage.id}
 450 |                   value={replyDrafts[selectedMessage.id] || ''}
 451 |                   onChange={(event) => setReplyDrafts((current) => ({
 452 |                     ...current,
 453 |                     [selectedMessage.id]: event.target.value,
 454 |                   }))}
 455 |                   placeholder="Tulis catatan internal. Contoh: Sudah dibalas via WA, client minta Sabtu malam."
 456 |                   rows={5}
 457 |                 />
 458 |                 <div className="inbox-detail-actions">
 459 |                   <button type="button" className="inbox-action primary" onClick={() => saveReplyNote(selectedMessage)}>
 460 |                     <Send size={15} />
 461 |                     Simpan Catatan
 462 |                   </button>
 463 |                   <a
 464 |                     className={'inbox-action whatsapp' + (!selectedWaHref ? ' is-disabled' : '')}
 465 |                     href={selectedWaHref || undefined}
 466 |                     target="_blank"
 467 |                     rel="noreferrer"
 468 |                     aria-disabled={!selectedWaHref}
 469 |                     onClick={(event) => {
 470 |                       if (!selectedWaHref) {
 471 |                         event.preventDefault();
 472 |                         addNotification({
 473 |                           type: 'warning',
 474 |                           title: 'Nomor WhatsApp kosong',
 475 |                           message: 'Client belum menyimpan nomor WhatsApp.',
 476 |                         });
 477 |                       }
 478 |                     }}
 479 |                   >
 480 |                     <MessageCircle size={15} />
 481 |                     Balas WhatsApp
 482 |                   </a>
 483 |                   <button
 484 |                     type="button"
 485 |                     className="inbox-action"
 486 |                     onClick={() => markReplied(selectedMessage)}
 487 |                     disabled={selectedMessage.status === 'replied' || selectedMessage.status === 'done'}
 488 |                   >
 489 |                     <Reply size={15} />
 490 |                     Tandai Dibalas
 491 |                   </button>
 492 |                   <button
 493 |                     type="button"
 494 |                     className="inbox-action success"
 495 |                     onClick={() => markDone(selectedMessage)}
 496 |                     disabled={selectedMessage.status === 'done'}
 497 |                   >
 498 |                     <CheckCircle2 size={15} />
 499 |                     Selesai
 500 |                   </button>
 501 |                 </div>
 502 |               </section>
 503 |             </>
 504 |           )}
 505 |         </article>
 506 |       </section>
 507 |     </div>
 508 |   );
 509 | };
 510 | 
 511 | export default ClientMessagesPage;
 512 | 
```

## Textarea Placeholder Context

File: `src/pages/ClientMessagesPage.jsx`
Needle: `textarea`
Status: **FOUND line 448**

```jsx
 428 |                 </button>
 429 |               </section>
 430 | 
 431 |               <section className="inbox-message-reader">
 432 |                 <span>Isi Pesan</span>
 433 |                 <p>{selectedMessage.message || 'Tidak ada isi pesan.'}</p>
 434 |               </section>
 435 | 
 436 |               {selectedMessage.adminReplyNote && (
 437 |                 <section className="inbox-reply-note">
 438 |                   <Reply size={16} />
 439 |                   <div>
 440 |                     <strong>Catatan admin</strong>
 441 |                     <p>{selectedMessage.adminReplyNote}</p>
 442 |                   </div>
 443 |                 </section>
 444 |               )}
 445 | 
 446 |               <section className="inbox-reply-composer" aria-label="Catatan follow up admin">
 447 |                 <label htmlFor={'reply-note-' + selectedMessage.id}>Catatan follow up</label>
 448 |                 <textarea
 449 |                   id={'reply-note-' + selectedMessage.id}
 450 |                   value={replyDrafts[selectedMessage.id] || ''}
 451 |                   onChange={(event) => setReplyDrafts((current) => ({
 452 |                     ...current,
 453 |                     [selectedMessage.id]: event.target.value,
 454 |                   }))}
 455 |                   placeholder="Tulis catatan internal. Contoh: Sudah dibalas via WA, client minta Sabtu malam."
 456 |                   rows={5}
 457 |                 />
 458 |                 <div className="inbox-detail-actions">
 459 |                   <button type="button" className="inbox-action primary" onClick={() => saveReplyNote(selectedMessage)}>
 460 |                     <Send size={15} />
 461 |                     Simpan Catatan
 462 |                   </button>
 463 |                   <a
 464 |                     className={'inbox-action whatsapp' + (!selectedWaHref ? ' is-disabled' : '')}
 465 |                     href={selectedWaHref || undefined}
 466 |                     target="_blank"
 467 |                     rel="noreferrer"
 468 |                     aria-disabled={!selectedWaHref}
 469 |                     onClick={(event) => {
 470 |                       if (!selectedWaHref) {
 471 |                         event.preventDefault();
 472 |                         addNotification({
 473 |                           type: 'warning',
 474 |                           title: 'Nomor WhatsApp kosong',
 475 |                           message: 'Client belum menyimpan nomor WhatsApp.',
 476 |                         });
 477 |                       }
 478 |                     }}
 479 |                   >
 480 |                     <MessageCircle size={15} />
 481 |                     Balas WhatsApp
 482 |                   </a>
 483 |                   <button
 484 |                     type="button"
 485 |                     className="inbox-action"
 486 |                     onClick={() => markReplied(selectedMessage)}
 487 |                     disabled={selectedMessage.status === 'replied' || selectedMessage.status === 'done'}
 488 |                   >
 489 |                     <Reply size={15} />
 490 |                     Tandai Dibalas
 491 |                   </button>
 492 |                   <button
 493 |                     type="button"
 494 |                     className="inbox-action success"
 495 |                     onClick={() => markDone(selectedMessage)}
 496 |                     disabled={selectedMessage.status === 'done'}
 497 |                   >
 498 |                     <CheckCircle2 size={15} />
 499 |                     Selesai
 500 |                   </button>
 501 |                 </div>
 502 |               </section>
 503 |             </>
 504 |           )}
 505 |         </article>
 506 |       </section>
 507 |     </div>
 508 |   );
```

## Balas WhatsApp Context

File: `src/pages/ClientMessagesPage.jsx`
Needle: `Balas WhatsApp`
Status: **FOUND line 481**

```jsx
 461 |                     Simpan Catatan
 462 |                   </button>
 463 |                   <a
 464 |                     className={'inbox-action whatsapp' + (!selectedWaHref ? ' is-disabled' : '')}
 465 |                     href={selectedWaHref || undefined}
 466 |                     target="_blank"
 467 |                     rel="noreferrer"
 468 |                     aria-disabled={!selectedWaHref}
 469 |                     onClick={(event) => {
 470 |                       if (!selectedWaHref) {
 471 |                         event.preventDefault();
 472 |                         addNotification({
 473 |                           type: 'warning',
 474 |                           title: 'Nomor WhatsApp kosong',
 475 |                           message: 'Client belum menyimpan nomor WhatsApp.',
 476 |                         });
 477 |                       }
 478 |                     }}
 479 |                   >
 480 |                     <MessageCircle size={15} />
 481 |                     Balas WhatsApp
 482 |                   </a>
 483 |                   <button
 484 |                     type="button"
 485 |                     className="inbox-action"
 486 |                     onClick={() => markReplied(selectedMessage)}
 487 |                     disabled={selectedMessage.status === 'replied' || selectedMessage.status === 'done'}
 488 |                   >
 489 |                     <Reply size={15} />
 490 |                     Tandai Dibalas
 491 |                   </button>
 492 |                   <button
 493 |                     type="button"
 494 |                     className="inbox-action success"
 495 |                     onClick={() => markDone(selectedMessage)}
 496 |                     disabled={selectedMessage.status === 'done'}
 497 |                   >
 498 |                     <CheckCircle2 size={15} />
 499 |                     Selesai
 500 |                   </button>
 501 |                 </div>
 502 |               </section>
 503 |             </>
 504 |           )}
 505 |         </article>
 506 |       </section>
 507 |     </div>
 508 |   );
 509 | };
 510 | 
 511 | export default ClientMessagesPage;
 512 | 
```

## Tandai Dibalas Context

File: `src/pages/ClientMessagesPage.jsx`
Needle: `Tandai Dibalas`
Status: **FOUND line 490**

```jsx
 470 |                       if (!selectedWaHref) {
 471 |                         event.preventDefault();
 472 |                         addNotification({
 473 |                           type: 'warning',
 474 |                           title: 'Nomor WhatsApp kosong',
 475 |                           message: 'Client belum menyimpan nomor WhatsApp.',
 476 |                         });
 477 |                       }
 478 |                     }}
 479 |                   >
 480 |                     <MessageCircle size={15} />
 481 |                     Balas WhatsApp
 482 |                   </a>
 483 |                   <button
 484 |                     type="button"
 485 |                     className="inbox-action"
 486 |                     onClick={() => markReplied(selectedMessage)}
 487 |                     disabled={selectedMessage.status === 'replied' || selectedMessage.status === 'done'}
 488 |                   >
 489 |                     <Reply size={15} />
 490 |                     Tandai Dibalas
 491 |                   </button>
 492 |                   <button
 493 |                     type="button"
 494 |                     className="inbox-action success"
 495 |                     onClick={() => markDone(selectedMessage)}
 496 |                     disabled={selectedMessage.status === 'done'}
 497 |                   >
 498 |                     <CheckCircle2 size={15} />
 499 |                     Selesai
 500 |                   </button>
 501 |                 </div>
 502 |               </section>
 503 |             </>
 504 |           )}
 505 |         </article>
 506 |       </section>
 507 |     </div>
 508 |   );
 509 | };
 510 | 
 511 | export default ClientMessagesPage;
 512 | 
```

## Selesai Context

File: `src/pages/ClientMessagesPage.jsx`
Needle: `Selesai`
Status: **FOUND line 61**

```jsx
  41 |   }
  42 | };
  43 | 
  44 | const formatShortTime = (value) => {
  45 |   if (!value) return '—';
  46 | 
  47 |   try {
  48 |     return new Intl.DateTimeFormat('id-ID', {
  49 |       day: '2-digit',
  50 |       month: 'short',
  51 |       hour: '2-digit',
  52 |       minute: '2-digit',
  53 |     }).format(new Date(value));
  54 |   } catch {
  55 |     return value;
  56 |   }
  57 | };
  58 | 
  59 | const statusLabel = (status) => {
  60 |   const normalized = clean(status);
  61 |   if (normalized === 'done') return 'Selesai';
  62 |   if (normalized === 'replied') return 'Dibalas';
  63 |   return 'Open';
  64 | };
  65 | 
  66 | const statusTone = (status) => {
  67 |   const normalized = clean(status);
  68 |   if (normalized === 'done') return 'green';
  69 |   if (normalized === 'replied') return 'gold';
  70 |   return 'cyan';
  71 | };
  72 | 
  73 | const getMessageStatus = (message) => clean(message?.status || 'open');
  74 | 
  75 | const isOpenMessage = (message) => {
  76 |   const status = getMessageStatus(message);
  77 |   return status !== 'done' && status !== 'replied';
  78 | };
  79 | 
  80 | const getInitial = (message) => String(message?.clientName || message?.clientEmail || 'C').charAt(0).toUpperCase();
  81 | 
  82 | const getDisplayName = (message) => message?.clientName || message?.clientEmail || 'Client';
  83 | 
  84 | const getMessagePreview = (message) => {
  85 |   const text = String(message?.message || 'Tidak ada isi pesan.').replace(/\s+/g, ' ').trim();
  86 |   return text.length > 120 ? text.slice(0, 120) + '…' : text;
  87 | };
  88 | 
  89 | const folderOptions = [
  90 |   { key: 'open', label: 'Inbox', description: 'Belum selesai', icon: Inbox },
  91 |   { key: 'replied', label: 'Dibalas', description: 'Sudah difollow up', icon: Reply },
  92 |   { key: 'done', label: 'Selesai', description: 'Closed thread', icon: CheckCircle2 },
  93 |   { key: 'all', label: 'Semua Pesan', description: 'Arsip operasional', icon: Mail },
  94 | ];
  95 | 
  96 | const ClientMessagesPage = () => {
  97 |   const { messages, isLoaded, error, updateMessageStatus } = useClientMessageStore();
  98 |   const [activeFilter, setActiveFilter] = useState('open');
  99 |   const [searchTerm, setSearchTerm] = useState('');
 100 |   const [selectedMessageId, setSelectedMessageId] = useState(null);
 101 |   const [replyDrafts, setReplyDrafts] = useState({});
 102 | 
 103 |   const addNotification = useNotificationStore((state) => state.addNotification);
 104 | 
 105 |   const sortedMessages = useMemo(() => {
 106 |     return [...(messages || [])].sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));
 107 |   }, [messages]);
 108 | 
 109 |   const mailboxCounts = useMemo(() => {
 110 |     const open = sortedMessages.filter(isOpenMessage).length;
 111 |     const replied = sortedMessages.filter((message) => getMessageStatus(message) === 'replied').length;
```

## Store sendAdminReply Context

File: `src/store/useClientMessageStore.js`
Needle: `sendAdminReply: async`
Status: **FOUND line 126**

```jsx
 114 | 
 115 |       await setDoc(doc(messagesRef, id), payload);
 116 | 
 117 |       useNotificationStore.getState().addNotification({
 118 |         type: 'customer',
 119 |         title: 'Pesan terkirim',
 120 |         message: 'Pesan kamu sudah masuk ke admin studio.',
 121 |       });
 122 | 
 123 |       return payload;
 124 |     },
 125 | 
 126 |     sendAdminReply: async (id, reply = {}) => {
 127 |       const user = auth.currentUser;
 128 | 
 129 |       if (!user || user.isAnonymous) {
 130 |         throw new Error('Login admin diperlukan untuk membalas pesan.');
 131 |       }
 132 | 
 133 |       const text = String(reply?.message || '').trim();
 134 | 
 135 |       if (text.length < 2) {
 136 |         throw new Error('Balasan tidak boleh kosong.');
 137 |       }
 138 | 
 139 |       const now = new Date().toISOString();
 140 |       const replyPayload = {
 141 |         id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
 142 |         senderRole: 'admin',
 143 |         senderUid: user.uid,
 144 |         senderName: String(reply?.senderName || user.displayName || user.email || 'Admin 37 Music Studio').trim(),
 145 |         message: text,
 146 |         createdAt: now,
 147 |         isReadByClient: false,
 148 |       };
 149 | 
 150 |       const firestorePayload = {
 151 |         status: 'replied',
 152 |         replies: arrayUnion(replyPayload),
 153 |         latestAdminReply: text,
 154 |         latestAdminReplyAt: now,
 155 |         lastMessagePreview: text,
 156 |         lastMessageAt: now,
 157 |         isReadByAdmin: true,
 158 |         isReadByClient: false,
 159 |         updatedAt: now,
 160 |       };
 161 | 
 162 |       const localPayload = {
 163 |         status: 'replied',
 164 |         replies: replyPayload,
 165 |         latestAdminReply: text,
 166 |         latestAdminReplyAt: now,
 167 |         lastMessagePreview: text,
 168 |         lastMessageAt: now,
 169 |         isReadByAdmin: true,
 170 |         isReadByClient: false,
 171 |         updatedAt: now,
 172 |       };
 173 | 
 174 |       set((state) => ({
 175 |         messages: sortMessages(state.messages.map((message) => (
 176 |           message.id === id
 177 |             ? {
 178 |                 ...message,
 179 |                 ...localPayload,
 180 |                 replies: [...(message.replies || []), replyPayload],
 181 |               }
 182 |             : message
 183 |         ))),
 184 |       }));
 185 | 
 186 |       await updateDoc(doc(messagesRef, id.toString()), firestorePayload);
 187 | 
 188 |       useNotificationStore.getState().addNotification({
 189 |         type: 'success',
 190 |         title: 'Balasan terkirim',
 191 |         message: 'Balasan admin sudah masuk ke inbox customer.',
 192 |       });
 193 | 
 194 |       return replyPayload;
 195 |     },
 196 | 
```


## Next Step

Kirim isi dokumen ini atau bagian summary-nya ke chat.

Kalau dokumen menunjukkan struktur detail action berbeda, next response harus berupa Phase 3 Hotfix Script, bukan script raksasa.
