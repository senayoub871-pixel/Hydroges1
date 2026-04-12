import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { Building2, IdCard, Lock, Mail, KeyRound, CheckCircle2, ArrowLeft, UserCheck } from "lucide-react";

type Screen = "login" | "forgot-verify" | "forgot-reset" | "forgot-success";

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
  }),
};

export default function LoginPage() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const companyNumber = "0125.6910.0681";

  const [screen, setScreen] = useState<Screen>("login");
  const [direction, setDirection] = useState(1);

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLogin, setForgotLogin] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifiedName, setVerifiedName] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const go = (next: Screen, dir: number) => {
    setDirection(dir);
    setScreen(next);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    const result = await login(companyNumber, userId, password);
    setLoginLoading(false);
    if (result.ok) {
      navigate("/inbox");
    } else {
      setLoginError(result.error || "Identifiant ou mot de passe incorrect.");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError("");
    setVerifyLoading(true);
    try {
      const res = await fetch("/api/auth/verify-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId: forgotLogin, email: forgotEmail }),
      });
      const body = await res.json();
      if (!res.ok) {
        setVerifyError(body.error || "Aucun compte ne correspond.");
      } else {
        setVerifiedName(body.name);
        setNewPassword("");
        setConfirmPassword("");
        setResetError("");
        go("forgot-reset", 1);
      }
    } catch {
      setVerifyError("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    if (newPassword !== confirmPassword) {
      setResetError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword.length < 6) {
      setResetError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setResetLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginId: forgotLogin,
          email: forgotEmail,
          newPassword,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setResetError(body.error || "Échec de la réinitialisation.");
      } else {
        go("forgot-success", 1);
      }
    } catch {
      setResetError("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      setResetLoading(false);
    }
  };

  const backToLogin = () => {
    setForgotEmail("");
    setForgotLogin("");
    setVerifyError("");
    setVerifiedName("");
    setNewPassword("");
    setConfirmPassword("");
    setResetError("");
    go("login", -1);
  };

  const isLoginScreen = screen === "login";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: "#c5c8e8" }}
    >
      <motion.div
        className="flex flex-col items-center mb-8"
        animate={{ scale: isLoginScreen ? 1 : 0.85, y: isLoginScreen ? 0 : -8, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
      >
        <img
          src="/logo.png"
          alt="HYDROGES Logo"
          className="object-contain mb-2"
          style={{ width: isLoginScreen ? "7rem" : "4.5rem", height: isLoginScreen ? "7rem" : "4.5rem", transition: "width 0.35s, height 0.35s" }}
        />
        <h1
          className="font-black tracking-widest"
          style={{ color: "#1e1b6b", fontSize: isLoginScreen ? "2.25rem" : "1.5rem", transition: "font-size 0.35s" }}
        >
          HYDROGES
        </h1>
      </motion.div>

      <div className="w-full max-w-sm px-4" style={{ minHeight: 320 }}>
        <AnimatePresence mode="wait" custom={direction}>

          {screen === "login" && (
            <motion.div
              key="login"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: "easeInOut" }}
            >
              {loginError && (
                <div className="mb-4 p-3 rounded-xl text-sm text-red-700 bg-red-100 border border-red-200">
                  {loginError}
                </div>
              )}
              <form onSubmit={handleLogin} className="space-y-0">
                <div className="hydroges-input-group">
                  <div className="hydroges-input-icon"><Building2 className="w-5 h-5" /></div>
                  <input
                    type="text"
                    value={companyNumber}
                    readOnly
                    className="hydroges-input-field"
                    style={{ cursor: "default", userSelect: "none" }}
                  />
                </div>
                <div className="hydroges-input-group">
                  <div className="hydroges-input-icon"><IdCard className="w-5 h-5" /></div>
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="ID d'utilisateur"
                    className="hydroges-input-field"
                    required
                  />
                </div>
                <div className="hydroges-input-group">
                  <div className="hydroges-input-icon"><Lock className="w-5 h-5" /></div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Saisir votre mot de passe"
                    className="hydroges-input-field"
                    required
                  />
                </div>

                <div className="flex justify-end mb-3">
                  <button
                    type="button"
                    onClick={() => go("forgot-verify", 1)}
                    className="text-xs font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity"
                    style={{ color: "#1e1b6b" }}
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                <p className="text-center text-sm mb-4" style={{ color: "#1e1b6b" }}>
                  Vous n'avez pas de compte ?{" "}
                  <a href="/register" className="font-bold underline" style={{ color: "#1e1b6b" }}>
                    CRÉER UN COMPTE
                  </a>
                </p>

                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="hydroges-btn px-10 py-3 text-lg"
                    style={{ opacity: loginLoading ? 0.7 : 1 }}
                  >
                    {loginLoading ? "Connexion..." : "CONNEXION →"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {screen === "forgot-verify" && (
            <motion.div
              key="forgot-verify"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: "easeInOut" }}
            >
              <div className="bg-white/60 rounded-2xl p-6 shadow-md">
                <button
                  type="button"
                  onClick={backToLogin}
                  className="flex items-center gap-1 text-xs font-semibold mb-4 hover:opacity-70 transition-opacity"
                  style={{ color: "#1e1b6b" }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Retour
                </button>

                <div className="flex flex-col items-center mb-5">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                    style={{ background: "#e8e6f4" }}
                  >
                    <UserCheck className="w-6 h-6" style={{ color: "#5b4d90" }} />
                  </div>
                  <h2 className="text-base font-black text-center" style={{ color: "#1e1b6b" }}>
                    MOT DE PASSE OUBLIÉ
                  </h2>
                  <p className="text-xs text-center mt-1" style={{ color: "#1e1b6b", opacity: 0.65 }}>
                    Étape 1 sur 2 — Vérification de votre identité
                  </p>
                </div>

                {verifyError && (
                  <div className="mb-3 p-3 rounded-xl text-sm text-red-700 bg-red-100 border border-red-200">
                    {verifyError}
                  </div>
                )}

                <form onSubmit={handleVerify}>
                  <div className="hydroges-input-group">
                    <div className="hydroges-input-icon"><Mail className="w-5 h-5" /></div>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Adresse email"
                      className="hydroges-input-field"
                      required
                    />
                  </div>
                  <div className="hydroges-input-group">
                    <div className="hydroges-input-icon"><IdCard className="w-5 h-5" /></div>
                    <input
                      type="text"
                      value={forgotLogin}
                      onChange={(e) => setForgotLogin(e.target.value)}
                      placeholder="Nom d'utilisateur"
                      className="hydroges-input-field"
                      required
                    />
                  </div>
                  <div className="flex justify-center mt-2">
                    <button
                      type="submit"
                      disabled={verifyLoading}
                      className="hydroges-btn px-8 py-2.5"
                      style={{ opacity: verifyLoading ? 0.7 : 1 }}
                    >
                      {verifyLoading ? "Vérification..." : "VÉRIFIER →"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {screen === "forgot-reset" && (
            <motion.div
              key="forgot-reset"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: "easeInOut" }}
            >
              <div className="bg-white/60 rounded-2xl p-6 shadow-md">
                <button
                  type="button"
                  onClick={() => go("forgot-verify", -1)}
                  className="flex items-center gap-1 text-xs font-semibold mb-4 hover:opacity-70 transition-opacity"
                  style={{ color: "#1e1b6b" }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Retour
                </button>

                <div className="flex flex-col items-center mb-5">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                    style={{ background: "#e8f4ed" }}
                  >
                    <CheckCircle2 className="w-6 h-6" style={{ color: "#2e7d52" }} />
                  </div>
                  <h2 className="text-base font-black text-center" style={{ color: "#1e1b6b" }}>
                    IDENTITÉ VÉRIFIÉE
                  </h2>
                  <p className="text-sm font-semibold mt-1" style={{ color: "#5b4d90" }}>
                    Bonjour, {verifiedName}
                  </p>
                  <p className="text-xs text-center mt-1" style={{ color: "#1e1b6b", opacity: 0.65 }}>
                    Étape 2 sur 2 — Choisissez un nouveau mot de passe
                  </p>
                </div>

                {resetError && (
                  <div className="mb-3 p-3 rounded-xl text-sm text-red-700 bg-red-100 border border-red-200">
                    {resetError}
                  </div>
                )}

                <form onSubmit={handleReset}>
                  <div className="hydroges-input-group">
                    <div className="hydroges-input-icon"><KeyRound className="w-5 h-5" /></div>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nouveau mot de passe"
                      className="hydroges-input-field"
                      required
                    />
                  </div>
                  <div className="hydroges-input-group">
                    <div className="hydroges-input-icon"><Lock className="w-5 h-5" /></div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirmer le mot de passe"
                      className="hydroges-input-field"
                      required
                    />
                  </div>
                  <div className="flex justify-center mt-2">
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="hydroges-btn px-8 py-2.5"
                      style={{ opacity: resetLoading ? 0.7 : 1 }}
                    >
                      {resetLoading ? "Réinitialisation..." : "RÉINITIALISER →"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {screen === "forgot-success" && (
            <motion.div
              key="forgot-success"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: "easeInOut" }}
            >
              <div className="bg-white/60 rounded-2xl p-8 shadow-md flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 220, damping: 14 }}
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ background: "#e8f4ed" }}
                >
                  <CheckCircle2 className="w-9 h-9" style={{ color: "#2e7d52" }} />
                </motion.div>

                <h2 className="text-base font-black mb-2" style={{ color: "#1e1b6b" }}>
                  MOT DE PASSE MODIFIÉ
                </h2>
                <p className="text-sm mb-6" style={{ color: "#1e1b6b", opacity: 0.7 }}>
                  Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.
                </p>

                <button
                  onClick={backToLogin}
                  className="hydroges-btn px-8 py-2.5"
                >
                  SE CONNECTER →
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
