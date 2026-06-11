const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

function abs(file) {
  return path.join(ROOT, file);
}

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function verifyFileExists(file) {
  if (!fs.existsSync(abs(file))) {
    throw new Error(`Required file not found: ${file}`);
  }
}

function readUtf8(file) {
  verifyFileExists(file);
  return fs.readFileSync(abs(file), "utf8");
}

function backupFile(file) {
  const target = abs(file);
  if (!fs.existsSync(target)) return;

  const backup = `${target}.bak-${nowStamp()}`;
  fs.copyFileSync(target, backup);
}

function writeIfChanged(file, content) {
  const target = abs(file);
  const previous = fs.existsSync(target)
    ? fs.readFileSync(target, "utf8")
    : null;

  if (previous === content) {
    console.log(`[unchanged] ${file}`);
    return false;
  }

  backupFile(file);
  fs.writeFileSync(target, content, "utf8");
  console.log(`[written] ${file}`);
  return true;
}

function verifyContains(content, needle, label) {
  if (!content.includes(needle)) {
    throw new Error(`Anchor not found: ${label} -> ${needle}`);
  }
}

function stripMarkedBlock(content, startMarker, endMarker) {
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);

  if (start === -1 && end === -1) return content;

  if (start === -1 || end === -1 || end < start) {
    throw new Error(`Broken marker block: ${startMarker}`);
  }

  const afterEnd = end + endMarker.length;
  return `${content.slice(0, start).trimEnd()}\n\n${content.slice(afterEnd).trimStart()}`;
}

function insertReplyHelpers(content) {
  if (
    content.includes("const getAdminReplies = (message)") &&
    content.includes("const getAdminReplySearchText = (message)") &&
    content.includes("const getReplyKey = (reply")
  ) {
    console.log("[skip] admin reply helpers already exist");
    return content;
  }

  const anchor = `const getMessagePreview = (message) => {
  const text = String(message?.message || 'Tidak ada isi pesan.').replace(/\\s+/g, ' ').trim();
  return text.length > 120 ? text.slice(0, 120) + '…' : text;
};

`;

  verifyContains(content, anchor, "getMessagePreview helper block");

  const helpers = `const getAdminReplies = (message) => {
  const replies = Array.isArray(message?.replies) ? message.replies : [];

  return replies
    .filter((reply) => String(reply?.message || '').trim())
    .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
};

const getAdminReplySearchText = (message) => {
  return getAdminReplies(message)
    .map((reply) => [
      reply.senderName,
      reply.message,
      reply.createdAt,
    ].filter(Boolean).join(' '))
    .join(' ');
};

const getReplyKey = (reply, messageId, index) => {
  return reply?.id || [messageId, reply?.createdAt, reply?.message, index].filter(Boolean).join('-');
};

`;

  return content.replace(anchor, anchor + helpers);
}

function patchSearchHaystack(content) {
  if (content.includes("getAdminReplySearchText(message)")) {
    console.log("[skip] admin reply search text already included");
    return content;
  }

  const anchor = `        message.adminReplyNote,
        message.source,`;

  verifyContains(content, anchor, "admin search haystack legacy note/source");

  return content.replace(
    anchor,
    `        message.adminReplyNote,
        message.latestAdminReply,
        getAdminReplySearchText(message),
        message.source,`
  );
}

function patchSelectedRepliesMemo(content) {
  if (content.includes("const selectedAdminReplies = selectedMessage ? getAdminReplies(selectedMessage) : [];")) {
    console.log("[skip] selectedAdminReplies already exists");
    return content;
  }

  const anchor = `  const selectedWaHref = selectedMessage ? getWhatsAppHref(selectedMessage) : '';

`;

  verifyContains(content, anchor, "selectedWaHref anchor");

  const replacement = `  const selectedWaHref = selectedMessage ? getWhatsAppHref(selectedMessage) : '';
  const selectedAdminReplies = selectedMessage ? getAdminReplies(selectedMessage) : [];

`;

  return content.replace(anchor, replacement);
}

