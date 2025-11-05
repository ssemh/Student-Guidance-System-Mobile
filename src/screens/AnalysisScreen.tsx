import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

interface AnalysisResult {
  id: string;
  type: 'konu' | 'deneme';
  subject: string;
  topic?: string;
  examName?: string;
  correctAnswers: number;
  wrongAnswers: number;
  totalQuestions: number;
  score: number;
  date: string;
}

export default function AnalysisScreen() {
  const { colors, isDarkMode } = useTheme();
  const { showToast } = useToast();
  const [analysisType, setAnalysisType] = useState<'konu' | 'deneme'>('konu');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [correctAnswers, setCorrectAnswers] = useState('');
  const [wrongAnswers, setWrongAnswers] = useState('');
  const [totalQuestions, setTotalQuestions] = useState('');
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [savedResults, setSavedResults] = useState<AnalysisResult[]>([]);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [filterSubject, setFilterSubject] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [examName, setExamName] = useState('');
  const [examNames, setExamNames] = useState<string[]>([]);
  const [showExamNameDropdown, setShowExamNameDropdown] = useState(false);
  const [userBranch, setUserBranch] = useState<string>('sayisal'); // Varsayılan sayısal

  // TÜM dersler - TYT konuları herkese açık olduğu için tüm dersler seçilebilir
  // AYT konuları branşa göre filtrelenecek
  // Not: Edebiyat kaldırıldı çünkü Türkçe ile aynı konuları kapsıyor
  const allSubjects = ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe', 'Tarih', 'Coğrafya', 'Din Kültürü', 'Felsefe'];
  
  const subjects = allSubjects;

  // Deneme analizi için özel ders listesi (alana göre)
  const getExamSubjectsByBranch = (branch: string) => {
    // Branşa göre temel dersler
    let baseSubjects: string[] = [];
    switch (branch) {
      case 'sayisal':
        baseSubjects = ['Matematik', 'Fizik', 'Kimya', 'Biyoloji'];
        break;
      case 'sozel':
        baseSubjects = ['Türkçe', 'Tarih', 'Coğrafya', 'Din Kültürü', 'Felsefe'];
        break;
      case 'esit-agirlik':
        baseSubjects = ['Türkçe', 'Matematik', 'Tarih', 'Coğrafya', 'Felsefe'];
        break;
      default:
        baseSubjects = allSubjects;
    }
    
    const examList = baseSubjects.map((subject: string) => `${subject} Denemesi`);
    
    // Ortak denemeler
    examList.push('TYT Denemesi');
    
    if (branch === 'sayisal') {
      examList.push('AYT Sayısal Denemesi', 'Fen Bilimleri Denemesi');
    } else if (branch === 'sozel') {
      examList.push('AYT Sözel Denemesi', 'Sosyal Bilimler Denemesi');
    } else if (branch === 'esit-agirlik') {
      examList.push('AYT Eşit Ağırlık Denemesi', 'Sosyal Bilimler Denemesi');
    }
    
    return examList;
  };

  const examSubjects = getExamSubjectsByBranch(userBranch);
  
  // TYT konuları - TÜM branşlarda STANDART (herkese aynı)
  const tytTopics: {[key: string]: string[]} = {
    'Matematik': [
      'Temel Kavramlar',
      'Sayılar',
      'Rasyonel Sayılar',
      'Eşitsizlikler',
      'Mutlak Değer',
      'Üslü Sayılar',
      'Köklü Sayılar',
      'Çarpanlara Ayırma',
      'Oran-Orantı',
      'Denklemler',
      'Problemler',
      'Fonksiyonlar',
      'Geometri Temelleri'
    ],
    'Fizik': [
      'Fizik Bilimine Giriş',
      'Madde ve Özellikleri',
      'Hareket ve Kuvvet',
      'Enerji',
      'Isı ve Sıcaklık',
      'Basınç',
      'Elektrik Temelleri',
      'Manyetizma Temelleri'
    ],
    'Kimya': [
      'Kimya Bilimi',
      'Atom ve Yapısı',
      'Periyodik Sistem',
      'Kimyasal Bağlar',
      'Mol Kavramı',
      'Gazlar',
      'Çözeltiler',
      'Asit-Baz'
    ],
    'Biyoloji': [
      'Canlıların Yapısı',
      'Hücre',
      'Sistemler',
      'Kalıtım',
      'Ekoloji',
      'Bitki Biyolojisi',
      'Hayvan Biyolojisi',
      'İnsan Biyolojisi'
    ],
    'Türkçe': [
      'Paragraf',
      'Dil Bilgisi',
      'Anlatım Bozuklukları',
      'Noktalama İşaretleri',
      'Yazım Kuralları',
      'Ses Bilgisi',
      'Kelime Bilgisi',
      'Cümle Bilgisi'
    ],
    'Tarih': [
      'İlk Uygarlıklar',
      'İslam Tarihi',
      'Türk-İslam Tarihi',
      'Osmanlı Kuruluş',
      'Osmanlı Yükselme',
      'Osmanlı Duraklama',
      'Osmanlı Gerileme',
      'Osmanlı Dağılma'
    ],
    'Coğrafya': [
      'Doğa ve İnsan',
      'Dünya\'da İklimler',
      'Türkiye\'nin İklimi',
      'Nüfus ve Yerleşme',
      'Ekonomik Faaliyetler',
      'Türkiye\'nin Coğrafi Konumu',
      'Türkiye\'nin Fiziki Coğrafyası',
      'Türkiye\'nin Beşeri Coğrafyası'
    ],
    'Felsefe': [
      'Felsefeye Giriş',
      'Bilgi Felsefesi',
      'Varlık Felsefesi',
      'Ahlak Felsefesi',
      'Sanat Felsefesi',
      'Din Felsefesi',
      'Siyaset Felsefesi',
      'Bilim Felsefesi'
    ],
    'Din Kültürü': [
      'İslam Dini Temel Bilgileri',
      'Kur\'an-ı Kerim',
      'Hz. Muhammed\'in Hayatı',
      'İslam Ahlakı',
      'İbadetler',
      'İslam Tarihi',
      'İslam Kültürü',
      'Din ve Toplum'
    ]
  };

  // AYT konuları - Branşa göre dinamik
  const aytTopics: {[key: string]: {[branch: string]: string[]}} = {
    'Matematik': {
      'sayisal': [
        'Polinomlar',
        'İkinci Dereceden Denklemler',
        'Trigonometri',
        'Logaritma',
        'Limit ve Türev',
        'İntegral',
        'Analitik Geometri',
        'Diziler ve Seriler',
        'Olasılık',
        'İstatistik'
      ],
      'esit-agirlik': [
        'Polinomlar',
        'İkinci Dereceden Denklemler',
        'Trigonometri',
        'Logaritma',
        'Limit ve Türev',
        'İntegral',
        'Analitik Geometri',
        'Diziler ve Seriler',
        'Olasılık',
        'İstatistik'
      ],
      'sozel': []
    },
    'Fizik': {
      'sayisal': [
        'Elektrik ve Manyetizma',
        'Dalgalar',
        'Modern Fizik',
        'Atom Fiziği',
        'Nükleer Fizik',
        'Optik',
        'Mekanik',
        'Termodinamik',
        'Elektromanyetik Dalgalar',
        'Fizikte Matematiksel Yöntemler'
      ],
      'esit-agirlik': [],
      'sozel': []
    },
    'Kimya': {
      'sayisal': [
        'Gazlar',
        'Sıvı Çözeltiler',
        'Kimyasal Tepkimeler',
        'Organik Kimya',
        'Kimyasal Hesaplamalar',
        'Elektrokimya',
        'Termokimya',
        'Kimyasal Denge',
        'Çözünürlük Dengesi',
        'Kimyasal Kinetik'
      ],
      'esit-agirlik': [],
      'sozel': []
    },
    'Biyoloji': {
      'sayisal': [
        'Protein Sentezi',
        'Fotosentez',
        'Solunum',
        'Evrim',
        'Biyoteknoloji',
        'Genetik',
        'Populasyon Genetiği',
        'Ekosistem',
        'Hücresel Solunum',
        'Bitki Fizyolojisi'
      ],
      'esit-agirlik': [],
      'sozel': []
    },
    'Türkçe': {
      'sayisal': [],
      'esit-agirlik': [
        'Eski Türk Edebiyatı',
        'Tanzimat Edebiyatı',
        'Servet-i Fünun Edebiyatı',
        'Milli Edebiyat',
        'Cumhuriyet Dönemi Edebiyatı',
        'Çağdaş Türk Edebiyatı',
        'Dünya Edebiyatı',
        'Edebiyat Akımları'
      ],
      'sozel': [
        'Eski Türk Edebiyatı',
        'Tanzimat Edebiyatı',
        'Servet-i Fünun Edebiyatı',
        'Milli Edebiyat',
        'Cumhuriyet Dönemi Edebiyatı',
        'Çağdaş Türk Edebiyatı',
        'Dünya Edebiyatı',
        'Edebiyat Akımları'
      ]
    },
    'Tarih': {
      'sayisal': [],
      'esit-agirlik': [
        'İlk Çağ Uygarlıkları',
        'Orta Çağ Tarihi',
        'Yeni Çağ Tarihi',
        'Yakın Çağ Tarihi',
        'Türkiye Cumhuriyeti Tarihi',
        'Dünya Savaşları',
        'Soğuk Savaş Dönemi',
        'Günümüz Dünyası'
      ],
      'sozel': [
        'İlk Çağ Uygarlıkları',
        'Orta Çağ Tarihi',
        'Yeni Çağ Tarihi',
        'Yakın Çağ Tarihi',
        'Türkiye Cumhuriyeti Tarihi',
        'Dünya Savaşları',
        'Soğuk Savaş Dönemi',
        'Günümüz Dünyası'
      ]
    },
    'Coğrafya': {
      'sayisal': [],
      'esit-agirlik': [
        'Fiziki Coğrafya',
        'Beşeri Coğrafya',
        'Ekonomik Coğrafya',
        'Siyasi Coğrafya',
        'Çevre ve Toplum',
        'Küresel Ortam',
        'Bölgeler ve Ülkeler',
        'Türkiye Coğrafyası'
      ],
      'sozel': [
        'Fiziki Coğrafya',
        'Beşeri Coğrafya',
        'Ekonomik Coğrafya',
        'Siyasi Coğrafya',
        'Çevre ve Toplum',
        'Küresel Ortam',
        'Bölgeler ve Ülkeler',
        'Türkiye Coğrafyası'
      ]
    },
    'Felsefe': {
      'sayisal': [],
      'esit-agirlik': [
        'Felsefe Tarihi',
        'Mantık',
        'Psikoloji',
        'Sosyoloji',
        'Mantık ve Akıl Yürütme',
        'Felsefi Düşünce',
        'Felsefe ve Bilim',
        'Felsefe ve Sanat'
      ],
      'sozel': [
        'Felsefe Tarihi',
        'Mantık',
        'Psikoloji',
        'Sosyoloji',
        'Mantık ve Akıl Yürütme',
        'Felsefi Düşünce',
        'Felsefe ve Bilim',
        'Felsefe ve Sanat'
      ]
    },
    'Din Kültürü': {
      'sayisal': [],
      'esit-agirlik': [],
      'sozel': [
        'İslam Dini Temel Bilgileri',
        'Kur\'an-ı Kerim',
        'Hz. Muhammed\'in Hayatı',
        'İslam Ahlakı',
        'İbadetler',
        'İslam Tarihi',
        'İslam Kültürü',
        'Din ve Toplum'
      ]
    }
  };

  // Ders seçildiğinde konuları getir: TYT (herkese) + AYT (branşa göre)
  const getTopicsBySubject = (subject: string) => {
    // TYT konuları - HERKES İÇİN STANDART
    const tyt = tytTopics[subject] || [];
    
    // AYT konuları - BRANŞA GÖRE
    const aytBranchData = aytTopics[subject];
    const ayt = aytBranchData ? (aytBranchData[userBranch as keyof typeof aytBranchData] || []) : [];
    
    // TYT + AYT birleştir
    return [...tyt, ...ayt];
  };

  // Seçilen dersin konularını al (liste)
  const topicList = selectedSubject ? getTopicsBySubject(selectedSubject) : [];

  // Profil verilerini yükle
  useEffect(() => {
    loadSavedResults();
    loadExamNames();
  }, []);

  // Sayfa her açıldığında profil verilerini kontrol et
  useFocusEffect(
    useCallback(() => {
      loadProfileBranch();
    }, [])
  );

  // Kullanıcının seçtiği alanı yükle
  const loadProfileBranch = async () => {
    try {
      const data = await AsyncStorage.getItem('profileData');
      if (data) {
        const parsedData = JSON.parse(data);
        if (parsedData.branch) {
          setUserBranch(parsedData.branch);
        }
      }
    } catch (error) {
      console.log('Profil verisi yüklenemedi:', error);
    }
  };

  // Deneme adlarını yükle
  const loadExamNames = async () => {
    try {
      let saved;
      if (typeof window !== 'undefined' && window.localStorage) {
        saved = localStorage.getItem('pusula-exam-names');
      } else {
        saved = await SecureStore.getItemAsync('pusula-exam-names');
      }
      
      if (saved) {
        setExamNames(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Deneme adları yüklenirken hata:', error);
    }
  };

  // Deneme adlarını kaydet
  const saveExamNames = async (names: string[]) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('pusula-exam-names', JSON.stringify(names));
      } else {
        await SecureStore.setItemAsync('pusula-exam-names', JSON.stringify(names));
      }
    } catch (error) {
      console.log('Deneme adları kaydedilirken hata:', error);
    }
  };

  // Kaydedilen sonuçları yükle (web için localStorage, mobil için SecureStore)
  const loadSavedResults = async () => {
    try {
      let saved;
      if (typeof window !== 'undefined' && window.localStorage) {
        // Web ortamında localStorage kullan
        saved = localStorage.getItem('pusula-analysis-results');
      } else {
        // Mobil ortamda SecureStore kullan
        saved = await SecureStore.getItemAsync('pusula-analysis-results');
      }
      
      if (saved) {
        setSavedResults(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Veri yüklenirken hata:', error);
    }
  };

  // Sonuçları kaydet (web için localStorage, mobil için SecureStore)
  const saveToSecureStore = async (results: AnalysisResult[]) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Web ortamında localStorage kullan
        localStorage.setItem('pusula-analysis-results', JSON.stringify(results));
      } else {
        // Mobil ortamda SecureStore kullan
        await SecureStore.setItemAsync('pusula-analysis-results', JSON.stringify(results));
      }
    } catch (error) {
      console.log('Veri kaydedilirken hata:', error);
    }
  };

  const calculateNet = () => {
    const correct = parseInt(correctAnswers) || 0;
    const wrong = parseInt(wrongAnswers) || 0;
    
    // 4 yanlış 1 doğruyu götürür
    const net = correct - (wrong / 4);
    return Math.max(0, Math.round(net * 100) / 100); // En az 0, 2 ondalık
  };

  const calculateScore = () => {
    const correct = parseInt(correctAnswers) || 0;
    const wrong = parseInt(wrongAnswers) || 0;
    const total = parseInt(totalQuestions) || 0;
    
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const handleAnalyze = () => {
    if (!totalQuestions || !correctAnswers || !wrongAnswers) {
      showToast('Lütfen tüm alanları doldurun', 'error', 'Hata');
      return;
    }
    
    if (analysisType === 'konu' && !selectedSubject) {
      showToast('Lütfen bir ders seçin', 'error', 'Hata');
      return;
    }
    
    if (analysisType === 'konu' && !selectedTopic) {
      showToast('Lütfen bir konu seçin', 'error', 'Hata');
      return;
    }
    
    setIsAnalyzed(true);
  };

  const handleSave = async () => {
    if (!isAnalyzed) return;
    
    const newResult: AnalysisResult = {
      id: Date.now().toString(),
      type: analysisType,
      subject: selectedSubject,
      topic: analysisType === 'konu' ? selectedTopic : undefined,
      examName: analysisType === 'deneme' ? examName : undefined,
      correctAnswers: parseInt(correctAnswers),
      wrongAnswers: parseInt(wrongAnswers),
      totalQuestions: parseInt(totalQuestions),
      score: calculateScore(),
      date: new Date().toLocaleDateString('tr-TR'),
    };
    
    const updatedResults = [newResult, ...savedResults];
    setSavedResults(updatedResults);
    await saveToSecureStore(updatedResults); // SecureStore'a kaydet
    
    // Deneme adını kaydet (sadece deneme analizi için)
    if (analysisType === 'deneme' && examName.trim()) {
      const trimmedExamName = examName.trim();
      if (!examNames.includes(trimmedExamName)) {
        const updatedExamNames = [trimmedExamName, ...examNames];
        setExamNames(updatedExamNames);
        await saveExamNames(updatedExamNames);
      }
    }
    
    // Formu temizle - yeni analiz için hazırla
    setIsAnalyzed(false);
    setCorrectAnswers('');
    setWrongAnswers('');
    setTotalQuestions('');
    setSelectedSubject(''); // Ders seçimini temizle
    setSelectedTopic(''); // Konu seçimini temizle
    setExamName(''); // Deneme adını temizle
    
    showToast('Analiz sonucu kaydedildi!', 'success', 'Başarılı');
  };

  const handleDelete = async (id: string) => {
    console.log('Silme butonu tıklandı, ID:', id);
    
    // Web için confirm kullan
    if (typeof window !== 'undefined' && window.confirm) {
      const confirmed = window.confirm('Bu sonucu silmek istediğinizden emin misiniz?');
      if (confirmed) {
        console.log('Silme onaylandı, ID:', id);
        const updatedResults = savedResults.filter(result => result.id !== id);
        console.log('Güncellenmiş sonuçlar:', updatedResults.length);
        setSavedResults(updatedResults);
        await saveToSecureStore(updatedResults);
        console.log('Silme tamamlandı');
      }
    } else {
      // Mobil için Alert kullan
      Alert.alert(
        'Silme Onayı',
        'Bu sonucu silmek istediğinizden emin misiniz?',
        [
          { text: 'İptal', style: 'cancel' },
          { 
            text: 'Sil', 
            style: 'destructive',
            onPress: async () => {
              console.log('Silme onaylandı, ID:', id);
              const updatedResults = savedResults.filter(result => result.id !== id);
              console.log('Güncellenmiş sonuçlar:', updatedResults.length);
              setSavedResults(updatedResults);
              await saveToSecureStore(updatedResults);
              console.log('Silme tamamlandı');
            }
          },
        ]
      );
    }
  };

  // Deneme adı silme fonksiyonu
  const handleDeleteExamName = async (nameToDelete: string) => {
    if (typeof window !== 'undefined' && window.confirm) {
      const confirmed = window.confirm(`"${nameToDelete}" deneme adını silmek istediğinizden emin misiniz?`);
      if (confirmed) {
        const updatedExamNames = examNames.filter(name => name !== nameToDelete);
        setExamNames(updatedExamNames);
        await saveExamNames(updatedExamNames);
        
        // Eğer silinen ad seçiliyse, seçimi temizle
        if (examName === nameToDelete) {
          setExamName('');
        }
      }
    } else {
      Alert.alert(
        'Silme Onayı',
        `"${nameToDelete}" deneme adını silmek istediğinizden emin misiniz?`,
        [
          { text: 'İptal', style: 'cancel' },
          { 
            text: 'Sil', 
            style: 'destructive',
            onPress: async () => {
              const updatedExamNames = examNames.filter(name => name !== nameToDelete);
              setExamNames(updatedExamNames);
              await saveExamNames(updatedExamNames);
              
              // Eğer silinen ad seçiliyse, seçimi temizle
              if (examName === nameToDelete) {
                setExamName('');
              }
            }
          },
        ]
      );
    }
  };

  const score = calculateScore();

  // Filtrelenmiş sonuçları hesapla
  const filteredResults = savedResults.filter(result => {
    // Önce analiz türüne göre filtrele
    const typeMatch = result.type === analysisType;
    
    // Sonra ders filtresine göre filtrele
    const subjectMatch = !filterSubject || result.subject === filterSubject;
    
    return typeMatch && subjectMatch;
  });

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
          <Ionicons name="analytics" size={40} color="white" style={{ marginBottom: 0 }} />
          <Text style={styles.headerTitle}>Çözüm Analizi</Text>
          <Text style={styles.headerSubtitle}>Başarını takip et ve geliştir</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Analiz Türü Seçimi */}
        <View style={styles.analysisTypeSelector}>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics" size={24} color="#3b82f6" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Analiz Türü</Text>
          </View>
          <View style={styles.typeButtons}>
            <TouchableOpacity
              style={styles.typeButtonContainer}
              onPress={() => {
                setAnalysisType('konu');
                setIsAnalyzed(false);
                setSelectedSubject('');
                setSelectedTopic('');
                setFilterSubject('');
              }}
              activeOpacity={0.9}
            >
              {analysisType === 'konu' ? (
                <LinearGradient
                  colors={['#3b82f6', '#2563eb', '#1d4ed8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.typeButtonCard, { borderWidth: 0 }]}
                >
                  <View style={styles.typeButtonIconContainer}>
                    <Ionicons name="book" size={18} color="white" />
                  </View>
                  <Text style={styles.selectedTypeButtonTitle}>Konu Analizi</Text>
                  <Text style={styles.selectedTypeButtonSubtitle}>Konu bazlı analiz</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.typeButtonCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.typeButtonIconContainer, { backgroundColor: colors.surface }]}>
                    <Ionicons name="book" size={18} color="#3b82f6" />
                  </View>
                  <Text style={[styles.typeButtonTitle, { color: colors.text }]}>Konu Analizi</Text>
                  <Text style={[styles.typeButtonSubtitle, { color: colors.textSecondary }]}>Konu bazlı analiz</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.typeButtonContainer}
              onPress={() => {
                setAnalysisType('deneme');
                setIsAnalyzed(false);
                setSelectedSubject('');
                setSelectedTopic('');
                setFilterSubject('');
              }}
              activeOpacity={0.9}
            >
              {analysisType === 'deneme' ? (
                <LinearGradient
                  colors={['#8b5cf6', '#7c3aed', '#6d28d9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.typeButtonCard, { borderWidth: 0 }]}
                >
                  <View style={styles.typeButtonIconContainer}>
                    <Ionicons name="document-text" size={18} color="white" />
                  </View>
                  <Text style={styles.selectedTypeButtonTitle}>Deneme Analizi</Text>
                  <Text style={styles.selectedTypeButtonSubtitle}>Sınav sonuç analizi</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.typeButtonCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.typeButtonIconContainer, { backgroundColor: colors.surface }]}>
                    <Ionicons name="document-text" size={18} color="#8b5cf6" />
                  </View>
                  <Text style={[styles.typeButtonTitle, { color: colors.text }]}>Deneme Analizi</Text>
                  <Text style={[styles.typeButtonSubtitle, { color: colors.textSecondary }]}>Sınav sonuç analizi</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Ders Seçimi - Modal */}
        <View style={styles.dropdownSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="school" size={24} color="#3b82f6" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Ders Seç</Text>
          </View>
          <TouchableOpacity
            style={[styles.dropdownButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              setShowSubjectDropdown(true);
              setShowTopicDropdown(false);
            }}
          >
            <Ionicons name="book-outline" size={20} color={selectedSubject ? '#3b82f6' : colors.textSecondary} />
            <Text style={[
              styles.dropdownButtonText,
              { color: colors.text },
              !selectedSubject && styles.placeholderText
            ]}>
              {selectedSubject || 'Ders seçiniz...'}
            </Text>
            <Ionicons 
              name="chevron-down" 
              size={20} 
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Ders Seçimi Modal */}
        <Modal
          visible={showSubjectDropdown}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSubjectDropdown(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowSubjectDropdown(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Ders Seçin</Text>
                <TouchableOpacity
                  onPress={() => setShowSubjectDropdown(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={true}>
                {(analysisType === 'deneme' ? examSubjects : subjects).map((subject) => (
                  <TouchableOpacity
                    key={subject}
                    style={[styles.modalItem, { backgroundColor: colors.surface }]}
                    onPress={() => {
                      setSelectedSubject(subject);
                      setSelectedTopic('');
                      setShowSubjectDropdown(false);
                      setIsAnalyzed(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, { color: colors.text }]}>{subject}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Konu Seçimi - Modal (Sadece Konu Analizi için) */}
        {analysisType === 'konu' && (
          <View style={styles.dropdownSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="list" size={24} color="#3b82f6" />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Konu Seç</Text>
            </View>
            <TouchableOpacity
              style={[styles.dropdownButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                if (selectedSubject) {
                  setShowTopicDropdown(true);
                  setShowSubjectDropdown(false);
                }
              }}
            >
              <Ionicons name="layers-outline" size={20} color={selectedTopic ? '#3b82f6' : colors.textSecondary} />
              <Text style={[
                styles.dropdownButtonText,
                { color: colors.text },
                !selectedTopic && styles.placeholderText
              ]}>
                {selectedTopic || (selectedSubject ? 'Konu seçiniz...' : 'Önce dersi seçiniz')}
              </Text>
              <Ionicons 
                name="chevron-down" 
                size={20} 
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Konu Seçimi Modal */}
        <Modal
          visible={showTopicDropdown && selectedSubject !== ''}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowTopicDropdown(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowTopicDropdown(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Konu Seçin</Text>
                <TouchableOpacity
                  onPress={() => setShowTopicDropdown(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={true}>
                {topicList.map((topic) => (
                  <TouchableOpacity
                    key={topic}
                    style={[styles.modalItem, { backgroundColor: colors.surface }]}
                    onPress={() => {
                      setSelectedTopic(topic);
                      setShowTopicDropdown(false);
                      setIsAnalyzed(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, { color: colors.text }]}>{topic}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Deneme Adı Girişi (Sadece Deneme Analizi için) */}
        {analysisType === 'deneme' && (
          <View style={styles.inputSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={24} color="#3b82f6" />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Deneme Adı</Text>
            </View>
            
            {/* Manuel Giriş - Üstte */}
            <View style={styles.inputWrapper}>
              <Ionicons name="create-outline" size={20} color="#3b82f6" style={styles.inputIcon} />
              <TextInput
                style={[styles.examNameInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Yeni deneme adı girin"
                placeholderTextColor={colors.textSecondary}
                value={examName}
                onChangeText={setExamName}
              />
            </View>
            
            {/* Kaydedilen Deneme Adları - Altta */}
            <TouchableOpacity
              style={[styles.examNameSelectButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowExamNameDropdown(true)}
            >
              <Ionicons name="folder-outline" size={20} color={colors.textSecondary} />
              <Text style={[
                examName && examNames.includes(examName) ? styles.examNameSelectedText : styles.examNamePlaceholderText,
                { color: colors.text }
              ]}>
                {examName && examNames.includes(examName) ? examName : 'Deneme Adları'}
              </Text>
              <Ionicons 
                name="chevron-down" 
                size={20} 
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {/* Geçmiş Deneme Adları Modal */}
            <Modal
              visible={showExamNameDropdown}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowExamNameDropdown(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowExamNameDropdown(false)}
              >
                <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Kaydedilen Deneme Adları</Text>
                    <TouchableOpacity
                      onPress={() => setShowExamNameDropdown(false)}
                      style={styles.modalCloseButton}
                    >
                      <Ionicons name="close" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  
                  <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={true}>
                    {examNames.length > 0 ? (
                      examNames.map((name, index) => (
                        <View key={index} style={styles.examNameItemContainer}>
                          <TouchableOpacity
                            style={styles.examNameItem}
                            onPress={() => {
                              setExamName(name);
                              setShowExamNameDropdown(false);
                            }}
                          >
                            <Text style={styles.examNameItemText}>{name}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.examNameDeleteButton}
                            onPress={() => handleDeleteExamName(name)}
                          >
                            <Ionicons name="trash" size={16} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      ))
                    ) : (
                      <View style={styles.emptyStateContainer}>
                        <Text style={styles.emptyStateText}>Henüz kaydedilmiş deneme adı yok</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        )}

        {/* Sonuç Girişi */}
        <View style={styles.inputSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calculator" size={24} color="#3b82f6" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Sonuçlarını Gir</Text>
          </View>
          
          <View style={styles.inputContainer}>
            <View style={styles.inputLabelContainer}>
              <Ionicons name="help-circle-outline" size={18} color="#6b7280" />
              <Text style={[styles.inputLabel, { color: colors.text }]}>Toplam Soru Sayısı</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Toplam soru sayısını giriniz"
                placeholderTextColor={colors.textSecondary}
                value={totalQuestions}
                onChangeText={(text) => {
                  setTotalQuestions(text);
                  setIsAnalyzed(false);
                }}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputLabelContainer}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#10b981" />
              <Text style={[styles.inputLabel, { color: colors.text }]}>Doğru Sayısı</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Doğru sayısını giriniz"
                placeholderTextColor={colors.textSecondary}
                value={correctAnswers}
                onChangeText={(text) => {
                  setCorrectAnswers(text);
                  setIsAnalyzed(false);
                }}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputLabelContainer}>
              <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
              <Text style={[styles.inputLabel, { color: colors.text }]}>Yanlış Sayısı</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Yanlış sayısını giriniz"
                placeholderTextColor={colors.textSecondary}
                value={wrongAnswers}
                onChangeText={(text) => {
                  setWrongAnswers(text);
                  setIsAnalyzed(false);
                }}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Analiz Et Butonu */}
        <TouchableOpacity
          style={styles.analyzeButton}
          onPress={handleAnalyze}
          disabled={!totalQuestions || !correctAnswers || !wrongAnswers || (analysisType === 'konu' && (!selectedSubject || !selectedTopic))}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#10b981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.analyzeButtonGradient}
          >
            <Ionicons name="analytics" size={22} color="white" />
            <Text style={styles.analyzeButtonText}>Analiz Et</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Analiz Sonucu */}
        {isAnalyzed && (
          <View style={styles.resultSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trophy" size={24} color="#f59e0b" />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Analiz Sonucu</Text>
            </View>
            
            <LinearGradient
              colors={isDarkMode ? [colors.card, colors.surface] : ['#ffffff', '#f9fafb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.scoreCard}
            >
              <View style={[styles.scoreIconContainer, { backgroundColor: isDarkMode ? colors.surface : '#f3f4f6' }]}>
                <Ionicons name="stats-chart" size={32} color={getScoreColor(score)} />
              </View>
              <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>Başarı Oranı</Text>
              <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}>
                %{score}
              </Text>
              <View style={[styles.scoreBar, { backgroundColor: isDarkMode ? colors.border : '#e5e7eb' }]}>
                <LinearGradient
                  colors={score >= 80 ? ['#10b981', '#059669'] : score >= 60 ? ['#f59e0b', '#d97706'] : ['#ef4444', '#dc2626']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.scoreBarFill, { width: `${score}%` }]}
                />
              </View>
            </LinearGradient>

            <LinearGradient
              colors={isDarkMode ? [colors.card, colors.surface] : ['#ffffff', '#f9fafb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.netCard}
            >
              <View style={[styles.netIconContainer, { backgroundColor: isDarkMode ? colors.surface : '#f3f4f6' }]}>
                <Ionicons name="calculator" size={32} color={getScoreColor(score)} />
              </View>
              <Text style={[styles.netLabel, { color: colors.textSecondary }]}>Net Sayısı</Text>
              <Text style={[styles.netValue, { color: getScoreColor(score) }]}>
                {calculateNet().toFixed(2)}
              </Text>
              <Text style={[styles.netDescription, { color: colors.textSecondary }]}>
                4 yanlış = 1 doğru götürür
              </Text>
            </LinearGradient>

            <View style={styles.statsGrid}>
              <LinearGradient
                colors={isDarkMode ? [colors.card, colors.surface] : ['#ffffff', '#f0fdf4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statCard}
              >
                <View style={[styles.statIconContainer, { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5' }]}>
                  <Ionicons name="checkmark-circle" size={28} color="#10b981" />
                </View>
                <Text style={[styles.statNumber, { color: colors.text }]}>{correctAnswers || 0}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Doğru</Text>
              </LinearGradient>
              
              <LinearGradient
                colors={isDarkMode ? [colors.card, colors.surface] : ['#ffffff', '#fef2f2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statCard}
              >
                <View style={[styles.statIconContainer, { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2' }]}>
                  <Ionicons name="close-circle" size={28} color="#ef4444" />
                </View>
                <Text style={[styles.statNumber, { color: colors.text }]}>{wrongAnswers || 0}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Yanlış</Text>
              </LinearGradient>
              
              <LinearGradient
                colors={isDarkMode ? [colors.card, colors.surface] : ['#ffffff', '#f9fafb']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statCard}
              >
                <View style={[styles.statIconContainer, { backgroundColor: isDarkMode ? colors.surface : '#f3f4f6' }]}>
                  <Ionicons name="help-circle" size={28} color={colors.textSecondary} />
                </View>
                <Text style={[styles.statNumber, { color: colors.text }]}>
                  {(parseInt(totalQuestions) || 0) - (parseInt(correctAnswers) || 0) - (parseInt(wrongAnswers) || 0)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Boş</Text>
              </LinearGradient>
            </View>

            {/* Kaydet Butonu */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveButtonGradient}
              >
                <Ionicons name="save" size={22} color="white" />
                <Text style={styles.saveButtonText}>Kaydet</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}


        {/* Geçmiş Sonuçlar */}
        {savedResults.length > 0 && (
          <View style={styles.historySection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time" size={24} color="#3b82f6" />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Geçmiş Sonuçlar</Text>
            </View>
            
            {/* Ders Filtresi */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>Ders Filtresi:</Text>
              <TouchableOpacity
                style={[styles.filterDropdownButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setShowFilterDropdown(true)}
              >
                <Text style={[styles.filterDropdownButtonText, { color: colors.text }]}>
                  {filterSubject || 'Tüm Dersler'}
                </Text>
                <Ionicons 
                  name="chevron-down" 
                  size={20} 
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Modal Dropdown */}
            <Modal
              visible={showFilterDropdown}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowFilterDropdown(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowFilterDropdown(false)}
              >
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                  <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Ders Seçin</Text>
                    <TouchableOpacity
                      onPress={() => setShowFilterDropdown(false)}
                      style={styles.modalCloseButton}
                    >
                      <Ionicons name="close" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  
                  <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={true}>
                    <TouchableOpacity
                      style={[styles.modalItem, { borderBottomColor: colors.border }]}
                      onPress={() => {
                        setFilterSubject('');
                        setShowFilterDropdown(false);
                      }}
                    >
                      <Text style={[styles.modalItemText, { color: colors.text }]}>Tüm Dersler</Text>
                    </TouchableOpacity>
                    {(analysisType === 'konu' ? subjects : examSubjects).map((subject) => (
                      <TouchableOpacity
                        key={subject}
                        style={[styles.modalItem, { borderBottomColor: colors.border }]}
                        onPress={() => {
                          setFilterSubject(subject);
                          setShowFilterDropdown(false);
                        }}
                      >
                        <Text style={[styles.modalItemText, { color: colors.text }]}>{subject}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </Modal>
            
            {filteredResults.map((result) => (
              <View
                key={result.id}
                style={[styles.historyCard, { backgroundColor: colors.card }]}
              >
                <View style={styles.historyHeader}>
                  <View style={styles.historyInfo}>
                    <View style={styles.historyTypeContainer}>
                      <Ionicons 
                        name={result.type === 'konu' ? 'book' : 'document-text'} 
                        size={20} 
                        color={colors.primary}
                      />
                      <Text style={[styles.historyType, { color: colors.primary }]}>
                        {result.type === 'konu' ? 'Konu Analizi' : 'Deneme Analizi'}
                      </Text>
                    </View>
                    <Text style={[styles.historySubject, { color: colors.text }]}>
                      {result.subject}
                      {result.topic && ` - ${result.topic}`}
                      {result.examName && ` (${result.examName})`}
                    </Text>
                    <View style={styles.historyDateContainer}>
                      <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                      <Text style={[styles.historyDate, { color: colors.textSecondary }]}>{result.date}</Text>
                    </View>
                  </View>
                  
                  <LinearGradient
                    colors={result.score >= 80 ? ['#10b981', '#059669'] : result.score >= 60 ? ['#f59e0b', '#d97706'] : ['#ef4444', '#dc2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.historyScoreBadge}
                  >
                    <Text style={styles.historyScoreText}>%{result.score}</Text>
                    <Text style={styles.historyScoreLabel}>Başarı</Text>
                  </LinearGradient>
                </View>
                
                <View style={styles.historyStats}>
                  <View style={styles.historyStatItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={[styles.historyStat, { color: colors.text }]}>Doğru: {result.correctAnswers}</Text>
                  </View>
                  <View style={styles.historyStatItem}>
                    <Ionicons name="close-circle" size={16} color="#ef4444" />
                    <Text style={[styles.historyStat, { color: colors.text }]}>Yanlış: {result.wrongAnswers}</Text>
                  </View>
                  <View style={styles.historyStatItem}>
                    <Ionicons name="help-circle" size={16} color={colors.textSecondary} />
                    <Text style={[styles.historyStat, { color: colors.text }]}>Toplam: {result.totalQuestions}</Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(result.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash" size={18} color="white" />
                  <Text style={styles.deleteButtonText}>Sil</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    zIndex: 0,
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
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.11)',
    top: -45,
    right: -50,
  },
  circle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: -35,
    left: -20,
  },
  circle3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    top: 30,
    left: 50,
  },
  headerContent: {
    alignItems: 'center',
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
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  analysisTypeSelector: {
    marginBottom: 25,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButtonContainer: {
    flex: 1,
    maxWidth: '48%',
  },
  typeButtonCard: {
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 85,
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 2,
  },
  typeButtonIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  selectedTypeButtonTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
    textAlign: 'center',
  },
  selectedTypeButtonSubtitle: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 11,
  },
  typeButtonTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'center',
  },
  typeButtonSubtitle: {
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 11,
  },
  dropdownSection: {
    marginBottom: 25,
    position: 'relative',
    zIndex: 1,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    minHeight: 50,
    gap: 10,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  placeholderText: {
    color: '#9ca3af',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    marginTop: 5,
    maxHeight: 200,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dropdownItem: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1f2937',
  },
  inputSection: {
    marginBottom: 25,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  inputWrapper: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 15,
    top: 14,
    zIndex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#374151',
  },
  analyzeButton: {
    borderRadius: 12,
    marginBottom: 25,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  analyzeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  resultSection: {
    marginBottom: 25,
  },
  scoreCard: {
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  scoreIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  netCard: {
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  netIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  netLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  netValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  netDescription: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 10,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  scoreBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  historySection: {
    marginBottom: 25,
  },
  historyCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  historyTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  historyDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  historyScoreBadge: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  historyInfo: {
    flex: 1,
  },
  historyType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  historySubject: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  historyDate: {
    fontSize: 14,
  },
  historyScoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  historyScoreLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  historyStats: {
    marginBottom: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  historyStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: '30%',
  },
  historyStat: {
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    borderWidth: 1,
    borderColor: '#dc2626',
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  // Filtreleme stilleri
  filterSection: {
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  filterDropdownSection: {
    position: 'relative',
    zIndex: 999999,
    elevation: 9999,
  },
  filterDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterDropdownButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  filterDropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    marginTop: 5,
    maxHeight: 200,
    zIndex: 9999999,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  filterDropdownItem: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  filterDropdownItemText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  // Modal stilleri
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 20,
    width: '80%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalScrollView: {
    maxHeight: 300,
  },
  modalItem: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Deneme adı stilleri
  examNameContainer: {
    position: 'relative',
    zIndex: 9998,
  },
  examNameSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  examNameSelectedText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  examNamePlaceholderText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  examNameInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 45,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  examNameDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    marginTop: 5,
    maxHeight: 200,
    zIndex: 99999,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  examNameScrollView: {
    maxHeight: 200,
  },
  examNameItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  examNameItem: {
    flex: 1,
  },
  examNameItemText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  examNameDeleteButton: {
    padding: 5,
    marginLeft: 10,
  },
  emptyStateContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});
