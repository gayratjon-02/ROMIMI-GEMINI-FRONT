import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from '@mui/material';
import { withAuth } from '@/libs/components/auth/withAuth';
import { getSettings, updateSettings, updateApiKey, UserSettings } from '@/libs/server/HomePage/settings';
import { logout } from '@/libs/server/HomePage/signup';
import styles from '@/scss/styles/Settings.module.scss';

type TabType = 'brand' | 'api' | 'account';

function Settings() {
    const theme = useTheme();
    const router = useRouter();
    const isDarkMode = theme.palette.mode === 'dark';

    // State
    const [activeTab, setActiveTab] = useState<TabType>('brand');
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Form states
    const [brandBrief, setBrandBrief] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    // API Key states
    const [apiKeyOpenai, setApiKeyOpenai] = useState('');
    const [apiKeyAnthropic, setApiKeyAnthropic] = useState('');
    const [apiKeyGemini, setApiKeyGemini] = useState('');
    const [showOpenai, setShowOpenai] = useState(false);
    const [showAnthropic, setShowAnthropic] = useState(false);
    const [showGemini, setShowGemini] = useState(false);

    // Fetch settings on mount
    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getSettings();
            setSettings(data);

            // Populate form fields
            setBrandBrief(data.brand_brief || '');
            setName(data.name || '');
            setEmail(data.email || '');
        } catch (err: any) {
            setError(err.message || 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const showSuccess = (message: string) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    // Save Brand Brief
    const handleSaveBrandBrief = async () => {
        try {
            setSaving(true);
            setError(null);
            await updateSettings({ brand_brief: brandBrief });
            showSuccess('Brand brief saved successfully!');
        } catch (err: any) {
            setError(err.message || 'Failed to save brand brief');
        } finally {
            setSaving(false);
        }
    };

    // Save Account Settings
    const handleSaveAccount = async () => {
        try {
            setSaving(true);
            setError(null);
            await updateSettings({
                name,
                email,
            });
            showSuccess('Account settings saved successfully!');
        } catch (err: any) {
            setError(err.message || 'Failed to save account settings');
        } finally {
            setSaving(false);
        }
    };

    // Save API Key
    const handleSaveApiKey = async (keyType: 'openai' | 'anthropic' | 'gemini', value: string) => {
        try {
            setSaving(true);
            setError(null);
            await updateApiKey({ keyType, apiKey: value || null });
            showSuccess(`${keyType.charAt(0).toUpperCase() + keyType.slice(1)} API key updated!`);
            // Refresh settings to get masked key
            await fetchSettings();
        } catch (err: any) {
            setError(err.message || 'Failed to save API key');
        } finally {
            setSaving(false);
        }
    };

    // Logout handler
    const handleLogout = () => {
        logout();
        router.push('/signup');
    };

    // Back to home
    const handleBack = () => {
        router.push('/');
    };

    if (loading) {
        return (
            <div className={`${styles.container} ${isDarkMode ? styles.dark : ''}`}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`${styles.container} ${isDarkMode ? styles.dark : ''}`}>
            {/* Header */}
            <header className={styles.header}>
                <button className={styles.backButton} onClick={handleBack}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Back
                </button>
                <h1 className={styles.title}>Settings</h1>
                <div className={styles.headerSpacer}></div>
            </header>

            {/* Messages */}
            {error && (
                <div className={styles.errorMessage}>
                    <span>{error}</span>
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}
            {successMessage && (
                <div className={styles.successMessage}>
                    <span>{successMessage}</span>
                </div>
            )}

            <div className={styles.content}>
                {/* Sidebar Tabs */}
                <nav className={styles.sidebar}>
                    <button
                        className={`${styles.tab} ${activeTab === 'brand' ? styles.active : ''}`}
                        onClick={() => setActiveTab('brand')}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M7 7H17M7 12H17M7 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Brand Brief
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'api' ? styles.active : ''}`}
                        onClick={() => setActiveTab('api')}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 7H18C19.1046 7 20 7.89543 20 9V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V9C4 7.89543 4.89543 7 6 7H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 3V13M12 13L9 10M12 13L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        API Keys
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'account' ? styles.active : ''}`}
                        onClick={() => setActiveTab('account')}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Account
                    </button>

                    <div className={styles.sidebarSpacer}></div>

                    <button className={styles.logoutButton} onClick={handleLogout}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M16 17L21 12L16 7M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Logout
                    </button>
                </nav>

                {/* Main Content */}
                <main className={styles.main}>
                    {/* Brand Brief Tab */}
                    {activeTab === 'brand' && (
                        <div className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <h2>Brand Brief Editor</h2>
                                <p>Define your brand identity, tone, and guidelines. This will be used to generate consistent content.</p>
                            </div>
                            <div className={styles.panelContent}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="brandBrief">Brand Brief</label>
                                    <textarea
                                        id="brandBrief"
                                        value={brandBrief}
                                        onChange={(e) => setBrandBrief(e.target.value)}
                                        placeholder="Describe your brand's identity, values, tone of voice, target audience, and any specific guidelines for content generation..."
                                        rows={12}
                                        className={styles.textarea}
                                    />
                                    <p className={styles.hint}>
                                        Include details like: brand personality, target demographics, preferred language style, key messaging, and any words/phrases to use or avoid.
                                    </p>
                                </div>
                                <div className={styles.formActions}>
                                    <button
                                        className={styles.saveButton}
                                        onClick={handleSaveBrandBrief}
                                        disabled={saving}
                                    >
                                        {saving ? 'Saving...' : 'Save Brand Brief'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* API Keys Tab */}
                    {activeTab === 'api' && (
                        <div className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <h2>API Key Configuration</h2>
                                <p>Configure your AI service API keys. Keys are stored securely and encrypted.</p>
                            </div>
                            <div className={styles.panelContent}>
                                {/* OpenAI API Key */}
                                <div className={styles.apiKeyGroup}>
                                    <div className={styles.apiKeyHeader}>
                                        <label>OpenAI API Key</label>
                                        {settings?.api_key_openai && (
                                            <span className={styles.keyStatus}>Configured</span>
                                        )}
                                    </div>
                                    <div className={styles.apiKeyInput}>
                                        <input
                                            type={showOpenai ? 'text' : 'password'}
                                            value={apiKeyOpenai}
                                            onChange={(e) => setApiKeyOpenai(e.target.value)}
                                            placeholder={settings?.api_key_openai || 'sk-...'}
                                        />
                                        <button
                                            className={styles.toggleVisibility}
                                            onClick={() => setShowOpenai(!showOpenai)}
                                            type="button"
                                        >
                                            {showOpenai ? (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            ) : (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            )}
                                        </button>
                                        <button
                                            className={styles.saveKeyButton}
                                            onClick={() => handleSaveApiKey('openai', apiKeyOpenai)}
                                            disabled={saving}
                                        >
                                            Save
                                        </button>
                                    </div>
                                    <p className={styles.hint}>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI Platform</a></p>
                                </div>

                                {/* Anthropic API Key */}
                                <div className={styles.apiKeyGroup}>
                                    <div className={styles.apiKeyHeader}>
                                        <label>Anthropic API Key</label>
                                        {settings?.api_key_anthropic && (
                                            <span className={styles.keyStatus}>Configured</span>
                                        )}
                                    </div>
                                    <div className={styles.apiKeyInput}>
                                        <input
                                            type={showAnthropic ? 'text' : 'password'}
                                            value={apiKeyAnthropic}
                                            onChange={(e) => setApiKeyAnthropic(e.target.value)}
                                            placeholder={settings?.api_key_anthropic || 'sk-ant-...'}
                                        />
                                        <button
                                            className={styles.toggleVisibility}
                                            onClick={() => setShowAnthropic(!showAnthropic)}
                                            type="button"
                                        >
                                            {showAnthropic ? (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            ) : (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            )}
                                        </button>
                                        <button
                                            className={styles.saveKeyButton}
                                            onClick={() => handleSaveApiKey('anthropic', apiKeyAnthropic)}
                                            disabled={saving}
                                        >
                                            Save
                                        </button>
                                    </div>
                                    <p className={styles.hint}>Get your API key from <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer">Anthropic Console</a></p>
                                </div>

                                {/* Gemini API Key */}
                                <div className={styles.apiKeyGroup}>
                                    <div className={styles.apiKeyHeader}>
                                        <label>Google Gemini API Key</label>
                                        {settings?.api_key_gemini && (
                                            <span className={styles.keyStatus}>Configured</span>
                                        )}
                                    </div>
                                    <div className={styles.apiKeyInput}>
                                        <input
                                            type={showGemini ? 'text' : 'password'}
                                            value={apiKeyGemini}
                                            onChange={(e) => setApiKeyGemini(e.target.value)}
                                            placeholder={settings?.api_key_gemini || 'AIza...'}
                                        />
                                        <button
                                            className={styles.toggleVisibility}
                                            onClick={() => setShowGemini(!showGemini)}
                                            type="button"
                                        >
                                            {showGemini ? (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            ) : (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            )}
                                        </button>
                                        <button
                                            className={styles.saveKeyButton}
                                            onClick={() => handleSaveApiKey('gemini', apiKeyGemini)}
                                            disabled={saving}
                                        >
                                            Save
                                        </button>
                                    </div>
                                    <p className={styles.hint}>Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a></p>
                                </div>

                                <div className={styles.securityNote}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    <span>Your API keys are encrypted and stored securely. We never share them with third parties.</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Account Tab */}
                    {activeTab === 'account' && (
                        <div className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <h2>Account Settings</h2>
                                <p>Manage your personal information.</p>
                            </div>
                            <div className={styles.panelContent}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="name">Full Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your name"
                                        className={styles.input}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="email">Email Address</label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className={styles.input}
                                    />
                                </div>

                                <div className={styles.formActions}>
                                    <button
                                        className={styles.saveButton}
                                        onClick={handleSaveAccount}
                                        disabled={saving}
                                    >
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>

                                <div className={styles.divider}></div>

                                <div className={styles.dangerZone}>
                                    <h3>Danger Zone</h3>
                                    <p>Irreversible actions for your account.</p>
                                    <button className={styles.dangerButton} onClick={handleLogout}>
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default withAuth(Settings);
