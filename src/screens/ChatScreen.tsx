import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
}

interface ChatHistoryItem {
  role: 'user' | 'model';
  content: string;
}

interface Suggestion {
  text: string;
  suggestion: string;
}

const API_KEY = 'Your_API_Key';
const API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds
const TIMEOUT_DURATION = 60000; // 60 seconds

const SYSTEM_PROMPT = `Sen Pusula adlı bir eğitim platformunun AI asistanısın. Görevin öğrencilere derslerinde yardımcı olmak ve eğitim konularında rehberlik etmek.

Özelliklerin:
- Kişisel koçluk yapay zekasısın
- Öğrencilere rehberlik edersin
- YKS sınavına yönelik bir AI asistanısın
- YKS sınavına hazırlık ödevlerinde yardım edersin
- YKS sınavına hazırlık konularında rehberlik edersin
- YKS sınavına hazırlık sorularını yanıtlarsın
- YKS sınavına hazırlık ödevlerinin çözümlerini yapar ve açıklamalar yaparsın
- YKS sınavına hazırlık ödevlerinin açıklamalarını yaparsın
- YKS sınavına hazırlık ödevlerinin öğrenme stratejilerini önerirsin
- YKS sınavına hazırlık ödevlerinin öğrencileri motive edersin ve cesaretlendirirsin
- Matematik, Fizik, Kimya, Biyoloji gibi derslerde soruları yanıtlarsın
- Ödevlerde yardım edersin ve açıklamalar yaparsın
- Öğrenme stratejileri önerirsin
- Türkçe konuşursun ve samimi bir ton kullanırsın
- Karmaşık konuları basit ve anlaşılır şekilde açıklarsın
- Öğrencileri motive edersin ve cesaretlendirirsin

Kuralların:
- Cümleleri çok uzatmadan anlaşılır bir şekilde açıkla
- Sadece eğitim ve öğrenme konularında yardım et, diğer konularda da az çok yardımcı olursun
- Ödevleri tamamen çözme, sadece yol göster en son adım olarak ödevleri tamamen çözmeyi yaparsın
- Güvenli ve uygun içerik üret
- Öğrencinin yaş seviyesine uygun açıklamalar yap`;

const suggestionPool: Suggestion[] = [
  { text: "📐 Matematikte integral konusunu açıklar mısın", suggestion: "Matematikte integral konusunu açıklar mısın?" },
  { text: "⚡ Fizikte elektrik konusunda yardım eder misin", suggestion: "Fizikte elektrik konusunda yardım eder misin?" },
  { text: "🧪 Kimya organik bileşikler konusunu anlatır mısın", suggestion: "Kimya organik bileşikler konusunu anlatır mısın?" },
  { text: "🧬 Biyolojide kalıtımın genel ilkeleri konusunu açıklar mısın", suggestion: "Biyolojide kalıtımın genel ilkeleri konusunu açıklar mısın?" },
  { text: "🎯 YKS sınav stratejileri önerir misin", suggestion: "YKS sınav stratejileri önerir misin?" },
  { text: "📅 Çalışma programı nasıl hazırlarım", suggestion: "Çalışma programı nasıl hazırlarım?" },
  { text: "😌 Sınav kaygısı nasıl yönetilir", suggestion: "Sınav kaygısı nasıl yönetilir?" },
  { text: "🎯 Hangi konulara odaklanmalıyım", suggestion: "Hangi konulara odaklanmalıyım?" },
  { text: "📊 Matematikte analitik geometri konusunu açıklar mısın", suggestion: "Matematikte analitik geometri konusunu açıklar mısın?" },
  { text: "⚛️ Kimya atom teorisi konusunda yardım eder misin", suggestion: "Kimya atom teorisi konusunda yardım eder misin?" },
  { text: "🔬 Biyolojide hücre konusunu anlatır mısın", suggestion: "Biyolojide hücre konusunu anlatır mısın?" },
  { text: "🌊 Fizikte dalgalar konusunu açıklar mısın", suggestion: "Fizikte dalgalar konusunu açıklar mısın?" },
  { text: "📈 Matematikte fonksiyonlar konusunda yardım eder misin", suggestion: "Matematikte fonksiyonlar konusunda yardım eder misin?" },
  { text: "⚗️ Kimya asit-baz konusunu anlatır mısın", suggestion: "Kimya asit-baz konusunu anlatır mısın?" },
  { text: "🧠 Biyolojide sinir sistemi konusunu açıklar mısın", suggestion: "Biyolojide sinir sistemi konusunu açıklar mısın?" },
  { text: "⚙️ Fizikte mekanik konusunda yardım eder misin", suggestion: "Fizikte mekanik konusunda yardım eder misin?" },
  { text: "📚 YKS deneme sınavları nasıl çözülür", suggestion: "YKS deneme sınavları nasıl çözülür?" },
  { text: "⏰ Sınavda zaman yönetimi nasıl yapılır", suggestion: "Sınavda zaman yönetimi nasıl yapılır?" },
  { text: "🎓 Çalışma motivasyonu nasıl artırılır", suggestion: "Çalışma motivasyonu nasıl artırılır?" },
];

