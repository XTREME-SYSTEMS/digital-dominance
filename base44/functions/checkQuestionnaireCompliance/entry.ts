// Questionnaire enforcement — runs on a schedule to enforce the 24-hour
// questionnaire completion requirement.
//
// Rules (per the user agreement):
//   - At 20 hours since download: if questionnaire not completed and warning
//     not yet sent, send a warning email and mark warning_sent.
//   - At 24 hours since download: if questionnaire still not completed, shut
//     off access (clear plan).
//
// Called by the "Questionnaire Enforcement" scheduled workflow every hour.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { sendEmailViaIndependent } from "../../shared/independentCore.ts";

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole;
    const now = new Date();

    // List all users — the User entity is small enough to scan.
    const users = await db.entities.User.list();
    let warningsSent = 0;
    let shutOffs = 0;

    for (const user of users) {
      // Only enforce for users with an active plan and a download timestamp.
      if (!user.plan || !user.downloaded_at) continue;
      // Already completed — nothing to do.
      if (user.questionnaire_completed) continue;

      const downloadedAt = new Date(user.downloaded_at);
      const hoursSinceDownload = (now.getTime() - downloadedAt.getTime()) / (1000 * 60 * 60);

      // 20h: send warning if not already sent.
      if (hoursSinceDownload >= 20 && !user.questionnaire_warning_sent) {
        try {
          if (user.email) {
            await sendEmailViaIndependent(db, {
              to: user.email,
              subject: "Action Required: Complete Your Questionnaire Within 4 Hours",
              body: `Hi ${user.full_name || "there"},\n\nThis is your one and only warning. You agreed to complete a 10-question questionnaire within 24 hours of downloading the Xtreme AI app. You have less than 4 hours remaining.\n\nIf the questionnaire is not completed within 24 hours of your download, your app access will be turned off.\n\nOpen the app, tap the menu (☰), and select "Questionnaire" to complete it now.\n\n— Xtreme AI Systems`,
            });
          }
          await db.entities.User.update(user.id, { questionnaire_warning_sent: true });
          warningsSent++;
          console.log("checkQuestionnaireCompliance: warning sent", { userId: user.id, email: user.email });
        } catch (err) {
          console.error("checkQuestionnaireCompliance: warning failed", { userId: user.id, err });
        }
      }

      // 24h: shut off access if still not completed.
      if (hoursSinceDownload >= 24) {
        try {
          await db.entities.User.update(user.id, { plan: null });
          shutOffs++;
          console.log("checkQuestionnaireCompliance: shut off (questionnaire not completed)", { userId: user.id, email: user.email });
          if (user.email) {
            await sendEmailViaIndependent(db, {
              to: user.email,
              subject: "Your Xtreme AI App Access Has Been Turned Off",
              body: `Hi ${user.full_name || "there"},\n\nYour Xtreme AI app access has been turned off because the required 10-question questionnaire was not completed within 24 hours of your download, as agreed in the terms.\n\nIf you believe this is an error, or would like to re-activate your account, please contact support.\n\n— Xtreme AI Systems`,
            });
          }
        } catch (err) {
          console.error("checkQuestionnaireCompliance: shut-off failed", { userId: user.id, err });
        }
      }
    }

    return new Response(JSON.stringify({
      status: "ok",
      checked: users.filter((u) => u.plan && u.downloaded_at).length,
      warningsSent,
      shutOffs,
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("checkQuestionnaireCompliance: unhandled error", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
});