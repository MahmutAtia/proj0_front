'use client';
import { useState, useEffect, useRef } from 'react';

export const useVoiceDetection = (options = {}) => {
    const {
        threshold = 30,
        silenceDelay = 1500,
        onSpeechStart,
        onSpeechEnd
    } = options;

    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState(null);

    const audioContextRef = useRef(null);
    const analyzerRef = useRef(null);
    const sourceRef = useRef(null);
    const streamRef = useRef(null);
    const rafRef = useRef(null);
    const silenceTimeoutRef = useRef(null);

    const start = async () => {
        try {
            if (audioContextRef.current) return;

            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const source = audioContextRef.current.createMediaStreamSource(stream);
            const analyzer = audioContextRef.current.createAnalyser();

            analyzer.fftSize = 512;
            analyzer.smoothingTimeConstant = 0.1;

            source.connect(analyzer);

            sourceRef.current = source;
            analyzerRef.current = analyzer;

            setIsListening(true);
            startDetection();
        } catch (err) {
            setError(err.message);
            console.error('Voice detection error:', err);
        }
    };

    const stop = () => {
        if (!audioContextRef.current) return;

        cancelAnimationFrame(rafRef.current);
        clearTimeout(silenceTimeoutRef.current);

        sourceRef.current?.disconnect();
        streamRef.current?.getTracks().forEach(track => track.stop());
        audioContextRef.current.close();

        audioContextRef.current = null;
        analyzerRef.current = null;
        sourceRef.current = null;
        streamRef.current = null;

        setIsListening(false);
    };

    const startDetection = () => {
        const analyzer = analyzerRef.current;
        if (!analyzer) return;

        const dataArray = new Uint8Array(analyzer.frequencyBinCount);

        const checkAudio = () => {
            analyzer.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

            if (average > threshold) {
                clearTimeout(silenceTimeoutRef.current);
                onSpeechStart?.();

                silenceTimeoutRef.current = setTimeout(() => {
                    onSpeechEnd?.();
                }, silenceDelay);
            }

            rafRef.current = requestAnimationFrame(checkAudio);
        };

        checkAudio();
    };

    useEffect(() => {
        return () => {
            stop();
        };
    }, []);

    return {
        start,
        stop,
        isListening,
        error
    };
};
