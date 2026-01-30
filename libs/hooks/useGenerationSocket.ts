import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface VisualProcessingData {
    type: string;
    index: number;
    status: 'processing';
}

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
    onVisualProcessing?: (data: VisualProcessingData) => void;
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
            // Clean up if generationId becomes null
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            setIsConnected(false);
            return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5031';
        console.log('🔌 [WebSocket] Connecting to:', `${apiUrl}/generations`, 'for generation:', generationId);

        // Create socket connection
        const socket = io(`${apiUrl}/generations`, {
            transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
        });

        socketRef.current = socket;

        // Connection established
        socket.on('connect', () => {
            console.log('✅ [WebSocket] Connected! Socket ID:', socket.id);
            setIsConnected(true);
            setConnectionError(null);

            // Subscribe to generation room
            console.log('📡 [WebSocket] Subscribing to generation:', generationId);
            socket.emit('subscribe', { generationId });

            callbacksRef.current.onConnected?.();
        });

        // Connection error
        socket.on('connect_error', (err) => {
            console.error('❌ [WebSocket] Connection error:', err.message);
            setConnectionError(err.message);
            callbacksRef.current.onError?.(err);
        });

        // Visual processing event - Show "Generating..." state on card
        socket.on('visual_processing', (data: VisualProcessingData) => {
            console.log('⏳ [WebSocket] Visual processing:', {
                type: data.type,
                index: data.index,
            });
            callbacksRef.current.onVisualProcessing?.(data);
        });

        // Visual completed event - CRITICAL: This is where images appear on cards
        socket.on('visual_completed', (data: VisualCompletedData) => {
            console.log('🎨 [WebSocket] Visual completed:', {
                type: data.type,
                index: data.index,
                status: data.status,
                hasImage: !!data.image_url,
            });
            callbacksRef.current.onVisualCompleted?.(data);
        });

        // Progress update event
        socket.on('generation_progress', (data: ProgressData) => {
            console.log('📊 [WebSocket] Progress:', data.progress_percent + '%', `(${data.completed}/${data.total})`);
            callbacksRef.current.onProgress?.(data);
        });

        // Generation complete event
        socket.on('generation_complete', (data: CompleteData) => {
            console.log('🏁 [WebSocket] Generation complete:', {
                status: data.status,
                completed: data.completed,
                total: data.total,
            });
            callbacksRef.current.onComplete?.(data);
        });

        // Disconnection
        socket.on('disconnect', (reason) => {
            console.log('🔌 [WebSocket] Disconnected:', reason);
            setIsConnected(false);

            // Attempt reconnect if disconnect wasn't intentional
            if (reason === 'io server disconnect') {
                socket.connect();
            }
        });

        // Reconnection events for debugging
        socket.on('reconnect', (attemptNumber) => {
            console.log('🔄 [WebSocket] Reconnected after', attemptNumber, 'attempts');
            // Re-subscribe after reconnection
            socket.emit('subscribe', { generationId });
        });

        socket.on('reconnect_attempt', (attemptNumber) => {
            console.log('🔄 [WebSocket] Reconnection attempt', attemptNumber);
        });

        socket.on('reconnect_failed', () => {
            console.error('❌ [WebSocket] Reconnection failed after all attempts');
            setConnectionError('Failed to reconnect to server');
        });

        // Cleanup on unmount or generationId change
        return () => {
            console.log('🧹 [WebSocket] Cleaning up socket for generation:', generationId);
            if (socket.connected) {
                socket.emit('unsubscribe', { generationId });
            }
            socket.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        };
    }, [generationId]);

    // Return socket and connection state
    return {
        socket: socketRef.current,
        isConnected,
        connectionError,
    };
};
