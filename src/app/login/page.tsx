"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, FormEvent, useEffect, useRef } from "react";
import ClientOnly from "@/components/ClientOnly";
import { useSimpleTranslation } from "@/lib/translations";

export default function LoginPage() {
  const { t } = useSimpleTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegistered = searchParams.get("registered") === "true";
  
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [animationActive, setAnimationActive] = useState(false);

  // Function to translate server error messages to translation keys
  const translateErrorMessage = (message: string): string => {
    // Map known server error messages to translation keys
    const errorMap: Record<string, string> = {
      'Username and password are required': 'login.errors.required_fields',
      'Invalid username or password': 'login.errors.invalid_credentials',
      'Authentication error': 'login.errors.server_error',
      'User does not have access to this store': 'login.errors.store_access_denied',
      'This store is currently inactive': 'login.errors.inactive_store',
      'An error occurred during login': 'login.errors.server_error',
      'Invalid JSON request body': 'login.errors.invalid_request'
    };
    
    // Return the translation key if found, otherwise return the original message
    return t(errorMap[message] || 'login.errors.server_error');
  };

  useEffect(() => {
    if (isRegistered) {
      setSuccess(t("login.success.registration"));
    }
    
    // Check if the user is already logged in
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      // If user is already logged in, check if they have a store selected
      const storeId = localStorage.getItem('currentStoreId');
      if (storeId) {
        console.log('User already logged in and has a store, redirecting to dashboard');
        router.push('/dashboard');
      } else {
        console.log('User already logged in but no store selected, redirecting to stores');
        router.push('/stores');
      }
    }

    // Activate animations after component mounts
    setAnimationActive(true);
  }, [isRegistered, router, t]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.username || !formData.password) {
      setError(t("login.errors.required_fields"));
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting login for:', formData.username);
      const response = await fetch("/api/auth/simple-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      // Check if the response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Non-JSON response received:", await response.text());
        setError(t("login.errors.server_error"));
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        console.error("Login failed:", data);
        // Translate error message from server
        setError(translateErrorMessage(data.message));
        setLoading(false);
        return;
      }

      console.log('Login successful:', data);
      
      // Store user information in localStorage for use throughout the app
      if (data.user) {
        console.log('Storing user data:', data.user.username, 'Role:', data.user.role);
        
        // Always clear the superadmin flag first before setting anything
        localStorage.removeItem('isSuperAdmin');
        
        // Check if user is a SUPER_ADMIN
        const isSuperAdmin = data.user.role === 'SUPER_ADMIN' || 
                           data.user.stores?.some((store: any) => store.role === 'SUPER_ADMIN');
        
        console.log('User role:', data.user.role);
        console.log('Is superadmin?', isSuperAdmin);
        
        // Store user data in localStorage
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        // Clear any old store data
        localStorage.removeItem('currentStoreId');
        localStorage.removeItem('currentStoreName');
        document.cookie = 'currentStoreId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        
        // Set userId cookie for API authentication
        document.cookie = `userId=${data.user.id}; path=/; max-age=${60*60*24}`; // 24 hours
        
        // For superadmin, we need to handle redirection to dashboard/stores
        if (isSuperAdmin || data.user.role === 'SUPER_ADMIN') {
          // Set a flag for superadmin
          localStorage.setItem('isSuperAdmin', 'true');
          
          // Redirect super admins directly to the store management dashboard
          console.log('Super admin detected, redirecting to store management');
          
          // Use window.location for a hard redirect instead of router
          window.location.href = "/dashboard/stores";
          return;
        } else {
          // Make sure the flag is not set for regular users
          localStorage.removeItem('isSuperAdmin');
        }
        
        // For regular users - redirect to stores page to select a store
        console.log('Regular user detected, redirecting to stores page');
        router.replace("/stores");
        return;
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(t('login.errors.server_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container brutalism-bg brutalism-dots brutalism-noise">
      {/* Background shapes */}
      <div className="bg-shapes">
        <div className="bg-shape bg-shape-2"></div>
        <div className="bg-shape bg-shape-4"></div>
        <div className="bg-dots"></div>
      </div>

      {/* Login Card */}
      <div className={`auth-card login-card-animation ${animationActive ? 'animate-active' : ''}`}>
        <div className="auth-header stagger-item">
          <h1>{t("login.title")}</h1>
          <p>{t("login.subtitle")}</p>
        </div>
        
        {error && (
          <div className="error-alert stagger-item">
            {error}
          </div>
        )}
        
        {success && (
          <div className="success-alert stagger-item">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} ref={formRef}>
          <div className="input-wrapper stagger-item">
            <label className="input-label" htmlFor="username">{t("login.username")}</label>
            <input 
              className="input-field"
              id="username" 
              name="username" 
              type="text" 
              placeholder={t("login.username_placeholder")} 
              required 
              value={formData.username}
              onChange={handleChange}
            />
          </div>
          
          <div className="input-wrapper stagger-item">
            <label className="input-label" htmlFor="password">{t("login.password")}</label>
            <input 
              className="input-field"
              id="password" 
              name="password" 
              type="password" 
              placeholder={t("login.password_placeholder")} 
              required 
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary stagger-item" 
            style={{ width: "100%", marginTop: "1.5rem" }}
            disabled={loading}
          >
            {loading ? t("login.processing") : t("login.button")}
          </button>
        </form>
        
        <div className="auth-footer stagger-item">
          <p style={{ marginBottom: "0.75rem" }}>
            {t("login.no_account")}{" "}
            <Link href="/register" className="link">
              {t("login.register")}
            </Link>
          </p>
          <Link href="/" className="link" style={{ display: "inline-block" }}>
            {t("login.back_home")}
          </Link>
        </div>
      </div>
    </div>
  );
} 