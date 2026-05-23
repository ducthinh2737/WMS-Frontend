/**
 * NexusOS — Premium Enterprise Login Page
 * Nền: Video background (thay thế canvas particles)
 *
 * Cách dùng video:
 *   1. Đặt file video vào /public/bg.mp4 (hoặc import trực tiếp)
 *   2. Đổi BG_VIDEO_SRC thành đường dẫn video của bạn
 *
 * Dependencies: react, react-dom, react-router-dom
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import type { LoginRequestDto } from "../../types/auth";

/* ─────────────────────────────────────────
   ⚙️  ĐỔI ĐƯỜNG DẪN VIDEO TẠI ĐÂY
───────────────────────────────────────── */
const BG_VIDEO_SRC = "/bg.mp4"; // VD: "/videos/login-bg.mp4" hoặc import bgMp4 from "./bg.mp4"

const slides = [
    {
        video: "https://www.pexels.com/download/video/31621428/",
        title: "Hệ thống quản lý kho thông minh",
        description: "Tối ưu hóa quy trình vận hành kho bãi với các tính năng theo dõi thời gian thực, quản lý vị trí chính xác và kiểm hàng tự động."
    },
    {
        video: "https://www.pexels.com/download/video/19896989/",
        title: "Kiểm soát nhập xuất hoàn hảo",
        description: "Đảm bảo tính chính xác tuyệt đối trong khâu kiểm hàng với tính năng tự động cảnh báo ngày sản xuất và hạn sử dụng."
    }
];

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface FieldError { email?: string; password?: string }
interface Toast { msg: string; type: "success" | "error" }

/* ─────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────── */
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

html, body {
  margin: 0 !important;
  padding: 0 !important;
  background-color: #03030a !important;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.nexus-root { font-family: 'DM Sans', sans-serif; }
.nexus-syne { font-family: 'Syne', sans-serif; }

/* ── VIDEO BG ── */
.nexus-video-bg {
  position: fixed; inset: 0; z-index: 0;
  width: 100%; height: 100%;
  object-fit: cover;
  pointer-events: none;
}
/* Overlay tối lên trên video để card nổi bật */
.nexus-video-overlay {
  position: fixed; inset: 0; z-index: 1; pointer-events: none;
  background: linear-gradient(
    135deg,
    rgba(3,3,10,0.82) 0%,
    rgba(5,8,25,0.75) 50%,
    rgba(3,3,10,0.85) 100%
  );
}
/* Overlay thứ 2: vignette 4 cạnh */
.nexus-vignette {
  position: fixed; inset: 0; z-index: 2; pointer-events: none;
  background: radial-gradient(ellipse 90% 90% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%);
}

/* ── GRID OVERLAY ── */
.nexus-grid-bg {
  position: fixed; inset: 0; z-index: 3; pointer-events: none;
  background-image:
    linear-gradient(rgba(99,179,237,0.025) 1px,transparent 1px),
    linear-gradient(90deg,rgba(99,179,237,0.025) 1px,transparent 1px);
  background-size: 60px 60px;
  -webkit-mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%);
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%);
}

