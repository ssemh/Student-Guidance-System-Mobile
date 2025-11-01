import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Modal, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';

export default function AssignmentsGoalsScreen() {
  const { colors, isDarkMode } = useTheme();
  const { showToast } = useToast();
  const navigation = useNavigation<any>();
  
  // Tab sistemi
  const [activeTab, setActiveTab] = useState<'program' | 'homework' | 'goals'>('program');
  
  // Program Oluştur için state'ler
  const [programSettings, setProgramSettings] = useState({
    dailyTimeRange: '08:00 - 18:00',
    lessonDuration: 45,
    breakDuration: 15,
  });
  const [programTable, setProgramTable] = useState<any[]>([]);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showHomeworkTitleModal, setShowHomeworkTitleModal] = useState(false);
  const [homeworkTitle, setHomeworkTitle] = useState('');
  
  // Ödevlerim için state'ler
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showWeekPicker, setShowWeekPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showHomeworkDetails, setShowHomeworkDetails] = useState<string | null>(null);
  const [homeworkSearch, setHomeworkSearch] = useState('');
  
  // Ödevleri yönetmek için state
  const [assignments, setAssignments] = useState<any[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<any[]>([]);
  const [homeworkHistory, setHomeworkHistory] = useState<any[]>([]);
  
  // Hedefleri yönetmek için state
  const [goals, setGoals] = useState<any[]>([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');

  // Ödevleri yükle
  const loadAssignments = async () => {
    try {
      console.log('Ödevler yükleniyor...');
      const storedAssignments = await AsyncStorage.getItem('assignments');
      if (storedAssignments) {
        const parsedAssignments = JSON.parse(storedAssignments);
        console.log('Yüklenen ödevler:', parsedAssignments.length);
        setAssignments(parsedAssignments);
        // Filtre seçilene kadar tüm ödevleri göster
        if (selectedWeek === null && selectedDay === null) {
          setFilteredAssignments(parsedAssignments);
        } else if (selectedDay !== null && selectedWeek !== null) {
          filterAssignmentsByDay(parsedAssignments, selectedWeek, selectedDay);
        } else if (selectedWeek !== null) {
          filterAssignmentsByWeek(parsedAssignments, selectedWeek);
        } else {
          setFilteredAssignments(parsedAssignments);
        }
      } else {
        console.log('Kaydedilmiş ödev bulunamadı');
        setAssignments([]);
        setFilteredAssignments([]);
      }
    } catch (error) {
      console.error('Ödevler yüklenirken hata:', error);
    }
  };

  // Ödevleri haftaya göre filtrele
  const filterAssignmentsByWeek = (assignmentsList: any[], weekOffset: number) => {
    const weekDates = getWeekDates(weekOffset);
    const filtered = assignmentsList.filter(assignment => {
      const assignmentDate = new Date(assignment.dueDate);
      return assignmentDate >= weekDates.monday && assignmentDate <= weekDates.sunday;
    });
    setFilteredAssignments(filtered);
  };

  // Ödevleri güne göre filtrele
  const filterAssignmentsByDay = (assignmentsList: any[], weekOffset: number, dayOffset: number) => {
    const weekDates = getWeekDates(weekOffset);
    const targetDate = new Date(weekDates.monday);
    targetDate.setDate(weekDates.monday.getDate() + dayOffset);
    
    const filtered = assignmentsList.filter(assignment => {
      const assignmentDate = new Date(assignment.dueDate);
      return assignmentDate.toDateString() === targetDate.toDateString();
    });
    setFilteredAssignments(filtered);
  };

  // Hafta değiştiğinde ödevleri filtrele
  const handleWeekChange = (weekIndex: number) => {
    setSelectedWeek(weekIndex);
    if (selectedDay !== null) {
      filterAssignmentsByDay(assignments, weekIndex, selectedDay);
    } else {
      filterAssignmentsByWeek(assignments, weekIndex);
    }
    setShowWeekPicker(false);
  };

  // Gün değiştiğinde ödevleri filtrele
  const handleDayChange = (dayIndex: number) => {
    setSelectedDay(dayIndex);
    if (selectedWeek !== null) {
      filterAssignmentsByDay(assignments, selectedWeek, dayIndex);
    } else {
      // Eğer hafta seçilmemişse, önce hafta seçilmesi gerektiğini göster
      setSelectedDay(dayIndex);
      setFilteredAssignments([]); // Hafta seçilmeden gün seçilemez
    }
    setShowDayPicker(false);
  };

  // Filtreleri temizle
  const clearFilters = () => {
    setSelectedWeek(null);
    setSelectedDay(null);
    setFilteredAssignments(assignments);
  };

  // Program Oluştur için fonksiyonlar
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
    // Tarihin saat bilgisini sıfırla
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    
    const dateKey = formatDateKey(normalizedDate);
    const isSelected = selectedDates.some(d => formatDateKey(d) === dateKey);
    
    if (isSelected) {
      setSelectedDates(selectedDates.filter(d => formatDateKey(d) !== dateKey));
    } else {
      if (selectedDates.length >= 7) {
        showToast('Maksimum 7 gün seçebilirsiniz!', 'warning', 'Uyarı');
        return;
      }
      
      if (selectedDates.length === 0) {
        setSelectedDates([normalizedDate]);
        return;
      }
      
      const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
      const firstDate = sortedDates[0];
      const lastDate = sortedDates[sortedDates.length - 1];
      
      if (normalizedDate.getTime() < firstDate.getTime()) {
        const startDate = normalizedDate;
        const endDate = lastDate;
        const daysBetween = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysBetween + 1 > 7) {
          showToast('Maksimum 7 gün seçebilirsiniz!', 'warning', 'Uyarı');
          return;
        }
        
        const newDates: Date[] = [];
        for (let i = 0; i <= daysBetween; i++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + i);
          currentDate.setHours(0, 0, 0, 0);
          newDates.push(currentDate);
        }
        setSelectedDates(newDates);
      } else if (normalizedDate.getTime() > lastDate.getTime()) {
        const startDate = firstDate;
        const endDate = normalizedDate;
        const daysBetween = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysBetween + 1 > 7) {
          showToast('Maksimum 7 gün seçebilirsiniz!', 'warning', 'Uyarı');
          return;
        }
        
        const newDates: Date[] = [];
        for (let i = 0; i <= daysBetween; i++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + i);
          currentDate.setHours(0, 0, 0, 0);
          newDates.push(currentDate);
        }
        setSelectedDates(newDates);
      } else {
        const currentRange = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        if (currentRange >= 7) {
          showToast('Maksimum 7 gün seçebilirsiniz!', 'warning', 'Uyarı');
          return;
        }
        setSelectedDates([...selectedDates, normalizedDate].sort((a, b) => a.getTime() - b.getTime()));
      }
    }
  };

  const changeMonth = (direction: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    
    const days = [];
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(year, month - 1, day);
      date.setHours(0, 0, 0, 0);
      days.push({ day, isCurrentMonth: false, date });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      days.push({ day, isCurrentMonth: true, date });
    }
    
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      date.setHours(0, 0, 0, 0);
      days.push({ day, isCurrentMonth: false, date });
    }
    
    return days;
  };

  const generateProgramTable = () => {
    const { dailyTimeRange, lessonDuration, breakDuration } = programSettings;
    
    if (lessonDuration <= 0 || breakDuration < 0) {
      showToast('Lütfen geçerli değerler girin!', 'error', 'Hata');
      return;
    }

    if (selectedDates.length === 0) {
      showToast('Lütfen en az bir gün seçin!', 'warning', 'Uyarı');
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
        showToast('Başlangıç saati bitiş saatinden küçük olmalı!', 'error', 'Hata');
        return;
      }
      
      const slotDuration = lessonDuration + breakDuration;
      const slotsPerDay = Math.floor(totalMinutes / slotDuration);
      
      if (slotsPerDay <= 0) {
        showToast('Günlük saat aralığı çok kısa! Ders ve tenefüs sürelerini kontrol edin.', 'error', 'Hata');
        return;
      }
      
      const table: any[] = [];
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
            homework: '',
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
      showToast(`${selectedDates.length} gün, günde ${slotsPerDay} ders saati`, 'success', 'Program tablosu oluşturuldu!');
    } catch (error) {
      showToast('Saat formatı hatalı! (Örnek: 08:00 - 18:00)', 'error', 'Hata');
    }
  };

  const updateHomework = (dayIndex: number, slotIndex: number, homework: string) => {
    const newTable = [...programTable];
    newTable[dayIndex].slots[slotIndex].homework = homework;
    setProgramTable(newTable);
  };

  const generateDateTitle = () => {
    if (selectedDates.length === 0) {
      showToast('Lütfen önce tarih seçin!', 'warning', 'Uyarı');
      return;
    }
    
    const startDate = selectedDates[0].toLocaleDateString('tr-TR');
    const endDate = selectedDates[selectedDates.length - 1].toLocaleDateString('tr-TR');
    
    if (selectedDates.length === 1) {
      setHomeworkTitle(`${startDate} tarihli ödev`);
    } else {
      setHomeworkTitle(`${startDate} - ${endDate} tarihli ödev`);
    }
  };

  const saveHomeworkProgram = async () => {
    if (!homeworkTitle.trim()) {
      showToast('Lütfen bir başlık girin!', 'error', 'Hata');
      return;
    }

    try {
      const homeworkData: any = {};
      programTable.forEach(day => {
        day.slots.forEach((slot: any) => {
          if (slot.homework && slot.homework.trim() !== '') {
            const key = `${day.dateKey}-${slot.time}`;
            homeworkData[key] = {
              day: day.day,
              date: day.dateFormatted,
              time: slot.time,
              homework: slot.homework,
            };
          }
        });
      });

      let homeworkHistoryData = await AsyncStorage.getItem('homeworkHistory');
      let history = homeworkHistoryData ? JSON.parse(homeworkHistoryData) : [];
      
      history.push({
        id: Date.now().toString(),
        title: homeworkTitle,
        date: new Date().toLocaleDateString('tr-TR'),
        startDate: selectedDates.length > 0 ? selectedDates[0].toLocaleDateString('tr-TR') : '',
        endDate: selectedDates.length > 0 ? selectedDates[selectedDates.length - 1].toLocaleDateString('tr-TR') : '',
        data: homeworkData,
        timestamp: Date.now(),
      });

      await AsyncStorage.setItem('homeworkHistory', JSON.stringify(history));
      await AsyncStorage.setItem('homeworkData', JSON.stringify(homeworkData));
      await AsyncStorage.setItem('tableSettings', JSON.stringify(programSettings));
      
      setHomeworkTitle('');
      setShowHomeworkTitleModal(false);
      showToast('Ödev programı kaydedildi!', 'success', 'Başarılı');
      loadHomeworkHistory();
    } catch (error) {
      showToast('Kaydetme sırasında hata oluştu!', 'error', 'Hata');
    }
  };

  const loadHomeworkHistory = async () => {
    try {
      const data = await AsyncStorage.getItem('homeworkHistory');
      if (data) {
        const parsed = JSON.parse(data);
        // Eğer completedItems yoksa, her bir ödev için boş obje ekle
        const updated = parsed.map((hw: any) => ({
          ...hw,
          completedItems: hw.completedItems || {}
        }));
        setHomeworkHistory(updated);
      }
    } catch (error) {
      console.error('Ödev geçmişi yüklenirken hata:', error);
    }
  };

  // Ödev hücresini tamamla/tamamlanmamış yap
  const toggleHomeworkItem = async (homeworkId: string, itemKey: string) => {
    try {
      const homework = homeworkHistory.find(hw => hw.id === homeworkId);
      if (!homework) return;

      const updatedHistory = homeworkHistory.map(hw => {
        if (hw.id === homeworkId) {
          const completedItems = hw.completedItems || {};
          const newCompletedItems = {
            ...completedItems,
            [itemKey]: !completedItems[itemKey]
          };
          
          return {
            ...hw,
            completedItems: newCompletedItems
          };
        }
        return hw;
      });

      setHomeworkHistory(updatedHistory);
      await AsyncStorage.setItem('homeworkHistory', JSON.stringify(updatedHistory));

      // Tüm hücrelerin tamamlanıp tamamlanmadığını kontrol et
      const updatedHomework = updatedHistory.find(hw => hw.id === homeworkId);
      if (updatedHomework) {
        const homeworkData = updatedHomework.data || {};
        const allItemKeys = Object.keys(homeworkData);
        const allCompleted = allItemKeys.length > 0 && allItemKeys.every(key => {
          return updatedHomework.completedItems && updatedHomework.completedItems[key] === true;
        });

        // Eğer tüm hücreler tamamlandıysa, ana ekrandaki ödevleri güncelle
        if (allCompleted) {
          await updateAssignmentsForCompletedHomework(updatedHomework);
        } else {
          // Eğer tamamlanma durumu geri alındıysa, ödevleri tamamlanmamış yap
          await updateAssignmentsForIncompleteHomework(updatedHomework);
        }
      }
    } catch (error) {
      console.error('Ödev durumu güncellenirken hata:', error);
      showToast('Ödev durumu güncellenemedi', 'error', 'Hata');
    }
  };

  // Tüm hücreler tamamlandığında ana ekrandaki ödevleri güncelle
  const updateAssignmentsForCompletedHomework = async (homework: any) => {
    try {
      const homeworkData = homework.data || {};
      const dateKeys = new Set<string>();
      
      // Ödev programındaki tüm tarihleri topla
      Object.keys(homeworkData).forEach(key => {
        // Key formatı: "YYYY-MM-DD-HH:mm - HH:mm" 
        // İlk 3 parçayı birleştirerek tarihi al (YYYY-MM-DD)
        // Key formatını parse et: "2024-12-20-08:00 - 09:00"
        const match = key.match(/^(\d{4}-\d{2}-\d{2})/);
        if (match) {
          dateKeys.add(match[1]);
        }
      });

      // Ana ekrandaki ödevleri yükle
      const storedAssignments = await AsyncStorage.getItem('assignments');
      if (!storedAssignments) return;

      const allAssignments = JSON.parse(storedAssignments);
      
      // Bu ödev programına ait ödevleri bul ve tamamla
      const updatedAssignments = allAssignments.map((assignment: any) => {
        // Eğer ödev bu programdan geliyor ve tarihi eşleşiyorsa
        if (assignment.isFromProgram && dateKeys.has(assignment.dueDate)) {
          return {
            ...assignment,
            isCompleted: true
          };
        }
        return assignment;
      });

      await AsyncStorage.setItem('assignments', JSON.stringify(updatedAssignments));
      setAssignments(updatedAssignments);
      
      // Filtreli ödevleri de güncelle
      if (selectedWeek === null && selectedDay === null) {
        setFilteredAssignments(updatedAssignments);
      } else if (selectedDay !== null && selectedWeek !== null) {
        filterAssignmentsByDay(updatedAssignments, selectedWeek, selectedDay);
      } else if (selectedWeek !== null) {
        filterAssignmentsByWeek(updatedAssignments, selectedWeek);
      } else {
        setFilteredAssignments(updatedAssignments);
      }

      showToast('Tüm ödevler tamamlandı!', 'success', 'Tebrikler');
    } catch (error) {
      console.error('Ana ekran ödevleri güncellenirken hata:', error);
    }
  };

  // Tamamlanma durumu geri alındığında ödevleri tamamlanmamış yap
  const updateAssignmentsForIncompleteHomework = async (homework: any) => {
    try {
      const homeworkData = homework.data || {};
      const dateKeys = new Set<string>();
      
      // Ödev programındaki tüm tarihleri topla
      Object.keys(homeworkData).forEach(key => {
        // Key formatı: "YYYY-MM-DD-HH:mm - HH:mm" 
        // İlk 3 parçayı birleştirerek tarihi al (YYYY-MM-DD)
        // Key formatını parse et: "2024-12-20-08:00 - 09:00"
        const match = key.match(/^(\d{4}-\d{2}-\d{2})/);
        if (match) {
          dateKeys.add(match[1]);
        }
      });

      // Ana ekrandaki ödevleri yükle
      const storedAssignments = await AsyncStorage.getItem('assignments');
      if (!storedAssignments) return;

      const allAssignments = JSON.parse(storedAssignments);
      
      // Bu ödev programına ait ödevleri bul ve tamamlanmamış yap
      const updatedAssignments = allAssignments.map((assignment: any) => {
        if (assignment.isFromProgram && dateKeys.has(assignment.dueDate)) {
          return {
            ...assignment,
            isCompleted: false
          };
        }
        return assignment;
      });

      await AsyncStorage.setItem('assignments', JSON.stringify(updatedAssignments));
      setAssignments(updatedAssignments);
      
      // Filtreli ödevleri de güncelle
      if (selectedWeek === null && selectedDay === null) {
        setFilteredAssignments(updatedAssignments);
      } else if (selectedDay !== null && selectedWeek !== null) {
        filterAssignmentsByDay(updatedAssignments, selectedWeek, selectedDay);
      } else if (selectedWeek !== null) {
        filterAssignmentsByWeek(updatedAssignments, selectedWeek);
      } else {
        setFilteredAssignments(updatedAssignments);
      }
    } catch (error) {
      console.error('Ana ekran ödevleri güncellenirken hata:', error);
    }
  };

  useEffect(() => {
    loadHomeworkHistory();
  }, []);

  // Hedefleri yükle
  const loadGoals = async () => {
    try {
      const storedGoals = await AsyncStorage.getItem('goals');
      console.log('AsyncStorage\'dan yüklenen ham hedefler:', storedGoals);
      if (storedGoals) {
        const parsedGoals = JSON.parse(storedGoals);
        console.log('Parse edilmiş hedefler:', parsedGoals);
        setGoals(parsedGoals);
        console.log('Hedefler state\'e set edildi');
      } else {
        console.log('AsyncStorage\'da hedef bulunamadı');
      }
    } catch (error) {
      console.error('Hedefler yüklenirken hata:', error);
    }
  };

  // Hedef kaydet
  const saveGoal = async () => {
    if (!goalTitle.trim()) {
      showToast('Hedef başlığı boş olamaz', 'error', 'Hata');
      return;
    }

    try {
      const newGoal = {
        id: Date.now().toString(),
        title: goalTitle.trim(),
        description: goalDescription.trim(),
        createdAt: new Date().toISOString(),
        completed: false
      };

      const updatedGoals = [...goals, newGoal];
      setGoals(updatedGoals);
      await AsyncStorage.setItem('goals', JSON.stringify(updatedGoals));
      
      // Formu temizle
      setGoalTitle('');
      setGoalDescription('');
      setShowGoalModal(false);
      
      showToast('Hedef başarıyla eklendi! Yuvarlak butona basarak tamamlayabilirsiniz.', 'success', 'Başarılı');
    } catch (error) {
      console.error('Hedef kaydedilirken hata:', error);
      showToast('Hedef kaydedilemedi', 'error', 'Hata');
    }
  };

  // Hedef tamamla/tamamlanmamış yap
  const toggleGoalCompletion = async (goalId: string) => {
    console.log('Hedef tamamlama butonuna basıldı:', goalId);
    console.log('Mevcut hedefler:', goals);
    try {
      const updatedGoals = goals.map(goal => 
        goal.id === goalId 
          ? { ...goal, completed: !goal.completed }
          : goal
      );
      
      console.log('Güncellenmiş hedefler:', updatedGoals);
      setGoals(updatedGoals);
      
      console.log('AsyncStorage\'a kaydediliyor...');
      await AsyncStorage.setItem('goals', JSON.stringify(updatedGoals));
      console.log('AsyncStorage\'a başarıyla kaydedildi');
      
      // Kaydedilen veriyi kontrol et
      const savedData = await AsyncStorage.getItem('goals');
      console.log('Kaydedilen veri kontrolü:', savedData);
    } catch (error) {
      console.error('Hedef durumu güncellenirken hata:', error);
      showToast('Hedef durumu güncellenemedi', 'error', 'Hata');
    }
  };

  // Component mount olduğunda ödevleri ve hedefleri yükle
  useEffect(() => {
    loadAssignments();
    loadGoals();
  }, []);

  // Sayfa focus olduğunda ödevleri ve hedefleri yeniden yükle (program oluşturulduktan sonra)
  useFocusEffect(
    React.useCallback(() => {
      loadAssignments();
      loadGoals();
    }, [])
  );

  // Hafta hesaplama fonksiyonları
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
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                   'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    
    const mondayStr = `${monday.getDate()} ${months[monday.getMonth()]}`;
    const sundayStr = `${sunday.getDate()} ${months[sunday.getMonth()]}`;
    
    return `${mondayStr} - ${sundayStr}`;
  };

  const generateWeekOptions = () => {
    const options = [];
    for (let i = -4; i <= 4; i++) {
      options.push({
        value: i,
        label: i === 0 ? 'Bu Hafta' : formatWeekRange(i)
      });
    }
    return options;
  };

  // Gün hesaplama fonksiyonları
  const getSelectedDate = () => {
    if (selectedWeek === null || selectedDay === null) return null;
    const { monday } = getWeekDates(selectedWeek);
    const selectedDate = new Date(monday);
    selectedDate.setDate(monday.getDate() + selectedDay);
    return selectedDate;
  };

  const formatDayName = (dayIndex: number) => {
    const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    return days[dayIndex];
  };

  const formatSelectedDay = () => {
    if (selectedWeek === null || selectedDay === null) return '';
    const selectedDate = getSelectedDate();
    if (!selectedDate) return '';
    const dayName = formatDayName(selectedDay);
    const dayNumber = selectedDate.getDate();
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                   'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const monthName = months[selectedDate.getMonth()];
    
    return `${dayName}, ${dayNumber} ${monthName}`;
  };

  const generateDayOptions = () => {
    if (selectedWeek === null) return [];
    const { monday } = getWeekDates(selectedWeek);
    const options = [];
    
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      
      const dayName = formatDayName(i);
      const dayNumber = dayDate.getDate();
      const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                     'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
      const monthName = months[dayDate.getMonth()];
      
      options.push({
        value: i,
        label: `${dayName}, ${dayNumber} ${monthName}`
      });
    }
    return options;
  };
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#3b82f6', '#1e40af', '#7c3aed']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Ionicons name="book" size={40} color="white" />
            <Text style={styles.headerTitle}>Ödev ve Hedefler</Text>
            <Text style={styles.headerSubtitle}>
              Görevlerini takip et ve hedeflerine ulaş
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Tab Butonları */}
          <View style={styles.tabButtonsContainer}>
            <TouchableOpacity 
              style={[
                styles.tabButton, 
                activeTab === 'program' && styles.activeTabButton,
                { backgroundColor: activeTab === 'program' ? 'transparent' : colors.card, borderWidth: activeTab === 'program' ? 0 : 1, borderColor: colors.border }
              ]}
              onPress={() => setActiveTab('program')}
            >
              {activeTab === 'program' ? (
                <LinearGradient
                  colors={['#3b82f6', '#2563eb']}
                  style={[styles.tabButtonGradient, { borderRadius: 12 }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons 
                    name="grid" 
                    size={18} 
                    color="white" 
                  />
                  <Text style={styles.activeTabButtonText} numberOfLines={1}>
                    Program Oluştur
                  </Text>
                </LinearGradient>
              ) : (
                <View style={styles.tabButtonGradient}>
                  <Ionicons 
                    name="grid-outline" 
                    size={18} 
                    color={colors.text} 
                  />
                  <Text style={[styles.tabButtonText, { color: colors.text }]} numberOfLines={1}>
                    Program Oluştur
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.tabButton, 
                activeTab === 'homework' && styles.activeTabButton,
                { backgroundColor: activeTab === 'homework' ? 'transparent' : colors.card, borderWidth: activeTab === 'homework' ? 0 : 1, borderColor: colors.border }
              ]}
              onPress={() => setActiveTab('homework')}
            >
              {activeTab === 'homework' ? (
                <LinearGradient
                  colors={['#4ECDC4', '#44A08D']}
                  style={[styles.tabButtonGradient, { borderRadius: 12 }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons 
                    name="book" 
                    size={18} 
                    color="white" 
                  />
                  <Text style={styles.activeTabButtonText} numberOfLines={1}>
                    Ödevlerim
                  </Text>
                </LinearGradient>
              ) : (
                <View style={styles.tabButtonGradient}>
                  <Ionicons 
                    name="book-outline" 
                    size={18} 
                    color={colors.text} 
                  />
                  <Text style={[styles.tabButtonText, { color: colors.text }]} numberOfLines={1}>
                    Ödevlerim
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.tabButton, 
                activeTab === 'goals' && styles.activeTabButton,
                { backgroundColor: activeTab === 'goals' ? 'transparent' : colors.card, borderWidth: activeTab === 'goals' ? 0 : 1, borderColor: colors.border }
              ]}
              onPress={() => setActiveTab('goals')}
            >
              {activeTab === 'goals' ? (
                <LinearGradient
                  colors={['#FF6B6B', '#EE5A52']}
                  style={[styles.tabButtonGradient, { borderRadius: 12 }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons 
                    name="flag" 
                    size={18} 
                    color="white" 
                  />
                  <Text style={styles.activeTabButtonText} numberOfLines={1}>
                    Hedeflerim
                  </Text>
                </LinearGradient>
              ) : (
                <View style={styles.tabButtonGradient}>
                  <Ionicons 
                    name="flag-outline" 
                    size={18} 
                    color={colors.text} 
                  />
                  <Text style={[styles.tabButtonText, { color: colors.text }]} numberOfLines={1}>
                    Hedeflerim
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Program Oluştur Sekmesi */}
          {activeTab === 'program' && (
            <View style={styles.contentArea}>
              {/* Ayarlar Bölümü */}
              <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.settingsTitle, { color: colors.text }]}>Program Ayarları</Text>
                
                {/* Günlük Saat Aralığı */}
                <View style={styles.settingsRow}>
                  <View style={styles.settingGroup}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>Başlangıç</Text>
                    <TextInput
                      style={[styles.timeInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                      placeholder="08:00"
                      placeholderTextColor={colors.textSecondary}
                      value={programSettings.dailyTimeRange.split(' - ')[0]}
                      onChangeText={(text) => setProgramSettings({ ...programSettings, dailyTimeRange: `${text} - ${programSettings.dailyTimeRange.split(' - ')[1]}` })}
                    />
                  </View>
                  <Text style={[styles.dashText, { color: colors.text }]}>-</Text>
                  <View style={styles.settingGroup}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>Bitiş</Text>
                    <TextInput
                      style={[styles.timeInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                      placeholder="18:00"
                      placeholderTextColor={colors.textSecondary}
                      value={programSettings.dailyTimeRange.split(' - ')[1]}
                      onChangeText={(text) => setProgramSettings({ ...programSettings, dailyTimeRange: `${programSettings.dailyTimeRange.split(' - ')[0]} - ${text}` })}
                    />
                  </View>
                </View>

                {/* Ders Süresi */}
                <View style={styles.settingsRow}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Ders Süresi (dk)</Text>
                  <TextInput
                    style={[styles.numberInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    keyboardType="numeric"
                    value={programSettings.lessonDuration.toString()}
                    onChangeText={(text) => setProgramSettings({ ...programSettings, lessonDuration: parseInt(text) || 0 })}
                  />
                </View>

                {/* Mola Süresi */}
                <View style={styles.settingsRow}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Mola Süresi (dk)</Text>
                  <TextInput
                    style={[styles.numberInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    keyboardType="numeric"
                    value={programSettings.breakDuration.toString()}
                    onChangeText={(text) => setProgramSettings({ ...programSettings, breakDuration: parseInt(text) || 0 })}
                  />
                </View>

                {/* Tarih Seçimi */}
                <View style={styles.calendarSection}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Tarih Aralığı</Text>
                  <TouchableOpacity 
                    style={[styles.dateRangeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => setShowCalendar(!showCalendar)}
                  >
                    <Ionicons name="calendar" size={20} color={colors.primary} />
                    <Text style={[styles.dateRangeText, { color: colors.text }]}>
                      {selectedDates.length === 0 
                        ? 'Tarih seçin...' 
                        : selectedDates.length === 1
                          ? selectedDates[0].toLocaleDateString('tr-TR')
                          : `${selectedDates[0].toLocaleDateString('tr-TR')} - ${selectedDates[selectedDates.length - 1].toLocaleDateString('tr-TR')}`}
                    </Text>
                    <Text style={[styles.selectedCount, { color: colors.primary }]}>
                      {selectedDates.length}/7
                    </Text>
                  </TouchableOpacity>

                  {showCalendar && (
                    <View style={[styles.calendarContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      {/* Takvim Header */}
                      <View style={styles.calendarHeader}>
                        <TouchableOpacity onPress={() => changeMonth(-1)}>
                          <Ionicons name="chevron-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.calendarMonth, { color: colors.text }]}>
                          {currentMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                        </Text>
                        <TouchableOpacity onPress={() => changeMonth(1)}>
                          <Ionicons name="chevron-forward" size={24} color={colors.text} />
                        </TouchableOpacity>
                      </View>

                      {/* Takvim Günleri */}
                      <View style={styles.calendarGrid}>
                        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day, i) => (
                          <View key={i} style={styles.calendarWeekday}>
                            <Text style={[styles.calendarWeekdayText, { color: colors.textSecondary }]}>{day}</Text>
                          </View>
                        ))}
                        {getCalendarDays().map((item, index) => {
                          const date = item.date;
                          const selected = isDateSelected(date);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const isPast = date < today;
                          const isCurrentMonth = item.isCurrentMonth;
                          
                          return (
                            <TouchableOpacity
                              key={index}
                              style={[
                                styles.calendarDay,
                                !isCurrentMonth && styles.calendarDayOtherMonth,
                                selected && styles.calendarDaySelected,
                                isPast && styles.calendarDayPast,
                                { backgroundColor: selected ? colors.primary : (isPast ? colors.surface : 'transparent') }
                              ]}
                              onPress={() => !isPast && isCurrentMonth && toggleDateSelection(date)}
                              disabled={isPast || !isCurrentMonth}
                            >
                              <Text style={[
                                styles.calendarDayText,
                                { color: selected ? 'white' : (isPast ? colors.textSecondary : colors.text) },
                                !isCurrentMonth && { opacity: 0.3 }
                              ]}>
                                {item.day}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <View style={styles.calendarFooter}>
                        <TouchableOpacity 
                          style={[styles.calendarActionBtn, { backgroundColor: colors.surface }]}
                          onPress={() => {
                            setSelectedDates([]);
                            setShowCalendar(false);
                          }}
                        >
                          <Text style={[styles.calendarActionText, { color: colors.text }]}>Temizle</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.calendarActionBtn, { backgroundColor: colors.primary }]}
                          onPress={() => setShowCalendar(false)}
                        >
                          <Text style={[styles.calendarActionText, { color: 'white' }]}>Uygula</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>

                {/* Butonlar */}
                <View style={styles.settingsActions}>
                  <TouchableOpacity 
                    style={styles.generateButton}
                    onPress={generateProgramTable}
                  >
                    <LinearGradient
                      colors={['#3b82f6', '#2563eb']}
                      style={styles.generateButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Ionicons name="grid" size={20} color="white" />
                      <Text style={styles.generateButtonText}>Tabloyu Oluştur</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={() => {
                      if (programTable.length === 0) {
                        showToast('Lütfen önce tabloyu oluşturun!', 'warning', 'Uyarı');
                        return;
                      }
                      setShowHomeworkTitleModal(true);
                    }}
                  >
                    <LinearGradient
                      colors={['#4ECDC4', '#44A08D']}
                      style={styles.saveButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Ionicons name="save" size={20} color="white" />
                      <Text style={styles.saveButtonText}>Ödevleri Kaydet</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Tablo Görünümü */}
              {programTable.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableScrollView}>
                  <View style={styles.tableContainer}>
                    {/* Tablo Başlığı */}
                    <View style={[styles.tableHeader, { backgroundColor: colors.primary }]}>
                      <View style={styles.tableHeaderTime}>
                        <Text style={styles.tableHeaderText}>Saat</Text>
                      </View>
                      {programTable.map((day) => (
                        <View key={day.dateKey} style={styles.tableHeaderDay}>
                          <Text style={styles.tableHeaderText}>{day.day}</Text>
                          <Text style={styles.tableHeaderDate}>{day.date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Tablo İçeriği - Her saat dilimi için satır */}
                    {(() => {
                      const allTimeSlots: string[] = [];
                      programTable[0]?.slots.forEach((slot: any) => {
                        if (!allTimeSlots.includes(slot.time)) {
                          allTimeSlots.push(slot.time);
                        }
                      });

                      return allTimeSlots.map((timeSlot) => (
                        <View key={timeSlot} style={[styles.tableRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                          <View style={[styles.tableTimeCell, { backgroundColor: colors.surface }]}>
                            <Text style={[styles.tableTimeText, { color: colors.text }]}>{timeSlot}</Text>
                          </View>
                          {programTable.map((day) => {
                            const slot = day.slots.find((s: any) => s.time === timeSlot);
                            return (
                              <View key={day.dateKey} style={[styles.tableCell, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <TextInput
                                  style={[styles.tableCellInput, { color: colors.text }]}
                                  placeholder="Ödev ekle..."
                                  placeholderTextColor={colors.textSecondary}
                                  value={slot?.homework || ''}
                                  onChangeText={(text) => {
                                    const dayIndex = programTable.findIndex(d => d.dateKey === day.dateKey);
                                    const slotIndex = day.slots.findIndex((s: any) => s.time === timeSlot);
                                    updateHomework(dayIndex, slotIndex, text);
                                  }}
                                  multiline
                                  textAlignVertical="top"
                                />
                              </View>
                            );
                          })}
                        </View>
                      ));
                    })()}
                  </View>
                </ScrollView>
              )}
            </View>
          )}

          {/* Ödevlerim Sekmesi */}
          {activeTab === 'homework' && (
            <View style={styles.contentArea}>
              {/* İstatistik Kartları - Ödev detayları açıkken gösterilmez */}
              {!showHomeworkDetails && (
                <>
                  <View style={styles.statsContainer}>
                    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <LinearGradient
                        colors={['#4ECDC4', '#44A08D']}
                        style={styles.statIconContainer}
                      >
                        <Ionicons name="book" size={24} color="white" />
                      </LinearGradient>
                      <View style={styles.statContent}>
                        <Text style={[styles.statNumber, { color: colors.text }]}>{homeworkHistory.length}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Toplam Program</Text>
                      </View>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <LinearGradient
                        colors={['#FF6B6B', '#EE5A52']}
                        style={styles.statIconContainer}
                      >
                        <Ionicons name="time" size={24} color="white" />
                      </LinearGradient>
                      <View style={styles.statContent}>
                        <Text style={[styles.statNumber, { color: colors.text }]}>{filteredAssignments.length}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Aktif Ödev</Text>
                      </View>
                    </View>
                  </View>

                  {/* Ödev Arama */}
                  <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <LinearGradient
                  colors={['#4ECDC4', '#44A08D']}
                  style={styles.searchIconContainer}
                >
                  <Ionicons name="search" size={20} color="white" />
                </LinearGradient>
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Ödev ara..."
                  placeholderTextColor={colors.textSecondary}
                  value={homeworkSearch}
                  onChangeText={setHomeworkSearch}
                />
                {homeworkSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setHomeworkSearch('')}>
                    <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
                </>
              )}

              {/* Ödev Listesi veya Detay */}
              {showHomeworkDetails ? (() => {
                const homework = homeworkHistory.find(hw => hw.id === showHomeworkDetails);
                if (!homework) return null;

                // Ödev verisini tablo formatına çevir
                const homeworkData = homework.data || {};
                const allTimeSlots = new Set<string>();
                const allDays = new Set<string>();
                
                Object.keys(homeworkData).forEach(key => {
                  const item = homeworkData[key];
                  allTimeSlots.add(item.time);
                  allDays.add(item.day);
                });

                const sortedTimeSlots = Array.from(allTimeSlots).sort();
                const sortedDays = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].filter(day => allDays.has(day));

                // Tüm hücrelerin tamamlanıp tamamlanmadığını kontrol et
                const homeworkDataForDetail = homework.data || {};
                const allItemKeysForDetail = Object.keys(homeworkDataForDetail);
                const completedItemsForDetail = homework.completedItems || {};
                const allCompletedForDetail = allItemKeysForDetail.length > 0 && allItemKeysForDetail.every(key => {
                  return completedItemsForDetail[key] === true;
                });

                return (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableScrollView}>
                    <View>
                      <View style={styles.homeworkDetailHeader}>
                        <TouchableOpacity onPress={() => setShowHomeworkDetails(null)}>
                          <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <View style={styles.homeworkDetailTitleContainer}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={[
                              styles.homeworkDetailTitle, 
                              { 
                                color: allCompletedForDetail ? '#059669' : colors.text,
                                textDecorationLine: allCompletedForDetail ? 'line-through' : 'none'
                              }
                            ]}>
                              {homework.title}
                            </Text>
                            {allCompletedForDetail && (
                              <View style={styles.completedBadge}>
                                <Text style={styles.completedBadgeText}>Tamamlandı</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.homeworkDetailDates, { color: colors.textSecondary }]}>
                            {homework.startDate} - {homework.endDate}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.tableContainer}>
                        {/* Tablo Başlığı */}
                        <View style={[styles.tableHeader, { backgroundColor: colors.primary }]}>
                          <View style={styles.tableHeaderTime}>
                            <Text style={styles.tableHeaderText}>Saat</Text>
                          </View>
                          {sortedDays.map((day) => (
                            <View key={day} style={styles.tableHeaderDay}>
                              <Text style={styles.tableHeaderText}>{day}</Text>
                            </View>
                          ))}
                        </View>

                        {/* Tablo İçeriği */}
                        {sortedTimeSlots.map((timeSlot) => (
                          <View key={timeSlot} style={[styles.tableRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={[styles.tableTimeCell, { backgroundColor: colors.surface }]}>
                              <Text style={[styles.tableTimeText, { color: colors.text }]}>{timeSlot}</Text>
                            </View>
                            {sortedDays.map((day) => {
                              const key = Object.keys(homeworkData).find(k => {
                                const item = homeworkData[k];
                                return item.day === day && item.time === timeSlot;
                              });
                              const item = key ? homeworkData[key] : null;
                              const isCompleted = item && homework.completedItems && homework.completedItems[key];
                              
                              return (
                                <TouchableOpacity
                                  key={day}
                                  style={[
                                    styles.tableCell,
                                    styles.tableCellTouchable,
                                    { 
                                      backgroundColor: isCompleted ? '#D1FAE5' : colors.surface, 
                                      borderColor: isCompleted ? '#10B981' : colors.border 
                                    }
                                  ]}
                                  onPress={() => item && toggleHomeworkItem(homework.id, key)}
                                  disabled={!item}
                                  activeOpacity={0.7}
                                >
                                  {item ? (
                                    <View style={styles.tableCellContent}>
                                      <Text style={[
                                        styles.tableCellText,
                                        { 
                                          color: isCompleted ? '#059669' : colors.text,
                                          textDecorationLine: isCompleted ? 'line-through' : 'none',
                                          flex: 1
                                        }
                                      ]}>
                                        {item.homework}
                                      </Text>
                                      {isCompleted && (
                                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                      )}
                                    </View>
                                  ) : (
                                    <Text style={[styles.tableCellText, { color: colors.textSecondary, fontStyle: 'italic' }]}>-</Text>
                                  )}
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        ))}
                      </View>
                    </View>
                  </ScrollView>
                );
              })() : (() => {
                const filtered = homeworkHistory.filter(hw => 
                  hw.title.toLowerCase().includes(homeworkSearch.toLowerCase())
                );

                if (filtered.length === 0) {
                  return (
                    <View style={styles.emptyState}>
                      <LinearGradient
                        colors={['#4ECDC4', '#44A08D']}
                        style={styles.emptyIconContainer}
                      >
                        <Ionicons name="document-outline" size={64} color="white" />
                      </LinearGradient>
                      <Text style={[styles.emptyTitle, { color: colors.text }]}>Ödev Bulunamadı</Text>
                      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                        Program oluştur sekmesinden ödev programı oluşturabilirsiniz
                      </Text>
                    </View>
                  );
                }

                return (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {filtered.map((homework, index) => {
                      // Tüm hücrelerin tamamlanıp tamamlanmadığını kontrol et
                      const homeworkData = homework.data || {};
                      const allItemKeys = Object.keys(homeworkData);
                      const completedItems = homework.completedItems || {};
                      const allCompleted = allItemKeys.length > 0 && allItemKeys.every(key => {
                        return completedItems[key] === true;
                      });

                      return (
                        <TouchableOpacity
                          key={homework.id}
                          style={[
                            styles.homeworkItem, 
                            { 
                              backgroundColor: allCompleted ? '#D1FAE5' : colors.card, 
                              borderColor: allCompleted ? '#10B981' : colors.border 
                            }
                          ]}
                          onPress={() => setShowHomeworkDetails(homework.id)}
                          activeOpacity={0.7}
                        >
                          {allCompleted ? (
                            <View style={[styles.homeworkItemIcon, { backgroundColor: '#10B981' }]}>
                              <Ionicons name="checkmark-circle" size={24} color="white" />
                            </View>
                          ) : (
                            <LinearGradient
                              colors={index % 2 === 0 ? ['#4ECDC4', '#44A08D'] : ['#3b82f6', '#2563eb']}
                              style={styles.homeworkItemIcon}
                            >
                              <Ionicons name="document-text" size={24} color="white" />
                            </LinearGradient>
                          )}
                          <View style={styles.homeworkItemContent}>
                            <Text style={[
                              styles.homeworkItemTitle, 
                              { 
                                color: allCompleted ? '#059669' : colors.text,
                                textDecorationLine: allCompleted ? 'line-through' : 'none'
                              }
                            ]}>
                              {homework.title}
                            </Text>
                            <View style={styles.homeworkItemDates}>
                              <Ionicons name="calendar" size={14} color={allCompleted ? '#059669' : colors.primary} />
                              <Text style={[styles.homeworkItemDate, { color: colors.textSecondary }]}>
                                {homework.startDate} - {homework.endDate}
                              </Text>
                            </View>
                            <View style={[
                              styles.homeworkItemBadge,
                              { 
                                backgroundColor: allCompleted ? '#D1FAE5' : '#F3F4F6'
                              }
                            ]}>
                              {allCompleted ? (
                                <>
                                  <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                                  <Text style={[styles.homeworkItemBadgeText, { color: '#10B981' }]}>Tamamlandı</Text>
                                </>
                              ) : (
                                <>
                                  <Ionicons name="time-outline" size={12} color="#6B7280" />
                                  <Text style={[styles.homeworkItemBadgeText, { color: '#6B7280' }]}>Kaydedildi</Text>
                                </>
                              )}
                            </View>
                          </View>
                          <View style={styles.homeworkItemArrow}>
                            <Ionicons name="chevron-forward" size={24} color={allCompleted ? '#10B981' : colors.primary} />
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                );
              })()}
            </View>
          )}

          {/* Hedeflerim Sekmesi */}
          {activeTab === 'goals' && (
            <View style={styles.contentArea}>
              {/* İstatistik Kartı */}
              <View style={[styles.goalsStatsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.goalsStatsContent}>
                  <View style={styles.goalsStatsItem}>
                    <Text style={[styles.goalsStatsNumber, { color: colors.text }]}>
                      {goals.filter(g => !g.completed).length}
                    </Text>
                    <Text style={[styles.goalsStatsLabel, { color: colors.textSecondary }]}>Aktif Hedef</Text>
                  </View>
                  <View style={styles.goalsStatsDivider} />
                  <View style={styles.goalsStatsItem}>
                    <Text style={[styles.goalsStatsNumber, { color: '#10B981' }]}>
                      {goals.filter(g => g.completed).length}
                    </Text>
                    <Text style={[styles.goalsStatsLabel, { color: colors.textSecondary }]}>Tamamlanan</Text>
                  </View>
                </View>
              </View>

              <View style={styles.goalsHeader}>
                <View>
                  <Text style={[styles.contentTitle, { color: colors.text }]}>Hedeflerim</Text>
                  <Text style={[styles.contentSubtitle, { color: colors.textSecondary }]}>Hedeflerinizi belirleyin ve takip edin</Text>
                </View>
                <TouchableOpacity 
                  style={styles.addGoalButton}
                  onPress={() => setShowGoalModal(true)}
                >
                  <LinearGradient
                    colors={['#FF6B6B', '#EE5A52']}
                    style={styles.addGoalButtonGradient}
                  >
                    <Ionicons name="add" size={24} color="white" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Hedef Listesi */}
              {goals.length > 0 ? (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {goals
                    .sort((a, b) => {
                      // Önce tamamlanmamışlar, sonra tamamlananlar
                      if (a.completed !== b.completed) {
                        return a.completed ? 1 : -1;
                      }
                      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    })
                    .map((goal, index) => (
                    <View 
                      key={goal.id} 
                      style={[
                        styles.goalItem,
                        { 
                          backgroundColor: goal.completed 
                            ? (isDarkMode ? '#1a1a1a' : '#f9fafb') 
                            : colors.surface,
                          borderColor: goal.completed ? colors.border : (index % 2 === 0 ? '#4ECDC4' : '#3b82f6'),
                          borderLeftWidth: goal.completed ? 1 : 4
                        },
                        goal.completed && { opacity: 0.7 }
                      ]}
                    >
                      <View style={styles.goalLeftContent}>
                        {!goal.completed && (
                          <LinearGradient
                            colors={index % 2 === 0 ? ['#4ECDC4', '#44A08D'] : ['#3b82f6', '#2563eb']}
                            style={styles.goalIconContainer}
                          >
                            <Ionicons name="flag" size={20} color="white" />
                          </LinearGradient>
                        )}
                        {goal.completed && (
                          <View style={styles.goalIconContainerCompleted}>
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                          </View>
                        )}
                        <View style={styles.goalInfo}>
                          <Text style={[
                            styles.goalTitle,
                            { 
                              color: goal.completed 
                                ? (isDarkMode ? '#9ca3af' : '#9CA3AF')
                                : colors.text,
                              textDecorationLine: goal.completed ? 'line-through' : 'none'
                            }
                          ]}>{goal.title}</Text>
                          {goal.description && (
                            <Text style={[
                              styles.goalDescription,
                              { 
                                color: goal.completed 
                                  ? (isDarkMode ? '#6b7280' : '#D1D5DB')
                                  : colors.textSecondary,
                                textDecorationLine: goal.completed ? 'line-through' : 'none'
                              }
                            ]}>{goal.description}</Text>
                          )}
                          <View style={styles.goalFooter}>
                            <View style={styles.goalDateContainer}>
                              <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                              <Text style={[
                                styles.goalDate,
                                { 
                                  color: goal.completed 
                                    ? (isDarkMode ? '#6b7280' : '#D1D5DB')
                                    : colors.textSecondary
                                }
                              ]}>
                                {new Date(goal.createdAt).toLocaleDateString('tr-TR', { 
                                  day: 'numeric', 
                                  month: 'long', 
                                  year: 'numeric' 
                                })}
                              </Text>
                            </View>
                            {goal.completed && (
                              <View style={styles.completedBadge}>
                                <Text style={styles.completedBadgeText}>Tamamlandı</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                      <TouchableOpacity 
                        style={[
                          styles.completionButton,
                          { borderColor: goal.completed ? '#10B981' : colors.border },
                          goal.completed && styles.completedButton
                        ]}
                        onPress={() => toggleGoalCompletion(goal.id)}
                      >
                        {goal.completed && (
                          <Ionicons name="checkmark" size={18} color="white" />
                        )}
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.emptyState}>
                  <LinearGradient
                    colors={['#FF6B6B', '#EE5A52']}
                    style={styles.emptyIconContainer}
                  >
                    <Ionicons name="flag-outline" size={64} color="white" />
                  </LinearGradient>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>Henüz Hedef Yok</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                    İlk hedefinizi ekleyerek başlayın!
                  </Text>
                  <TouchableOpacity 
                    style={styles.emptyActionButton}
                    onPress={() => setShowGoalModal(true)}
                  >
                    <LinearGradient
                      colors={['#FF6B6B', '#EE5A52']}
                      style={styles.emptyActionButtonGradient}
                    >
                      <Ionicons name="add" size={20} color="white" />
                      <Text style={styles.emptyActionButtonText}>Hedef Ekle</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Ödev Başlık Modal */}
      <Modal
        visible={showHomeworkTitleModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowHomeworkTitleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Ödev Başlığı</Text>
              <TouchableOpacity onPress={() => setShowHomeworkTitleModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.inputWithShortcut}>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  placeholder="Ödev başlığı girin..."
                  placeholderTextColor={colors.textSecondary}
                  value={homeworkTitle}
                  onChangeText={setHomeworkTitle}
                />
                <TouchableOpacity
                  style={[styles.shortcutButton, { backgroundColor: colors.primary }]}
                  onPress={generateDateTitle}
                >
                  <Ionicons name="calendar" size={18} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalButtonPrimary}
                onPress={() => setShowHomeworkTitleModal(false)}
              >
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={styles.modalButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.modalButtonTextWhite}>İptal</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonPrimary}
                onPress={saveHomeworkProgram}
              >
                <LinearGradient
                  colors={['#4ECDC4', '#44A08D']}
                  style={styles.modalButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.modalButtonTextWhite}>Kaydet</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Hafta Seçici Modal */}
      <Modal
        visible={showWeekPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWeekPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Hafta Seç</Text>
              <TouchableOpacity onPress={() => setShowWeekPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.optionsList}>
              {generateWeekOptions().map((option) => (
                <TouchableOpacity
                  key={option.value}
                    style={[
                    styles.optionItem,
                    { borderBottomColor: colors.border },
                    selectedWeek === option.value && { 
                      backgroundColor: isDarkMode ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.2)' 
                    }
                  ]}
                  onPress={() => {
                    handleWeekChange(option.value);
                    setShowWeekPicker(false);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    { color: colors.text },
                    selectedWeek === option.value && { color: colors.primary, fontWeight: '600' }
                  ]}>
                    {option.label}
                  </Text>
                  {selectedWeek === option.value && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Gün Seçici Modal */}
      <Modal
        visible={showDayPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDayPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Gün Seç</Text>
              <TouchableOpacity onPress={() => setShowDayPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.optionsList}>
              {generateDayOptions().map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionItem,
                    { borderBottomColor: colors.border },
                    selectedDay === option.value && { 
                      backgroundColor: isDarkMode ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.2)' 
                    }
                  ]}
                  onPress={() => {
                    handleDayChange(option.value);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    { color: colors.text },
                    selectedDay === option.value && { color: colors.primary, fontWeight: '600' }
                  ]}>
                    {option.label}
                  </Text>
                  {selectedDay === option.value && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Hedef Ekleme Modal */}
      <Modal
        visible={showGoalModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGoalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.goalModalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Yeni Hedef Ekle</Text>
              <TouchableOpacity onPress={() => setShowGoalModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.goalForm}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Hedef Başlığı *</Text>
                <TextInput
                  style={[styles.goalTextInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  placeholder="Hedef başlığını girin..."
                  placeholderTextColor={colors.textSecondary}
                  value={goalTitle}
                  onChangeText={setGoalTitle}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Hedef Açıklaması</Text>
                <TextInput
                  style={[styles.goalTextInput, styles.goalDescriptionInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  placeholder="Hedef açıklamasını girin..."
                  placeholderTextColor={colors.textSecondary}
                  value={goalDescription}
                  onChangeText={setGoalDescription}
                  multiline={true}
                  numberOfLines={4}
                />
              </View>
              
              <View style={styles.goalModalButtons}>
                <TouchableOpacity 
                  style={[styles.cancelButton, { backgroundColor: colors.surface }]}
                  onPress={() => {
                    setGoalTitle('');
                    setGoalDescription('');
                    setShowGoalModal(false);
                  }}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>İptal</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={saveGoal}
                >
                  <LinearGradient
                    colors={['#3b82f6', '#1e40af']}
                    style={styles.saveButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.saveButtonText}>Kaydet</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
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
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 15,
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  // Tab Butonları
  tabButtonsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  tabButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 50,
  },
  tabButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    paddingHorizontal: 10,
    minHeight: 50,
    borderRadius: 12,
    width: '100%',
    flex: 1,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
  activeTabButton: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  activeTabButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  boxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  // Modal stilleri
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  optionsList: {
    maxHeight: 400,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedOption: {
    backgroundColor: '#eff6ff',
  },
  optionText: {
    fontSize: 16,
  },
  selectedOptionText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  // Kutucuk stilleri
  boxContainer: {
    width: '45%', // Sabit genişlik - eşit boyutlar için
    height: 140, // Sabit yükseklik - biraz daha küçük
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  boxGradient: {
    padding: 16, // Padding'i küçülttüm
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  boxTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
    textAlign: 'center',
  },
  boxSubtitle: {
    fontSize: 12,
    color: 'white',
    opacity: 0.9,
    marginTop: 4,
    textAlign: 'center',
  },
  dimmedText: {
    opacity: 0.7,
  },
  contentArea: {
    marginTop: 20,
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 100,
  },
  filterButtonDisabled: {
    opacity: 0.5,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  clearFilterButton: {
    padding: 2,
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '500',
  },
  selectionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectionContainer: {
    marginBottom: 20,
  },
  weekSelector: {
    marginBottom: 15,
  },
  daySelector: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pickerText: {
    fontSize: 16,
    flex: 1,
  },
  goalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  goalInput: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 10,
  },
  goalsList: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignmentsList: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  assignmentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  assignmentItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assignmentInfo: {
    flex: 1,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  assignmentSubject: {
    fontSize: 14,
    color: '#4ECDC4',
    marginBottom: 4,
  },
  assignmentDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  assignmentDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  emptyAssignments: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyAssignmentsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyAssignmentsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  contentSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  // Hedef ekleme butonu stilleri
  goalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  addGoalButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  addGoalButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Hedef listesi stilleri
  goalItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  goalDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  goalDate: {
    fontSize: 12,
  },
  // Tamamlama butonu stilleri
  completionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  completedButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  // Tamamlanmış hedef stilleri (artık dinamik renkler kullanıldığı için gerekli değil)
  // Hedef modal stilleri
  goalModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  goalForm: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  goalTextInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  goalDescriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  goalModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 12,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '100%',
    flex: 1,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  // Program Oluştur Stilleri
  settingsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  settingGroup: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  numberInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    flex: 1,
  },
  dashText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
  },
  calendarSection: {
    marginBottom: 16,
  },
  dateRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  dateRangeText: {
    flex: 1,
    fontSize: 16,
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  calendarContainer: {
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarMonth: {
    fontSize: 18,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  calendarWeekday: {
    width: '13%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  calendarWeekdayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  calendarDay: {
    width: '13%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginBottom: 4,
  },
  calendarDaySelected: {
    borderRadius: 8,
  },
  calendarDayOtherMonth: {
    opacity: 0.3,
  },
  calendarDayPast: {
    opacity: 0.5,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  calendarFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  calendarActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  calendarActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingsActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  generateButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '100%',
    flex: 1,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Tablo Stilleri
  tableScrollView: {
    marginTop: 20,
  },
  tableContainer: {
    minWidth: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableHeaderTime: {
    width: 100,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  tableHeaderDay: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  tableHeaderDate: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    opacity: 0.9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    minHeight: 80,
  },
  tableTimeCell: {
    width: 100,
    padding: 8,
    justifyContent: 'center',
    borderRightWidth: 1,
  },
  tableTimeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tableCell: {
    flex: 1,
    padding: 8,
    borderRightWidth: 1,
  },
  tableCellTouchable: {
    minHeight: 60,
    justifyContent: 'center',
  },
  tableCellContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  tableCellInput: {
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  tableCellText: {
    fontSize: 14,
    padding: 8,
  },
  homeworkDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  homeworkDetailTitleContainer: {
    flex: 1,
  },
  homeworkDetailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  homeworkDetailDates: {
    fontSize: 14,
  },
  // Ödevlerim Stilleri
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  homeworkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  homeworkItemContent: {
    flex: 1,
  },
  homeworkItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  homeworkItemDates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  homeworkItemDate: {
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  // Modal Stilleri
  modalBody: {
    padding: 20,
  },
  modalInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 10,
  },
  inputWithShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shortcutButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 0,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    minHeight: 48,
    width: '100%',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextWhite: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  // Yeni eklenen stiller
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  searchIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeworkItemIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  homeworkItemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  homeworkItemBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  homeworkItemArrow: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  goalsStatsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  goalsStatsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  goalsStatsItem: {
    alignItems: 'center',
    flex: 1,
  },
  goalsStatsDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 12,
  },
  goalsStatsNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  goalsStatsLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  goalLeftContent: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  goalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalIconContainerCompleted: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#D1FAE5',
  },
  goalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  goalDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyActionButton: {
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyActionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyActionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});