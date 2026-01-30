import { useEffect, useRef, useState } from 'react';
import { getAuthToken } from '@/libs/server/HomePage/signup';

interface VisualCompletedData {
    type: string;
    index: number;
    image_url: string;
    generated_at: string;
    status: 'completed' | 'failed';
    error?: string;
    prompt?: string;
}

interface ProgressData {
    progress_percent: number;
    completed: number;
    total: number;
    elapsed_seconds?: number;
    estimated_remaining_seconds?: number;
}

interface CompleteData {
    status: 'completed' | 'failed';
    completed: number;
    total: number;
    visuals: any[];
}

interface GenerationSocketCallbacks {
    onVisualCompleted?: (data: VisualCompletedData) => void;
    onProgress?: (data: ProgressData) => void;
    onComplete?: (data: CompleteData) => void;
    onConnected?: () => void;
    onError?: (error: Error) => void;
}

export const useGenerationSocket = (
    generationId: string | null,
    callbacks: GenerationSocketCallbacks
) => {
    const eventSourceRef = useRef<EventSource | null>(null);
    const callbacksRef = useRef(callbacks);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);

    // Keep callbacks ref updated
    useEffect(() => {
        callbacksRef.current = callbacks;
    });

    useEffect(() => {
        if (!generationId) {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            setIsConnected(false);
            return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5031';
        const token = getAuthToken();

        // Construct SSE URL with token
        const sseUrl = `${apiUrl}/generations/${generationId}/stream?token=${token || ''}`;

        console.log('🔗 [SSE] Connecting to:', sseUrl);

        try {
            const eventSource = new EventSource(sseUrl);
            eventSourceRef.current = eventSource;

            eventSource.onopen = () => {
                console.log('✅ [SSE] Connection opened');
                setIsConnected(true);
                setConnectionError(null);
                callbacksRef.current.onConnected?.();
            };

            eventSource.onerror = (err) => {
                console.error('❌ [SSE] Connection error:', err);
                setIsConnected(false);
                // EventSource automatically retries, but we might want to log it
                // setConnectionError('Connection lost');
                // callbacksRef.current.onError?.(new Error('SSE Connection Error'));
            };

            // Listen for all messages (default event type)
            eventSource.onmessage = (event) => {
                try {
                    const parsedData = JSON.parse(event.data);
                    console.log('📨 [SSE] Received event:', parsedData.type, parsedData);

                    switch (parsedData.type) {
                        case 'visual_completed':
                            if (parsedData.visual) {
                                callbacksRef.current.onVisualCompleted?.({
                                    type: parsedData.visual.type,
                                    index: parsedData.visualIndex,
                                    image_url: parsedData.visual.image_url,
                                    generated_at: parsedData.visual.generated_at,
                                    status: parsedData.visual.status as any,
                                    prompt: parsedData.visual.prompt
                                });
                            }
                            break;

                        case 'generation_done':
                        case 'generation_completed':
                            callbacksRef.current.onComplete?.({
                                status: parsedData.status as any,
                                completed: parsedData.completed,
                                total: parsedData.total,
                                visuals: [] // Visuals are updated incrementally
                            });

                            // Close connection on completion
                            console.log('🏁 [SSE] Generation done, closing connection');
                            eventSource.close();
                            setIsConnected(false);
                            break;

                        case 'visual_processing':
                            // Optional: handle processing state if needed
                            // For now we just log it
                            break;

                        case 'visual_failed':
                            if (parsedData.visualIndex !== undefined) {
                                callbacksRef.current.onVisualCompleted?.({
                                    type: `visual_${parsedData.visualIndex}`, // Fallback type
                                    index: parsedData.visualIndex,
                                    image_url: '',
                                    generated_at: new Date().toISOString(),
                                    status: 'failed',
                                    error: parsedData.error
                                });
                            }
                            break;
                    }

                } catch (e) {
                    console.error('❌ [SSE] Failed to parse message:', e);
                }
            };

        } catch (error: any) {
            console.error('❌ [SSE] Setup failed:', error);
            setConnectionError(error.message);
        }

        return () => {
            console.log('🧹 [SSE] Cleaning up connection for:', generationId);
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            setIsConnected(false);
        };
    }, [generationId]);

    return {
        isConnected,
        connectionError,
    };
};
