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
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  const handleBrandCreated = useCallback(() => {
    setBrandRefreshTrigger(prev => prev + 1);
  }, []);

  const handleBrandSelect = useCallback((brand: Brand | null) => {
    setSelectedBrand(brand);
    // Note: Collection reset is handled by HomeLeft via onCollectionSelect(null, brand)
  }, []);

  const handleCollectionSelect = useCallback((collection: Collection | null, brand: Brand | null) => {
    setSelectedCollection(collection);
    if (brand) setSelectedBrand(brand);
  }, []);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: isDarkMode ? '#0a0a0f' : '#f8fafc',
      color: isDarkMode ? '#f8fafc' : '#0f172a'
    }}>
      {/* Left Sidebar */}
      <HomeLeft
        isDarkMode={isDarkMode}
        refreshTrigger={brandRefreshTrigger}
        onBrandSelect={handleBrandSelect}
        onCollectionSelect={handleCollectionSelect}
        onBrandCreated={handleBrandCreated}
      />

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100vh'
      }}>
        <HomeTop selectedBrand={selectedBrand} />

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
    </div>
  );
}
