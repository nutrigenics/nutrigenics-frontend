"use client"

import logo from '@/assets/logo.svg';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Image as ImageIcon, Sparkles, Loader2, X, StopCircle, Mic, Paperclip, ChefHat, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { RecipeDetailDialog } from '@/components/recipes/RecipeDetailDialog';
import { NutrientTrendChart } from '@/components/analytics/charts/NutrientTrendChart';
import DeficiencyAlert from '@/components/analytics/DeficiencyAlert';
import type { Recipe } from '@/types';
import { toast } from 'sonner';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface RecipeDataShape {
  recipe_id?: number | string;
  recipe_name?: string;
  recipe_time_minutes?: number | string;
  nutrients?: Record<string, number | string>;
  ingredients?: string[];
  instructions?: string[];
  recipe_image?: string | null;
  recipe_nutrient_set?: Array<{
    nutrient?: { name?: string; unit?: string };
    nutrient_name?: string;
    nutrient_quantity?: number | string;
    unit?: string;
  }>;
}

interface AssistantComponent {
  type: string;
  props: {
    data?: unknown;
    title?: string;
    type?: string;
    chart_type?: string;
    targets?: Record<string, number>;
    nutrients?: unknown;
    recipes?: RecipeDataShape[];
    label?: string;
    value?: string | number;
    [key: string]: unknown;
  };
}

interface MessageMetadata {
  image?: string;
  request_id?: string;
  mode?: string;
  recipes_found?: number;
  recipes?: RecipeDataShape[];
  visualization?: unknown;
  components?: AssistantComponent[];
  pending_components?: boolean;
  [key: string]: unknown;
}

interface ChatSocketMessage {
  type: 'response' | 'component_update' | 'stream_chunk' | 'status' | 'error' | 'connection';
  session_id?: string;
  request_id?: string;
  message?: string;
  chunk?: string;
  mode?: string;
  recipes_found?: number;
  recipes?: RecipeDataShape[];
  visualization?: unknown;
  components?: AssistantComponent[];
  pending_components?: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'image' | 'voice';
  timestamp: Date;
  metadata?: MessageMetadata;
  isStreaming?: boolean;
}

const SKELETON_BAR_HEIGHTS = ['26%', '38%', '54%', '33%', '62%', '48%', '29%'] as const;
const DEFAULT_NUTRIENT_TARGETS = { calories: 2000, protein: 150, carbs: 200, fat: 70 };

const isTrendChartType = (value: unknown): value is 'macro' | 'micro' | 'weight' => {
  return value === 'macro' || value === 'micro' || value === 'weight';
};

const toNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const mapRecipeDataToRecipe = (recipeData: RecipeDataShape): Recipe => ({
  id: toNumber(recipeData.recipe_id),
  name: recipeData.recipe_name || 'Recipe',
  image: recipeData.recipe_image || `/media/recipe_images/${(recipeData.recipe_name || '').replace(/ /g, '_')}_${String(recipeData.recipe_id || '').padStart(7, '0')}.png`,
  time: recipeData.recipe_time_minutes ? `${recipeData.recipe_time_minutes} min` : '15 min',
  calories: toNumber(recipeData.nutrients?.Calories || recipeData.nutrients?.Energy),
  recipe_image: recipeData.recipe_image || `/media/recipe_images/${(recipeData.recipe_name || '').replace(/ /g, '_')}_${String(recipeData.recipe_id || '').padStart(7, '0')}.png`,
  recipe_name: recipeData.recipe_name || 'Recipe',
  recipe_time_minutes: toNumber(recipeData.recipe_time_minutes),
  ingredients: Array.isArray(recipeData.ingredients)
    ? recipeData.ingredients.map((ing) => ({
      ingredient_name: ing,
      quantity: ''
    }))
    : [],
  instructions: Array.isArray(recipeData.instructions) ? recipeData.instructions : [],
  recipe_ingredient_set: Array.isArray(recipeData.ingredients)
    ? recipeData.ingredients.map((ing, index) => ({ id: index + 1, ingredient_name: ing, quantity: '' }))
    : [],
  recipe_nutrient_set: Array.isArray(recipeData.recipe_nutrient_set) && recipeData.recipe_nutrient_set.length > 0
    ? recipeData.recipe_nutrient_set.map((item) => ({
      nutrient: {
        name: item.nutrient?.name || item.nutrient_name || '',
        unit: item.nutrient?.unit || item.unit || ''
      },
      nutrient_quantity: toNumber(item.nutrient_quantity),
      unit: item.unit || item.nutrient?.unit || ''
    }))
    : Object.entries(recipeData.nutrients || {}).map(([name, value]) => ({
      nutrient: { name, unit: name === 'Calories' || name === 'Energy' ? 'kcal' : 'g' },
      nutrient_quantity: toNumber(value),
      unit: name === 'Calories' || name === 'Energy' ? 'kcal' : 'g'
    })),
  description: '',
  difficulty: 'Medium',
  servings: 1,
  rating: 4.5,
  is_bookmarked: false,
  is_liked: false
});

