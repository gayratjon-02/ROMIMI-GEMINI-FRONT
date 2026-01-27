'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LockIcon from '@mui/icons-material/Lock';
import styles from '@/scss/styles/Modals/CreateCollectionModal.module.scss';
import { createCollection } from '@/libs/server/HomePage/collection';
import { Collection } from '@/libs/types/homepage/collection';
import { Brand } from '@/libs/types/homepage/brand';
import { AuthApiError } from '@/libs/components/types/config';

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCollectionCreated?: (collection: Collection) => void;
  brands: Brand[];
  selectedBrandId?: string;
  onOpenBrandModal?: () => void;
}

const CreateCollectionModal: React.FC<CreateCollectionModalProps> = ({
  isOpen,
  onClose,
  onCollectionCreated,
  brands,
  selectedBrandId,
  onOpenBrandModal
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    brand_id: selectedBrandId || '',
    description: ''
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);

  // Check if brand is pre-selected (locked)
  const isBrandLocked = !!selectedBrandId;

  // Sync selectedBrandId when modal opens
  useEffect(() => {
    if (selectedBrandId) {
      setFormData(prev => ({ ...prev, brand_id: selectedBrandId }));
    }
  }, [selectedBrandId, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError(null);
  };

  const handleBrandSelect = (brandId: string) => {
    setFormData({
      ...formData,
      brand_id: brandId
    });
    setIsBrandDropdownOpen(false);
    if (error) setError(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.brand_id) {
      setError('Please select a brand');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newCollection = await createCollection({
        name: formData.name,
        brand_id: formData.brand_id,
        code: formData.code || undefined,
        description: formData.description || undefined
      });

      console.log('Collection created:', newCollection);

      // Reset form
      setFormData({ name: '', code: '', brand_id: '', description: '' });
      setSelectedImage(null);
      setImagePreview(null);

      if (onCollectionCreated) {
        onCollectionCreated(newCollection);
      }

      onClose();
    } catch (err) {
      if (err instanceof AuthApiError) {
        setError(err.errors.join(', '));
      } else {
        setError('Failed to create collection. Please try again.');
      }
      console.error('Error creating collection:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedBrand = brands.find(b => b.id === formData.brand_id);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={`${styles.modalContent} ${isDarkMode ? styles.dark : styles.light}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button className={styles.closeButton} onClick={onClose}>
          <CloseIcon fontSize="small" />
        </button>

        {/* Title */}
        <h2 className={styles.title}>Create Collection</h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Error Message */}
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          {/* Name and Code Row */}
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Collection Name <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., SS26"
                className={styles.input}
                required
                disabled={isLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Code (Optional)</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="e.g., ss26"
                className={styles.input}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Brand Selection */}
          <div className={styles.formGroup}>
            <div className={styles.labelRow}>
              <label className={styles.label}>
                Brand <span className={styles.required}>*</span>
              </label>
              {/* Only show + New Brand when brand is not locked */}
              {onOpenBrandModal && !isBrandLocked && (
                <button
                  type="button"
                  className={styles.newBrandButton}
                  onClick={() => {
                    onClose();
                    onOpenBrandModal();
                  }}
                >
                  + New Brand
                </button>
              )}
            </div>
            <div className={styles.selectWrapper}>
              {isBrandLocked ? (
                /* Locked brand display */
                <div className={`${styles.selectButton} ${styles.locked}`}>
                  <span>{selectedBrand?.name || 'Selected Brand'}</span>
                  <LockIcon fontSize="small" className={styles.lockIcon} />
                </div>
              ) : (
                /* Editable brand dropdown */
                <div
                  className={`${styles.selectButton} ${isBrandDropdownOpen ? styles.open : ''}`}
                  onClick={() => !isLoading && setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                >
                  <span>{selectedBrand?.name || 'Select a brand'}</span>
                  <KeyboardArrowDownIcon fontSize="small" className={styles.arrowIcon} />
                </div>
              )}
              {!isBrandLocked && isBrandDropdownOpen && (
                <div className={styles.dropdown}>
                  {brands.length === 0 ? (
                    <div className={styles.dropdownEmpty}>
                      No brands available
                    </div>
                  ) : (
                    brands.map((brand) => (
                      <div
                        key={brand.id}
                        className={`${styles.dropdownItem} ${formData.brand_id === brand.id ? styles.selected : ''}`}
                        onClick={() => handleBrandSelect(brand.id)}
                      >
                        {brand.name}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Description (Optional)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="e.g., Spring/Summer 2026 collection with vibrant colors"
              className={styles.textarea}
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* DA Reference Image */}
          <div className={styles.formGroup}>
            <label className={styles.label}>DA Reference Image (Optional)</label>
            <div className={styles.uploadSection}>
              <div
                className={styles.uploadBox}
                onClick={handleUploadClick}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className={styles.imagePreview} />
                ) : (
                  <>
                    <span className={styles.uploadIcon}>+</span>
                    <span className={styles.uploadText}>Upload</span>
                  </>
                )}
              </div>
              <div className={styles.uploadDescription}>
                <p>
                  Upload a reference image to automatically analyze the visual
                  style (Direction Artistique) for this collection.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className={styles.fileInput}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.createButton}
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Collection'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCollectionModal;
