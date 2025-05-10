"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, FormEvent, useRef, useEffect } from "react";
import ClientOnly from "@/components/ClientOnly";
import { useAuthRedirect } from "@/app/hooks/useAuthRedirect";

export default function RegisterPage() {
  const router = useRouter();
  
  // Use our custom hook to handle authentication redirects
  useAuthRedirect();
  
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [animationActive, setAnimationActive] = useState(false);

  useEffect(() => {
    // Activate animations after component mounts
    setAnimationActive(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.username || !formData.password || !formData.confirmPassword) {
      setError("Semua field harus diisi");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Password dan konfirmasi password tidak sama");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Password minimal 6 karakter");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form
    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch("/api/auth/simple-register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Terjadi kesalahan saat mendaftar");
        return;
      }

      // Registration successful
      router.push("/login?registered=true");
    } catch (err) {
      console.error("Registration error:", err);
      setError("Terjadi kesalahan saat mendaftar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container brutalism-bg brutalism-dots brutalism-noise">
      {/* Background shapes */}
      <div className="bg-shapes">
        <div className="bg-shape bg-shape-1"></div>
        <div className="bg-shape bg-shape-3"></div>
        <div className="bg-shape bg-shape-5"></div>
        <div className="bg-dots"></div>
      </div>

      {/* Register Card */}
      <ClientOnly fallback={
        <div className="auth-card" style={{ maxWidth: "500px", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div>Loading...</div>
        </div>
      }>
        <div className={`auth-card register-card-animation ${animationActive ? 'animate-active' : ''}`} style={{ maxWidth: "500px" }}>
          <div className="auth-header stagger-item">
            <h1>Daftar Akun Baru</h1>
            <p>Buat akun untuk menggunakan POS Vougher</p>
          </div>
          
          {error && (
            <div className="error-alert stagger-item">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} ref={formRef}>
            <div className="input-wrapper stagger-item">
              <label className="input-label" htmlFor="name">Nama Lengkap</label>
              <input 
                className="input-field"
                id="name" 
                name="name" 
                type="text" 
                placeholder="Masukkan nama lengkap Anda" 
                required 
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            
            <div className="input-wrapper stagger-item">
              <label className="input-label" htmlFor="username">Username</label>
              <input 
                className="input-field"
                id="username" 
                name="username" 
                type="text" 
                placeholder="Masukkan username Anda" 
                required 
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            
            <div className="input-wrapper stagger-item">
              <label className="input-label" htmlFor="password">Password</label>
              <input 
                className="input-field"
                id="password" 
                name="password" 
                type="password" 
                placeholder="Masukkan password Anda" 
                required 
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div className="input-wrapper stagger-item">
              <label className="input-label" htmlFor="confirmPassword">Konfirmasi Password</label>
              <input 
                className="input-field"
                id="confirmPassword" 
                name="confirmPassword" 
                type="password" 
                placeholder="Masukkan kembali password Anda" 
                required 
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
            
            <div className="stagger-item" style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
              <button 
                type="submit" 
                className="btn btn-primary register-button" 
                style={{ flex: "1" }}
                disabled={loading}
              >
                {loading ? "Memproses..." : "Daftar"}
              </button>
              
              <Link href="/login" style={{ flex: "1" }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ width: "100%" }}
                  disabled={loading}
                >
                  Batal
                </button>
              </Link>
            </div>
          </form>
          
          <div className="auth-footer stagger-item">
            <p style={{ marginBottom: "0.75rem" }}>
              Sudah punya akun?{" "}
              <Link href="/login" className="link">
                Masuk
              </Link>
            </p>
            <Link href="/" className="link" style={{ display: "inline-block" }}>
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </ClientOnly>
    </div>
  );
} 