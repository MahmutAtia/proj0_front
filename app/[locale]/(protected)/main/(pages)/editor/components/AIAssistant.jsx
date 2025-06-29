import React, { useState, useEffect, useRef, useCallback } from 'react';
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import { classNames } from 'primereact/utils';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';

// Import CSS Module
import styles from './AIAssistant.module.css';

// Safe access to speech recognition
const getSpeechRecognition = () => {
    if (typeof window === 'undefined') return null;
    return window.SpeechRecognition || window.webkitSpeechRecognition;
};

// Available languages for speech recognition
const languages = [
    { name: 'English (US)', code: 'en-US', flag: '🇺🇸' },
    { name: 'Spanish', code: 'es-ES', flag: '🇪🇸' },
    { name: 'French', code: 'fr-FR', flag: '🇫🇷' },
    { name: 'German', code: 'de-DE', flag: '🇩🇪' },
    { name: 'Turkish', code: 'tr-TR', flag: '🇹🇷' },
    { name: 'Russian', code: 'ru-RU', flag: '🇷🇺' },
    { name: 'Arabic', code: 'ar-SA', flag: '🇸🇦' },
    { name: 'Arabic (Egypt)', code: 'ar-EG', flag: '🇪🇬' },
    { name: 'Dutch', code: 'nl-NL', flag: '🇳🇱' },
];

// Browser support information
const BROWSER_SUPPORT_INFO = "Speech recognition is supported in Chrome, Edge, Safari, and Opera. Firefox requires enabling the 'media.webspeech.recognition.enable' flag.";

const LOCAL_STORAGE_LANG_KEY = 'speech_recognition_language';

// Define the getInitialLanguage function BEFORE using it in useState
const getInitialLanguage = () => {
    try {
        // Check if we're in browser environment
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
            return languages[0];
        }

        // Try to get from localStorage first
        const savedLangCode = localStorage.getItem(LOCAL_STORAGE_LANG_KEY);
        if (savedLangCode) {
            const savedLang = languages.find(lang => lang.code === savedLangCode);
            if (savedLang) return savedLang;
        }

        // Try to match browser language
        const browserLang = navigator.language;
        const exactMatch = languages.find(lang => lang.code === browserLang);
        if (exactMatch) return exactMatch;

        // Try to match just the language part (e.g., 'en' from 'en-GB')
        const langCode = browserLang.split('-')[0];
        const partialMatch = languages.find(lang => lang.code.startsWith(langCode + '-'));
        if (partialMatch) return partialMatch;

        // Default to English US
        return languages[0];
    } catch (error) {
        console.error("Error getting initial language:", error);
        return languages[0]; // Default to English US on error
    }
};

