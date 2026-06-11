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
  const oldLine = "  const { messages, isLoaded, error, updateMessageStatus } = useClientMessageStore();";
  const newLine = "  const { messages, isLoaded, error, updateMessageStatus, sendAdminReply } = useClientMessageStore();";

  if (content.includes(newLine)) {
    console.log("[skip] sendAdminReply already added to store destructure");
    return content;
  }

  verifyContains(content, oldLine, "store destructure without sendAdminReply");
  return content.replace(oldLine, newLine);
}

function insertSendCustomerReplyHandler(content) {
  if (content.includes("const sendCustomerReply = async")) {
    console.log("[skip] sendCustomerReply handler already exists");
    return content;
  }

  const anchor = "  const markReplied = async (message) => {";
  verifyContains(content, anchor, "markReplied handler anchor");

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

function patchComposerCopy(content) {
  let next = content;

  next = next.replace(
    'aria-label="Catatan follow up admin"',
    'aria-label="Balasan customer dan catatan follow up admin"'
  );

  next = next.replace(
    "Catatan follow up</label>",
    "Balasan / Catatan follow up</label>"
  );

  next = next.replace(
    'placeholder="Tulis catatan internal. Contoh: Sudah dibalas via WA, client minta Sabtu malam."',
    'placeholder="Tulis balasan untuk customer. Contoh: Halo kak, slot Sabtu jam 19.00 masih tersedia."'
  );

  return next;
}

function patchActionButtons(content) {
  if (
    content.includes("onClick={() => sendCustomerReply(selectedMessage)}") &&
    content.includes("Simpan Catatan Internal")
  ) {
    console.log("[skip] customer reply button already wired");
    return content;
  }

  const oldButton = `                  <button type="button" className="inbox-action primary" onClick={() => saveReplyNote(selectedMessage)}>
                    <Send size={15} />
                    Simpan Catatan
                  </button>`;

  const newButtons = `                  <button type="button" className="inbox-action primary" onClick={() => sendCustomerReply(selectedMessage)}>
                    <Send size={15} />
                    Kirim Balasan
                  </button>
                  <button type="button" className="inbox-action" onClick={() => saveReplyNote(selectedMessage)}>
                    <Reply size={15} />
                    Simpan Catatan Internal
                  </button>`;

  verifyContains(content, oldButton, "actual Simpan Catatan button block");
  return content.replace(oldButton, newButtons);
}

function verifyPhase3HotfixResult(content) {
  verifyContains(content, "updateMessageStatus, sendAdminReply", "sendAdminReply destructured from store");
  verifyContains(content, "const sendCustomerReply = async", "sendCustomerReply handler");
  verifyContains(content, "await sendAdminReply(message.id", "sendAdminReply invocation");
  verifyContains(content, "onClick={() => sendCustomerReply(selectedMessage)}", "selected message reply button");
  verifyContains(content, "Kirim Balasan", "customer-facing reply label");
  verifyContains(content, "Simpan Catatan Internal", "internal note label");
  verifyContains(content, "saveReplyNote", "existing saveReplyNote preserved");
  verifyContains(content, "Balas WhatsApp", "WhatsApp action preserved");
  verifyContains(content, "Tandai Dibalas", "mark replied action preserved");
  verifyContains(content, "Selesai", "done action preserved");
}

function main() {
  console.log("== Phase 3 Hotfix Admin Reply Anchor ==");
  console.log("Mode: admin inbox only patch");

  const adminFile = "src/pages/ClientMessagesPage.jsx";
  const storeFile = "src/store/useClientMessageStore.js";

  const store = readUtf8(storeFile);
  verifyContains(store, "sendAdminReply: async", "Phase 2 store action sendAdminReply");
  verifyContains(store, "replies: arrayUnion", "Phase 2 Firestore replies arrayUnion");

  let content = readUtf8(adminFile);

  verifyContains(content, "ClientMessagesPage", "admin inbox page");
  verifyContains(content, "useClientMessageStore", "admin inbox store usage");
  verifyContains(content, "replyDrafts", "reply drafts state");
  verifyContains(content, "const saveReplyNote = async", "existing saveReplyNote handler");
  verifyContains(content, "const markReplied = async", "existing markReplied handler");
  verifyContains(content, "const markDone = async", "existing markDone handler");
  verifyContains(content, "Balas WhatsApp", "existing WhatsApp action");
  verifyContains(content, "Tandai Dibalas", "existing mark replied action");
  verifyContains(content, "Simpan Catatan", "actual old note button");

  content = patchStoreDestructure(content);
  content = insertSendCustomerReplyHandler(content);
  content = patchComposerCopy(content);
  content = patchActionButtons(content);

  verifyPhase3HotfixResult(content);

  writeIfChanged(adminFile, content);

  console.log("✅ Phase 3 hotfix complete.");
  console.log("📄 Patched:", adminFile);
  console.log("➡️ Next: run lint/test/build, then cek admin inbox.");
}

try {
  main();
} catch (error) {
  console.error("❌ Phase 3 hotfix failed.");
  console.error(error.message);
  process.exit(1);
}