/* ── CARD ENTRY ── */
@keyframes nexus-card-in {
  from { opacity:0; transform:translateY(32px) scale(0.96); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}
.nexus-card { animation: nexus-card-in 0.8s cubic-bezier(0.22,1,0.36,1) both; }

/* ── FADE UP ── */
@keyframes nexus-fade-up {
  from { opacity:0; transform:translateY(16px); }
  to   { opacity:1; transform:translateY(0); }
}
.nexus-fade-up { animation: nexus-fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both; }

/* ── SPINNER ── */
@keyframes nexus-spin { to { transform: rotate(360deg); } }
.nexus-spinner {
  width:18px; height:18px; border-radius:50%;
  border: 2px solid rgba(255,255,255,0.25);
  border-top-color: #fff;
  animation: nexus-spin 0.7s linear infinite;
}

/* ── STATUS DOT ── */
@keyframes nexus-pulse {
  0%,100% { box-shadow: 0 0 4px #34d399; opacity:1; }
  50%      { box-shadow: 0 0 10px #34d399; opacity:0.7; }
}
.nexus-status-dot {
  width:6px; height:6px; background:#34d399;
  border-radius:50%; display:inline-block;
  box-shadow: 0 0 6px #34d399;
  animation: nexus-pulse 2s ease-in-out infinite;
  flex-shrink:0;
}

/* ── BUTTON SHINE ── */
.nexus-btn-login { position: relative; overflow: hidden; }
.nexus-btn-login::after {
  content:''; position:absolute;
  top:-50%; left:-75%; width:50%; height:200%;
  background: linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent);
  transform: skewX(-20deg);
  transition: left 0.55s cubic-bezier(0.4,0,0.2,1);
  pointer-events:none;
}
.nexus-btn-login:hover::after { left: 125%; }
.nexus-btn-login:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 36px rgba(59,130,246,0.4),0 4px 16px rgba(99,77,226,0.3) !important;
}
.nexus-btn-login:active { transform: translateY(0) scale(0.99); }

/* ── TOAST ── */
@keyframes nexus-toast-in {
  from { transform: translateX(120%); }
  to   { transform: translateX(0); }
}
@keyframes nexus-toast-out {
  from { transform: translateX(0); }
  to   { transform: translateX(120%); }
}
.nexus-toast-in  { animation: nexus-toast-in  0.4s cubic-bezier(0.22,1,0.36,1) both; }
.nexus-toast-out { animation: nexus-toast-out 0.35s cubic-bezier(0.4,0,1,1) both; }

/* ── INPUT ── */
.nexus-input {
  border-radius: 30px !important;
}
.nexus-input:focus {
  border-color: rgba(99,179,237,0.45) !important;
  background: rgba(59,130,246,0.06) !important;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.08), 0 0 20px rgba(59,130,246,0.06) !important;
  outline: none;
}
.nexus-input:hover {
  border-color: rgba(255,255,255,0.16) !important;
  background: rgba(255,255,255,0.06) !important;
}
.nexus-input.error {
  border-color: rgba(248,113,113,0.5) !important;
  box-shadow: 0 0 0 3px rgba(248,113,113,0.08) !important;
}

/* ── SOCIAL BTN ── */
.nexus-social:hover {
  border-color: rgba(255,255,255,0.18) !important;
  background: rgba(255,255,255,0.07) !important;
  transform: translateY(-1px);
  color: #f0f4ff !important;
}

/* ── CHECKBOX ── */
.nexus-checkbox:checked {
  background: linear-gradient(135deg,#3b82f6,#6366f1) !important;
  border-color: transparent !important;
  box-shadow: 0 0 12px rgba(59,130,246,0.35);
}

/* ── SPLIT LAYOUT ── */
.nexus-login-panel {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 10;
  padding: 24px;
  min-height: 100vh;
}
@media (min-width: 1024px) {
  .nexus-login-panel {
    width: 100%;
    margin: 0 auto;
    border-left: none;
    background: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}

.nexus-slideshow-panel {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 1;
}

.nexus-slideshow-text {
  display: none;
}
@media (min-width: 1150px) {
  .nexus-slideshow-text {
    display: block;
  }
}
`;

/* ─────────────────────────────────────────
   MOUSE PARALLAX
───────────────────────────────────────── */
function useParallax(sceneRef: React.RefObject<HTMLDivElement | null>) {
    useEffect(() => {
        let mx = 0, my = 0, cx = 0, cy = 0, rafId = 0;
        const onMove = (e: MouseEvent) => {
            mx = (e.clientX / window.innerWidth - 0.5) * 10;
            my = (e.clientY / window.innerHeight - 0.5) * 6;
        };
        window.addEventListener("mousemove", onMove);
        const tick = () => {
            cx += (mx - cx) * 0.06;
            cy += (my - cy) * 0.06;
            if (sceneRef.current) {
                sceneRef.current.style.transform =
                    `perspective(1000px) rotateY(${cx * 0.3}deg) rotateX(${-cy * 0.3}deg) translateZ(0)`;
            }
            rafId = requestAnimationFrame(tick);
        };
        tick();
        return () => { cancelAnimationFrame(rafId); window.removeEventListener("mousemove", onMove); };
    }, [sceneRef]);
}

/* ─────────────────────────────────────────
   TOAST
───────────────────────────────────────── */
function ToastNotification({ toast, onDone }: { toast: Toast | null; onDone: () => void }) {
    const [phase, setPhase] = useState<"in" | "out" | "hidden">("hidden");

    useEffect(() => {
        if (!toast) return;
        setPhase("in");
        const t1 = setTimeout(() => setPhase("out"), 2800);
        const t2 = setTimeout(() => { setPhase("hidden"); onDone(); }, 3200);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [toast, onDone]);

    if (!toast || phase === "hidden") return null;
    const isSuccess = toast.type === "success";

    return (
        <div
            className={`nexus-toast-${phase === "in" ? "in" : "out"}`}
            style={{
                position: "fixed", top: 24, right: 24, zIndex: 1000,
                background: "rgba(8,10,22,0.92)",
                backdropFilter: "blur(20px)",
                border: `1px solid ${isSuccess ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)"}`,
                borderRadius: 12, padding: "12px 16px",
                display: "flex", alignItems: "center", gap: 10,
                fontSize: 14, color: "#f0f4ff",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
        >
            <span style={{
                width: 18, height: 18,
                background: isSuccess ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)",
                borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                color: isSuccess ? "#34d399" : "#f87171", fontSize: 11,
            }}>
                {isSuccess ? "✓" : "✕"}
            </span>
            {toast.msg}
        </div>
    );
}