const buildFallbackRecipeComponents = (
  recipes: RecipeDataShape[] | undefined,
  recipesFound: number | undefined
): AssistantComponent[] => {
  if (!Array.isArray(recipes) || recipes.length === 0) {
    return [];
  }

  return [
    {
      type: 'recipe_carousel',
      props: {
        recipes,
      },
    },
    {
      type: 'stat_card',
      props: {
        label: 'Recipes Found',
        value: recipesFound ?? recipes.length,
      },
    },
  ];
};



// WebSocket URL from Environment
const wsEnvBase = import.meta.env.VITE_WEBSOCKET_URL || import.meta.env.VITE_WS_BASE_URL;
const SOCKET_URL = wsEnvBase
  ? (wsEnvBase.endsWith('/ws/chat/') ? wsEnvBase : `${wsEnvBase.replace(/\/$/, '')}/ws/chat/`)
  : 'ws://localhost:8000/ws/chat/';

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  // const [isRecording, setIsRecording] = useState(false); // Removed local state
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showRecipeDialog, setShowRecipeDialog] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamingMessageIdRef = useRef<string | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const sessionIdRef = useRef<string>('');
  const activeRequestIdRef = useRef<string | null>(null);
  const completedRequestIdsRef = useRef<Set<string>>(new Set());

  // Voice Input Hook
  const {
    isListening: isRecording,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: isVoiceSupported,
    setTranscript
  } = useSpeechRecognition();

  // Sync transcript to input value
  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);

  const syncStreamingMessageId = (value: string | null) => {
    streamingMessageIdRef.current = value;
    setStreamingMessageId(value);
  };

  // Handle manual input changes interacting with voice
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    setTranscript(e.target.value);
  };

  // Initialize Session ID
  useEffect(() => {
    if (!sessionIdRef.current) {
      // Retrieve from local storage or generate new
      const stored = localStorage.getItem('chat_session_id');
      if (stored) {
        sessionIdRef.current = stored;
      } else {
        const newId = 'session-' + Date.now();
        sessionIdRef.current = newId;
        localStorage.setItem('chat_session_id', newId);
      }
    }
  }, []);

  // WebSocket Hook
  const { sendMessage, lastJsonMessage, readyState } = useWebSocket(SOCKET_URL, {
    shouldReconnect: () => true,
    reconnectAttempts: 10,
    reconnectInterval: 1000,
    onOpen: () => toast.success('Connected to AI Assistant'),
    onClose: () => console.log("Disconnected"),
    onError: (e) => console.error("WebSocket Error", e),
  });

  const isConnected = readyState === ReadyState.OPEN;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, statusMessage, lastJsonMessage]);

  // Handle Incoming Messages
  useEffect(() => {
    if (lastJsonMessage !== null) {
      const data = lastJsonMessage as ChatSocketMessage;

      // Filter out messages not for this session (if backend broadcasts)
      if (data.session_id && data.session_id !== sessionIdRef.current) return;
      if (data.request_id && activeRequestIdRef.current && data.request_id !== activeRequestIdRef.current) return;

      if (data.type === 'response') {
        if (data.request_id && completedRequestIdsRef.current.has(data.request_id)) {
          return;
        }
        console.log("Received AI Response:", data);
        console.log("Pending Components Flag from Backend:", data.pending_components);

        setIsLoading(false);
        setStatusMessage('');

        const serverComponents = Array.isArray(data.components) ? data.components : [];
        const recipeResults = Array.isArray(data.recipes) ? data.recipes : [];
        console.log("[AIChatPage Debug] Server Components:", serverComponents);
        console.log("[AIChatPage Debug] Recipe Results:", recipeResults);

        const resolvedComponents = serverComponents.length > 0
          ? serverComponents
          : buildFallbackRecipeComponents(recipeResults, data.recipes_found);

        console.log("[AIChatPage Debug] Resolved Components (Final):", resolvedComponents);

        // Final response
        const newMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.message || '',
          timestamp: new Date(),

          metadata: {
            request_id: data.request_id,
            mode: data.mode,
            recipes_found: data.recipes_found,
            recipes: recipeResults,
            visualization: data.visualization, // Legacy support
            components: resolvedComponents,
            pending_components: false
          },
          isStreaming: false
        };
        console.log("Constructed Message Metadata Components:", newMessage.metadata?.components);

        const currentStreamId = streamingMessageIdRef.current;
        console.log(`[AIChatPage Debug] Attempting to update stream ID: ${currentStreamId}`);

        if (currentStreamId) {
          setMessages(prev => {
            const index = prev.findIndex(m => m.id === currentStreamId);
            console.log(`[AIChatPage Debug] Found stream message at index: ${index}`);

            if (index === -1) return prev;

            return prev.map(msg => {
              if (msg.id === currentStreamId) {
                console.log("[AIChatPage Debug] Updating message with components:", resolvedComponents);
                return {
                  ...msg,
                  content: (data.message && data.message.trim().length > 0) ? data.message : msg.content,
                  metadata: {
                    ...msg.metadata,
                    ...newMessage.metadata,
                    components: resolvedComponents, // Explicitly ensure components are set
                    pending_components: false
                  },
                  isStreaming: false
                };
              }
              return msg;
            });
          });
          syncStreamingMessageId(null);
        } else {
          // New message
          setMessages(prev => [
            ...prev.map((msg) => (
              msg.role === 'assistant' && msg.metadata?.pending_components
                ? {
                  ...msg,
                  metadata: {
                    ...msg.metadata,
                    pending_components: false
                  }
                }
                : msg
            )),
            newMessage
          ]);
        }

        if (data.request_id) {
          completedRequestIdsRef.current.add(data.request_id);
          if (completedRequestIdsRef.current.size > 200) {
            completedRequestIdsRef.current.clear();
          }
        }
        if (!data.request_id || data.request_id === activeRequestIdRef.current) {
          activeRequestIdRef.current = null;
        }

      } else if (data.type === 'component_update') {
        console.log("Received Component Update:", data.components);
        // Update the last assistant message with the new components
        setMessages(prev => {
          const newMessages = [...prev];
          // Find the last message from assistant to attach components to
          // We search backwards from the end
          for (let i = newMessages.length - 1; i >= 0; i--) {
            if (newMessages[i].role === 'assistant') {
              newMessages[i] = {
                ...newMessages[i],
                metadata: {
                  ...newMessages[i].metadata,
                  components: data.components,
                  pending_components: false // Clear the loading flag
                }
              };
              break; // Only update the most recent one
            }
          }
          return newMessages;
        });

      } else if (data.type === 'stream_chunk') {
        if (data.request_id && completedRequestIdsRef.current.has(data.request_id)) {
          return;
        }
        setIsLoading(false);
        setStatusMessage('');

        setMessages(prev => {
          const existingStreamingMsg = prev.find(msg => msg.id === streamingMessageIdRef.current);

          if (existingStreamingMsg) {
            return prev.map(msg =>
              msg.id === streamingMessageIdRef.current
                ? { ...msg, content: msg.content + (data.chunk || '') } // Only update content, preserve metadata
                : msg
            );
          } else {
            const newId = 'streaming-' + Date.now();
            syncStreamingMessageId(newId);
            return [...prev, {
              id: newId,
              role: 'assistant',
              content: data.chunk || '',
              timestamp: new Date(),
              isStreaming: true,
              metadata: {
                request_id: data.request_id,
                pending_components: false
              }
            }];
          }
        });

      } else if (data.type === 'status') {
        setIsLoading(true);
        setStatusMessage(data.message || '');
      } else if (data.type === 'error') {
        toast.error(data.message || 'Something went wrong while processing your request.');
        syncStreamingMessageId(null);
        setIsLoading(false);
        if (!data.request_id || data.request_id === activeRequestIdRef.current) {
          activeRequestIdRef.current = null;
        }
      } else if (data.type === 'connection') {
        // Initial connection message
        console.log("Server welcomed:", data.message);
      }
    }
  }, [lastJsonMessage]);


  // Textarea auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !selectedImage) || !isConnected || isLoading) return;

    stopListening(); // Stop recording if active
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    activeRequestIdRef.current = requestId;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
      type: selectedImage ? 'image' : 'text',
      // Include image in local message for display
      metadata: {
        request_id: requestId,
        ...(selectedImage ? { image: selectedImage } : {})
      }
    };

    setHasStarted(true);
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);
    setStatusMessage('Thinking...');

    const payload = {
      text: inputValue,
      image: selectedImage || '',
      session_id: sessionIdRef.current,
      request_id: requestId,
    };

    sendMessage(JSON.stringify(payload));

    setInputValue('');
    resetTranscript(); // Reset voice transcript
    setSelectedImage(null);
    syncStreamingMessageId(null); // Reset streaming state for new message
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  const toggleRecording = () => {
    if (!isVoiceSupported) {
      toast.error("Voice input is not supported in this browser.");
      return;
    }

    if (isRecording) {
      stopListening();
    } else {
      setTranscript(inputValue); // Sync current input to transcript before starting
      startListening();
    }
  };

  // Client-side image compression
  const compressImage = (base64Str: string, maxWidth = 1024, maxHeight = 1024): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with 0.7 quality
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        try {
          const compressed = await compressImage(result);
          setSelectedImage(compressed);
          toast.success('Image attached');
        } catch (error) {
          console.error("Compression error", error);
          toast.error("Failed to process image");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const sampleQueries = [
    { icon: <ChefHat className="w-4 h-4" />, text: "Suggest a high-protein breakfast" },
    { icon: <ImageIcon className="w-4 h-4" />, text: "Analyze this meal photo" },
    { icon: <Sparkles className="w-4 h-4" />, text: "Plan meals for tomorrow" },
    { icon: <Bot className="w-4 h-4" />, text: "Explain my macro goals" },
  ];

  const handleSampleClick = (text: string) => {
    setInputValue(text);
  }
  // =====================================================
  // INPUT BOX COMPONENT - Shared between both views
  // =====================================================
  const renderInputBox = () => (
    <div className={cn(
      "w-full relative bg-card rounded-xl border shadow-premium overflow-hidden flex flex-col ring-2 ring-offset-4",
      isRecording ? "ring-destructive border-destructive/50" : "border-border ring-border focus-within:border-primary focus-within:ring-primary/50 focus-within:shadow-premium-lg"
    )}>
      {/* Image Preview Area */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pt-4 pb-2 border-b border-border/50 bg-muted/20"
          >
            <div className="relative inline-flex items-center gap-3 bg-background border border-border rounded-xl p-2 pr-4">
              <img src={selectedImage} alt="Preview" className="h-12 w-12 object-cover rounded-lg bg-muted" />
              <div className="flex flex-col">
                <span className="text-xs font-medium">Image attached</span>
                <span className="text-xs text-muted-foreground">Ready to analyze</span>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="ml-2 p-1 hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interim Transcript Overlay */}
      <AnimatePresence>
        {isRecording && interimTranscript && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pt-2 text-sm text-muted-foreground/80 italic"
          >
            {interimTranscript}...
          </motion.div>
        )}
      </AnimatePresence>

      <Textarea
        ref={textareaRef}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onPaste={(e) => {
          const items = e.clipboardData.items;
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
              const blob = items[i].getAsFile();
              if (blob) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                  const result = e.target?.result as string;
                  try {
                    const compressed = await compressImage(result);
                    setSelectedImage(compressed);
                    toast.success('Image pasted from clipboard');
                  } catch (error) {
                    console.error("Paste compression error", error);
                    toast.error("Failed to process paste");
                  }
                };
                reader.readAsDataURL(blob);
                e.preventDefault();
              }
            }
          }
        }}
        placeholder={isRecording ? "Listening..." : "Ask anything or paste an image..."}
        className="w-full min-h-[60px] max-h-[200px] border-none shadow-none resize-none px-4 py-4 text-base bg-transparent focus-visible:ring-0"
        rows={1}
      />

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="sr-only"
        onChange={handleFileSelect}
      />

      {/* Bottom Actions Row */}
      <div className="flex justify-between items-center px-2 pb-2">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleRecording}
            className={cn(
              "h-9 w-9 rounded-full transition-all duration-300",
              isRecording
                ? "text-destructive bg-destructive/10 hover:bg-destructive/20 animate-pulse scale-110"
                : "text-muted-foreground hover:text-primary hover:bg-primary/10"
            )}
            title={isRecording ? "Stop recording" : "Voice input"}
            aria-label={isRecording ? "Stop voice recording" : "Start voice recording"}
          >
            {isRecording ? <StopCircle className="w-5 h-5 fill-destructive/20" /> : <Mic className="w-5 h-5" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-3 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 gap-2 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              fileInputRef.current?.click();
            }}
          >
            <Paperclip className="w-4 h-4" />
            <span className="text-xs font-medium">Upload Image</span>
          </Button>
        </div>

        <Button
          size="icon"
          onClick={handleSendMessage}
          disabled={(!inputValue.trim() && !selectedImage) || !isConnected || isLoading}
          aria-label="Send chat message"
          className={cn(
            "h-9 w-9 rounded-full transition-all duration-200",
            (inputValue.trim() || selectedImage) && isConnected ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transform hover:scale-105" : "bg-muted text-muted-foreground"
          )}
        >
          <Send className="w-4 h-4 ml-0.5" />
        </Button>
      </div>
    </div>
  );

  // =====================================================
  // WELCOME VIEW - Centered layout before first query
  // =====================================================
  if (!hasStarted) {
    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">


        {/* Centered Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4">
          <div className="w-full max-w-3xl mx-auto">
            {/* Logo & Heading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-6 mb-10 text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center shadow-sm border border-primary/10">
                <img src={logo} alt="Nutrigenics" className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">How can I help you thrive today?</h1>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">Ask about your meal plan, analyze a photo, or get nutrition advice.</p>
              </div>
            </motion.div>

            {/* Input Box */}
            {renderInputBox()}

            {!isConnected && (
              <div className="text-center mt-2">
                <span className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded-full">Server disconnected</span>
              </div>
            )}

            {/* Sample Queries */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full max-w-2xl mx-auto"
            >
              {sampleQueries.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSampleClick(q.text)}
                  className="flex items-center gap-3 p-4 text-left bg-card border border-border hover:border-primary/70 hover:bg-emerald-50 hover:shadow-md rounded-lg transition-all duration-200 group cursor-pointer"
                >
                  <div className="p-2 bg-muted text-muted-foreground rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {q.icon}
                  </div>
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">{q.text}</span>
                </button>
              ))}
            </motion.div>

            <p className="text-center text-xs text-muted-foreground mt-6">
              AI can make mistakes. Verify important info.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // CHAT VIEW - Messages + bottom-fixed input
  // =====================================================
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">


      {/* Messages Area - Takes remaining space */}
      <div className="relative z-10 flex-1 overflow-y-auto min-h-0">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex flex-col gap-6">
            {messages.map((msg) => {
              console.log(`[AIChatPage Render] Msg ${msg.id} Role: ${msg.role}, Components:`, msg.metadata?.components?.length);
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id}
                  className={cn(
                    "flex gap-4 max-w-[90%]",
                    msg.role === 'user' ? "self-end flex-row-reverse" : "self-start"
                  )}
                >
                  {/* Icons removed per user request */}

                  <div className={cn(
                    "group relative p-6 rounded-3xl text-sm md:text-base leading-relaxed shadow-sm max-w-full",
                    msg.role === 'assistant'
                      ? "bg-card border border-border text-card-foreground"
                      : "bg-primary text-primary-foreground"
                  )}>
                    {/* ... (rest of message content) ... */}

                    {msg.type === 'image' && (
                      <div className="mb-2">
                        {msg.metadata?.image ? (
                          <img
                            src={msg.metadata.image}
                            alt="User Upload"
                            className="max-w-[200px] max-h-[200px] object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          />
                        ) : (
                          <div className="flex items-center gap-2 text-inherit/80">
                            <ImageIcon className="w-4 h-4" />
                            <span className="text-sm">Analyzing image...</span>
                          </div>
                        )}
                      </div>
                    )}

                    {msg.role === 'assistant' && msg.id === streamingMessageId && isLoading && !msg.content ? (
                      <div className="flex items-center gap-2">
                        <motion.div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.span
                              key={i}
                              className="w-2 h-2 bg-primary/60 rounded-full"
                              animate={{ y: [0, -6, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                            />
                          ))}
                        </motion.div>
                        {statusMessage && (
                          <span className="text-xs text-muted-foreground ml-2 flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3" />
                            {statusMessage}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:mb-2 prose-li:my-0.5">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ children }) => <h3 className="text-lg font-bold mt-4 mb-2">{children}</h3>,
                            h2: ({ children }) => <h4 className="text-base font-semibold mt-3 mb-1.5">{children}</h4>,
                            h3: ({ children }) => <h5 className="text-sm font-semibold mt-2 mb-1">{children}</h5>,
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
                            li: ({ children }) => <li className="text-sm">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            code: ({ className, children }) => {
                              const isInline = !className;
                              return isInline ? (
                                <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">{children}</code>
                              ) : (
                                <code className={`block p-3 rounded-lg bg-muted font-mono text-xs overflow-x-auto ${className}`}>{children}</code>
                              );
                            },
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-2">{children}</blockquote>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}


                    {msg.metadata?.components?.map((comp, idx: number) => {
                      console.log(`[AIChatPage] Rendering Component ${idx}:`, comp.type, comp.props);
                      switch (comp.type) {
                        case 'trend_chart': {
                          const chartType = isTrendChartType(comp.props.type)
                            ? comp.props.type
                            : isTrendChartType(comp.props.chart_type)
                              ? comp.props.chart_type
                              : 'macro';
                          return (
                            <div key={`${idx}-${msg.timestamp.getTime()}`} className="mt-4 min-h-[400px] h-[450px] w-full block" style={{ width: '100%', height: '450px', minWidth: 0 }}>
                              <NutrientTrendChart
                                data={Array.isArray(comp.props.data) ? comp.props.data : []}
                                days={7}
                                title={comp.props.title || 'Trend'}
                                description="Generated from your history"
                                type={chartType}
                                t={typeof comp.props.targets === 'object' && comp.props.targets !== null ? comp.props.targets : DEFAULT_NUTRIENT_TARGETS}
                              />
                            </div>
                          );
                        }
                        case 'deficiency_alert':
                          return (
                            <div key={idx} className="mt-4 w-full">
                              <DeficiencyAlert
                                nutrients={Array.isArray(comp.props.nutrients) ? comp.props.nutrients as { name: string; data: number[] }[] : []}
                                limits={{}}
                              />
                            </div>
                          );
                        case 'recipe_carousel': {
                          const recipes = comp.props.recipes || [];
                          console.log(`[AIChatPage] Carousel Recipes (${recipes.length}):`, recipes[0]);
                          return (
                            <div key={idx} className="mt-4 -ml-4 -mr-4 md:-ml-0 md:-mr-0">
                              <div className="flex gap-4 overflow-x-auto pb-4 px-4 pt-2 snap-x custom-scrollbar">
                                {recipes.map((recipeData, rIdx) => {
                                  const mappedRecipe = mapRecipeDataToRecipe(recipeData);
                                  console.log(`[AIChatPage] Mapped Recipe ${rIdx}:`, mappedRecipe.id, mappedRecipe.recipe_name);
                                  return (
                                    <div key={rIdx} className="min-w-[280px] w-[280px] snap-center">
                                      <RecipeCard recipe={mappedRecipe} variant="compact" />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }
                        case 'stat_card':
                          // Placeholder for stat card
                          return (
                            <div key={idx} className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/20 flex items-center justify-between">
                              <span className="text-sm font-medium text-muted-foreground">{comp.props.label}</span>
                              <span className="text-xl font-bold text-primary">{comp.props.value}</span>
                            </div>
                          )
                        default:
                          return null;
                      }
                    })}

                    {/* Loading Skeleton for Pending Components */}
                    {(() => {
                      const shouldShowSkeleton = !!msg.metadata?.pending_components && (!msg.metadata?.components || msg.metadata.components.length === 0);
                      if (shouldShowSkeleton) console.log("Can see skeleton for message", msg.id);
                      return shouldShowSkeleton ? (
                        <div className="mt-4 w-full bg-card rounded-xl border border-border p-6 space-y-4" style={{ height: '450px', minHeight: '450px' }}>
                          <div className="flex items-center justify-between">
                            <div className="h-6 w-32 bg-muted/40 rounded animate-pulse" />
                            <div className="h-4 w-24 bg-muted/30 rounded animate-pulse" />
                          </div>
                          <div className="h-[350px] w-full bg-muted/10 rounded-lg animate-pulse flex items-end justify-between p-4 gap-2">
                            {SKELETON_BAR_HEIGHTS.map((height, i) => (
                              <div key={i} className="w-full bg-muted/30 rounded-t-sm" style={{ height }} />
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()}

                    {/* Fallback for Legacy Metadata (Backward Compatibility) */}
                    {!msg.metadata?.components && msg.metadata?.recipes && msg.metadata.recipes.length > 0 && (
                      <div className="mt-4 -ml-4 -mr-4 md:-ml-0 md:-mr-0">
                        <div className="flex gap-4 overflow-x-auto pb-4 px-4 pt-2 snap-x custom-scrollbar">
                          {(msg.metadata.recipes || []).map((recipeData, idx) => {
                            const mappedRecipe = mapRecipeDataToRecipe(recipeData);

                            return (
                              <div key={idx} className="min-w-[280px] w-[280px] snap-center">
                                <RecipeCard
                                  recipe={mappedRecipe}
                                  variant="compact"
                                  onClick={() => {
                                    console.log("Opening recipe:", mappedRecipe);
                                    setSelectedRecipe(mappedRecipe);
                                    setShowRecipeDialog(true);
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Standalone Thinking Indicator (Before Stream Starts) */}
            {isLoading && !streamingMessageId && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="self-start max-w-[90%]"
              >
                <div className="bg-card border border-border text-card-foreground p-5 rounded-3xl shadow-sm space-y-3 min-w-[200px]">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm font-medium text-foreground">Processing Process</span>
                  </div>
                  {/* Simulated Steps for Engagement */}
                  <div className="space-y-2 pl-8">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Analyzing query intent...</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse delay-75">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Fetching health data...</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse delay-150">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Generating insights...</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} className="h-1" />
          </div>
        </div>
      </div>
      {/* Input Area - Fixed at absolute bottom */}
      <div className="relative z-10 shrink-0 border-t border-border/40 bg-background/95 backdrop-blur-sm">
        <RecipeDetailDialog
          recipe={selectedRecipe}
          open={showRecipeDialog}
          onOpenChange={setShowRecipeDialog}
        />
        <div className="max-w-3xl mx-auto px-4 py-4">
          {renderInputBox()}

          {!isConnected && (
            <div className="text-center mt-2">
              <span className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded-full">Server disconnected</span>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground mt-3">
            AI can make mistakes. Verify important info.
          </p>
        </div>
      </div>
    </div>
  );
}
