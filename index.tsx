/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Chat, Modality } from "@google/genai";

type ImageContent = {
  url: string;
  aspectRatioUsed: AspectRatio;
};

type Message = {
  sender: 'user' | 'ai';
  type: 'text' | 'image' | 'error';
  content: string | ImageContent;
};

type Server = 'gemicord' | 'programming';
type Channel = 'general' | 'generar-imagenes' | 'gemini-en-vivo' | 'revisor-de-codigo' | 'editor-de-imagenes';
type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
type Language = 'es' | 'en';


const SERVERS: Record<Server, { nameKey: string, icon: string }> = {
    gemicord: { nameKey: 'gemicordServerName', icon: 'SG' },
    programming: { nameKey: 'programmingServerName', icon: 'APG' },
};

const CHANNELS: { id: Channel, nameKey: string }[] = [
    { id: 'general', nameKey: 'channel_general' },
    { id: 'revisor-de-codigo', nameKey: 'channel_code_reviewer' },
    { id: 'generar-imagenes', nameKey: 'channel_image_generator' },
    { id: 'editor-de-imagenes', nameKey: 'channel_image_editor' },
    { id: 'gemini-en-vivo', nameKey: 'channel_gemini_live' },
];

const SOUNDS = {
  MESSAGE_SENT: 'https://www.myinstants.com/media/sounds/discord-message-send-sound-effect.mp3',
  MESSAGE_RECEIVED: 'https://www.myinstants.com/media/sounds/discord-notification.mp3',
  CHANNEL_SWITCH: 'https://www.myinstants.com/media/sounds/discord-channel-switch.mp3',
};

