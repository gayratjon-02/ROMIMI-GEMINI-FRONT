import Head from "next/head";
import { useTheme } from "@mui/material";
import { useState, useCallback, useEffect } from "react";
import HomeTop from "@/libs/components/homePage/HomeTop";
import HomeLeft from "@/libs/components/homePage/HomeLeft";
import HomeMiddle, { ProductJSON, DAJSON } from "@/libs/components/homePage/HomeMiddle";
import HomeBottom, { createDefaultShotOptions } from "@/libs/components/homePage/HomeButtom";
import { Brand } from "@/libs/types/homepage/brand";
import { Collection } from "@/libs/types/homepage/collection";
import { ShotOptions, getEnabledShots } from "@/libs/types/homepage/shot-options";
// Auth HOC import for protected routes
import { withAuth } from "@/libs/components/auth/withAuth";
// API imports
import { createProduct, analyzeProduct } from '@/libs/server/HomePage/product';
import { getCollection, updateDAJSON } from '@/libs/server/HomePage/collection';
import {
  createGeneration,
  updateMergedPrompts as updatePromptsAPI,
  mergePrompts,
} from '@/libs/server/HomePage/merging';
import { Generation } from '@/libs/types/homepage/generation';
import {
  executeGeneration,
  pollGenerationStatus,
} from '@/libs/server/HomePage/generate';
import { useGenerationSocket } from '@/libs/hooks/useGenerationSocket';

// Mock DA Analysis for fallback
const mockDAAnalysis: DAJSON = {
  background: {
    color_hex: '#FFFFFF',
    color_name: 'White',
    description: 'Clean white cyclorama with soft natural shadows',
    texture: 'smooth matte',
  },
  props: {
    items: ['Minimalist wooden stool', 'Dried pampas grass'],
    placement: 'asymmetric sides',
    style: 'modern minimalist',
  },
  mood: 'Serene, sophisticated, effortlessly elegant',
  lighting: {
    type: 'softbox',
    temperature: 'warm golden hour',
    direction: 'front-left 45°',
    intensity: 'medium-soft',
  },
  composition: {
    layout: 'centered editorial',
    poses: 'relaxed natural',
    framing: 'full body with headroom',
  },
  styling: {
    bottom: 'dark slim trousers',
    feet: 'white minimalist sneakers',
  },
  camera: {
    focal_length_mm: 85,
    aperture: 2.8,
    focus: 'subject eyes',
  },
  quality: 'professional editorial',
};

