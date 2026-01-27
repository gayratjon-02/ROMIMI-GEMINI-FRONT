'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '@/scss/styles/HomePage/HomeLeft.module.scss';
import { getUserInfo, logout, UserInfo } from '@/libs/server/HomePage/signup';
import { getAllBrands } from '@/libs/server/HomePage/brand';
import { getCollectionsByBrand } from '@/libs/server/HomePage/collection';
import { Brand } from '@/libs/types/homepage/brand';
import { Collection } from '@/libs/types/homepage/collection';
import CreateCollectionWizard from '@/libs/components/modals/CreateCollectionWizard';
import CreateBrandModal from '@/libs/components/modals/CreateBrandModal';

interface HomeLeftProps {
  isDarkMode?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  refreshTrigger?: number;
  onBrandSelect?: (brand: Brand | null) => void;
  onBrandCreated?: () => void;
}

const HomeLeft: React.FC<HomeLeftProps> = ({
  isDarkMode = true,
  isOpen = true,
  onClose,
  refreshTrigger = 0,
  onBrandSelect,
  onBrandCreated
}) => {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState('product-visuals');
  const [activeBrandId, setActiveBrandId] = useState<string | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // Brand dropdown state
  const [expandedBrandId, setExpandedBrandId] = useState<string | null>(null);
  const [brandCollections, setBrandCollections] = useState<Record<string, Collection[]>>({});
  const [loadingCollections, setLoadingCollections] = useState<string | null>(null);

  // Modal states
  const [isCollectionWizardOpen, setIsCollectionWizardOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [selectedBrandForCollection, setSelectedBrandForCollection] = useState<Brand | null>(null);

  useEffect(() => {
    const info = getUserInfo();
    setUserInfo(info);
  }, []);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setIsLoadingBrands(true);
        const fetchedBrands = await getAllBrands();
        setBrands(fetchedBrands);
      } catch (error) {
        console.error('Error fetching brands:', error);
        setBrands([]);
      } finally {
        setIsLoadingBrands(false);
      }
    };

    fetchBrands();
  }, [refreshTrigger]);

  const handleLogout = () => {
    logout();
    router.push('/signup');
  };

  const handleMenuClick = (menuId: string, path?: string) => {
    setActiveMenu(menuId);
    setActiveBrandId(null);
    setExpandedBrandId(null);
    if (onBrandSelect) onBrandSelect(null);
    if (path) {
      router.push(path);
    }
    if (onClose) onClose();
  };

  const handleBrandClick = async (brand: Brand) => {
    if (expandedBrandId === brand.id) {
      setExpandedBrandId(null);
    } else {
      setExpandedBrandId(brand.id);
      setActiveBrandId(brand.id);
      setActiveMenu('');
      if (onBrandSelect) onBrandSelect(brand);

      // Fetch collections for this brand if not already loaded
      if (!brandCollections[brand.id]) {
        setLoadingCollections(brand.id);
        try {
          const collections = await getCollectionsByBrand(brand.id);
          setBrandCollections(prev => ({ ...prev, [brand.id]: collections }));
        } catch (error) {
          console.error('Error fetching collections:', error);
          setBrandCollections(prev => ({ ...prev, [brand.id]: [] }));
        } finally {
          setLoadingCollections(null);
        }
      }
    }
  };

  const handleCreateCollectionClick = (brand: Brand) => {
    setSelectedBrandForCollection(brand);
    setIsCollectionWizardOpen(true);
    setExpandedBrandId(null);
  };

  const handleCollectionCreated = () => {
    console.log('Collection created successfully');
  };

  const handleBrandCreated = (newBrand: Brand) => {
    console.log('New brand created:', newBrand);
    if (onBrandCreated) onBrandCreated();
  };

  return (
    <>
      <div className={`${styles.sidebar} ${!isDarkMode ? styles.light : ''} ${isOpen ? styles.open : ''}`}>
        {/* Logo */}
        <div className={styles.logo}>
          ROMIMI
        </div>

        {/* Main Content */}
        <div className={styles.content}>
          {/* CREATE Section */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>CREATE</div>

            <button
              className={`${styles.menuItem} ${activeMenu === 'product-visuals' ? styles.active : ''}`}
              onClick={() => handleMenuClick('product-visuals', '/')}
            >
              <span className={styles.icon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </span>
              <span className={styles.label}>Product Visuals</span>
            </button>

            <button
              className={`${styles.menuItem} ${activeMenu === 'ad-recreation' ? styles.active : ''}`}
              onClick={() => handleMenuClick('ad-recreation', '/ad-recreation')}
            >
              <span className={styles.icon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </span>
              <span className={styles.label}>Ad Recreation</span>
            </button>

            {/* Create New Brand Button */}
            <button
              className={styles.createBrandButton}
              onClick={() => setIsBrandModalOpen(true)}
            >
              <span className={styles.addIcon}>+</span>
              <span className={styles.label}>Create New Brand</span>
            </button>
          </div>

          {/* LIBRARY Section */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Library</div>

            <button
              className={`${styles.menuItem} ${activeBrandId === null && activeMenu === '' ? styles.active : ''}`}
              onClick={() => {
                setActiveBrandId(null);
                setActiveMenu('');
                setExpandedBrandId(null);
                if (onBrandSelect) onBrandSelect(null);
              }}
            >
              <span className={styles.icon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
                </svg>
              </span>
              <span className={styles.label}>All Products</span>
              <span className={styles.badge}>{brands.length}</span>
            </button>

            {/* Loading State */}
            {isLoadingBrands && (
              <div className={styles.loadingItem}>
                <span className={styles.loadingText}>Loading brands...</span>
              </div>
            )}

            {/* Dynamic Brands from API with Dropdown */}
            {!isLoadingBrands && brands.map((brand) => (
              <div key={brand.id} className={styles.brandWrapper}>
                <button
                  className={`${styles.menuItem} ${activeBrandId === brand.id ? styles.active : ''}`}
                  onClick={() => handleBrandClick(brand)}
                >
                  <span className={styles.icon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                  </span>
                  <span className={styles.label}>{brand.name}</span>
                  <span className={`${styles.expandIcon} ${expandedBrandId === brand.id ? styles.expanded : ''}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </button>

                {/* Brand Dropdown */}
                {expandedBrandId === brand.id && (
                  <div className={styles.brandDropdown}>
                    {/* Loading state */}
                    {loadingCollections === brand.id && (
                      <div className={styles.loadingItem}>
                        <span className={styles.loadingText}>Loading collections...</span>
                      </div>
                    )}

                    {/* Collections list */}
                    {brandCollections[brand.id]?.map((collection) => (
                      <button
                        key={collection.id}
                        className={styles.collectionItem}
                        onClick={() => {
                          console.log('Collection selected:', collection);
                          // TODO: Navigate to collection or select it
                        }}
                      >
                        <span className={styles.collectionIcon}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          </svg>
                        </span>
                        <span className={styles.collectionName}>{collection.name}</span>
                        {collection.code && (
                          <span className={styles.collectionCode}>{collection.code}</span>
                        )}
                      </button>
                    ))}

                    {/* No collections message */}
                    {!loadingCollections && brandCollections[brand.id]?.length === 0 && (
                      <div className={styles.emptyCollections}>
                        No collections yet
                      </div>
                    )}

                    {/* Create new collection button */}
                    <button
                      className={styles.dropdownItem}
                      onClick={() => handleCreateCollectionClick(brand)}
                    >
                      <span className={styles.addIcon}>+</span>
                      <span>Create New Collection</span>
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* No brands message */}
            {!isLoadingBrands && brands.length === 0 && (
              <div className={styles.emptyMessage}>
                No brands yet. Create your first brand!
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            className={styles.footerItem}
            onClick={() => handleMenuClick('da-templates', '/templates')}
          >
            <span className={styles.icon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </span>
            <span className={styles.label}>DA Templates</span>
          </button>

          <button
            className={styles.footerItem}
            onClick={() => handleMenuClick('settings', '/settings')}
          >
            <span className={styles.icon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
              </svg>
            </span>
            <span className={styles.label}>Settings</span>
          </button>

          {/* User Profile */}
          <div className={styles.userProfile}>
            <div className={styles.avatar}>
              {userInfo?.name?.[0]?.toUpperCase() || userInfo?.email?.[0]?.toUpperCase() || 'G'}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>
                {userInfo?.name || userInfo?.email?.split('@')[0] || 'gayratjon'}
              </div>
              <div className={styles.userPlan}>Pro Plan</div>
            </div>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Create Collection Wizard */}
      {selectedBrandForCollection && (
        <CreateCollectionWizard
          isOpen={isCollectionWizardOpen}
          onClose={() => setIsCollectionWizardOpen(false)}
          brandId={selectedBrandForCollection.id}
          brandName={selectedBrandForCollection.name}
          onCollectionCreated={handleCollectionCreated}
        />
      )}

      {/* Create Brand Modal */}
      <CreateBrandModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        onBrandCreated={handleBrandCreated}
      />
    </>
  );
};

export default HomeLeft;
