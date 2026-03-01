'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '@/scss/styles/HomePage/HomeLeft.module.scss';
import { getUserInfo, logout, UserInfo } from '@/libs/server/HomePage/signup';
import { getAllBrands, updateBrand, deleteBrand } from '@/libs/server/HomePage/brand';
import { getCollectionsByBrand, updateCollection, deleteCollection } from '@/libs/server/HomePage/collection';
import { getAllGenerations, deleteGeneration } from '@/libs/server/HomePage/merging';
import { getAllProducts, deleteProduct, deleteProductsByCategory } from '@/libs/server/HomePage/product';
import { deleteDAPreset } from '@/libs/server/HomePage/da';
import { Brand, UpdateBrandData } from '@/libs/types/homepage/brand';
import { Collection, UpdateCollectionData } from '@/libs/types/homepage/collection';
import { Generation } from '@/libs/types/homepage/generation';
import { Product } from '@/libs/types/homepage/product';
import CreateCollectionWizard from '@/libs/components/modals/CreateCollectionWizard';
import EditCollectionModal from '@/libs/components/modals/EditCollectionModal';
import CreateBrandModal from '@/libs/components/modals/CreateBrandModal';
import ProductUploadSection from './ProductUploadSection';
import ProductDropdown from './ProductDropdown';
import JSONPreviewPanel, { ProductJSON, DAJSON } from './JSONPreviewPanel';
import { resolveImageUrl } from '@/libs/utils/resolveImageUrl';

interface HomeLeftProps {
  isDarkMode?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  refreshTrigger?: number;
  onBrandSelect?: (brand: Brand | null) => void;
  onCollectionSelect?: (collection: Collection | null, brand: Brand | null) => void;
  /** Collection ID from parent (HomeTop or sidebar) - used to filter Product dropdown */
  selectedCollectionId?: string | null;
  onBrandCreated?: () => void;
  // NEW: Product Upload props
  frontImage?: File | null;
  backImage?: File | null;
  referenceImages?: File[];
  onFrontImageChange?: (file: File | null) => void;
  onBackImageChange?: (file: File | null) => void;
  onReferenceImagesChange?: (files: File[]) => void;
  onAnalyze?: (forceReanalyze?: boolean) => void;
  isAnalyzing?: boolean;
  isAnalyzed?: boolean;
  // NEW: JSON Panel props
  productJSON?: ProductJSON | null;
  daJSON?: DAJSON | null;
  mergedPrompts?: Record<string, string>;
  onPromptsChange?: (key: string, value: string) => void;
  onLibrarySelect?: (generation: Generation) => void;
  /** Increment when generation completes so Library refetches without page refresh */
  libraryRefreshTrigger?: number;
  /** NEW: Callback when user selects a product from the Product Catalog */
  onProductSelect?: (product: Product) => void;
  /** Block sidebar interactions during generation/merging */
  isBlocked?: boolean;
}

