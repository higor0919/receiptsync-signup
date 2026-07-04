/**
 * ReceiptSync Signup Page
 * Design: PIXEL-PERFECT copy of YNAB signup (ynab.com/signup)
 *
 * Layout:
 *   - Full viewport, single dark navy/indigo background (no split panels)
 *   - Large abstract blob shapes in background
 *   - LEFT: headline + subtext directly on dark bg, lower-left, vertically centered
 *   - RIGHT: floating white card, vertically centered
 *   - Top-left: "← Back to receiptsync.net" escape link
 *   - Decorative SVG accents (spark top-right of card, arch bottom-left)
 *
 * Colors: ReceiptSync brand adapted to YNAB structure
 *   - Background: deep indigo hsl(240,30%,10%)
 *   - CTA button: ReceiptSync green (bright, like YNAB's lime)
 *   - Card: white
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Eye, EyeOff, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Step = "account" | "otp" | "success";
type Plan = "monthly" | "annual" | null;

// ── OTP Input ──────────────────────────────────────────────────────────────────
function OtpBox({
  value, onChange, onKeyDown, inputRef,
}: {
  value: string;
  onChange: (val: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      pattern="[0-9]"
      maxLength={1}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
      onKeyDown={onKeyDown}
      style={{
        width: 44,
        height: 52,
        textAlign: "center",
        fontSize: 20,
        fontWeight: 700,
        borderRadius: 10,
        border: value ? "2px solid #10b981" : "2px solid #d1d5db",
        outline: "none",
        background: value ? "#f0fdf4" : "white",
        color: "#111827",
        transition: "border-color 0.15s, background 0.15s",
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = "#6d28d9"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(109,40,217,0.12)"; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = value ? "#10b981" : "#d1d5db"; e.currentTarget.style.boxShadow = "none"; }}
    />
  );
}

// ── Password strength ──────────────────────────────────────────────────────────
function getStrength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const colors = ["#e5e7eb", "#f87171", "#fbbf24", "#34d399", "#6d28d9"];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  return { score: s, color: colors[s], label: labels[s] };
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function SignupPage() {
  const [step, setStep] = useState<Step>("account");
  const [plan, setPlan] = useState<Plan>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [accountErr, setAccountErr] = useState("");
  const [sending, setSending] = useState(false);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpErr, setOtpErr] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resend, setResend] = useState(0);
  const otpRefs = useRef<Array<React.RefObject<HTMLInputElement | null>>>(
    Array.from({ length: 6 }, () => ({ current: null }))
  );

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("plan") as Plan;
    if (p === "monthly" || p === "annual") { setPlan(p); sessionStorage.setItem("signupPlan", p); }
    else { const s = sessionStorage.getItem("signupPlan") as Plan; if (s) setPlan(s); }
  }, []);

  useEffect(() => {
    if (resend <= 0) return;
    const t = setTimeout(() => setResend((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resend]);

  const startResend = useCallback(() => setResend(59), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountErr("");
    if (!email || !password) { setAccountErr("Please fill in all fields."); return; }
    if (password.length < 8) { setAccountErr("Password must be at least 8 characters."); return; }
    if (!agreed) { setAccountErr("Please agree to the Terms of Service and Privacy Policy."); return; }
    setSending(true);
    await new Promise((r) => setTimeout(r, 900)); // TODO: signupSendOtp({ email })
    setSending(false);
    setStep("otp");
    startResend();
    setTimeout(() => otpRefs.current[0]?.current?.focus(), 80);
  };

  const handleOtpChange = (i: number, v: string) => {
    const next = [...otp]; next[i] = v; setOtp(next);
    if (v && i < 5) otpRefs.current[i + 1]?.current?.focus();
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.current?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.join("").length < 6) { setOtpErr("Please enter all 6 digits."); return; }
    setOtpErr("");
    setVerifying(true);
    await new Promise((r) => setTimeout(r, 1200)); // TODO: signupVerify({ email, otp, password })
    setVerifying(false);
    setStep("success");
    sessionStorage.removeItem("signupPlan");
  };

  const strength = getStrength(password);
  const planLabel = plan === "annual" ? "Pro Annual — $39.99/yr" : plan === "monthly" ? "Pro Monthly — $9.99/mo" : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a1040 0%, #1e1b4b 40%, #1a1040 100%)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* ── Background blobs (YNAB-style) ── */}
      <svg
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {/* Large blob top-right */}
        <ellipse cx="1100" cy="200" rx="380" ry="320" fill="#2d2a6e" opacity="0.6" />
        {/* Medium blob left-center */}
        <ellipse cx="200" cy="500" rx="280" ry="240" fill="#2d2a6e" opacity="0.5" />
        {/* Small blob bottom-right */}
        <ellipse cx="1300" cy="750" rx="200" ry="160" fill="#312e81" opacity="0.4" />
      </svg>

      {/* ── Bottom-left arch scribble (YNAB's scribble_cornerarch) ── */}
      <svg
        style={{ position: "absolute", bottom: 0, left: 0, pointerEvents: "none" }}
        width="220" height="140" viewBox="0 0 220 140" fill="none"
      >
        <path d="M-10 140 Q40 80 100 100 Q160 120 200 60" stroke="#10b981" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
        <path d="M-10 160 Q50 100 120 115 Q180 130 220 75" stroke="#10b981" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4" />
        <path d="M-10 180 Q60 120 130 130 Q190 140 230 90" stroke="#10b981" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.25" />
      </svg>

      {/* ── Back link ── */}
      <a
        href="https://receiptsync.net"
        style={{
          position: "absolute", top: 24, left: 32,
          color: "rgba(255,255,255,0.55)", fontSize: 14, fontWeight: 500,
          display: "flex", alignItems: "center", gap: 6,
          textDecoration: "none", zIndex: 10,
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
      >
        <ArrowLeft size={14} />
        Back to receiptsync.net
      </a>

      {/* ── Page layout: left text + right card ── */}
      <div style={{
        width: "100%", maxWidth: 1280, margin: "0 auto",
        padding: "0 80px",
        display: "flex", alignItems: "center", justifyContent: "flex-end",
        gap: 64, position: "relative", zIndex: 2,
      }}>

        {/* ── LEFT: Text on dark background (no box, no card) ── */}
        <div style={        { flex: "1 1 auto", maxWidth: 520, marginRight: 0 }}>
          <h1 style={{
            fontSize: "clamp(40px, 4.2vw, 60px)",
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.1,
            margin: "0 0 20px 0",
            letterSpacing: "-0.02em",
          }}>
            Try ReceiptSync<br />
            free for 14 days
          </h1>
          <p style={{
            fontSize: 17,
            color: "rgba(255,255,255,0.65)",
            lineHeight: 1.6,
            margin: 0,
            maxWidth: 360,
          }}>
            The average ReceiptSync user saves $600 in their first month (and you seem above average, honestly).
          </p>

          {/* Plan banner — only shown when ?plan= is set */}
          {planLabel && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: 28,
                background: "rgba(109,40,217,0.2)",
                border: "1px solid rgba(109,40,217,0.4)",
                borderRadius: 14,
                padding: "12px 16px",
                display: "flex", alignItems: "center", gap: 10,
              }}
            >
              <span style={{ fontSize: 20 }}>👑</span>
              <div>
                <div style={{ color: "#c4b5fd", fontWeight: 700, fontSize: 14 }}>{planLabel}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>
                  You'll be redirected to checkout after sign-up.
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* ── RIGHT: Floating white card ── */}
        <div style={        { flex: "0 0 460px", width: 460, position: "relative", flexShrink: 0 }}>

          {/* Spark SVG top-right of card (YNAB's spark-corner2) */}
          <svg
            style={{ position: "absolute", top: -18, right: -18, pointerEvents: "none", zIndex: 3 }}
            width="60" height="60" viewBox="0 0 60 60" fill="none"
          >
            <line x1="30" y1="5" x2="30" y2="20" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="30" y1="40" x2="30" y2="55" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="5" y1="30" x2="20" y2="30" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="40" y1="30" x2="55" y2="30" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="12" y1="12" x2="22" y2="22" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            <line x1="38" y1="38" x2="48" y2="48" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          </svg>

          <AnimatePresence mode="wait">
            {step === "account" && (
              <motion.div
                key="account"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
                style={{
                  background: "white",
                  borderRadius: 16,
                  boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                  padding: "52px 44px",
                }}
              >
                <h2 style={{ fontSize: 26, fontWeight: 700, color: "#1e1b4b", margin: "0 0 6px 0", textAlign: "center" }}>
                  Start your free trial today
                </h2>
                <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 32px 0", textAlign: "center" }}>
                  No credit card required!
                </p>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Email field */}
                  <div style={{ position: "relative" }}>
                    <span style={{
                      position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                      color: "#9ca3af", fontSize: 15, pointerEvents: "none",
                    }}>✉️</span>
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      style={{
                        width: "100%", boxSizing: "border-box",
                        padding: "13px 14px 13px 42px",
                        fontSize: 15, borderRadius: 8,
                        border: "1.5px solid #d1d5db",
                        outline: "none", color: "#111827",
                        background: "white",
                        transition: "border-color 0.15s, box-shadow 0.15s",
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "#6d28d9"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(109,40,217,0.1)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.boxShadow = "none"; }}
                    />
                  </div>

                  {/* Password field */}
                  <div style={{ position: "relative" }}>
                    <span style={{
                      position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                      color: "#9ca3af", fontSize: 15, pointerEvents: "none",
                    }}>🔒</span>
                    <input
                      type={showPw ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      style={{
                        width: "100%", boxSizing: "border-box",
                        padding: "13px 42px 13px 42px",
                        fontSize: 15, borderRadius: 8,
                        border: "1.5px solid #d1d5db",
                        outline: "none", color: "#111827",
                        background: "white",
                        transition: "border-color 0.15s, box-shadow 0.15s",
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "#6d28d9"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(109,40,217,0.1)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.boxShadow = "none"; }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      style={{
                        position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                        background: "none", border: "none", color: "#9ca3af", cursor: "pointer", padding: 2,
                      }}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password strength */}
                  {password.length > 0 && (
                    <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: -6 }}>
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} style={{
                          flex: 1, height: 3, borderRadius: 99,
                          background: i <= strength.score ? strength.color : "#e5e7eb",
                          transition: "background 0.3s",
                        }} />
                      ))}
                      <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 4 }}>{strength.label}</span>
                    </div>
                  )}

                  {/* Checkbox */}
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                    <div
                      onClick={() => setAgreed((v) => !v)}
                      style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 2,
                        border: agreed ? "none" : "1.5px solid #d1d5db",
                        background: agreed ? "#6d28d9" : "white",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", transition: "all 0.15s",
                      }}
                    >
                      {agreed && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>
                      I agree to the ReceiptSync{" "}
                      <a href="https://receiptsync.net/privacy-policy" target="_blank" rel="noreferrer" style={{ color: "#6d28d9", fontWeight: 600 }}>Privacy Policy</a>
                      {" "}and{" "}
                      <a href="https://receiptsync.net/terms-of-service" target="_blank" rel="noreferrer" style={{ color: "#6d28d9", fontWeight: 600 }}>Terms of Service</a>.
                    </span>
                  </label>

                  {/* Error */}
                  {accountErr && (
                    <div style={{ fontSize: 13, color: "#ef4444", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px" }}>
                      {accountErr}
                    </div>
                  )}

                  {/* CTA — bright green like YNAB's lime */}
                  <button
                    type="submit"
                    disabled={sending}
                    style={{
                      width: "100%", padding: "14px",
                      background: sending ? "#86efac" : "#22c55e",
                      color: "white", fontWeight: 700, fontSize: 15,
                      border: "none", borderRadius: 8, cursor: sending ? "default" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      transition: "background 0.15s, transform 0.1s",
                    }}
                    onMouseEnter={(e) => { if (!sending) (e.currentTarget as HTMLButtonElement).style.background = "#16a34a"; }}
                    onMouseLeave={(e) => { if (!sending) (e.currentTarget as HTMLButtonElement).style.background = "#22c55e"; }}
                    onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)"; }}
                    onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
                  >
                    {sending ? <><Loader2 size={16} className="animate-spin" /> Sending code…</> : "Start Your Free Trial"}
                  </button>
                </form>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
                  <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
                  <span style={{ fontSize: 13, color: "#9ca3af" }}>or</span>
                  <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
                </div>

                {/* Social buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <a
                    href="https://app.receiptsync.net/auth/google"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                      padding: "12px", borderRadius: 8,
                      border: "1.5px solid #e5e7eb",
                      color: "#374151", fontWeight: 600, fontSize: 14,
                      textDecoration: "none", background: "white",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6d28d9"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(109,40,217,0.08)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </a>
                </div>

                <p style={{ textAlign: "center", fontSize: 13, color: "#9ca3af", marginTop: 20, marginBottom: 0 }}>
                  Already have an account?{" "}
                  <a href="https://app.receiptsync.net" style={{ color: "#6d28d9", fontWeight: 600, textDecoration: "none" }}>Log in</a>
                </p>
              </motion.div>
            )}

            {step === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
                style={{
                  background: "white", borderRadius: 16,
                  boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                  padding: "40px 36px",
                }}
              >
                <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1e1b4b", margin: "0 0 6px 0", textAlign: "center" }}>
                  Check your email
                </h2>
                <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 28px 0", textAlign: "center", lineHeight: 1.5 }}>
                  We sent a 6-digit code to <strong style={{ color: "#111827" }}>{email}</strong>
                </p>

                <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    {otp.map((val, i) => (
                      <OtpBox
                        key={i}
                        value={val}
                        onChange={(v) => handleOtpChange(i, v)}
                        onKeyDown={(e) => handleOtpKey(i, e)}
                        inputRef={otpRefs.current[i]}
                      />
                    ))}
                  </div>

                  <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", margin: 0 }}>
                    Didn't get it?{" "}
                    {resend > 0 ? (
                      <span>Resend in {resend}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startResend()}
                        style={{ background: "none", border: "none", color: "#6d28d9", fontWeight: 600, cursor: "pointer", fontSize: 13 }}
                      >
                        Resend code
                      </button>
                    )}
                  </p>

                  {otpErr && (
                    <div style={{ fontSize: 13, color: "#ef4444", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
                      {otpErr}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={verifying}
                    style={{
                      width: "100%", padding: "14px",
                      background: verifying ? "#86efac" : "#22c55e",
                      color: "white", fontWeight: 700, fontSize: 15,
                      border: "none", borderRadius: 8, cursor: verifying ? "default" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => { if (!verifying) (e.currentTarget as HTMLButtonElement).style.background = "#16a34a"; }}
                    onMouseLeave={(e) => { if (!verifying) (e.currentTarget as HTMLButtonElement).style.background = "#22c55e"; }}
                  >
                    {verifying ? <><Loader2 size={16} className="animate-spin" /> Verifying…</> : "Verify & Create Account"}
                  </button>
                </form>

                <button
                  onClick={() => { setStep("account"); setOtp(["", "", "", "", "", ""]); setOtpErr(""); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "none", border: "none", color: "#9ca3af",
                    fontSize: 13, cursor: "pointer", margin: "18px auto 0",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#374151"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#9ca3af"; }}
                >
                  <ArrowLeft size={13} /> Change email or details
                </button>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
                style={{
                  background: "white", borderRadius: 16,
                  boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                  padding: "48px 36px", textAlign: "center",
                }}
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 220 }}
                  style={{
                    width: 64, height: 64, borderRadius: "50%",
                    background: "#f0fdf4",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 20px",
                  }}
                >
                  <CheckCircle2 size={32} color="#22c55e" />
                </motion.div>

                <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1e1b4b", margin: "0 0 10px 0" }}>
                  You're in!
                </h2>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, margin: "0 0 28px 0" }}>
                  {planLabel
                    ? `Welcome to ReceiptSync! Redirecting you to checkout for your ${planLabel} plan…`
                    : "Welcome to ReceiptSync! Your account is ready. Head to your dashboard to start scanning."}
                </p>

                <a
                  href="https://app.receiptsync.net"
                  style={{
                    display: "block", width: "100%", boxSizing: "border-box",
                    padding: "14px", background: "#22c55e",
                    color: "white", fontWeight: 700, fontSize: 15,
                    borderRadius: 8, textDecoration: "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#16a34a"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#22c55e"; }}
                >
                  Go to Dashboard →
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
