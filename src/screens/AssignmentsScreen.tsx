import React, { useState } from 'react';
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
import { useToast } from '../contexts/ToastContext';

interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  priority: 'Düşük' | 'Orta' | 'Yüksek';
  isCompleted: boolean;
  description: string;
}

export default function AssignmentsScreen() {
  const { showToast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([
    {
      id: '1',
      title: 'Matematik Problemleri',
      subject: 'Matematik',
      dueDate: '20 Aralık 2024',
      priority: 'Yüksek',
      isCompleted: false,
      description: 'Sayfa 45-50 arası problemler'
    },
    {
      id: '2',
      title: 'Fizik Deney Raporu',
      subject: 'Fizik',
      dueDate: '22 Aralık 2024',
      priority: 'Orta',
      isCompleted: true,
      description: 'Elektrik devreleri deneyi'
    },
    {
      id: '3',
      title: 'Tarih Sunumu',
      subject: 'Tarih',
      dueDate: '25 Aralık 2024',
      priority: 'Düşük',
      isCompleted: false,
      description: 'Osmanlı İmparatorluğu dönemi'
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [dailyTimeRange, setDailyTimeRange] = useState('08:00 - 18:00');
  const [lessonDuration, setLessonDuration] = useState(45);
  const [breakDuration, setBreakDuration] = useState(15);
  const [dayCount, setDayCount] = useState(5);

  // Hafta ve gün seçimi için state'ler
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);
  const [showWeekPicker, setShowWeekPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);

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

  const createProgram = () => {
    showToast(`Günlük Saat Aralığı: ${dailyTimeRange}\nDers Süresi: ${lessonDuration} dakika\nTenefüs Süresi: ${breakDuration} dakika\nGün Sayısı: ${dayCount}`, 'success', 'Program Oluşturuldu');
    setShowAddModal(false);
  };

  const toggleComplete = (id: string) => {
    setAssignments(assignments.map(assignment =>
      assignment.id === id
        ? { ...assignment, isCompleted: !assignment.isCompleted }
        : assignment
    ));
  };

  const deleteAssignment = (id: string) => {
    Alert.alert('Sil', 'Bu ödevi silmek istediğinizden emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          setAssignments(assignments.filter(assignment => assignment.id !== id));
        },
      },
    ]);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Yüksek': return '#EF4444';
      case 'Orta': return '#F59E0B';
      case 'Düşük': return '#10B981';
      default: return '#6B7280';
    }
  };

  const completedCount = assignments.filter(assignment => assignment.isCompleted).length;
  const totalCount = assignments.length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#4ECDC4', '#44A08D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Ionicons name="book-outline" size={40} color="white" />
            <Text style={styles.headerTitle}>Ödevlerim</Text>
            <Text style={styles.headerSubtitle}>
              Görevlerinizi takip edin ve tamamlayın
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Hafta ve Gün Seçimi */}
          <View style={styles.selectionContainer}>
            {/* Hafta Seçici */}
            <View style={styles.weekSelector}>
              <Text style={styles.sectionTitle}>Hafta Seçimi</Text>
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

            {/* Gün Seçici */}
            <View style={styles.daySelector}>
              <Text style={styles.sectionTitle}>Gün Seçimi</Text>
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

          {/* İstatistik Kartları */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{totalCount}</Text>
              <Text style={styles.statLabel}>Toplam Ödev</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{completedCount}</Text>
              <Text style={styles.statLabel}>Tamamlanan</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{totalCount - completedCount}</Text>
              <Text style={styles.statLabel}>Bekleyen</Text>
            </View>
          </View>

          {/* Ödev Listesi */}
          <View style={styles.assignmentsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ödevlerim</Text>
            </View>

            {assignments.map((assignment) => (
              <View key={assignment.id} style={styles.assignmentCard}>
                <View style={styles.assignmentHeader}>
                  <TouchableOpacity 
                    style={styles.checkbox}
                    onPress={() => toggleComplete(assignment.id)}
                  >
                    <Ionicons 
                      name={assignment.isCompleted ? "checkmark-circle" : "ellipse-outline"} 
                      size={24} 
                      color={assignment.isCompleted ? "#10B981" : "#6B7280"} 
                    />
                  </TouchableOpacity>
                  
                  <View style={styles.assignmentInfo}>
                    <Text style={[
                      styles.assignmentTitle,
                      assignment.isCompleted && styles.completedText
                    ]}>
                      {assignment.title}
                    </Text>
                    <Text style={styles.assignmentSubject}>{assignment.subject}</Text>
                  </View>

                  <View style={styles.assignmentActions}>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(assignment.priority) }]}>
                      <Text style={styles.priorityText}>{assignment.priority}</Text>
                    </View>
                    <TouchableOpacity onPress={() => deleteAssignment(assignment.id)}>
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.assignmentDescription}>{assignment.description}</Text>
                <Text style={styles.assignmentDueDate}>Teslim: {assignment.dueDate}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>

      {/* Ödev Ekleme Modalı */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Program Oluştur</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Günlük Saat Aralığı */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Günlük Saat Aralığı</Text>
                <View style={styles.timeRangeContainer}>
                  <TextInput
                    style={styles.timeInput}
                    placeholder="08:00"
                    value={dailyTimeRange.split(' - ')[0]}
                    onChangeText={(text) => setDailyTimeRange(`${text} - ${dailyTimeRange.split(' - ')[1]}`)}
                  />
                  <Text style={styles.timeSeparator}>-</Text>
                  <TextInput
                    style={styles.timeInput}
                    placeholder="18:00"
                    value={dailyTimeRange.split(' - ')[1]}
                    onChangeText={(text) => setDailyTimeRange(`${dailyTimeRange.split(' - ')[0]} - ${text}`)}
                  />
                </View>
              </View>

              {/* Ders Süresi */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Ders Süresi (dakika)</Text>
                <View style={styles.durationOptions}>
                  {[30, 45, 60, 90].map((duration) => (
                    <TouchableOpacity
                      key={duration}
                      style={[
                        styles.durationOption,
                        lessonDuration === duration && styles.selectedDurationOption
                      ]}
                      onPress={() => setLessonDuration(duration)}
                    >
                      <Text style={[
                        styles.durationOptionText,
                        lessonDuration === duration && styles.selectedDurationOptionText
                      ]}>
                        {duration} dk
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Tenefüs Süresi */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Tenefüs Süresi (dakika)</Text>
                <View style={styles.durationOptions}>
                  {[5, 10, 15, 20].map((duration) => (
                    <TouchableOpacity
                      key={duration}
                      style={[
                        styles.durationOption,
                        breakDuration === duration && styles.selectedDurationOption
                      ]}
                      onPress={() => setBreakDuration(duration)}
                    >
                      <Text style={[
                        styles.durationOptionText,
                        breakDuration === duration && styles.selectedDurationOptionText
                      ]}>
                        {duration} dk
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Gün Sayısı */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Gün Sayısı</Text>
                <View style={styles.durationOptions}>
                  {[5, 6, 7].map((count) => (
                    <TouchableOpacity
                      key={count}
                      style={[
                        styles.durationOption,
                        dayCount === count && styles.selectedDurationOption
                      ]}
                      onPress={() => setDayCount(count)}
                    >
                      <Text style={[
                        styles.durationOptionText,
                        dayCount === count && styles.selectedDurationOptionText
                      ]}>
                        {count} gün
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={createProgram}>
              <Text style={styles.saveButtonText}>Program Oluştur</Text>
            </TouchableOpacity>
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
                    setSelectedWeek(option.value);
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
                    setSelectedDay(option.value);
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
    padding: 20,
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
    marginBottom: 8,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  assignmentsContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  assignmentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assignmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    marginRight: 12,
  },
  assignmentInfo: {
    flex: 1,
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  assignmentSubject: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  assignmentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  assignmentDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  assignmentDueDate: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
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
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  priorityOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedPriorityOption: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  priorityOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  selectedPriorityOptionText: {
    color: 'white',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedOption: {
    backgroundColor: '#eff6ff',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  selectedOptionText: {
    color: '#3b82f6',
    fontWeight: '600',
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
  durationOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  durationOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    marginHorizontal: 4,
    marginVertical: 4,
    alignItems: 'center',
  },
  selectedDurationOption: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  durationOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  selectedDurationOptionText: {
    color: 'white',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
