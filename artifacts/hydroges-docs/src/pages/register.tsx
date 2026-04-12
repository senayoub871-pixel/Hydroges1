import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { ChevronDown } from "lucide-react";
import { ORGANIGRAMME, getPostesForService } from "@/lib/organigramme";

interface FieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function Field({ label, name, type = "text", value, onChange }: FieldProps) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span
        className="w-52 shrink-0 font-bold text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white/70 text-center"
        style={{ color: "#1e1b6b" }}
      >
        {label}
      </span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className="flex-1 px-4 py-2 rounded-xl border border-gray-200 bg-white/80 text-sm outline-none"
        style={{ color: "#1e1b6b" }}
        required
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
}

function SelectField({ label, value, onChange, options, placeholder = "Sélectionner...", disabled }: SelectFieldProps) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span
        className="w-52 shrink-0 font-bold text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white/70 text-center"
        style={{ color: "#1e1b6b" }}
      >
        {label}
      </span>
      <div className="relative flex-1">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required
          className="w-full appearance-none px-4 py-2 pr-9 rounded-xl border border-gray-200 bg-white/80 text-sm outline-none cursor-pointer"
          style={{
            color: value ? "#1e1b6b" : "#9ca3af",
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <option value="" disabled hidden>{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt} style={{ color: "#1e1b6b" }}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: "#5b4d90" }}
        />
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    poste: "",
    service: "",
    email: "",
    userId: "",
    password: "",
    confirmPassword: "",
    signature: null as File | null,
    acceptTerms: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "file") {
      setForm((f) => ({ ...f, signature: files?.[0] || null }));
    } else if (type === "checkbox") {
      setForm((f) => ({ ...f, [name]: checked }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleServiceChange = (val: string) => {
    setForm((f) => ({ ...f, service: val, poste: "" }));
  };

  const handlePosteChange = (val: string) => {
    setForm((f) => ({ ...f, poste: val }));
  };

  const postesForService = getPostesForService(form.service);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.service) { setError("Veuillez sélectionner un service."); return; }
    if (!form.poste) { setError("Veuillez sélectionner un poste."); return; }
    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (!form.acceptTerms) {
      setError("Vous devez accepter les conditions générales.");
      return;
    }
    setLoading(true);

    let signatureImage: string | undefined;
    if (form.signature) {
      signatureImage = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(form.signature!);
      });
    }

    const result = await register({
      nom: form.nom,
      prenom: form.prenom,
      poste: form.poste,
      service: form.service,
      email: form.email,
      userId: form.userId,
      password: form.password,
      signatureImage,
    });
    setLoading(false);
    if (result.ok) {
      navigate("/inbox");
    } else {
      setError(result.error || "Inscription échouée.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#c5c8e8" }}>
      <div className="flex items-center gap-3 p-4 bg-white/60 border-b border-gray-200">
        <img src="/logo.png" alt="HYDROGES" className="w-10 h-10 object-contain" />
        <span className="text-xl font-black" style={{ color: "#1e1b6b" }}>HYDROGES</span>
      </div>

      <div className="flex-1 flex items-center justify-center py-8 px-4">
        <div className="w-full max-w-xl bg-white/60 rounded-2xl p-8 shadow-md">
          <h2 className="text-2xl font-black mb-6 text-center tracking-wide" style={{ color: "#1e1b6b" }}>
            ENREGISTRER UN COMPTE
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm text-red-700 bg-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Field label="Nom" name="nom" value={form.nom} onChange={handleChange} />
            <Field label="Prénom" name="prenom" value={form.prenom} onChange={handleChange} />

            <SelectField
              label="Service"
              value={form.service}
              onChange={handleServiceChange}
              options={ORGANIGRAMME.map((s) => s.label)}
              placeholder="Sélectionner un service..."
            />

            <SelectField
              label="Poste"
              value={form.poste}
              onChange={handlePosteChange}
              options={postesForService}
              placeholder={form.service ? "Sélectionner un poste..." : "Choisissez d'abord un service"}
              disabled={!form.service}
            />

            <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} />
            <Field label="Nom d'utilisateur" name="userId" value={form.userId} onChange={handleChange} />
            <Field label="Mot de passe" name="password" type="password" value={form.password} onChange={handleChange} />
            <Field
              label="Confirmer le mot de passe"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
            />

            <div className="flex items-center gap-3 mb-4">
              <span
                className="w-52 shrink-0 text-right font-bold text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white/70"
                style={{ color: "#1e1b6b" }}
              >
                Votre signature
              </span>
              <label className="hydroges-btn text-sm py-2 px-4 cursor-pointer">
                Joindre +
                <input
                  type="file"
                  name="signature"
                  onChange={handleChange}
                  className="hidden"
                  accept="image/*"
                />
              </label>
              {form.signature && (
                <span className="text-xs text-green-700">{form.signature.name}</span>
              )}
            </div>

            <label className="flex items-start gap-3 mb-6 cursor-pointer">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={form.acceptTerms}
                onChange={handleChange}
                className="mt-1 w-4 h-4"
              />
              <span className="text-sm" style={{ color: "#1e1b6b" }}>
                Pour terminer votre inscription, vous devez lire et accepter{" "}
                <span className="font-bold underline">nos conditions générales</span>
              </span>
            </label>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="hydroges-btn px-10 py-3 text-lg"
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Inscription..." : "INSCRIPTION →"}
              </button>
            </div>
          </form>

          <p className="text-center text-sm mt-4" style={{ color: "#1e1b6b" }}>
            Déjà un compte ?{" "}
            <a href="/login" className="font-bold underline">SE CONNECTER</a>
          </p>
        </div>
      </div>
    </div>
  );
}
