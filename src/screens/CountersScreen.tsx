import React, { useState, useEffect } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';


interface Counter {
  id: string;
  title: string;
  targetDate: Date;
  description: string;
  color: string;
}

export default function CountersScreen() {
  const [counters, setCounters] = useState<Counter[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCounter, setSelectedCounter] = useState<Counter | null>(null);
  const [counterTitle, setCounterTitle] = useState('');
  const [counterDescription, setCounterDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const colors = ['#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

  useEffect(() => {
    // Varsayılan sayaçları ekle
    const defaultCounters: Counter[] = [
      {
        id: '1',
        title: 'TYT Sınavı',
        targetDate: new Date('2024-06-15'),
        description: 'Temel Yeterlilik Testi',
        color: '#ef4444',
      },
      {
        id: '2',
        title: 'AYT Sınavı',
        targetDate: new Date('2024-06-16'),
        description: 'Alan Yeterlilik Testi',
        color: '#f59e0b',
      },
    ];
    setCounters(defaultCounters);
  }, []);

  const calculateTimeLeft = (targetDate: Date) => {
    const now = new Date();
    const difference = targetDate.getTime() - now.getTime();

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, isOver: false };
  };

  const addCounter = () => {
    if (!counterTitle.trim()) {
      Alert.alert('Hata', 'Lütfen başlık girin');
      return;
    }

    const newCounter: Counter = {
      id: Date.now().toString(),
      title: counterTitle,
      targetDate: selectedDate,
      description: counterDescription,
      color: colors[Math.floor(Math.random() * colors.length)],
    };

    setCounters([newCounter, ...counters]);
    setModalVisible(false);
    setCounterTitle('');
    setCounterDescription('');
    setSelectedDate(new Date());
  };

  const deleteCounter = (id: string) => {
    Alert.alert('Sil', 'Bu sayacı silmek istediğinizden emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => setCounters(counters.filter(counter => counter.id !== id)),
      },
    ]);
  };

  const editCounter = (counter: Counter) => {
    setSelectedCounter(counter);
    setCounterTitle(counter.title);
    setCounterDescription(counter.description);
    setSelectedDate(counter.targetDate);
    setModalVisible(true);
  };

  const updateCounter = () => {
    if (!selectedCounter) return;

    const updatedCounters = counters.map(counter =>
      counter.id === selectedCounter.id
        ? { ...counter, title: counterTitle, description: counterDescription, targetDate: selectedDate }
        : counter
    );

    setCounters(updatedCounters);
    setModalVisible(false);
    setSelectedCounter(null);
    setCounterTitle('');
    setCounterDescription('');
    setSelectedDate(new Date());
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
              <LinearGradient
                colors={['#3b82f6', '#1e40af', '#7c3aed']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
              >
        <Text style={styles.headerTitle}>Sayaçlar</Text>
        <Text style={styles.headerSubtitle}>Önemli tarihleri takip et        </Text>
      </LinearGradient>

      <View style={styles.content}>
        <ScrollView style={styles.countersContainer} showsVerticalScrollIndicator={false}>
          {counters.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={64} color="#9ca3af" />
              <Text style={styles.emptyStateText}>Henüz sayaç eklenmemiş</Text>
              <Text style={styles.emptyStateSubtext}>
                İlk sayacını eklemek için + butonuna tıkla
              </Text>
            </View>
          ) : (
            counters.map((counter) => {
              const timeLeft = calculateTimeLeft(counter.targetDate);
              return (
                <View key={counter.id} style={styles.counterCard}>
                  <View style={[styles.counterColor, { backgroundColor: counter.color }]} />
                  <View style={styles.counterContent}>
                    <View style={styles.counterHeader}>
                      <Text style={styles.counterTitle}>{counter.title}</Text>
                      <View style={styles.counterActions}>
                        <TouchableOpacity onPress={() => editCounter(counter)}>
                          <Ionicons name="create-outline" size={20} color="#6b7280" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteCounter(counter.id)}>
                          <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    <Text style={styles.counterDescription}>{counter.description}</Text>
                    <Text style={styles.counterDate}>Hedef Tarih: {formatDate(counter.targetDate)}</Text>
                    
                    {timeLeft.isOver ? (
                      <View style={styles.overdueContainer}>
                        <Ionicons name="alert-circle" size={24} color="#ef4444" />
                        <Text style={styles.overdueText}>Süre Doldu!</Text>
                      </View>
                    ) : (
                      <View style={styles.timeLeftContainer}>
                        <View style={styles.timeUnit}>
                          <Text style={styles.timeNumber}>{timeLeft.days}</Text>
                          <Text style={styles.timeLabel}>Gün</Text>
                        </View>
                        <View style={styles.timeUnit}>
                          <Text style={styles.timeNumber}>{timeLeft.hours}</Text>
                          <Text style={styles.timeLabel}>Saat</Text>
                        </View>
                        <View style={styles.timeUnit}>
                          <Text style={styles.timeNumber}>{timeLeft.minutes}</Text>
                          <Text style={styles.timeLabel}>Dakika</Text>
                        </View>
                        <View style={styles.timeUnit}>
                          <Text style={styles.timeNumber}>{timeLeft.seconds}</Text>
                          <Text style={styles.timeLabel}>Saniye</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedCounter ? 'Sayacı Düzenle' : 'Yeni Sayaç'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Başlık</Text>
              <TextInput
                style={styles.input}
                placeholder="Sayaç başlığı"
                value={counterTitle}
                onChangeText={setCounterTitle}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Açıklama</Text>
              <TextInput
                style={styles.input}
                placeholder="Sayaç açıklaması"
                value={counterDescription}
                onChangeText={setCounterDescription}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Hedef Tarih</Text>
              <Text style={styles.dateDisplay}>
                {formatDate(selectedDate)}
              </Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  // Burada tarih seçici açılacak
                  Alert.alert('Bilgi', 'Tarih seçici özelliği eklenecek');
                }}
              >
                <Text style={styles.dateButtonText}>Tarih Seç</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={selectedCounter ? updateCounter : addCounter}
            >
              <Text style={styles.saveButtonText}>
                {selectedCounter ? 'Güncelle' : 'Kaydet'}
              </Text>
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
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
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
  countersContainer: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
  counterCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
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
  counterColor: {
    width: 6,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  counterContent: {
    flex: 1,
    padding: 16,
  },
  counterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  counterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  counterActions: {
    flexDirection: 'row',
    gap: 12,
  },
  counterDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  counterDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 16,
  },
  overdueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  overdueText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: 8,
  },
  timeLeftContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeUnit: {
    alignItems: 'center',
    flex: 1,
  },
  timeNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
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
  dateDisplay: {
    fontSize: 16,
    color: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 10,
  },
  dateButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