export default function ChatScreen() {
  const { colors } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([
    { role: 'user', content: SYSTEM_PROMPT }
  ]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const retryCountRef = useRef(0);

  // Kullanıcı adını yükle ve hoş geldin mesajı göster
  useEffect(() => {
    loadUserAndGreet();
    getRandomSuggestions();
  }, []);

  const loadUserAndGreet = async () => {
    try {
      const profileDataStr = await AsyncStorage.getItem('profileData');
      let userName = 'Değerli Kullanıcı';
      
      if (profileDataStr) {
        const profileData = JSON.parse(profileDataStr);
        if (profileData.firstName) {
          const firstName = profileData.firstName;
          userName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
        } else if (profileData.name) {
          const firstWord = profileData.name.split(' ')[0];
          userName = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
        }
      }

      const greetingMessage = `Merhaba ${userName}! 👋\n\nBen Pusula'nın AI asistanıyım. Derslerinde sana yardımcı olmak için buradayım! 📚\n\nHangi konuda yardıma ihtiyacın var? Matematik, Fizik, Kimya, Biyoloji veya başka bir dersle ilgili sorularını sorabilirsin.`;
      
      const greetingMsg: Message = {
        id: '1',
        text: greetingMessage,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages([greetingMsg]);
      setChatHistory(prev => [...prev, { role: 'model' as const, content: greetingMessage }]);
    } catch (error) {
      console.error('Kullanıcı bilgisi yüklenemedi:', error);
      const greetingMsg: Message = {
        id: '1',
        text: 'Merhaba! Ben Pusula\'nın AI asistanıyım. Size nasıl yardımcı olabilirim?',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages([greetingMsg]);
    }
  };

  const getRandomSuggestions = () => {
    const shuffled = [...suggestionPool].sort(() => 0.5 - Math.random());
    setSuggestions(shuffled.slice(0, 2));
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion);
    setShowSuggestions(false);
    setTimeout(() => {
      sendMessage(suggestion);
    }, 100);
  };

  const validateApiKey = async (): Promise<boolean> => {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`);
      if (!response.ok) {
        console.error('API Anahtarı Doğrulama Hatası');
        addMessage('API anahtarı doğrulanamadı. Lütfen internet bağlantınızı kontrol edin.', false);
        return false;
      }
      return true;
    } catch (error) {
      console.error('API Anahtarı Doğrulama Hatası:', error);
      addMessage('API anahtarı doğrulanamadı. Lütfen internet bağlantınızı kontrol edin.', false);
      return false;
    }
  };

  const sendMessage = async (messageText?: string) => {
    const message = messageText || inputText.trim();
    if (!message) return;

    // API anahtarını doğrula
    const isValid = await validateApiKey();
    if (!isValid) return;

    // Kullanıcı mesajını ekle
    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setShowSuggestions(false);

    // Chat history'ye ekle
    const newHistory: ChatHistoryItem[] = [...chatHistory, { role: 'user' as const, content: message }];
    setChatHistory(newHistory);

    // Loading mesajı ekle
    const loadingMessageId = (Date.now() + 1).toString();
    const loadingMessage: Message = {
      id: loadingMessageId,
      text: 'Düşünüyorum...',
      isUser: false,
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages(prev => [...prev, loadingMessage]);
    setIsLoading(true);
    retryCountRef.current = 0;

    try {
      await fetchAIResponse(newHistory, loadingMessageId);
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      removeLoadingMessage(loadingMessageId);
      setIsLoading(false);
    }
  };

  const fetchAIResponse = async (history: ChatHistoryItem[], loadingMessageId: string, retryCount = 0): Promise<void> => {
    try {
      const requestBody = {
        contents: history.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{
            text: msg.content
          }]
        })),
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_DURATION);

      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const responseText = await response.text();
        
        // Retry mekanizması
        if (response.status === 503 && retryCount < MAX_RETRIES) {
          retryCountRef.current = retryCount + 1;
          updateLoadingMessage(loadingMessageId, `Yeniden deneniyor (${retryCount + 1}/${MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return fetchAIResponse(history, loadingMessageId, retryCount + 1);
        }
        
        throw new Error(`API error: ${response.status} - ${responseText}`);
      }

      retryCountRef.current = 0;
      const responseText = await response.text();
      const data = JSON.parse(responseText);

      removeLoadingMessage(loadingMessageId);
      setIsLoading(false);

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const aiResponse = data.candidates[0].content.parts[0].text;
        addMessage(aiResponse, false);
        
        // Chat history'ye ekle (max 10 mesaj tut)
        const updatedHistory: ChatHistoryItem[] = [...history, { role: 'model' as const, content: aiResponse }];
        const limitedHistory: ChatHistoryItem[] = updatedHistory.length > 10 
          ? [updatedHistory[0], ...updatedHistory.slice(-9)] 
          : updatedHistory;
        setChatHistory(limitedHistory);
        
        // Yeni öneriler göster
        getRandomSuggestions();
        setShowSuggestions(true);
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (error: any) {
      console.error('Hata detayı:', error);
      removeLoadingMessage(loadingMessageId);
      setIsLoading(false);
      
      let errorMessage = 'Üzgünüm, bir hata oluştu. ';
      if (error.name === 'AbortError') {
        errorMessage += 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
      } else if (error.message.includes('503')) {
        errorMessage += 'Model şu anda yoğun. Lütfen biraz sonra tekrar deneyin.';
      } else if (error.message.includes('403')) {
        errorMessage += 'API erişim izni reddedildi. Lütfen API anahtarınızı ve izinlerinizi kontrol edin.';
      } else if (error.message.includes('401')) {
        errorMessage += 'Geçersiz API anahtarı. Lütfen API anahtarınızı kontrol edin.';
      } else {
        errorMessage += 'Lütfen tekrar deneyin.';
      }
      
      addMessage(errorMessage, false);
    }
  };

  const addMessage = (text: string, isUser: boolean) => {
    const message: Message = {
      id: Date.now().toString(),
      text: text,
      isUser: isUser,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
  };

  const removeLoadingMessage = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const updateLoadingMessage = (id: string, text: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, text } : msg
    ));
  };

  const handleQuickQuestion = (question: string) => {
    setInputText(question);
  };

  useEffect(() => {
    // Yeni mesaj geldiğinde otomatik scroll
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Basit markdown formatlama (React Native için)
  const formatMarkdown = (text: string): string => {
    // Basit formatlama - React Native'de HTML render edilemediği için sadece metin olarak gösteriyoruz
    // Bold ve italic karakterleri temizle
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '$1');
    formatted = formatted.replace(/\*(.*?)\*/g, '$1');
    // Code block'ları temizle
    formatted = formatted.replace(/```[\s\S]*?```/g, '');
    formatted = formatted.replace(/`([^`]+)`/g, '$1');
    return formatted;
  };

  const renderMessageText = (text: string, isUser: boolean) => {
    if (isUser) {
      return <Text style={[styles.messageText, styles.userText]}>{text}</Text>;
    }
    // AI mesajları için formatlanmış metin göster
    const formattedText = formatMarkdown(text);
    return (
      <Text style={[styles.messageText, styles.aiText, { color: colors.text }]}>
        {formattedText}
      </Text>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#3b82f6', '#1e40af', '#7c3aed']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerPattern}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <View style={styles.circle3} />
        </View>
        <View style={styles.headerContent}>
          <Ionicons name="chatbubble-ellipses" size={40} color="white" style={{ marginBottom: 0 }} />
          <Text style={styles.headerTitle}>Pusula AI</Text>
          <Text style={styles.headerSubtitle}>Kişisel Öğrenme Asistanınız</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView
          ref={scrollViewRef}
          style={[styles.messagesContainer, { backgroundColor: colors.background }]}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.isUser ? styles.userMessage : styles.aiMessage,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  message.isUser ? styles.userBubble : [styles.aiBubble, { backgroundColor: colors.surface, borderColor: colors.border }],
                ]}
              >
                {message.isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text
                      style={[
                        styles.messageText,
                        styles.aiText,
                        { color: colors.text, marginLeft: 8 },
                      ]}
                    >
                      {message.text}
                    </Text>
                  </View>
                ) : (
                  renderMessageText(message.text, message.isUser || false)
                )}
                {!message.isLoading && (
                  <Text
                    style={[
                      styles.messageTime,
                      message.isUser ? styles.userTime : [styles.aiTime, { color: colors.textSecondary }],
                    ]}
                  >
                    {formatTime(message.timestamp)}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Floating Suggestions */}
        {showSuggestions && suggestions.length > 0 && messages.length > 0 && !isLoading && (
          <View style={[styles.suggestionsContainer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsContent}>
              {suggestions.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.suggestionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => handleSuggestionClick(item.suggestion)}
                >
                  <Text style={[styles.suggestionText, { color: colors.primary }]}>{item.text}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            placeholder="Mesajınızı yazın..."
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isLoading}
            onSubmitEditing={() => {
              if (inputText.trim() && !isLoading) {
                sendMessage();
              }
            }}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: inputText.trim() && !isLoading ? colors.primary : colors.border },
            ]}
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.textSecondary} />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() ? 'white' : colors.textSecondary}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  headerPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
  circle1: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -50,
    left: -40,
  },
  circle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.085)',
    bottom: -30,
    right: -15,
  },
  circle3: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.065)',
    top: 15,
    right: 30,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 0,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginTop: 5,
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    padding: 20,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#3b82f6',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
  userText: {
    color: 'white',
  },
  aiText: {
    color: '#1f2937',
  },
  messageTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  userTime: {
    color: 'white',
  },
  aiTime: {
    color: '#6b7280',
  },
  quickQuestionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  quickQuestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  quickQuestionButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickQuestionText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
    backgroundColor: '#f9fafb',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  suggestionsContent: {
    paddingRight: 20,
  },
  suggestionButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  suggestionText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
});