const translations: Record<Language, Record<string, string>> = {
    es: {
        gemicordServerName: "Servidor Gemicord",
        programmingServerName: "Ayuda de Programación Gemini",
        channel_general: "general",
        channel_image_generator: "generar-imagenes",
        channel_gemini_live: "gemini-en-vivo",
        channel_code_reviewer: "revisor-de-codigo",
        channel_image_editor: "editor-de-imagenes",
        welcome_gemicord_general: "¡Hola! ¿En qué puedo ayudarte hoy? Puedes usar comandos como `/traducir`, `/explicar`, o `/resumir`.",
        welcome_gemicord_image_generator: "Bienvenido al generador de imágenes. Escribe una descripción de la imagen que quieres crear.",
        welcome_gemicord_gemini_live: "Bienvenido a Live Gemini. Escribe algo y te responderé con voz.",
        welcome_gemicord_code_reviewer: "Bienvenido al revisor de código. Pega un fragmento de código y te daré mi opinión.",
        welcome_gemicord_image_editor: "Bienvenido al editor de imágenes. Sube una imagen para empezar a editarla con tus instrucciones.",
        welcome_programming_general: "Bienvenido al canal de ayuda de programación. ¿Cómo puedo ayudarte con tu código hoy?",
        welcome_programming_image_generator: "Este es el canal de generación de imágenes para el servidor de programación.",
        welcome_programming_gemini_live: "Este es Live Gemini para el servidor de programación. Pregúntame lo que sea y te responderé con voz.",
        welcome_programming_code_reviewer: "Este es el revisor de código. Pega tu código para recibir un análisis detallado.",
        welcome_programming_image_editor: "Este es el editor de imágenes. Sube una imagen técnica o un diagrama para modificarlo.",
        initialization_error: "Error al inicializar. Por favor, verifica la configuración de tu clave de API y refresca la página.",
        api_error_message: "Lo siento, algo salió mal: ",
        unknown_error: "Ocurrió un error desconocido.",
        image_gen_chat_not_initialized: "El chat de generación de imágenes no está inicializado.",
        no_image_from_model_error: "No se recibió ninguna imagen del modelo. El prompt puede haber sido bloqueado por políticas de seguridad.",
        image_gen_failed_error: "No se pudo generar la imagen.",
        upload_image_first_error: "Por favor, sube una imagen primero usando el botón de adjuntar.",
        image_editing_failed_error: "No se pudo editar la imagen.",
        no_image_in_response_error: "La respuesta de la IA no contenía una imagen. Puede que la solicitud haya sido bloqueada.",
        code_review_chat_not_initialized: "El chat de revisión de código no está inicializado.",
        chat_not_initialized: "El chat no está inicializado.",
        slash_translate_usage: "Uso: /traducir [idioma] [texto a traducir]",
        slash_explain_usage: "Uso: /explicar [concepto]",
        slash_summarize_usage: "Uso: /resumir [URL o texto]",
        slash_imagine_redirect: "Para generar imágenes, por favor usa el canal #generar-imagenes.",
        slash_unknown_command: "Comando desconocido: ",
        placeholder_general: "Enviar mensaje a #{channel}...",
        placeholder_image_generator: "Describe una imagen en #{channel}... (Relación: {ratio})",
        placeholder_gemini_live: "Habla con Gemini en #{channel}...",
        placeholder_code_reviewer: "Pega tu código en #{channel}...",
        placeholder_image_editor_upload: "Sube una imagen para editar en #{channel}...",
        placeholder_image_editor_prompt: "Describe los cambios para la imagen...",
        settings_title: "Configuración de Usuario",
        settings_username: "Nombre de usuario",
        settings_avatar_color: "Color del Avatar",
        settings_language: "Idioma",
        settings_cancel: "Cancelar",
        settings_save: "Guardar",
        image_settings_title: "Configuración de Imagen",
        aspect_ratio_square: "Cuadrado (1:1)",
        aspect_ratio_landscape: "Paisaje (16:9)",
        aspect_ratio_portrait: "Retrato (9:16)",
        aspect_ratio_standard: "Estándar (4:3)",
        aspect_ratio_tall: "Alto (3:4)",
        attach_image_title: "Adjuntar imagen",
        copy_button_text: "Copiar",
        copied_button_text: "¡Copiado!",
        download_button_text: "Descargar",
        aspect_ratio_tag: "Relación:",
        default_username: "Tú",
        user_settings_title: "Configuración de Usuario",
        live_chat_error: "El chat o el contexto de audio no están inicializados.",
        live_response_error: "Lo siento, algo salió mal en la respuesta de live: ",
        file_upload_error: "No se pudo cargar la imagen.",
        image_loaded_prompt: "Imagen cargada. Ahora, dime qué cambios quieres hacer.",
    },
    en: {
        gemicordServerName: "Gemicord Server",
        programmingServerName: "Gemini Programming Help",
        channel_general: "general",
        channel_image_generator: "image-generator",
        channel_gemini_live: "gemini-live",
        channel_code_reviewer: "code-reviewer",
        channel_image_editor: "image-editor",
        welcome_gemicord_general: "Hi! How can I help you today? You can use commands like `/translate`, `/explain`, or `/summarize`.",
        welcome_gemicord_image_generator: "Welcome to the image generator. Describe the image you want to create.",
        welcome_gemicord_gemini_live: "Welcome to Live Gemini. Type something and I'll respond with voice.",
        welcome_gemicord_code_reviewer: "Welcome to the code reviewer. Paste a code snippet and I'll give you feedback.",
        welcome_gemicord_image_editor: "Welcome to the image editor. Upload an image to start editing it with your instructions.",
        welcome_programming_general: "Welcome to the programming help channel. How can I assist you with your code today?",
        welcome_programming_image_generator: "This is the image generation channel for the programming server.",
        welcome_programming_gemini_live: "This is Live Gemini for the programming server. Ask me anything and I'll answer with voice.",
        welcome_programming_code_reviewer: "This is the code reviewer. Paste your code to receive a detailed analysis.",
        welcome_programming_image_editor: "This is the image editor. Upload a technical image or diagram to modify it.",
        initialization_error: "Failed to initialize. Please check your API key configuration and refresh the page.",
        api_error_message: "Sorry, something went wrong: ",
        unknown_error: "An unknown error occurred.",
        image_gen_chat_not_initialized: "Image generation chat is not initialized.",
        no_image_from_model_error: "No image was received from the model. The prompt may have been blocked by safety policies.",
        image_gen_failed_error: "Could not generate the image.",
        upload_image_first_error: "Please upload an image first using the attach button.",
        image_editing_failed_error: "Could not edit the image.",
        no_image_in_response_error: "The AI response did not contain an image. The request may have been blocked.",
        code_review_chat_not_initialized: "Code review chat is not initialized.",
        chat_not_initialized: "Chat is not initialized.",
        slash_translate_usage: "Usage: /translate [language] [text to translate]",
        slash_explain_usage: "Usage: /explain [concept]",
        slash_summarize_usage: "Usage: /summarize [URL or text]",
        slash_imagine_redirect: "To generate images, please use the #image-generator channel.",
        slash_unknown_command: "Unknown command: ",
        placeholder_general: "Message #{channel}...",
        placeholder_image_generator: "Describe an image in #{channel}... (Ratio: {ratio})",
        placeholder_gemini_live: "Talk to Gemini in #{channel}...",
        placeholder_code_reviewer: "Paste your code in #{channel}...",
        placeholder_image_editor_upload: "Upload an image to edit in #{channel}...",
        placeholder_image_editor_prompt: "Describe the changes for the image...",
        settings_title: "User Settings",
        settings_username: "Username",
        settings_avatar_color: "Avatar Color",
        settings_language: "Language",
        settings_cancel: "Cancel",
        settings_save: "Save",
        image_settings_title: "Image Settings",
        aspect_ratio_square: "Square (1:1)",
        aspect_ratio_landscape: "Landscape (16:9)",
        aspect_ratio_portrait: "Portrait (9:16)",
        aspect_ratio_standard: "Standard (4:3)",
        aspect_ratio_tall: "Tall (3:4)",
        attach_image_title: "Attach image",
        copy_button_text: "Copy",
        copied_button_text: "Copied!",
        download_button_text: "Download",
        aspect_ratio_tag: "Ratio:",
        default_username: "You",
        user_settings_title: "User Settings",
        live_chat_error: "Chat or audio context is not initialized.",
        live_response_error: "Sorry, something went wrong in the live response: ",
        file_upload_error: "Failed to upload the image.",
        image_loaded_prompt: "Image uploaded. Now, tell me what changes you want to make.",
    }
};


