'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styles from '@/scss/styles/HomePage/ProductDropdown.module.scss';
import { Product } from '@/libs/types/homepage/product';

interface ProductDropdownProps {
  products: Product[];
  isLoading?: boolean;
  selectedProductId: string | null;
  selectedCollectionId: string | null;
  onProductSelect: (product: Product) => void;
  isDarkMode?: boolean;
  placeholder?: string;
}

const ProductDropdown: React.FC<ProductDropdownProps> = ({
  products,
  isLoading = false,
  selectedProductId,
  selectedCollectionId,
  onProductSelect,
  isDarkMode = true,
  placeholder = 'Select Product',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Filter by collection when one is selected
  const filteredProducts = useMemo(() => {
    if (!selectedCollectionId) return products;
    return products.filter((p) => p.collection_id === selectedCollectionId);
  }, [products, selectedCollectionId]);

  // Group by category
  const productsByCategory = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    filteredProducts.forEach((product) => {
      const cat = product.category || 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(product);
    });
    return groups;
  }, [filteredProducts]);

  const categories = useMemo(() => Object.keys(productsByCategory), [productsByCategory]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  );

  // Reset active category when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setActiveCategory(null);
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = () => setIsOpen(false);
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  const handleCategoryClick = (category: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCategory(category);
  };

  const handleBackClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCategory(null);
  };

  const handleSelect = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    onProductSelect(product);
    setIsOpen(false);
    setActiveCategory(null);
  };

  return (
    <div className={`${styles.productDropdown} ${!isDarkMode ? styles.light : ''}`}>
      <button
        type="button"
        className={`${styles.trigger} ${selectedProduct ? styles.hasSelection : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        disabled={isLoading}
      >
        <span className={styles.triggerIcon}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          </svg>
        </span>
        <span className={styles.triggerLabel}>
          {isLoading ? 'Loading...' : selectedProduct?.name || placeholder}
        </span>
        <span className={`${styles.triggerArrow} ${isOpen ? styles.open : ''}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
          {isLoading ? (
            <div className={styles.loading}>Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className={styles.empty}>
              {selectedCollectionId
                ? 'No products in this collection'
                : 'No analyzed products yet'}
            </div>
          ) : activeCategory === null ? (
            /* ─── Level 1: Categories ─── */
            <div className={styles.list}>
              <div className={styles.levelHeader}>Categories</div>
              {categories.map((category) => {
                const count = productsByCategory[category].length;
                return (
                  <button
                    key={category}
                    type="button"
                    className={styles.categoryItem}
                    onClick={(e) => handleCategoryClick(category, e)}
                  >
                    <span className={styles.categoryIcon}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                    </span>
                    <span className={styles.categoryName}>{category}</span>
                    <span className={styles.categoryCount}>{count}</span>
                    <span className={styles.categoryArrow}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* ─── Level 2: Products in Category ─── */
            <div className={styles.list}>
              <button
                type="button"
                className={styles.backButton}
                onClick={handleBackClick}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                <span>{activeCategory}</span>
              </button>
              {productsByCategory[activeCategory]?.map((product) => {
                const isActive = selectedProductId === product.id;
                return (
                  <button
                    key={product.id}
                    type="button"
                    className={`${styles.productItem} ${isActive ? styles.active : ''}`}
                    onClick={(e) => handleSelect(product, e)}
                  >
                    {product.front_image_url ? (
                      <img
                        src={product.front_image_url}
                        alt=""
                        className={styles.productThumb}
                      />
                    ) : (
                      <span className={styles.productThumbPlaceholder}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </span>
                    )}
                    <span className={styles.productName} title={product.name}>
                      {product.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductDropdown;
