/**
 * ReceiptSync Signup Page
 * Design: YNAB-inspired split-screen layout
 *   LEFT  — deep navy background, large headline, witty social proof, decorative SVG accents
 *   RIGHT — floating white card, minimal form (email + password), OTP step, success step
 * Colors: ReceiptSync brand — navy bg, purple primary, green CTA
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Eye, EyeOff, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = "account" | "otp" | "success";
type Plan = "monthly" | "annual" | null;

// ─── Decorative SVG accents (mirroring YNAB's corner squiggles) ───────────────
function SparkTopRight() {
  return (
    <svg
      className="absolute top-6 right-6 opacity-30 pointer-events-none"
      width="120" height="120" viewBox="0 0 120 120" fill="none"
    >
      <circle cx="100" cy="20" r="3" fill="hsl(160,84%,60%)" />
      <circle cx="112" cy="35" r="2" fill="hsl(262,83%,78%)" />
      <circle cx="90" cy="40" r="1.5" fill="hsl(160,84%,60%)" />
      <path d="M80 10 Q95 5 105 15 Q115 25 108 38" stroke="hsl(262,83%,78%)" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
      <path d="M95 50 Q110 42 118 55" stroke="hsl(160,84%,60%)" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function WaveBottomLeft() {
  return (
    <svg
      className="absolute bottom-0 left-0 opacity-20 pointer-events-none"
      width="200" height="140" viewBox="0 0 200 140" fill="none"
    >
      <path
        d="M0 140 C30 100 60 120 90 80 C120 40 150 60 200 20 L200 140 Z"
        fill="hsl(262,83%,58%)"
      />
      <path
        d="M0 140 C40 110 70 130 110 90 C140 60 170 80 200 50 L200 140 Z"
        fill="hsl(160,84%,39%)"
        opacity="0.5"
      />
    </svg>
  );
}

function FloatingDots() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[
        { x: "15%", y: "20%", size: 4, color: "hsl(262,83%,78%)", delay: 0 },
        { x: "25%", y: "65%", size: 3, color: "hsl(160,84%,60%)", delay: 0.5 },
        { x: "70%", y: "15%", size: 2.5, color: "hsl(160,84%,60%)", delay: 1 },
        { x: "80%", y: "70%", size: 3.5, color: "hsl(262,83%,78%)", delay: 1.5 },
        { x: "45%", y: "85%", size: 2, color: "hsl(160,84%,60%)", delay: 0.8 },
      ].map((dot, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: dot.x,
            top: dot.y,
            width: dot.size,
            height: dot.size,
            backgroundColor: dot.color,
          }}
          animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.4, 1] }}
          transition={{ duration: 3, delay: dot.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ─── OTP Input Box ─────────────────────────────────────────────────────────────
function OtpBox({
  id, value, onChange, onKeyDown, inputRef
}: {
  id: string;
  value: string;
  onChange: (val: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="numeric"
      pattern="[0-9]"
      maxLength={1}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
      onKeyDown={onKeyDown}
      className={`
        w-11 h-13 text-center text-xl font-bold rounded-xl border-2 outline-none
        transition-all duration-150 bg-white
        ${value
          ? "border-[hsl(160,84%,39%)] bg-[hsl(160,84%,97%)] text-[hsl(160,84%,28%)]"
          : "border-[hsl(220,13%,88%)] text-[hsl(240,30%,10%)]"
        }
        focus:border-[hsl(262,83%,58%)] focus:shadow-[0_0_0_3px_hsl(262,100%,97%)]
      `}
    />
  );
}

// ─── Password strength ─────────────────────────────────────────────────────────
function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: "", color: "bg-border" },
    { label: "Weak", color: "bg-red-400" },
    { label: "Fair", color: "bg-amber-400" },
    { label: "Good", color: "bg-[hsl(160,84%,39%)]" },
    { label: "Strong", color: "bg-[hsl(262,83%,58%)]" },
  ];
  return { score, ...map[score] };
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SignupPage() {
  const [step, setStep] = useState<Step>("account");
  const [plan, setPlan] = useState<Plan>(null);

  // Account form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);

  // OTP form
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const otpRefs = useRef<Array<React.RefObject<HTMLInputElement | null>>>(
    Array.from({ length: 6 }, () => ({ current: null }))
  );

  // Read ?plan= from URL, persist to sessionStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("plan") as Plan;
    if (p === "monthly" || p === "annual") {
      setPlan(p);
      sessionStorage.setItem("signupPlan", p);
    } else {
      const stored = sessionStorage.getItem("signupPlan") as Plan;
      if (stored) setPlan(stored);
    }
  }, []);

  // Resend countdown
  useEffect(() => {
    if (resendSeconds <= 0) return;
    const t = setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendSeconds]);

  const startResend = useCallback(() => setResendSeconds(59), []);

  // ── Step 1 submit ──
  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError("");
    if (!email || !password) { setAccountError("Please fill in all fields."); return; }
    if (password.length < 8) { setAccountError("Password must be at least 8 characters."); return; }
    if (!agreed) { setAccountError("Please agree to the Terms of Service and Privacy Policy."); return; }

    setSendingOtp(true);
    // TODO: replace with real tRPC signupSendOtp({ email }) call
    await new Promise((r) => setTimeout(r, 900));
    setSendingOtp(false);
    setStep("otp");
    startResend();
    setTimeout(() => otpRefs.current[0]?.current?.focus(), 100);
  };

  // ── OTP box handlers ──
  const handleOtpChange = (index: number, val: string) => {
    const next = [...otp];
    next[index] = val;
    setOtp(next);
    if (val && index < 5) otpRefs.current[index + 1]?.current?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.current?.focus();
    }
  };

  // ── Step 2 submit ──
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setOtpError("Please enter all 6 digits."); return; }
    setOtpError("");
    setVerifying(true);
    // TODO: replace with real tRPC signupVerify({ email, otp: code, password }) call
    await new Promise((r) => setTimeout(r, 1200));
    setVerifying(false);
    setStep("success");
    sessionStorage.removeItem("signupPlan");
  };

  const planLabel = plan === "annual" ? "Pro Annual — $39.99/yr" : plan === "monthly" ? "Pro Monthly — $9.99/mo" : null;
  const strength = getStrength(password);

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-[Inter,ui-sans-serif,system-ui,sans-serif]">

      {/* ── LEFT PANEL ── */}
      <div
        className="relative flex-1 flex flex-col justify-center px-10 py-16 overflow-hidden"
        style={{ background: "linear-gradient(150deg, hsl(240,30%,10%) 0%, hsl(260,35%,14%) 100%)" }}
      >
        <SparkTopRight />
        <WaveBottomLeft />
        <FloatingDots />

        {/* Back link */}
        <a
          href="https://receiptsync.net"
          className="absolute top-6 left-8 flex items-center gap-1.5 text-sm font-medium text-white/50 hover:text-white/90 transition-colors no-underline z-10"
        >
          <ArrowLeft size={14} />
          Back to receiptsync.net
        </a>

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10 z-10">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-lg"
            style={{ background: "linear-gradient(135deg, hsl(262,83%,58%), hsl(280,83%,68%))" }}
          >
            🧾
          </div>
          <span className="text-white font-bold text-lg tracking-tight">ReceiptSync</span>
        </div>

        {/* Headline */}
        <div className="z-10 max-w-sm">
          <h1 className="text-5xl font-extrabold text-white leading-[1.1] mb-5 tracking-tight">
            Start scanning<br />
            receipts{" "}
            <span style={{ color: "hsl(160,84%,60%)" }}>free</span><br />
            today.
          </h1>
          <p className="text-white/60 text-base leading-relaxed mb-8">
            The average ReceiptSync user saves{" "}
            <span className="text-white/90 font-semibold">10+ hours a month</span>. You're already ahead — you found the web signup.
          </p>

          {/* Stats row */}
          <div className="flex gap-6 mb-8">
            {[
              { value: "99%+", label: "AI accuracy" },
              { value: "5 sec", label: "per receipt" },
              { value: "10 hrs+", label: "saved/month" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-xl font-extrabold text-white">{s.value}</div>
                <div className="text-xs text-white/45 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Plan banner */}
          {planLabel && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 border"
              style={{
                background: "rgba(124,58,237,0.15)",
                borderColor: "rgba(124,58,237,0.35)",
              }}
            >
              <span className="text-2xl">👑</span>
              <div>
                <div className="text-sm font-bold" style={{ color: "hsl(262,100%,85%)" }}>{planLabel}</div>
                <div className="text-xs text-white/45">You'll be redirected to checkout after sign-up.</div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex items-center justify-center bg-[hsl(250,33%,97%)] px-6 py-12">
        <AnimatePresence mode="wait">
          {step === "account" && (
            <motion.div
              key="account"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.10)] p-8 md:p-10"
            >
              {/* Card heading */}
              <h2 className="text-2xl font-bold text-[hsl(240,30%,10%)] mb-1">
                Start your free trial today
              </h2>
              <p className="text-sm text-[hsl(220,9%,46%)] mb-7">
                No credit card required!
              </p>

              <form onSubmit={handleAccountSubmit} className="flex flex-col gap-4">
                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[hsl(240,30%,10%)]" htmlFor="email">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-[hsl(220,13%,88%)] text-sm bg-[hsl(250,33%,97%)] text-[hsl(240,30%,10%)] placeholder:text-[hsl(220,9%,65%)] outline-none transition-all focus:border-[hsl(262,83%,58%)] focus:shadow-[0_0_0_3px_hsl(262,100%,96%)] focus:bg-white"
                  />
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[hsl(240,30%,10%)]" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 pr-11 rounded-xl border-2 border-[hsl(220,13%,88%)] text-sm bg-[hsl(250,33%,97%)] text-[hsl(240,30%,10%)] placeholder:text-[hsl(220,9%,65%)] outline-none transition-all focus:border-[hsl(262,83%,58%)] focus:shadow-[0_0_0_3px_hsl(262,100%,96%)] focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(220,9%,55%)] hover:text-[hsl(240,30%,10%)] transition-colors"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {password && (
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                            i <= strength.score ? strength.color : "bg-[hsl(220,13%,91%)]"
                          }`}
                        />
                      ))}
                      <span className="text-xs text-[hsl(220,9%,55%)] ml-1 self-center">{strength.label}</span>
                    </div>
                  )}
                </div>

                {/* Checkbox */}
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center transition-all ${
                        agreed
                          ? "bg-[hsl(262,83%,58%)] border-[hsl(262,83%,58%)]"
                          : "border-[hsl(220,13%,80%)] group-hover:border-[hsl(262,83%,58%)]"
                      }`}
                      onClick={() => setAgreed((v) => !v)}
                    >
                      {agreed && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-[hsl(220,9%,46%)] leading-relaxed">
                    I agree to the ReceiptSync{" "}
                    <a href="https://receiptsync.net/privacy-policy" target="_blank" rel="noreferrer" className="text-[hsl(262,83%,58%)] font-semibold hover:underline">
                      Privacy Policy
                    </a>{" "}
                    and{" "}
                    <a href="https://receiptsync.net/terms-of-service" target="_blank" rel="noreferrer" className="text-[hsl(262,83%,58%)] font-semibold hover:underline">
                      Terms of Service
                    </a>.
                  </span>
                </label>

                {/* Error */}
                {accountError && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {accountError}
                  </p>
                )}

                {/* CTA button — ReceiptSync green */}
                <button
                  type="submit"
                  disabled={sendingOtp}
                  className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-70"
                  style={{ background: "hsl(160,84%,39%)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "hsl(160,84%,33%)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "hsl(160,84%,39%)"; }}
                >
                  {sendingOtp ? (
                    <><Loader2 size={16} className="animate-spin" /> Sending code…</>
                  ) : (
                    "Start Your Free Trial"
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-[hsl(220,13%,91%)]" />
                <span className="text-xs text-[hsl(220,9%,55%)] font-medium">or</span>
                <div className="flex-1 h-px bg-[hsl(220,13%,91%)]" />
              </div>

              {/* Social login */}
              <div className="flex flex-col gap-2.5">
                <a
                  href="https://app.receiptsync.net/auth/google"
                  className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border-2 border-[hsl(220,13%,88%)] text-sm font-semibold text-[hsl(240,30%,10%)] hover:border-[hsl(262,83%,58%)] hover:shadow-[0_0_0_3px_hsl(262,100%,96%)] transition-all no-underline bg-white"
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

              {/* Log in link */}
              <p className="text-center text-xs text-[hsl(220,9%,55%)] mt-6">
                Already have an account?{" "}
                <a href="https://app.receiptsync.net" className="text-[hsl(262,83%,58%)] font-semibold hover:underline">
                  Log in
                </a>
              </p>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.10)] p-8 md:p-10"
            >
              <h2 className="text-2xl font-bold text-[hsl(240,30%,10%)] mb-1">
                Check your email
              </h2>
              <p className="text-sm text-[hsl(220,9%,46%)] mb-7">
                We sent a 6-digit code to{" "}
                <span className="font-semibold text-[hsl(240,30%,10%)]">{email}</span>.
                Enter it below to verify your account.
              </p>

              <form onSubmit={handleOtpSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-[hsl(240,30%,10%)]">
                    Verification code
                  </label>
                  <div className="flex gap-2 justify-between">
                    {otp.map((val, i) => (
                      <OtpBox
                        key={i}
                        id={`otp-${i}`}
                        value={val}
                        onChange={(v) => handleOtpChange(i, v)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        inputRef={otpRefs.current[i]}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-[hsl(220,9%,55%)] mt-1">
                    Didn't receive it?{" "}
                    {resendSeconds > 0 ? (
                      <span className="text-[hsl(220,9%,55%)]">Resend in {resendSeconds}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { startResend(); /* TODO: call signupSendOtp again */ }}
                        className="text-[hsl(262,83%,58%)] font-semibold hover:underline"
                      >
                        Resend code
                      </button>
                    )}
                  </p>
                </div>

                {otpError && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {otpError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-70"
                  style={{ background: "hsl(160,84%,39%)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "hsl(160,84%,33%)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "hsl(160,84%,39%)"; }}
                >
                  {verifying ? (
                    <><Loader2 size={16} className="animate-spin" /> Verifying…</>
                  ) : (
                    "Verify & Create Account"
                  )}
                </button>
              </form>

              <button
                onClick={() => { setStep("account"); setOtp(["", "", "", "", "", ""]); setOtpError(""); }}
                className="flex items-center gap-1.5 text-xs text-[hsl(220,9%,55%)] hover:text-[hsl(240,30%,10%)] transition-colors mt-5 mx-auto"
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
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.10)] p-8 md:p-10 text-center"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: "hsl(160,84%,95%)" }}
              >
                <CheckCircle2 size={32} style={{ color: "hsl(160,84%,39%)" }} />
              </motion.div>

              <h2 className="text-2xl font-bold text-[hsl(240,30%,10%)] mb-2">
                Account created!
              </h2>
              <p className="text-sm text-[hsl(220,9%,46%)] leading-relaxed mb-7">
                {planLabel
                  ? `Welcome to ReceiptSync! Redirecting you to checkout to activate your ${planLabel} plan…`
                  : "Welcome to ReceiptSync! You're all set. Head to your dashboard to start scanning."}
              </p>

              <a
                href="https://app.receiptsync.net"
                className="inline-flex items-center justify-center w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-150 active:scale-[0.98] no-underline"
                style={{ background: "hsl(160,84%,39%)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "hsl(160,84%,33%)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "hsl(160,84%,39%)"; }}
              >
                Go to Dashboard →
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
