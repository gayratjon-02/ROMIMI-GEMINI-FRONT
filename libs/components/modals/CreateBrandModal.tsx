'use client';

import React, { useState } from 'react';
import { useTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import styles from '@/scss/styles/Modals/CreateBrandModal.module.scss';
import { createBrand } from '@/libs/server/HomePage/brand';
import { Brand } from '@/libs/types/homepage/brand';
import { AuthApiError } from '@/libs/components/types/config';

interface CreateBrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBrandCreated?: (brand: Brand) => void;
}

const CreateBrandModal: React.FC<CreateBrandModalProps> = ({
  isOpen,
  onClose,
  onBrandCreated
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const [formData, setFormData] = useState({
    name: '',
    brief: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const newBrand = await createBrand({
        name: formData.name,
        brand_brief: formData.brief || undefined
      });

      console.log('Brand created:', newBrand);

      // Reset form
      setFormData({ name: '', brief: '' });

      // Notify parent component
      if (onBrandCreated) {
        onBrandCreated(newBrand);
      }

      onClose();
    } catch (err) {
      if (err instanceof AuthApiError) {
        setError(err.errors.join(', '));
      } else {
        setError('Failed to create brand. Please try again.');
      }
      console.error('Error creating brand:', err);
    } finally {
      setIsLoading(false);
    }
  };

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
        <h2 className={styles.title}>Create New Brand</h2>
        <p className={styles.subtitle}>Add a new brand to organize your collections.</p>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Error Message */}
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          {/* Brand Name */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Brand Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., New Balance, Nike, Adidas"
              className={styles.input}
              required
              disabled={isLoading}
            />
          </div>

          {/* Brand Brief */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Brand Brief (Optional)</label>
            <textarea
              name="brief"
              value={formData.brief}
              onChange={handleInputChange}
              placeholder="e.g., A lifestyle brand focused on urban fashion and streetwear"
              className={styles.textarea}
              rows={4}
              disabled={isLoading}
            />
          </div>

          {/* Action Buttons */}
          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.createButton}
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Brand'}
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

export default CreateBrandModal;
