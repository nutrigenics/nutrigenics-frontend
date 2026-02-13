import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onstart: (event: Event) => void;
    onend: (event: Event) => void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
}

// Window interface extension
declare global {
    interface Window {
        SpeechRecognition: {
            new(): SpeechRecognition;
        };
        webkitSpeechRecognition: {
            new(): SpeechRecognition;
        };
    }
}

export const useSpeechRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        // Check browser support
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            setIsSupported(true);
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onstart = () => {
                setIsListening(true);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
                let finalTranscript = '';
                let interim = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interim += event.results[i][0].transcript;
                    }
                }

                if (finalTranscript) {
                    setTranscript((prev) => {
                        const needsSpace = prev.length > 0 && !prev.endsWith(' ');
                        return prev + (needsSpace ? ' ' : '') + finalTranscript;
                    });
                }
                setInterimTranscript(interim);
            };

            recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
                console.error('Speech recognition error', event.error);
                if (event.error === 'not-allowed') {
                    toast.error('Microphone permission denied');
                } else if (event.error === 'no-speech') {
                    // Ignore no-speech errors, just stay ready
                    return;
                } else {
                    toast.error(`Error: ${event.error}`);
                }
                setIsListening(false);
            };
        }
    }, []);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            try {
                setInterimTranscript(''); // Clear previous interim
                recognitionRef.current.start();
            } catch (error) {
                console.error('Failed to start recognition:', error);
            }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
    }, [isListening]);

    const resetTranscript = useCallback(() => {
        setTranscript('');
        setInterimTranscript('');
    }, []);

    return {
        isListening,
        transcript,
        interimTranscript,
        startListening,
        stopListening,
        resetTranscript,
        isSupported,
        setTranscript // Export setter if we need to manually update/clear it
    };
};
