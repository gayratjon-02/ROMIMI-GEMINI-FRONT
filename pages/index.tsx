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
import { createProduct, analyzeProduct, getProductWithJson } from '@/libs/server/HomePage/product';
import { Product } from '@/libs/types/homepage/product';
import { getCollection, updateDAJSON } from '@/libs/server/HomePage/collection';
import { useProductContext } from '@/libs/context/ProductContext';
import {
  createGeneration,
  updateMergedPrompts as updatePromptsAPI,
  mergePrompts,
  getGeneration,
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

  // ==================== SHARED PRODUCT STATE (from context) ====================
  const {
    frontImage, backImage, referenceImages,
    setFrontImage, setBackImage, setReferenceImages,
    isAnalyzing,
    productJSON, setProductJSON,
    productId, setProductId,
    fullAnalysisResponse, setFullAnalysisResponse,
    handleAnalyze: contextAnalyze,
    handleProductSelect: contextProductSelect,
  } = useProductContext();

  // DA State
  const [daJSON, setDAJSON] = useState<DAJSON | null>(null);

  // Merged Prompts
  const [mergedPrompts, setMergedPrompts] = useState<Record<string, string>>({});
  const [generationId, setGenerationId] = useState<string | null>(null);

  // NEW: Resolution & Aspect Ratio State
  const [resolution, setResolution] = useState<'4k' | '2k'>('4k');
  const [aspectRatio, setAspectRatio] = useState<'4:5' | '1:1' | '9:16' | '16:9'>('4:5');

  // Shot Selection - NEW: Use ShotOptions instead of selectedShots + ageMode
  const [shotOptions, setShotOptions] = useState<ShotOptions>(createDefaultShotOptions());

  // Legacy derived values for compatibility
  const selectedShots = getEnabledShots(shotOptions);
  const ageMode = shotOptions.solo?.subject || 'adult';

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [visuals, setVisuals] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);

  // 🆕 NEW: State for regeneration with new DA
  const [previousCollectionId, setPreviousCollectionId] = useState<string | null>(null);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState(0);
  const [isMerging, setIsMerging] = useState(false);
  const [isNewDAFlow, setIsNewDAFlow] = useState(false);

  // NEW: Store the full generation response from API
  const [generationResponse, setGenerationResponse] = useState<Generation | null>(null);
  // Library: selected generation to show its generated images in HomeMiddle
  const [librarySelectedGeneration, setLibrarySelectedGeneration] = useState<Generation | null>(null);
  // Increment when generation completes so HomeLeft Library refetches without page refresh
  const [libraryRefreshTrigger, setLibraryRefreshTrigger] = useState(0);
  // NEW: Loading state for Library selection
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);

  // WebSocket Integration - Real-time image updates
  const { isConnected: socketConnected } = useGenerationSocket(generationResponse?.id || null, {
    onVisualCompleted: (data) => {
      console.log('🎨 [Index] Visual completed received:', {
        type: data.type,
        index: data.index,
        status: data.status,
        hasImage: !!data.image_url,
      });

      setVisuals(prev => {
        const next = [...prev];

        // Find the visual to update - prefer index match, fallback to type match
        let targetIndex = -1;

        // Method 1: Direct index match
        if (typeof data.index === 'number' && data.index >= 0 && data.index < next.length) {
          targetIndex = data.index;
        }

        // Method 2: Type matching fallback
        if (targetIndex === -1 && data.type) {
          targetIndex = next.findIndex(v => v.type === data.type);
        }

        // Update the visual if found
        if (targetIndex !== -1) {
          next[targetIndex] = {
            ...next[targetIndex],
            ...data,
            status: data.status || 'completed',
          };
          console.log('✅ [Index] Updated visual at index', targetIndex, 'type:', data.type);
        } else {
          // Visual not found in placeholder array - add it
          console.log('⚠️ [Index] Visual not found, appending:', data.type);
          next.push({
            ...data,
            status: data.status || 'completed',
          });
        }

        return next;
      });
    },
    // Removed onProgress - calculated locally
    onComplete: (data) => {
      console.log('🏁 [Index] Generation complete:', data.status, `${data.completed}/${data.total}`);
      if (data.visuals && data.visuals.length > 0) {
        // Only replace if we have full visuals
        setVisuals(data.visuals);
      }
      setIsGenerating(false);
      setIsGeneratingImages(false);
      setIsNewDAFlow(false);
      setIsMerging(false);
      setProgress(100);
      // 🆕 Set previousCollectionId so "Generate with New DA" works for fresh generations
      if (selectedCollection?.id) {
        setPreviousCollectionId(selectedCollection.id);
        console.log('📌 Set previousCollectionId for regeneration:', selectedCollection.id);
      }
      // Refresh Library so new product appears without page reload
      setLibraryRefreshTrigger(prev => prev + 1);
    },
    onConnected: () => {
      console.log('🔌 [Index] Socket connected for generation:', generationResponse?.id);
    },
    onError: (error) => {
      console.error('❌ [Index] Socket error:', error.message);
    }
  });

  // Local progress calculation (reliable for SSE)
  useEffect(() => {
    if (visuals.length > 0) {
      const completed = visuals.filter(v => v.status === 'completed').length;
      // If we are generating, show at least 5% progress
      const percent = Math.max(isGenerating ? 5 : 0, Math.round((completed / visuals.length) * 100));
      setProgress(percent);
    } else if (isGenerating) {
      setProgress(5); // Initial progress
    }
  }, [visuals, isGenerating]);

  // 🔄 Polling fallback: fetch generation status periodically during active generation
  // Ensures images display even if Socket.IO connection drops
  useEffect(() => {
    if (!isGenerating || !generationId) return;

    const interval = setInterval(async () => {
      try {
        const status = await pollGenerationStatus(generationId);
        if (status.visuals && status.visuals.length > 0) {
          // Only update if we have new completed visuals the socket missed
          const currentCompleted = visuals.filter(v => v.status === 'completed').length;
          const polledCompleted = status.visuals.filter(v => v.status === 'completed').length;
          if (polledCompleted > currentCompleted) {
            console.log(`🔄 [Poll] Found ${polledCompleted - currentCompleted} new completed visuals via polling`);
            setVisuals(status.visuals);
          }
        }
        if (status.isComplete) {
          console.log('🔄 [Poll] Generation complete detected via polling');
          setVisuals(status.visuals);
          setIsGenerating(false);
          setIsGeneratingImages(false);
          setIsNewDAFlow(false);
          setIsMerging(false);
          setProgress(100);
          if (selectedCollection?.id) {
            setPreviousCollectionId(selectedCollection.id);
          }
          setLibraryRefreshTrigger(prev => prev + 1);
        }
      } catch (e) {
        console.warn('🔄 [Poll] Failed:', e);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isGenerating, generationId]);

  // 🚀 CRITICAL: Initialize mergedPrompts state from generationResponse
  // This enables shot toggle sync and save-before-generate to work properly
  useEffect(() => {
    const merged = generationResponse?.merged_prompts;
    if (merged && Object.keys(merged).length > 0) {
      // Only initialize if mergedPrompts is empty (don't overwrite user edits)
      setMergedPrompts(prev => {
        if (Object.keys(prev).length === 0) {
          console.log('📦 Initializing mergedPrompts from generationResponse:', Object.keys(merged));
          return merged as Record<string, any>;
        }
        return prev;
      });
    }
  }, [generationResponse?.merged_prompts]);

  // ==================== HANDLERS ====================

  const handleBrandCreated = useCallback(() => {
    setBrandRefreshTrigger(prev => prev + 1);
  }, []);

  const handleBrandSelect = useCallback((brand: Brand | null) => {
    setSelectedBrand(brand);
    setSelectedCollection(null);
    // 🔧 REMOVED: setLibrarySelectedGeneration(null) - allows Library + DA selection workflow
  }, []);

  const handleCollectionSelect = useCallback((collection: Collection | null, brand: Brand | null) => {
    setSelectedCollection(collection);
    if (brand) setSelectedBrand(brand);
    // 🔧 REMOVED: setLibrarySelectedGeneration(null) - allows Library + DA selection workflow
  }, []);

  const handleLibrarySelect = useCallback(async (gen: Generation) => {
    try {
      setIsLibraryLoading(true); // Start loading
      const full = await getGeneration(gen.id);
      setLibrarySelectedGeneration(full);

      // 🆕 Set context for regeneration with new DA
      setProductId(full.product_id);
      setPreviousCollectionId(full.collection_id);

      // 🆕 Display Library generation's visuals immediately
      if (full.visual_outputs && full.visual_outputs.length > 0) {
        setVisuals(full.visual_outputs);
        console.log(`📸 Displaying ${full.visual_outputs.length} visuals from Library generation`);

        // 🚀 Wait for all images to load before hiding spinner
        const imagePromises = full.visual_outputs
          .filter((v: any) => v.status === 'completed' && v.image_url)
          .map((v: any) => {
            return new Promise<void>((resolve) => {
              const img = new Image();
              img.src = v.image_url;
              img.onload = () => resolve();
              img.onerror = () => resolve(); // Resolve even on error to avoid stuck spinner
            });
          });

        if (imagePromises.length > 0) {
          await Promise.all(imagePromises);
          console.log('✅ All library images preloaded');
        }
      }

      console.log('📚 Library generation loaded:', full.id);
      console.log('   Product:', full.product_id);
      console.log('   Original DA:', full.collection_id);
    } catch (e) {
      console.error('Failed to load generation for Library:', e);
    } finally {
      setIsLibraryLoading(false); // Stop loading
    }
  }, []);

  // Handle Product Catalog selection: delegate to context + reset generation state
  const handleProductSelect = useCallback(async (product: Product) => {
    // Clear page-specific generation state
    setLibrarySelectedGeneration(null);
    setVisuals([]);
    setMergedPrompts({});
    setGenerationResponse(null);
    setProgress(0);
    // Delegate product data mapping to context
    contextProductSelect(product);
  }, [contextProductSelect]);

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

  // 🚀 CRITICAL: Sync shotOptions changes to mergedPrompts.model_type
  // When user toggles Kid/Adult in bottom bar, update the model_type in prompts
  useEffect(() => {
    if (Object.keys(mergedPrompts).length === 0) return;

    setMergedPrompts(prev => {
      const updated = { ...prev } as Record<string, any>;
      let hasChanges = false;

      // Sync SOLO subject (kid/adult)
      if (updated.solo && shotOptions.solo) {
        const newModelType = (shotOptions.solo as any).subject || 'adult';
        if (updated.solo.model_type !== newModelType) {
          updated.solo = { ...updated.solo, model_type: newModelType };
          hasChanges = true;
          console.log('🔄 Synced solo.model_type to:', newModelType);
        }
      }

      // Sync flatlay_front size (kid/adult)
      if (updated.flatlay_front && shotOptions.flatlay_front) {
        const newModelType = (shotOptions.flatlay_front as any).size === 'kid' ? 'kid' : 'adult';
        if (updated.flatlay_front.model_type !== newModelType) {
          updated.flatlay_front = { ...updated.flatlay_front, model_type: newModelType };
          hasChanges = true;
          console.log('🔄 Synced flatlay_front.model_type to:', newModelType);
        }
      }

      // Sync flatlay_back size (kid/adult)
      if (updated.flatlay_back && shotOptions.flatlay_back) {
        const newModelType = (shotOptions.flatlay_back as any).size === 'kid' ? 'kid' : 'adult';
        if (updated.flatlay_back.model_type !== newModelType) {
          updated.flatlay_back = { ...updated.flatlay_back, model_type: newModelType };
          hasChanges = true;
          console.log('🔄 Synced flatlay_back.model_type to:', newModelType);
        }
      }

      return hasChanges ? updated : prev;
    });
  }, [shotOptions.solo, shotOptions.flatlay_front, shotOptions.flatlay_back]);

  // Handle Product Analysis - Uses analyzeProductDirect API (NO collection needed!)
  // Wrap context analyze with page-specific generation-reset logic
  const handleAnalyze = useCallback(async (forceReanalyze = false) => {
    if (productJSON && !forceReanalyze) {
      setVisuals([]);
      return;
    }
    if (forceReanalyze) {
      setMergedPrompts({});
      setGenerationResponse(null);
      setVisuals([]);
    }
    await contextAnalyze(forceReanalyze);
  }, [contextAnalyze, productJSON]);

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

  // Step 1: Merge button -> Save JSONs first, then create generation and merge prompts
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
      // ==================== STEP 0: Save JSONs First ====================
      // Save Product JSON and DA JSON to database before merging
      console.log('💾 Saving Product JSON and DA JSON before merge...');

      // Save Product Analysis if we have product data
      if (productId && fullAnalysisResponse?.analysis) {
        try {
          const { updateProductAnalysis } = await import('@/libs/server/HomePage/product');
          await updateProductAnalysis(productId, fullAnalysisResponse.analysis);
          console.log('✅ Product JSON saved to database');
        } catch (err) {
          console.warn('⚠️ Could not save Product JSON (continuing with merge):', err);
        }
      }

      // Save DA JSON if we have collection and DA data
      if (selectedCollection?.id && daJSON) {
        try {
          await updateDAJSON(selectedCollection.id, {
            analyzed_da_json: daJSON
          });
          console.log('✅ DA JSON saved to database');
        } catch (err) {
          console.warn('⚠️ Could not save DA JSON (continuing with merge):', err);
        }
      }

      // ==================== STEP 1: Create Generation ====================
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
        generation_type: 'product_visuals',
        resolution: resolution === '4k' ? '4K' : '2K',
        aspect_ratio: aspectRatio,
      });

      console.log('✅ Generation created:', generation.id);

      // ==================== STEP 2: Merge Prompts ====================
      console.log('📝 Merging prompts with shot_options...');
      console.log('🔍 DEBUG FRONTEND - options being sent:', JSON.stringify(options));
      console.log('🔍 DEBUG FRONTEND - solo option:', JSON.stringify(options.solo));
      console.log('🔍 DEBUG FRONTEND - solo.subject:', options.solo?.subject);

      const { mergePrompts } = await import('@/libs/server/HomePage/merging');
      await mergePrompts(generation.id, {
        shot_options: options,
        resolution: resolution === '4k' ? '4K' : '2K',
        aspect_ratio: aspectRatio,
      });

      // Fetch updated generation with merged prompts
      const { getGeneration } = await import('@/libs/server/HomePage/merging');
      const updatedGeneration = await getGeneration(generation.id);

      setGenerationId(generation.id);
      setGenerationResponse(updatedGeneration);

      // Set merged prompts to show in UI (this will trigger tab switch)
      if (updatedGeneration.merged_prompts) {
        setMergedPrompts(updatedGeneration.merged_prompts as Record<string, any>);
      }

      console.log('✅ Generation ready for review:', updatedGeneration.id);

    } catch (error: any) {
      console.error('Merge failed:', error);
      alert(error.message || 'Failed to merge prompts');
    } finally {
      setIsGenerating(false);
    }
  }, [productId, selectedCollection, daJSON, fullAnalysisResponse, mockDAAnalysis, resolution, aspectRatio]);

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
      // 🚀 CRITICAL: Re-merge with current shotOptions BEFORE generation
      // This ensures Kid/Adult selection is applied to prompt text (not just model_type field)
      const { mergePrompts } = await import('@/libs/server/HomePage/merging');
      await mergePrompts(generationId, {
        shot_options: shotOptions,
        resolution: resolution === '4k' ? '4K' : '2K',
        aspect_ratio: aspectRatio,
      });
      console.log('✅ Re-merged with shot_options, resolution, aspect_ratio before generation');

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
  }, [generationId, generationResponse, shotOptions, resolution, aspectRatio]);

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

  // Handle save complete - Clear merged state so Merge button appears again
  const handleSaveComplete = useCallback(() => {
    console.log('💾 [Index] Save completed - clearing merged state for re-merge');
    // Clear merged prompts so Merge button shows
    setMergedPrompts({});
    // Clear generation response to reset merge state
    setGenerationResponse(null);
    // Reset visuals
    setVisuals([]);
    setProgress(0);
  }, []);

  const isAnalyzed = !!productJSON; // also available as ctx.isAnalyzed
  const hasDA = !!daJSON;

  // After generation completes, hide Merge/Generate buttons
  const hasCompletedGeneration = Boolean(
    visuals.length > 0 &&
    visuals.every(v => v.status === 'completed') &&
    !isGenerating &&
    !isMerging
  );

  // 🆕 NEW: Detect if regeneration with new DA is available (current generation)
  const isRegenerationAvailable = Boolean(
    productId && // Product exists
    generationResponse && // Previous generation exists
    visuals.length > 0 && // Has generated images
    visuals.every(v => v.status === 'completed') && // All completed
    selectedCollection?.id && // Collection selected
    previousCollectionId && // Had previous collection
    selectedCollection.id !== previousCollectionId // DA changed
  );

  // 🆕 Check if user can regenerate from Library with new DA
  const isLibraryRegenerationAvailable = Boolean(
    librarySelectedGeneration && // Library item selected
    librarySelectedGeneration.status === 'completed' && // Generation completed
    selectedCollection?.id && // New DA selected
    selectedCollection.id !== librarySelectedGeneration.collection_id && // DA changed
    !isGeneratingImages // Not currently generating
  );

  /**
   * 🆕 Helper: Extract shot options from merged prompts
   */
  const extractShotOptionsFromMergedPrompts = useCallback((merged: any) => {
    const opts: any = {};
    ['duo', 'solo', 'flatlay_front', 'flatlay_back', 'closeup_front', 'closeup_back'].forEach(type => {
      if (merged[type]) {
        opts[type] = {
          enabled: true,
          subject: merged[type].subject || 'adult'
        };
      }
    });
    return opts;
  }, []);

  /**
   * Generate with new DA: merge first (loading), then generate (cards + progress)
   */
  const handleRegenerateWithNewDA = useCallback(async () => {
    if (!productId || !selectedCollection) {
      alert('Please select a product and a different DA');
      return;
    }

    // Phase 1: Merging - show loading state
    setIsNewDAFlow(true);
    setIsMerging(true);

    try {
      console.log('🔀 Merging product JSON with new DA...');

      const generation = await createGeneration({
        product_id: productId,
        collection_id: selectedCollection.id,
        generation_type: 'product_visuals',
        resolution: resolution === '4k' ? '4K' : '2K',
        aspect_ratio: aspectRatio,
      });

      console.log('✅ Generation created:', generation.id);

      // Merge prompts with new DA
      const merged = await mergePrompts(generation.id, {
        shot_options: shotOptions,
        resolution: resolution === '4k' ? '4K' : '2K',
        aspect_ratio: aspectRatio,
      });

      console.log('✅ Merge complete');

      // Phase 1 complete - hide merge loading
      setIsMerging(false);

      // Phase 2: Generate - show placeholder cards immediately
      const shotTypes = Object.keys(merged as Record<string, any>);
      const placeholderVisuals = shotTypes.map(type => ({
        type,
        status: 'pending' as const,
        image_url: undefined,
        error: undefined,
      }));
      setVisuals(placeholderVisuals);

      // Set generation state
      setGenerationId(generation.id);
      setGenerationResponse(generation);
      setMergedPrompts(merged as any);
      setPreviousCollectionId(selectedCollection.id);
      setIsGenerating(true);
      setIsGeneratingImages(true);
      setGeneratingProgress(0);

      // Execute generation - WebSocket handles real-time updates
      await executeGeneration(generation.id);
      console.log('🚀 Generation started');

    } catch (error: any) {
      console.error('❌ Regeneration failed:', error);
      setIsMerging(false);
      setIsNewDAFlow(false);
      setIsGeneratingImages(false);
      setIsGenerating(false);
      alert(`Failed to regenerate: ${error.message || 'Unknown error'}`);
    }
  }, [productId, selectedCollection, shotOptions, resolution, aspectRatio]);

  /**
   * Generate Library generation with new DA: merge first (loading), then generate (cards)
   */
  const handleRegenerateLibraryWithNewDA = useCallback(async () => {
    if (!librarySelectedGeneration || !selectedCollection) {
      alert('Please select a Library generation and a different DA');
      return;
    }

    if (selectedCollection.id === librarySelectedGeneration.collection_id) {
      alert('Please select a different DA to regenerate');
      return;
    }

    // Extract shot options from library generation
    const shotOpts = librarySelectedGeneration.merged_prompts
      ? extractShotOptionsFromMergedPrompts(librarySelectedGeneration.merged_prompts)
      : shotOptions;

    const enabledShots = Object.keys(shotOpts).filter(key => shotOpts[key]?.enabled);

    if (enabledShots.length === 0) {
      alert('No shots enabled in Library generation. Cannot regenerate.');
      return;
    }

    // Phase 1: Merging - show loading state
    setIsNewDAFlow(true);
    setIsMerging(true);

    try {
      console.log('🔀 Merging library product with new DA...');

      // 1. Create new generation with NEW DA
      const generation = await createGeneration({
        product_id: librarySelectedGeneration.product_id,
        collection_id: selectedCollection.id,
        generation_type: 'product_visuals',
        resolution: (librarySelectedGeneration as any).resolution || '4K',
        aspect_ratio: (librarySelectedGeneration as any).aspect_ratio || '4:5',
      });

      console.log('✅ Generation created:', generation.id);

      // 2. Merge with new DA
      const merged = await mergePrompts(generation.id, {
        shot_options: shotOpts,
        resolution: (librarySelectedGeneration as any).resolution || '4K',
        aspect_ratio: (librarySelectedGeneration as any).aspect_ratio || '4:5',
      });

      console.log('✅ Merge complete');

      // Phase 1 complete - hide merge loading
      setIsMerging(false);

      // Phase 2: Generate - show placeholder cards immediately
      const mergedKeys = Object.keys(merged as Record<string, any>);
      const placeholderVisuals = mergedKeys.map(type => ({
        type,
        shot_type: type,
        status: 'pending' as const,
        image_url: null,
      }));
      setVisuals(placeholderVisuals);

      // Set generation state
      setGenerationId(generation.id);
      setGenerationResponse(generation);
      setMergedPrompts(merged as any);
      setPreviousCollectionId(selectedCollection.id);
      setIsGenerating(true);
      setIsGeneratingImages(true);
      setGeneratingProgress(0);

      // 3. Execute generation - WebSocket handles real-time updates
      await executeGeneration(generation.id);
      console.log('🚀 Generation started');

    } catch (error: any) {
      console.error('❌ Library regeneration failed:', error);
      setIsMerging(false);
      setIsNewDAFlow(false);
      setIsGeneratingImages(false);
      setIsGenerating(false);
      alert(`Failed to regenerate: ${error.message || 'Unknown error'}`);
    }
  }, [librarySelectedGeneration, selectedCollection, shotOptions, extractShotOptionsFromMergedPrompts]);

  /**
   * 🆕 Generate with new DA from modal picker (collection selected inside HomeMiddle)
   */
  const handleRegenerateWithNewDAFromModal = useCallback(async (collectionId: string) => {
    if (!productId) {
      alert('No product available for regeneration');
      return;
    }

    // Phase 1: Merging
    setIsNewDAFlow(true);
    setIsMerging(true);

    try {
      console.log('🔀 Merging product with new DA (from modal):', collectionId);

      const generation = await createGeneration({
        product_id: productId,
        collection_id: collectionId,
        generation_type: 'product_visuals',
        resolution: resolution === '4k' ? '4K' : '2K',
        aspect_ratio: aspectRatio,
      });

      console.log('✅ Generation created:', generation.id);

      const merged = await mergePrompts(generation.id, {
        shot_options: shotOptions,
        resolution: resolution === '4k' ? '4K' : '2K',
        aspect_ratio: aspectRatio,
      });

      console.log('✅ Merge complete');

      // Phase 1 complete
      setIsMerging(false);

      // Phase 2: Generate - show placeholder cards
      const shotTypes = Object.keys(merged as Record<string, any>);
      const placeholderVisuals = shotTypes.map(type => ({
        type,
        status: 'pending' as const,
        image_url: undefined,
        error: undefined,
      }));
      setVisuals(placeholderVisuals);

      // Set generation state
      setGenerationId(generation.id);
      setGenerationResponse(generation);
      setMergedPrompts(merged as any);
      setPreviousCollectionId(collectionId);
      setIsGenerating(true);
      setIsGeneratingImages(true);
      setGeneratingProgress(0);

      // Execute generation
      await executeGeneration(generation.id);
      console.log('🚀 Generation started');

    } catch (error: any) {
      console.error('❌ Regeneration from modal failed:', error);
      setIsMerging(false);
      setIsNewDAFlow(false);
      setIsGeneratingImages(false);
      setIsGenerating(false);
      alert(`Failed to regenerate: ${error.message || 'Unknown error'}`);
    }
  }, [productId, shotOptions, resolution, aspectRatio]);

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
            selectedCollectionId={selectedCollection?.id ?? null}
            onBrandCreated={handleBrandCreated}
            onLibrarySelect={handleLibrarySelect}
            libraryRefreshTrigger={libraryRefreshTrigger}
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
            onProductSelect={handleProductSelect}
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
              onReanalyze={() => handleAnalyze(true)}
              onSaveComplete={handleSaveComplete}
              libraryGeneration={librarySelectedGeneration}
              isLibraryLoading={isLibraryLoading}
              onRegenerateWithNewDA={handleRegenerateWithNewDAFromModal}
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
            // NEW: Generate Images props
            hasMergedPrompts={!!generationResponse?.merged_prompts}
            onGenerateImages={handleGenerateImages}
            isGeneratingImages={isGenerating && !!generationResponse?.merged_prompts} // Only spin if we have prompts
            generatingProgress={progress}
            // Generate with New DA props
            onRegenerateWithNewDA={
              isLibraryRegenerationAvailable
                ? handleRegenerateLibraryWithNewDA
                : handleRegenerateWithNewDA
            }
            isRegenerationAvailable={
              isRegenerationAvailable || isLibraryRegenerationAvailable
            }
            regenerationContext={
              isLibraryRegenerationAvailable ? 'library' : 'current'
            }
            // Hide buttons after generation completes
            hasCompletedGeneration={hasCompletedGeneration}
            isMerging={isMerging}
            isNewDAFlow={isNewDAFlow}
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
