'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Plus, Trash2, Loader2, User, Baby, X, Check } from 'lucide-react';
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
	selectedAdultModelId: string | null;
	selectedKidModelId: string | null;
	onSelectAdultModel: (id: string | null) => void;
	onSelectKidModel: (id: string | null) => void;
}

interface UploadState {
	isUploading: boolean;
	success: string | null;
	error: string | null;
}

const HomeRight: React.FC<HomeRightProps> = ({
	isDarkMode,
	selectedBrand,
	onBrandUpdated,
	selectedAdultModelId,
	selectedKidModelId,
	onSelectAdultModel,
	onSelectKidModel,
}) => {
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

	// Find selected models from the models array
	const selectedAdult = useMemo(() => models.find(m => m.id === selectedAdultModelId), [models, selectedAdultModelId]);
	const selectedKid = useMemo(() => models.find(m => m.id === selectedKidModelId), [models, selectedKidModelId]);

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
			// Deselect if the deleted model was selected
			if (id === selectedAdultModelId) onSelectAdultModel(null);
			if (id === selectedKidModelId) onSelectKidModel(null);
		} catch (err: any) {
			setUpload({ isUploading: false, success: null, error: err.message || 'Delete failed' });
		}
	}, [selectedAdultModelId, selectedKidModelId, onSelectAdultModel, onSelectKidModel]);

	// Click model card → auto-assign to correct slot (toggle)
	const handleModelClick = useCallback((model: ModelReference) => {
		if (model.type === 'adult') {
			onSelectAdultModel(selectedAdultModelId === model.id ? null : model.id);
		} else {
			onSelectKidModel(selectedKidModelId === model.id ? null : model.id);
		}
	}, [selectedAdultModelId, selectedKidModelId, onSelectAdultModel, onSelectKidModel]);

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
					{/* Selected Models Section */}
					<div className={styles.selectedSection}>
						<div className={styles.selectedHeader}>
							{(selectedAdult && selectedKid) ? 'Models Selected' : 'Select for Generation'}
						</div>

						{/* Adult Slot */}
						<div className={`${styles.modelSlot} ${selectedAdult ? styles.modelSlotFilled : styles.modelSlotEmpty}`}>
							<div className={styles.slotIcon}>
								<User size={14} />
							</div>
							{selectedAdult ? (
								<>
									<img src={selectedAdult.image_url} alt={selectedAdult.name} className={styles.slotThumbnail} />
									<span className={styles.slotName}>{selectedAdult.name}</span>
									<button className={styles.deselectBtn} onClick={() => onSelectAdultModel(null)} title="Deselect">
										<X size={12} />
									</button>
								</>
							) : (
								<span className={styles.slotPlaceholder}>Click adult model below</span>
							)}
						</div>

						{/* Kid Slot */}
						<div className={`${styles.modelSlot} ${selectedKid ? styles.modelSlotFilled : styles.modelSlotEmpty}`}>
							<div className={styles.slotIcon}>
								<Baby size={14} />
							</div>
							{selectedKid ? (
								<>
									<img src={selectedKid.image_url} alt={selectedKid.name} className={styles.slotThumbnail} />
									<span className={styles.slotName}>{selectedKid.name}</span>
									<button className={styles.deselectBtn} onClick={() => onSelectKidModel(null)} title="Deselect">
										<X size={12} />
									</button>
								</>
							) : (
								<span className={styles.slotPlaceholder}>Click kid model below</span>
							)}
						</div>
					</div>

					{/* Library Divider */}
					<div className={styles.libraryDivider}>
						<span className={styles.libraryTitle}>Model Library</span>
					</div>

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
							{models.map((model) => {
								const isSelected = model.id === selectedAdultModelId || model.id === selectedKidModelId;
								return (
									<div
										key={model.id}
										className={`${styles.modelCard} ${isSelected ? styles.modelCardSelected : ''}`}
										onClick={() => handleModelClick(model)}
									>
										<div className={styles.modelImageWrap}>
											<img
												src={model.image_url}
												alt={model.name}
												className={styles.modelImage}
											/>
											<span className={`${styles.typeBadge} ${model.type === 'kid' ? styles.kid : ''}`}>
												{model.type}
											</span>
											{isSelected && (
												<div className={styles.checkOverlay}>
													<Check size={16} />
												</div>
											)}
											<button
												className={styles.deleteOverlay}
												onClick={(e) => {
													e.stopPropagation();
													handleDelete(model.id);
												}}
												title="Delete"
											>
												<Trash2 size={14} />
											</button>
										</div>
										<div className={styles.modelName}>{model.name}</div>
									</div>
								);
							})}
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
