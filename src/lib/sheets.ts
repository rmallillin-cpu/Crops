import { google, sheets_v4 } from "googleapis";
import { AllowedUser, CropEntry, SubmissionSummary } from "@/types";
import { getLguBySlug, LGUS } from "@/lib/lgus";

const TAB_ALLOWED_USERS = process.env.SHEET_TAB_ALLOWED_USERS || "AllowedUsers";
const TAB_RESPONSES = process.env.SHEET_TAB_RESPONSES || "Responses";
const TAB_SUBMISSIONS = process.env.SHEET_TAB_SUBMISSIONS || "Submissions";

let cachedClient: sheets_v4.Sheets | null = null;

function getClient(): sheets_v4.Sheets {
  if (cachedClient) return cachedClient;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email || !rawKey) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY env vars."
    );
  }

  const privateKey = rawKey.includes("\\n") ? rawKey.replace(/\\n/g, "\n") : rawKey;

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  cachedClient = google.sheets({ version: "v4", auth });
  return cachedClient;
}

function sheetId(): string {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) throw new Error("Missing GOOGLE_SHEET_ID env var.");
  return id;
}

/**
 * Ensures the three data tabs exist with header rows. Safe to call repeatedly —
 * it only creates what's missing. Call this once (e.g. via /api/setup) after
 * creating a fresh spreadsheet, or let the app self-heal on first read.
 */
export async function ensureSheetStructure(): Promise<void> {
  const sheets = getClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId() });
  const existingTitles = new Set(
    (meta.data.sheets || []).map((s) => s.properties?.title).filter(Boolean)
  );

  const toCreate: string[] = [];
  for (const tab of [TAB_ALLOWED_USERS, TAB_RESPONSES, TAB_SUBMISSIONS]) {
    if (!existingTitles.has(tab)) toCreate.push(tab);
  }

  if (toCreate.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId(),
      requestBody: {
        requests: toCreate.map((title) => ({ addSheet: { properties: { title } } })),
      },
    });
  }

  const headerWrites: Promise<unknown>[] = [];

  headerWrites.push(
    sheets.spreadsheets.values.update({
      spreadsheetId: sheetId(),
      range: `${TAB_ALLOWED_USERS}!A1:F1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [["email", "name", "lguSlug", "role", "status", "passwordHash"]],
      },
    })
  );

  headerWrites.push(
    sheets.spreadsheets.values.update({
      spreadsheetId: sheetId(),
      range: `${TAB_RESPONSES}!A1:K1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [
          [
            "timestamp",
            "lguSlug",
            "lguName",
            "respondentEmail",
            "respondentName",
            "cropId",
            "cropName",
            "major",
            "priority",
            "emerging",
            "others",
            "discontinue",
            "remarks",
          ],
        ],
      },
    })
  );

  headerWrites.push(
    sheets.spreadsheets.values.update({
      spreadsheetId: sheetId(),
      range: `${TAB_SUBMISSIONS}!A1:H1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [
          [
            "lguSlug",
            "lguName",
            "respondentEmail",
            "respondentName",
            "submittedAt",
            "totalCropsMarked",
            "status",
            "notes",
          ],
        ],
      },
    })
  );

  await Promise.all(headerWrites);
}

export async function getAllowedUsers(): Promise<AllowedUser[]> {
  const sheets = getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: `${TAB_ALLOWED_USERS}!A2:F`,
  });
  const rows = res.data.values || [];
  return dedupeRows(rows)
    .filter((r) => r[0])
    .map((r) => ({
      email: String(r[0]).trim().toLowerCase(),
      name: String(r[1] || "").trim(),
      lguSlug: String(r[2] || "").trim(),
      role: (String(r[3] || "respondent").trim().toLowerCase() as AllowedUser["role"]) || "respondent",
      status: (String(r[4] || "active").trim().toLowerCase() as AllowedUser["status"]) || "active",
      passwordHash: String(r[5] || "").trim() || undefined,
    }));
}

export async function findAllowedUser(email: string): Promise<AllowedUser | null> {
  const normalized = email.trim().toLowerCase();
  const adminList = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const users = await getAllowedUsers();
  const fromSheet = users.find((u) => u.email === normalized) || null;

  // An ADMIN_EMAILS entry that starts with "@" matches the whole domain
  // (e.g. "@psa.gov.ph" grants admin to any user@psa.gov.ph address),
  // instead of requiring every individual address to be listed.
  const isAdmin = adminList.some((entry) =>
    entry.startsWith("@") ? normalized.endsWith(entry) : entry === normalized
  );

  if (isAdmin) {
    return {
      email: normalized,
      name: fromSheet?.name || "Admin",
      lguSlug: fromSheet?.lguSlug || "",
      role: "admin",
      status: "active",
      passwordHash: fromSheet?.passwordHash,
    };
  }

  return fromSheet;
}

/**
 * Self-service registration. If the email has no row yet, creates one with
 * status "pending" so an administrator must activate it. If the email is
 * already known (e.g. an admin pre-added it for Google sign-in), this just
 * attaches a password hash without touching its existing role/status.
 */
export async function registerUser(params: {
  email: string;
  name: string;
  lguSlug: string;
  passwordHash: string;
}): Promise<{ status: AllowedUser["status"] }> {
  const sheets = getClient();
  const normalized = params.email.trim().toLowerCase();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: `${TAB_ALLOWED_USERS}!A2:F`,
  });
  const rows = res.data.values || [];
  const existingIndex = rows.findIndex((r) => String(r[0]).trim().toLowerCase() === normalized);

  if (existingIndex === -1) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId(),
      range: `${TAB_ALLOWED_USERS}!A1`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [
          [normalized, params.name, params.lguSlug, "respondent", "pending", params.passwordHash],
        ],
      },
    });
    return { status: "pending" };
  }

  const existing = rows[existingIndex];
  const rowNumber = existingIndex + 2;
  const status = (String(existing[4] || "active").trim().toLowerCase() as AllowedUser["status"]) || "active";
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId(),
    range: `${TAB_ALLOWED_USERS}!A${rowNumber}:F${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [
        [
          normalized,
          existing[1] || params.name,
          existing[2] || params.lguSlug,
          existing[3] || "respondent",
          existing[4] || "active",
          params.passwordHash,
        ],
      ],
    },
  });
  return { status };
}

