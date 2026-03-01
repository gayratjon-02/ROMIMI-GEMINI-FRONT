'use client';

import React, { useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
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
import { Collection } from '@/libs/types/homepage/collection';
import { getCollectionsByBrand } from '@/libs/server/HomePage/collection';

interface HomeTopProps {
    selectedBrand?: Brand | null;
    selectedCollection?: Collection | null;
    onCollectionSelect?: (collection: Collection | null, brand: Brand | null) => void;
}

const HomeTop: React.FC<HomeTopProps> = ({ selectedBrand, selectedCollection, onCollectionSelect }) => {
    const router = useRouter();
    const theme = useTheme();
    const colorMode = useContext(ColorModeContext);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [isLoadingCollections, setIsLoadingCollections] = useState(false);

    // Determine active tab based on current path
    const isAdRecreationActive = router.pathname.startsWith('/ad-recreation');
    const isProductVisualsActive = !isAdRecreationActive;

    // Fetch collections when brand changes
    useEffect(() => {
        if (selectedBrand?.id) {
            setIsLoadingCollections(true);
            getCollectionsByBrand(selectedBrand.id)
                .then(setCollections)
                .catch(err => console.error('Error fetching collections:', err))
                .finally(() => setIsLoadingCollections(false));
        } else {
            setCollections([]);
        }
    }, [selectedBrand?.id]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setIsDropdownOpen(false);
        if (isDropdownOpen) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [isDropdownOpen]);

    const handleCollectionClick = (collection: Collection) => {
        if (onCollectionSelect) {
            onCollectionSelect(collection, selectedBrand || null);
        }
        setIsDropdownOpen(false);
    };

    return (
        <div className={`${styles.container} ${styles[theme.palette.mode]}`}>
            {/* Left: Navigation & Context */}
            <div className={styles.leftSection}>
                {/* Tab Group */}
                <div className={styles.tabGroup}>
                    <button
                        className={`${styles.tab} ${isProductVisualsActive ? styles.active : ''}`}
                        onClick={() => router.push('/')}
                    >
                        Product Visuals
                    </button>
                    <button
                        className={`${styles.tab} ${isAdRecreationActive ? styles.active : ''}`}
                        onClick={() => router.push('/ad-recreation')}
                    >
                        Ad Recreation
                    </button>
                </div>

                {/* Selected Collection Display - Only show if collection is selected */}
                {selectedCollection && (
                    <div
                        className={styles.selectedBrand}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsDropdownOpen(!isDropdownOpen);
                        }}
                    >
                        <FolderIcon fontSize="small" />
                        <span>{selectedCollection.name}</span>
                        {selectedCollection.code && (
                            <span className={styles.collectionCode}>{selectedCollection.code}</span>
                        )}
                        <ArrowDropDownIcon fontSize="small" className={isDropdownOpen ? styles.rotated : ''} />

                        {/* Dropdown */}
                        {isDropdownOpen && (
                            <div className={styles.collectionDropdown} onClick={(e) => e.stopPropagation()}>
                                {isLoadingCollections ? (
                                    <div className={styles.dropdownItem}>Loading...</div>
                                ) : collections.length > 0 ? (
                                    collections.map((collection) => (
                                        <div
                                            key={collection.id}
                                            className={`${styles.dropdownItem} ${selectedCollection?.id === collection.id ? styles.active : ''}`}
                                            onClick={() => handleCollectionClick(collection)}
                                        >
                                            <span className={styles.collectionName}>{collection.name}</span>
                                            {collection.code && (
                                                <span className={styles.dropdownCollectionCode}>{collection.code}</span>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className={styles.dropdownItem}>No collections</div>
                                )}
                            </div>
                        )}
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