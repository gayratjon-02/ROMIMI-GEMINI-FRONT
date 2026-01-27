import Head from "next/head";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import { Stack } from "@mui/material";
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
    <>
      <Stack className={("homepageMain")}>
        <HomeTop />
        <HomeLeft />
        <HomeMiddle />
        <HomeBottom />
      </Stack>
    </>
  );
}
