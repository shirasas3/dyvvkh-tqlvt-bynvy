// Data layer. Picked at build time:
//  - VITE_SUPABASE_URL + VITE_SUPABASE_KEY set -> shared board in Supabase (free hosted Postgres, no own server)
//  - otherwise                                -> this browser only (localStorage)
// Email alerts (optional) go through EmailJS when VITE_EMAILJS_* are set.
const env = import.meta.env;
const SB_URL = (env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const SB_KEY = env.VITE_SUPABASE_KEY || "";
export const isShared = Boolean(SB_URL && SB_KEY);

const TABLE = "construction_issues";
const LOCAL_KEY = "construction-issues-v1";

const fromRow = (r) => ({ id: r.id, issueType: r.issue_type, location: r.location, reporterName: r.reporter_name, status: r.status });

async function sb(query, options = {}) {
  const headers = { apikey: SB_KEY, "Content-Type": "application/json", Prefer: "return=representation" };
  if (SB_KEY.startsWith("eyJ")) headers.Authorization = `Bearer ${SB_KEY}`; // legacy anon keys are JWTs
  const res = await fetch(`${SB_URL}/rest/v1/${TABLE}${query}`, { ...options, headers });
  if (!res.ok) throw new Error("לא ניתן להשלים את הבקשה כרגע. כדאי לנסות שוב בעוד רגע.");
  return res.json();
}

const EMAIL_LABELS = { created: "נוספה תקלה חדשה", status_changed: "סטטוס תקלה עודכן", deleted: "תקלה נמחקה" };

// Returns true when sent, or when email alerts are not configured (nothing to warn about)
async function notify(action, issue) {
  const { VITE_EMAILJS_SERVICE_ID: service, VITE_EMAILJS_TEMPLATE_ID: template, VITE_EMAILJS_PUBLIC_KEY: key } = env;
  if (!service || !template || !key) return true;
  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: service,
        template_id: template,
        user_id: key,
        template_params: {
          action: EMAIL_LABELS[action],
          issue_type: issue.issueType,
          location: issue.location,
          reporter_name: issue.reporterName || "לא צוין",
          status: issue.status === "open" ? "לא טופל" : "טופל",
        },
      }),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

const readLocal = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY)) || [];
  } catch (e) {
    return [];
  }
};
const writeLocal = (list) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
  } catch (e) {}
};

export const listIssues = async () => {
  if (isShared) return (await sb("?select=*&order=id.desc")).map(fromRow);
  return [...readLocal()].sort((a, b) => b.id - a.id);
};

export const createIssue = async ({ issueType, location, reporterName }) => {
  let issue;
  if (isShared) {
    const [row] = await sb("", { method: "POST", body: JSON.stringify({ issue_type: issueType, location, reporter_name: reporterName }) });
    issue = fromRow(row);
  } else {
    issue = { id: Date.now(), issueType, location, reporterName, status: "open" };
    writeLocal([...readLocal(), issue]);
  }
  return { issue, notificationSent: await notify("created", issue) };
};

export const updateIssue = async ({ id, status }) => {
  let issue;
  if (isShared) {
    const [row] = await sb(`?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    if (!row) throw new Error("התקלה לא נמצאה.");
    issue = fromRow(row);
  } else {
    const list = readLocal().map((i) => (i.id === id ? { ...i, status } : i));
    writeLocal(list);
    issue = list.find((i) => i.id === id);
  }
  return { issue, notificationSent: await notify("status_changed", issue) };
};

export const deleteIssue = async ({ id }) => {
  let issue;
  if (isShared) {
    const [row] = await sb(`?id=eq.${id}`, { method: "DELETE" });
    if (!row) throw new Error("התקלה לא נמצאה.");
    issue = fromRow(row);
  } else {
    issue = readLocal().find((i) => i.id === id);
    writeLocal(readLocal().filter((i) => i.id !== id));
  }
  return { notificationSent: await notify("deleted", issue) };
};
