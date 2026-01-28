import Head from "next/head";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import { useTheme } from "@mui/material";
import { useState, useCallback } from "react";
import HomeTop from "@/libs/components/homePage/HomeTop";
import HomeLeft from "@/libs/components/homePage/HomeLeft";
import HomeMiddle from "@/libs/components/homePage/HomeMiddle";
import HomeBottom from "@/libs/components/homePage/HomeButtom";
import { Brand } from "@/libs/types/homepage/brand";
import { Collection } from "@/libs/types/homepage/collection";
import HomeRight from "@/libs/components/homePage/HomeRight";
// 🔒 XAVFSIZLIK: withAuth HOC import
import { withAuth } from "@/libs/components/auth/withAuth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 🔒 XAVFSIZLIK: Protected component - login kerak
function Home() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Brand refresh trigger
  const [brandRefreshTrigger, setBrandRefreshTrigger] = useState(0);

  // Selected brand state - shared between HomeLeft and HomeTop
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  // Mobile drawer state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const handleBrandCreated = useCallback(() => {
    setBrandRefreshTrigger(prev => prev + 1);
  }, []);

  const handleBrandSelect = useCallback((brand: Brand | null) => {
    setSelectedBrand(brand);
    // Close mobile drawer after selection
    setIsMobileDrawerOpen(false);
    // Note: Collection reset is handled by HomeLeft via onCollectionSelect(null, brand)
  }, []);

  const handleCollectionSelect = useCallback((collection: Collection | null, brand: Brand | null) => {
    setSelectedCollection(collection);
    if (brand) setSelectedBrand(brand);
    // Close mobile drawer after selection
    setIsMobileDrawerOpen(false);
  }, []);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: isDarkMode ? '#0a0a0f' : '#f8fafc',
      color: isDarkMode ? '#f8fafc' : '#0f172a',
      position: 'relative'
    }}>
      {/* Mobile Hamburger Button - Only visible on mobile */}
      <button
        onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
        style={{
          display: 'none', // Hidden on desktop
          position: 'fixed',
          top: '72px', // Lower position to not overlap content
          left: '16px',
          zIndex: 1100,
          width: '44px',
          height: '44px',
          background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          borderRadius: '12px',
          cursor: 'pointer',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          padding: 0,
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(10px)',
        }}
        className="mobile-hamburger"
      >
        <span style={{
          width: '20px',
          height: '2px',
          background: isDarkMode ? '#fff' : '#000',
          borderRadius: '2px',
          transition: 'all 0.3s ease',
          transform: isMobileDrawerOpen ? 'rotate(45deg) translateY(6px)' : 'none'
        }} />
        <span style={{
          width: '20px',
          height: '2px',
          background: isDarkMode ? '#fff' : '#000',
          borderRadius: '2px',
          transition: 'all 0.3s ease',
          opacity: isMobileDrawerOpen ? 0 : 1
        }} />
        <span style={{
          width: '20px',
          height: '2px',
          background: isDarkMode ? '#fff' : '#000',
          borderRadius: '2px',
          transition: 'all 0.3s ease',
          transform: isMobileDrawerOpen ? 'rotate(-45deg) translateY(-6px)' : 'none'
        }} />
      </button>

      {/* Mobile Overlay - Only visible when drawer is open */}
      {isMobileDrawerOpen && (
        <div
          onClick={() => setIsMobileDrawerOpen(false)}
          style={{
            display: 'none', // Hidden on desktop
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1050,
            backdropFilter: 'blur(4px)',
          }}
          className="mobile-overlay"
        />
      )}

      {/* Left Sidebar */}
      <div
        style={{
          transition: 'transform 0.3s ease-in-out',
        }}
        className={`home-left-container ${isMobileDrawerOpen ? 'drawer-open' : 'drawer-closed'}`}
      >
        <HomeLeft
          isDarkMode={isDarkMode}
          refreshTrigger={brandRefreshTrigger}
          onBrandSelect={handleBrandSelect}
          onCollectionSelect={handleCollectionSelect}
          onBrandCreated={handleBrandCreated}
        />
      </div>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100vh'
      }}
        className="main-content-area"
      >
        <HomeTop
          selectedBrand={selectedBrand}
          selectedCollection={selectedCollection}
          onCollectionSelect={handleCollectionSelect}
        />

        {/* HomeMiddle - to'liq ko'rinishi, scroll yo'q */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: isDarkMode ? '#0a0a0f' : '#ffffff'
        }}>
          <HomeMiddle
            isDarkMode={isDarkMode}
            selectedCollection={selectedCollection}
            selectedBrand={selectedBrand}
          />
        </div>
      </div>

      {/* Responsive CSS */}
      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-hamburger {
            display: flex !important;
          }
          
          .mobile-overlay {
            display: block !important;
          }
          
          .home-left-container {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            height: 100vh !important;
            z-index: 1100 !important;
          }
          
          .home-left-container.drawer-closed {
            transform: translateX(-100%) !important;
          }
          
          .home-left-container.drawer-open {
            transform: translateX(0) !important;
          }
        }
        
        @media (min-width: 769px) {
          .home-left-container {
            position: relative !important;
            transform: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// 🔒 XAVFSIZLIK: withAuth HOC bilan wrap qilish
export default withAuth(Home);
