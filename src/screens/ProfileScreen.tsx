import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';


export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const userStats = {
    totalStudyTime: '156 saat',
    totalQuestions: '2,450',
    correctAnswers: '1,890',
    accuracy: '77%',
    streak: '15 gün',
    level: 'Seviye 8',
  };

  const achievements = [
    { id: 1, title: 'İlk Adım', description: 'İlk notunu ekledin', icon: 'star', color: '#f59e0b' },
    { id: 2, title: 'Çalışkan', description: '7 gün üst üste çalıştın', icon: 'flame', color: '#ef4444' },
    { id: 3, title: 'Analiz Ustası', description: '100 soru analiz ettin', icon: 'analytics', color: '#10b981' },
    { id: 4, title: 'Not Tutucu', description: '50 not ekledin', icon: 'document-text', color: '#3b82f6' },
  ];

  const menuItems = [
    { id: 1, title: 'Hesap Ayarları', icon: 'person-circle', color: '#3b82f6' },
    { id: 2, title: 'Gizlilik', icon: 'shield-checkmark', color: '#10b981' },
    { id: 3, title: 'Yardım & Destek', icon: 'help-circle', color: '#06b6d4' },
    { id: 4, title: 'Hakkında', icon: 'information-circle', color: '#8b5cf6' },
    { id: 5, title: 'Çıkış Yap', icon: 'log-out', color: '#ef4444' },
  ];

  // Load profile data on mount
  useEffect(() => {
    loadProfileData();
  }, []);
  
  const loadProfileData = async () => {
    try {
      const data = await AsyncStorage.getItem('profileData');
      if (data) {
        const parsedData = JSON.parse(data);
        setProfileData(parsedData);
        setDisplayName(`${parsedData.firstName} ${parsedData.lastName}`);
        setDisplayEmail(parsedData.email);
      }
    } catch (error) {
      console.log('Veri yüklenemedi:', error);
    }
  };
  
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
  
  const handleMenuPress = async (item: any) => {
    if (item.title === 'Çıkış Yap') {
      try {
        await logout();
      } catch (error) {
        console.log('Çıkış yapılamadı:', error);
      }
    } else if (item.title === 'Hesap Ayarları') {
      setShowAccountSettings(true);
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
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color="white" />
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{displayEmail}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{userStats.level}</Text>
          </View>
                  </View>
        </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>İstatistikler</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Ionicons name="time" size={24} color="#3b82f6" />
              <Text style={[styles.statNumber, { color: colors.text }]}>{userStats.totalStudyTime}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Toplam Çalışma</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Ionicons name="help-circle" size={24} color="#10b981" />
              <Text style={[styles.statNumber, { color: colors.text }]}>{userStats.totalQuestions}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Toplam Soru</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Ionicons name="checkmark-circle" size={24} color="#f59e0b" />
              <Text style={[styles.statNumber, { color: colors.text }]}>{userStats.correctAnswers}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Doğru Cevap</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Ionicons name="trending-up" size={24} color="#8b5cf6" />
              <Text style={[styles.statNumber, { color: colors.text }]}>{userStats.accuracy}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Doğruluk Oranı</Text>
            </View>
          </View>
        </View>

        <View style={styles.achievementsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Başarılar</Text>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => (
              <View key={achievement.id} style={[styles.achievementCard, { backgroundColor: colors.card }]}>
                <View style={[styles.achievementIcon, { backgroundColor: achievement.color }]}>
                  <Ionicons name={achievement.icon as any} size={24} color="white" />
                </View>
                <Text style={[styles.achievementTitle, { color: colors.text }]}>{achievement.title}</Text>
                <Text style={[styles.achievementDescription, { color: colors.textSecondary }]}>{achievement.description}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ayarlar</Text>
          
          <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={24} color="#f59e0b" />
              <Text style={[styles.settingTitle, { color: colors.text }]}>Bildirimler</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor={notificationsEnabled ? '#ffffff' : '#f3f4f6'}
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon" size={24} color="#8b5cf6" />
              <Text style={[styles.settingTitle, { color: colors.text }]}>Karanlık Mod</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor={isDarkMode ? '#ffffff' : '#f3f4f6'}
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Menü</Text>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, { backgroundColor: colors.card }]}
              onPress={() => handleMenuPress(item)}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon as any} size={20} color="white" />
                </View>
                <Text style={[styles.menuTitle, { color: colors.text }]}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.appInfo}>
          <Text style={[styles.appVersion, { color: colors.text }]}>Pusula v1.0.0</Text>
          <Text style={[styles.appDescription, { color: colors.textSecondary }]}>
            Kişisel öğrenme yolculuğunda yanındayız
          </Text>
        </View>
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
            <View style={styles.modalHeader}>
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
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
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
              
              <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
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
              
              <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
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
              
              <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
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
              
              <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
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
              
              <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
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
                style={styles.saveButton}
                onPress={saveProfileData}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="save" size={20} color="white" />
                    <Text style={styles.saveButtonText}>Kaydet</Text>
                  </>
                )}
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
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  profileInfo: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginBottom: 15,
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  statsSection: {
    marginBottom: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
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
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
    textAlign: 'center',
  },
  achievementDescription: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  settingsSection: {
    marginBottom: 30,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
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
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
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
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appVersion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 5,
  },
  appDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
    color: '#1f2937',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputIcon: {
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#1f2937',
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#1f2937',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
