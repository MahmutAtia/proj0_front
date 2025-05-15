import React, { useState, useRef, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import { classNames } from 'primereact/utils';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';

// Import CSS Module
import styles from './AIAssistant.module.css';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// Available languages for speech recognition
const languages = [
    { name: 'English (US)', code: 'en-US', flag: '🇺🇸' },
    { name: 'Spanish', code: 'es-ES', flag: '🇪🇸' },
    { name: 'French', code: 'fr-FR', flag: '🇫🇷' },
    { name: 'German', code: 'de-DE', flag: '🇩🇪' },
    { name: 'Turkish', code: 'tr-TR', flag: '🇹🇷' },
    { name: 'Chinese', code: 'zh-CN', flag: '🇨🇳' },
    { name: 'Hindi', code: 'hi-IN', flag: '🇮🇳' },
];

// Browser support information
const BROWSER_SUPPORT_INFO = "Speech recognition is supported in Chrome, Edge, Safari, and Opera. Firefox requires enabling the 'media.webspeech.recognition.enable' flag.";

const AIAssistant = ({ prompt = "", setPrompt, onSubmit, isProcessing }) => {
    const [isListening, setIsListening] = useState(false);
    const [interimText, setInterimText] = useState("");
    const [finalText, setFinalText] = useState("");
    const [recognition, setRecognition] = useState(null);
    const [selectedLanguage, setSelectedLanguage] = useState(languages.find(lang => lang.code === navigator.language) || languages[0]);
    const [isBrowserSupported, setIsBrowserSupported] = useState(!!SpeechRecognition);
    const inputRef = useRef(null);
    const [lastActivityTime, setLastActivityTime] = useState(Date.now());
    const langMenuRef = useRef(null);

    // Initialize SpeechRecognition instance
    useEffect(() => {
        if (!SpeechRecognition) {
            console.warn("Speech Recognition API is not supported in this browser.");
            setIsBrowserSupported(false);
            return;
        }

        const sr = new SpeechRecognition();
        sr.continuous = true; // Enable continuous listening for slow speakers
        sr.interimResults = true;
        sr.lang = selectedLanguage.code;

        // Initialize the manual stop flag
        sr._manualStop = false;

        sr.onstart = () => {
            setIsListening(true);
            setInterimText("");
            setFinalText("");
            console.log("Speech recognition started");
            setLastActivityTime(Date.now());
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
            setLastActivityTime(Date.now());

            if (finalTranscript) {
                setFinalText(prev => `${prev} ${finalTranscript}`.trim());
                setPrompt(prevPrompt => (prevPrompt + " " + finalTranscript).trim());
                if(inputRef.current) {
                    requestAnimationFrame(() => {
                        inputRef.current.focus();
                    });
                }
            }
        };

        sr.onerror = (event) => {
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                alert("Microphone permission denied. Please allow microphone access in your browser settings.");
                setIsListening(false);
            } else if (event.error === 'no-speech') {
                console.log("No speech detected, but continuing to listen...");
                // Don't stop the recognition for no-speech errors
                setLastActivityTime(Date.now()); // Reset the silence timer
            } else {
                console.error("Speech recognition error:", event.error);
                setIsListening(false);
            }
        };

        sr.onend = () => {
            console.log("Speech recognition ended");

            // Use the local sr variable instead of recognition state
            const wasManualStop = sr._manualStop;

            if (wasManualStop) {
                setIsListening(false);
            } else {
                // Auto-restart if it ended on its own
                console.log("Recognition ended unexpectedly. Restarting...");
                try {
                    // Small timeout before restart to prevent browser issues
                    setTimeout(() => {
                        sr.start();
                        setLastActivityTime(Date.now());
                    }, 300);
                } catch (err) {
                    console.error("Failed to restart recognition:", err);
                    setIsListening(false); // Only set to false if restart fails
                }
            }
        };

        setRecognition(sr);

        return () => {
            if (sr) {
                sr.stop();
            }
        };
    }, [selectedLanguage, setPrompt]);

    // Check for silence but don't restart recognition
    useEffect(() => {
        if (!isListening || !isBrowserSupported || !recognition) return;

        const silenceTimer = setInterval(() => {
            const silenceThreshold = 3000; // 3 seconds of silence
            const now = Date.now();

            if (now - lastActivityTime > silenceThreshold) {
                // Instead of stopping and starting, just update the timestamp
                console.log("Extended silence detected. Continuing to listen...");
                setLastActivityTime(Date.now());

                // No need to restart recognition, just let it continue running
            }
        }, 1000);

        return () => clearInterval(silenceTimer);
    }, [isListening, lastActivityTime, recognition, isBrowserSupported]);

    // Update recognition language when language changes
    useEffect(() => {
        if (recognition) {
            recognition.lang = selectedLanguage.code;
        }
    }, [recognition, selectedLanguage]);

    const toggleListening = () => {
        if (!isBrowserSupported) {
            alert(BROWSER_SUPPORT_INFO);
            return;
        }

        if (isListening) {
            if (recognition) {
                // Mark this as a manual stop to prevent auto-restart
                recognition._manualStop = true;
                recognition.stop();
            }
        } else {
            if (recognition && !isListening) {
                try {
                    // Reset the manual stop flag
                    recognition._manualStop = false;
                    recognition.start();
                } catch (error) {
                    console.error("Error starting speech recognition:", error);
                    alert("Speech recognition is not ready. Please try again.");
                }
            }
        }
    };

    // Create language menu items
    const languageItems = languages.map(lang => ({
        label: (
            <div className={styles.langMenuItem}>
                <span className={styles.langFlag}>{lang.flag}</span>
                <span>{lang.name}</span>
            </div>
        ),
        className: classNames({ [styles.activeLangItem]: selectedLanguage.code === lang.code }),
        command: () => setSelectedLanguage(lang)
    }));

    const showLanguageMenu = (event) => {
        if (langMenuRef.current && !isListening && !isProcessing) {
            langMenuRef.current.toggle(event);
        }
    };

    const footerContent = (
        <div className={styles.dialogFooter}>
            <Button
                label="Done"
                icon="pi pi-check"
                className={styles.doneButton}
                onClick={() => {
                    if (recognition) {
                        // Set the manual stop flag
                        recognition._manualStop = true;
                        recognition.stop();
                    }
                }}
            />
        </div>
    );

    return (
        <>
            <div className={styles.aiAssistantContainer}>
                {/* Input field */}
                <div className={styles.inputWrapper}>
                    <i className={classNames("pi", isListening ? "pi-volume-up" : "pi-comment", styles.inputIcon)} />
                    <InputText
                        ref={inputRef}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={isListening ? "Listening..." : "Ask AI to improve this section..."}
                        className={styles.promptInput}
                        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
                        disabled={isProcessing || isListening}
                    />
                </div>

                {/* Language selector - Completely redesigned */}
                <div className={styles.controls}>
                    <Button
                        className={styles.languageSelectorButton}
                        onClick={showLanguageMenu}
                        disabled={isListening || isProcessing || !isBrowserSupported}
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
                        icon={isListening ? "pi pi-stop-circle" : "pi pi-microphone"}
                        className={classNames(styles.voiceButton, {
                            [styles.listening]: isListening
                        })}
                        onClick={toggleListening}
                        tooltip={!isBrowserSupported ? BROWSER_SUPPORT_INFO : (isListening ? "Stop Listening" : "Start Voice Input")}
                        tooltipOptions={{ position: 'top', showOnDisabled: true }}
                        disabled={!isBrowserSupported || isProcessing}
                    />

                    {/* Submit button */}
                    <Button
                        icon={isProcessing ? "pi pi-spin pi-spinner" : "pi pi-send"}
                        className={styles.submitButton}
                        onClick={onSubmit}
                        disabled={!prompt?.trim() || isProcessing || isListening}
                        tooltip="Submit AI Request"
                    />
                </div>
            </div>

            {/* Voice Recognition Dialog - Professional redesign */}
            <Dialog
                visible={isListening}
                className={styles.voiceDialog}
                showHeader={true}
                header={
                    <div className={styles.dialogCustomHeader}>
                        <span>Voice Input</span>
                        <Button
                            icon="pi pi-times"
                            className={styles.closeButton}
                            onClick={() => {
                                if (recognition) {
                                    recognition._manualStop = true;
                                    recognition.stop();
                                }
                            }}
                        />
                    </div>
                }
                dismissableMask={false}
                closeOnEscape={true}
                onEscape={() => {
                    if (recognition) {
                        recognition._manualStop = true;
                        recognition.stop();
                    }
                }}
                style={{ width: '500px', maxWidth: '95vw' }}
                onHide={() => {
                    if (recognition) {
                        recognition._manualStop = true;
                        recognition.stop();
                    }
                }}
                footer={footerContent}
            >
                <div className={styles.voiceDialogContent}>
                    {/* Redesigned header with better visual appeal */}
                    <div className={styles.voiceVisualizer}>
                        <div className={styles.microphoneContainer}>
                            <i className="pi pi-microphone"></i>
                            <div className={styles.visualizerWaves}>
                                <span></span><span></span><span></span><span></span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.dialogHeader}>
                        <h2>Voice Recognition</h2>
                        <div className={styles.languageDisplay}>
                            <i className="pi pi-globe"></i>
                            <span>{selectedLanguage.flag} {selectedLanguage.name}</span>
                        </div>
                    </div>

                    {/* Enhanced transcript area with better separations */}
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
                                <i className="pi pi-volume-up"></i>
                                <span>Currently Listening</span>
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
                                            Speak now... I'm listening and will wait for you to finish
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Helpful instructions */}
                    <div className={styles.instructions}>
                        <i className="pi pi-info-circle"></i>
                        <span>Speak clearly, pause naturally between sentences. Click "Done" when finished.</span>
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default AIAssistant;
