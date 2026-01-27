'use client';

import React, { useContext } from 'react';
import { useTheme } from "@mui/material";
import FolderIcon from '@mui/icons-material/Folder';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import NightlightRoundIcon from '@mui/icons-material/NightlightRound';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import DownloadIcon from '@mui/icons-material/Download';
import HistoryIcon from '@mui/icons-material/History';
import styles from "@/scss/styles/HomePage/HomeTop.module.scss";
import { ColorModeContext } from "@/pages/_app";
import { Brand } from '@/libs/types/homepage/brand';

interface HomeTopProps {
    selectedBrand?: Brand | null;
}

const HomeTop: React.FC<HomeTopProps> = ({ selectedBrand }) => {
    const theme = useTheme();
    const colorMode = useContext(ColorModeContext);

    return (
        <div className={`${styles.container} ${styles[theme.palette.mode]}`}>
            {/* Left: Navigation & Context */}
            <div className={styles.leftSection}>
                {/* Tab Group */}
                <div className={styles.tabGroup}>
                    <button className={`${styles.tab} ${styles.active}`}>Product Visuals</button>
                    <button className={styles.tab}>Ad Recreation</button>
                </div>

                {/* Selected Brand Display - Only show if brand is selected */}
                {selectedBrand && (
                    <div className={styles.selectedBrand}>
                        <FolderIcon fontSize="small" />
                        <span>{selectedBrand.name}</span>
                        <ArrowDropDownIcon fontSize="small" />
                    </div>
                )}

                {/* Style Set Button */}
                <div className={styles.styleSetButton}>
                    <span>Style Set</span>
                </div>
            </div>

            {/* Right: Actions */}
            <div className={styles.rightSection}>
                {/* Theme Toggle */}
                <div
                    className={`${styles.iconButton} ${styles.highlight}`}
                    onClick={colorMode.toggleColorMode}
                >
                    {theme.palette.mode === 'dark' ? (
                        <WbSunnyIcon fontSize="small" />
                    ) : (
                        <NightlightRoundIcon fontSize="small" />
                    )}
                </div>

                {/* Fullscreen */}
                <div className={styles.iconButton}>
                    <FullscreenIcon fontSize="small" />
                </div>

                {/* Download */}
                <div className={styles.iconButton}>
                    <DownloadIcon fontSize="small" />
                </div>

                {/* History */}
                <div className={styles.iconButton}>
                    <HistoryIcon fontSize="small" />
                </div>
            </div>
        </div>
    )
}

export default HomeTop;