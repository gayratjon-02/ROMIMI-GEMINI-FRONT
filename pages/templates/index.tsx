'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from '@mui/material';
import Link from 'next/link';
import { withAuth } from '@/libs/components/auth/withAuth';
import {
    getDAPresets,
    getDAPresetById,
    createDAPresetFromImage,
    updateDAPresetAnalysis,
    deleteDAPreset,
    DAPresetItem,
    DAPresetConfig,
} from '@/libs/server/HomePage/da';
import styles from '@/scss/styles/Templates.module.scss';

function TemplatesPage() {
    const router = useRouter();
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    const [presets, setPresets] = useState<DAPresetItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Create DA modal
    const [createOpen, setCreateOpen] = useState(false);
    const [createFile, setCreateFile] = useState<File | null>(null);
    const [createName, setCreateName] = useState('');
    const [createSubmitting, setCreateSubmitting] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    // Update DA modal
    const [updatePreset, setUpdatePreset] = useState<DAPresetItem | null>(null);
    const [updateConfigJson, setUpdateConfigJson] = useState('');
    const [updateSubmitting, setUpdateSubmitting] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);

    // Delete confirm
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);

    const fetchPresets = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await getDAPresets();
            setPresets(res.presets || []);
        } catch (e: any) {
            setError(e?.errors?.join(', ') || e?.message || 'Failed to load DA templates');
            setPresets([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPresets();
    }, [fetchPresets]);

    const handleCreateSubmit = async () => {
        if (!createFile) {
            setCreateError('Please select an image');
            return;
        }
        setCreateSubmitting(true);
        setCreateError(null);
        try {
            const formData = new FormData();
            formData.append('image', createFile);
            if (createName.trim()) formData.append('preset_name', createName.trim());
            await createDAPresetFromImage(formData);
            setCreateOpen(false);
            setCreateFile(null);
            setCreateName('');
            await fetchPresets();
        } catch (e: any) {
            setCreateError(e?.errors?.join(', ') || e?.message || 'Create failed');
        } finally {
            setCreateSubmitting(false);
        }
    };

    const openUpdate = async (preset: DAPresetItem) => {
        setUpdateError(null);
        setUpdatePreset(preset);
        try {
            const res = await getDAPresetById(preset.id);
            setUpdateConfigJson(JSON.stringify(res.config, null, 2));
        } catch (e: any) {
            setUpdateError(e?.message || 'Failed to load preset');
        }
    };

    const handleUpdateSubmit = async () => {
        if (!updatePreset) return;
        let config: DAPresetConfig;
        try {
            config = JSON.parse(updateConfigJson);
        } catch {
            setUpdateError('Invalid JSON');
            return;
        }
        setUpdateSubmitting(true);
        setUpdateError(null);
        try {
            await updateDAPresetAnalysis(updatePreset.id, config);
            setUpdatePreset(null);
            await fetchPresets();
        } catch (e: any) {
            setUpdateError(e?.errors?.join(', ') || e?.message || 'Update failed');
        } finally {
            setUpdateSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Do you want to delete this DA?')) return;
        setDeleteId(id);
        setDeleteSubmitting(true);
        try {
            await deleteDAPreset(id);
            await fetchPresets();
        } catch (e: any) {
            alert(e?.errors?.join(', ') || e?.message || 'Delete failed');
        } finally {
            setDeleteId(null);
            setDeleteSubmitting(false);
        }
    };

    return (
        <div className={`${styles.container} ${isDarkMode ? styles.dark : ''}`}>
            <div className={styles.header}>
                <Link href="/" className={styles.backBtn}>
                    ← Home
                </Link>
                <h1 className={styles.title}>DA Templates</h1>
                <button
                    className={styles.createBtn}
                    onClick={() => {
                        setCreateError(null);
                        setCreateOpen(true);
                    }}
                >
                    + Create DA
                </button>
            </div>

            {error && <p className={styles.error}>{error}</p>}
            {loading && <div className={styles.loading}>Loading...</div>}
            {!loading && presets.length === 0 && !error && (
                <div className={styles.empty}>No DA templates yet. Add one via &quot;Create DA&quot;.</div>
            )}
            {!loading && presets.length > 0 && (
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Code</th>
                                <th>Type</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {presets.map((p) => (
                                <tr key={p.id}>
                                    <td>{p.name}</td>
                                    <td>{p.code}</td>
                                    <td>
                                        <span className={`${styles.badge} ${p.is_default ? styles.badgeSystem : styles.badgeUser}`}>
                                            {p.is_default ? 'System' : 'User'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button className={styles.actionBtn} onClick={() => openUpdate(p)}>
                                                Update
                                            </button>
                                            {!p.is_default && (
                                                <button
                                                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                    onClick={() => handleDelete(p.id)}
                                                    disabled={deleteSubmitting && deleteId === p.id}
                                                >
                                                    {deleteSubmitting && deleteId === p.id ? '...' : 'Delete'}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create DA Modal */}
            {createOpen && (
                <div className={styles.overlay} onClick={() => !createSubmitting && setCreateOpen(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Create DA</h2>
                        </div>
                        <div className={styles.modalBody}>
                            <label className={styles.label}>Reference image (required)</label>
                            <input
                                type="file"
                                accept="image/*"
                                className={styles.input}
                                onChange={(e) => setCreateFile(e.target.files?.[0] || null)}
                            />
                            <label className={styles.label}>Preset name (optional)</label>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="e.g. Nostalgic Playroom"
                                value={createName}
                                onChange={(e) => setCreateName(e.target.value)}
                            />
                            {createError && <p className={styles.error}>{createError}</p>}
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.actionBtn} onClick={() => setCreateOpen(false)} disabled={createSubmitting}>
                                Cancel
                            </button>
                            <button className={styles.createBtn} onClick={handleCreateSubmit} disabled={createSubmitting}>
                                {createSubmitting ? 'Loading...' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Update DA Modal */}
            {updatePreset && (
                <div className={styles.overlay} onClick={() => !updateSubmitting && setUpdatePreset(null)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Update: {updatePreset.name}</h2>
                        </div>
                        <div className={styles.modalBody}>
                            <label className={styles.label}>Config (JSON)</label>
                            <textarea
                                className={styles.textarea}
                                value={updateConfigJson}
                                onChange={(e) => setUpdateConfigJson(e.target.value)}
                                spellCheck={false}
                            />
                            {updateError && <p className={styles.error}>{updateError}</p>}
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.actionBtn} onClick={() => setUpdatePreset(null)} disabled={updateSubmitting}>
                                Cancel
                            </button>
                            <button className={styles.createBtn} onClick={handleUpdateSubmit} disabled={updateSubmitting}>
                                {updateSubmitting ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default withAuth(TemplatesPage);
