import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentBusiness } from "@/lib/auth";
import { getCalendarData, type Appointment } from "@/lib/calendar";
import { AppNav } from "@/components/AppNav";

export const dynamic = "force-dynamic";

type View = "day" | "3day" | "week" | "month";
const VIEWS: { key: View; label: string; days: number }[] = [
  { key: "day", label: "Day", days: 1 },
  { key: "3day", label: "3-Day", days: 3 },
  { key: "week", label: "Week", days: 7 },
  { key: "month", label: "Month", days: 0 },
];
const FILTERS = [
  { key: "all", label: "All" },
  { key: "booked", label: "Booked" },
  { key: "needs_followup", label: "Needs follow-up" },
  { key: "new", label: "New" },
];

const STATUS_COLOR: Record<string, string> = {
  booked: "var(--green)",
  needs_followup: "var(--amber)",
  new: "var(--indigo)",
  closed: "var(--faint)",
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function startOfWeek(d: Date) {
  const x = startOfDay(d);
  x.setDate(x.getDate() - x.getDay()); // Sunday
  return x;
}
function parseDate(s?: string): Date {
  if (s) {
    const d = new Date(s + "T00:00:00");
    if (!isNaN(d.getTime())) return startOfDay(d);
  }
  return startOfDay(new Date());
}
function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string; filter?: string }>;
}) {
  const sp = await searchParams;
  const business = await getCurrentBusiness();
  if (!business) redirect("/login");

  const view = (VIEWS.find((v) => v.key === sp.view)?.key ?? "week") as View;
  const filter = FILTERS.find((f) => f.key === sp.filter)?.key ?? "all";
  const anchor = parseDate(sp.date);
  const today = startOfDay(new Date());

  // Range for the current view.
  let rangeStart: Date;
  let rangeEnd: Date;
  let prev: Date;
  let next: Date;
  if (view === "month") {
    rangeStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    rangeEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
    prev = new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1);
    next = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
  } else if (view === "week") {
    rangeStart = startOfWeek(anchor);
    rangeEnd = addDays(rangeStart, 7);
    prev = addDays(rangeStart, -7);
    next = addDays(rangeStart, 7);
  } else {
    const days = view === "3day" ? 3 : 1;
    rangeStart = startOfDay(anchor);
    rangeEnd = addDays(rangeStart, days);
    prev = addDays(rangeStart, -days);
    next = addDays(rangeStart, days);
  }

  const data = await getCalendarData(business!, rangeStart, rangeEnd, filter);

  const cal = (o: { view?: string; date?: Date; filter?: string }) =>
    `/calendar?view=${o.view ?? view}&date=${iso(o.date ?? anchor)}&filter=${o.filter ?? filter}`;

  const rangeLabel =
    view === "month"
      ? anchor.toLocaleString("en-US", { month: "long", year: "numeric" })
      : view === "day"
        ? rangeStart.toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric" })
        : `${rangeStart.toLocaleString("en-US", { month: "short", day: "numeric" })} – ${addDays(rangeEnd, -1).toLocaleString("en-US", { month: "short", day: "numeric" })}`;

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <AppNav active="/calendar" businessName={business!.name} />
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 20px 64px" }}>
        {/* header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", margin: 0 }}>Calendar</h1>
            <div style={{ fontSize: 13.5, color: "var(--faint)", marginTop: 2 }}>{rangeLabel}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <Link href={cal({ date: prev })} className="nav-link" style={navBtn}>‹</Link>
            <Link href={cal({ date: today })} className="nav-link" style={{ ...navBtn, width: "auto", padding: "0 12px" }}>Today</Link>
            <Link href={cal({ date: next })} className="nav-link" style={navBtn}>›</Link>
          </div>
        </div>

        {/* view toggle + filter */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "inline-flex", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 10, padding: 3 }}>
            {VIEWS.map((v) => (
              <Link
                key={v.key}
                href={cal({ view: v.key })}
                style={{
                  fontSize: 13, fontWeight: 600, padding: "6px 13px", borderRadius: 8,
                  background: v.key === view ? "var(--indigo)" : "transparent",
                  color: v.key === view ? "#fff" : "var(--muted)",
                }}
              >
                {v.label}
              </Link>
            ))}
          </div>
          <div style={{ display: "inline-flex", gap: 4, flexWrap: "wrap" }}>
            {FILTERS.map((f) => (
              <Link
                key={f.key}
                href={cal({ filter: f.key })}
                className="nav-link"
                style={{
                  fontSize: 12.5, fontWeight: 600, padding: "6px 11px", borderRadius: 8,
                  color: f.key === filter ? "var(--ink)" : "var(--muted)",
                  background: f.key === filter ? "var(--indigo-soft)" : "transparent",
                }}
              >
                {f.label}
              </Link>
            ))}
          </div>
        </div>

        {/* progress strip */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <Prog label="Booked" value={String(data.summary.booked)} accent="var(--green)" />
          <Prog label="Needs follow-up" value={String(data.summary.needsFollowup)} accent="var(--amber)" />
          <Prog label="Recovered (this range)" value={`$${data.summary.recovered.toLocaleString()}`} accent="var(--green)" />
        </div>

        {/* body */}
        {view === "month" ? (
          <MonthGrid start={rangeStart} appts={data.appointments} today={today} />
        ) : (
          <Columns start={rangeStart} days={view === "week" ? 7 : view === "3day" ? 3 : 1} appts={data.appointments} today={today} />
        )}
      </div>
    </main>
  );
}

