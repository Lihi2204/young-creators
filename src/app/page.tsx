'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
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
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

// Fun animated background bubbles
const FloatingBubbles = () => {
  const bubbles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    size: Math.random() * 60 + 30,
    left: Math.random() * 100,
    delay: Math.random() * 5,
    duration: Math.random() * 10 + 15,
    color: ['#FFE066', '#FF6B9D', '#4ECDC4', '#A78BFA', '#34D399'][i % 5]
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {bubbles.map(bubble => (
        <div
          key={bubble.id}
          className="absolute rounded-full opacity-20"
          style={{
            width: bubble.size,
            height: bubble.size,
            left: `${bubble.left}%`,
            backgroundColor: bubble.color,
            animation: `float ${bubble.duration}s ease-in-out ${bubble.delay}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(100vh) rotate(0deg); }
          50% { transform: translateY(-100vh) rotate(180deg); }
        }
      `}</style>
    </div>
  );
};

// Pulsing microphone button
const MicButton = ({ isListening, onClick, disabled }: { isListening: boolean; onClick: () => void; disabled: boolean }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-32 h-32 rounded-full
        transition-all duration-300 transform
        ${isListening
          ? 'bg-gradient-to-br from-red-400 to-pink-500 scale-110'
          : 'bg-gradient-to-br from-purple-500 to-indigo-600 hover:scale-105'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        shadow-2xl
      `}
    >
      {isListening && (
        <>
          <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
          <span className="absolute inset-0 rounded-full bg-red-400 animate-pulse opacity-20" />
        </>
      )}
      <div className="relative z-10 flex items-center justify-center h-full">
        <svg
          className="w-14 h-14 text-white"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
      </div>
    </button>
  );
};

// Character mascot
const Mascot = ({ mood }: { mood: string }) => {
  const expressions: Record<string, string> = {
    idle: '',
    listening: '',
    thinking: '',
    happy: '',
    speaking: '',
    creating: ''
  };

  return (
    <div className={`
      text-7xl transition-transform duration-300
      ${mood === 'thinking' || mood === 'creating' ? 'animate-bounce' : ''}
      ${mood === 'happy' ? 'animate-pulse' : ''}
    `}>
      {expressions[mood] || expressions.idle}
    </div>
  );
};

// Live transcription display
const LiveTranscription = ({ text, isVisible }: { text: string; isVisible: boolean }) => {
  if (!isVisible || !text) return null;

  return (
    <div className="bg-blue-500/30 backdrop-blur-sm rounded-2xl p-4 mb-4 border-2 border-blue-300/50">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        <span className="text-white/80 text-sm">מקליט...</span>
      </div>
      <p className="text-white text-lg font-medium" dir="rtl">{text}</p>
    </div>
  );
};

// Speech bubble for displaying text with typing effect
const SpeechBubble = ({ text, isUser, isTyping, displayedText }: { text: string; isUser: boolean; isTyping?: boolean; displayedText?: string }) => {
  if (!text && !isTyping) return null;

  const textToShow = displayedText !== undefined ? displayedText : text;

  return (
    <div className={`
      max-w-md p-4 rounded-2xl shadow-lg
      ${isUser
        ? 'bg-gradient-to-r from-blue-400 to-cyan-400 text-white mr-auto'
        : 'bg-white text-gray-800 ml-auto border-2 border-purple-200'
      }
    `}>
      {isTyping ? (
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      ) : (
        <p className="text-lg font-medium" dir="rtl">{textToShow}</p>
      )}
    </div>
  );
};

// Loading indicator for code generation
const CreatingIndicator = () => (
  <div className="bg-gradient-to-r from-purple-500/30 to-pink-500/30 backdrop-blur-sm rounded-2xl p-6 mb-4 border-2 border-purple-300/50">
    <div className="flex items-center justify-center gap-3">
      <span className="text-4xl animate-spin"></span>
      <div className="text-white text-xl font-medium">יוצר את האפליקציה שלך...</div>
      <span className="text-4xl animate-bounce"></span>
    </div>
  </div>
);

// The generated artifact display
const ArtifactDisplay = ({ code, isVisible }: { code: string | null; isVisible: boolean }) => {
  if (!isVisible || !code) return null;

  return (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-yellow-400">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 px-4 py-2 flex items-center gap-2">
        <span className="text-2xl"></span>
        <span className="font-bold text-white text-lg">היצירה שלך!</span>
      </div>
      <div className="p-4">
        <iframe
          srcDoc={code}
          className="w-full h-96 border-0 rounded-xl"
          sandbox="allow-scripts"
          title="Created artifact"
        />
      </div>
    </div>
  );
};

interface Message {
  text: string;
  isUser: boolean;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Main App Component
export default function YoungCreators() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [currentArtifact, setCurrentArtifact] = useState<string | null>(null);
  const [mood, setMood] = useState('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [typingText, setTypingText] = useState('');
  const [isTypingEffect, setIsTypingEffect] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Typing effect for AI responses
  const startTypingEffect = useCallback((text: string, onComplete?: () => void) => {
    const words = text.split(' ');
    let index = 0;
    setTypingText('');
    setIsTypingEffect(true);

    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    typingIntervalRef.current = setInterval(() => {
      if (index < words.length) {
        setTypingText(prev => prev + (prev ? ' ' : '') + words[index]);
        index++;
      } else {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
        }
        setIsTypingEffect(false);
        if (onComplete) onComplete();
      }
    }, 80);
  }, []);

  // Cleanup typing effect on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  // Initialize audio element on first user interaction (for mobile)
  const initAudioForMobile = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.volume = 1;
      // Play silent audio to unlock audio context on mobile
      audio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAABhgTTKKoAAAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAABhgTTKKoAAAAAAAAAAAAAAAAA';
      audio.play().catch(() => {});
      audioRef.current = audio;
    }
  }, []);

  // Speak using OpenAI TTS
  const speak = useCallback(async (text: string) => {
    try {
      setIsSpeaking(true);
      setMood('speaking');

      const response = await fetch('/api/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to synthesize speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Reuse existing audio element for mobile compatibility
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      const audio = audioRef.current;
      audio.pause();
      audio.src = audioUrl;

      audio.onended = () => {
        setIsSpeaking(false);
        setMood('idle');
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        setMood('idle');
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();

    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
      setMood('idle');
    }
  }, []);

  // Generate code using the generate API (Claude Opus 4.5)
  const generateCode = useCallback(async (history: ConversationMessage[]) => {
    try {
      setIsCreating(true);
      setMood('creating');

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationHistory: history }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setCurrentArtifact(data.code);
      setIsCreating(false);
      setMood('happy');

    } catch (error) {
      console.error('Code generation error:', error);
      setIsCreating(false);
      setMood('idle');
    }
  }, []);

  // Process transcribed text
  const handleUserInput = useCallback(async (text: string) => {
    setIsThinking(true);
    setMood('thinking');
    setLiveTranscript('');

    // Add user message to display
    setMessages(prev => [...prev, { text, isUser: true }]);

    // Update conversation history
    const newHistory: ConversationMessage[] = [...conversationHistory, { role: 'user', content: text }];

    try {
      // Get AI response with conversation history
      const response = await fetch('/api/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationHistory: conversationHistory
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Add AI response to conversation history
      const updatedHistory: ConversationMessage[] = [...newHistory, { role: 'assistant', content: data.response }];
      setConversationHistory(updatedHistory);

      // Add AI message to display (will show with typing effect)
      setMessages(prev => [...prev, { text: data.response, isUser: false }]);

      setIsThinking(false);

      // Start typing effect and speaking simultaneously
      startTypingEffect(data.response);
      await speak(data.response);

      // Check if AI signaled to create artifact - generate code after speaking
      if (data.shouldCreate) {
        await generateCode(updatedHistory);
      }

    } catch (error) {
      console.error('Error:', error);
      setIsThinking(false);
      setMood('idle');
    }
  }, [conversationHistory, speak, generateCode, startTypingEffect]);

  // Start live transcription with Web Speech API
  const startLiveTranscription = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.warn('Web Speech API not supported');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'he-IL';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setLiveTranscript(transcript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
    };

    recognition.start();
    recognitionRef.current = recognition;
  }, []);

  // Stop live transcription
  const stopLiveTranscription = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  // Transcribe audio using OpenAI (for accurate final transcription)
  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    try {
      setMood('thinking');
      setIsThinking(true);

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.text) {
        // Use the OpenAI transcription as the final text
        setLiveTranscript(data.text);
        await handleUserInput(data.text);
      } else {
        setIsThinking(false);
        setMood('idle');
        setLiveTranscript('');
      }

    } catch (error) {
      console.error('Transcription error:', error);
      setIsThinking(false);
      setMood('idle');
      setLiveTranscript('');
    }
  }, [handleUserInput]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsListening(true);
      setMood('listening');

      // Start live transcription with Web Speech API
      startLiveTranscription();

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('לא הצלחתי לגשת למיקרופון. אנא אשר גישה למיקרופון.');
    }
  }, [transcribeAudio, startLiveTranscription]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      stopLiveTranscription();
    }
  }, [stopLiveTranscription]);

  // Toggle recording
  const toggleListening = useCallback(() => {
    // Initialize audio on first tap for mobile browsers
    initAudioForMobile();

    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isListening, startRecording, stopRecording, initAudioForMobile]);

  // Reset conversation
  const resetConversation = useCallback(() => {
    setCurrentArtifact(null);
    setMessages([]);
    setConversationHistory([]);
    setMood('idle');
    setLiveTranscript('');
    setIsCreating(false);
    setTypingText('');
    setIsTypingEffect(false);
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }
  }, []);

  const suggestions = [
    ' "אני רוצה משחק"',
    ' "בוא נצייר"',
    ' "ספר לי סיפור"'
  ];

  // Get the displayed text for the last AI message (typing effect)
  const getDisplayedText = (index: number, msg: Message) => {
    if (!msg.isUser && index === messages.length - 1 && isTypingEffect) {
      return typingText;
    }
    return msg.text;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden">
      <FloatingBubbles />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
             יוצרים צעירים
          </h1>
          <p className="text-xl text-white/90">ספר לי מה אתה רוצה ליצור!</p>
        </div>

        {/* Mascot */}
        <div className="flex justify-center mb-6">
          <Mascot mood={mood} />
        </div>

        {/* Status text */}
        <div className="text-center mb-6">
          <p className="text-lg text-white font-medium">
            {isListening && ' מקשיב...'}
            {isThinking && ' חושב...'}
            {isSpeaking && ' מדבר...'}
            {isCreating && ' יוצר...'}
            {!isListening && !isThinking && !isSpeaking && !isCreating && ' לחץ על המיקרופון ודבר!'}
          </p>
        </div>

        {/* Live Transcription */}
        <LiveTranscription text={liveTranscript} isVisible={isListening} />

        {/* Mic Button */}
        <div className="flex justify-center mb-8">
          <MicButton
            isListening={isListening}
            onClick={toggleListening}
            disabled={isThinking || isSpeaking || isCreating}
          />
        </div>

        {/* Suggestions - only show when no messages */}
        {messages.length === 0 && !currentArtifact && (
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-6">
            <p className="text-white text-center mb-3 font-medium">נסה להגיד:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((suggestion, i) => (
                <span
                  key={i}
                  className="bg-white/30 text-white px-4 py-2 rounded-full text-sm"
                >
                  {suggestion}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div className="space-y-4 mb-6">
            {messages.map((msg, i) => (
              <SpeechBubble
                key={i}
                text={msg.text}
                isUser={msg.isUser}
                displayedText={getDisplayedText(i, msg)}
              />
            ))}
            {isThinking && <SpeechBubble text="" isUser={false} isTyping />}
          </div>
        )}

        {/* Creating indicator */}
        {isCreating && <CreatingIndicator />}

        {/* Generated Artifact */}
        <ArtifactDisplay
          code={currentArtifact}
          isVisible={!!currentArtifact}
        />

        {/* Reset button */}
        {(currentArtifact || messages.length > 0) && (
          <div className="flex justify-center mt-6">
            <button
              onClick={resetConversation}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-full font-medium transition-all"
            >
               להתחיל מחדש
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
