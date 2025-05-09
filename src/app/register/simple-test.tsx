"use client";

import { useState } from 'react';

export default function SimpleTest() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [endpoint, setEndpoint] = useState("/api/auth/register");

  const testRegistration = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const testData = {
        name: "Test User",
        username: "testuser" + Math.floor(Math.random() * 1000),
        password: "password123"
      };
      
      console.log(`Testing ${endpoint} with:`, testData);
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      });
      
      console.log("Response status:", response.status);
      const contentType = response.headers.get("content-type");
      console.log("Content type:", contentType);
      
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        setResult(data);
        console.log("Response:", data);
      } else {
        const text = await response.text();
        console.log("Non-JSON response:", text.substring(0, 150) + "...");
        setError("Received non-JSON response: " + text.substring(0, 150) + "...");
      }
    } catch (err) {
      console.error("Test error:", err);
      setError("Error: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const testBasicApi = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/basic-test');
      console.log("Basic API status:", response.status);
      
      const data = await response.json();
      setResult(data);
      console.log("Basic API response:", data);
    } catch (err) {
      console.error("Basic API error:", err);
      setError("Basic API Error: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{padding: "20px"}}>
      <h1>API Test</h1>
      
      <div style={{marginBottom: "20px"}}>
        <div style={{marginBottom: "10px"}}>
          <strong>Select endpoint to test:</strong>
        </div>
        <div style={{display: "flex", gap: "10px"}}>
          <button 
            onClick={() => setEndpoint("/api/auth/register")}
            style={{
              padding: "5px 10px",
              background: endpoint === "/api/auth/register" ? "#2563EB" : "#E5E7EB",
              color: endpoint === "/api/auth/register" ? "white" : "black",
              border: "none",
              borderRadius: "5px"
            }}
          >
            Real Registration
          </button>
          <button 
            onClick={() => setEndpoint("/api/auth/direct-register")}
            style={{
              padding: "5px 10px",
              background: endpoint === "/api/auth/direct-register" ? "#2563EB" : "#E5E7EB",
              color: endpoint === "/api/auth/direct-register" ? "white" : "black",
              border: "none",
              borderRadius: "5px"
            }}
          >
            Mock Registration
          </button>
          <button 
            onClick={() => setEndpoint("/api/basic-test")}
            style={{
              padding: "5px 10px",
              background: endpoint === "/api/basic-test" ? "#2563EB" : "#E5E7EB",
              color: endpoint === "/api/basic-test" ? "white" : "black",
              border: "none",
              borderRadius: "5px"
            }}
          >
            Basic Test
          </button>
        </div>
      </div>
      
      <div style={{marginBottom: "20px"}}>
        <p>Currently testing: <strong>{endpoint}</strong></p>
      </div>
      
      <div style={{display: "flex", gap: "10px", marginBottom: "20px"}}>
        <button 
          onClick={testRegistration}
          disabled={loading}
          style={{
            padding: "10px 20px",
            background: "#2563EB",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Testing..." : "Test API"}
        </button>
        
        <button 
          onClick={testBasicApi}
          disabled={loading}
          style={{
            padding: "10px 20px",
            background: "#10B981",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          Test Basic GET API
        </button>
      </div>
      
      {error && (
        <div style={{
          margin: "20px 0",
          padding: "10px",
          background: "#FEE2E2",
          border: "1px solid #B91C1C",
          borderRadius: "5px"
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {result && (
        <div style={{
          margin: "20px 0",
          padding: "10px",
          background: "#ECFDF5",
          border: "1px solid #065F46",
          borderRadius: "5px"
        }}>
          <strong>Result:</strong>
          <pre style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            maxHeight: "300px",
            overflow: "auto",
            padding: "10px",
            background: "#F9FAFB",
            borderRadius: "3px",
            marginTop: "10px"
          }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
} 