import Head from "next/head";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import HomeTop from "@/libs/components/homePage/HomeTop";
import HomeLeft from "@/libs/components/homePage/HomeLeft";
import HomeMiddle from "@/libs/components/homePage/HomeMiddle";
import HomeBottom from "@/libs/components/homePage/HomeButtom";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Left Sidebar */}
      <HomeLeft />

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <HomeTop />
        <div style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <HomeMiddle />
          <HomeBottom />
        </div>
      </div>
    </div>
  );
}
