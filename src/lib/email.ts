import { Resend } from "resend";

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping email:", opts.subject);
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM || "Edison <reports@edison.io>";
  await resend.emails.send({ from, ...opts });
}

export interface WeeklyReportData {
  businessName: string;
  rangeLabel: string;
  leadsCaptured: number;
  jobsBooked: number;
  needsFollowup: number;
  estimatedValue: number;
  topJobs: { name: string; need: string; value: number }[];
}

/** Screenshot-friendly weekly value report (matches the in-dashboard view). */
export function weeklyReportHtml(d: WeeklyReportData): string {
  const money = (n: number) => "$" + n.toLocaleString("en-US");
  const rows = d.topJobs
    .map(
      (j) => `
      <tr>
        <td style="padding:8px 0;font-size:14px;color:#15181f;">${j.name} · ${j.need}</td>
        <td style="padding:8px 0;font-size:14px;font-weight:700;color:#0a7d54;text-align:right;font-family:monospace;">${money(j.value)}</td>
      </tr>`,
    )
    .join("");

  return `
  <div style="font-family:Figtree,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #dfe2ea;border-radius:18px;overflow:hidden;">
    <div style="background:#15181f;padding:24px 30px;display:flex;align-items:center;justify-content:space-between;">
      <span style="font-weight:800;font-size:16px;color:#fff;">Edison</span>
      <span style="font-size:12.5px;color:#9aa3b2;font-family:monospace;">${d.rangeLabel}</span>
    </div>
    <div style="padding:34px 30px 24px;text-align:center;border-bottom:1px solid #f0f1f5;">
      <div style="font-size:15px;color:#5b6475;">This week, Edison captured</div>
      <div style="font-family:monospace;font-weight:700;font-size:48px;color:#15181f;margin:6px 0;">${d.leadsCaptured} leads</div>
      <div style="display:inline-block;background:#e6f6ef;color:#0a7d54;border-radius:30px;padding:8px 16px;font-size:15px;font-weight:700;">
        estimated value ${money(d.estimatedValue)}
      </div>
    </div>
    <div style="display:flex;border-bottom:1px solid #f0f1f5;text-align:center;">
      <div style="flex:1;padding:18px;border-right:1px solid #f0f1f5;"><div style="font-family:monospace;font-weight:700;font-size:24px;">${d.jobsBooked}</div><div style="font-size:12px;color:#8a93a3;">Jobs booked</div></div>
      <div style="flex:1;padding:18px;"><div style="font-family:monospace;font-weight:700;font-size:24px;">${d.needsFollowup}</div><div style="font-size:12px;color:#8a93a3;">Need follow-up</div></div>
    </div>
    <div style="padding:22px 30px;">
      <div style="font-size:12px;font-weight:700;color:#8a93a3;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Top rescued jobs</div>
      <table style="width:100%;border-collapse:collapse;">${rows || '<tr><td style="font-size:14px;color:#8a93a3;">No booked jobs yet this week.</td></tr>'}</table>
    </div>
  </div>`;
}