function patchDetailReplyHistory(content) {
  if (content.includes("inbox-admin-reply-history")) {
    console.log("[skip] admin reply history already rendered");
    return content;
  }

  const anchor = `              {selectedMessage.adminReplyNote && (
                <section className="inbox-reply-note">
                  <Reply size={16} />
                  <div>
                    <strong>Catatan admin</strong>
                    <p>{selectedMessage.adminReplyNote}</p>
                  </div>
                </section>
              )}

`;

  verifyContains(content, anchor, "legacy adminReplyNote detail block");

  const historyBlock = `              {selectedMessage.adminReplyNote && (
                <section className="inbox-reply-note">
                  <Reply size={16} />
                  <div>
                    <strong>Catatan admin</strong>
                    <p>{selectedMessage.adminReplyNote}</p>
                  </div>
                </section>
              )}

              {selectedAdminReplies.length > 0 && (
                <section className="inbox-admin-reply-history" aria-label="Riwayat balasan admin ke customer">
                  <div className="inbox-admin-reply-history-head">
                    <span>Balasan terkirim ke customer</span>
                    <strong>{selectedAdminReplies.length} balasan</strong>
                  </div>

                  {selectedAdminReplies.map((reply, index) => (
                    <div className="inbox-reply-note inbox-customer-reply-note" key={getReplyKey(reply, selectedMessage.id, index)}>
                      <Send size={16} />
                      <div>
                        <strong>{reply.senderName || 'Admin 37 Music Studio'}</strong>
                        <p>{reply.message}</p>
                        {reply.createdAt && <small>{formatDateTime(reply.createdAt)}</small>}
                      </div>
                    </div>
                  ))}
                </section>
              )}

`;

  return content.replace(anchor, historyBlock);
}

function verifyPhase5Result(content) {
  verifyContains(content, "const getAdminReplies = (message)", "getAdminReplies helper");
  verifyContains(content, "const getAdminReplySearchText = (message)", "getAdminReplySearchText helper");
  verifyContains(content, "const getReplyKey = (reply", "getReplyKey helper");
  verifyContains(content, "getAdminReplySearchText(message)", "reply search haystack");
  verifyContains(content, "const selectedAdminReplies = selectedMessage ? getAdminReplies(selectedMessage) : [];", "selectedAdminReplies derived data");
  verifyContains(content, "inbox-admin-reply-history", "reply history wrapper");
  verifyContains(content, "Balasan terkirim ke customer", "reply history heading");
  verifyContains(content, "inbox-customer-reply-note", "customer reply note item");
  verifyContains(content, "selectedAdminReplies.map", "reply history map");
  verifyContains(content, "sendCustomerReply", "send customer reply preserved");
  verifyContains(content, "Simpan Catatan Internal", "internal note button preserved");
  verifyContains(content, "Balas WhatsApp", "whatsapp action preserved");
  verifyContains(content, "Tandai Dibalas", "mark replied action preserved");
  verifyContains(content, "Selesai", "done action preserved");
}

function main() {
  console.log("== Phase 5 Admin Reply History Visibility ==");
  console.log("Mode: admin inbox JSX-only patch");

  const file = "src/pages/ClientMessagesPage.jsx";
  let content = readUtf8(file);

  verifyContains(content, "ClientMessagesPage", "admin inbox component");
  verifyContains(content, "sendAdminReply", "Phase 3.1 sendAdminReply wiring");
  verifyContains(content, "sendCustomerReply", "Phase 3.1 sendCustomerReply handler");
  verifyContains(content, "selectedMessage.adminReplyNote", "legacy admin reply note block");
  verifyContains(content, "inbox-reply-composer", "reply composer block");
  verifyContains(content, "Kirim Balasan", "customer-facing reply button");
  verifyContains(content, "Simpan Catatan Internal", "internal note button");
  verifyContains(content, "filteredMessages.map((message)", "admin inbox message list map");

  const before = content;

  content = insertReplyHelpers(content);
  content = patchSearchHaystack(content);
  content = patchSelectedRepliesMemo(content);
  content = patchDetailReplyHistory(content);

  verifyPhase5Result(content);

  writeIfChanged(file, content);

  if (before === content) {
    console.log("✅ Phase 5 already applied. No changes needed.");
  } else {
    console.log("✅ Phase 5 complete: admin reply history is visible in inbox detail.");
  }

  console.log("📄 Patched:", file);
}

try {
  main();
} catch (error) {
  console.error("❌ Phase 5 failed.");
  console.error(error.message);
  process.exit(1);
}