const App = () => {
  let chats: Record<Server, Chat | null> = { gemicord: null, programming: null };
  let imageGenChats: Record<Server, Chat | null> = { gemicord: null, programming: null };
  let codeReviewerChats: Record<Server, Chat | null> = { gemicord: null, programming: null };
  let lastImageForEditing: Record<Server, { data: string, mimeType: string } | null> = { gemicord: null, programming: null };

  let outputAudioContext: AudioContext | null = null;
  let messages: Record<Server, Record<Channel, Message[]>> = {
    gemicord: { general: [], 'generar-imagenes': [], 'gemini-en-vivo': [], 'revisor-de-codigo': [], 'editor-de-imagenes': [] },
    programming: { general: [], 'generar-imagenes': [], 'gemini-en-vivo': [], 'revisor-de-codigo': [], 'editor-de-imagenes': [] },
  };

  let isLoading = false;
  let activeServer: Server = 'gemicord';
  let activeChannel: Channel = 'general';
  let activeLanguage: Language = (localStorage.getItem('gemicord_language') as Language) || 'es';

  // State for image generation settings
  let imageAspectRatio: AspectRatio = '1:1';
  let isAspectRatioMenuOpen = false;

  // State for user customization
  let username = localStorage.getItem('gemicord_username') || translations[activeLanguage]['default_username'];
  let avatarColor = localStorage.getItem('gemicord_avatarColor') || '#5865F2';
  let isSettingsModalOpen = false;
  const availableAvatarColors = ['#5865F2', '#57F287', '#FEE75C', '#EB459E', '#ED4245', '#F47B67', '#3498DB', '#9B59B6'];


  const root = document.getElementById('root');
  if (!root) throw new Error("Root element not found");
  
  const t = (key: string, replacements: Record<string, string> = {}): string => {
      let translation = translations[activeLanguage][key] || key;
      for (const placeholder in replacements) {
        translation = translation.replace(`{${placeholder}}`, replacements[placeholder]);
      }
      return translation;
  };

  const playSound = (soundUrl: string) => {
    try {
      const audio = new Audio(soundUrl);
      audio.volume = 0.4;
      audio.play().catch(error => console.warn("Audio playback failed:", error));
    } catch (e) {
      console.warn("Could not play audio:", e);
    }
  };

  const fileToBase64 = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
    });

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  const openSettings = () => {
    isSettingsModalOpen = true;
    render();
  };

  const closeSettings = () => {
    isSettingsModalOpen = false;
    render();
  };

  const handleSaveSettings = (e: Event) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const newUsernameInput = form.querySelector('#username-input') as HTMLInputElement;
    const selectedColorEl = form.querySelector('.color-swatch.selected') as HTMLElement;
    const languageSelect = form.querySelector('#language-select') as HTMLSelectElement;
    
    const newLanguage = languageSelect.value as Language;
    if (newLanguage !== activeLanguage) {
        activeLanguage = newLanguage;
        localStorage.setItem('gemicord_language', activeLanguage);
    }

    const newUsername = newUsernameInput.value.trim();
    if (newUsername) {
        username = newUsername;
        localStorage.setItem('gemicord_username', username);
    }

    if (selectedColorEl && selectedColorEl.dataset.color) {
        avatarColor = selectedColorEl.dataset.color;
        localStorage.setItem('gemicord_avatarColor', avatarColor);
    }
    
    closeSettings();
  };


  const initApp = () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      username = localStorage.getItem('gemicord_username') || t('default_username');

      chats.gemicord = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: 'You are a helpful and creative assistant. Be friendly and concise.',
        },
      });
      chats.programming = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: 'You are an expert programming assistant. Provide clear, concise, and accurate code examples and explanations. Default to TypeScript and React unless asked otherwise. Always format code snippets using markdown code blocks.',
        },
      });
      
      imageGenChats.gemicord = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: 'You are an AI assistant that refines user prompts for an image generation model. Based on the conversation history, generate a single, complete, and descriptive prompt that combines the user\'s requests. Only output the final, refined prompt and nothing else. Do not add any conversational text like "Sure, here is the prompt:".',
        },
      });
      imageGenChats.programming = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: 'You are an AI assistant that refines user prompts for an image generation model, focusing on technical or abstract concepts. Based on the conversation history, generate a single, complete, and descriptive prompt that combines the user\'s requests. Only output the final, refined prompt and nothing else. Do not add any conversational text like "Sure, here is the prompt:".',
        },
      });
      
      codeReviewerChats.gemicord = ai.chats.create({
        model: 'gemini-2.5-pro',
        config: {
            systemInstruction: 'You are a world-class software engineer and code reviewer. Analyze the provided code snippet and offer constructive feedback. Identify potential bugs, suggest performance improvements, and recommend best practices for style and readability. Be concise and provide code examples for your suggestions.',
        },
      });
      codeReviewerChats.programming = codeReviewerChats.gemicord;

      // Initialize messages for Gemicord Server
      messages.gemicord.general.push({ sender: 'ai', type: 'text', content: t('welcome_gemicord_general') });
      messages.gemicord['generar-imagenes'].push({ sender: 'ai', type: 'text', content: t('welcome_gemicord_image_generator') });
      messages.gemicord['gemini-en-vivo'].push({ sender: 'ai', type: 'text', content: t('welcome_gemicord_gemini_live') });
      messages.gemicord['revisor-de-codigo'].push({ sender: 'ai', type: 'text', content: t('welcome_gemicord_code_reviewer') });
      messages.gemicord['editor-de-imagenes'].push({ sender: 'ai', type: 'text', content: t('welcome_gemicord_image_editor') });

      // Initialize messages for Programming Help Server
      messages.programming.general.push({ sender: 'ai', type: 'text', content: t('welcome_programming_general') });
      messages.programming['generar-imagenes'].push({ sender: 'ai', type: 'text', content: t('welcome_programming_image_generator') });
      messages.programming['gemini-en-vivo'].push({ sender: 'ai', type: 'text', content: t('welcome_programming_gemini_live') });
      messages.programming['revisor-de-codigo'].push({ sender: 'ai', type: 'text', content: t('welcome_programming_code_reviewer') });
      messages.programming['editor-de-imagenes'].push({ sender: 'ai', type: 'text', content: t('welcome_programming_image_editor') });


      render();
    } catch (error) {
      console.error("Failed to initialize:", error);
      const errorMessage = t('initialization_error');
      messages.gemicord.general.push({ sender: 'ai', type: 'error', content: errorMessage });
      messages.programming.general.push({ sender: 'ai', type: 'error', content: errorMessage });
      render();
    }
  };

  const handleSendMessage = async (e: Event) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.querySelector('#chat-input') as HTMLInputElement;
    const prompt = input.value.trim();

    if (!prompt || isLoading) return;

    messages[activeServer][activeChannel].push({ sender: 'user', type: 'text', content: prompt });
    playSound(SOUNDS.MESSAGE_SENT);
    isLoading = true;
    render();
    input.value = '';

    try {
      if (prompt.startsWith('/') && activeChannel === 'general') {
        await handleSlashCommand(prompt);
      } else if (activeChannel === 'generar-imagenes') {
        await handleImageGeneration(prompt);
      } else if (activeChannel === 'gemini-en-vivo') {
        await handleLiveMessage(prompt);
      } else if (activeChannel === 'revisor-de-codigo') {
        await handleCodeReview(prompt);
      } else if (activeChannel === 'editor-de-imagenes') {
        await handleImageEditing(prompt);
      }
      else {
        await handleTextMessage(prompt);
      }
    } catch (error) {
      console.error("API call failed:", error);
      const errorMessage = error instanceof Error ? error.message : t('unknown_error');
      messages[activeServer][activeChannel].push({ sender: 'ai', type: 'error', content: `${t('api_error_message')}${errorMessage}` });
      playSound(SOUNDS.MESSAGE_RECEIVED);
    } finally {
      isLoading = false;
      render();
    }
  };
  
  const handleFileUpload = async (e: Event) => {
      const input = e.target as HTMLInputElement;
      if (input.files && input.files[0]) {
        const file = input.files[0];
        isLoading = true;
        render();
        try {
          const base64Data = await fileToBase64(file);
          lastImageForEditing[activeServer] = { data: base64Data, mimeType: file.type };
          messages[activeServer]['editor-de-imagenes'].push({
            sender: 'user', type: 'image',
            content: { url: `data:${file.type};base64,${base64Data}`, aspectRatioUsed: '1:1' }
          });
          messages[activeServer]['editor-de-imagenes'].push({
            sender: 'ai', type: 'text', content: t('image_loaded_prompt')
          });
          playSound(SOUNDS.MESSAGE_RECEIVED);
        } catch (error) {
          console.error("File to base64 conversion failed:", error);
          messages[activeServer]['editor-de-imagenes'].push({ sender: 'ai', type: 'error', content: t('file_upload_error') });
        } finally {
          isLoading = false;
          render();
        }
      }
    };

  const handleLiveMessage = async (prompt: string) => {
    const chat = chats[activeServer];
    if (!chat || !outputAudioContext) {
        messages[activeServer]['gemini-en-vivo'].push({ sender: 'ai', type: 'error', content: t('live_chat_error') });
        playSound(SOUNDS.MESSAGE_RECEIVED);
        return;
    }
    try {
        const chatResponse = await chat.sendMessage({ message: prompt });
        const aiTextResponse = chatResponse.text;
        messages[activeServer]['gemini-en-vivo'].push({ sender: 'ai', type: 'text', content: aiTextResponse });
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const ttsResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: aiTextResponse }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
            },
        });
        const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (typeof base64Audio === 'string') {
            const audioBuffer = await decodeAudioData( decode(base64Audio), outputAudioContext, 24000, 1 );
            playSound(SOUNDS.MESSAGE_RECEIVED);
            const source = outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputAudioContext.destination);
            source.start();
        } else {
            playSound(SOUNDS.MESSAGE_RECEIVED);
            console.warn("TTS generation returned no audio, but text response was successful.");
        }
    } catch (error) {
        console.error("Live Gemini message failed:", error);
        const errorMessage = error instanceof Error ? error.message : t('unknown_error');
        messages[activeServer]['gemini-en-vivo'].push({ sender: 'ai', type: 'error', content: `${t('live_response_error')}${errorMessage}` });
        playSound(SOUNDS.MESSAGE_RECEIVED);
    }
  };

  const extractAspectRatio = (prompt: string): { newPrompt: string, ratio: AspectRatio | null } => {
    const lowerCasePrompt = prompt.toLowerCase();
    let ratio: AspectRatio | null = null;
    let newPrompt = prompt;

    const ratioPatterns: { [key: string]: AspectRatio } = {
        '16:9': '16:9', '9:16': '9:16', '1:1': '1:1', '4:3': '4:3', '3:4': '3:4',
        'landscape': '16:9', 'horizontal': '16:9', 'panoramica': '16:9', 'paisaje': '16:9',
        'portrait': '9:16', 'vertical': '9:16', 'retrato': '9:16',
        'square': '1:1', 'cuadrado': '1:1'
    };

    const validRatios: AspectRatio[] = ["1:1", "16:9", "9:16", "4:3", "3:4"];
    const regex = new RegExp(`\\b(${Object.keys(ratioPatterns).join('|')})\\b|(\\d+:\\d+)`, 'gi');
    const matches = lowerCasePrompt.match(regex);

    if (matches && matches.length > 0) {
        const foundMatch = matches[0];
        let foundRatio: AspectRatio | null = null;
        
        if (ratioPatterns[foundMatch]) { foundRatio = ratioPatterns[foundMatch]; }
        else if (validRatios.includes(foundMatch as AspectRatio)) { foundRatio = foundMatch as AspectRatio; }

        if (foundRatio) {
            ratio = foundRatio;
            newPrompt = prompt.replace(regex, '').replace(/\s\s+/g, ' ').trim();
        }
    }
    return { newPrompt: newPrompt || prompt, ratio };
  };

  const handleImageGeneration = async (prompt: string) => {
    try {
      const { newPrompt: textPrompt, ratio: detectedRatio } = extractAspectRatio(prompt);
      const finalAspectRatio = detectedRatio || imageAspectRatio;
      const imageChat = imageGenChats[activeServer];
      if (!imageChat) throw new Error(t('image_gen_chat_not_initialized'));

      const promptResponse = await imageChat.sendMessage({ message: textPrompt });
      const refinedPrompt = promptResponse.text;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: refinedPrompt,
        config: {
          numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: finalAspectRatio,
        },
      });

      if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image?.imageBytes) {
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
        const imageContent: ImageContent = { url: imageUrl, aspectRatioUsed: finalAspectRatio };
        messages[activeServer]['generar-imagenes'].push({ sender: 'ai', type: 'image', content: imageContent });
        playSound(SOUNDS.MESSAGE_RECEIVED);
      } else {
        throw new Error(t('no_image_from_model_error'));
      }
    } catch (error) {
        console.error("Image generation failed:", error);
        const errorMessage = error instanceof Error ? error.message : t('image_gen_failed_error');
        messages[activeServer]['generar-imagenes'].push({ sender: 'ai', type: 'error', content: errorMessage });
        playSound(SOUNDS.MESSAGE_RECEIVED);
    }
  };

  const handleImageEditing = async (prompt: string) => {
      const currentImage = lastImageForEditing[activeServer];
      if (!currentImage) {
        messages[activeServer]['editor-de-imagenes'].push({ sender: 'ai', type: 'error', content: t('upload_image_first_error') });
        playSound(SOUNDS.MESSAGE_RECEIVED);
        return;
      }

      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [ { inlineData: { data: currentImage.data, mimeType: currentImage.mimeType } }, { text: prompt } ] },
          config: { responseModalities: [Modality.IMAGE] },
        });
        
        let imageReceived = false;
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
              if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                const mimeType = part.inlineData.mimeType;
                const imageUrl = `data:${mimeType};base64,${base64ImageBytes}`;
                const imageContent: ImageContent = { url: imageUrl, aspectRatioUsed: '1:1' };
                messages[activeServer]['editor-de-imagenes'].push({ sender: 'ai', type: 'image', content: imageContent });
                lastImageForEditing[activeServer] = { data: base64ImageBytes, mimeType };
                imageReceived = true;
                break;
              }
            }
        }
        
        if (!imageReceived) {
            if (response.promptFeedback?.blockReason) {
                console.error('Image editing blocked:', response.promptFeedback);
            }
            throw new Error(t('no_image_in_response_error'));
        }

        playSound(SOUNDS.MESSAGE_RECEIVED);
      } catch (error) {
        console.error("Image editing failed:", error);
        const errorMessage = error instanceof Error ? error.message : t('image_editing_failed_error');
        messages[activeServer]['editor-de-imagenes'].push({ sender: 'ai', type: 'error', content: errorMessage });
        playSound(SOUNDS.MESSAGE_RECEIVED);
      }
  };
  
  const handleCodeReview = async (prompt: string) => {
    const chat = codeReviewerChats[activeServer];
    if (!chat) {
        messages[activeServer]['revisor-de-codigo'].push({ sender: 'ai', type: 'error', content: t('code_review_chat_not_initialized') });
        playSound(SOUNDS.MESSAGE_RECEIVED);
        return;
    }
    const response = await chat.sendMessage({ message: prompt });
    messages[activeServer]['revisor-de-codigo'].push({ sender: 'ai', type: 'text', content: response.text });
    playSound(SOUNDS.MESSAGE_RECEIVED);
  };

  const handleSlashCommand = async (prompt: string) => {
      const chat = chats[activeServer];
      if (!chat) return;

      const [command, ...args] = prompt.trim().substring(1).split(' ');
      const restOfPrompt = args.join(' ');
      let commandPrompt = '';
      let isValidCommand = true;

      switch(command.toLowerCase()) {
        case 'traducir':
        case 'translate':
          const lang = args[0];
          const textToTranslate = args.slice(1).join(' ');
          if (!lang || !textToTranslate) {
            messages[activeServer][activeChannel].push({ sender: 'ai', type: 'error', content: t('slash_translate_usage') });
            isValidCommand = false;
          } else { commandPrompt = `Translate the following text to ${lang}: "${textToTranslate}"`; }
          break;
        case 'explicar':
        case 'explain':
          if (!restOfPrompt) {
             messages[activeServer][activeChannel].push({ sender: 'ai', type: 'error', content: t('slash_explain_usage') });
             isValidCommand = false;
          } else { commandPrompt = `Explain the concept of "${restOfPrompt}" clearly and concisely.`; }
          break;
        case 'resumir':
        case 'summarize':
           if (!restOfPrompt) {
             messages[activeServer][activeChannel].push({ sender: 'ai', type: 'error', content: t('slash_summarize_usage') });
             isValidCommand = false;
          } else { commandPrompt = `Please summarize the following content or URL: "${restOfPrompt}"`; }
          break;
        case 'imaginar':
        case 'imagine':
            messages[activeServer][activeChannel].push({ sender: 'ai', type: 'text', content: t('slash_imagine_redirect').replace('#generar-imagenes', `#${t('channel_image_generator')}`) });
            isValidCommand = false;
            break;
        default:
          messages[activeServer][activeChannel].push({ sender: 'ai', type: 'error', content: `${t('slash_unknown_command')}/${command}` });
          isValidCommand = false;
          break;
      }
      
      if (!isValidCommand) { playSound(SOUNDS.MESSAGE_RECEIVED); return; }
      
      const response = await chat.sendMessage({ message: commandPrompt });
      messages[activeServer][activeChannel].push({ sender: 'ai', type: 'text', content: response.text });
      playSound(SOUNDS.MESSAGE_RECEIVED);
  }

  const handleTextMessage = async (prompt: string) => {
    const chat = chats[activeServer];
    if (!chat) {
        messages[activeServer].general.push({ sender: 'ai', type: 'error', content: t('chat_not_initialized') });
        playSound(SOUNDS.MESSAGE_RECEIVED);
        return;
    }
    const response = await chat.sendMessage({ message: prompt });
    messages[activeServer].general.push({ sender: 'ai', type: 'text', content: response.text });
    playSound(SOUNDS.MESSAGE_RECEIVED);
  };
  
  const toggleAspectRatioMenu = () => {
    isAspectRatioMenuOpen = !isAspectRatioMenuOpen;
    render();
  };

  const selectAspectRatio = (ratio: AspectRatio) => {
    imageAspectRatio = ratio;
    isAspectRatioMenuOpen = false;
    render();
  };

  const handleDownloadImage = (e: Event) => {
    const target = e.currentTarget as HTMLElement;
    const imageUrl = target.dataset.src;
    if (imageUrl) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `gemicord-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  const switchChannel = async (channel: Channel) => {
      if (activeChannel === channel) return;
      activeChannel = channel;
      isAspectRatioMenuOpen = false;
      playSound(SOUNDS.CHANNEL_SWITCH);
      render();
  }

  const switchServer = (server: Server) => {
    if (activeServer === server) return;
    activeServer = server;
    activeChannel = 'general';
    isAspectRatioMenuOpen = false;
    playSound(SOUNDS.CHANNEL_SWITCH);
    render();
  }

  const renderMessageContent = (content: string) => {
    const parts = content.split(/(```(?:\w*)\n(?:[\s\S]*?)\n```)/);
    
    return parts.map(part => {
        if (part.startsWith('```')) {
            const match = part.match(/```(\w*)\n([\s\S]*?)\n```/);
            if (match) {
                const language = match[1] || 'text';
                const code = match[2].trim();
                const escapedCode = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                return `
                    <div class="code-block-wrapper">
                        <div class="code-block-header">
                            <span>${language}</span>
                            <button class="copy-code-btn">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                <span>${t('copy_button_text')}</span>
                            </button>
                        </div>
                        <pre><code>${escapedCode}</code></pre>
                    </div>
                `;
            }
        }
        if (part.trim()) {
             return `<p>${part.replace(/\n/g, '<br>')}</p>`;
        }
        return '';
    }).join('');
  };

  const render = () => {
    const currentMessages = messages[activeServer][activeChannel];
    const messageListHtml = currentMessages.map(msg => {
      const contentHtml = (() => {
        if (msg.type === 'image') {
            const imageContent = msg.content as ImageContent;
            const actionsHtml = `
                ${activeChannel === 'generar-imagenes' ? `<span class="aspect-ratio-tag">${t('aspect_ratio_tag')} ${imageContent.aspectRatioUsed}</span>` : ''}
                <button class="download-btn" data-src="${imageContent.url}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    <span>${t('download_button_text')}</span>
                </button>
            `;
            return `<div class="image-container">
               <img src="${imageContent.url}" alt="Generated image" />
               <div class="image-actions">${actionsHtml}</div>
             </div>`;
        }
        if (msg.sender === 'ai' && msg.type === 'text') {
            return renderMessageContent(msg.content as string);
        }
        return `<p>${(msg.content as string).replace(/\n/g, '<br>')}</p>`;
      })();

      const senderClass = msg.sender === 'user' ? 'user' : 'ai';
      const typeClass = msg.type === 'error' ? 'error' : '';
      
      const avatarHtml = msg.sender === 'user'
        ? `<div class="avatar" style="background-color: ${avatarColor};"></div>`
        : `<div class="avatar"></div>`;

      const senderName = msg.sender === 'user' ? username : 'Gemini';

      return `<div class="message ${senderClass} ${typeClass}">
          ${avatarHtml}
          <div class="message-body">
            <div class="sender">${senderName}</div>
            <div class="content">${contentHtml}</div>
          </div>
        </div>`;
    }).join('');

    const loadingIndicatorHtml = isLoading
      ? `<div class="message ai">
            <div class="avatar"></div>
            <div class="message-body">
                <div class="sender">Gemini</div>
                <div class="loading-indicator">
                    <div class="dot"></div><div class="dot"></div><div class="dot"></div>
                </div>
            </div>
         </div>` : '';
    
    const placeholderText = {
        general: t('placeholder_general', { channel: t(`channel_${activeChannel}`) }),
        'generar-imagenes': t('placeholder_image_generator', { channel: t(`channel_${activeChannel}`), ratio: imageAspectRatio }),
        'gemini-en-vivo': t('placeholder_gemini_live', { channel: t(`channel_${activeChannel}`) }),
        'revisor-de-codigo': t('placeholder_code_reviewer', { channel: t(`channel_${activeChannel}`) }),
        'editor-de-imagenes': lastImageForEditing[activeServer] ? t('placeholder_image_editor_prompt') : t('placeholder_image_editor_upload', { channel: t(`channel_${activeChannel}`) }),
    }[activeChannel];

    const settingsModalHtml = isSettingsModalOpen ? `
        <div class="modal-overlay">
            <div class="modal">
                <form id="settings-form">
                    <h2>${t('settings_title')}</h2>
                    <div class="form-group">
                        <label for="username-input">${t('settings_username')}</label>
                        <input id="username-input" type="text" value="${username}" />
                    </div>
                    <div class="form-group">
                        <label>${t('settings_avatar_color')}</label>
                        <div class="color-picker">
                            ${availableAvatarColors.map(color => `<div class="color-swatch ${avatarColor.toLowerCase() === color.toLowerCase() ? 'selected' : ''}" data-color="${color}" style="background-color: ${color};"></div>`).join('')}
                        </div>
                    </div>
                     <div class="form-group">
                        <label for="language-select">${t('settings_language')}</label>
                        <select id="language-select">
                            <option value="es" ${activeLanguage === 'es' ? 'selected' : ''}>Español</option>
                            <option value="en" ${activeLanguage === 'en' ? 'selected' : ''}>English</option>
                        </select>
                    </div>
                    <div class="modal-actions">
                        <button type="button" id="cancel-settings-btn" class="btn-secondary">${t('settings_cancel')}</button>
                        <button type="submit" class="btn-primary">${t('settings_save')}</button>
                    </div>
                </form>
            </div>
        </div>` : '';
    
    const imageSettingsHtml = activeChannel === 'generar-imagenes' ? `
        <div class="image-settings-container">
            <button id="image-settings-btn" type="button" title="${t('image_settings_title')}">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-4.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.44.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.44.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h4.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.44-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.44-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
            ${isAspectRatioMenuOpen ? `
                <div class="aspect-ratio-menu">
                    <div class="aspect-ratio-item" data-ratio="1:1">${t('aspect_ratio_square')}</div>
                    <div class="aspect-ratio-item" data-ratio="16:9">${t('aspect_ratio_landscape')}</div>
                    <div class="aspect-ratio-item" data-ratio="9:16">${t('aspect_ratio_portrait')}</div>
                    <div class="aspect-ratio-item" data-ratio="4:3">${t('aspect_ratio_standard')}</div>
                    <div class="aspect-ratio-item" data-ratio="3:4">${t('aspect_ratio_tall')}</div>
                </div>` : ''}
        </div>` : '';
        
    const imageEditorControls = activeChannel === 'editor-de-imagenes' ? `
      <div class="image-editor-controls">
          <label for="file-upload" class="file-upload-btn" title="${t('attach_image_title')}">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
          </label>
          <input id="file-upload" type="file" accept="image/*" style="display: none;" />
      </div>` : '';

    const renderChatForm = () => `
        <form id="chat-form">
          ${imageSettingsHtml}
          ${imageEditorControls}
          <input id="chat-input" type="text" placeholder="${placeholderText}" autocomplete="off" />
          <button id="send-button" type="submit" ${isLoading ? 'disabled' : ''}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
      `;

    root.innerHTML = `
      <nav id="server-list">
        ${Object.keys(SERVERS).map(key => `<div class="server-icon ${activeServer === key ? 'active' : ''}" data-server="${key}" title="${t(SERVERS[key as Server].nameKey)}">${SERVERS[key as Server].icon}</div>`).join('')}
      </nav>
      <aside id="sidebar">
        <div>
            <h2 class="server-name">${t(SERVERS[activeServer].nameKey)}</h2>
            <ul class="channel-list">
              ${CHANNELS.map(channel => `
                <li class="channel-item ${activeChannel === channel.id ? 'active' : ''}" data-channel-id="${channel.id}">${t(channel.nameKey)}</li>
              `).join('')}
            </ul>
        </div>
        <div id="user-panel">
            <div class="user-info">
                <div class="avatar-small" style="background-color: ${avatarColor};"></div>
                <span class="username">${username}</span>
            </div>
            <button id="settings-btn" title="${t('user_settings_title')}">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </button>
        </div>
      </aside>
      <main id="main-content">
        <header><h1>${t(`channel_${activeChannel}`)}</h1></header>
        <div id="chat-container"><div id="message-list">${messageListHtml}${loadingIndicatorHtml}</div></div>
        ${renderChatForm()}
      </main>
      ${settingsModalHtml}
    `;

    root.querySelectorAll('.server-icon').forEach(icon => {
        icon.addEventListener('click', (e) => {
            const serverId = (e.currentTarget as HTMLElement).dataset.server as Server;
            if (serverId) switchServer(serverId);
        });
    });
    
    root.querySelectorAll('.channel-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const channelId = (e.currentTarget as HTMLElement).dataset.channelId as Channel;
            if (channelId) switchChannel(channelId);
        })
    });

    root.querySelector('#chat-form')?.addEventListener('submit', handleSendMessage);
    
    root.querySelector('#settings-btn')?.addEventListener('click', openSettings);

    root.querySelectorAll('.copy-code-btn').forEach(button => {
      button.addEventListener('click', () => {
        const btn = button as HTMLButtonElement;
        const code = btn.closest('.code-block-wrapper')?.querySelector('code');
        if (code) {
          navigator.clipboard.writeText(code.innerText).then(() => {
            const btnText = btn.querySelector('span');
            if(btnText) btnText.textContent = t('copied_button_text');
            btn.classList.add('copied');
            setTimeout(() => {
              if(btnText) btnText.textContent = t('copy_button_text');
              btn.classList.remove('copied');
            }, 2000);
          }).catch(err => console.error('Failed to copy text: ', err));
        }
      });
    });

    root.querySelectorAll('.download-btn').forEach(button => button.addEventListener('click', handleDownloadImage));

    if (activeChannel === 'generar-imagenes') {
        root.querySelector('#image-settings-btn')?.addEventListener('click', toggleAspectRatioMenu);
        root.querySelectorAll('.aspect-ratio-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const ratio = (e.currentTarget as HTMLElement).dataset.ratio as AspectRatio;
                if (ratio) selectAspectRatio(ratio);
            });
        });
    }
    
    if (activeChannel === 'editor-de-imagenes') {
        root.querySelector('#file-upload')?.addEventListener('change', handleFileUpload);
    }

    if (isSettingsModalOpen) {
        root.querySelector('#settings-form')?.addEventListener('submit', handleSaveSettings);
        root.querySelector('#cancel-settings-btn')?.addEventListener('click', closeSettings);
        root.querySelector('.modal-overlay')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeSettings();
        });
        root.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', () => {
                root.querySelector('.color-swatch.selected')?.classList.remove('selected');
                swatch.classList.add('selected');
            });
        });
    }

    const messageList = root.querySelector('#message-list');
    if (messageList) messageList.scrollTop = messageList.scrollHeight;
  };

  initApp();
};

App();