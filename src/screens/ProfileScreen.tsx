import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';


export default function ProfileScreen() {
  const navigation = useNavigation();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'achievements' | 'settings'>('achievements');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'academic' | 'social' | 'games'>('all');
  const { logout } = useAuth();
  const { isDarkMode, toggleDarkMode, colors } = useTheme();
  const { showToast } = useToast();
  
  // Profile data state
  const [profileData, setProfileData] = useState({
    firstName: 'Ahmet',
    lastName: 'Yılmaz',
    email: 'ahmet@example.com',
    school: 'İstanbul Lisesi',
    grade: '12',
    branch: 'sayisal',
  });
  
  const [displayName, setDisplayName] = useState('Ahmet Yılmaz');
  const [displayEmail, setDisplayEmail] = useState('ahmet@example.com');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [userStats, setUserStats] = useState({
    totalStudyTime: '156 saat',
    totalQuestions: '0',
    correctAnswers: '0',
    accuracy: '0%',
  });

  const achievements = [
    { 
      id: 1, 
      title: 'Matematik Ustası', 
      description: '100 matematik sorusunu doğru çözdün!', 
      icon: 'trophy', 
      color: '#f59e0b',
      category: 'academic',
      status: 'earned',
      date: '15.03.2024',
      progress: 100,
      total: 100
    },
    { 
      id: 2, 
      title: 'Haftalık Şampiyon', 
      description: 'Bu hafta en çok puanı sen topladın!', 
      icon: 'star', 
      color: '#ef4444',
      category: 'social',
      status: 'earned',
      date: '12.03.2024',
      progress: 100,
      total: 100
    },
    { 
      id: 3, 
      title: 'Fizik Dehası', 
      description: '50 fizik sorusunu doğru çözdün!', 
      icon: 'book', 
      color: '#10b981',
      category: 'academic',
      status: 'earned',
      date: '10.03.2024',
      progress: 50,
      total: 50
    },
    { 
      id: 4, 
      title: 'Hedef Avcısı', 
      description: '3 günlük hedefini tamamladın!', 
      icon: 'target', 
      color: '#3b82f6',
      category: 'academic',
      status: 'earned',
      date: '18.03.2024',
      progress: 3,
      total: 3
    },
    { 
      id: 5, 
      title: 'Topluluk Lideri', 
      description: '10 arkadaşını platforma davet ettin!', 
      icon: 'people', 
      color: '#8b5cf6',
      category: 'social',
      status: 'earned',
      date: '17.03.2024',
      progress: 10,
      total: 10
    },
    { 
      id: 6, 
      title: 'Oyun Ustası', 
      description: '5 farklı oyunda en yüksek puanı al!', 
      icon: 'game-controller', 
      color: '#f5576c',
      category: 'games',
      status: 'locked',
      date: 'Kilitli',
      progress: 3,
      total: 5
    },
    { 
      id: 7, 
      title: 'Sürekli Öğrenen', 
      description: '30 gün boyunca her gün ders çalış!', 
      icon: 'school', 
      color: '#4facfe',
      category: 'academic',
      status: 'locked',
      date: 'Kilitli',
      progress: 12,
      total: 30
    },
    { 
      id: 8, 
      title: 'Kimya Uzmanı', 
      description: '75 kimya sorusunu doğru çöz!', 
      icon: 'flask', 
      color: '#11998e',
      category: 'academic',
      status: 'locked',
      date: 'Kilitli',
      progress: 22,
      total: 75
    },
    { 
      id: 9, 
      title: 'Analiz Uzmanı', 
      description: '10 farklı analiz raporunu incele!', 
      icon: 'stats-chart', 
      color: '#6c5ce7',
      category: 'academic',
      status: 'locked',
      date: 'Kilitli',
      progress: 4,
      total: 10
    },
    { 
      id: 10, 
      title: 'Sohbet Ustası', 
      description: 'Yapay zeka ile 50 sohbet gerçekleştir!', 
      icon: 'chatbubbles', 
      color: '#ff6b6b',
      category: 'social',
      status: 'locked',
      date: 'Kilitli',
      progress: 10,
      total: 50
    },
  ];

  const earnedCount = achievements.filter(a => a.status === 'earned').length;
  const lockedCount = achievements.filter(a => a.status === 'locked').length;
  const totalCount = achievements.length;

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const menuItems = [
    { id: 1, title: 'Hesap Ayarları', icon: 'person-circle', color: '#3b82f6' },
    { id: 2, title: 'Gizlilik', icon: 'shield-checkmark', color: '#10b981' },
    { id: 3, title: 'Yardım & Destek', icon: 'help-circle', color: '#06b6d4' },
    { id: 4, title: 'Hakkında', icon: 'information-circle', color: '#8b5cf6' },
    { id: 5, title: 'Çıkış Yap', icon: 'log-out', color: '#ef4444' },
  ];

  // Load profile data and analysis stats
  useEffect(() => {
    loadProfileData();
    loadAnalysisStats();
    calculateTotalStudyHours();
  }, []);

  // Reload stats when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadAnalysisStats();
      calculateTotalStudyHours();
    }, [calculateTotalStudyHours])
  );
  
  const loadProfileData = async () => {
    try {
      const data = await AsyncStorage.getItem('profileData');
      if (data) {
        const parsedData = JSON.parse(data);
        setProfileData(parsedData);
        setDisplayName(`${parsedData.firstName} ${parsedData.lastName}`);
        setDisplayEmail(parsedData.email);
      }
      
      // Load profile photo
      const photoUri = await AsyncStorage.getItem('profilePhoto');
      if (photoUri) {
        setProfilePhoto(photoUri);
      }
    } catch (error) {
      console.log('Veri yüklenemedi:', error);
    }
  };

  const loadAnalysisStats = async () => {
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
        const results = JSON.parse(saved);
        
        // Tüm sonuçları topla
        let totalQuestions = 0;
        let totalCorrect = 0;
        
        results.forEach((result: any) => {
          totalQuestions += result.totalQuestions || 0;
          totalCorrect += result.correctAnswers || 0;
        });
        
        // Doğruluk oranını hesapla
        const accuracy = totalQuestions > 0 
          ? Math.round((totalCorrect / totalQuestions) * 100)
          : 0;
        
        // Sayıları formatla
        const formattedTotal = totalQuestions.toLocaleString('tr-TR');
        const formattedCorrect = totalCorrect.toLocaleString('tr-TR');
        
        setUserStats(prevStats => ({
          ...prevStats,
          totalQuestions: formattedTotal,
          correctAnswers: formattedCorrect,
          accuracy: `${accuracy}%`,
        }));
      } else {
        // Eğer veri yoksa sıfır değerler göster
        setUserStats(prevStats => ({
          ...prevStats,
          totalQuestions: '0',
          correctAnswers: '0',
          accuracy: '0%',
        }));
      }
    } catch (error) {
      console.log('Analiz istatistikleri yüklenirken hata:', error);
    }
  };

  const calculateTotalStudyHours = useCallback(async () => {
    try {
      const homeworkHistoryData = await AsyncStorage.getItem('homeworkHistory');
      if (!homeworkHistoryData) {
        setUserStats(prevStats => ({
          ...prevStats,
          totalStudyTime: '0 saat',
        }));
        return;
      }

      const homeworkHistory = JSON.parse(homeworkHistoryData);
      let totalMinutes = 0;

      // Her ödev için
      homeworkHistory.forEach((homework: any) => {
        const homeworkData = homework.data || {};
        const completedItems = homework.completedItems || {};
        
        // Tamamlanan her hücre için
        Object.keys(completedItems).forEach(key => {
          if (completedItems[key] === true && homeworkData[key]) {
            const item = homeworkData[key];
            const timeString = item.time; // Örn: "08:00 - 08:45"
            
            if (timeString && timeString.includes(' - ')) {
              // Zaman aralığını parse et
              const [startTime, endTime] = timeString.split(' - ');
              const [startHour, startMin] = startTime.split(':').map(Number);
              const [endHour, endMin] = endTime.split(':').map(Number);
              
              // Dakika cinsinden hesapla
              const startMinutes = startHour * 60 + startMin;
              const endMinutes = endHour * 60 + endMin;
              const duration = endMinutes - startMinutes;
              
              if (duration > 0) {
                totalMinutes += duration;
              }
            }
          }
        });
      });

      // Dakikayı saate çevir
      const totalHours = Math.floor(totalMinutes / 60);
      const remainingMinutes = totalMinutes % 60;
      
      // Formatla
      let formattedTime = '';
      if (totalHours > 0) {
        formattedTime = `${totalHours} saat`;
        if (remainingMinutes > 0) {
          formattedTime += ` ${remainingMinutes} dakika`;
        }
      } else if (remainingMinutes > 0) {
        formattedTime = `${remainingMinutes} dakika`;
      } else {
        formattedTime = '0 saat';
      }

      setUserStats(prevStats => ({
        ...prevStats,
        totalStudyTime: formattedTime,
      }));
    } catch (error) {
      console.log('Çalışma saatleri hesaplanırken hata:', error);
      setUserStats(prevStats => ({
        ...prevStats,
        totalStudyTime: '0 saat',
      }));
    }
  }, []);
  
  const saveProfileData = async () => {
    try {
      setIsLoading(true);
      await AsyncStorage.setItem('profileData', JSON.stringify(profileData));
      setDisplayName(`${profileData.firstName} ${profileData.lastName}`);
      setDisplayEmail(profileData.email);
      setShowAccountSettings(false);
      showToast('Profil bilgileriniz güncellendi!', 'success', 'Başarılı');
    } catch (error) {
      console.log('Veri kaydedilemedi:', error);
      showToast('Bilgiler kaydedilemedi!', 'error', 'Hata');
    } finally {
      setIsLoading(false);
    }
  };
  
  const pickProfilePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('Galeri erişim izni gerekli', 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const photoUri = result.assets[0].uri;
        setProfilePhoto(photoUri);
        await AsyncStorage.setItem('profilePhoto', photoUri);
        showToast('Profil fotoğrafı güncellendi!', 'success');
      }
    } catch (error) {
      console.log('Fotoğraf seçilirken hata:', error);
      showToast('Fotoğraf seçilemedi', 'error');
    }
  };

  const handleMenuPress = async (item: any) => {
    if (item.title === 'Çıkış Yap') {
      try {
        await logout();
      } catch (error) {
        console.log('Çıkış yapılamadı:', error);
      }
    } else if (item.title === 'Hesap Ayarları') {
      setShowAccountSettings(true);
    } else if (item.title === 'Gizlilik') {
      navigation.navigate('Privacy' as never);
    } else if (item.title === 'Yardım & Destek') {
      navigation.navigate('HelpSupport' as never);
    } else if (item.title === 'Hakkında') {
      navigation.navigate('About' as never);
    } else {
      console.log(`${item.title} seçildi`);
    }
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
        <View style={styles.profileInfo}>
          <TouchableOpacity 
            style={styles.avatarWrapper}
            onPress={pickProfilePhoto}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#3b82f6', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradient}
            >
              <View style={styles.avatarContainer}>
                {profilePhoto ? (
                  <Image 
                    source={{ uri: profilePhoto }} 
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name="person" size={28} color="white" />
                )}
              </View>
            </LinearGradient>
            <View style={styles.avatarBadge}>
              <Ionicons name="camera" size={8} color="white" />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{displayEmail}</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="stats-chart" size={24} color={colors.text} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>İstatistikler</Text>
          </View>
          <View style={styles.statsGrid}>
            <LinearGradient
              colors={['#3b82f6', '#2563eb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCardGradient}
            >
              <View style={styles.statIconWrapper}>
                <Ionicons name="time" size={32} color="white" />
              </View>
              <Text style={styles.statNumberWhite}>{userStats.totalStudyTime}</Text>
              <Text style={styles.statLabelWhite}>Toplam Çalışma</Text>
            </LinearGradient>
            
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCardGradient}
            >
              <View style={styles.statIconWrapper}>
                <Ionicons name="help-circle" size={32} color="white" />
              </View>
              <Text style={styles.statNumberWhite}>{userStats.totalQuestions}</Text>
              <Text style={styles.statLabelWhite}>Toplam Soru</Text>
            </LinearGradient>
            
            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCardGradient}
            >
              <View style={styles.statIconWrapper}>
                <Ionicons name="checkmark-circle" size={32} color="white" />
              </View>
              <Text style={styles.statNumberWhite}>{userStats.correctAnswers}</Text>
              <Text style={styles.statLabelWhite}>Doğru Cevap</Text>
            </LinearGradient>
            
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCardGradient}
            >
              <View style={styles.statIconWrapper}>
                <Ionicons name="trending-up" size={32} color="white" />
              </View>
              <Text style={styles.statNumberWhite}>{userStats.accuracy}</Text>
              <Text style={styles.statLabelWhite}>Doğruluk Oranı</Text>
            </LinearGradient>
          </View>
        </View>

        <View style={[styles.tabsContainer, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={[
              styles.tabButton, 
              { backgroundColor: activeTab === 'achievements' ? colors.primary : colors.background },
              activeTab === 'achievements' && styles.activeTabButton
            ]}
            onPress={() => setActiveTab('achievements')}
          >
            <Text style={[styles.tabButtonText, { color: activeTab === 'achievements' ? 'white' : colors.textSecondary }, activeTab === 'achievements' && styles.activeTabButtonText]}>
              Başarımlar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton, 
              { backgroundColor: activeTab === 'settings' ? colors.primary : colors.background },
              activeTab === 'settings' && styles.activeTabButton
            ]}
            onPress={() => setActiveTab('settings')}
          >
            <Text style={[styles.tabButtonText, { color: activeTab === 'settings' ? 'white' : colors.textSecondary }, activeTab === 'settings' && styles.activeTabButtonText]}>
              Ayarlar
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'achievements' && (
          <View style={styles.achievementsSection}>
            <View style={styles.achievementsHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Başarımlarım</Text>
              <View style={[styles.achievementsStats, { backgroundColor: colors.card }]}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.text }]}>{totalCount}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Toplam Başarı</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.text }]}>{earnedCount}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Kazanılan</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.text }]}>{lockedCount}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Kalan</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => navigation.navigate('Achievements' as never)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#3b82f6', '#8b5cf6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.viewAllButtonGradient}
                >
                  <Ionicons name="trophy" size={20} color="white" />
                  <Text style={styles.viewAllButtonText}>Tüm Başarıları Gör</Text>
                  <Ionicons name="arrow-forward" size={18} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'settings' && (
          <View style={styles.settingsSectionContent}>
            <View style={styles.sectionHeader}>
              <Ionicons name="settings" size={24} color={colors.text} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Ayarlar</Text>
            </View>
            
            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.settingItemGradient}
            >
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="notifications" size={22} color="white" />
                  </View>
                  <Text style={styles.settingTitleWhite}>Bildirimler</Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: 'rgba(255, 255, 255, 0.5)' }}
                  thumbColor="#ffffff"
                />
              </View>
            </LinearGradient>

            <LinearGradient
              colors={['#8b5cf6', '#7c3aed']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.settingItemGradient}
            >
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <View style={styles.settingIconContainer}>
                    <Ionicons name="moon" size={22} color="white" />
                  </View>
                  <Text style={styles.settingTitleWhite}>Karanlık Mod</Text>
                </View>
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleDarkMode}
                  trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: 'rgba(255, 255, 255, 0.5)' }}
                  thumbColor="#ffffff"
                />
              </View>
            </LinearGradient>

            <View style={styles.menuSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="apps" size={24} color={colors.text} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Menü</Text>
              </View>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.menuItem, { backgroundColor: colors.card }]}
                  onPress={() => handleMenuPress(item)}
                  activeOpacity={0.7}
                >
              <View style={styles.menuLeft}>
                <LinearGradient
                  colors={[item.color, item.color + 'DD']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.menuIconGradient}
                >
                  <Ionicons name={item.icon as any} size={24} color="white" />
                </LinearGradient>
                <Text style={[styles.menuTitle, { color: colors.text }]}>{item.title}</Text>
              </View>
              <View style={[styles.chevronContainer, { backgroundColor: colors.textSecondary + '15' }]}>
                <Ionicons name="chevron-forward" size={22} color={colors.textSecondary} />
              </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
      
      {/* Account Settings Modal */}
      <Modal
        visible={showAccountSettings}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAccountSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIconContainer}>
                  <Ionicons name="person-circle" size={24} color="white" />
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Hesap Ayarları</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAccountSettings(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.modalBody} 
              contentContainerStyle={styles.scrollViewContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.inputIcon}>
                  <Ionicons name="person" size={20} color="#3b82f6" />
                </View>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Ad"
                  value={profileData.firstName}
                  onChangeText={(text) => setProfileData({ ...profileData, firstName: text })}
                  placeholderTextColor="#9ca3af"
                />
              </View>
              
              <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.inputIcon}>
                  <Ionicons name="person" size={20} color="#3b82f6" />
                </View>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Soyad"
                  value={profileData.lastName}
                  onChangeText={(text) => setProfileData({ ...profileData, lastName: text })}
                  placeholderTextColor="#9ca3af"
                />
              </View>
              
              <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.inputIcon}>
                  <Ionicons name="mail" size={20} color="#3b82f6" />
                </View>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="E-posta"
                  value={profileData.email}
                  onChangeText={(text) => setProfileData({ ...profileData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              
              <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.inputIcon}>
                  <Ionicons name="school" size={20} color="#3b82f6" />
                </View>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Okul"
                  value={profileData.school}
                  onChangeText={(text) => setProfileData({ ...profileData, school: text })}
                  placeholderTextColor="#9ca3af"
                />
              </View>
              
              <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.inputIcon}>
                  <Ionicons name="school" size={20} color="#3b82f6" />
                </View>
                <View style={[styles.pickerContainer, { backgroundColor: colors.surface }]}>
                  <Picker
                    selectedValue={profileData.grade}
                    style={[styles.picker, { color: colors.text }]}
                    onValueChange={(itemValue) => setProfileData({ ...profileData, grade: itemValue })}
                  >
                    <Picker.Item label="9. Sınıf" value="9" />
                    <Picker.Item label="10. Sınıf" value="10" />
                    <Picker.Item label="11. Sınıf" value="11" />
                    <Picker.Item label="12. Sınıf" value="12" />
                    <Picker.Item label="Mezun" value="mezun" />
                  </Picker>
                </View>
              </View>
              
              <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.inputIcon}>
                  <Ionicons name="book" size={20} color="#3b82f6" />
                </View>
                <View style={[styles.pickerContainer, { backgroundColor: colors.surface }]}>
                  <Picker
                    selectedValue={profileData.branch}
                    style={[styles.picker, { color: colors.text }]}
                    onValueChange={(itemValue) => setProfileData({ ...profileData, branch: itemValue })}
                  >
                    <Picker.Item label="Sayısal" value="sayisal" />
                    <Picker.Item label="Sözel" value="sozel" />
                    <Picker.Item label="Eşit Ağırlık" value="esit-agirlik" />
                  </Picker>
                </View>
              </View>
              
              <TouchableOpacity
                onPress={saveProfileData}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#3b82f6', '#1e40af']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveButtonGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Ionicons name="save" size={22} color="white" />
                      <Text style={styles.saveButtonText}>Kaydet</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 15,
    paddingBottom: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -50,
    right: -50,
  },
  circle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: -30,
    left: -30,
  },
  circle3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    top: 50,
    left: 20,
  },
  profileInfo: {
    alignItems: 'center',
    zIndex: 1,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarGradient: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarContainer: {
    width: 49,
    height: 49,
    borderRadius: 24.5,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24.5,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.3,
  },
  userEmail: {
    fontSize: 13,
    color: 'white',
    opacity: 0.95,
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 25,
    borderRadius: 16,
    padding: 6,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabButton: {
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabButtonText: {
    color: 'white',
  },
  achievementsHeader: {
    marginBottom: 20,
  },
  achievementsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    borderRadius: 16,
    padding: 20,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  activeCategoryButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeCategoryButtonText: {
    color: 'white',
  },
  viewAllButton: {
    borderRadius: 16,
    marginTop: 20,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  viewAllButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },
  viewAllButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  settingsSectionContent: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statsSection: {
    marginBottom: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCardGradient: {
    width: '48%',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  statIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumberWhite: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statLabelWhite: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  achievementsSection: {
    marginBottom: 30,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  achievementCardLocked: {
    opacity: 0.7,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  achievementIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: 12,
    marginTop: 4,
  },
  achievementDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  achievementProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 40,
  },
  settingsSection: {
    marginBottom: 30,
  },
  settingItemGradient: {
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'transparent',
  },
  settingIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingTitleWhite: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 15,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 15,
  },
  menuSection: {
    marginBottom: 30,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingBottom: 0,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
  },
  scrollViewContent: {
    paddingBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  inputIcon: {
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  pickerContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 10,
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

