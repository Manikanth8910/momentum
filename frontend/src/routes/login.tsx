import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Momentum | Professional Login" },
      { name: "description", content: "Access your Momentum dashboard." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Parallax mouse movement tracking
  const shape1Ref = useRef<HTMLDivElement>(null);
  const shape2Ref = useRef<HTMLDivElement>(null);
  const shape3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticked = false;
    let mouseX = 0;
    let mouseY = 0;

    const updateParallax = () => {
      if (window.innerWidth >= 768) {
        const s1 = shape1Ref.current;
        const s2 = shape2Ref.current;
        const s3 = shape3Ref.current;
        if (s1) s1.style.transform = `rotate(15deg) translate(${mouseX * 15}px, ${mouseY * 15}px)`;
        if (s2) s2.style.transform = `translate(${mouseX * 30}px, ${mouseY * 30}px)`;
        if (s3) s3.style.transform = `skewX(-20deg) translate(${mouseX * 45}px, ${mouseY * 45}px)`;
      }
      ticked = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX / window.innerWidth - 0.5;
      mouseY = e.clientY / window.innerHeight - 0.5;

      if (!ticked) {
        window.requestAnimationFrame(updateParallax);
        ticked = true;
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const [loginError, setLoginError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError("");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("token", data.data.token);
        setIsLoading(false);
        setIsSuccess(true);
        setTimeout(() => {
          navigate({ to: "/dashboard" });
        }, 500);
      } else {
        setIsLoading(false);
        setLoginError(data.message || "Invalid email or password");
      }
    } catch (err: any) {
      setIsLoading(false);
      setLoginError("Could not connect to server. Please try again.");
    }
  };

  // Google OAuth Token Callback
  const handleCredentialResponse = async (response: any) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: response.credential }),
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem("token", data.data.token);
        setIsLoading(false);
        setIsSuccess(true);
        setTimeout(() => {
          navigate({ to: "/dashboard" });
        }, 500);
      } else {
        setIsLoading(false);
        setLoginError("Google Auth failed: " + data.message);
      }
    } catch (err: any) {
      setIsLoading(false);
      setLoginError("Error connecting to backend: " + err.message);
    }
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      const { google } = window as any;
      if (google) {
        google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
          callback: handleCredentialResponse,
        });
        google.accounts.id.renderButton(
          document.getElementById("google-signin-button"),
          { theme: "outline", size: "large", width: 352, text: "continue_with" }
        );
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="flex flex-col md:flex-row min-h-screen overflow-y-auto md:overflow-hidden bg-surface-container-lowest text-on-surface">
      {/* Left Side: Abstract 2D Composition */}
      <div className="hidden md:flex w-1/2 bg-[#004ac6] relative overflow-hidden items-center justify-center p-12">
        <div
          ref={shape1Ref}
          className="absolute opacity-15 mix-blend-overlay border border-white w-[80%] h-[80%] top-[-10%] left-[-10%] rotate-[15deg] transition-transform duration-100 ease-out will-change-transform"
        ></div>
        <div
          ref={shape2Ref}
          className="absolute opacity-15 mix-blend-overlay bg-gradient-to-br from-white/20 to-transparent w-[60%] h-[60%] bottom-[-5%] right-[-5%] rounded-full transition-transform duration-100 ease-out will-change-transform"
        ></div>
        <div
          ref={shape3Ref}
          className="absolute opacity-15 mix-blend-overlay border-l border-white w-[40%] h-full left-[20%] top-0 -skew-x-[20deg] transition-transform duration-100 ease-out will-change-transform"
        ></div>
        <div className="relative z-10 max-w-md">
          <h2 className="text-white font-bold text-5xl mb-6 leading-none tracking-tight">
            Precision in Every Pixel.
          </h2>
          <div className="w-16 h-1 bg-white mb-6"></div>
          <p className="text-white/80 text-lg leading-relaxed">
            Experience the next evolution of productivity software. Momentum is built for high-performance teams who value speed, clarity, and structural integrity.
          </p>
        </div>
        <div className="absolute bottom-8 left-8 flex items-center space-x-2 opacity-50">
          <span className="text-white text-xs tracking-widest uppercase font-semibold">
            Momentum Design System v2.4
          </span>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <main className="w-full md:w-1/2 bg-surface-container-lowest flex items-center justify-center px-6 py-12 min-h-screen md:min-h-0 overflow-y-auto">
        <div className="w-full max-w-[400px]">
          {/* Logo Section */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-[#004ac6] rounded flex items-center justify-center" aria-hidden="true">
                <span className="material-symbols-outlined text-white text-[20px] font-fill-1">
                  change_history
                </span>
              </div>
              <span className="text-2xl font-bold text-[#004ac6]">Momentum</span>
            </div>
            <h1 className="text-3xl font-bold text-on-surface mb-1">Welcome back</h1>
            <p className="text-sm text-on-surface-variant">
              Please enter your credentials to access your dashboard.
            </p>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant" htmlFor="email">
                Email Address
              </label>
              <div className="relative flex items-center border border-outline-variant rounded-lg bg-white transition-all overflow-hidden focus-within:border-[#004ac6] focus-within:ring-2 focus-within:ring-[#004ac6]/10">
                <span className="material-symbols-outlined absolute left-4 text-outline text-[20px]" aria-hidden="true">
                  mail
                </span>
                <input
                  className="w-full pl-12 pr-4 py-3 bg-transparent border-none focus:ring-0 text-sm text-on-surface outline-none"
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-surface-variant" htmlFor="password">
                  Password
                </label>
                <a className="text-xs font-medium text-[#004ac6] hover:underline transition-all" href="#">
                  Forgot password?
                </a>
              </div>
              <div className="relative flex items-center border border-outline-variant rounded-lg bg-white transition-all overflow-hidden focus-within:border-[#004ac6] focus-within:ring-2 focus-within:ring-[#004ac6]/10">
                <span className="material-symbols-outlined absolute left-4 text-outline text-[20px]" aria-hidden="true">
                  lock
                </span>
                <input
                  className="w-full pl-12 pr-12 py-3 bg-transparent border-none focus:ring-0 text-sm text-on-surface outline-none"
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className="absolute right-4 text-outline hover:text-on-surface transition-colors"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-controls="password"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-2 pt-1">
              <input
                className="w-4 h-4 rounded border-outline-variant text-[#004ac6] focus:ring-[#004ac6]/20"
                id="remember"
                type="checkbox"
              />
              <label className="text-sm text-on-surface-variant select-none cursor-pointer" htmlFor="remember">
                Stay signed in for 30 days
              </label>
            </div>

            {/* Action Button */}
            <button
              className={`w-full text-white font-semibold text-sm py-4 rounded-lg flex items-center justify-center space-x-2 mt-6 transition-all ${
                isSuccess
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-[#004ac6] hover:bg-[#004ac6]/90 active:scale-[0.98]"
              }`}
              type="submit"
              disabled={isLoading || isSuccess}
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : isSuccess ? (
                <>
                  <span className="material-symbols-outlined text-[20px]">check</span>
                  <span>Signed In</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>

            {/* Error message */}
            {loginError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mt-2">
                <span className="material-symbols-outlined text-[18px] text-red-500">error</span>
                {loginError}
              </div>
            )}
          </form>

          {/* Divider */}
          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-outline-variant"></div>
            <span className="flex-shrink mx-4 text-xs font-semibold text-outline">or</span>
            <div className="flex-grow border-t border-outline-variant"></div>
          </div>

          {/* Google Sign-In Button */}
          <div className="flex justify-center">
            <div id="google-signin-button"></div>
          </div>

          {/* Footer Section */}
          <div className="mt-12 pt-6 border-t border-outline-variant">
            <p className="text-sm text-on-surface-variant text-center">
              Don't have an account?{" "}
              <a className="text-[#004ac6] font-bold hover:underline" href="#">
                Request Access
              </a>
            </p>
            <div className="mt-6 flex justify-center space-x-6">
              <a className="text-xs text-outline hover:text-on-surface transition-colors" href="#">
                Privacy Policy
              </a>
              <a className="text-xs text-outline hover:text-on-surface transition-colors" href="#">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
