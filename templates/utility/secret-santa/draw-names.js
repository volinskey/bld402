/**
 * Secret Santa — Draw Names function
 *
 * Generates a valid circular shuffle: A→B→C→D→A (no self-assignments).
 * Bypasses RLS via `adminDb()` from `@run402/functions` to write
 * assigned_to for all members.
 *
 * Input (POST body):  { group_id }
 * Output:             { success: true, pairs_count: N }
 *
 * Deploy via unified deploy spec (SDK 2.0+):
 *   const p = await r.project(PROJECT_ID);
 *   await p.apply({
 *     functions: { replace: { "draw-names": { source: fs.readFileSync("draw-names.js", "utf-8") } } }
 *   });
 *
 * Or the standalone path: `r.functions.deploy(PROJECT_ID, { name: "draw-names", code })`
 * (scoped form: `p.functions.deploy({ name, code })`).
 *
 * Runtime contract: Node 22 Fetch handler — `export default async (req: Request) => Response`.
 * The old AWS-Lambda `module.exports.handler = async (event) => { statusCode, body }`
 * shape is rejected at deploy time.
 */

import { adminDb } from "@run402/functions";

export default async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let group_id;
  try {
    ({ group_id } = await req.json());
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!group_id) {
    return Response.json({ error: "group_id is required" }, { status: 400 });
  }

  const db = adminDb();  // bypass RLS

  try {
    // 1. Verify group exists and is open
    const groups = await db.from("groups").select("id,status").eq("id", group_id);
    if (!groups.length) {
      return Response.json({ error: "Group not found" }, { status: 404 });
    }
    if (groups[0].status === "drawn") {
      return Response.json({ error: "Names already drawn" }, { status: 400 });
    }

    // 2. Fetch all members
    const members = await db
      .from("members")
      .select("id,display_name")
      .eq("group_id", group_id)
      .order("id");

    if (members.length < 3) {
      return Response.json(
        { error: "Need at least 3 members to draw names" },
        { status: 400 },
      );
    }

    // 3. Circular shuffle (Fisher-Yates then assign giver -> next)
    const ids = members.map((m) => m.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }

    // Each person gives to the next in shuffled order; last wraps to first
    const assignments = {};
    for (let i = 0; i < ids.length; i++) {
      assignments[ids[i]] = ids[(i + 1) % ids.length];
    }

    // 4. Write assignments
    for (const [giverId, receiverId] of Object.entries(assignments)) {
      await db.from("members").update({ assigned_to: receiverId }).eq("id", giverId);
    }

    // 5. Update group status
    await db.from("groups").update({ status: "drawn" }).eq("id", group_id);

    return Response.json({ success: true, pairs_count: members.length });
  } catch (err) {
    return Response.json({ error: err.message || "Internal error" }, { status: 500 });
  }
};