/* ─────────────────────────────────────────
   SOCIAL BUTTON
───────────────────────────────────────── */
function SocialBtn({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="nexus-social"
            style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                padding: "11px 0", borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)",
                cursor: "pointer", fontSize: 13.5, fontWeight: 500,
                color: "rgba(200,210,240,0.75)",
                transition: "all 0.22s cubic-bezier(0.4,0,0.2,1)",
                fontFamily: "'DM Sans',sans-serif",
            }}
        >
            {icon}
            {label}
        </button>
    );
}

/* ─────────────────────────────────────────
   FIELD
───────────────────────────────────────── */
interface FieldProps {
    id: string; label: string; type?: string;
    value: string; onChange: (v: string) => void;
    error?: string; placeholder?: string;
    delay?: string; suffix?: React.ReactNode;
}
function Field({
    id,
    label,
    type = "text",
    value,
    onChange,
    error,
    placeholder,
    delay,
    suffix
}: FieldProps) {
    return (
        <div
            className="nexus-fade-up"
            style={{
                marginBottom: 20,
                animationDelay: delay || "0s"
            }}
        >
            <label
                htmlFor={id}
                style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(220,230,255,0.6)",
                    marginBottom: 10,
                }}
            >
                {label}
            </label>

            <div
                style={{
                    position: "relative",
                    borderRadius: 999,
                    overflow: "hidden",
                    backdropFilter: "blur(14px)",
                    background:
                        "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
                    border: error
                        ? "1px solid rgba(248,113,113,0.5)"
                        : "1px solid rgba(255,255,255,0.12)",
                    boxShadow: error
                        ? "0 0 0 4px rgba(248,113,113,0.08)"
                        : "0 8px 32px rgba(0,0,0,0.25)",
                    transition: "all .3s ease",
                }}
            >
                <input
                    id={id}
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    autoComplete={
                        type === "email"
                            ? "email"
                            : "current-password"
                    }
                    className={`nexus-input${error ? " error" : ""}`}
                    style={{
                        width: "100%",
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        padding: suffix
                            ? "16px 54px 16px 24px"
                            : "16px 24px",
                        fontSize: 15,
                        color: "#f8fbff",
                        fontWeight: 500,
                        fontFamily: "'DM Sans', sans-serif",
                    }}
                />

                {suffix && (
                    <div
                        style={{
                            position: "absolute",
                            right: 18,
                            top: "50%",
                            transform: "translateY(-50%)",
                            display: "flex",
                            alignItems: "center",
                            color: "rgba(255,255,255,0.55)",
                        }}
                    >
                        {suffix}
                    </div>
                )}
            </div>

            {error && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 8,
                        paddingLeft: 4,
                        fontSize: 12,
                        color: "#f87171",
                    }}
                >
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>

                    {error}
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function Login() {
    const login = useAuthStore(s => s.login);
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<FieldError>({});
    const [toast, setToast] = useState<Toast | null>(null);
    const [activeSlide, setActiveSlide] = useState(0);

    // Autoplay slideshow
    useEffect(() => {
        const timer = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % slides.length);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    const sceneRef = useRef<HTMLDivElement>(null);
    useParallax(sceneRef);

    // Inject global CSS once and keep it updated
    useEffect(() => {
        const id = "nexus-global-css";
        let style = document.getElementById(id) as HTMLStyleElement;
        if (!style) {
            style = document.createElement("style");
            style.id = id;
            document.head.appendChild(style);
        }
        style.textContent = GLOBAL_CSS;
    }, []);

    const validate = (): boolean => {
        const errs: FieldError = {};
        if (!email) errs.email = "Vui lòng nhập email!";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Email không hợp lệ!";
        if (!password) errs.password = "Vui lòng nhập mật khẩu!";
        else if (password.length < 6) errs.password = "Mật khẩu ít nhất 6 ký tự!";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            setLoading(true);
            await login({ email, password } as LoginRequestDto);
            setToast({ msg: "Đăng nhập thành công! Đang chuyển hướng...", type: "success" });
            setTimeout(() => navigate("/dashboard"), 1000);
        } catch {
            setToast({ msg: "Sai email hoặc mật khẩu!", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const clearToast = useCallback(() => setToast(null), []);

    return (
        <div
            className="nexus-root"
            style={{
                minHeight: "100vh",
                width: "100%",
                background: "#03030a",
                display: "flex",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* ── TOAST ── */}
            <ToastNotification toast={toast} onDone={clearToast} />

            {/* ── LEFT PANEL (SLIDESHOW - DESKTOP ONLY) ── */}
            <div className="nexus-slideshow-panel">
                {/* Render all slides at once to avoid lag when changing slides */}
                {slides.map((slide, index) => (
                    <div
                        key={index}
                        style={{
                            position: "absolute",
                            inset: 0,
                            opacity: activeSlide === index ? 1 : 0,
                            transition: "opacity 1.2s ease-in-out",
                            zIndex: activeSlide === index ? 1 : 0,
                        }}
                    >
                        <video
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                pointerEvents: "none",
                            }}
                            src={slide.video}
                            autoPlay
                            loop
                            muted
                            playsInline
                        />
                        {/* Dark Overlay Inside Slide */}
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: "linear-gradient(to bottom, rgba(3,3,10,0.2) 0%, rgba(3,3,10,0.88) 100%)",
                            }}
                        />
                    </div>
                ))}

                {/* Overlays */}
                <div className="nexus-vignette" style={{ zIndex: 2 }} />
                <div className="nexus-grid-bg" style={{ zIndex: 3 }} />

                {/* Slide Content Overlay */}
                <div
                    className="nexus-slideshow-text"
                    style={{
                        position: "absolute",
                        bottom: 80,
                        left: 60,
                        right: "auto",
                        width: "calc(50vw - 320px)",
                        maxWidth: 450,
                        minWidth: 260,
                        zIndex: 10,
                    }}
                >
                    {/* Slide Dots */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveSlide(index)}
                                style={{
                                    height: 4,
                                    borderRadius: 2,
                                    border: "none",
                                    background: activeSlide === index ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.2)",
                                    width: activeSlide === index ? 40 : 16,
                                    cursor: "pointer",
                                    transition: "all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)",
                                }}
                            />
                        ))}
                    </div>

                    {/* Animated Text Block */}
                    <div key={activeSlide} className="nexus-fade-up">
                        <h2
                            className="nexus-syne"
                            style={{
                                fontSize: 32,
                                fontWeight: 700,
                                color: "#fff",
                                marginBottom: 16,
                                letterSpacing: "-0.02em",
                            }}
                        >
                            {slides[activeSlide].title}
                        </h2>
                        <p
                            style={{
                                fontSize: 16,
                                lineHeight: "1.65",
                                color: "rgba(200,210,240,0.72)",
                                maxWidth: 520,
                                fontWeight: 400,
                            }}
                        >
                            {slides[activeSlide].description}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── RIGHT PANEL (LOGIN FORM) ── */}
            <div className="nexus-login-panel">
                {/* SCENE (parallax container) */}
                <div
                    ref={sceneRef}
                    style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 460, padding: "24px 0" }}
                >
                    {/* CARD */}
                    <div
                        className="nexus-card"
                        style={{
                            background: "transparent",
                            backdropFilter: "blur(20px) saturate(180%)",
                            WebkitBackdropFilter: "blur(20px) saturate(180%)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: 24,
                            padding: "44px 44px 36px",
                            position: "relative",
                            overflow: "hidden",
                            boxShadow: [
                                "0 0 0 1px rgba(255,255,255,0.04) inset",
                                "0 32px 64px rgba(0,0,0,0.6)",
                                "0 16px 32px rgba(0,0,0,0.4)",
                                "0 0 80px rgba(59,130,246,0.05)",
                            ].join(","),
                        }}
                    >
                        {/* Card inner shimmer */}
                        <div style={{
                            position: "absolute", inset: 0, pointerEvents: "none", borderRadius: "inherit",
                            background: "linear-gradient(135deg,rgba(99,179,237,0.05) 0%,transparent 50%,rgba(139,92,246,0.04) 100%)",
                        }} />
                        {/* Neon top-edge line */}
                        <div style={{
                            position: "absolute", top: 0, left: "10%", right: "10%", height: 1,
                            background: "linear-gradient(90deg,transparent,rgba(99,179,237,0.55),rgba(139,92,246,0.55),transparent)",
                        }} />





                        {/* ── FORM ── */}
                        <form onSubmit={handleSubmit} noValidate>
                            <Field
                                id="email" label="Email" type="email"
                                value={email}
                                onChange={v => { setEmail(v); if (errors.email) setErrors(p => ({ ...p, email: undefined })); }}
                                error={errors.email} placeholder="you@company.com" delay="0.2s"
                            />

                            <Field
                                id="password" label="Mật khẩu" type={showPwd ? "text" : "password"}
                                value={password}
                                onChange={v => { setPassword(v); if (errors.password) setErrors(p => ({ ...p, password: undefined })); }}
                                error={errors.password} placeholder="••••••••••" delay="0.28s"
                                suffix={
                                    <button
                                        type="button"
                                        onClick={() => setShowPwd(s => !s)}
                                        aria-label={showPwd ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                        style={{
                                            background: "none", border: "none", cursor: "pointer", padding: 4,
                                            color: "rgba(200,210,240,0.5)", display: "flex", alignItems: "center",
                                            transition: "color 0.2s",
                                        }}
                                    >
                                        {showPwd ? (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                }
                            />



                            {/* Login button */}
                            <div className="nexus-fade-up" style={{ animationDelay: "0.42s" }}>
                                <button
                                    type="submit" disabled={loading}
                                    className="nexus-btn-login"
                                    style={{
                                        width: "100%", padding: "14px 0", borderRadius: 30, border: "none",
                                        cursor: loading ? "not-allowed" : "pointer",
                                        fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 600,
                                        color: "#fff", letterSpacing: "0.02em",
                                        background: "linear-gradient(135deg,#2563eb 0%,#4f46e5 50%,#7c3aed 100%)",
                                        transition: "transform 0.2s,box-shadow 0.3s",
                                        boxShadow: "0 4px 24px rgba(59,130,246,0.28),0 2px 8px rgba(0,0,0,0.3)",
                                        opacity: loading ? 0.8 : 1,
                                    }}
                                >
                                    {loading
                                        ? <div className="nexus-spinner" style={{ margin: "0 auto" }} />
                                        : "Đăng nhập"
                                    }
                                </button>
                            </div>
                        </form>






                    </div>
                </div>
            </div>
        </div>
    );
}