import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProgramSettings {
  dailyTimeRange: string;
  lessonDuration: number;
  breakDuration: number;
  dayCount: number;
}

export default function ProgramCreationScreen() {
  const navigation = useNavigation<any>();
  
  const [programSettings, setProgramSettings] = useState<ProgramSettings>({
    dailyTimeRange: '08:00 - 18:00',
    lessonDuration: 45,
    breakDuration: 15,
    dayCount: 5,
  });

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [programTable, setProgramTable] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState('Tüm Günler');
  const [selectedWeek, setSelectedWeek] = useState(0); // Hafta seçimi için
  const [savedPrograms, setSavedPrograms] = useState<{[key: string]: any[]}>({}); // Kaydedilen programlar

  // Gün renkleri
  const dayColors = {
    'Pazartesi': '#FF6B6B', // Kırmızı
    'Salı': '#6C5CE7',      // Mor
    'Çarşamba': '#45B7D1',  // Mavi
    'Perşembe': '#96CEB4',  // Yeşil
    'Cuma': '#8B0000',      // Bordo
    'Cumartesi': '#DDA0DD', // Açık Mor
    'Pazar': '#FFB347',     // Turuncu
  };

  // Gün rengini al
  const getDayColor = (dayName: string) => {
    return dayColors[dayName as keyof typeof dayColors] || '#4ECDC4';
  };

  // Hafta seçimi için fonksiyonlar
  const getWeekDates = (weekOffset: number) => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Pazar, 1 = Pazartesi
    const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay; // Pazartesi'ye kadar olan gün sayısı
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + daysToMonday + (weekOffset * 7));
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    return { monday, sunday };
  };

  const formatWeekRange = (weekOffset: number) => {
    const { monday, sunday } = getWeekDates(weekOffset);
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
    };
    
    if (weekOffset === 0) return 'Bu Hafta';
    if (weekOffset === 1) return 'Gelecek Hafta';
    if (weekOffset === -1) return 'Geçen Hafta';
    
    return `${formatDate(monday)} - ${formatDate(sunday)}`;
  };

  const generateWeekOptions = () => {
    const options = [];
    for (let i = -2; i <= 4; i++) {
      options.push({
        label: formatWeekRange(i),
        value: i
      });
    }
    return options;
  };

  // Kaydedilen programları yükle
  const loadSavedPrograms = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedPrograms');
      if (saved) {
        setSavedPrograms(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Kaydedilen programlar yüklenirken hata:', error);
    }
  };

  // Programı kaydet
  const saveProgram = async () => {
    try {
      const weekKey = selectedWeek.toString();
      const newSavedPrograms = {
        ...savedPrograms,
        [weekKey]: programTable
      };
      
      await AsyncStorage.setItem('savedPrograms', JSON.stringify(newSavedPrograms));
      setSavedPrograms(newSavedPrograms);
      
      // Ödevleri de kaydet
      await saveAssignmentsToWeek();
      
    } catch (error) {
      Alert.alert('Hata', 'Program kaydedilirken bir hata oluştu!');
    }
  };

  // Hafta değiştiğinde programı yükle
  const handleWeekChange = (weekIndex: number) => {
    setSelectedWeek(weekIndex);
    const weekKey = weekIndex.toString();
    
    if (savedPrograms[weekKey]) {
      setProgramTable(savedPrograms[weekKey]);
    } else {
      setProgramTable([]);
    }
    
    // Sadece "Bu Hafta" (weekIndex === 0) seçildiğinde ve ayarlar modalı açıksa otomatik program oluştur
    if (showSettingsModal && weekIndex === 0 && !savedPrograms[weekKey]) {
      setShowSettingsModal(false);
      // Kısa bir gecikme ile program oluştur
      setTimeout(() => {
        generateProgramTable();
        Alert.alert(
          'Program Oluşturuldu', 
          'Bu hafta için program tablosu oluşturuldu!',
          [{ text: 'Tamam' }]
        );
      }, 300);
    }
  };

  // Component mount olduğunda kaydedilen programları yükle
  useEffect(() => {
    loadSavedPrograms();
  }, []);

  // Program tablosu oluşturma fonksiyonu
  const generateProgramTable = () => {
    const { dailyTimeRange, lessonDuration, breakDuration, dayCount } = programSettings;
    
    // Hata kontrolü
    if (lessonDuration <= 0 || breakDuration < 0 || dayCount <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli değerler girin!');
      return;
    }
    
    try {
      const [startTime, endTime] = dailyTimeRange.split(' - ');
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      const totalMinutes = endMinutes - startMinutes;
      
      if (totalMinutes <= 0) {
        Alert.alert('Hata', 'Başlangıç saati bitiş saatinden küçük olmalı!');
        return;
      }
      
      const slotDuration = lessonDuration + breakDuration;
      const slotsPerDay = Math.floor(totalMinutes / slotDuration);
      
      if (slotsPerDay <= 0) {
        Alert.alert('Hata', 'Günlük saat aralığı çok kısa! Ders ve tenefüs sürelerini kontrol edin.');
        return;
      }
      
      const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
      const table = [];
      
      for (let day = 0; day < dayCount; day++) {
        const daySlots = [];
        let currentMinutes = startMinutes;
        
        for (let slot = 0; slot < slotsPerDay; slot++) {
          const slotStartHour = Math.floor(currentMinutes / 60);
          const slotStartMinute = currentMinutes % 60;
          const slotEndMinutes = currentMinutes + lessonDuration;
          const slotEndHour = Math.floor(slotEndMinutes / 60);
          const slotEndMinute = slotEndMinutes % 60;
          
          const timeString = `${slotStartHour.toString().padStart(2, '0')}:${slotStartMinute.toString().padStart(2, '0')} - ${slotEndHour.toString().padStart(2, '0')}:${slotEndMinute.toString().padStart(2, '0')}`;
          
          daySlots.push({
            id: `${day}-${slot}`,
            time: timeString,
            subject: '',
            createdAt: new Date().toISOString(),
          });
          
          currentMinutes += slotDuration;
        }
        
        table.push({
          day: days[day],
          slots: daySlots,
        });
      }
      
      setProgramTable(table);
      Alert.alert('Başarılı', `Program tablosu oluşturuldu!\n${dayCount} gün, günde ${slotsPerDay} slot`);
    } catch (error) {
      Alert.alert('Hata', 'Saat formatı hatalı! (Örnek: 08:00 - 18:00)');
    }
  };

  const updateSubject = (dayIndex: number, slotIndex: number, subject: string) => {
    const newTable = [...programTable];
    newTable[dayIndex].slots[slotIndex].subject = subject;
    setProgramTable(newTable);
  };


  // Ödevleri hafta seçimine göre kaydet
  const saveAssignmentsToWeek = async () => {
    try {
      console.log('Ödev kaydetme başladı');
      const assignments = [];
      const dayCounts: {[key: string]: number} = {};
      
      programTable.forEach(day => {
        dayCounts[day.day] = 0;
        day.slots.forEach(slot => {
          if (slot.subject && slot.subject.trim() !== '') {
            // Gün adını Türkçe'den İngilizce'ye çevir
            const dayMapping: {[key: string]: string} = {
              'Pazartesi': 'Monday',
              'Salı': 'Tuesday', 
              'Çarşamba': 'Wednesday',
              'Perşembe': 'Thursday',
              'Cuma': 'Friday',
              'Cumartesi': 'Saturday',
              'Pazar': 'Sunday'
            };
            
            // Seçilen haftanın tarihini hesapla
            const weekDates = getWeekDates(selectedWeek);
            const dayOfWeek = dayMapping[day.day];
            const dayOffset: {[key: string]: number} = {
              'Monday': 0,
              'Tuesday': 1,
              'Wednesday': 2,
              'Thursday': 3,
              'Friday': 4,
              'Saturday': 5,
              'Sunday': 6
            };
            
            const assignmentDate = new Date(weekDates.monday);
            assignmentDate.setDate(weekDates.monday.getDate() + dayOffset[dayOfWeek]);
            
            assignments.push({
              id: `${day.day}-${slot.time}-${Date.now()}`,
              title: slot.subject,
              subject: 'Program Ödevi',
              dueDate: assignmentDate.toISOString().split('T')[0],
              priority: 'Orta',
              description: `${day.day} günü ${slot.time} saatinde`,
              createdAt: new Date().toISOString(),
              isFromProgram: true,
            });
            
            dayCounts[day.day]++;
          }
        });
      });

      if (assignments.length > 0) {
        // Mevcut ödevleri al
        const existingAssignments = await AsyncStorage.getItem('assignments');
        const allAssignments = existingAssignments ? JSON.parse(existingAssignments) : [];
        
        // Bu haftanın program ödevlerini kaldır
        const weekDates = getWeekDates(selectedWeek);
        const filteredAssignments = allAssignments.filter((assignment: any) => {
          if (!assignment.isFromProgram) return true;
          
          const assignmentDate = new Date(assignment.dueDate);
          return !(assignmentDate >= weekDates.monday && assignmentDate <= weekDates.sunday);
        });
        
        // Yeni ödevleri ekle
        const updatedAssignments = [...filteredAssignments, ...assignments];
        
        // Kaydet
        await AsyncStorage.setItem('assignments', JSON.stringify(updatedAssignments));
        console.log('Ödevler kaydedildi, toplam:', updatedAssignments.length);
        
        // Mesaj oluştur
        let message = `${assignments.length} ödev güncellendi!\n\n`;
        Object.keys(dayCounts).forEach(day => {
          if (dayCounts[day] > 0) {
            message += `• ${day}: ${dayCounts[day]} ödev\n`;
          }
        });
        
        Alert.alert('Başarılı', message);
      } else {
        Alert.alert('Uyarı', 'Kaydedilecek ödev bulunamadı!');
      }
    } catch (error) {
      console.error('Ödev kaydetme hatası:', error);
      Alert.alert('Hata', `Ödevler kaydedilirken bir hata oluştu: ${error.message}`);
    }
  };

  // Bir sonraki haftanın belirli gününün tarihini al
  const getNextWeekDate = (dayName: string) => {
    const today = new Date();
    const currentDay = today.getDay(); // 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
    
    const dayMapping = {
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6,
      'Sunday': 0
    };
    
    const targetDay = dayMapping[dayName as keyof typeof dayMapping];
    const daysUntilTarget = (targetDay - currentDay + 7) % 7;
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntilTarget);
    
    return targetDate.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  // Gün seçimi için fonksiyon
  const getDayOptions = () => {
    const options = ['Tüm Günler'];
    programTable.forEach(day => {
      options.push(day.day);
    });
    return options;
  };

  // Seçilen güne göre tabloyu filtrele
  const getFilteredTable = () => {
    if (selectedDay === 'Tüm Günler') {
      return programTable;
    }
    return programTable.filter(day => day.day === selectedDay);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#4ECDC4', '#44A08D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Program Oluştur</Text>
              <Text style={styles.headerSubtitle}>
                {formatWeekRange(selectedWeek)}
              </Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={saveProgram}
              >
                <Ionicons name="save-outline" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.settingsButton}
                onPress={() => setShowSettingsModal(true)}
              >
                <Ionicons name="settings-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Program Tablosu */}
          {programTable.length > 0 ? (
            <View style={styles.tableContainer}>
              {/* Gün Seçimi */}
              <View style={styles.daySelectorContainer}>
                <Text style={styles.daySelectorLabel}>Gün Seçimi</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.daySelectorScroll}
                >
                  {getDayOptions().map((day, index) => {
                    const dayColor = day === 'Tüm Günler' ? '#4ECDC4' : getDayColor(day);
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dayOption,
                          selectedDay === day && { backgroundColor: dayColor, borderColor: dayColor }
                        ]}
                        onPress={() => setSelectedDay(day)}
                      >
                        <Text style={[
                          styles.dayOptionText,
                          selectedDay === day && { color: 'white' }
                        ]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
              {getFilteredTable().map((day, dayIndex) => {
                // Orijinal indeksi bul
                const originalIndex = programTable.findIndex(d => d.day === day.day);
                const dayColor = getDayColor(day.day);
                return (
                <View key={dayIndex} style={styles.dayCard}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayTitle}>{day.day}</Text>
                    <View style={[styles.dayStats, { backgroundColor: `${dayColor}20` }]}>
                      <Text style={[styles.dayStatsText, { color: dayColor }]}>
                        {day.slots.filter(slot => slot.isCompleted).length} / {day.slots.length}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.slotsContainer}>
                    {day.slots.map((slot, slotIndex) => (
                      <View key={slot.id} style={styles.slotCard}>
                        <View style={styles.slotHeader}>
                          <Text style={[styles.slotTime, { color: dayColor }]}>{slot.time}</Text>
                        </View>
                        
                        <TextInput
                          style={styles.subjectInput}
                          placeholder="Ders/Etkinlik adı..."
                          placeholderTextColor="#9CA3AF"
                          value={slot.subject}
                          onChangeText={(text) => updateSubject(originalIndex, slotIndex, text)}
                          multiline={true}
                          numberOfLines={2}
                          textAlignVertical="top"
                        />
                      </View>
                    ))}
                  </View>
                </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Program Tablosu</Text>
              <Text style={styles.emptySubtitle}>
                Program ayarlarınızı yapın ve tabloyu oluşturun
              </Text>
              <TouchableOpacity 
                style={styles.createButton}
                onPress={() => setShowSettingsModal(true)}
              >
                <LinearGradient
                  colors={['#4ECDC4', '#44A08D']}
                  style={styles.createButtonGradient}
                >
                  <Ionicons name="settings" size={20} color="white" />
                  <Text style={styles.createButtonText}>Ayarları Yap</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Ayarlar Modal */}
      <Modal
        visible={showSettingsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Program Ayarları</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Hafta Seçimi */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Hafta Seçimi</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.weekOptionsScroll}
                >
                  {generateWeekOptions().map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.weekOption,
                        selectedWeek === option.value && styles.selectedWeekOption
                      ]}
                      onPress={() => handleWeekChange(option.value)}
                    >
                      <Text style={[
                        styles.weekOptionText,
                        selectedWeek === option.value && styles.selectedWeekOptionText
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Günlük Saat Aralığı */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Günlük Saat Aralığı</Text>
                <View style={styles.timeRangeContainer}>
                  <TextInput
                    style={styles.timeInput}
                    placeholder="08:00"
                    value={programSettings.dailyTimeRange.split(' - ')[0]}
                    onChangeText={(text) => setProgramSettings({
                      ...programSettings,
                      dailyTimeRange: `${text} - ${programSettings.dailyTimeRange.split(' - ')[1]}`
                    })}
                  />
                  <Text style={styles.timeSeparator}>-</Text>
                  <TextInput
                    style={styles.timeInput}
                    placeholder="18:00"
                    value={programSettings.dailyTimeRange.split(' - ')[1]}
                    onChangeText={(text) => setProgramSettings({
                      ...programSettings,
                      dailyTimeRange: `${programSettings.dailyTimeRange.split(' - ')[0]} - ${text}`
                    })}
                  />
                </View>
              </View>

              {/* Ders Süresi */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Ders Süresi (dakika)</Text>
                <TextInput
                  style={styles.numberInput}
                  placeholder="45"
                  placeholderTextColor="#9CA3AF"
                  value={programSettings.lessonDuration.toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text) || 45;
                    setProgramSettings({
                      ...programSettings,
                      lessonDuration: value
                    });
                  }}
                  keyboardType="numeric"
                />
              </View>

              {/* Tenefüs Süresi */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Tenefüs Süresi (dakika)</Text>
                <TextInput
                  style={styles.numberInput}
                  placeholder="15"
                  placeholderTextColor="#9CA3AF"
                  value={programSettings.breakDuration.toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text) || 15;
                    setProgramSettings({
                      ...programSettings,
                      breakDuration: value
                    });
                  }}
                  keyboardType="numeric"
                />
              </View>

              {/* Gün Sayısı */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Gün Sayısı</Text>
                <TextInput
                  style={styles.numberInput}
                  placeholder="5"
                  placeholderTextColor="#9CA3AF"
                  value={programSettings.dayCount.toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text) || 5;
                    setProgramSettings({
                      ...programSettings,
                      dayCount: Math.min(Math.max(value, 1), 7) // 1-7 arası sınırla
                    });
                  }}
                  keyboardType="numeric"
                />
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={() => {
                generateProgramTable();
                setShowSettingsModal(false);
              }}
            >
              <LinearGradient
                colors={['#4ECDC4', '#44A08D']}
                style={styles.saveButtonGradient}
              >
                <Text style={styles.saveButtonText}>Program Oluştur</Text>
              </LinearGradient>
            </TouchableOpacity>
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
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    textAlign: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  createButton: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tableContainer: {
    gap: 16,
  },
  daySelectorContainer: {
    backgroundColor: 'white',
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
    elevation: 4,
  },
  daySelectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  daySelectorScroll: {
    flexDirection: 'row',
  },
  dayOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dayOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  dayCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  dayStats: {
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dayStatsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  slotsContainer: {
    gap: 12,
  },
  slotCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  slotTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  subjectInput: {
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 60,
    maxHeight: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
    marginHorizontal: 10,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    textAlign: 'center',
    fontWeight: '500',
    color: '#374151',
  },
  saveButton: {
    borderRadius: 16,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  weekOptionsScroll: {
    flexDirection: 'row',
  },
  weekOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedWeekOption: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  weekOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  selectedWeekOptionText: {
    color: 'white',
  },
});
