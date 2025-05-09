'use client';

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";
import ClientFooter from "../components/ClientFooter";
import ClientOnly from "../components/ClientOnly";
import Screenshot from '@/components/ui/Screenshot';

// Static loading fallback
const LoadingCard = () => (
  <div className="loading-card" style={{
    minHeight: "200px", 
    background: "#f3f4f6", 
    border: "2px dashed #9CA3AF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }}>
    <div>Loading...</div>
  </div>
);

// Dynamically import components
const FeatureCard = dynamic(() => import('../components/FeatureCard'), {
  loading: () => <LoadingCard />,
  ssr: false // Disable SSR for this component
});

const TestimonialCard = dynamic(() => import('../components/TestimonialCard'), {
  loading: () => <LoadingCard />,
  ssr: false // Disable SSR for this component
});

// Import placeholder images
const posScreenshotPlaceholder = "/images/pos.png";

export default function Home() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Initialize animations
    const animateElements = document.querySelectorAll('[data-animation]');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const animation = entry.target.getAttribute('data-animation');
          if (animation) {
            entry.target.classList.add(`animate-${animation}`);
          }
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    
    animateElements.forEach(el => {
      observer.observe(el);
    });
    
    return () => {
      animateElements.forEach(el => {
        observer.unobserve(el);
      });
    };
  }, []);

  return (
    <main className="page-container brutalism-bg brutalism-noise w-full">
      {/* Background shapes */}
      <div className="bg-shapes w-full">
        <div className="bg-shape bg-shape-1 animate-shape"></div>
        <div className="bg-shape bg-shape-2 animate-shape delay-100"></div>
        <div className="bg-shape bg-shape-3 animate-shape delay-200"></div>
        <div className="bg-shape bg-shape-4 animate-shape"></div>
        <div className="bg-shape bg-shape-5 animate-shape delay-100"></div>
        <div className="bg-dots"></div>
      </div>

      <div className="hero-section animate-in w-full px-4 sm:px-8" style={{ paddingTop: "3rem", paddingBottom: "5rem" }}>
        <div className="max-w-screen-xl mx-auto" style={{ 
          textAlign: "center", 
          position: "relative", 
          zIndex: "1",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem"
        }}>
          <div className="animate-slide-right" style={{ 
            position: "relative",
            marginBottom: "0.5rem"
          }}>
            <h1 style={{ 
              fontSize: "clamp(3rem, 10vw, 5rem)", 
              fontWeight: "900", 
              marginBottom: "1rem", 
              display: "inline-block", 
              padding: "0.5rem 2rem",
              backgroundColor: "white", 
              border: "4px solid #0F172A",
              boxShadow: "12px 12px 0 rgba(0,0,0,0.9)",
              transform: "rotate(-1deg)",
              position: "relative",
              zIndex: "1"
            }}>
              POS Vougher
            </h1>
            <div style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              top: "15px",
              left: "15px",
              backgroundColor: "#4338ca",
              zIndex: "0",
              transform: "rotate(2deg)"
            }}></div>
          </div>
          
          <p className="animate-slide-left max-w-3xl" style={{ 
            fontSize: "1.5rem", 
            fontWeight: "600",
            margin: "0 auto 2.5rem",
            backgroundColor: "#FEF3C7",
            border: "3px solid #0F172A",
            padding: "0.75rem 1.5rem",
            boxShadow: "6px 6px 0 rgba(0,0,0,0.9)",
            transform: "rotate(0.5deg)"
          }}>
            Sistem Kasir Modern dengan Desain Neu Brutalism
          </p>
          
          <div className="animate-in" style={{ 
            display: "flex", 
            gap: "1.5rem", 
            justifyContent: "center", 
            flexWrap: "wrap" 
          }}>
            <ClientOnly>
              <Link href="/login">
                <span className="btn btn-primary login-button" data-animation="bounce" style={{ 
                  fontSize: "1.25rem", 
                  padding: "0.75rem 2rem",
                  boxShadow: "6px 6px 0 rgba(0,0,0,0.9)",
                  border: "3px solid #0F172A",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease"
                }}>
                  Masuk
                </span>
              </Link>
            </ClientOnly>

            <ClientOnly>
              <Link href="/register">
                <span className="btn btn-outline register-button" data-animation="bounce" style={{ 
                  fontSize: "1.25rem", 
                  padding: "0.75rem 2rem",
                  boxShadow: "6px 6px 0 rgba(0,0,0,0.9)",
                  border: "3px solid #0F172A",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease"
                }}>
                  Daftar
                </span>
              </Link>
            </ClientOnly>
          </div>
        </div>
      </div>

      <div id="features" className="features-section w-full px-4 sm:px-8" data-animation="fade-in" style={{ 
        padding: "2.5rem",
        backgroundColor: "white",
        border: "4px solid #0F172A",
        boxShadow: "12px 12px 0 rgba(0,0,0,0.9)",
        marginBottom: "4rem",
        position: "relative",
        zIndex: "1",
        backgroundImage: "radial-gradient(#E0E7FF 1.5px, transparent 1.5px)",
        backgroundSize: "30px 30px"
      }}>
        <div className="text-center mb-10">
          <h2 className="animate-on-scroll inline-block mx-auto" data-animation="slide-right" style={{ 
            fontSize: "2.75rem", 
            fontWeight: "900",
            borderBottom: "4px solid #0F172A",
            paddingBottom: "0.5rem",
            position: "relative",
            color: "#312e81"
          }}>
            Fitur Utama
            <span style={{
              position: "absolute",
              bottom: "-12px",
              left: "0",
              width: "70%",
              height: "8px",
              backgroundColor: "#FCD34D"
            }}></span>
          </h2>
        </div>
        
        <div className="stagger-children max-w-screen-xl mx-auto" style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", 
          gap: "2.5rem" 
        }}>
          <ClientOnly fallback={<LoadingCard />}>
            <FeatureCard 
              title="Manajemen Produk"
              description="Kelola produk dengan mudah. Tambah, edit, dan hapus produk dengan cepat dan efisien."
              icon={<span style={{ fontSize: "1.75rem" }}>📦</span>}
              color="white"
              textColor="#312e81"
              iconBgColor="#DBEAFE"
            />
          </ClientOnly>

          <ClientOnly fallback={<LoadingCard />}>
            <FeatureCard 
              title="Proses Transaksi"
              description="Transaksi penjualan dengan antarmuka yang intuitif dan mudah digunakan."
              icon={<span style={{ fontSize: "1.75rem", color: "white" }}>💳</span>}
              color="#4f46e5"
              textColor="white"
              iconBgColor="#111827"
              iconBorderColor="white"
              borderColor="#0F172A"
            />
          </ClientOnly>

          <ClientOnly fallback={<LoadingCard />}>
            <FeatureCard 
              title="Laporan Penjualan"
              description="Lihat laporan penjualan dengan grafik yang informatif dan mudah dipahami."
              icon={<span style={{ fontSize: "1.75rem" }}>📊</span>}
              color="#fbbf24"
              textColor="#312e81"
              iconBgColor="white"
            />
          </ClientOnly>
        </div>
      </div>

      <div className="brutal-container animate-on-scroll w-full px-4 sm:px-8" data-animation="slide-up" style={{ 
        marginBottom: "4rem",
        position: "relative"
      }}>
        <div style={{
          position: "absolute",
          width: "120px",
          height: "120px",
          backgroundColor: "#FEF3C7",
          border: "3px solid #0F172A",
          transform: "rotate(15deg)",
          top: "-20px",
          left: "-20px",
          zIndex: "0"
        }}></div>
        
        <div className="text-center mb-10">
          <h2 className="brutal-header animate-on-scroll inline-block mx-auto" data-animation="slide-right" style={{
            position: "relative",
            zIndex: "1",
          }}>
            Fitur Unggulan
          </h2>
        </div>

        <div className="stagger-children max-w-screen-xl mx-auto" style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
          gap: "2.5rem",
          position: "relative",
          zIndex: "1"
        }}>
          <div className="animate-on-scroll" data-animation="slide-up" style={{
            border: "3px solid #0F172A",
            borderRadius: "8px",
            padding: "1.5rem",
            backgroundColor: "white",
            boxShadow: "6px 6px 0 rgba(0,0,0,0.9)",
            transition: "transform 0.3s ease",
            cursor: "pointer"
          }}>
            <div className="feature-icon feature-green" style={{
              width: "40px",
              height: "40px",
              fontSize: "1.5rem",
              marginBottom: "1rem"
            }}>✓</div>
            <div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "0.75rem" }}>Antarmuka Intuitif</h3>
              <p style={{ fontSize: "1.1rem", lineHeight: "1.6" }}>Desain yang modern dan mudah digunakan untuk semua pengguna</p>
            </div>
          </div>
          
          <div className="animate-on-scroll" data-animation="slide-up" style={{
            border: "3px solid #0F172A",
            borderRadius: "8px",
            padding: "1.5rem",
            backgroundColor: "white",
            boxShadow: "6px 6px 0 rgba(0,0,0,0.9)",
            transition: "transform 0.3s ease",
            cursor: "pointer"
          }}>
            <div className="feature-icon feature-blue" style={{
              width: "40px",
              height: "40px",
              fontSize: "1.5rem",
              marginBottom: "1rem"
            }}>✓</div>
            <div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "0.75rem" }}>Laporan Real-time</h3>
              <p style={{ fontSize: "1.1rem", lineHeight: "1.6" }}>Pantau penjualan dan stok secara real-time</p>
            </div>
          </div>
          
          <div className="animate-on-scroll" data-animation="slide-up" style={{
            border: "3px solid #0F172A",
            borderRadius: "8px",
            padding: "1.5rem",
            backgroundColor: "white",
            boxShadow: "6px 6px 0 rgba(0,0,0,0.9)",
            transition: "transform 0.3s ease",
            cursor: "pointer"
          }}>
            <div className="feature-icon feature-purple" style={{
              width: "40px",
              height: "40px",
              fontSize: "1.5rem",
              marginBottom: "1rem"
            }}>✓</div>
            <div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "0.75rem" }}>Multi Pengguna</h3>
              <p style={{ fontSize: "1.1rem", lineHeight: "1.6" }}>Dukung banyak kasir dengan level akses berbeda</p>
            </div>
          </div>
          
          <div className="animate-on-scroll" data-animation="slide-up" style={{
            border: "3px solid #0F172A",
            borderRadius: "8px",
            padding: "1.5rem",
            backgroundColor: "white",
            boxShadow: "6px 6px 0 rgba(0,0,0,0.9)",
            transition: "transform 0.3s ease",
            cursor: "pointer"
          }}>
            <div className="feature-icon feature-yellow" style={{
              width: "40px",
              height: "40px",
              fontSize: "1.5rem",
              marginBottom: "1rem"
            }}>✓</div>
            <div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "0.75rem" }}>Berbagai Metode Pembayaran</h3>
              <p style={{ fontSize: "1.1rem", lineHeight: "1.6" }}>Dukung pembayaran tunai, kartu, dan QRIS</p>
            </div>
          </div>
        </div>
      </div>

      {/* Screenshot section */}
      <div className="brutal-container animate-on-scroll w-full px-4 sm:px-8" data-animation="fade-in" style={{ 
        marginBottom: "4rem",
        padding: "2rem",
        backgroundColor: "#F3F4F6",
        border: "4px solid #0F172A",
        boxShadow: "12px 12px 0 rgba(0,0,0,0.9)",
        position: "relative"
      }}>
        <h2 className="animate-on-scroll text-center mx-auto" data-animation="slide-right" style={{ 
          fontSize: "2.5rem", 
          fontWeight: "900", 
          marginBottom: "2rem",
          position: "relative",
          display: "inline-block"
        }}>
          Antarmuka POS Modern
          <div style={{
            position: "absolute",
            height: "10px",
            width: "100%",
            bottom: "-5px",
            left: "0",
            backgroundColor: "#FCD34D",
            zIndex: "-1"
          }}></div>
        </h2>

        <div className="animate-on-scroll" data-animation="scale-in">
          <Screenshot 
            src={posScreenshotPlaceholder}
            alt="Screenshot Tampilan POS"
            width={1200}
            height={675}
          />
        </div>

        <p className="animate-on-scroll max-w-3xl mx-auto" data-animation="fade-in" style={{ 
          textAlign: "center", 
          fontSize: "1.1rem", 
          padding: "0 1rem", 
          margin: "0 auto 2rem"
        }}>
          Desain antarmuka yang modern dan intuitif akan memudahkan Anda mengelola bisnis dengan efisien
        </p>

        <div className="animate-on-scroll text-center" data-animation="bounce" style={{ textAlign: "center" }}>
          <ClientOnly>
            <Link href="/register">
              <span className="btn btn-primary register-cta" data-animation="bounce" style={{ 
                fontSize: "1.25rem", 
                padding: "0.75rem 2rem",
                boxShadow: "6px 6px 0 rgba(0,0,0,0.9)",
                border: "3px solid #0F172A",
                transition: "transform 0.3s ease, box-shadow 0.3s ease"
              }}>
                Mulai Gratis Sekarang
              </span>
            </Link>
          </ClientOnly>
        </div>
      </div>

      {/* Testimonial section */}
      <div className="brutal-container animate-on-scroll w-full px-4 sm:px-8" data-animation="slide-up" style={{ 
        marginBottom: "5rem",
        padding: "1.5rem"
      }}>
        <div className="text-center mb-10">
          <h2 className="animate-on-scroll inline-block mx-auto" data-animation="slide-right" style={{ 
            fontSize: "2.5rem", 
            fontWeight: "900",
            position: "relative"
          }}>
            Digunakan oleh Berbagai Bisnis
          </h2>
        </div>

        <div className="stagger-children max-w-screen-xl mx-auto" style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
          gap: "2rem"
        }}>
          <ClientOnly fallback={<LoadingCard />}>
            <TestimonialCard 
              quote="POS Vougher sangat membantu bisnis kafe saya. Tampilan yang modern dan mudah digunakan."
              name="Andi Pratama"
              business="Kafe Aroma"
              color="#FFFBEB"
              initial="A"
              avatarColor="#F59E0B"
              rotation="-1deg"
            />
          </ClientOnly>

          <ClientOnly fallback={<LoadingCard />}>
            <TestimonialCard 
              quote="Laporan penjualan real-time sangat membantu saya memantau kinerja toko. Terima kasih POS Vougher!"
              name="Siti Rahma"
              business="Butik Fashion"
              color="#F0FDF4"
              initial="S"
              avatarColor="#10B981"
              rotation="0.5deg"
            />
          </ClientOnly>

          <ClientOnly fallback={<LoadingCard />}>
            <TestimonialCard 
              quote="Saya suka desain Neu Brutalism yang unik. Membuat toko saya terlihat lebih modern!"
              name="Budi Santoso"
              business="Mini Market"
              color="#EFF6FF"
              initial="B"
              avatarColor="#3B82F6"
              rotation="-0.5deg"
            />
          </ClientOnly>
        </div>
      </div>

      <footer className="animate-on-scroll w-full" data-animation="slide-up" style={{ 
        textAlign: "center", 
        padding: "0",
        borderTop: "4px solid #0F172A",
        backgroundColor: "white",
        position: "relative",
        zIndex: "1",
        border: "4px solid #0F172A",
        boxShadow: "8px 8px 0 rgba(0,0,0,0.9)",
        overflow: "hidden"
      }}>
        {/* Decorative elements */}
        <div style={{
          position: "absolute",
          top: "-10px",
          right: "-10px",
          width: "80px",
          height: "80px",
          backgroundColor: "#fbbf24",
          transform: "rotate(15deg)",
          zIndex: "0",
          border: "4px solid #0F172A"
        }}></div>
        
        <div style={{
          position: "absolute",
          bottom: "-15px",
          left: "20%",
          width: "60px",
          height: "60px",
          backgroundColor: "#4f46e5",
          transform: "rotate(-10deg)",
          zIndex: "0",
          border: "4px solid #0F172A"
        }}></div>
        
        {/* Footer content */}
        <div style={{
          position: "relative",
          zIndex: "1",
          padding: "3rem 1.5rem 2rem"
        }}>
          {/* Main footer sections */}
          <div className="stagger-children max-w-screen-xl mx-auto" style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "3rem",
            marginBottom: "2.5rem",
            textAlign: "left"
          }}>
            <div className="animate-on-scroll" data-animation="slide-right">
              <h3 style={{ 
                fontWeight: "bold", 
                marginBottom: "1rem", 
                fontSize: "1.5rem",
                borderBottom: "3px solid #0F172A",
                paddingBottom: "0.5rem",
                display: "inline-block"
              }}>
                POS Vougher
              </h3>
              <p style={{ 
                marginBottom: "1.5rem", 
                fontSize: "1.125rem", 
                lineHeight: "1.6"
              }}>
                Sistem kasir modern dengan desain Neu Brutalism untuk berbagai jenis bisnis
              </p>
              <div style={{
                display: "flex",
                gap: "1rem",
                marginTop: "1rem"
              }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: "#f3f4f6",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #0F172A",
                  fontSize: "1.25rem"
                }}>📱</div>
                <div style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: "#f3f4f6",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #0F172A",
                  fontSize: "1.25rem"
                }}>✉️</div>
                <div style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: "#f3f4f6",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #0F172A",
                  fontSize: "1.25rem"
                }}>🌐</div>
              </div>
            </div>
            
            <div className="animate-on-scroll" data-animation="slide-up">
              <h3 style={{ 
                fontWeight: "bold", 
                marginBottom: "1rem", 
                fontSize: "1.5rem",
                borderBottom: "3px solid #0F172A",
                paddingBottom: "0.5rem",
                display: "inline-block"
              }}>
                Navigasi
              </h3>
              <ul style={{ 
                listStyle: "none", 
                padding: 0,
                fontSize: "1.125rem" 
              }}>
                <li style={{ 
                  marginBottom: "0.75rem",
                  position: "relative",
                  paddingLeft: "1.5rem"
                }}>
                  <span style={{
                    position: "absolute",
                    left: "0",
                    top: "6px",
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#4f46e5",
                    border: "1px solid #0F172A"
                  }}></span>
                  <Link href="/login">
                    <span className="link" style={{
                      fontWeight: "600"
                    }}>Masuk</span>
                  </Link>
                </li>
                <li style={{ 
                  marginBottom: "0.75rem",
                  position: "relative",
                  paddingLeft: "1.5rem"
                }}>
                  <span style={{
                    position: "absolute",
                    left: "0",
                    top: "6px",
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#4f46e5",
                    border: "1px solid #0F172A"
                  }}></span>
                  <Link href="/register">
                    <span className="link" style={{
                      fontWeight: "600"
                    }}>Daftar</span>
                  </Link>
                </li>
                <li style={{ 
                  marginBottom: "0.75rem",
                  position: "relative",
                  paddingLeft: "1.5rem"
                }}>
                  <span style={{
                    position: "absolute",
                    left: "0",
                    top: "6px",
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#4f46e5",
                    border: "1px solid #0F172A"
                  }}></span>
                  <Link href="#features">
                    <span className="link" style={{
                      fontWeight: "600"
                    }}>Fitur</span>
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="animate-on-scroll" data-animation="slide-left">
              <h3 style={{ 
                fontWeight: "bold", 
                marginBottom: "1rem", 
                fontSize: "1.5rem",
                borderBottom: "3px solid #0F172A",
                paddingBottom: "0.5rem",
                display: "inline-block"
              }}>
                Kontak
              </h3>
              <div style={{ marginBottom: "1rem" }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "0.75rem"
                }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    backgroundColor: "#f3f4f6",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "0.75rem",
                    border: "2px solid #0F172A",
                    fontSize: "1rem"
                  }}>📧</div>
                  <p style={{ 
                    fontSize: "1.125rem",
                    fontWeight: "500"
                  }}>
                    info@posvougher.com
                  </p>
                </div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "0.75rem"
                }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    backgroundColor: "#f3f4f6",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "0.75rem",
                    border: "2px solid #0F172A",
                    fontSize: "1rem"
                  }}>📞</div>
                  <p style={{ 
                    fontSize: "1.125rem",
                    fontWeight: "500"
                  }}>
                    +62 123 4567 890
                  </p>
                </div>
                <div style={{
                  display: "flex",
                  alignItems: "center"
                }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    backgroundColor: "#f3f4f6",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "0.75rem",
                    border: "2px solid #0F172A",
                    fontSize: "1rem"
                  }}>📍</div>
                  <p style={{ 
                    fontSize: "1.125rem",
                    fontWeight: "500"
                  }}>
                    Jakarta, Indonesia
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Copyright section */}
          <div className="animate-on-scroll" data-animation="fade-in" style={{ 
            padding: "1.5rem",
            backgroundColor: "#f9fafb",
            borderTop: "3px solid #0F172A",
            borderBottom: "3px solid #0F172A",
            position: "relative"
          }}>
            <div style={{
              position: "absolute",
              top: "-10px",
              left: "30%",
              width: "40%",
              height: "3px",
              backgroundColor: "#fbbf24"
            }}></div>
            {isClient ? <ClientFooter /> : 
              <p style={{ 
                fontSize: "1.125rem", 
                fontWeight: "bold",
                letterSpacing: "0.5px"
              }}>
                POS Vougher &copy; 2024 - Sistem Kasir Modern dengan Desain Neu Brutalism
              </p>
            }
          </div>
        </div>
      </footer>
    </main>
  );
}