// Protected component - requires authentication
function Home() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  // Brand refresh trigger
  const [brandRefreshTrigger, setBrandRefreshTrigger] = useState(0);

  // Selected brand state - shared between HomeLeft and HomeTop
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

  // Mobile drawer state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // ==================== NEW SINGLE-PAGE STATE ====================
  // Product Upload
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [referenceImages, setReferenceImages] = useState<File[]>([]);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [productJSON, setProductJSON] = useState<ProductJSON | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  // Full analysis response from backend (for display)
  const [fullAnalysisResponse, setFullAnalysisResponse] = useState<any>(null);

  // DA State
  const [daJSON, setDAJSON] = useState<DAJSON | null>(null);

  // Merged Prompts
  const [mergedPrompts, setMergedPrompts] = useState<Record<string, string>>({});
  const [generationId, setGenerationId] = useState<string | null>(null);

  // NEW: Resolution & Aspect Ratio State
  const [resolution, setResolution] = useState<'4k' | '2k'>('4k');
  const [aspectRatio, setAspectRatio] = useState<'4:5' | '1:1' | '9:16'>('4:5');

  // Shot Selection - NEW: Use ShotOptions instead of selectedShots + ageMode
  const [shotOptions, setShotOptions] = useState<ShotOptions>(createDefaultShotOptions());

  // Legacy derived values for compatibility
  const selectedShots = getEnabledShots(shotOptions);
  const ageMode = shotOptions.solo?.subject || 'adult';

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [visuals, setVisuals] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  // NEW: Store the full generation response from API
  const [generationResponse, setGenerationResponse] = useState<Generation | null>(null);

  // WebSocket Integration
  useGenerationSocket(generationResponse?.id || null, {
    onVisualCompleted: (data) => {
      setVisuals(prev => {
        const next = [...prev];
        // Try to find index by visual type or use data.index
        // If data.index is reliable:
        if (typeof data.index === 'number' && next[data.index]) {
          next[data.index] = { ...next[data.index], ...data, status: 'completed' };
        } else {
          // Fallback to type matching
          const idx = next.findIndex(v => v.type === data.type);
          if (idx !== -1) {
            next[idx] = { ...next[idx], ...data, status: 'completed' };
          }
        }
        return next;
      });
    },
    onProgress: (data) => {
      // data.progress_percent, data.completed, data.total
      if (data.progress_percent !== undefined) {
        setProgress(data.progress_percent);
      }
    },
    onComplete: (data) => {
      if (data.visuals) setVisuals(data.visuals);
      // setGenerationResponse? Might need to re-fetch to get consistent state
      // But visuals update is the most important
      setIsGenerating(false); // Ensure loader stops
    }
  });

  // ==================== HANDLERS ====================

  const handleBrandCreated = useCallback(() => {
    setBrandRefreshTrigger(prev => prev + 1);
  }, []);

  const handleBrandSelect = useCallback((brand: Brand | null) => {
    setSelectedBrand(brand);
  }, []);

  const handleCollectionSelect = useCallback((collection: Collection | null, brand: Brand | null) => {
    setSelectedCollection(collection);
    if (brand) setSelectedBrand(brand);
  }, []);

  // Fetch DA when collection changes
  useEffect(() => {
    if (!selectedCollection?.id) {
      setDAJSON(null);
      return;
    }

    (async () => {
      try {
        const collection = await getCollection(selectedCollection.id);
        if (collection.analyzed_da_json) {
          setDAJSON(collection.analyzed_da_json as unknown as DAJSON);
        } else {
          setDAJSON(mockDAAnalysis);
        }
      } catch (error) {
        console.warn('Failed to fetch collection DA:', error);
        setDAJSON(mockDAAnalysis);
      }
    })();
  }, [selectedCollection?.id]);

  // Handle Product Analysis - Uses analyzeProductDirect API (NO collection needed!)
  const handleAnalyze = useCallback(async () => {
    // If already analyzed, just reset view to show JSON
    if (productJSON) {
      setVisuals([]);
      return;
    }

    // Both front and back images are required
    if (!frontImage || !backImage) {
      alert('Please upload both FRONT and BACK images.');
      return;
    }

    setIsAnalyzing(true);
    try {
      // 1. Import analyzeProductDirect API 
      const { analyzeProductDirect } = await import('@/libs/server/HomePage/product');

      // 2. Prepare images - at least front or back required
      const frontImages = frontImage ? [frontImage] : [];
      const backImages = backImage ? [backImage] : [];

      // 3. Call analyzeProductDirect API (NO collection needed!)
      const response = await analyzeProductDirect(
        frontImages,
        backImages,
        referenceImages,
        undefined // product_name - optional
      );

      console.log('✅ Product analyzed:', response);

      // 4. Extract analysis data
      const analysis = response.analysis;

      // Helper to safely extract logo description
      const getLogoDesc = (field: any): string => {
        if (!field) return 'None';
        if (typeof field === 'string') return field;
        if (typeof field === 'object' && field !== null) {
          const parts: string[] = [];
          if (field.type) parts.push(field.type);
          if (field.color && field.color.toLowerCase() !== 'unknown') {
            parts.push(`(${field.color})`);
          }
          if (field.position) parts.push(`at ${field.position}`);
          if (parts.length > 0) return parts.join(' ');
          if (field.description) return field.description;
          return JSON.stringify(field).replace(/[{}\"]/g, '').replace(/,/g, ', ');
        }
        return String(field);
      };

      // 5. Map result to state
      const mappedAnalysis: ProductJSON = {
        type: analysis.general_info?.product_name || response.name || 'Product',
        color: analysis.colors?.primary?.name || 'Not detected',
        color_hex: analysis.colors?.primary?.hex || '#000000',
        texture: analysis.texture_description || 'Not detected',
        material: Array.isArray(analysis.materials) ? analysis.materials.join(', ') : 'Not detected',
        details: (() => {
          const detailsParts: string[] = [];
          if (analysis.design_elements && Array.isArray(analysis.design_elements)) {
            detailsParts.push(...analysis.design_elements);
          }
          if (analysis.style_keywords && Array.isArray(analysis.style_keywords)) {
            detailsParts.push(...analysis.style_keywords);
          }
          if (analysis.additional_details) {
            detailsParts.push(analysis.additional_details);
          }
          return detailsParts.join(', ') || 'No details detected';
        })(),
        logo_front: getLogoDesc(analysis.logo_front),
        logo_back: getLogoDesc(analysis.logo_back),
      };

      setProductJSON(mappedAnalysis);
      setProductId(response.product_id);
      // Save full response for display
      setFullAnalysisResponse(response);

      // NOTE: Merged prompts will be generated when user clicks MERGE
      // (DA must be selected first, then MERGE creates prompts from backend)

    } catch (error: any) {
      console.error('Analysis failed:', error);
      const errorMessage = error?.messages?.join(', ') || error?.message || 'Unknown error';
      alert(`Analysis failed: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [frontImage, backImage, referenceImages, daJSON, productJSON]);

  // Handle Analysis Update (from Edit Mode)
  const handleAnalysisUpdate = useCallback((updatedResponse: any) => {
    console.log('🔄 Product Analysis Updated:', updatedResponse);
    setFullAnalysisResponse(updatedResponse);

    // Update ProductJSON state if analysis data changed
    if (updatedResponse.analysis) {
      // Re-map analysis to productJSON format if needed, 
      // or if the structure matches, just use it. 
      // Since we are saving "final_product_json" which matches AnalyzedProductJSON,
      // we might need to re-map using the same logic as in handleAnalyze
      // OR simply update the parts that match.

      // For simplicity, let's re-use the mapping logic or assume updatedResponse.analysis IS the ProductJSON source
      // ideally we should extract this mapping logic to a helper function.
      // But for now, let's update what we can.

      const analysis = updatedResponse.analysis;

      // Use helper from handleAnalyze scope if possible, but it's inside useCallback.
      // Let's simplified mapping here or just trust the response structure if it's consistent.
      // The backend returns proper AnalyzedProductJSON structure in final_product_json.

      const getLogoDesc = (field: any): string => {
        if (!field) return 'None';
        if (typeof field === 'string') return field;
        if (typeof field === 'object' && field !== null) {
          const parts: string[] = [];
          if (field.type) parts.push(field.type);
          if (field.color && field.color.toLowerCase() !== 'unknown') parts.push(`(${field.color})`);
          if (field.position) parts.push(`at ${field.position}`);
          if (parts.length > 0) return parts.join(' ');
          if (field.description) return field.description;
          return JSON.stringify(field).replace(/[{}\"]/g, '').replace(/,/g, ', ');
        }
        return String(field);
      };

      const newProductJSON: ProductJSON = {
        type: analysis.general_info?.product_name || updatedResponse.name || 'Product',
        color: analysis.colors?.primary?.name || 'Not detected',
        color_hex: analysis.colors?.primary?.hex || '#000000',
        texture: analysis.texture_description || 'Not detected',
        material: Array.isArray(analysis.materials) ? analysis.materials.join(', ') : 'Not detected',
        details: (() => {
          const detailsParts: string[] = [];
          if (analysis.design_elements && Array.isArray(analysis.design_elements)) detailsParts.push(...analysis.design_elements);
          if (analysis.style_keywords && Array.isArray(analysis.style_keywords)) detailsParts.push(...analysis.style_keywords);
          if (analysis.additional_details) detailsParts.push(analysis.additional_details);
          return detailsParts.join(', ') || 'No details detected';
        })(),
        logo_front: getLogoDesc(analysis.logo_front),
        logo_back: getLogoDesc(analysis.logo_back),
      };

      setProductJSON(newProductJSON);
      // NOTE: Merged prompts are handled by backend via MERGE, not locally
    }
  }, []);

  // Handle DA Update (from Edit Mode)
  const handleDAUpdate = useCallback((updatedDA: DAJSON) => {
    console.log('🔄 DA JSON Updated:', updatedDA);
    setDAJSON(updatedDA);
    // NOTE: Merged prompts are handled by backend via MERGE, not locally
  }, []);

  // Step 1: Merge button -> Create generation and merge prompts
  const handleMerge = useCallback(async (options: ShotOptions) => {
    const enabledShots = getEnabledShots(options);
    console.log('🚀 Merge clicked with shotOptions:', options, 'enabled:', enabledShots);

    if (!productId) {
      alert('Please analyze a product first.');
      return;
    }

    if (!selectedCollection) {
      alert('Please select a collection.');
      return;
    }

    setIsGenerating(true);
    setGenerationResponse(null);

    try {
      // Ensure DA JSON exists
      if (!daJSON) {
        console.log('📝 Setting default DA JSON...');
        await updateDAJSON(selectedCollection.id, {
          analyzed_da_json: mockDAAnalysis
        });
      }

      // Create generation
      console.log('📝 Creating generation...');

      const { createGeneration } = await import('@/libs/server/HomePage/merging');
      const generation = await createGeneration({
        product_id: productId,
        collection_id: selectedCollection.id,
        generation_type: 'product_visuals'
      });

      console.log('✅ Generation created:', generation.id);

      // Merge prompts immediately
      console.log('📝 Merging prompts with shot_options...');
      const { mergePrompts } = await import('@/libs/server/HomePage/merging');
      await mergePrompts(generation.id, { shot_options: options });

      // Fetch updated generation with merged prompts
      const { getGeneration } = await import('@/libs/server/HomePage/merging');
      const updatedGeneration = await getGeneration(generation.id);

      setGenerationId(generation.id);
      setGenerationResponse(updatedGeneration);
      console.log('✅ Generation ready for review:', updatedGeneration.id);

    } catch (error: any) {
      console.error('Merge failed:', error);
      alert(error.message || 'Failed to merge prompts');
    } finally {
      setIsGenerating(false);
    }
  }, [productId, selectedCollection, daJSON, mockDAAnalysis]);

  // Step 2: Confirm button → Execute generation and start image creation
  const handleGenerateImages = useCallback(async () => {
    if (!generationId) {
      alert('No generation to confirm. Please click Merge first.');
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    // Create placeholder cards immediately based on merged_prompts
    const mergedPromptsData = generationResponse?.merged_prompts || {};
    const shotTypes = Object.keys(mergedPromptsData);

    if (shotTypes.length > 0) {
      const placeholderVisuals = shotTypes.map(type => ({
        type,
        status: 'pending' as const,
        image_url: undefined,
        error: undefined,
      }));
      setVisuals(placeholderVisuals);
      console.log('📦 Placeholder cards created:', placeholderVisuals.length);
    }

    try {
      // Execute generation (starts Gemini image generation)
      console.log('📝 Executing generation...');
      const { executeGeneration } = await import('@/libs/server/HomePage/generate');
      const result = await executeGeneration(generationId);
      console.log('✅ Generation started:', result);

      // Update visuals with backend response (may have 'processing' status now)
      if (result.generation && result.generation.visual_outputs) {
        setVisuals(result.generation.visual_outputs);
      }

      console.log('📝 WebSocket active - waiting for real-time updates...');

      // Safety timeout (10 minutes) to stop spinner if socket fails
      setTimeout(() => {
        setIsGenerating(false);
      }, 600000);

    } catch (error: any) {
      console.error('Generation execution failed:', error);
      const errorMsg = error?.errors?.join(', ') || error?.message || 'Failed to execute generation';
      alert(`Execution failed: ${errorMsg}`);
      setIsGenerating(false);
    }
  }, [generationId, generationResponse]);

  // Handle prompts change
  const handlePromptsChange = useCallback((key: string, value: string) => {
    setMergedPrompts(prev => {
      const updated = { ...prev, [key]: value };
      // Sync to backend if we have generationId
      if (generationId) {
        updatePromptsAPI(generationId, { prompts: updated }).catch(console.error);
      }
      return updated;
    });
  }, [generationId]);

  const isAnalyzed = !!productJSON;
  const hasDA = !!daJSON;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      background: isDarkMode ? '#0a0a0f' : '#f8fafc',
      color: isDarkMode ? '#f8fafc' : '#0f172a',
      position: 'relative'
    }}>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
        style={{
          display: 'none',
          position: 'fixed',
          top: '80px',
          left: '16px',
          zIndex: 1100,
          width: '44px',
          height: '44px',
          background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          borderRadius: '12px',
          cursor: 'pointer',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          padding: 0,
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(10px)',
        }}
        className="mobile-hamburger"
      >
        <span style={{
          width: '20px',
          height: '2px',
          background: isDarkMode ? '#fff' : '#000',
          borderRadius: '2px',
          transition: 'all 0.3s ease',
          transform: isMobileDrawerOpen ? 'rotate(45deg) translateY(6px)' : 'none'
        }} />
        <span style={{
          width: '20px',
          height: '2px',
          background: isDarkMode ? '#fff' : '#000',
          borderRadius: '2px',
          transition: 'all 0.3s ease',
          opacity: isMobileDrawerOpen ? 0 : 1
        }} />
        <span style={{
          width: '20px',
          height: '2px',
          background: isDarkMode ? '#fff' : '#000',
          borderRadius: '2px',
          transition: 'all 0.3s ease',
          transform: isMobileDrawerOpen ? 'rotate(-45deg) translateY(-6px)' : 'none'
        }} />
      </button>

      {/* Mobile Overlay */}
      {isMobileDrawerOpen && (
        <div
          onClick={() => setIsMobileDrawerOpen(false)}
          style={{
            display: 'none',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            backdropFilter: 'blur(4px)',
          }}
          className="mobile-overlay"
        />
      )}

      {/* Main Layout: Sidebar + Content */}
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden'
      }}>
        {/* Left Sidebar */}
        <div className="home-left-container">
          <HomeLeft
            isDarkMode={isDarkMode}
            refreshTrigger={brandRefreshTrigger}
            onBrandSelect={handleBrandSelect}
            onCollectionSelect={handleCollectionSelect}
            onBrandCreated={handleBrandCreated}
            isOpen={isMobileDrawerOpen}
            // NEW: Pass upload props
            frontImage={frontImage}
            backImage={backImage}
            referenceImages={referenceImages}
            onFrontImageChange={setFrontImage}
            onBackImageChange={setBackImage}
            onReferenceImagesChange={setReferenceImages}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
            isAnalyzed={isAnalyzed}
            // JSON Panel props
            productJSON={productJSON}
            daJSON={daJSON}
            mergedPrompts={mergedPrompts}
            onPromptsChange={handlePromptsChange}
          />
        </div>

        {/* Main Content Area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          height: '100%'
        }}
          className="main-content-area"
        >
          {/* Header */}
          <HomeTop
            selectedBrand={selectedBrand}
            selectedCollection={selectedCollection}
            onCollectionSelect={handleCollectionSelect}
          />

          {/* Main Visuals Area */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: isDarkMode ? '#0a0a0f' : '#ffffff'
          }}>
            <HomeMiddle
              isDarkMode={isDarkMode}
              selectedCollection={selectedCollection}
              selectedBrand={selectedBrand}
              frontImage={frontImage}
              backImage={backImage}
              productJSON={productJSON}
              fullAnalysisResponse={fullAnalysisResponse}
              productId={productId}
              onAnalysisUpdate={handleAnalysisUpdate}
              onDAUpdate={handleDAUpdate}
              daJSON={daJSON}
              mergedPrompts={mergedPrompts}
              selectedShots={selectedShots}
              ageMode={ageMode}
              isAnalyzing={isAnalyzing}
              generationResponse={generationResponse}
              onConfirmGeneration={handleGenerateImages}
              onMerge={handleMerge}
              shotOptions={shotOptions}
              parentVisuals={visuals}
              parentProgress={progress}
              isGeneratingVisuals={isGenerating}
              onReanalyze={handleAnalyze}
            />
          </div>

          {/* Bottom Bar */}
          <HomeBottom
            isDarkMode={isDarkMode}
            shotOptions={shotOptions}
            onShotOptionsChange={setShotOptions}
            resolution={resolution}
            onResolutionChange={setResolution}
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
            onGenerate={handleMerge}
            isGenerating={isGenerating}
            isAnalyzed={isAnalyzed}
            hasDA={hasDA}
          />
        </div>
      </div>

      {/* Responsive CSS */}
      <style jsx>{`
                @media (max-width: 768px) {
                    .mobile-hamburger {
                        display: flex !important;
                    }
                    
                    .mobile-overlay {
                        display: block !important;
                    }
                    
                    .home-left-container {
                        display: contents; 
                    }
                }
            `}</style>
    </div>
  );
}

// Wrap with auth HOC for route protection
export default withAuth(Home);