function Columns({ start, days, appts, today }: { start: Date; days: number; appts: Appointment[]; today: Date }) {
  const cols = Array.from({ length: days }, (_, i) => addDays(start, i));
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${days}, 1fr)`, gap: 10 }}>
      {cols.map((day) => {
        const dayAppts = appts
          .filter((a) => sameDay(a.startAt, day))
          .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
        const isToday = sameDay(day, today);
        return (
          <div key={day.toISOString()} style={{ background: "var(--card)", border: `1px solid ${isToday ? "var(--indigo)" : "var(--line)"}`, borderRadius: 14, overflow: "hidden", minHeight: 220 }}>
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--line-soft)", background: isToday ? "var(--indigo-soft)" : "transparent" }}>
              <div style={{ fontSize: 12, color: "var(--faint)", fontWeight: 600 }}>
                {day.toLocaleString("en-US", { weekday: "short" })}
              </div>
              <div className="mono" style={{ fontSize: 18, fontWeight: 700 }}>{day.getDate()}</div>
            </div>
            <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              {dayAppts.length === 0 && (
                <div style={{ fontSize: 12, color: "var(--faint)", padding: "8px 4px" }}>—</div>
              )}
              {dayAppts.map((a) => (
                <ApptCard key={a.id} a={a} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MonthGrid({ start, appts, today }: { start: Date; appts: Appointment[]; today: Date }) {
  const gridStart = startOfWeek(start);
  const weeks: Date[][] = [];
  let cursor = gridStart;
  for (let w = 0; w < 6; w++) {
    const row: Date[] = [];
    for (let d = 0; d < 7; d++) {
      row.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(row);
    if (cursor.getMonth() !== start.getMonth() && cursor > addDays(start, 27)) break;
  }
  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: "1px solid var(--line-soft)" }}>
        {DOW.map((d) => (
          <div key={d} style={{ padding: "8px 10px", fontSize: 11.5, fontWeight: 700, color: "var(--faint)", textAlign: "center" }}>{d}</div>
        ))}
      </div>
      {weeks.map((row, ri) => (
        <div key={ri} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
          {row.map((day) => {
            const inMonth = day.getMonth() === start.getMonth();
            const isToday = sameDay(day, today);
            const dayAppts = appts.filter((a) => sameDay(a.startAt, day)).sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
            return (
              <div key={day.toISOString()} style={{ minHeight: 96, borderRight: "1px solid var(--line-soft)", borderBottom: "1px solid var(--line-soft)", padding: 6, background: inMonth ? "transparent" : "var(--card-2)", opacity: inMonth ? 1 : 0.55 }}>
                <div className="mono" style={{ fontSize: 12, fontWeight: 700, textAlign: "right", color: isToday ? "#fff" : "var(--muted)", background: isToday ? "var(--indigo)" : "transparent", borderRadius: 6, width: 22, height: 22, marginLeft: "auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {day.getDate()}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 4 }}>
                  {dayAppts.slice(0, 3).map((a) => (
                    <Link key={a.id} href={`/conversations/${a.id}`} title={`${a.customerName} · ${a.summary}`} style={{ fontSize: 10.5, fontWeight: 600, color: "var(--ink)", background: "var(--line-soft)", borderLeft: `3px solid ${STATUS_COLOR[a.status] ?? "var(--indigo)"}`, borderRadius: 4, padding: "2px 5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {a.startAt.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" })} {a.customerName}
                    </Link>
                  ))}
                  {dayAppts.length > 3 && (
                    <span style={{ fontSize: 10, color: "var(--faint)", paddingLeft: 5 }}>+{dayAppts.length - 3} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function ApptCard({ a }: { a: Appointment }) {
  return (
    <Link
      href={`/conversations/${a.id}`}
      className="lift"
      style={{ display: "block", background: "var(--card-2)", border: "1px solid var(--line)", borderLeft: `3px solid ${STATUS_COLOR[a.status] ?? "var(--indigo)"}`, borderRadius: 8, padding: "7px 9px" }}
    >
      <div className="mono" style={{ fontSize: 11.5, fontWeight: 700, color: "var(--muted)" }}>
        {a.startAt.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" })}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, marginTop: 1 }}>{a.customerName}</div>
      <div style={{ fontSize: 11.5, color: "var(--faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.summary}</div>
      {a.workerName && <div style={{ fontSize: 10.5, color: "var(--indigo)", marginTop: 2 }}>{a.workerName}</div>}
    </Link>
  );
}

function Prog({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="lift" style={{ flex: "1 1 150px", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: "12px 15px" }}>
      <div style={{ fontSize: 11.5, color: "var(--faint)", fontWeight: 600 }}>{label}</div>
      <div className="mono" style={{ fontSize: 20, fontWeight: 700, marginTop: 2, color: accent }}>{value}</div>
    </div>
  );
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const navBtn: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 9, border: "1px solid var(--line)", background: "var(--card)",
  display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "var(--ink)",
};
