"use client";

import { useEffect, useRef, useState } from "react";
import type { Carrier } from "@/lib/carriers";

type Step = 1 | 2 | 3 | 4;

export function SetupWizard({
  carriers,
  edisonNumber,
  initialCarrierId,
  initialConfirmed,
}: {
  carriers: Carrier[];
  edisonNumber: string;
  initialCarrierId: string | null;
  initialConfirmed: boolean;
}) {
  const [step, setStep] = useState<Step>(initialConfirmed ? 3 : 1);
  const [carrierId, setCarrierId] = useState(initialCarrierId || carriers[0]?.id || "att");
  const [confirmed, setConfirmed] = useState(initialConfirmed);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const carrier = carriers.find((c) => c.id === carrierId) || carriers[0];
  const digits = edisonNumber.replace(/[^\d]/g, "");
  const code = carrier.forwardCode.replace(/\{EDISON\}/g, digits);
  const dialable = /^[\d*#]+$/.test(code);

  // Poll for the live test passing while on step 3.
  useEffect(() => {
    if (step !== 3 || confirmed) return;
    const poll = async () => {
      try {
        const res = await fetch("/api/setup/status", { cache: "no-store" });
        const data = await res.json();
        if (data.setupCompleted) {
          setConfirmed(true);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        /* keep polling */
      }
    };
    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [step, confirmed]);

  async function persistCarrier(id: string) {
    setCarrierId(id);
    try {
      await fetch("/api/setup/carrier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carrier: id }),
      });
    } catch {
      /* non-fatal */
    }
  }

  return (
    <div style={{ maxWidth: 460, margin: "0 auto" }}>
      <Progress step={confirmed ? 3 : step} />

      {!confirmed && step === 1 && (
        <Panel
          stepLabel="STEP 1 OF 3"
          title="Who's your phone carrier?"
          sub="This tells us the exact code to forward your missed calls to Edison."
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--faint)", marginBottom: 8 }}>
            CARRIER
          </div>
          <select
            value={carrierId}
            onChange={(e) => persistCarrier(e.target.value)}
            style={{
              width: "100%",
              border: "2px solid var(--indigo)",
              borderRadius: 13,
              padding: "14px 15px",
              fontWeight: 700,
              fontSize: 16,
              background: "#faf9ff",
              fontFamily: "inherit",
            }}
          >
            {carriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <PrimaryButton onClick={() => setStep(2)}>Continue</PrimaryButton>
        </Panel>
      )}

      {!confirmed && step === 2 && (
        <Panel
          stepLabel="STEP 2 OF 3"
          title="Forward missed calls to Edison"
          sub="Set this once. On most carriers you dial a short code; on app-based lines you set it in the app."
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--faint)", marginBottom: 8 }}>
            YOUR {carrier.name.toUpperCase()} FORWARDING CODE
          </div>
          <div
            style={{
              border: "1px solid var(--line)",
              background: "#fafbfc",
              borderRadius: 14,
              padding: "20px 16px",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            <div
              className="mono"
              style={{
                fontWeight: 700,
                fontSize: dialable ? 24 : 15,
                letterSpacing: dialable ? 1 : 0,
                color: "var(--ink)",
                wordBreak: "break-word",
                lineHeight: 1.4,
              }}
            >
              {code}
            </div>
          </div>
          {carrier.notes && (
            <div style={{ fontSize: 12.5, color: "var(--faint)", marginBottom: 12 }}>
              {carrier.notes}
            </div>
          )}
          <CopyButton text={code} />
          {dialable && (
            <a
              href={`tel:${encodeURIComponent(code)}`}
              style={{
                display: "flex",
                height: 54,
                borderRadius: 13,
                background: "var(--indigo)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 16,
                alignItems: "center",
                justifyContent: "center",
                gap: 9,
                marginTop: 12,
                textDecoration: "none",
              }}
            >
              📞 Call this code now
            </a>
          )}
          <div
            style={{
              marginTop: 14,
              background: "#f2f1fe",
              borderRadius: 11,
              padding: "12px 14px",
              fontSize: 12.5,
              color: "#4032c9",
              lineHeight: 1.5,
            }}
          >
            Once forwarding is set, tap <b>Continue</b> to run a live test.
          </div>
          <PrimaryButton onClick={() => setStep(3)}>Continue →</PrimaryButton>
        </Panel>
      )}

      {!confirmed && step === 3 && (
        <Panel
          stepLabel="STEP 3 OF 3"
          title="Let's test it live"
          sub="From a different phone, call your business line and let it ring out. We'll catch the missed call."
        >
          <div
            style={{
              border: "1px solid var(--line)",
              borderRadius: 16,
              padding: "28px 20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              background: "#fafbfc",
            }}
          >
            <div className="spinner" />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Listening for your call…</div>
              <div style={{ fontSize: 13, color: "var(--faint)", marginTop: 3 }}>
                Usually under 10 seconds
              </div>
            </div>
          </div>
          <div
            style={{
              marginTop: 16,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 12.5, color: "var(--faint)" }}>Not working?</span>
            <button
              onClick={() => setStep(4)}
              style={{
                width: "100%",
                height: 48,
                border: "1px solid var(--line)",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Troubleshoot
            </button>
          </div>
        </Panel>
      )}

      {confirmed && (
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--line)",
            borderRadius: 18,
            padding: "40px 30px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            boxShadow: "0 18px 44px -28px rgba(15,157,107,.4)",
          }}
        >
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: "50%",
              background: "var(--green-bright)",
              color: "#fff",
              fontSize: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 14px 30px -8px rgba(15,157,107,.55)",
            }}
          >
            ✓
          </div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-.02em" }}>
            Edison is live
          </h2>
          <p style={{ margin: 0, fontSize: 15, color: "var(--muted)", lineHeight: 1.5 }}>
            We caught your test call. From now on, every missed call gets rescued.
          </p>
          <a
            href="/dashboard"
            style={{
              marginTop: 8,
              height: 50,
              padding: "0 28px",
              borderRadius: 13,
              background: "var(--ink)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              display: "flex",
              alignItems: "center",
            }}
          >
            Go to dashboard
          </a>
        </div>
      )}

      {!confirmed && step === 4 && (
        <Panel stepLabel="TROUBLESHOOT" title="Let's get it working" sub="A few common fixes:">
          <ul style={{ margin: "0 0 16px", paddingLeft: 18, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.7 }}>
            <li>Double-check you dialed the exact code, including <span className="mono">*</span> and <span className="mono">#</span>.</li>
            <li>Call from a <b>different</b> phone than your business line.</li>
            <li>Let it ring all the way out — don't pick up.</li>
            <li>Some carriers take a minute to activate forwarding.</li>
          </ul>
          <button
            onClick={() => setStep(3)}
            style={{
              width: "100%",
              height: 50,
              border: "none",
              borderRadius: 13,
              background: "var(--indigo)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            Try the test again
          </button>
          <a
            href="mailto:help@edison.io"
            style={{
              display: "flex",
              height: 48,
              marginTop: 10,
              border: "1px solid var(--line)",
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            💬 Talk to a human
          </a>
        </Panel>
      )}

      <style>{`
        .spinner {
          width: 34px; height: 34px; border-radius: 50%;
          border: 3px solid var(--indigo-soft); border-top-color: var(--indigo);
          animation: edspin 1s linear infinite;
        }
        @keyframes edspin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 22 }}>
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          style={{
            flex: 1,
            height: 5,
            borderRadius: 3,
            background: n <= step ? "var(--indigo)" : "var(--line)",
          }}
        />
      ))}
    </div>
  );
}

function Panel({
  stepLabel,
  title,
  sub,
  children,
}: {
  stepLabel: string;
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--line)",
        borderRadius: 18,
        padding: "24px 24px 26px",
      }}
    >
      <div className="mono" style={{ fontSize: 12, fontWeight: 700, color: "var(--faint)", marginBottom: 12 }}>
        {stepLabel}
      </div>
      <h2 style={{ margin: "0 0 6px", fontSize: 23, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.18 }}>
        {title}
      </h2>
      <p style={{ margin: "0 0 18px", fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>{sub}</p>
      {children}
    </div>
  );
}

function PrimaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        height: 52,
        marginTop: 18,
        border: "none",
        borderRadius: 13,
        background: "var(--indigo)",
        color: "#fff",
        fontWeight: 700,
        fontSize: 16,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* ignore */
        }
      }}
      style={{
        width: "100%",
        height: 46,
        border: "1px solid var(--line)",
        borderRadius: 11,
        fontSize: 14,
        fontWeight: 600,
        background: "#fff",
        cursor: "pointer",
      }}
    >
      {copied ? "Copied ✓" : "Copy code"}
    </button>
  );
}