const AIAssistant = ({ prompt = "", setPrompt, onSubmit, isProcessing }) => {
    const [isListening, setIsListening] = useState(false);
    const [interimText, setInterimText] = useState("");
    const [finalText, setFinalText] = useState("");
    const [recognition, setRecognition] = useState(null);
    const [selectedLanguage, setSelectedLanguage] = useState(getInitialLanguage());
    const [isBrowserSupported, setIsBrowserSupported] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);

    const inputRef = useRef(null);
    const lastActivityTimeRef = useRef(Date.now());
    const langMenuRef = useRef(null);
    const restartTimeoutRef = useRef(null);
    const silenceTimerRef = useRef(null);
    const recognitionRef = useRef(null);

    // Check browser support on mount
    useEffect(() => {
        const SpeechRecognition = getSpeechRecognition();
        setIsBrowserSupported(!!SpeechRecognition);
    }, []);

    // Stable cleanup function
    const cleanupRecognition = useCallback(() => {
        const currentRecognition = recognitionRef.current;
        if (currentRecognition) {
            try {
                currentRecognition._manualStop = true;
                currentRecognition.stop();
                currentRecognition.abort();
            } catch (error) {
                console.warn("Error during recognition cleanup:", error);
            }
        }

        // Clear any pending timeouts
        if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current);
            restartTimeoutRef.current = null;
        }

        if (silenceTimerRef.current) {
            clearInterval(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
    }, []);

    // Stable stop function
    const stopListening = useCallback(() => {
        console.log("Stopping listening...");
        setIsListening(false);
        setInterimText("");
        setIsInitializing(false);
        setDialogVisible(false);
        cleanupRecognition();
    }, [cleanupRecognition]);

    // Initialize SpeechRecognition instance only when needed
    const initializeRecognition = useCallback(() => {
        const SpeechRecognition = getSpeechRecognition();
        if (!SpeechRecognition) {
            console.warn("Speech Recognition API is not supported in this browser.");
            return null;
        }

        const sr = new SpeechRecognition();
        sr.continuous = true;
        sr.interimResults = true;
        sr.lang = selectedLanguage.code;
        sr._manualStop = false;
        sr._isRestarting = false;

        sr.onstart = () => {
            console.log("Speech recognition started");
            setIsListening(true);
            setIsInitializing(false);
            setPermissionDenied(false);
            setInterimText("");
            setDialogVisible(true);
            lastActivityTimeRef.current = Date.now();
        };

        sr.onresult = (event) => {
            let interimTranscript = "";
            let finalTranscript = "";

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            setInterimText(interimTranscript);
            lastActivityTimeRef.current = Date.now();

            if (finalTranscript) {
                setFinalText(prev => `${prev} ${finalTranscript}`.trim());
                setPrompt(prevPrompt => (prevPrompt + " " + finalTranscript).trim());
                if (inputRef.current) {
                    requestAnimationFrame(() => {
                        inputRef.current.focus();
                    });
                }
            }
        };

        sr.onerror = (event) => {
            console.error("Speech recognition error:", event.error);

            switch (event.error) {
                case 'not-allowed':
                case 'service-not-allowed':
                    setPermissionDenied(true);
                    setIsListening(false);
                    setIsInitializing(false);
                    setDialogVisible(false);
                    alert("Microphone permission denied. Please allow microphone access and try again.");
                    break;

                case 'no-speech':
                    console.log("No speech detected");
                    lastActivityTimeRef.current = Date.now();
                    // Don't stop for no-speech errors, just reset timer
                    break;

                case 'audio-capture':
                    setIsListening(false);
                    setIsInitializing(false);
                    setDialogVisible(false);
                    alert("No microphone found. Please check your microphone connection.");
                    break;

                case 'network':
                    setIsListening(false);
                    setIsInitializing(false);
                    setDialogVisible(false);
                    alert("Network error occurred. Please check your internet connection.");
                    break;

                default:
                    console.warn("Speech recognition error:", event.error);
                    break;
            }
        };

        sr.onend = () => {
            console.log("Speech recognition ended");

            const wasManualStop = sr._manualStop;
            const isRestarting = sr._isRestarting;

            if (wasManualStop || permissionDenied) {
                setIsListening(false);
                setIsInitializing(false);
                setDialogVisible(false);
                return;
            }

            // Only restart if we're still supposed to be listening and not already restarting
            if (isListening && !isRestarting && !permissionDenied) {
                console.log("Recognition ended unexpectedly. Attempting restart...");
                sr._isRestarting = true;

                // Clear any existing restart timeout
                if (restartTimeoutRef.current) {
                    clearTimeout(restartTimeoutRef.current);
                }

                restartTimeoutRef.current = setTimeout(() => {
                    try {
                        if (!sr._manualStop && !permissionDenied && isListening) {
                            sr.start();
                            lastActivityTimeRef.current = Date.now();
                        }
                    } catch (err) {
                        console.error("Failed to restart recognition:", err);
                        setIsListening(false);
                        setIsInitializing(false);
                        setDialogVisible(false);
                    } finally {
                        sr._isRestarting = false;
                        restartTimeoutRef.current = null;
                    }
                }, 1000); // Increased delay to prevent rapid restarts
            } else {
                setIsListening(false);
                setIsInitializing(false);
                setDialogVisible(false);
            }
        };

        return sr;
    }, [selectedLanguage, isListening, permissionDenied]);

    // Handle keyboard events for ESC key
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && dialogVisible) {
                stopListening();
            }
        };

        if (dialogVisible) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [dialogVisible, stopListening]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupRecognition();
        };
    }, [cleanupRecognition]);

    const toggleListening = useCallback(() => {
        if (!isBrowserSupported) {
            alert(BROWSER_SUPPORT_INFO);
            return;
        }

        if (permissionDenied) {
            alert("Microphone permission was denied. Please refresh the page and allow microphone access.");
            return;
        }

        if (isListening || isInitializing) {
            stopListening();
            return;
        }

        // Initialize new recognition instance
        const sr = initializeRecognition();
        if (!sr) {
            alert("Failed to initialize speech recognition.");
            return;
        }

        recognitionRef.current = sr;
        setRecognition(sr);

        try {
            setIsInitializing(true);
            setPermissionDenied(false);
            setFinalText("");
            setInterimText("");
            sr.start();
        } catch (error) {
            console.error("Error starting speech recognition:", error);
            setIsInitializing(false);
            alert("Failed to start speech recognition. Please try again.");
        }
    }, [isBrowserSupported, permissionDenied, isListening, isInitializing, stopListening, initializeRecognition]);

    // Update localStorage when language changes
    const updateSelectedLanguage = useCallback((lang) => {
        if (isListening) {
            alert("Please stop listening before changing the language.");
            return;
        }

        setSelectedLanguage(lang);
        try {
            localStorage.setItem(LOCAL_STORAGE_LANG_KEY, lang.code);
        } catch (error) {
            console.error("Error saving language preference:", error);
        }
    }, [isListening]);

    // Create language menu items
    const languageItems = languages.map(lang => ({
        label: (
            <div className={styles.langMenuItem}>
                <span className={styles.langFlag}>{lang.flag}</span>
                <span>{lang.name}</span>
            </div>
        ),
        className: classNames({ [styles.activeLangItem]: selectedLanguage.code === lang.code }),
        command: () => updateSelectedLanguage(lang)
    }));

    const showLanguageMenu = (event) => {
        if (langMenuRef.current && !isListening && !isProcessing && !isInitializing) {
            langMenuRef.current.toggle(event);
        }
    };

    const footerContent = (
        <div className={styles.dialogFooter}>
            <Button
                label="Cancel"
                icon="pi pi-times"
                className={styles.cancelButton}
                onClick={stopListening}
                disabled={isInitializing}
            />
            <Button
                label="Done"
                icon="pi pi-check"
                className={styles.doneButton}
                onClick={stopListening}
                disabled={isInitializing}
            />
        </div>
    );

    return (
        <>
            <div className={styles.aiAssistantContainer}>
                {/* Input field */}
                <div className={styles.inputWrapper}>
                    <i className={classNames("pi", (isListening || isInitializing) ? "pi-volume-up" : "pi-comment", styles.inputIcon)} />
                    <InputText
                        ref={inputRef}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={isListening ? "Listening..." : isInitializing ? "Starting..." : "Ask AI to improve this section..."}
                        className={styles.promptInput}
                        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
                        disabled={isProcessing || isListening || isInitializing}
                    />
                </div>

                {/* Language selector */}
                <div className={styles.controls}>
                    <Button
                        className={styles.languageSelectorButton}
                        onClick={showLanguageMenu}
                        disabled={isListening || isProcessing || !isBrowserSupported || isInitializing}
                        tooltip={!isBrowserSupported ? BROWSER_SUPPORT_INFO : "Select Language"}
                        tooltipOptions={{ position: 'top', showOnDisabled: true }}
                    >
                        <span className={styles.langButtonContent}>
                            <span className={styles.langFlag}>{selectedLanguage.flag}</span>
                            <span className={styles.langCode}>{selectedLanguage.code.split('-')[0]}</span>
                        </span>
                    </Button>

                    <Menu
                        ref={langMenuRef}
                        popup
                        model={languageItems}
                        className={styles.langMenu}
                    />

                    {/* Voice button */}
                    <Button
                        icon={isInitializing ? "pi pi-spin pi-spinner" : (isListening ? "pi pi-stop-circle" : "pi pi-microphone")}
                        className={classNames(styles.voiceButton, {
                            [styles.listening]: isListening,
                            [styles.initializing]: isInitializing
                        })}
                        onClick={toggleListening}
                        tooltip={!isBrowserSupported ? BROWSER_SUPPORT_INFO :
                                permissionDenied ? "Microphone permission denied" :
                                isInitializing ? "Starting..." :
                                isListening ? "Stop Listening" : "Start Voice Input"}
                        tooltipOptions={{ position: 'top', showOnDisabled: true }}
                        disabled={!isBrowserSupported || isProcessing}
                    />

                    {/* Submit button */}
                    <Button
                        icon={isProcessing ? "pi pi-spin pi-spinner" : "pi pi-send"}
                        className={styles.submitButton}
                        onClick={onSubmit}
                        disabled={!prompt?.trim() || isProcessing || isListening || isInitializing}
                        tooltip="Submit AI Request"
                    />
                </div>
            </div>

            {/* Voice Recognition Dialog */}
            <Dialog
                visible={dialogVisible}
                className={styles.voiceDialog}
                showHeader={false}
                dismissableMask={false}
                closable={false}
                style={{ width: '500px', maxWidth: '95vw' }}
                onHide={() => {}} // Empty function to prevent unwanted hiding
                footer={footerContent}
            >
                <div className={styles.voiceDialogContent}>
                    {/* Visualizer with integrated header */}
                    <div className={styles.voiceVisualizer}>
                        <div className={styles.customDialogHeader}>
                            <span>Voice Recognition</span>
                            <Button
                                icon="pi pi-times"
                                className={styles.closeButton}
                                onClick={stopListening}
                                disabled={isInitializing}
                            />
                        </div>
                        <div className={styles.microphoneContainer}>
                            <i className="pi pi-microphone"></i>
                            <div className={styles.visualizerWaves}>
                                <span></span><span></span><span></span><span></span>
                            </div>
                        </div>
                    </div>

                    {/* Language display */}
                    <div className={styles.languageDisplay}>
                        <i className="pi pi-globe"></i>
                        <span>{selectedLanguage.flag} {selectedLanguage.name}</span>
                    </div>

                    {/* Enhanced transcript area */}
                    <div className={styles.transcriptContainer}>
                        {finalText && (
                            <div className={styles.finalTranscriptSection}>
                                <div className={styles.sectionHeader}>
                                    <i className="pi pi-check-circle"></i>
                                    <span>Transcribed Text</span>
                                </div>
                                <div className={styles.finalText}>
                                    {finalText}
                                </div>
                            </div>
                        )}

                        <div className={styles.currentListeningSection}>
                            <div className={styles.sectionHeader}>
                                <i className={classNames("pi", isInitializing ? "pi-spin pi-spinner" : "pi-volume-up")}></i>
                                <span>{isInitializing ? "Starting..." : "Currently Listening"}</span>
                            </div>

                            <div className={styles.listeningIndicator}>
                                <div className={styles.soundWaves}>
                                    <div className={styles.bar}></div>
                                    <div className={styles.bar}></div>
                                    <div className={styles.bar}></div>
                                    <div className={styles.bar}></div>
                                    <div className={styles.bar}></div>
                                </div>

                                <div className={styles.interimTextContainer}>
                                    {interimText ? (
                                        <p className={styles.interimText}>{interimText}</p>
                                    ) : (
                                        <p className={styles.placeholderText}>
                                            {isInitializing ? "Requesting microphone access..." : "Speak now... I'm listening and will wait for you to finish"}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Helpful instructions */}
                    <div className={styles.instructions}>
                        <i className="pi pi-info-circle"></i>
                        <span>Speak clearly, pause naturally between sentences. Click &quot;Done&quot; when finished.</span>
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default AIAssistant;