const HomeLeft: React.FC<HomeLeftProps> = ({
  isDarkMode = true,
  isOpen = true,
  onClose,
  refreshTrigger = 0,
  onBrandSelect,
  onCollectionSelect,
  selectedCollectionId: propSelectedCollectionId,
  onBrandCreated,
  // NEW: Product Upload props
  frontImage = null,
  backImage = null,
  referenceImages = [],
  onFrontImageChange,
  onBackImageChange,
  onReferenceImagesChange,
  onAnalyze,
  isAnalyzing = false,
  isAnalyzed = false,
  // NEW: JSON Panel props
  productJSON = null,
  daJSON = null,
  mergedPrompts = {},
  onPromptsChange,
  onLibrarySelect,
  libraryRefreshTrigger = 0,
  onProductSelect,
  isBlocked = false,
}) => {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState('product-visuals');
  const [activeBrandId, setActiveBrandId] = useState<string | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // Brand dropdown state
  const [expandedBrandId, setExpandedBrandId] = useState<string | null>(null);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [brandCollections, setBrandCollections] = useState<Record<string, Collection[]>>({});
  const [loadingCollections, setLoadingCollections] = useState<string | null>(null);

  // Modal states
  const [isCollectionWizardOpen, setIsCollectionWizardOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [selectedBrandForCollection, setSelectedBrandForCollection] = useState<Brand | null>(null);

  // Edit/Delete brand states
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editBrandName, setEditBrandName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmBrand, setDeleteConfirmBrand] = useState<Brand | null>(null);

  // Edit/Delete collection states
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [isEditCollectionModalOpen, setIsEditCollectionModalOpen] = useState(false);
  const [isDeletingCollection, setIsDeletingCollection] = useState(false);
  const [deleteConfirmCollection, setDeleteConfirmCollection] = useState<{ collection: Collection, brandId: string } | null>(null);

  // Library: generations with completed images (product names)
  const [libraryGenerations, setLibraryGenerations] = useState<Generation[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [activeLibraryId, setActiveLibraryId] = useState<string | null>(null);
  // Library expansion state (default: collapsed)
  const [isLibraryExpanded, setIsLibraryExpanded] = useState(false);
  // Track which product folders are open inside the library
  const [expandedProductFolders, setExpandedProductFolders] = useState<Set<string>>(new Set());

  // Product Catalog: products grouped by category
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);

  // Delete states for library items
  const [deleteConfirmGeneration, setDeleteConfirmGeneration] = useState<{ id: string; label: string } | null>(null);
  const [isDeletingGeneration, setIsDeletingGeneration] = useState(false);
  const [deleteConfirmDA, setDeleteConfirmDA] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingDA, setIsDeletingDA] = useState(false);

  useEffect(() => {
    const info = getUserInfo();
    setUserInfo(info);
  }, []);

  // Sync activeMenu with current pathname
  useEffect(() => {
    if (router.pathname.startsWith('/ad-recreation')) {
      setActiveMenu('ad-recreation');
    } else if (router.pathname === '/' || router.pathname.startsWith('/product')) {
      setActiveMenu('product-visuals');
    }
  }, [router.pathname]);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setIsLoadingBrands(true);
        const fetchedBrands = await getAllBrands();
        setBrands(fetchedBrands);
      } catch (error: any) {
        // 401 Unauthorized - User not logged in or token expired
        if (error?.status === 401) {
          console.warn('Unauthorized: Token expired or user not logged in');
        } else {
          console.error('Error fetching brands:', error);
        }
        setBrands([]);
      } finally {
        setIsLoadingBrands(false);
      }
    };

    fetchBrands();
  }, [refreshTrigger]);

  // Library: fetch generations that have completed images (for product names list)
  // Refetches when refreshTrigger or libraryRefreshTrigger changes (e.g. after new generation completes)
  useEffect(() => {
    if (!onLibrarySelect) return;
    const fetchLibrary = async () => {
      try {
        setLibraryLoading(true);
        const res = await getAllGenerations(undefined, undefined, undefined, 'completed', 1, 50);
        setLibraryGenerations(res.items || []);
      } catch (error: any) {
        if (error?.status !== 401) console.warn('Library fetch failed:', error);
        setLibraryGenerations([]);
      } finally {
        setLibraryLoading(false);
      }
    };
    fetchLibrary();
  }, [refreshTrigger, libraryRefreshTrigger, onLibrarySelect]);

  // Product Catalog: fetch all analyzed products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setCatalogLoading(true);
        const res = await getAllProducts(undefined, 1, 100);
        // Only show products that have been analyzed
        const analyzed = (res.items || []).filter(p => p.analyzed_product_json);
        setCatalogProducts(analyzed);
      } catch (error: any) {
        if (error?.status !== 401) console.warn('Product catalog fetch failed:', error);
        setCatalogProducts([]);
      } finally {
        setCatalogLoading(false);
      }
    };
    fetchProducts();
  }, [refreshTrigger, libraryRefreshTrigger]);

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
      setActiveCollectionId(null); // Reset collection when brand changes
      setActiveMenu('');
      if (onBrandSelect) onBrandSelect(brand);
      if (onCollectionSelect) onCollectionSelect(null, brand); // Reset collection in parent

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

  const handleCollectionCreated = async (newCollection: Collection) => {
    console.log('Collection created successfully:', newCollection);

    // Refresh collections for the brand
    if (selectedBrandForCollection) {
      try {
        const collections = await getCollectionsByBrand(selectedBrandForCollection.id);
        setBrandCollections(prev => ({
          ...prev,
          [selectedBrandForCollection.id]: collections
        }));

        // Expand the brand to show the new collection
        setExpandedBrandId(selectedBrandForCollection.id);
        setActiveBrandId(selectedBrandForCollection.id);

        // Auto-select the newly created collection
        setActiveCollectionId(newCollection.id);

        // Notify parent component about the selected collection
        if (onCollectionSelect) {
          onCollectionSelect(newCollection, selectedBrandForCollection);
        }
      } catch (error) {
        console.error('Error refreshing collections:', error);
      }
    }
  };

  const handleBrandCreated = (newBrand: Brand) => {
    console.log('New brand created:', newBrand);
    // Add brand to local state immediately for instant UI feedback
    setBrands(prev => {
      const exists = prev.some(b => b.id === newBrand.id);
      return exists ? prev : [...prev, newBrand];
    });
    setActiveBrandId(newBrand.id);
    if (onBrandSelect) onBrandSelect(newBrand);
    if (onBrandCreated) onBrandCreated();
    // Auto-open collection wizard for the new brand (Seamless DA creation)
    handleCreateCollectionClick(newBrand);
  };

  // Edit brand handlers
  const handleEditBrandClick = (brand: Brand, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBrand(brand);
    setEditBrandName(brand.name);
    setIsEditModalOpen(true);
  };

  const handleEditBrandSave = async () => {
    if (!editingBrand || !editBrandName.trim()) return;

    try {
      const updatedBrand = await updateBrand(editingBrand.id, { name: editBrandName.trim() });
      setBrands(prev => prev.map(b => b.id === updatedBrand.id ? updatedBrand : b));
      setIsEditModalOpen(false);
      setEditingBrand(null);
    } catch (error) {
      console.error('Error updating brand:', error);
    }
  };

  // Delete brand handlers
  const handleDeleteBrandClick = (brand: Brand, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmBrand(brand);
  };

  const handleDeleteBrandConfirm = async () => {
    if (!deleteConfirmBrand) return;

    setIsDeleting(true);
    try {
      await deleteBrand(deleteConfirmBrand.id);
      setBrands(prev => prev.filter(b => b.id !== deleteConfirmBrand.id));
      setDeleteConfirmBrand(null);
      setExpandedBrandId(null);
      if (onBrandCreated) onBrandCreated(); // Refresh
    } catch (error) {
      console.error('Error deleting brand:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Edit collection handlers
  const handleEditCollectionClick = (collection: Collection, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCollection(collection);
    setIsEditCollectionModalOpen(true);
  };

  const handleEditCollectionSave = (updatedCollection: Collection) => {
    // Update in brandCollections
    setBrandCollections(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(brandId => {
        const collections = newState[brandId];
        const index = collections.findIndex(c => c.id === updatedCollection.id);
        if (index !== -1) {
          collections[index] = updatedCollection;
        }
      });
      return newState;
    });
    setEditingCollection(null);
  };

  // Delete collection handlers
  const handleDeleteCollectionClick = (collection: Collection, brandId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmCollection({ collection, brandId });
  };

  const handleDeleteCollectionConfirm = async () => {
    if (!deleteConfirmCollection) return;

    setIsDeletingCollection(true);
    try {
      await deleteCollection(deleteConfirmCollection.collection.id);
      setBrandCollections(prev => ({
        ...prev,
        [deleteConfirmCollection.brandId]: prev[deleteConfirmCollection.brandId].filter(
          c => c.id !== deleteConfirmCollection.collection.id
        )
      }));
      setDeleteConfirmCollection(null);
    } catch (error) {
      console.error('Error deleting collection:', error);
    } finally {
      setIsDeletingCollection(false);
    }
  };

  // Delete product from catalog dropdown
  const handleCatalogProductDelete = async (productId: string) => {
    await deleteProduct(productId);
    // Remove from catalog list
    setCatalogProducts(prev => prev.filter(p => p.id !== productId));
    // Remove from library generations
    setLibraryGenerations(prev => prev.filter(g => {
      const pid = g.product?.id || g.product_id;
      return pid !== productId;
    }));
    // Clear selection if deleted product was selected
    if (activeProductId === productId) {
      setActiveProductId(null);
    }
    if (activeLibraryId) {
      const activeGen = libraryGenerations.find(g => g.id === activeLibraryId);
      const activePid = activeGen?.product?.id || activeGen?.product_id;
      if (activePid === productId) {
        setActiveLibraryId(null);
      }
    }
  };

  // Delete all products in a category
  const handleCatalogCategoryDelete = async (category: string, productIds: string[]) => {
    await deleteProductsByCategory(category);
    // Remove deleted products from catalog list
    setCatalogProducts(prev => prev.filter(p => !productIds.includes(p.id)));
    // Remove from library generations
    setLibraryGenerations(prev => prev.filter(g => {
      const pid = g.product?.id || g.product_id;
      return !productIds.includes(pid);
    }));
    // Clear selection if deleted product was selected
    if (activeProductId && productIds.includes(activeProductId)) {
      setActiveProductId(null);
    }
  };

  // Delete single generation from library
  // If the folder becomes empty after deletion, auto-delete the product too
  const handleDeleteGenerationConfirm = async () => {
    if (!deleteConfirmGeneration) return;
    setIsDeletingGeneration(true);
    try {
      // Find the product ID for this generation before removing it
      const genToDelete = libraryGenerations.find(g => g.id === deleteConfirmGeneration.id);
      const productId = genToDelete?.product?.id || genToDelete?.product_id;

      await deleteGeneration(deleteConfirmGeneration.id);
      const remaining = libraryGenerations.filter(g => g.id !== deleteConfirmGeneration.id);
      setLibraryGenerations(remaining);

      if (activeLibraryId === deleteConfirmGeneration.id) {
        setActiveLibraryId(null);
      }

      // Check if the product folder is now empty — if so, delete the product from DB
      if (productId) {
        const folderStillHasItems = remaining.some(g => {
          const pid = g.product?.id || g.product_id;
          return pid === productId;
        });
        if (!folderStillHasItems) {
          try {
            await deleteProduct(productId);
            setCatalogProducts(prev => prev.filter(p => p.id !== productId));
            if (activeProductId === productId) {
              setActiveProductId(null);
            }
          } catch (err) {
            console.error('Error auto-deleting empty product:', err);
          }
        }
      }

      setDeleteConfirmGeneration(null);
    } catch (error) {
      console.error('Error deleting generation:', error);
    } finally {
      setIsDeletingGeneration(false);
    }
  };

  // Delete DA preset (collection/brand in this context)
  const handleDeleteDAConfirm = async () => {
    if (!deleteConfirmDA) return;
    setIsDeletingDA(true);
    try {
      await deleteDAPreset(deleteConfirmDA.id);
      setBrands(prev => prev.filter(b => b.id !== deleteConfirmDA.id));
      setDeleteConfirmDA(null);
    } catch (error) {
      console.error('Error deleting DA preset:', error);
    } finally {
      setIsDeletingDA(false);
    }
  };

  return (
    <>
      <div className={`${styles.sidebar} ${!isDarkMode ? styles.light : ''} ${isOpen ? styles.open : ''}`}>
        {/* Blocking overlay during generation/merging */}
        {isBlocked && <div className={styles.blockedOverlay} />}

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
          </div>

          {/* Product Upload Section */}
          {onFrontImageChange && onBackImageChange && onAnalyze && (
            <ProductUploadSection
              isDarkMode={isDarkMode}
              frontImage={frontImage || null}
              backImage={backImage || null}
              referenceImages={referenceImages}
              onFrontImageChange={onFrontImageChange}
              onBackImageChange={onBackImageChange}
              onReferenceImagesChange={onReferenceImagesChange}
              onAnalyze={onAnalyze}
              isAnalyzing={isAnalyzing}
              isAnalyzed={isAnalyzed}
            />
          )}

          {/* Design Aesthetics Section (formerly Library) */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Design Aesthetics</div>

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
            {!isLoadingBrands && brands.map((brand) => {
              // Hide non-selected brands when a brand is expanded
              const shouldShow = !expandedBrandId || expandedBrandId === brand.id;
              if (!shouldShow) return null;

              return (
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
                        <div key={collection.id} className={styles.collectionItemWrapper}>
                          <button
                            className={`${styles.collectionItem} ${activeCollectionId === collection.id ? styles.active : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveCollectionId(collection.id);
                              setActiveBrandId(brand.id); // Ensure brand is active
                              if (onBrandSelect) onBrandSelect(brand);
                              if (onCollectionSelect) onCollectionSelect(collection, brand);
                            }}
                          >
                            <span className={styles.collectionIcon}>
                              {collection.da_reference_image_url ? (
                                <>
                                  <img
                                    src={resolveImageUrl(collection.da_reference_image_url)}
                                    alt=""
                                    className={styles.collectionThumb}
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                      if (fallback) fallback.style.display = 'block';
                                    }}
                                  />
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'none' }}>
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                  </svg>
                                </>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                </svg>
                              )}
                            </span>
                            <span className={styles.collectionName}>{collection.name}</span>
                            {collection.code && (
                              <span className={styles.collectionCode}>{collection.code}</span>
                            )}
                          </button>
                          <div className={styles.collectionActions}>
                            <button
                              className={styles.actionBtn}
                              onClick={(e) => handleEditCollectionClick(collection, e)}
                              title="Edit"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              className={`${styles.actionBtn} ${styles.deleteAction}`}
                              onClick={(e) => handleDeleteCollectionClick(collection, brand.id, e)}
                              title="Delete"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="m19 6-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </div>
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

                      {/* Divider */}
                      <div className={styles.dropdownDivider} />

                      {/* Edit Brand */}
                      <button
                        className={styles.dropdownItem}
                        onClick={(e) => handleEditBrandClick(brand, e)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        <span>Edit Brand</span>
                      </button>

                      {/* Delete Brand */}
                      <button
                        className={`${styles.dropdownItem} ${styles.danger}`}
                        onClick={(e) => handleDeleteBrandClick(brand, e)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="m19 6-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        <span>Delete Brand</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Create Brand Button — always visible */}
            {!isLoadingBrands && (
              <button
                className={styles.createBrandButton}
                onClick={() => setIsBrandModalOpen(true)}
              >
                <span className={styles.addIcon}>+</span>
                <span className={styles.label}>Create Brand</span>
              </button>
            )}
          </div>

          {/* ═══════════ PRODUCT DROPDOWN: Collection > Category > Product ═══════════ */}
          {onProductSelect && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>PRODUCT</div>
              <ProductDropdown
                products={catalogProducts}
                isLoading={catalogLoading}
                selectedProductId={activeProductId}
                selectedCollectionId={propSelectedCollectionId ?? activeCollectionId}
                onProductSelect={(product) => {
                  setActiveProductId(product.id);
                  onProductSelect(product);
                }}
                onProductDelete={handleCatalogProductDelete}
                onCategoryDelete={handleCatalogCategoryDelete}
                isDarkMode={isDarkMode}
                placeholder="Select Product"
              />
            </div>
          )}

          {/* Library Section: grouped by product as collapsible folders */}
          {onLibrarySelect && (
            <div className={styles.section}>
              {/* Section header — click to expand/collapse entire library */}
              <button
                className={styles.sectionTitle}
                onClick={() => setIsLibraryExpanded(!isLibraryExpanded)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '0' }}
              >
                <span>LIBRARY</span>
                <svg
                  width="16" height="16" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ transform: isLibraryExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isLibraryExpanded && (
                <>
                  {libraryLoading && (
                    <div className={styles.loadingItem}>
                      <span className={styles.loadingText}>Loading...</span>
                    </div>
                  )}
                  {!libraryLoading && libraryGenerations.length === 0 && (
                    <div className={styles.emptyCollections}>No generated visuals yet</div>
                  )}

                  {!libraryLoading && (() => {
                    // Group generations by product ID
                    const groups: Record<string, { productName: string; items: Generation[] }> = {};
                    for (const gen of libraryGenerations) {
                      const pid = gen.product?.id || gen.product_id || 'unknown';
                      const pname = gen.product?.name || 'Unknown Product';
                      if (!groups[pid]) groups[pid] = { productName: pname, items: [] };
                      groups[pid].items.push(gen);
                    }

                    const formatDate = (iso: string) => {
                      const d = new Date(iso);
                      const now = new Date();
                      const diffMs = now.getTime() - d.getTime();
                      const diffDays = Math.floor(diffMs / 86400000);
                      if (diffDays === 0) return 'Today';
                      if (diffDays === 1) return 'Yesterday';
                      if (diffDays < 7) return `${diffDays}d ago`;
                      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                    };

                    const getThumb = (gen: Generation): string | null => {
                      const visuals = gen.visuals || gen.visual_outputs || [];
                      const completed = visuals.find(v => v.status === 'completed' && v.image_url);
                      return resolveImageUrl(completed?.image_url) || null;
                    };

                    return Object.entries(groups).map(([pid, group]) => {
                      const isFolderOpen = expandedProductFolders.has(pid);
                      const hasActive = group.items.some(g => g.id === activeLibraryId);

                      return (
                        <div key={pid} style={{ marginBottom: '2px' }}>
                          {/* Folder row with delete */}
                          <div
                            className="lib-folder-row"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <button
                              onClick={() => setExpandedProductFolders(prev => {
                                const next = new Set(prev);
                                isFolderOpen ? next.delete(pid) : next.add(pid);
                                return next;
                              })}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                flex: 1,
                                padding: '8px 10px',
                                background: hasActive
                                  ? 'rgba(79,70,229,0.12)'
                                  : isFolderOpen
                                    ? (isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)')
                                    : 'transparent',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
                                textAlign: 'left',
                                transition: 'background 0.15s',
                              }}
                            >
                              {/* Folder icon */}
                              <svg
                                width="15" height="15" viewBox="0 0 24 24"
                                fill={isFolderOpen ? 'rgba(79,70,229,0.3)' : 'transparent'}
                                stroke={isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)'}
                                strokeWidth="2"
                                style={{ flexShrink: 0 }}
                              >
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                              </svg>

                              {/* Product name */}
                              <span style={{
                                flex: 1,
                                fontSize: '12px',
                                fontWeight: 500,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}>
                                {group.productName}
                              </span>

                              {/* Count badge */}
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                padding: '1px 6px',
                                borderRadius: '10px',
                                background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                color: isDarkMode ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)',
                                flexShrink: 0,
                              }}>
                                {group.items.length}
                              </span>

                              {/* Chevron */}
                              <svg
                                width="12" height="12" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" strokeWidth="2.5"
                                style={{
                                  flexShrink: 0,
                                  opacity: 0.4,
                                  transform: isFolderOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.18s',
                                }}
                              >
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </button>

                          </div>

                          {/* Folder contents — individual generation items */}
                          {isFolderOpen && (
                            <div style={{ paddingLeft: '10px', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {group.items.map((gen, idx) => {
                                const isActive = activeLibraryId === gen.id;
                                const thumb = getThumb(gen);
                                const dateStr = formatDate(gen.created_at);
                                const shotCount = (gen.visuals || gen.visual_outputs || []).filter(v => v.status === 'completed').length;

                                return (
                                  <div
                                    key={gen.id}
                                    className="lib-gen-row"
                                    style={{ position: 'relative' }}
                                    onMouseEnter={e => {
                                      const del = e.currentTarget.querySelector('.lib-gen-delete') as HTMLElement;
                                      if (del) del.style.opacity = '1';
                                    }}
                                    onMouseLeave={e => {
                                      const del = e.currentTarget.querySelector('.lib-gen-delete') as HTMLElement;
                                      if (del) del.style.opacity = '0';
                                    }}
                                  >
                                    <button
                                      onClick={() => {
                                        setActiveLibraryId(gen.id);
                                        onLibrarySelect(gen);
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        width: '100%',
                                        padding: '6px 8px',
                                        background: isActive
                                          ? 'rgba(79,70,229,0.18)'
                                          : 'transparent',
                                        border: isActive
                                          ? '1px solid rgba(79,70,229,0.35)'
                                          : '1px solid transparent',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.15s',
                                      }}
                                      onMouseEnter={e => {
                                        if (!isActive)
                                          (e.currentTarget as HTMLButtonElement).style.background = isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
                                      }}
                                      onMouseLeave={e => {
                                        if (!isActive)
                                          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                                      }}
                                    >
                                      {/* Thumbnail */}
                                      <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '5px',
                                        overflow: 'hidden',
                                        flexShrink: 0,
                                        background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
                                        border: isActive ? '1.5px solid rgba(79,70,229,0.5)' : '1px solid rgba(255,255,255,0.08)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}>
                                        {thumb ? (
                                          <img
                                            src={thumb}
                                            alt=""
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={(e) => {
                                              e.currentTarget.style.display = 'none';
                                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                              if (fallback) fallback.style.display = 'block';
                                            }}
                                          />
                                        ) : null}
                                        <svg
                                          width="14" height="14" viewBox="0 0 24 24" fill="none"
                                          stroke={isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'}
                                          strokeWidth="2"
                                          style={{ display: thumb ? 'none' : 'block' }}
                                        >
                                          <rect x="3" y="3" width="18" height="18" rx="2" />
                                          <circle cx="8.5" cy="8.5" r="1.5" />
                                          <polyline points="21 15 16 10 5 21" />
                                        </svg>
                                      </div>

                                      {/* Info */}
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                          fontSize: '11px',
                                          fontWeight: 500,
                                          color: isDarkMode ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.7)',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                        }}>
                                          Gen #{idx + 1}
                                        </div>
                                        <div style={{
                                          fontSize: '10px',
                                          color: isDarkMode ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.38)',
                                          marginTop: '1px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                        }}>
                                          {dateStr}
                                          {shotCount > 0 && (
                                            <span style={{
                                              padding: '0 4px',
                                              background: isDarkMode ? 'rgba(79,70,229,0.2)' : 'rgba(79,70,229,0.12)',
                                              borderRadius: '3px',
                                              color: '#7c6fe0',
                                              fontWeight: 600,
                                            }}>
                                              {shotCount} shots
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Active dot */}
                                      {isActive && (
                                        <div style={{
                                          width: '6px',
                                          height: '6px',
                                          borderRadius: '50%',
                                          background: '#4f46e5',
                                          flexShrink: 0,
                                        }} />
                                      )}
                                    </button>

                                    {/* Delete generation button (shows on hover) */}
                                    <button
                                      className="lib-gen-delete"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirmGeneration({ id: gen.id, label: `Gen #${idx + 1}` });
                                      }}
                                      title="Delete generation"
                                      style={{
                                        position: 'absolute',
                                        right: '4px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        opacity: 0,
                                        transition: 'opacity 0.15s',
                                        background: 'rgba(239,68,68,0.15)',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '3px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 2,
                                      }}
                                    >
                                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="m19 6-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                      </svg>
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </>
              )}
            </div>
          )}
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
      </div >

      {/* Create Collection Wizard - Unified Flow */}
      {
        isCollectionWizardOpen && (
          <CreateCollectionWizard
            isOpen={isCollectionWizardOpen}
            onClose={() => {
              setIsCollectionWizardOpen(false);
              setSelectedBrandForCollection(null);
            }}
            brandId={selectedBrandForCollection?.id}
            brandName={selectedBrandForCollection?.name}
            onCollectionCreated={handleCollectionCreated}
            onBrandCreated={handleBrandCreated}
            availableBrands={brands}
          />
        )
      }

      {/* Create Brand Modal */}
      <CreateBrandModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        onBrandCreated={handleBrandCreated}
      />

      {/* Edit Brand Modal */}
      {
        isEditModalOpen && editingBrand && (
          <div className={styles.modalOverlay} onClick={() => setIsEditModalOpen(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3>Edit Brand</h3>
              <input
                type="text"
                value={editBrandName}
                onChange={(e) => setEditBrandName(e.target.value)}
                className={styles.modalInput}
                placeholder="Brand name"
                autoFocus
              />
              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
                <button className={styles.saveBtn} onClick={handleEditBrandSave}>
                  Save
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Delete Brand Confirmation Modal */}
      {
        deleteConfirmBrand && (
          <div className={styles.modalOverlay} onClick={() => setDeleteConfirmBrand(null)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3>Delete Brand</h3>
              <p className={styles.modalText}>
                Are you sure you want to delete <strong>{deleteConfirmBrand.name}</strong>?
                This will also delete all collections in this brand.
              </p>
              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setDeleteConfirmBrand(null)}>
                  Cancel
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={handleDeleteBrandConfirm}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Edit Collection Modal */}
      {
        editingCollection && (
          <EditCollectionModal
            collection={editingCollection}
            isOpen={isEditCollectionModalOpen}
            onClose={() => {
              setIsEditCollectionModalOpen(false);
              setEditingCollection(null);
            }}
            onSave={handleEditCollectionSave}
            isDarkMode={isDarkMode}
          />
        )
      }

      {/* Delete Collection Confirmation Modal */}
      {
        deleteConfirmCollection && (
          <div className={styles.modalOverlay} onClick={() => setDeleteConfirmCollection(null)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3>Delete Collection</h3>
              <p className={styles.modalText}>
                Are you sure you want to delete <strong>{deleteConfirmCollection.collection.name}</strong>?
              </p>
              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setDeleteConfirmCollection(null)}>
                  Cancel
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={handleDeleteCollectionConfirm}
                  disabled={isDeletingCollection}
                >
                  {isDeletingCollection ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Delete Generation Confirmation Modal */}
      {
        deleteConfirmGeneration && (
          <div className={styles.modalOverlay} onClick={() => setDeleteConfirmGeneration(null)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3>Delete Generation</h3>
              <p className={styles.modalText}>
                Are you sure you want to delete <strong>{deleteConfirmGeneration.label}</strong>?
                This action cannot be undone.
              </p>
              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setDeleteConfirmGeneration(null)}>
                  Cancel
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={handleDeleteGenerationConfirm}
                  disabled={isDeletingGeneration}
                >
                  {isDeletingGeneration ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Delete DA Preset Confirmation Modal */}
      {
        deleteConfirmDA && (
          <div className={styles.modalOverlay} onClick={() => setDeleteConfirmDA(null)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3>Delete DA Preset</h3>
              <p className={styles.modalText}>
                Are you sure you want to delete <strong>{deleteConfirmDA.name}</strong>?
              </p>
              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setDeleteConfirmDA(null)}>
                  Cancel
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={handleDeleteDAConfirm}
                  disabled={isDeletingDA}
                >
                  {isDeletingDA ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </>
  );
};

export default HomeLeft;
