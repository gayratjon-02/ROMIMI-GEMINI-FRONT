'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, Loader2, User } from 'lucide-react';
import styles from '@/scss/styles/HomePage/HomeRight.module.scss';
import { Brand } from '@/libs/types/homepage/brand';
import { ModelReference } from '@/libs/types/homepage/model-reference';
import {
	getModelReferences,
	uploadModelReference,
	deleteModelReference,
} from '@/libs/server/HomePage/model-reference';
import { compressImage } from '@/libs/utils/compressImage';

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
	const [models, setModels] = useState<ModelReference[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [upload, setUpload] = useState<UploadState>({ isUploading: false, success: null, error: null });
	const [uploadName, setUploadName] = useState('');
	const [uploadType, setUploadType] = useState<'adult' | 'kid'>('adult');
	const [showUploadForm, setShowUploadForm] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const fetchModels = useCallback(() => {
		if (!selectedBrand) return;
		setIsLoading(true);
		getModelReferences(selectedBrand.id)
			.then(setModels)
			.catch(console.error)
			.finally(() => setIsLoading(false));
	}, [selectedBrand]);

	useEffect(() => {
		if (selectedBrand) {
			fetchModels();
		} else {
			setModels([]);
		}
		setShowUploadForm(false);
	}, [selectedBrand, fetchModels]);

	const handleUpload = useCallback(async (file: File) => {
		if (!selectedBrand) return;

		if (!file.type.startsWith('image/')) {
			setUpload({ isUploading: false, success: null, error: 'Only image files are allowed' });
			return;
		}

		if (!uploadName.trim()) {
			setUpload({ isUploading: false, success: null, error: 'Please enter a model name' });
			return;
		}

		setUpload({ isUploading: true, success: null, error: null });

		try {
			const uploadFile = await compressImage(file);
			const newModel = await uploadModelReference(selectedBrand.id, uploadName.trim(), uploadType, uploadFile);
			setModels(prev => [newModel, ...prev]);
			setUpload({ isUploading: false, success: 'Uploaded successfully', error: null });
			setShowUploadForm(false);
			setUploadName('');
			setTimeout(() => setUpload(prev => ({ ...prev, success: null })), 3000);
		} catch (err: any) {
			setUpload({ isUploading: false, success: null, error: err.message || 'Upload failed' });
		}
	}, [selectedBrand, uploadName, uploadType]);

	const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) handleUpload(file);
		e.target.value = '';
	}, [handleUpload]);

	const handleDelete = useCallback(async (id: string) => {
		try {
			await deleteModelReference(id);
			setModels(prev => prev.filter(m => m.id !== id));
		} catch (err: any) {
			setUpload({ isUploading: false, success: null, error: err.message || 'Delete failed' });
		}
	}, []);

	return (
		<div className={`${styles.sidebar} ${isDarkMode ? '' : styles.light}`}>
			<div className={styles.header}>
				<h3 className={styles.title}>Model References</h3>
				<div className={styles.subtitle}>
					{selectedBrand ? selectedBrand.name : 'Select a brand'}
				</div>
			</div>

			{selectedBrand ? (
				<div className={styles.content}>
					{/* Upload Form Toggle */}
					{showUploadForm && (
						<div className={styles.uploadFormInline}>
							<input
								type="text"
								className={styles.nameInput}
								placeholder="Model name"
								value={uploadName}
								onChange={(e) => setUploadName(e.target.value)}
							/>
							<div className={styles.typeRow}>
								<button
									className={`${styles.typeBtn} ${uploadType === 'adult' ? styles.active : ''}`}
									onClick={() => setUploadType('adult')}
								>
									Adult
								</button>
								<button
									className={`${styles.typeBtn} ${uploadType === 'kid' ? styles.active : ''}`}
									onClick={() => setUploadType('kid')}
								>
									Kid
								</button>
							</div>
							<button
								className={styles.chooseFileBtn}
								onClick={() => fileInputRef.current?.click()}
								disabled={upload.isUploading || !uploadName.trim()}
							>
								{upload.isUploading ? (
									<><Loader2 size={13} className={styles.spinnerIcon} /> Uploading...</>
								) : (
									<><Plus size={13} /> Choose Image</>
								)}
							</button>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								style={{ display: 'none' }}
								onChange={handleFileSelect}
							/>
						</div>
					)}

					{/* Add New Button */}
					<button
						className={styles.addNewBtn}
						onClick={() => {
							setShowUploadForm(!showUploadForm);
							setUpload({ isUploading: false, success: null, error: null });
						}}
					>
						<Plus size={14} />
						<span>{showUploadForm ? 'Cancel' : 'Add Model'}</span>
					</button>

					{/* Status Messages */}
					{upload.success && <div className={styles.successMsg}>{upload.success}</div>}
					{upload.error && <div className={styles.errorMsg}>{upload.error}</div>}

					{/* Model Grid */}
					{isLoading ? (
						<div className={styles.emptyState}>
							<div className={styles.spinnerWrap}>
								<div className={styles.spinner} />
							</div>
							<div className={styles.emptyText}>Loading...</div>
						</div>
					) : models.length === 0 ? (
						<div className={styles.emptyState}>
							<div className={styles.emptyIcon}>
								<User size={32} />
							</div>
							<div className={styles.emptyText}>
								No model references yet. Upload a model photo for consistent face/body.
							</div>
						</div>
					) : (
						<div className={styles.modelGrid}>
							{models.map((model) => (
								<div key={model.id} className={styles.modelCard}>
									<div className={styles.modelImageWrap}>
										<img
											src={model.image_url}
											alt={model.name}
											className={styles.modelImage}
										/>
										<span className={`${styles.typeBadge} ${model.type === 'kid' ? styles.kid : ''}`}>
											{model.type}
										</span>
										<button
											className={styles.deleteOverlay}
											onClick={() => handleDelete(model.id)}
											title="Delete"
										>
											<Trash2 size={14} />
										</button>
									</div>
									<div className={styles.modelName}>{model.name}</div>
								</div>
							))}
						</div>
					)}
				</div>
			) : (
				<div className={styles.emptyState}>
					<div className={styles.emptyIcon}>
						<User size={32} />
					</div>
					<div className={styles.emptyText}>
						Select a brand from the left panel to manage model references
					</div>
				</div>
			)}
		</div>
	);
};

export default HomeRight;