/**
 * Admin action: update an existing user's role and/or status.
 */
export async function updateAllowedUser(
  email: string,
  updates: { role?: AllowedUser["role"]; status?: AllowedUser["status"] }
): Promise<void> {
  const sheets = getClient();
  const normalized = email.trim().toLowerCase();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: `${TAB_ALLOWED_USERS}!A2:F`,
  });
  const rows = res.data.values || [];
  const existingIndex = rows.findIndex((r) => String(r[0]).trim().toLowerCase() === normalized);
  if (existingIndex === -1) throw new Error("No such user on the registry.");

  const existing = rows[existingIndex];
  const rowNumber = existingIndex + 2;
  const values = [
    existing[0],
    existing[1] || "",
    existing[2] || "",
    updates.role || existing[3] || "respondent",
    updates.status || existing[4] || "active",
    existing[5] || "",
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId(),
    range: `${TAB_ALLOWED_USERS}!A${rowNumber}:F${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: { values: [values] },
  });
}

/**
 * Appends one row per submitted crop entry (rows where at least one flag is
 * checked or remarks were left) and writes/updates one summary row in
 * Submissions for this LGU + respondent.
 */
export async function submitCropEntries(params: {
  lguSlug: string;
  respondentEmail: string;
  respondentName: string;
  entries: CropEntry[];
}): Promise<{ savedRows: number }> {
  const sheets = getClient();
  const lgu = getLguBySlug(params.lguSlug);
  if (!lgu) throw new Error(`Unknown LGU slug: ${params.lguSlug}`);

  const now = new Date().toISOString();
  const meaningful = params.entries.filter(
    (e) => e.major || e.priority || e.emerging || e.others || e.discontinue || e.remarks.trim()
  );

  if (meaningful.length > 0) {
    const values = meaningful.map((e) => [
      now,
      lgu.slug,
      lgu.name,
      params.respondentEmail,
      params.respondentName,
      e.cropId,
      e.cropName,
      e.major ? "TRUE" : "FALSE",
      e.priority ? "TRUE" : "FALSE",
      e.emerging ? "TRUE" : "FALSE",
      e.others ? "TRUE" : "FALSE",
      e.discontinue ? "TRUE" : "FALSE",
      e.remarks || "",
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId(),
      range: `${TAB_RESPONSES}!A1`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values },
    });
  }

  // Replace, don't pile up: drop this LGU's rows from earlier submissions.
  // (New rows are written first so a failure here leaves duplicates rather than losing data.)
  await deleteResponseRows((r) => r[1] === lgu.slug && r[0] !== now);

  await upsertSubmissionRow({
    lguSlug: lgu.slug,
    lguName: lgu.name,
    respondentEmail: params.respondentEmail,
    respondentName: params.respondentName,
    submittedAt: now,
    totalCropsMarked: meaningful.length,
    status: "Submitted",
  });

  return { savedRows: meaningful.length };
}

async function upsertSubmissionRow(row: {
  lguSlug: string;
  lguName: string;
  respondentEmail: string;
  respondentName: string;
  submittedAt: string;
  totalCropsMarked: number;
  status: string;
}): Promise<void> {
  const sheets = getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: `${TAB_SUBMISSIONS}!A2:H`,
  });
  const rows = res.data.values || [];
  const existingIndex = rows.findIndex((r) => r[0] === row.lguSlug);

  const values = [
    row.lguSlug,
    row.lguName,
    row.respondentEmail,
    row.respondentName,
    row.submittedAt,
    row.totalCropsMarked,
    row.status,
    "",
  ];

  if (existingIndex === -1) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId(),
      range: `${TAB_SUBMISSIONS}!A1`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [values] },
    });
  } else {
    const rowNumber = existingIndex + 2; // header offset
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId(),
      range: `${TAB_SUBMISSIONS}!A${rowNumber}:H${rowNumber}`,
      valueInputOption: "RAW",
      requestBody: { values: [values] },
    });
  }
}

export async function getSubmissionsSummary(): Promise<SubmissionSummary[]> {
  const sheets = getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: `${TAB_RESPONSES}!A2:M`,
  });
  const rows = res.data.values || [];

  const byLgu = new Map<string, SubmissionSummary>();
  for (const lgu of LGUS) {
    byLgu.set(lgu.slug, {
      lguSlug: lgu.slug,
      lguName: lgu.name,
      respondentEmail: "",
      respondentName: "",
      submittedAt: "",
      totalCrops: 0,
      major: 0,
      priority: 0,
      emerging: 0,
      others: 0,
      discontinue: 0,
    });
  }

  for (const r of dedupeRows(rows)) {
    const [timestamp, lguSlug, , respondentEmail, respondentName, , , major, priority, emerging, others, discontinue] = r;
    const entry = byLgu.get(String(lguSlug));
    if (!entry) continue;
    entry.totalCrops += 1;
    if (String(major).toUpperCase() === "TRUE") entry.major += 1;
    if (String(priority).toUpperCase() === "TRUE") entry.priority += 1;
    if (String(emerging).toUpperCase() === "TRUE") entry.emerging += 1;
    if (String(others).toUpperCase() === "TRUE") entry.others += 1;
    if (String(discontinue).toUpperCase() === "TRUE") entry.discontinue += 1;
    entry.respondentEmail = String(respondentEmail || entry.respondentEmail);
    entry.respondentName = String(respondentName || entry.respondentName);
    if (!entry.submittedAt || String(timestamp) > entry.submittedAt) {
      entry.submittedAt = String(timestamp || entry.submittedAt);
    }
  }

  return Array.from(byLgu.values());
}

/**
 * Every raw response row across all LGUs, for the admin's full CSV export.
 */
export async function getAllResponses() {
  const sheets = getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: `${TAB_RESPONSES}!A2:M`,
  });
  const rows = res.data.values || [];
  return rows
    .filter((r) => r[0])
    .map((r) => ({
      timestamp: r[0] || "",
      lguSlug: r[1] || "",
      lguName: r[2] || "",
      respondentEmail: r[3] || "",
      respondentName: r[4] || "",
      cropId: Number(r[5]),
      cropName: r[6] || "",
      major: String(r[7]).toUpperCase() === "TRUE",
      priority: String(r[8]).toUpperCase() === "TRUE",
      emerging: String(r[9]).toUpperCase() === "TRUE",
      others: String(r[10]).toUpperCase() === "TRUE",
      discontinue: String(r[11]).toUpperCase() === "TRUE",
      remarks: r[12] || "",
    }));
}

export async function getLguResponses(lguSlug: string) {
  const sheets = getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: `${TAB_RESPONSES}!A2:M`,
  });
  const rows = res.data.values || [];
  return dedupeRows(rows)
    .filter((r) => r[1] === lguSlug)
    .map((r) => ({
      timestamp: r[0],
      cropId: Number(r[5]),
      cropName: r[6],
      major: String(r[7]).toUpperCase() === "TRUE",
      priority: String(r[8]).toUpperCase() === "TRUE",
      emerging: String(r[9]).toUpperCase() === "TRUE",
      others: String(r[10]).toUpperCase() === "TRUE",
      discontinue: String(r[11]).toUpperCase() === "TRUE",
      remarks: r[12] || "",
    }));
}


/* ------------------------------------------------------------------ */
/* Admin: review / edit / delete responses                             */
/* ------------------------------------------------------------------ */

/** If a crop appears more than once for an LGU (older duplicate submissions), the latest row wins. */
function dedupeRows(rows: any[][]): any[][] {
  const latest = new Map<string, any[]>();
  for (const r of rows) latest.set(`${r[1]}:${r[5]}`, r);
  return Array.from(latest.values());
}

async function getTabGid(title: string): Promise<number> {
  const sheets = getClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId() });
  const tab = (meta.data.sheets || []).find((t) => t.properties?.title === title);
  if (tab?.properties?.sheetId == null) throw new Error(`Tab not found: ${title}`);
  return tab.properties.sheetId;
}

/** Deletes every Responses row (below the header) that matches the predicate. Returns how many. */
async function deleteResponseRows(match: (row: any[]) => boolean): Promise<number> {
  const sheets = getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: `${TAB_RESPONSES}!A2:M`,
  });
  const rows = res.data.values || [];
  const idxs: number[] = [];
  rows.forEach((r, i) => {
    if (match(r)) idxs.push(i);
  });
  if (idxs.length === 0) return 0;

  const gid = await getTabGid(TAB_RESPONSES);
  // Delete bottom-up so earlier row numbers don't shift.
  const requests = idxs
    .sort((a, b) => b - a)
    .map((i) => ({
      deleteDimension: {
        range: { sheetId: gid, dimension: "ROWS", startIndex: i + 1, endIndex: i + 2 },
      },
    }));
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetId(),
    requestBody: { requests },
  });
  return idxs.length;
}

/** Keeps the Submissions tab in step after an admin edit/delete. */
async function syncSubmissionRow(lguSlug: string, note: string): Promise<void> {
  const sheets = getClient();
  const [respRes, subRes] = await Promise.all([
    sheets.spreadsheets.values.get({ spreadsheetId: sheetId(), range: `${TAB_RESPONSES}!A2:M` }),
    sheets.spreadsheets.values.get({ spreadsheetId: sheetId(), range: `${TAB_SUBMISSIONS}!A2:H` }),
  ]);
  const remaining = dedupeRows(respRes.data.values || []).filter((r) => r[1] === lguSlug).length;
  const subRows = subRes.data.values || [];
  const idx = subRows.findIndex((r) => r[0] === lguSlug);
  if (idx === -1) return;

  if (remaining === 0) {
    const gid = await getTabGid(TAB_SUBMISSIONS);
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId(),
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: { sheetId: gid, dimension: "ROWS", startIndex: idx + 1, endIndex: idx + 2 },
            },
          },
        ],
      },
    });
    return;
  }

  const rowNumber = idx + 2;
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId(),
    range: `${TAB_SUBMISSIONS}!F${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: { values: [[remaining]] },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId(),
    range: `${TAB_SUBMISSIONS}!H${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: { values: [[note]] },
  });
}

/**
 * Admin edit of one crop's category/remarks for an LGU. One category at most.
 * If the edit leaves no category and no remarks, the row is removed instead.
 */
export async function adminUpdateLguResponse(params: {
  lguSlug: string;
  cropId: number;
  flags: { major: boolean; priority: boolean; emerging: boolean; others: boolean; discontinue: boolean };
  remarks: string;
  adminEmail: string;
}): Promise<{ deleted: boolean }> {
  const sheets = getClient();
  const { lguSlug, cropId, flags, remarks, adminEmail } = params;
  const note = `Edited by ${adminEmail} on ${new Date().toISOString()}`;

  const empty =
    !flags.major && !flags.priority && !flags.emerging && !flags.others && !flags.discontinue && !remarks.trim();
  if (empty) {
    await deleteResponseRows((r) => r[1] === lguSlug && Number(r[5]) === cropId);
    await syncSubmissionRow(lguSlug, note);
    return { deleted: true };
  }

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: `${TAB_RESPONSES}!A2:M`,
  });
  const rows = res.data.values || [];
  const targets: number[] = [];
  rows.forEach((r, i) => {
    if (r[1] === lguSlug && Number(r[5]) === cropId) targets.push(i);
  });
  if (targets.length === 0) throw new Error("That crop has no response to edit.");

  const values = [
    flags.major ? "TRUE" : "FALSE",
    flags.priority ? "TRUE" : "FALSE",
    flags.emerging ? "TRUE" : "FALSE",
    flags.others ? "TRUE" : "FALSE",
    flags.discontinue ? "TRUE" : "FALSE",
    remarks.trim(),
  ];
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: sheetId(),
    requestBody: {
      valueInputOption: "RAW",
      data: targets.map((i) => ({
        range: `${TAB_RESPONSES}!H${i + 2}:M${i + 2}`,
        values: [values],
      })),
    },
  });
  await syncSubmissionRow(lguSlug, note);
  return { deleted: false };
}

/** Admin delete: one crop's response, or (no cropId) the LGU's whole submission. */
export async function adminDeleteLguResponses(params: {
  lguSlug: string;
  cropId?: number;
  adminEmail: string;
}): Promise<{ removed: number }> {
  const { lguSlug, cropId, adminEmail } = params;
  const removed = await deleteResponseRows(
    (r) => r[1] === lguSlug && (cropId === undefined || Number(r[5]) === cropId)
  );
  await syncSubmissionRow(lguSlug, `Edited by ${adminEmail} on ${new Date().toISOString()}`);
  return { removed };
}
