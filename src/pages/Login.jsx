import { useState } from "react";
import pemkab from "../assets/images/pemkab.jpg";

function Login() {
  // =========================
  // PASSWORD
  // =========================
  const [showPassword, setShowPassword] = useState(false);

  // =========================
  // CAPTCHA
  // =========================
  const generateCaptcha = () => {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let result = "";

    for (let i = 0; i < 5; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }

    return result;
  };

  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState("");

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaInput("");
    setCaptchaError("");
  };

  // =========================
  // LOGIN
  // =========================
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!captchaInput.trim()) {
      setCaptchaError("Silakan masukkan kode CAPTCHA.");
      return;
    }

    if (captchaInput.toUpperCase() !== captcha) {
      setCaptchaError("Kode CAPTCHA tidak sesuai.");
      setCaptcha(generateCaptcha());
      setCaptchaInput("");
      return;
    }

    setCaptchaError("");

    console.log("Login berhasil melewati CAPTCHA");

    // Proses login/backend bisa ditambahkan di sini.
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">

      {/* =====================================================
          BACKGROUND IMAGE
      ====================================================== */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{
          backgroundImage: `url(${pemkab})`,
        }}
      ></div>

      {/* =====================================================
          BLUE OVERLAY
      ====================================================== */}
      <div className="absolute inset-0 bg-[#001f3f]/65"></div>

      {/* =====================================================
          SUBTLE DARK OVERLAY
      ====================================================== */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#001f3f]/20 via-transparent to-[#000b18]/30"></div>


      {/* =====================================================
          LOGIN CARD
      ====================================================== */}
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-8 md:p-10">

        {/* ===================================================
            HEADER / LOGO
        ==================================================== */}
        <div className="text-center mb-8">

          {/* Logo */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">

            <span className="material-symbols-outlined text-blue-900 text-3xl">
              account_balance
            </span>

          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            E-SAKIP KOMINFO
          </h1>

          {/* Description */}
          <p className="text-sm text-slate-500 mt-1">
            Sistem Akuntabilitas Kinerja Instansi Pemerintah
          </p>

        </div>


        {/* ===================================================
            LOGIN FORM
        ==================================================== */}
        <form
          className="space-y-6"
          onSubmit={handleSubmit}
        >

          {/* =================================================
              USERNAME
          ================================================== */}
          <div>

            <label
              htmlFor="username"
              className="block text-sm font-semibold text-slate-700 mb-2"
            >
              Username
            </label>

            <div className="relative">

              {/* User Icon */}
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                person
              </span>

              {/* Input */}
              <input
                type="text"
                id="username"
                name="username"
                placeholder="Masukkan username"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all"
              />

            </div>

          </div>


          {/* =================================================
              PASSWORD
          ================================================== */}
          <div>

            <label
              htmlFor="password"
              className="block text-sm font-semibold text-slate-700 mb-2"
            >
              Password
            </label>

            <div className="relative">

              {/* Lock Icon */}
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                lock
              </span>

              {/* Password Input */}
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Masukkan password"
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all"
              />

              {/* Show / Hide Password */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                <span className="material-symbols-outlined text-xl">
                  {showPassword ? "visibility" : "visibility_off"}
                </span>
              </button>

            </div>

          </div>


          {/* =================================================
              CAPTCHA
          ================================================== */}
          <div>

            <label
              htmlFor="captcha"
              className="block text-sm font-semibold text-slate-700 mb-2"
            >
              CAPTCHA
            </label>


            {/* CAPTCHA DISPLAY + REFRESH */}
            <div className="flex gap-3">

              {/* CAPTCHA Code */}
              <div className="flex-1 h-[48px] flex items-center justify-center rounded-lg border border-slate-200 bg-slate-100 select-none overflow-hidden">

                <span
                  className="text-xl font-bold tracking-[0.4em] text-[#002244] italic"
                  style={{
                    fontFamily: "monospace",
                    transform: "skew(-8deg)",
                  }}
                >
                  {captcha}
                </span>

              </div>


              {/* Refresh CAPTCHA */}
              <button
                type="button"
                onClick={refreshCaptcha}
                title="Refresh CAPTCHA"
                className="w-[48px] h-[48px] flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-[#002244] hover:bg-slate-50 transition-all"
              >
                <span className="material-symbols-outlined">
                  refresh
                </span>
              </button>

            </div>


            {/* CAPTCHA INPUT */}
            <div className="relative mt-3">

              {/* Security Icon */}
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                verified_user
              </span>

              {/* Input */}
              <input
                type="text"
                id="captcha"
                name="captcha"
                value={captchaInput}
                onChange={(e) => {
                  setCaptchaInput(e.target.value);
                  setCaptchaError("");
                }}
                placeholder="Masukkan kode CAPTCHA"
                autoComplete="off"
                className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all uppercase ${
                  captchaError
                    ? "border-red-400"
                    : "border-slate-200"
                }`}
              />

            </div>


            {/* CAPTCHA ERROR */}
            {captchaError && (
              <div className="flex items-center gap-1 mt-2">

                <span className="material-symbols-outlined text-red-500 text-sm">
                  error
                </span>

                <p className="text-xs text-red-500">
                  {captchaError}
                </p>

              </div>
            )}

          </div>


          {/* =================================================
              REMEMBER ME
          ================================================== */}
          <div className="flex items-center">

            <input
              type="checkbox"
              id="remember"
              className="w-4 h-4 text-blue-900 border-slate-300 rounded focus:ring-blue-900"
            />

            <label
              htmlFor="remember"
              className="ml-2 text-sm text-slate-600 cursor-pointer"
            >
              Ingat saya
            </label>

          </div>


          {/* =================================================
              LOGIN BUTTON
          ================================================== */}
          <button
            type="submit"
            className="w-full py-3.5 bg-[#002244] hover:bg-[#001a33] text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform active:scale-[0.98] transition-all"
          >
            Masuk
          </button>

        </form>


        {/* ===================================================
            FOOTER
        ==================================================== */}
        <div className="mt-10 pt-6 border-t border-slate-100 text-center">

          <p className="text-xs text-slate-400 uppercase tracking-widest">
            © 2026 KOMINFO
          </p>

        </div>

      </div>

    </div>
  );
}

export default Login;