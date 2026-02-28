'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, User, Loader2, Plus, Trash2 } from 'lucide-react';
import { getModelReferences, uploadModelReference, deleteModelReference } from '@/libs/server/HomePage/model-reference';
import { ModelReference } from '@/libs/types/homepage/model-reference';
import styles from '@/scss/styles/Modals/SelectModelModal.module.scss';

interface SelectModelModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSelect: (modelRefId: string | null) => void;
	currentModelRefId?: string | null;
	brandId: string;
}

const SelectModelModal: React.FC<SelectModelModalProps> = ({
	isOpen,
	onClose,
	onSelect,
	currentModelRefId,
	brandId,
}) => {
	const [models, setModels] = useState<ModelReference[]>([]);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadName, setUploadName] = useState('');
	const [uploadType, setUploadType] = useState<'adult' | 'kid'>('adult');
	const [showUploadForm, setShowUploadForm] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const fetchModels = useCallback(() => {
		if (!brandId) return;
		setIsLoading(true);
		getModelReferences(brandId)
			.then(setModels)
			.catch(console.error)
			.finally(() => setIsLoading(false));
	}, [brandId]);

	useEffect(() => {
		if (isOpen) {
			setSelectedId(currentModelRefId || null);
			setShowUploadForm(false);
			setError(null);
			fetchModels();
		}
	}, [isOpen, currentModelRefId, fetchModels]);

	const handleConfirm = () => {
		onSelect(selectedId);
	};

	const handleClearSelection = () => {
		onSelect(null);
	};

	const handleUpload = async (file: File) => {
		if (!uploadName.trim()) {
			setError('Please enter a name for the model');
			return;
		}

		setIsUploading(true);
		setError(null);

		try {
			const newModel = await uploadModelReference(brandId, uploadName.trim(), uploadType, file);
			setModels(prev => [newModel, ...prev]);
			setSelectedId(newModel.id);
			setShowUploadForm(false);
			setUploadName('');
		} catch (err: any) {
			setError(err.message || 'Upload failed');
		} finally {
			setIsUploading(false);
		}
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) handleUpload(file);
		e.target.value = '';
	};

	const handleDelete = async (e: React.MouseEvent, id: string) => {
		e.stopPropagation();
		try {
			await deleteModelReference(id);
			setModels(prev => prev.filter(m => m.id !== id));
			if (selectedId === id) setSelectedId(null);
		} catch (err: any) {
			setError(err.message || 'Delete failed');
		}
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					className={styles.overlay}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					onClick={onClose}
				>
					<motion.div
						className={styles.modal}
						initial={{ opacity: 0, scale: 0.95, y: 16 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 16 }}
						transition={{ duration: 0.2 }}
						onClick={(e) => e.stopPropagation()}
					>
						{/* Header */}
						<div className={styles.header}>
							<h2 className={styles.title}>Select Model Reference</h2>
							<button className={styles.closeBtn} onClick={onClose}>
								<X size={18} />
							</button>
						</div>

						{/* Body */}
						<div className={styles.body}>
							{error && (
								<div className={styles.errorMsg}>{error}</div>
							)}

							{/* Upload Form */}
							{showUploadForm && (
								<div className={styles.uploadForm}>
									<input
										type="text"
										className={styles.nameInput}
										placeholder="Model name (e.g. Athletic Male A)"
										value={uploadName}
										onChange={(e) => setUploadName(e.target.value)}
									/>
									<div className={styles.typeToggle}>
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
										className={styles.uploadBtn}
										onClick={() => fileInputRef.current?.click()}
										disabled={isUploading || !uploadName.trim()}
									>
										{isUploading ? (
											<><Loader2 size={14} className={styles.spinner} /> Uploading...</>
										) : (
											<><Plus size={14} /> Choose Image</>
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

							{isLoading ? (
								<div className={styles.centerState}>
									<Loader2 size={28} className={styles.spinner} />
									<p>Loading models...</p>
								</div>
							) : models.length === 0 && !showUploadForm ? (
								<div className={styles.centerState}>
									<User size={32} />
									<p>No model references yet</p>
									<p className={styles.hint}>Upload a model photo for consistent face/body across shots</p>
								</div>
							) : (
								<div className={styles.grid}>
									{models.map((model) => (
										<button
											key={model.id}
											className={`${styles.card} ${selectedId === model.id ? styles.selected : ''} ${model.id === currentModelRefId ? styles.current : ''}`}
											onClick={() => setSelectedId(model.id)}
										>
											<div className={styles.imageWrap}>
												<img
													src={model.image_url}
													alt={model.name}
													className={styles.modelImage}
												/>
												{selectedId === model.id && (
													<div className={styles.checkOverlay}>
														<Check size={20} />
													</div>
												)}
												{model.id === currentModelRefId && (
													<span className={styles.currentBadge}>Current</span>
												)}
												<span className={`${styles.typeBadge} ${model.type === 'kid' ? styles.kid : ''}`}>
													{model.type}
												</span>
											</div>
											<div className={styles.cardInfo}>
												<span className={styles.cardName}>{model.name}</span>
												<button
													className={styles.deleteBtn}
													onClick={(e) => handleDelete(e, model.id)}
													title="Delete"
												>
													<Trash2 size={12} />
												</button>
											</div>
										</button>
									))}
								</div>
							)}
						</div>

						{/* Footer */}
						<div className={styles.footer}>
							<button
								className={styles.newModelBtn}
								onClick={() => setShowUploadForm(!showUploadForm)}
							>
								<Plus size={14} />
								<span>{showUploadForm ? 'Cancel Upload' : 'New Model'}</span>
							</button>

							<div className={styles.footerRight}>
								{currentModelRefId && (
									<button className={styles.clearBtn} onClick={handleClearSelection}>
										Clear
									</button>
								)}
								<button className={styles.cancelBtn} onClick={onClose}>
									Cancel
								</button>
								<button
									className={`${styles.selectBtn} ${selectedId ? styles.active : ''}`}
									onClick={handleConfirm}
									disabled={!selectedId}
								>
									<Check size={15} />
									<span>Select</span>
								</button>
							</div>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default SelectModelModal;
