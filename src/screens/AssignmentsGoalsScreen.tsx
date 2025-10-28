import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Modal, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

export default function AssignmentsGoalsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0); // 0 = Pazartesi, 6 = Pazar
  const [showWeekPicker, setShowWeekPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  
  // Hangi kutucuğun aktif olduğunu takip et
  const [activeBox, setActiveBox] = useState<'assignments' | 'goals' | null>(null);
  
  // Ödevleri yönetmek için state
  const [assignments, setAssignments] = useState<any[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<any[]>([]);
  
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
        filterAssignmentsByWeek(parsedAssignments, selectedWeek);
      } else {
        console.log('Kaydedilmiş ödev bulunamadı');
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
    filterAssignmentsByWeek(assignments, weekIndex);
  };

  // Gün değiştiğinde ödevleri filtrele
  const handleDayChange = (dayIndex: number) => {
    setSelectedDay(dayIndex);
    filterAssignmentsByDay(assignments, selectedWeek, dayIndex);
  };

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
      Alert.alert('Hata', 'Hedef başlığı boş olamaz');
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
      
      Alert.alert('Başarılı', 'Hedef başarıyla eklendi! Yuvarlak butona basarak tamamlayabilirsiniz.');
    } catch (error) {
      console.error('Hedef kaydedilirken hata:', error);
      Alert.alert('Hata', 'Hedef kaydedilemedi');
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
      Alert.alert('Hata', 'Hedef durumu güncellenemedi');
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
    const selectedDate = getSelectedDate();
    const dayName = formatDayName(selectedDay);
    const dayNumber = selectedDate.getDate();
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                   'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const monthName = months[selectedDate.getMonth()];
    
    return `${dayName}, ${dayNumber} ${monthName}`;
  };

  const generateDayOptions = () => {
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
          {/* Kutucuklar Yan Yana */}
          <View style={styles.boxesRow}>
            {/* Ödevlerim Kutucuğu */}
            <TouchableOpacity 
              style={styles.boxContainer}
              onPress={() => {
                setActiveBox('assignments');
              }}
            >
              <LinearGradient
                colors={activeBox === 'goals' ? ['#B8E6E0', '#A8D5CF'] : ['#4ECDC4', '#44A08D']}
                style={styles.boxGradient}
              >
                <Ionicons 
                  name="book-outline" 
                  size={32} 
                  color={activeBox === 'goals' ? '#7A7A7A' : 'white'} 
                />
                <Text style={[
                  styles.boxTitle,
                  activeBox === 'goals' && styles.dimmedText
                ]}>Ödevlerim</Text>
                <Text style={[
                  styles.boxSubtitle,
                  activeBox === 'goals' && styles.dimmedText
                ]}>Görevlerinizi takip edin</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Hedeflerim Kutucuğu */}
            <TouchableOpacity 
              style={styles.boxContainer}
              onPress={() => {
                setActiveBox('goals');
              }}
            >
              <LinearGradient
                colors={activeBox === 'assignments' ? ['#FFB8B8', '#FFA8A8'] : ['#FF6B6B', '#EE5A52']}
                style={styles.boxGradient}
              >
                <Ionicons 
                  name="flag-outline" 
                  size={32} 
                  color={activeBox === 'assignments' ? '#7A7A7A' : 'white'} 
                />
                <Text style={[
                  styles.boxTitle,
                  activeBox === 'assignments' && styles.dimmedText
                ]}>Hedeflerim</Text>
                <Text style={[
                  styles.boxSubtitle,
                  activeBox === 'assignments' && styles.dimmedText
                ]}>Hedeflerinizi belirleyin</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* İçerik Alanı */}
          {activeBox === 'assignments' && (
            <View style={styles.contentArea}>
              {/* Hafta ve Gün Seçimi */}
              <View style={styles.selectionCard}>
                <View style={styles.weekSelector}>
                  <View style={styles.selectorHeader}>
                    <Ionicons name="calendar-outline" size={20} color="#4ECDC4" />
                    <Text style={styles.sectionTitle}>Hafta Seçimi</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.pickerButton}
                    onPress={() => setShowWeekPicker(true)}
                  >
                    <Text style={styles.pickerText}>
                      {selectedWeek === 0 ? 'Bu Hafta' : formatWeekRange(selectedWeek)}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                <View style={styles.daySelector}>
                  <View style={styles.selectorHeader}>
                    <Ionicons name="time-outline" size={20} color="#4ECDC4" />
                    <Text style={styles.sectionTitle}>Gün Seçimi</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.pickerButton}
                    onPress={() => setShowDayPicker(true)}
                  >
                    <Text style={styles.pickerText}>
                      {formatSelectedDay()}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Ödev Listesi */}
              {filteredAssignments.length > 0 ? (
                <View style={styles.assignmentsList}>
                  <Text style={styles.assignmentsTitle}>Bu Haftanın Ödevleri</Text>
                  {filteredAssignments.map((assignment, index) => (
                    <View key={assignment.id || index} style={styles.assignmentItem}>
                      <View style={styles.assignmentInfo}>
                        <Text style={styles.assignmentTitle}>{assignment.title}</Text>
                        <Text style={styles.assignmentSubject}>{assignment.subject}</Text>
                        <Text style={styles.assignmentDate}>
                          {new Date(assignment.dueDate).toLocaleDateString('tr-TR')}
                        </Text>
                        {assignment.description && (
                          <Text style={styles.assignmentDescription}>{assignment.description}</Text>
                        )}
                      </View>
                      <View style={[
                        styles.priorityBadge,
                        { backgroundColor: assignment.priority === 'Yüksek' ? '#FF6B6B' : 
                                         assignment.priority === 'Orta' ? '#FFEAA7' : '#96CEB4' }
                      ]}>
                        <Text style={styles.priorityText}>{assignment.priority}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyAssignments}>
                  <Ionicons name="document-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyAssignmentsText}>Bu hafta için ödev bulunmuyor</Text>
                  <Text style={styles.emptyAssignmentsSubtext}>
                    Program oluşturarak ödevlerinizi ekleyebilirsiniz
                  </Text>
                </View>
              )}

            </View>
          )}

          {activeBox === 'goals' && (
            <View style={styles.contentArea}>
              <View style={styles.goalsHeader}>
                <View>
                  <Text style={styles.contentTitle}>Hedeflerim</Text>
                  <Text style={styles.contentSubtitle}>Hedeflerinizi belirleyin ve takip edin</Text>
                </View>
                <TouchableOpacity 
                  style={styles.addGoalButton}
                  onPress={() => setShowGoalModal(true)}
                >
                  <LinearGradient
                    colors={['#3b82f6', '#1e40af']}
                    style={styles.addGoalButtonGradient}
                  >
                    <Ionicons name="add" size={20} color="white" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Hedef Listesi */}
              <View style={styles.goalsList}>
                {goals.length > 0 ? (
                  goals
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((goal) => (
                    <View key={goal.id} style={[
                      styles.goalItem,
                      goal.completed && styles.completedGoalItem
                    ]}>
                      <View style={styles.goalInfo}>
                        <Text style={[
                          styles.goalTitle,
                          goal.completed && styles.completedGoalTitle
                        ]}>{goal.title}</Text>
                        {goal.description && (
                          <Text style={[
                            styles.goalDescription,
                            goal.completed && styles.completedGoalDescription
                          ]}>{goal.description}</Text>
                        )}
                        <Text style={[
                          styles.goalDate,
                          goal.completed && styles.completedGoalDate
                        ]}>
                          {new Date(goal.createdAt).toLocaleDateString('tr-TR')}
                        </Text>
                      </View>
                      <TouchableOpacity 
                        style={[
                          styles.completionButton,
                          goal.completed && styles.completedButton
                        ]}
                        onPress={() => toggleGoalCompletion(goal.id)}
                      >
                        {goal.completed && (
                          <Ionicons name="checkmark" size={16} color="white" />
                        )}
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>Henüz hedef eklenmemiş</Text>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      {activeBox === 'assignments' && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => navigation.navigate('ProgramCreation')}
        >
          <LinearGradient
            colors={['#4ECDC4', '#44A08D']}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Hafta Seçici Modal */}
      <Modal
        visible={showWeekPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWeekPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hafta Seç</Text>
              <TouchableOpacity onPress={() => setShowWeekPicker(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.optionsList}>
              {generateWeekOptions().map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionItem,
                    selectedWeek === option.value && styles.selectedOption
                  ]}
                  onPress={() => {
                    handleWeekChange(option.value);
                    setShowWeekPicker(false);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    selectedWeek === option.value && styles.selectedOptionText
                  ]}>
                    {option.label}
                  </Text>
                  {selectedWeek === option.value && (
                    <Ionicons name="checkmark" size={20} color="#3b82f6" />
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gün Seç</Text>
              <TouchableOpacity onPress={() => setShowDayPicker(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.optionsList}>
              {generateDayOptions().map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionItem,
                    selectedDay === option.value && styles.selectedOption
                  ]}
                  onPress={() => {
                    handleDayChange(option.value);
                    setShowDayPicker(false);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    selectedDay === option.value && styles.selectedOptionText
                  ]}>
                    {option.label}
                  </Text>
                  {selectedDay === option.value && (
                    <Ionicons name="checkmark" size={20} color="#3b82f6" />
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
          <View style={styles.goalModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Hedef Ekle</Text>
              <TouchableOpacity onPress={() => setShowGoalModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.goalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Hedef Başlığı *</Text>
                <TextInput
                  style={styles.goalTextInput}
                  placeholder="Hedef başlığını girin..."
                  placeholderTextColor="#9CA3AF"
                  value={goalTitle}
                  onChangeText={setGoalTitle}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Hedef Açıklaması</Text>
                <TextInput
                  style={[styles.goalTextInput, styles.goalDescriptionInput]}
                  placeholder="Hedef açıklamasını girin..."
                  placeholderTextColor="#9CA3AF"
                  value={goalDescription}
                  onChangeText={setGoalDescription}
                  multiline={true}
                  numberOfLines={4}
                />
              </View>
              
              <View style={styles.goalModalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    setGoalTitle('');
                    setGoalDescription('');
                    setShowGoalModal(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>İptal</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={saveGoal}
                >
                  <LinearGradient
                    colors={['#3b82f6', '#1e40af']}
                    style={styles.saveButtonGradient}
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
    color: '#1f2937',
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
    color: '#1f2937',
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
    paddingHorizontal: 20,
  },
  selectionCard: {
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
    color: '#374151',
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
    color: '#374151',
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
    color: '#9CA3AF',
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
    color: '#1f2937',
    marginBottom: 8,
  },
  contentSubtitle: {
    fontSize: 14,
    color: '#6b7280',
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
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  goalDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  goalDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  // Tamamlama butonu stilleri
  completionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  completedButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  // Tamamlanmış hedef stilleri
  completedGoalItem: {
    opacity: 0.6,
    backgroundColor: '#F9FAFB',
  },
  completedGoalTitle: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  completedGoalDescription: {
    textDecorationLine: 'line-through',
    color: '#D1D5DB',
  },
  completedGoalDate: {
    color: '#D1D5DB',
  },
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
    color: '#374151',
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
    color: '#1f2937',
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
    color: '#6b7280',
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
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});