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

function patchStoreDestructure(content) {
  if (content.includes("sendAdminReply")) {
    console.log("[skip] sendAdminReply already referenced in admin inbox");
    return content;
  }

  const exactAnchor = "  const { messages, isLoaded, error, updateMessageStatus } = useClientMessageStore();";

  if (content.includes(exactAnchor)) {
    return content.replace(
      exactAnchor,
      "  const { messages, isLoaded, error, updateMessageStatus, sendAdminReply } = useClientMessageStore();"
    );
  }

  const multilineAnchor = `  const {
    messages,
    isLoaded,
    error,
    updateMessageStatus,
  } = useClientMessageStore();`;

  if (content.includes(multilineAnchor)) {
    return content.replace(
      multilineAnchor,
      `  const {
    messages,
    isLoaded,
    error,
    updateMessageStatus,
    sendAdminReply,
  } = useClientMessageStore();`
    );
  }

  throw new Error(
    "useClientMessageStore destructure anchor not found. Run: Select-String -Path src\\pages\\ClientMessagesPage.jsx -Pattern \"useClientMessageStore\" -Context 5,20"
  );
}

function insertSendCustomerReplyHandler(content) {
  if (content.includes("const sendCustomerReply = async")) {
    console.log("[skip] sendCustomerReply handler already exists");
    return content;
  }

  const anchor = `  const markReplied = async (message) => {`;

  verifyContains(content, anchor, "insert sendCustomerReply before markReplied");

  const block = `  const sendCustomerReply = async (message) => {
    const note = String(replyDrafts[message.id] || '').trim();

    if (!note) {
      addNotification({
        type: 'warning',
        title: 'Balasan kosong',
        message: 'Tulis balasan untuk customer dulu.',
      });
      return;
    }

    try {
      await sendAdminReply(message.id, {
        message: note,
        senderName: 'Admin 37 Music Studio',
      });

      setReplyDrafts((current) => ({ ...current, [message.id]: '' }));
    } catch (replyError) {
      addNotification({
        type: 'error',
        title: 'Balasan gagal dikirim',
        message: replyError.message || 'Coba lagi beberapa saat lagi.',
      });
    }
  };

`;

  return content.replace(anchor, block + anchor);
}

function patchDesktopDetailActions(content) {
  if (content.includes("onClick={() => sendCustomerReply(selectedMessage)}")) {
    console.log("[skip] selectedMessage customer reply button already exists");
    return content;
  }

  const anchor = `                <div className="inbox-detail-actions">
                  <button type="button" className="inbox-action primary" onClick={() => saveReplyNote(selectedMessage)}>
                    <Send size={15} />
                    Simpan Catatan
                  </button>`;

  verifyContains(content, anchor, "selectedMessage detail actions primary button");

  const replacement = `                <div className="inbox-detail-actions">
                  <button type="button" className="inbox-action primary" onClick={() => sendCustomerReply(selectedMessage)}>
                    <Send size={15} />
                    Kirim Balasan
                  </button>
                  <button type="button" className="inbox-action" onClick={() => saveReplyNote(selectedMessage)}>
                    <Reply size={15} />
                    Simpan Catatan Internal
                  </button>`;

  return content.replace(anchor, replacement);
}

function patchLegacyCardActions(content) {
  if (content.includes("onClick={() => sendCustomerReply(message)}")) {
    console.log("[skip] message card customer reply button already exists");
    return content;
  }

  const anchor = `                        <button type="button" onClick={() => saveReplyNote(message)}>
                          <Send size={15} />
                          Simpan Catatan
                        </button>`;

  if (!content.includes(anchor)) {
    console.log("[skip] legacy message card compose button anchor not found. This is okay if admin inbox already uses the 3-pane layout only.");
    return content;
  }

  const replacement = `                        <button type="button" onClick={() => sendCustomerReply(message)}>
                          <Send size={15} />
                          Kirim Balasan
                        </button>
                        <button type="button" className="message-action-btn" onClick={() => saveReplyNote(message)}>
                          <Reply size={15} />
                          Catatan Internal
                        </button>`;

  return content.replace(anchor, replacement);
}

function patchComposerPlaceholder(content) {
  const oldText = "Tulis catatan internal. Contoh: Sudah dibalas via WA, client minta Sabtu malam.";
  const newText = "Tulis balasan untuk customer. Contoh: Halo kak, slot Sabtu jam 19.00 masih tersedia.";

  if (!content.includes(oldText)) {
    console.log("[skip] composer placeholder anchor not found or already updated");
    return content;
  }

  return content.replaceAll(oldText, newText);
}

function verifyPhase3Result(content) {
  verifyContains(content, "sendAdminReply", "sendAdminReply imported from store");
  verifyContains(content, "const sendCustomerReply = async", "sendCustomerReply handler");
  verifyContains(content, "await sendAdminReply(message.id", "sendAdminReply invocation");
  verifyContains(content, "Kirim Balasan", "customer-facing reply button label");
  verifyContains(content, "Simpan Catatan Internal", "internal note button preserved");
  verifyContains(content, "saveReplyNote", "existing internal note handler preserved");
  verifyContains(content, "Balas WhatsApp", "WhatsApp action preserved");
  verifyContains(content, "Tandai Dibalas", "mark replied action preserved");
  verifyContains(content, "Selesai", "done action preserved");
}

function main() {
  console.log("== Phase 3 Admin Inbox Wire Reply Button ==");
  console.log("Mode: admin UI only patch");

  const file = "src/pages/ClientMessagesPage.jsx";
  let content = readUtf8(file);

  verifyContains(content, "ClientMessagesPage", "admin inbox page component");
  verifyContains(content, "useClientMessageStore", "client message store usage");
  verifyContains(content, "replyDrafts", "reply drafts state");
  verifyContains(content, "saveReplyNote", "existing internal note handler");
  verifyContains(content, "updateMessageStatus", "existing status updater");
  verifyContains(content, "Balas WhatsApp", "existing WhatsApp action");

  content = patchStoreDestructure(content);
  content = insertSendCustomerReplyHandler(content);
  content = patchDesktopDetailActions(content);
  content = patchLegacyCardActions(content);
  content = patchComposerPlaceholder(content);

  verifyPhase3Result(content);
  writeIfChanged(file, content);

  console.log("✅ Phase 3 complete: admin inbox now has customer-facing reply action.");
  console.log("📄 Patched:", file);
  console.log("➡️ Next: run lint/test/build, then send terminal output.");
}

try {
  main();
} catch (error) {
  console.error("❌ Phase 3 failed.");
  console.error(error.message);
  process.exit(1);
}