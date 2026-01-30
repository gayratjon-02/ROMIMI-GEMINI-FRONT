import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const useGenerationSocket = (
    generationId: string | null,
    callbacks: {
        onVisualCompleted?: (data: any) => void;
        onProgress?: (data: any) => void;
        onComplete?: (data: any) => void;
    }
) => {
    const socketRef = useRef<Socket | null>(null);
    // Use refs for callbacks to avoid re-connecting when callbacks change
    const callbacksRef = useRef(callbacks);

    useEffect(() => {
        callbacksRef.current = callbacks;
    }, [callbacks.onVisualCompleted, callbacks.onProgress, callbacks.onComplete]);

    useEffect(() => {
        if (!generationId) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5031';
        console.log('🔌 Initializing socket connection to:', apiUrl);
        // Connect to /generations namespace
        // Note: socket.io client automatically handles the path /socket.io
        // We append /generations to the URL for the namespace
        const socket = io(`${apiUrl}/generations`, {
            transports: ['websocket'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log(`🔌 Connected to generation socket: ${generationId}`);
            socket.emit('subscribe', { generationId });
        });

        socket.on('connect_error', (err) => {
            console.warn('⚠️ Socket connection error:', err);
        });

        socket.on('visual_completed', (data) => {
            console.log('✅ Socket: Visual completed', data);
            callbacksRef.current.onVisualCompleted?.(data);
        });

        socket.on('generation_progress', (data) => {
            callbacksRef.current.onProgress?.(data);
        });

        socket.on('generation_complete', (data) => {
            console.log('✅ Socket: Generation complete', data);
            callbacksRef.current.onComplete?.(data);
        });

        socket.on('disconnect', (reason) => {
            console.log('🔌 Socket disconnected:', reason);
        });

        return () => {
            if (socket.connected) {
                socket.emit('unsubscribe', { generationId });
                socket.disconnect();
            }
            socketRef.current = null;
        };
    }, [generationId]);

    return socketRef.current;
};
