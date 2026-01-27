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

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Brand refresh trigger
  const [brandRefreshTrigger, setBrandRefreshTrigger] = useState(0);

  // Selected brand state - shared between HomeLeft and HomeTop
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  const handleBrandCreated = useCallback(() => {
    setBrandRefreshTrigger(prev => prev + 1);
  }, []);

  const handleBrandSelect = useCallback((brand: Brand | null) => {
    setSelectedBrand(brand);
  }, []);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: isDarkMode ? '#1a1a1a' : '#ffffff',
      color: isDarkMode ? '#ffffff' : '#1a1a1a'
    }}>
      {/* Left Sidebar */}
      <HomeLeft
        isDarkMode={isDarkMode}
        refreshTrigger={brandRefreshTrigger}
        onBrandSelect={handleBrandSelect}
        onBrandCreated={handleBrandCreated}
      />

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: isDarkMode ? '#1a1a1a' : '#ffffff'
      }}>
        <HomeTop selectedBrand={selectedBrand} />
        <div style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          background: isDarkMode ? '#1a1a1a' : '#f5f5f5'
        }}>
          <HomeMiddle />
          <HomeBottom />
        </div>
      </div>
    </div>
  );
}
