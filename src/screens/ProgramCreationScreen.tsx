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
import { useTheme } from '../contexts/ThemeContext';

interface ProgramSettings {
  dailyTimeRange: string;
  lessonDuration: number;
  breakDuration: number;
}

export default function ProgramCreationScreen() {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  
  const [programSettings, setProgramSettings] = useState<ProgramSettings>({
    dailyTimeRange: '08:00 - 18:00',
    lessonDuration: 45,
    breakDuration: 15,
  });

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [programTable, setProgramTable] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState('Tüm Günler');
  const [selectedDates, setSelectedDates] = useState<Date[]>([]); // Seçilen tarihler
  const [currentMonth, setCurrentMonth] = useState(new Date()); // Takvim ayı
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

  // Takvim için fonksiyonlar
  const getDayName = (date: Date): string => {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return days[date.getDay()];
  };

  const formatDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const isDateSelected = (date: Date): boolean => {
    return selectedDates.some(d => formatDateKey(d) === formatDateKey(date));
  };

  const toggleDateSelection = (date: Date) => {
    const dateKey = formatDateKey(date);
    const isSelected = selectedDates.some(d => formatDateKey(d) === dateKey);
    
    if (isSelected) {
      // Seçimi kaldır - eğer bu bir aralığın parçasıysa, aralığı da kaldır
      const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
      const index = sortedDates.findIndex(d => formatDateKey(d) === dateKey);
      
      // Seçilen günü kaldır
      setSelectedDates(selectedDates.filter(d => formatDateKey(d) !== dateKey));
    } else {
      // Maksimum 7 gün kontrolü
      if (selectedDates.length >= 7) {
        Alert.alert('Uyarı', 'Maksimum 7 gün seçebilirsiniz!');
        return;
      }
      
      // Eğer hiç gün seçili değilse, direkt ekle
      if (selectedDates.length === 0) {
        setSelectedDates([date]);
        return;
      }
      
      // Seçili tarihleri sırala
      const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
      const firstDate = sortedDates[0];
      const lastDate = sortedDates[sortedDates.length - 1];
      
      // Yeni tarih ilk tarihten önceyse
      if (date.getTime() < firstDate.getTime()) {
        const startDate = date;
        const endDate = lastDate;
        const daysBetween = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Maksimum 7 gün kontrolü (yeni başlangıç + mevcut günler)
        if (daysBetween + 1 > 7) {
          Alert.alert('Uyarı', 'Maksimum 7 gün seçebilirsiniz!');
          return;
        }
        
        // Aradaki tüm günleri ekle
        const newDates: Date[] = [];
        for (let i = 0; i <= daysBetween; i++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + i);
          newDates.push(currentDate);
        }
        
        setSelectedDates(newDates);
      }
      // Yeni tarih son tarihten sonraysa
      else if (date.getTime() > lastDate.getTime()) {
        const startDate = firstDate;
        const endDate = date;
        const daysBetween = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Maksimum 7 gün kontrolü
        if (daysBetween + 1 > 7) {
          Alert.alert('Uyarı', 'Maksimum 7 gün seçebilirsiniz!');
          return;
        }
        
        // Aradaki tüm günleri ekle
        const newDates: Date[] = [];
        for (let i = 0; i <= daysBetween; i++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + i);
          newDates.push(currentDate);
        }
        
        setSelectedDates(newDates);
      }
      // Yeni tarih aralık içindeyse (bu durumda ekleme yapmıyoruz ama yine de ekleyelim)
      else {
        // Aralık içinde bir yere tıklandıysa, sadece o günü ekle (aralık oluşturma)
        // Ama önce mevcut aralığı kontrol et
        const currentRange = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        if (currentRange >= 7) {
          Alert.alert('Uyarı', 'Maksimum 7 gün seçebilirsiniz!');
          return;
        }
        
        setSelectedDates([...selectedDates, date].sort((a, b) => a.getTime() - b.getTime()));
      }
    }
  };

  // Takvim günlerini oluştur
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Pazartesi = 0
    
    const days = [];
    
    // Önceki ayın son günleri
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({ date, isCurrentMonth: false });
    }
    
    // Bu ayın günleri
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Sonraki ayın ilk günleri (takvimi tamamlamak için)
    const remainingDays = 42 - days.length; // 6 hafta x 7 gün = 42
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({ date, isCurrentMonth: false });
    }
    
    return days;
  };

  const changeMonth = (direction: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
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
      // Seçilen tarihler için programı kaydet
      selectedDates.forEach(date => {
        const dateKey = formatDateKey(date);
        const dayProgram = programTable.find(p => p.dateKey === dateKey);
        if (dayProgram) {
          savedPrograms[dateKey] = [dayProgram];
        }
      });
      
      await AsyncStorage.setItem('savedPrograms', JSON.stringify(savedPrograms));
      
      // Ödevleri de kaydet
      await saveAssignmentsToDates();
      
      Alert.alert('Başarılı', 'Program kaydedildi!');
    } catch (error) {
      Alert.alert('Hata', 'Program kaydedilirken bir hata oluştu!');
    }
  };

  // Component mount olduğunda kaydedilen programları yükle
  useEffect(() => {
    loadSavedPrograms();
  }, []);

  // Program tablosu oluşturma fonksiyonu
  const generateProgramTable = () => {
    const { dailyTimeRange, lessonDuration, breakDuration } = programSettings;
    
    // Hata kontrolü
    if (lessonDuration <= 0 || breakDuration < 0) {
      Alert.alert('Hata', 'Lütfen geçerli değerler girin!');
      return;
    }

    if (selectedDates.length === 0) {
      Alert.alert('Uyarı', 'Lütfen en az bir gün seçin!');
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
      
      const table: any[] = [];
      
      // Seçilen tarihleri sırala
      const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
      
      sortedDates.forEach((date) => {
        const daySlots = [];
        let currentMinutes = startMinutes;
        const dayName = getDayName(date);
        
        for (let slot = 0; slot < slotsPerDay; slot++) {
          const slotStartHour = Math.floor(currentMinutes / 60);
          const slotStartMinute = currentMinutes % 60;
          const slotEndMinutes = currentMinutes + lessonDuration;
          const slotEndHour = Math.floor(slotEndMinutes / 60);
          const slotEndMinute = slotEndMinutes % 60;
          
          const timeString = `${slotStartHour.toString().padStart(2, '0')}:${slotStartMinute.toString().padStart(2, '0')} - ${slotEndHour.toString().padStart(2, '0')}:${slotEndMinute.toString().padStart(2, '0')}`;
          
          daySlots.push({
            id: `${formatDateKey(date)}-${slot}`,
            time: timeString,
            subject: '',
            createdAt: new Date().toISOString(),
          });
          
          currentMinutes += slotDuration;
        }
        
        table.push({
          date: date,
          dateKey: formatDateKey(date),
          day: dayName,
          dateFormatted: date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
          slots: daySlots,
        });
      });
      
      setProgramTable(table);
      Alert.alert('Başarılı', `Program tablosu oluşturuldu!\n${selectedDates.length} gün, günde ${slotsPerDay} slot`);
      setShowSettingsModal(false);
    } catch (error) {
      Alert.alert('Hata', 'Saat formatı hatalı! (Örnek: 08:00 - 18:00)');
    }
  };

  const updateSubject = (dayIndex: number, slotIndex: number, subject: string) => {
    const newTable = [...programTable];
    newTable[dayIndex].slots[slotIndex].subject = subject;
    setProgramTable(newTable);
  };


  // Ödevleri seçilen tarihlere göre kaydet
  const saveAssignmentsToDates = async () => {
    try {
      console.log('Ödev kaydetme başladı');
      const assignments: any[] = [];
      const dayCounts: {[key: string]: number} = {};
      
      programTable.forEach(day => {
        if (!day.date) return;
        
        const dateKey = formatDateKey(day.date);
        dayCounts[dateKey] = 0;
        
        day.slots.forEach((slot: any) => {
          if (slot.subject && slot.subject.trim() !== '') {
            assignments.push({
              id: `${dateKey}-${slot.time}-${Date.now()}`,
              title: slot.subject,
              subject: 'Program Ödevi',
              dueDate: formatDateKey(day.date),
              priority: 'Orta',
              description: `${day.dateFormatted} ${slot.time} saatinde`,
              createdAt: new Date().toISOString(),
              isFromProgram: true,
            });
            
            dayCounts[dateKey]++;
          }
        });
      });

      if (assignments.length > 0) {
        // Mevcut ödevleri al
        const existingAssignments = await AsyncStorage.getItem('assignments');
        const allAssignments = existingAssignments ? JSON.parse(existingAssignments) : [];
        
        // Seçilen tarihlerin program ödevlerini kaldır
        const selectedDateKeys = selectedDates.map(d => formatDateKey(d));
        const filteredAssignments = allAssignments.filter((assignment: any) => {
          if (!assignment.isFromProgram) return true;
          return !selectedDateKeys.includes(assignment.dueDate);
        });
        
        // Yeni ödevleri ekle
        const updatedAssignments = [...filteredAssignments, ...assignments];
        
        // Kaydet
        await AsyncStorage.setItem('assignments', JSON.stringify(updatedAssignments));
        console.log('Ödevler kaydedildi, toplam:', updatedAssignments.length);
        
        // Mesaj oluştur
        let message = `${assignments.length} ödev güncellendi!`;
        
        Alert.alert('Başarılı', message);
      } else {
        Alert.alert('Uyarı', 'Kaydedilecek ödev bulunamadı!');
      }
    } catch (error) {
      console.error('Ödev kaydetme hatası:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
      Alert.alert('Hata', `Ödevler kaydedilirken bir hata oluştu: ${errorMessage}`);
    }
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
                {selectedDates.length > 0 
                  ? `${selectedDates.length} gün seçildi`
                  : 'Tarih seçin'}
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
              <View style={[styles.daySelectorContainer, { backgroundColor: colors.card }]}>
                <Text style={[styles.daySelectorLabel, { color: colors.text }]}>Gün Seçimi</Text>
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
                          { backgroundColor: selectedDay === day ? dayColor : colors.surface, borderColor: selectedDay === day ? dayColor : colors.border }
                        ]}
                        onPress={() => setSelectedDay(day)}
                      >
                        <Text style={[
                          styles.dayOptionText,
                          { color: selectedDay === day ? 'white' : colors.textSecondary }
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
                const originalIndex = programTable.findIndex(d => d.dateKey === day.dateKey);
                const dayColor = getDayColor(day.day);
                return (
                <View key={dayIndex} style={[styles.dayCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.dayHeader, { borderBottomColor: colors.border }]}>
                    <View>
                      <Text style={[styles.dayTitle, { color: colors.text }]}>{day.day}</Text>
                      {day.dateFormatted && (
                        <Text style={[styles.dayDate, { color: colors.textSecondary }]}>{day.dateFormatted}</Text>
                      )}
                    </View>
                    <View style={[styles.dayStats, { backgroundColor: `${dayColor}20` }]}>
                      <Text style={[styles.dayStatsText, { color: dayColor }]}>
                        {day.slots.filter((slot: any) => slot.isCompleted).length} / {day.slots.length}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.slotsContainer}>
                    {day.slots.map((slot: any, slotIndex: number) => (
                      <View key={slot.id} style={[styles.slotCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.slotHeader}>
                          <Text style={[styles.slotTime, { color: dayColor }]}>{slot.time}</Text>
                        </View>
                        
                        <TextInput
                          style={[styles.subjectInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                          placeholder="Ders/Etkinlik adı..."
                          placeholderTextColor={colors.textSecondary}
                          value={slot.subject}
                          onChangeText={(text: string) => updateSubject(originalIndex, slotIndex, text)}
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
              <Ionicons name="calendar-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Program Tablosu</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
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
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Program Ayarları</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Takvim - Gün Seçimi */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Tarih Seçimi</Text>
                
                {/* Takvim Başlığı */}
                <View style={styles.calendarHeader}>
                  <TouchableOpacity 
                    onPress={() => changeMonth(-1)}
                    style={styles.calendarNavButton}
                  >
                    <Ionicons name="chevron-back" size={20} color={colors.text} />
                  </TouchableOpacity>
                  
                  <Text style={[styles.calendarMonthText, { color: colors.text }]}>
                    {currentMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                  </Text>
                  
                  <TouchableOpacity 
                    onPress={() => changeMonth(1)}
                    style={styles.calendarNavButton}
                  >
                    <Ionicons name="chevron-forward" size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Takvim Günleri */}
                <View style={[styles.calendarContainer, { backgroundColor: colors.surface }]}>
                  {/* Hafta Günleri Başlıkları */}
                  <View style={styles.calendarWeekHeader}>
                    {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day, index) => (
                      <View key={index} style={styles.calendarWeekDayHeader}>
                        <Text style={[styles.calendarWeekDayText, { color: colors.textSecondary }]}>
                          {day}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Takvim Günleri */}
                  <View style={styles.calendarDaysContainer}>
                    {getCalendarDays().map((item, index) => {
                      const isSelected = isDateSelected(item.date);
                      const isToday = formatDateKey(item.date) === formatDateKey(new Date());
                      
                      return (
                    <TouchableOpacity
                      key={index}
                      style={[
                            styles.calendarDay,
                            !item.isCurrentMonth && { opacity: 0.3 },
                            isToday && styles.calendarDayToday,
                            isSelected && [styles.calendarDaySelected, { backgroundColor: '#4ECDC4' }]
                          ]}
                          onPress={() => toggleDateSelection(item.date)}
                    >
                      <Text style={[
                            styles.calendarDayText,
                            { color: item.isCurrentMonth ? colors.text : colors.textSecondary },
                            isSelected && { color: 'white', fontWeight: 'bold' },
                            isToday && !isSelected && { color: '#4ECDC4', fontWeight: 'bold' }
                          ]}>
                            {item.date.getDate()}
                      </Text>
                    </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Seçilen Tarihler */}
                {selectedDates.length > 0 && (
                  <View style={styles.selectedDatesContainer}>
                    <Text style={[styles.selectedDatesLabel, { color: colors.textSecondary }]}>
                      Seçilen Günler ({selectedDates.length}/7):
                    </Text>
                    <View style={styles.selectedDatesList}>
                      {(() => {
                        const sorted = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
                        if (sorted.length === 1) {
                          return (
                            <TouchableOpacity
                              style={[styles.selectedDateChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                              onPress={() => toggleDateSelection(sorted[0])}
                            >
                              <Text style={[styles.selectedDateText, { color: colors.text }]}>
                                {sorted[0].toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                              </Text>
                              <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                            </TouchableOpacity>
                          );
                        } else if (sorted.length > 1) {
                          const first = sorted[0];
                          const last = sorted[sorted.length - 1];
                          const isRange = sorted.length === Math.ceil((last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                          
                          if (isRange) {
                            // Aralık göster
                            return (
                              <TouchableOpacity
                                style={[styles.selectedDateChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                                onPress={() => {
                                  // Aralığın tamamını kaldır
                                  setSelectedDates([]);
                                }}
                              >
                                <Text style={[styles.selectedDateText, { color: colors.text }]}>
                                  {first.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - {last.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                </Text>
                                <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                              </TouchableOpacity>
                            );
                          } else {
                            // Aralık değilse, tüm günleri göster
                            return sorted.map((date, index) => (
                              <TouchableOpacity
                                key={index}
                                style={[styles.selectedDateChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                                onPress={() => toggleDateSelection(date)}
                              >
                                <Text style={[styles.selectedDateText, { color: colors.text }]}>
                                  {date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                </Text>
                                <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                              </TouchableOpacity>
                            ));
                          }
                        }
                        return null;
                      })()}
                    </View>
                  </View>
                )}
              </View>

              {/* Günlük Saat Aralığı */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Günlük Saat Aralığı</Text>
                <View style={styles.timeRangeContainer}>
                  <TextInput
                    style={[styles.timeInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    placeholder="08:00"
                    placeholderTextColor={colors.textSecondary}
                    value={programSettings.dailyTimeRange.split(' - ')[0]}
                    onChangeText={(text) => setProgramSettings({
                      ...programSettings,
                      dailyTimeRange: `${text} - ${programSettings.dailyTimeRange.split(' - ')[1]}`
                    })}
                  />
                  <Text style={[styles.timeSeparator, { color: colors.textSecondary }]}>-</Text>
                  <TextInput
                    style={[styles.timeInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    placeholder="18:00"
                    placeholderTextColor={colors.textSecondary}
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
                <Text style={[styles.inputLabel, { color: colors.text }]}>Ders Süresi (dakika)</Text>
                <TextInput
                  style={[styles.numberInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  placeholder="45"
                  placeholderTextColor={colors.textSecondary}
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
                <Text style={[styles.inputLabel, { color: colors.text }]}>Tenefüs Süresi (dakika)</Text>
                <TextInput
                  style={[styles.numberInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  placeholder="15"
                  placeholderTextColor={colors.textSecondary}
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

            </ScrollView>

            <TouchableOpacity 
              style={styles.createProgramButton} 
              onPress={() => {
                generateProgramTable();
                setShowSettingsModal(false);
              }}
            >
              <LinearGradient
                colors={['#4ECDC4', '#44A08D']}
                style={styles.createProgramButtonGradient}
              >
                <Text style={styles.createProgramButtonText}>Program Oluştur</Text>
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
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
  },
  dayDate: {
    fontSize: 14,
    marginTop: 4,
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
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
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
  },
  createProgramButton: {
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
  createProgramButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  createProgramButtonText: {
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
  },
  selectedWeekOptionText: {
    color: 'white',
  },
  // Takvim stilleri
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarNavButton: {
    padding: 8,
  },
  calendarMonthText: {
    fontSize: 18,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  calendarContainer: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  calendarWeekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarWeekDayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  calendarWeekDayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  calendarDaysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 4,
  },
  calendarDayText: {
    fontSize: 14,
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: '#4ECDC4',
  },
  calendarDaySelected: {
    backgroundColor: '#4ECDC4',
  },
  selectedDatesContainer: {
    marginTop: 16,
  },
  selectedDatesLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  selectedDatesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedDateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  selectedDateText: {
    fontSize: 14,
  },
});
