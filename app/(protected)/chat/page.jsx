'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Sidebar } from 'primereact/sidebar';
import { Badge } from 'primereact/badge';
import { Toast } from 'primereact/toast';
import { useVoiceDetection } from './hooks';
// Update imports
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';



const mockMessages = [
    { id: 1, text: "Hello! How can I help you today?", sender: "ai" }
];

const ChatPage = () => {
    const [messages, setMessages] = useState(mockMessages);
    const [inputMessage, setInputMessage] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voices, setVoices] = useState([]);
    const [selectedVoice, setSelectedVoice] = useState(null);
    const [selectedLanguage, setSelectedLanguage] = useState('en-US');
    const [showSettings, setShowSettings] = useState(false);
    const [isUserSpeaking, setIsUserSpeaking] = useState(false);

    const messagesEndRef = useRef(null);
    const toastRef = useRef(null);

    const languages = [
        { label: 'English (US)', value: 'en-US' },
        { label: 'Spanish', value: 'es-ES' },
        { label: 'French', value: 'fr-FR' },
        { label: 'German', value: 'de-DE' },
        { label: 'Arabic', value: 'ar-SA', direction: 'rtl' },
        { label: 'Turkish', value: 'tr-TR' },
        { label: 'Chinese', value: 'zh-CN' },
        { label: 'Japanese', value: 'ja-JP' }
    ];

    // Update speech recognition configuration
    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition({
        language: selectedLanguage,
        continuous: true,
        interimResults: true
    });

    const { start: startVoiceDetection, stop: stopVoiceDetection } =
        useVoiceDetection({
            threshold: 30,
            silenceDelay: 1500,
            onSpeechStart: () => setIsUserSpeaking(true),
            onSpeechEnd: () => {
                setIsUserSpeaking(false);
                if (listening) {
                    SpeechRecognition.stopListening();
                }
            }
        });

    useEffect(() => {

        if ('webkitSpeechRecognition' in window) {
            const recognition = new window.webkitSpeechRecognition();
            recognition.addEventListener('voiceschanged', () => {
                const supportedLanguages = recognition.lang;
                console.log('Supported languages:', supportedLanguages);
            });
        }

        // Log supported speech synthesis languages
        window.speechSynthesis.addEventListener('voiceschanged', () => {
            const voices = window.speechSynthesis.getVoices();
            const supportedLanguages = [...new Set(voices.map(voice => voice.lang))];
            console.log('Supported synthesis languages:', supportedLanguages);
        });


        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            const voiceOptions = availableVoices
                .filter(voice => voice.lang.startsWith(selectedLanguage.split('-')[0]))
                .map(voice => ({
                    label: `${voice.name} (${voice.lang})`,
                    value: voice.name
                }));
            setVoices(voiceOptions);
            setSelectedVoice(voiceOptions[0]?.value);
        };

        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();

        return () => {
            window.speechSynthesis.cancel();
        };
    }, [selectedLanguage]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Update voice detection handlers
    const handleStartListening = async () => {
        try {
            await startVoiceDetection();
            await SpeechRecognition.startListening({
                continuous: true,
                language: selectedLanguage
            });
        } catch (error) {
            toastRef.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to start speech recognition'
            });
            stopVoiceDetection();
        }
    };

    const handleStopListening = () => {
        stopVoiceDetection();
        SpeechRecognition.stopListening();
        if (transcript) {
            setInputMessage(transcript);
        }
        resetTranscript();
    };

    const speak = (text) => {
        if (isSpeaking) window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        const voice = window.speechSynthesis.getVoices()
            .find(v => v.name === selectedVoice);

        if (voice) utterance.voice = voice;
        utterance.lang = selectedLanguage;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onstart = () => setIsSpeaking(true);

        window.speechSynthesis.speak(utterance);
    };

    const getDisplayText = () => {
        if (inputMessage) return inputMessage;
        if (transcript && messages[messages.length - 1]?.sender !== 'ai') {
            return transcript;
        }
        return '';
    };

    const handleSend = () => {
        const messageText = getDisplayText();
        if (!messageText.trim()) return;

        const newMessage = {
            id: Date.now(),
            text: messageText,
            sender: 'user'
        };

        setMessages(prev => [...prev, newMessage]);
        setInputMessage('');
        resetTranscript();

        // Mock AI response
        setTimeout(() => {
            const aiResponse = {
                id: Date.now() + 1,
                text: "I understand your message. How else can I help?",
                sender: 'ai'
            };
            setMessages(prev => [...prev, aiResponse]);
            speak(aiResponse.text);
        }, 1000);
    };

    if (!browserSupportsSpeechRecognition) {
        return <div>Browser doesn&apos;t support speech recognition.</div>;
    }

    return (
        <div className="flex flex-column gap-3 p-4">
            <Toast ref={toastRef} />

            <div className="flex justify-content-between align-items-center mb-3">
                <h1 className="text-xl font-bold m-0">Chat Assistant</h1>
                <Button
                    icon="pi pi-cog"
                    rounded
                    text
                    severity="secondary"
                    onClick={() => setShowSettings(true)}
                />
            </div>

            <div className="surface-card border-round shadow-2" style={{ height: 'calc(100vh - 250px)' }}>
                <div className="h-full overflow-auto p-3">
                    <div className="flex flex-column gap-3">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                            >
                                <div
                                    className={`
                                        p-3 border-round-xl
                                        ${message.sender === 'user'
                                            ? 'bg-primary text-white'
                                            : 'surface-200'
                                        }
                                    `}
                                    style={{
                                        maxWidth: '80%',
                                        wordBreak: 'break-word',
                                        direction: languages.find(l =>
                                            l.value === selectedLanguage
                                        )?.direction || 'ltr'
                                    }}
                                >
                                    {message.text}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            </div>

            <div className="flex gap-2 align-items-start mt-3">
                <div className="flex-grow-1 relative">



                    <InputTextarea
                        value={inputMessage || transcript}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        rows={3}
                        autoResize
                        className="w-full"
                        placeholder="Type a message..."
                        dir={languages.find(l => l.value === selectedLanguage)?.direction || 'ltr'}
                        disabled={isSpeaking}
                    />

                    {(listening || isUserSpeaking || isSpeaking) && (
                        <Badge
                            value={
                                isUserSpeaking
                                    ? "Speaking"
                                    : isSpeaking
                                        ? "AI Speaking"
                                        : "Listening"
                            }
                            severity={
                                isUserSpeaking
                                    ? "danger"
                                    : isSpeaking
                                        ? "success"
                                        : "info"
                            }
                            className="absolute top-0 right-0 m-2"
                        />
                    )}
                </div>
                <div className="flex flex-column gap-2">
                    <Button
                        icon={listening ? "pi pi-microphone" : "pi pi-microphone-slash"}
                        onClick={() => listening ? handleStopListening() : handleStartListening()}
                        severity={listening ? "danger" : "secondary"}
                        rounded
                        disabled={isSpeaking}
                        tooltip={listening ? "Stop listening" : "Start listening"}
                    />
                    <Button
                        icon="pi pi-send"
                        onClick={handleSend}
                        disabled={!getDisplayText().trim() || isSpeaking}
                        rounded
                    />
                </div>
            </div>

            <Sidebar
                visible={showSettings}
                position="right"
                onHide={() => setShowSettings(false)}
                className="w-full md:w-20rem"
            >
                <h2>Settings</h2>
                <div className="flex flex-column gap-3">
                    <div className="field">
                        <label className="block mb-2">Language</label>
                        <Dropdown
                            value={selectedLanguage}
                            options={languages}
                            onChange={(e) => {
                                setSelectedLanguage(e.value);
                                resetTranscript();
                            }}
                            className="w-full"
                        />
                    </div>
                    <div className="field">
                        <label className="block mb-2">Voice</label>
                        <Dropdown
                            value={selectedVoice}
                            options={voices}
                            onChange={(e) => setSelectedVoice(e.value)}
                            className="w-full"
                        />
                    </div>
                </div>
            </Sidebar>
        </div>
    );
};

export default ChatPage;
