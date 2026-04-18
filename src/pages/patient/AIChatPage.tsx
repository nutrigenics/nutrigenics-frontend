"use client"

import logo from '@/assets/logo.svg';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowRight, Image as ImageIcon, Sparkles, Loader2, X, StopCircle, Mic, Paperclip, ChefHat, Bot, Camera, CheckCircle2, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { RecipeDetailDialog } from '@/components/recipes/RecipeDetailDialog';
import { NutrientTrendChart } from '@/components/analytics/charts/NutrientTrendChart';
import DeficiencyAlert from '@/components/analytics/DeficiencyAlert';
import type { Recipe } from '@/types';
import type { NutrientTargets } from '@/utils/nutrition';
import { toast } from 'sonner';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import apiClient from '@/services/api.client';
import { authService } from '@/services/auth.service';

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
    targets?: Partial<NutrientTargets>;
    nutrients?: unknown;
    recipes?: RecipeDataShape[];
    label?: string;
    value?: string | number;
    [key: string]: unknown;
  };
}

interface ChatBlock {
  type: string;
  props: {
    markdown?: string;
    data?: unknown;
    title?: string;
    type?: string;
    chart_type?: string;
    targets?: Partial<NutrientTargets>;
    nutrients?: unknown;
    recipes?: RecipeDataShape[];
    label?: string;
    value?: string | number;
    description?: string;
    images?: Array<{
      url?: string;
      alt?: string;
      caption?: string;
    }>;
    items?: Array<{
      label?: string;
      value?: string | number;
    }>;
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
  blocks?: ChatBlock[];
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
  blocks?: ChatBlock[];
  components?: AssistantComponent[];
  pending_components?: boolean;
}

interface ChatHttpResponse {
  type: 'response' | 'error';
  session_id?: string;
  request_id?: string;
  message?: string;
  mode?: string;
  success?: boolean;
  recipes_found?: number;
  recipes?: RecipeDataShape[];
  blocks?: ChatBlock[];
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
const DEFAULT_NUTRIENT_TARGETS: NutrientTargets = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 70,
  fiber: 25,
  sugar: 50,
  sodium: 2300,
  cholesterol: 300,
  saturated_fat: 20,
  unsaturated_fat: 50,
  trans_fat: 2,
};

const normalizeNutrientTargets = (targets?: Partial<NutrientTargets> | null): NutrientTargets => ({
  ...DEFAULT_NUTRIENT_TARGETS,
  ...(targets || {}),
});

const LOADING_STEPS = [
  { label: 'Reading your question', matchers: ['thinking', 'query', 'intent'] },
  { label: 'Checking your nutrition data', matchers: ['data', 'history', 'fetch', 'record'] },
  { label: 'Preparing your response', matchers: ['response', 'generate', 'insight', 'write'] },
] as const;

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

const resolveRecipeImageUrl = (recipeData: RecipeDataShape): string => {
  const recipeImage = recipeData.recipe_image;
  if (typeof recipeImage === 'string' && recipeImage.length > 0) {
    if (recipeImage.startsWith('http')) {
      return recipeImage;
    }
    if (recipeImage.startsWith('/')) {
      return `${API_BASE_URL}${recipeImage}`;
    }
    return `${API_BASE_URL}/media/${recipeImage}`;
  }

  return `/media/recipe_images/${(recipeData.recipe_name || '').replace(/ /g, '_')}_${String(recipeData.recipe_id || '').padStart(7, '0')}.png`;
};

const resolveMediaUrl = (value: string | undefined): string => {
  if (!value) {
    return '/illustrations/recipe-placeholder.png';
  }
  if (value.startsWith('http')) {
    return value;
  }
  if (value.startsWith('/')) {
    return `${API_BASE_URL}${value}`;
  }
  return `${API_BASE_URL}/media/${value}`;
};

const mapRecipeDataToRecipe = (recipeData: RecipeDataShape): Recipe => ({
  id: toNumber(recipeData.recipe_id),
  name: recipeData.recipe_name || 'Recipe',
  image: resolveRecipeImageUrl(recipeData),
  time: recipeData.recipe_time_minutes ? `${recipeData.recipe_time_minutes} min` : '15 min',
  calories: toNumber(recipeData.nutrients?.Calories || recipeData.nutrients?.Energy),
  recipe_image: recipeData.recipe_image || resolveRecipeImageUrl(recipeData),
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

const buildNutritionFactItems = (recipeData: RecipeDataShape | undefined): Array<{ label: string; value: string }> => {
  if (!recipeData || !recipeData.nutrients) {
    return [];
  }

  const orderedKeys = ['Calories', 'Energy', 'Protein', 'Carbohydrates', 'Fat', 'Fiber', 'Sugar', 'Sodium'];
  const units: Record<string, string> = {
    Calories: 'kcal',
    Energy: 'kcal',
    Protein: 'g',
    Carbohydrates: 'g',
    Fat: 'g',
    Fiber: 'g',
    Sugar: 'g',
    Sodium: 'mg',
  };

  return orderedKeys
    .filter((key) => recipeData.nutrients && recipeData.nutrients[key] != null)
    .slice(0, 6)
    .map((key) => {
      const value = recipeData.nutrients?.[key];
      const displayValue = typeof value === 'number' ? value.toFixed(1).replace(/\.0$/, '') : String(value);
      return {
        label: key === 'Energy' ? 'Calories' : key,
        value: `${displayValue} ${units[key] || ''}`.trim(),
      };
    });
};

const buildFallbackChatBlocks = (
  message: string,
  recipes: RecipeDataShape[] | undefined,
  recipesFound: number | undefined
): ChatBlock[] => {
  const blocks: ChatBlock[] = [];

  if (message.trim()) {
    blocks.push({
      type: 'text',
      props: {
        markdown: message,
      },
    });
  }

  if (!Array.isArray(recipes) || recipes.length === 0) {
    return blocks;
  }

  blocks.push({
    type: 'stat_card',
    props: {
      label: 'Recipes Found',
      value: recipesFound ?? recipes.length,
    },
  });

  const nutritionItems = buildNutritionFactItems(recipes[0]);
  if (nutritionItems.length > 0) {
    blocks.push({
      type: 'nutrition_facts',
      props: {
        title: `Nutrition snapshot for ${recipes[0].recipe_name || 'top match'}`,
        items: nutritionItems,
      },
    });
  }

  blocks.push({
    type: 'recipe_carousel',
    props: {
      recipes,
    },
  });

  return blocks;
};

const pruneRedundantRecipeVisuals = (blocks: ChatBlock[]): ChatBlock[] => {
  const hasRecipeCarousel = blocks.some((block) => block.type === 'recipe_carousel');

  if (!hasRecipeCarousel) {
    return blocks;
  }

  return blocks.filter((block) => block.type !== 'image_strip');
};

const buildLegacyBlocks = (
  content: string,
  blocks: ChatBlock[] | undefined,
  components: AssistantComponent[] | undefined,
  recipes: RecipeDataShape[] | undefined,
  recipesFound: number | undefined
): ChatBlock[] => {
  if (Array.isArray(blocks) && blocks.length > 0) {
    return pruneRedundantRecipeVisuals(blocks);
  }

  const normalizedBlocks: ChatBlock[] = [];
  if (content.trim()) {
    normalizedBlocks.push({
      type: 'text',
      props: {
        markdown: content,
      },
    });
  }

  if (Array.isArray(components) && components.length > 0) {
    normalizedBlocks.push(...components.map((component) => ({
      type: component.type,
      props: component.props,
    })));
    return pruneRedundantRecipeVisuals(normalizedBlocks);
  }

  return pruneRedundantRecipeVisuals(buildFallbackChatBlocks(content, recipes, recipesFound));
};



// WebSocket URL from Environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const wsEnvBase = import.meta.env.VITE_WEBSOCKET_URL || import.meta.env.VITE_WS_BASE_URL;
const derivedWsBase = API_BASE_URL
  ? API_BASE_URL.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')
  : '';
const SOCKET_URL = (wsEnvBase || derivedWsBase).endsWith('/ws/chat/')
  ? (wsEnvBase || derivedWsBase)
  : `${(wsEnvBase || derivedWsBase).replace(/\/$/, '')}/ws/chat/`;

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  // const [isRecording, setIsRecording] = useState(false); // Removed local state
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [loadingStartedAt, setLoadingStartedAt] = useState<number | null>(null);
  const [, setLoadingTick] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showRecipeDialog, setShowRecipeDialog] = useState(false);
  const [useHttpFallback, setUseHttpFallback] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const sessionIdRef = useRef<string>('');
  const activeRequestIdRef = useRef<string | null>(null);
  const completedRequestIdsRef = useRef<Set<string>>(new Set());
  const useHttpFallbackRef = useRef(false);
  const hasConnectedOnceRef = useRef(false);
  const fallbackAnnouncedRef = useRef(false);

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

  useEffect(() => {
    if (!isLoading) {
      setLoadingStartedAt(null);
      return;
    }

    setLoadingStartedAt((previous) => previous ?? Date.now());
    const intervalId = window.setInterval(() => {
      setLoadingTick((value) => value + 1);
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [isLoading]);

  const syncStreamingMessageId = (value: string | null) => {
    streamingMessageIdRef.current = value;
    setStreamingMessageId(value);
  };

  const enableHttpFallback = () => {
    if (useHttpFallbackRef.current) {
      return;
    }

    useHttpFallbackRef.current = true;
    setUseHttpFallback(true);
    syncStreamingMessageId(null);
    setIsLoading(false);
    setStatusMessage('');

    if (!fallbackAnnouncedRef.current) {
      fallbackAnnouncedRef.current = true;
      toast.error('Realtime chat unavailable. Using standard mode.');
    }
  };

  // Handle manual input changes interacting with voice
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    setTranscript(e.target.value);
  };

  const stopCameraStream = () => {
    const stream = cameraStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const closeCameraDialog = () => {
    stopCameraStream();
    setIsCameraOpen(false);
    setIsCameraLoading(false);
    setCameraError(null);
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

  useEffect(() => {
    if (!isCameraOpen || !cameraStreamRef.current || !videoRef.current) {
      return;
    }

    const videoElement = videoRef.current;
    videoElement.srcObject = cameraStreamRef.current;
    void videoElement.play().catch((error) => {
      console.error("Camera preview failed", error);
      setCameraError('Unable to start the live camera preview.');
    });
  }, [isCameraOpen, isCameraLoading]);

  useEffect(() => {
    return () => {
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const socketToken = authService.getAccessToken();

  // WebSocket Hook
  const { sendMessage, lastJsonMessage, readyState } = useWebSocket(SOCKET_URL, {
    queryParams: socketToken ? { token: socketToken } : undefined,
    shouldReconnect: () => !useHttpFallbackRef.current,
    reconnectAttempts: 10,
    reconnectInterval: 1000,
    onOpen: () => {
      hasConnectedOnceRef.current = true;
      toast.success('Connected to AI Assistant');
    },
    onClose: (event) => {
      console.log("Disconnected", event);
      if (!hasConnectedOnceRef.current) {
        enableHttpFallback();
      }
    },
    onError: (e) => {
      console.error("WebSocket Error", e);
      if (!hasConnectedOnceRef.current) {
        enableHttpFallback();
      }
    },
  });

  const isConnected = readyState === ReadyState.OPEN;
  const canSendMessages = (!!inputValue.trim() || !!selectedImage) && !isLoading && (isConnected || useHttpFallback);

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
        setIsLoading(false);
        setStatusMessage('');

        const serverComponents = Array.isArray(data.components) ? data.components : [];
        const serverBlocks = Array.isArray(data.blocks) ? data.blocks : [];
        const recipeResults = Array.isArray(data.recipes) ? data.recipes : [];

        const resolvedComponents = serverComponents.length > 0
          ? serverComponents
          : buildFallbackRecipeComponents(recipeResults, data.recipes_found);
        const resolvedBlocks = serverBlocks.length > 0
          ? serverBlocks
          : buildFallbackChatBlocks(data.message || '', recipeResults, data.recipes_found);

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
            blocks: resolvedBlocks,
            components: resolvedComponents,
            pending_components: false
          },
          isStreaming: false
        };

        const currentStreamId = streamingMessageIdRef.current;

        if (currentStreamId) {
          setMessages(prev => {
            const index = prev.findIndex(m => m.id === currentStreamId);

            if (index === -1) return prev;

            return prev.map(msg => {
              if (msg.id === currentStreamId) {
                return {
                  ...msg,
                  content: (data.message && data.message.trim().length > 0) ? data.message : msg.content,
                  metadata: {
                    ...msg.metadata,
                    ...newMessage.metadata,
                    blocks: resolvedBlocks,
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
                  blocks: Array.isArray(data.blocks) ? data.blocks : newMessages[i].metadata?.blocks,
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
    if ((!inputValue.trim() && !selectedImage) || isLoading || (!isConnected && !useHttpFallback)) return;

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

    if (useHttpFallback) {
      try {
        const response = await apiClient.post<ChatHttpResponse>('/api/v1/chat/query/', payload);
        const data = response.data;
        const recipeResults = Array.isArray(data.recipes) ? data.recipes : [];
        const serverComponents = Array.isArray(data.components) ? data.components : [];
        const serverBlocks = Array.isArray(data.blocks) ? data.blocks : [];
        const resolvedComponents = serverComponents.length > 0
          ? serverComponents
          : buildFallbackRecipeComponents(recipeResults, data.recipes_found);
        const resolvedBlocks = serverBlocks.length > 0
          ? serverBlocks
          : buildFallbackChatBlocks(data.message || '', recipeResults, data.recipes_found);

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
          {
            id: `${Date.now()}-assistant`,
            role: 'assistant',
            content: data.message || '',
            timestamp: new Date(),
            metadata: {
              request_id: data.request_id,
              mode: data.mode,
              recipes_found: data.recipes_found,
              recipes: recipeResults,
              blocks: resolvedBlocks,
              components: resolvedComponents,
              pending_components: false,
            },
            isStreaming: false,
          }
        ]);

        if (data.request_id) {
          completedRequestIdsRef.current.add(data.request_id);
          if (completedRequestIdsRef.current.size > 200) {
            completedRequestIdsRef.current.clear();
          }
        }
      } catch (error) {
        console.error("HTTP chat fallback failed", error);
        toast.error('Something went wrong while processing your request.');
      } finally {
        setIsLoading(false);
        setStatusMessage('');
        activeRequestIdRef.current = null;
      }
    } else {
      sendMessage(JSON.stringify(payload));
    }

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

    e.target.value = '';
  };

  const openCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Camera capture is not supported in this browser.');
      return;
    }

    setCameraError(null);
    setIsCameraLoading(true);

    try {
      stopCameraStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      setIsCameraOpen(true);
    } catch (error) {
      console.error("Camera access failed", error);
      setCameraError('Camera access was blocked or unavailable. Check browser permissions and try again.');
      toast.error('Unable to access the camera.');
      setIsCameraOpen(true);
    } finally {
      setIsCameraLoading(false);
    }
  };

  const capturePhoto = async () => {
    const videoElement = videoRef.current;
    if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      toast.error('Camera is still starting. Try again in a moment.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      toast.error('Failed to capture the photo.');
      return;
    }

    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    try {
      const compressed = await compressImage(canvas.toDataURL('image/jpeg', 0.9));
      setSelectedImage(compressed);
      closeCameraDialog();
      toast.success('Photo captured');
    } catch (error) {
      console.error("Camera capture compression error", error);
      toast.error('Failed to process the captured photo.');
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

  const renderCameraDialog = () => (
    <Dialog
      open={isCameraOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeCameraDialog();
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden gap-0">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle>Capture Recipe Photo</DialogTitle>
          <DialogDescription>
            Take a clear photo of your meal or recipe and send it to the AI assistant for estimated nutrition and ingredient insights.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-slate-950 aspect-[4/3]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                "h-full w-full object-cover",
                (isCameraLoading || !!cameraError) && "opacity-0"
              )}
            />

            {isCameraLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/85 text-white">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-sm font-medium">Starting camera...</p>
              </div>
            )}

            {!isCameraLoading && cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/90 px-6 text-center text-white">
                <Camera className="h-8 w-8 text-white/80" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Camera unavailable</p>
                  <p className="text-sm text-white/75">{cameraError}</p>
                </div>
                <Button variant="secondary" onClick={() => { void openCamera(); }}>
                  Retry camera
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={closeCameraDialog}>
              Cancel
            </Button>
            <Button
              onClick={capturePhoto}
              disabled={isCameraLoading || !!cameraError}
              className="gap-2"
            >
              <Camera className="h-4 w-4" />
              Capture photo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const renderMarkdown = (markdown: string, tone: 'assistant' | 'user' = 'assistant') => (
    <div className={cn(
      "prose prose-sm max-w-none prose-p:my-1 prose-headings:mb-2 prose-li:my-0.5",
      tone === 'assistant'
        ? "text-foreground prose-headings:text-foreground prose-p:text-foreground/90 prose-li:text-foreground/85 prose-strong:text-foreground prose-code:text-foreground"
        : "prose-invert text-white prose-headings:text-white prose-p:text-white/95 prose-li:text-white/90 prose-strong:text-white prose-code:text-white"
    )}>
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
              <code className={cn(
                "px-1.5 py-0.5 rounded font-mono text-xs",
                tone === 'assistant' ? "bg-muted text-foreground" : "bg-white/12 text-white"
              )}>{children}</code>
            ) : (
              <code className={cn(
                "block p-3 rounded-lg font-mono text-xs overflow-x-auto",
                tone === 'assistant' ? "bg-muted text-foreground" : "bg-black/20 text-white",
                className
              )}>{children}</code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className={cn(
              "border-l-4 pl-4 italic my-2",
              tone === 'assistant' ? "border-primary/30 text-muted-foreground" : "border-white/25 text-white/80"
            )}>{children}</blockquote>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );

  const renderChatBlock = (block: ChatBlock, idx: number, messageTimestamp: number) => {
    switch (block.type) {
      case 'text':
        return (
          <div key={`${block.type}-${idx}-${messageTimestamp}`}>
            {renderMarkdown(String(block.props.markdown || ''))}
          </div>
        );
      case 'trend_chart': {
        const chartType = isTrendChartType(block.props.type)
          ? block.props.type
          : isTrendChartType(block.props.chart_type)
            ? block.props.chart_type
            : 'macro';
        return (
          <div
            key={`${block.type}-${idx}-${messageTimestamp}`}
            className="mt-4 overflow-hidden rounded-[16px] border border-border/70 bg-background/95 p-2 shadow-[0_16px_32px_-26px_rgba(15,23,42,0.18)]"
          >
            <NutrientTrendChart
              data={Array.isArray(block.props.data) ? block.props.data : []}
              days={7}
              title={block.props.title || 'Trend'}
              description={block.props.description || 'Generated from your history'}
              type={chartType}
              className="h-full border-0 bg-transparent shadow-none"
              t={normalizeNutrientTargets(
                typeof block.props.targets === 'object' && block.props.targets !== null
                  ? block.props.targets as Partial<NutrientTargets>
                  : undefined
              )}
            />
          </div>
        );
      }
      case 'deficiency_alert':
        return (
          <div
            key={`${block.type}-${idx}-${messageTimestamp}`}
            className="mt-4 overflow-hidden rounded-[16px] border border-border/70 bg-background/95 p-1 shadow-[0_16px_32px_-26px_rgba(15,23,42,0.18)]"
          >
            <DeficiencyAlert
              nutrients={Array.isArray(block.props.nutrients) ? block.props.nutrients as { name: string; data: number[] }[] : []}
              limits={typeof block.props.limits === 'object' && block.props.limits !== null ? block.props.limits as Record<string, { daily?: number; unit?: string }> : {}}
            />
          </div>
        );
      case 'recipe_carousel': {
        const recipes = Array.isArray(block.props.recipes) ? block.props.recipes : [];
        return (
          <div
            key={`${block.type}-${idx}-${messageTimestamp}`}
            className="mt-4 overflow-hidden rounded-[16px] border border-border/70 bg-background/95 py-3 shadow-[0_16px_32px_-26px_rgba(15,23,42,0.18)]"
          >
            <div className="flex gap-4 overflow-x-auto pb-3 px-4 pt-1 snap-x custom-scrollbar">
              {recipes.map((recipeData, rIdx) => {
                const mappedRecipe = mapRecipeDataToRecipe(recipeData);
                const calories = toNumber(recipeData.nutrients?.Calories || recipeData.nutrients?.Energy);
                return (
                  <div
                    key={`${mappedRecipe.id}-${rIdx}`}
                    className="min-w-[220px] w-[220px] snap-center cursor-pointer overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm transition-all hover:border-primary/20 hover:shadow-md"
                    onClick={() => {
                      setSelectedRecipe(mappedRecipe);
                      setShowRecipeDialog(true);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedRecipe(mappedRecipe);
                        setShowRecipeDialog(true);
                      }
                    }}
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                      <img
                        src={resolveRecipeImageUrl(recipeData)}
                        alt={mappedRecipe.recipe_name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/illustrations/recipe-placeholder.png';
                        }}
                      />
                    </div>
                    <div className="space-y-2 p-3">
                      <h4 className="line-clamp-2 text-sm font-semibold text-foreground">
                        {mappedRecipe.recipe_name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        {mappedRecipe.recipe_time_minutes ? <span>{mappedRecipe.recipe_time_minutes} min</span> : null}
                        {mappedRecipe.recipe_time_minutes && calories > 0 ? <span className="h-1 w-1 rounded-full bg-border" /> : null}
                        {calories > 0 ? <span>{calories.toFixed(0)} kcal</span> : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
      case 'stat_card':
        return (
          <div
            key={`${block.type}-${idx}-${messageTimestamp}`}
            className="mt-4 overflow-hidden rounded-[14px] border border-primary/15 bg-primary/5 px-4 py-3"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/70">Summary</div>
                <span className="mt-1 block text-sm font-medium text-foreground/75">{block.props.label}</span>
              </div>
              <span className="text-2xl font-semibold tracking-tight text-foreground">{block.props.value}</span>
            </div>
          </div>
        );
      case 'nutrition_facts': {
        const items = Array.isArray(block.props.items) ? block.props.items : [];
        if (items.length === 0) return null;
        return (
          <div
            key={`${block.type}-${idx}-${messageTimestamp}`}
            className="mt-4 rounded-[16px] border border-border/70 bg-background/95 p-4 shadow-[0_16px_32px_-26px_rgba(15,23,42,0.18)]"
          >
            {block.props.title && (
              <h4 className="mb-3 text-sm font-semibold text-foreground">{block.props.title}</h4>
            )}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {items.map((item, itemIdx) => (
                <div
                  key={`${item.label || 'item'}-${itemIdx}`}
                  className="rounded-[12px] border border-border/70 bg-card p-3"
                >
                  <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{item.label}</div>
                  <div className="mt-1 text-sm font-semibold text-foreground">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      case 'image_strip': {
        const images = Array.isArray(block.props.images) ? block.props.images : [];
        if (images.length === 0) return null;
        return (
          <div
            key={`${block.type}-${idx}-${messageTimestamp}`}
            className="mt-4 rounded-[16px] border border-border/70 bg-background/95 p-4 shadow-[0_16px_32px_-26px_rgba(15,23,42,0.18)]"
          >
            {block.props.title && (
              <h4 className="mb-3 text-sm font-semibold text-foreground">{block.props.title}</h4>
            )}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((image, imageIdx) => (
                <div
                  key={`${image.url || 'image'}-${imageIdx}`}
                  className="overflow-hidden rounded-[12px] border border-border/70 bg-card"
                >
                  <div className="aspect-square bg-muted">
                    <img
                      src={resolveMediaUrl(image.url)}
                      alt={image.alt || image.caption || 'Chat visual'}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {(image.caption || image.alt) && (
                    <div className="px-3 py-2 text-xs text-muted-foreground truncate">
                      {image.caption || image.alt}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  const getLoadingStepIndex = () => {
    const normalized = statusMessage.toLowerCase();
    const elapsed = loadingStartedAt ? Date.now() - loadingStartedAt : 0;
    let derivedIndex = 0;

    if (elapsed >= 600) {
      derivedIndex = 1;
    }
    if (elapsed >= 1400) {
      derivedIndex = 2;
    }

    if (!normalized) {
      return derivedIndex;
    }

    const matchedIndex = LOADING_STEPS.findIndex((step) =>
      step.matchers.some((matcher) => normalized.includes(matcher))
    );

    if (matchedIndex >= 0) {
      return Math.max(derivedIndex, matchedIndex);
    }

    return derivedIndex;
  };

  const renderMacLoader = () => (
    <div className="relative h-4 w-4 animate-spin" aria-hidden="true">
      {Array.from({ length: 12 }).map((_, index) => (
        <span
          key={index}
          className="absolute left-1/2 top-1/2 h-[4px] w-[2px] rounded-full bg-primary"
          style={{
            transform: `translate(-50%, -50%) rotate(${index * 30}deg) translateY(-6px)`,
            opacity: 1 - index * 0.07,
          }}
        />
      ))}
    </div>
  );

  const renderLoadingSteps = () => {
    const activeStepIndex = getLoadingStepIndex();

    return (
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/10 bg-primary/5">
          <img src={logo} alt="AI" className="h-4 w-4" />
        </div>
        <div className="rounded-[14px] border border-border/70 bg-card px-4 py-3 shadow-[0_16px_32px_-26px_rgba(15,23,42,0.18)]">
          <div className="space-y-3">
            {LOADING_STEPS.map((step, index) => {
              const isDone = index < activeStepIndex;
              const isActive = index === activeStepIndex;

              return (
                <div key={step.label} className="flex items-center gap-3 text-sm">
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  ) : isActive ? (
                    renderMacLoader()
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                  )}
                  <span className={cn(
                    isDone || isActive ? "text-foreground/85" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // =====================================================
  // INPUT BOX COMPONENT - Shared between both views
  // =====================================================
  const renderInputBox = () => (
    <div className={cn(
      "w-full relative overflow-hidden rounded-[30px] border bg-card/95 shadow-[0_28px_60px_-42px_rgba(15,23,42,0.28)] backdrop-blur-sm flex flex-col",
      isRecording ? "border-destructive/40" : "border-border/70"
    )}>
      {/* Image Preview Area */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pt-4 pb-2"
          >
            <div className="relative inline-flex items-center gap-3 rounded-2xl border border-border/70 bg-background px-3 py-2 pr-4">
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
            className="px-5 pt-1 text-sm text-muted-foreground/80 italic"
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
        className="w-full min-h-[60px] max-h-[200px] !border-0 !shadow-none resize-none px-5 py-4 text-base bg-transparent !outline-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0"
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
      <div className="flex items-center justify-between px-4 pb-4 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleRecording}
            className={cn(
              "h-10 w-10 rounded-full border border-transparent transition-all duration-300",
              isRecording
                ? "text-destructive bg-destructive/10 border-destructive/20 hover:bg-destructive/15 animate-pulse"
                : "text-muted-foreground bg-muted/35 hover:text-primary hover:bg-primary/8"
            )}
            title={isRecording ? "Stop recording" : "Voice input"}
            aria-label={isRecording ? "Stop voice recording" : "Start voice recording"}
          >
            {isRecording ? <StopCircle className="w-5 h-5 fill-destructive/20" /> : <Mic className="w-5 h-5" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 rounded-full border border-border/70 bg-muted/25 px-3 text-muted-foreground hover:text-primary hover:bg-primary/5 gap-2 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              void openCamera();
            }}
          >
            <Camera className="w-4 h-4" />
            <span className="text-xs font-medium">Camera</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 rounded-full border border-border/70 bg-muted/25 px-3 text-muted-foreground hover:text-primary hover:bg-primary/5 gap-2 cursor-pointer"
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
          disabled={!canSendMessages}
          aria-label="Send chat message"
          className={cn(
            "h-11 w-11 rounded-full transition-all duration-200",
            canSendMessages
              ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_14px_28px_-18px_rgba(16,185,129,0.8)]"
              : "bg-muted text-muted-foreground"
          )}
        >
          <ArrowRight className="w-4 h-4" />
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
        {renderCameraDialog()}


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

            {useHttpFallback ? (
              <div className="text-center mt-2">
                <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full">Realtime unavailable, using standard mode</span>
              </div>
            ) : !isConnected ? (
              <div className="text-center mt-2">
                <span className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded-full">Server disconnected</span>
              </div>
            ) : null}

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
      {renderCameraDialog()}


      {/* Messages Area - Takes remaining space */}
      <div className="relative z-10 flex-1 overflow-y-auto min-h-0">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex flex-col gap-6">
            {messages.map((msg) => {
              const messageBlocks = buildLegacyBlocks(
                msg.content,
                msg.metadata?.blocks,
                msg.metadata?.components,
                msg.metadata?.recipes,
                msg.metadata?.recipes_found
              );
              const isCompactUserBubble =
                msg.role === 'user' &&
                !msg.metadata?.image &&
                !msg.content.includes('\n') &&
                msg.content.trim().length <= 56;

              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id}
                  className={cn(
                    "flex max-w-[94%] md:max-w-[90%]",
                    msg.role === 'user' ? "self-end" : "self-start"
                  )}
                >
                  <div className={cn("flex items-start gap-3", msg.role === 'user' && "flex-row-reverse")}>
                    {msg.role === 'assistant' && (
                      <div className="mt-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_12px_24px_-18px_rgba(16,185,129,0.45)]">
                        <Sparkles className="h-4 w-4" />
                      </div>
                    )}

                    <div className={cn(
                      "group relative max-w-full overflow-hidden text-sm md:text-base leading-relaxed",
                      msg.role === 'assistant'
                        ? "min-w-0 flex-1 rounded-[18px] border border-border/70 bg-card/95 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.22)]"
                        : cn(
                          "border border-primary/10 bg-primary text-primary-foreground shadow-[0_16px_28px_-22px_rgba(16,185,129,0.45)]",
                          isCompactUserBubble ? "rounded-full" : "rounded-[24px]"
                        )
                    )}>
                      <div className="relative p-4 md:p-5">
                        {msg.type === 'image' && (
                          <div className="mb-4">
                            {msg.metadata?.image ? (
                              <img
                                src={msg.metadata.image}
                                alt="User Upload"
                                className={cn(
                                  "max-w-[220px] max-h-[220px] object-contain rounded-2xl p-1 cursor-pointer hover:opacity-90 transition-opacity",
                                  msg.role === 'assistant'
                                    ? "border border-border/70 bg-muted/20"
                                    : "border border-white/10 bg-black/5"
                                )}
                              />
                            ) : (
                              <div className={cn(
                                "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm",
                                msg.role === 'assistant'
                                  ? "bg-primary/5 text-muted-foreground"
                                  : "bg-white/10 text-white/80"
                              )}>
                                <ImageIcon className="w-4 h-4" />
                                <span>Analyzing image...</span>
                              </div>
                            )}
                          </div>
                        )}

                        {msg.role === 'assistant' && msg.id === streamingMessageId && isLoading && !msg.content ? (
                          renderLoadingSteps()
                        ) : (
                          <div className={cn("space-y-0", msg.role === 'assistant' && "space-y-1")}>
                            {msg.role === 'assistant'
                              ? messageBlocks.map((block, idx) => renderChatBlock(block, idx, msg.timestamp.getTime()))
                              : renderMarkdown(msg.content, 'user')}
                          </div>
                        )}

                        {(() => {
                          const shouldShowSkeleton = !!msg.metadata?.pending_components && (!msg.metadata?.components || msg.metadata.components.length === 0);
                          return shouldShowSkeleton ? (
                            <div className="mt-4 overflow-hidden rounded-[16px] border border-border/70 bg-background/95 p-4">
                              <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                  <div className="h-3 w-24 rounded-full bg-primary/10" />
                                  <div className="h-6 w-40 rounded-full bg-muted/50 animate-pulse" />
                                </div>
                                <div className="h-4 w-28 rounded-full bg-muted/35 animate-pulse" />
                              </div>
                              <div className="mt-4 h-[280px] w-full rounded-[12px] bg-muted/25 p-4">
                                <div className="flex h-full items-end justify-between gap-2">
                                  {SKELETON_BAR_HEIGHTS.map((height, i) => (
                                    <div key={i} className="w-full rounded-t-xl bg-gradient-to-t from-primary/35 to-primary/10" style={{ height }} />
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : null;
                        })()}

                        {msg.role === 'user' && (
                          <div className="pointer-events-none absolute bottom-3 right-[-7px] h-3 w-3 rounded-full bg-primary" />
                        )}
                      </div>
                    </div>
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
                {renderLoadingSteps()}
              </motion.div>
            )}

            <div ref={messagesEndRef} className="h-1" />
          </div>
        </div>
      </div>
      {/* Input Area - Fixed at absolute bottom */}
      <div className="relative z-10 shrink-0 bg-gradient-to-t from-background via-background/95 to-transparent pt-3">
        <RecipeDetailDialog
          recipe={selectedRecipe}
          open={showRecipeDialog}
          onOpenChange={setShowRecipeDialog}
        />
        <div className="max-w-3xl mx-auto px-4 py-4">
          {renderInputBox()}

          {useHttpFallback ? (
            <div className="text-center mt-2">
              <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full">Realtime unavailable, using standard mode</span>
            </div>
          ) : !isConnected ? (
            <div className="text-center mt-2">
              <span className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded-full">Server disconnected</span>
            </div>
          ) : null}

          <p className="text-center text-xs text-muted-foreground mt-3">
            AI can make mistakes. Verify important info.
          </p>
        </div>
      </div>
    </div>
  );
}
