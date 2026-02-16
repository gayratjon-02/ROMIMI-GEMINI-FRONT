import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
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
    const socketRef = useRef<Socket | null>(null);
    const callbacksRef = useRef(callbacks);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);

    // Keep callbacks ref updated
    useEffect(() => {
        callbacksRef.current = callbacks;
    });

    useEffect(() => {
        if (!generationId) {
            if (socketRef.current) {
                console.log('🧹 [Socket.IO] Disconnecting (no generationId)');
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            setIsConnected(false);
            return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

        console.log('═══════════════════════════════════════════════════════════');
        console.log('🔗 [Socket.IO] Connecting to:', `${apiUrl}/generations`);
        console.log('🔗 [Socket.IO] Generation ID:', generationId);
        console.log('═══════════════════════════════════════════════════════════');

        try {
            const socket = io(`${apiUrl}/generations`, {
                transports: ['websocket', 'polling'],
                timeout: 30000,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            socketRef.current = socket;

            socket.on('connect', () => {
                console.log('✅ [Socket.IO] Connected! Socket ID:', socket.id);
                setIsConnected(true);
                setConnectionError(null);
                callbacksRef.current.onConnected?.();

                // Subscribe to the generation room
                console.log('📤 [Socket.IO] Subscribing to generation:', generationId);
                socket.emit('subscribe', { generationId });
            });

            socket.on('disconnect', (reason) => {
                console.log('🔌 [Socket.IO] Disconnected:', reason);
                setIsConnected(false);
            });

            socket.on('connect_error', (err) => {
                console.error('❌ [Socket.IO] Connection error:', err.message);
                setConnectionError(err.message);
                callbacksRef.current.onError?.(err);
            });

            // Listen for real-time image completion events
            socket.on('visual_completed', (data: any) => {
                console.log('═══════════════════════════════════════════════════════════');
                console.log('📨 [Socket.IO] visual_completed received!');
                console.log('   Index:', data.index);
                console.log('   Status:', data.status);
                console.log('   Image URL:', data.image_url);
                console.log('   Type:', data.type);
                console.log('═══════════════════════════════════════════════════════════');

                callbacksRef.current.onVisualCompleted?.({
                    type: data.type,
                    index: data.index,
                    image_url: data.image_url,
                    generated_at: data.generated_at,
                    status: data.status,
                    error: data.error,
                    prompt: data.prompt,
                });
            });

            // Listen for progress updates
            socket.on('generation_progress', (data: any) => {
                console.log(`📊 [Socket.IO] Progress: ${data.progress_percent}% (${data.completed}/${data.total})`);

                callbacksRef.current.onProgress?.({
                    progress_percent: data.progress_percent,
                    completed: data.completed,
                    total: data.total,
                    elapsed_seconds: data.elapsed_seconds,
                    estimated_remaining_seconds: data.estimated_remaining_seconds,
                });
            });

            // Listen for generation completion
            socket.on('generation_complete', (data: any) => {
                console.log('═══════════════════════════════════════════════════════════');
                console.log('🏁 [Socket.IO] generation_complete received!');
                console.log('   Status:', data.status);
                console.log('   Completed:', data.completed, '/', data.total);
                console.log('═══════════════════════════════════════════════════════════');

                callbacksRef.current.onComplete?.({
                    status: data.status,
                    completed: data.completed,
                    total: data.total,
                    visuals: data.visuals || [],
                });

                // Unsubscribe and disconnect after completion
                console.log('🧹 [Socket.IO] Generation done, cleaning up...');
                socket.emit('unsubscribe', { generationId });
            });

            // Listen for visual processing state (optional)
            socket.on('visual_processing', (data: any) => {
                console.log(`⏳ [Socket.IO] Visual processing: index=${data.index}, type=${data.type}`);
            });

        } catch (error: any) {
            console.error('❌ [Socket.IO] Setup failed:', error);
            setConnectionError(error.message);
        }

        return () => {
            console.log('🧹 [Socket.IO] Cleaning up connection for:', generationId);
            if (socketRef.current) {
                socketRef.current.emit('unsubscribe', { generationId });
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            setIsConnected(false);
        };
    }, [generationId]);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        setIsConnected(false);
    }, []);

    return {
        isConnected,
        connectionError,
        disconnect,
    };
};
