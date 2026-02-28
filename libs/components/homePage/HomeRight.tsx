'use client';

import React, { useState, useRef, useCallback } from 'react';
import styles from '@/scss/styles/HomePage/HomeRight.module.scss';
import { Brand } from '@/libs/types/homepage/brand';
import { uploadModelReference } from '@/libs/server/HomePage/brand';

interface HomeRightProps {
	isDarkMode: boolean;
	selectedBrand: Brand | null;
	onBrandUpdated: (brand: Brand) => void;
}

interface UploadState {
	isUploading: boolean;
	success: string | null;
	error: string | null;
}

const HomeRight: React.FC<HomeRightProps> = ({ isDarkMode, selectedBrand, onBrandUpdated }) => {
	const [adultUpload, setAdultUpload] = useState<UploadState>({ isUploading: false, success: null, error: null });
	const [kidUpload, setKidUpload] = useState<UploadState>({ isUploading: false, success: null, error: null });
	const [adultDragOver, setAdultDragOver] = useState(false);
	const [kidDragOver, setKidDragOver] = useState(false);

	const adultInputRef = useRef<HTMLInputElement>(null);
	const kidInputRef = useRef<HTMLInputElement>(null);

	const handleUpload = useCallback(async (file: File, type: 'adult' | 'kid') => {
		if (!selectedBrand) return;

		if (!file.type.startsWith('image/')) {
			const setter = type === 'adult' ? setAdultUpload : setKidUpload;
			setter({ isUploading: false, success: null, error: 'Only image files are allowed' });
			return;
		}

		if (file.size > 10 * 1024 * 1024) {
			const setter = type === 'adult' ? setAdultUpload : setKidUpload;
			setter({ isUploading: false, success: null, error: 'File must be under 10MB' });
			return;
		}

		const setter = type === 'adult' ? setAdultUpload : setKidUpload;
		setter({ isUploading: true, success: null, error: null });

		try {
			const updatedBrand = await uploadModelReference(selectedBrand.id, type, file);
			onBrandUpdated(updatedBrand);
			setter({ isUploading: false, success: 'Uploaded successfully', error: null });
			setTimeout(() => setter(prev => ({ ...prev, success: null })), 3000);
		} catch (err: any) {
			setter({ isUploading: false, success: null, error: err.message || 'Upload failed' });
		}
	}, [selectedBrand, onBrandUpdated]);

	const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: 'adult' | 'kid') => {
		const file = e.target.files?.[0];
		if (file) handleUpload(file, type);
		e.target.value = '';
	}, [handleUpload]);

	const handleDrop = useCallback((e: React.DragEvent, type: 'adult' | 'kid') => {
		e.preventDefault();
		if (type === 'adult') setAdultDragOver(false);
		else setKidDragOver(false);

		const file = e.dataTransfer.files?.[0];
		if (file) handleUpload(file, type);
	}, [handleUpload]);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
	}, []);

	const renderUploadZone = (
		type: 'adult' | 'kid',
		imageUrl: string | undefined,
		uploadState: UploadState,
		dragOver: boolean,
		setDragOver: (v: boolean) => void,
		inputRef: React.RefObject<HTMLInputElement>
	) => {
		const label = type === 'adult' ? 'Adult Model' : 'Kid Model';

		return (
			<div className={styles.section}>
				<div className={styles.sectionLabel}>{label}</div>

				<div
					className={`${styles.uploadZone} ${dragOver ? styles.uploadZoneDragOver : ''}`}
					onClick={() => !uploadState.isUploading && inputRef.current?.click()}
					onDrop={(e) => handleDrop(e, type)}
					onDragOver={handleDragOver}
					onDragEnter={() => setDragOver(true)}
					onDragLeave={() => setDragOver(false)}
				>
					{imageUrl ? (
						<div className={styles.previewWrapper}>
							<img src={imageUrl} alt={label} className={styles.previewImage} />
							{!uploadState.isUploading && (
								<button
									className={styles.removeBtn}
									onClick={(e) => {
										e.stopPropagation();
										inputRef.current?.click();
									}}
									title="Replace image"
								>
									&#8635;
								</button>
							)}
						</div>
					) : (
						<>
							<div className={styles.uploadIcon}>&#128247;</div>
							<div className={styles.uploadText}>
								Drop {type} model photo here
							</div>
							<div className={styles.uploadHint}>or click to browse</div>
						</>
					)}

					{uploadState.isUploading && (
						<div className={styles.uploadingOverlay}>
							<div className={styles.spinner} />
							<div className={styles.uploadingText}>Uploading...</div>
						</div>
					)}
				</div>

				{uploadState.success && (
					<div className={styles.successMsg}>{uploadState.success}</div>
				)}
				{uploadState.error && (
					<div className={styles.errorMsg}>{uploadState.error}</div>
				)}

				<input
					ref={inputRef}
					type="file"
					accept="image/*"
					style={{ display: 'none' }}
					onChange={(e) => handleFileSelect(e, type)}
				/>
			</div>
		);
	};

	return (
		<div className={`${styles.sidebar} ${isDarkMode ? '' : styles.light}`}>
			<div className={styles.header}>
				<h3 className={styles.title}>Model Reference</h3>
				<div className={styles.subtitle}>
					{selectedBrand ? selectedBrand.name : 'Select a brand'}
				</div>
			</div>

			{selectedBrand ? (
				<div className={styles.content}>
					{renderUploadZone(
						'adult',
						selectedBrand.model_adult_url,
						adultUpload,
						adultDragOver,
						setAdultDragOver,
						adultInputRef as React.RefObject<HTMLInputElement>
					)}
					{renderUploadZone(
						'kid',
						selectedBrand.model_kid_url,
						kidUpload,
						kidDragOver,
						setKidDragOver,
						kidInputRef as React.RefObject<HTMLInputElement>
					)}
				</div>
			) : (
				<div className={styles.emptyState}>
					<div className={styles.emptyIcon}>&#128100;</div>
					<div className={styles.emptyText}>
						Select a brand from the left panel to upload model reference images
					</div>
				</div>
			)}
		</div>
	);
};

export default HomeRight;
