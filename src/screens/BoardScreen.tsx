import React, { useState, useEffect, useRef } from 'react';
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
  Image,
  PanResponder,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';


interface Note {
  id: string;
  title: string;
  content: string;
  subject: string;
  date: string;
  color: string;
  isFavorite: boolean;
  x?: number;
  y?: number;
}

export default function BoardScreen() {
  const { colors: themeColors } = useTheme();
  const navigation = useNavigation();
  const [notes, setNotes] = useState<Note[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FFE066');
  const [selectedTextColor, setSelectedTextColor] = useState('#000000');
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [boardColor, setBoardColor] = useState('#D2691E');
  const [frameColor, setFrameColor] = useState('#8B4513');
  const [fontFamily, setFontFamily] = useState('System');
  const [boardImage, setBoardImage] = useState<string | null>(null);
  const colors = ['#FFE066', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#800080', '#FFFFFF'];
  const textColors = ['#000000', '#FFFFFF', '#000080', '#FF0000', '#800080'];
  const boardColors = [
    '#D2691E', '#CD853F', '#DEB887', '#F4A460', '#D2B48C', 
    '#F5DEB3', '#DDA0DD', '#98FB98', '#F0E68C', '#FFB6C1' // Son rengi pembe olarak geri getirdik
  ];
  const frameColors = [
    '#8B4513', '#A0522D', '#654321', '#5D4037', '#3E2723', 
    '#000000', '#2F4F4F', '#8B0000', '#4B0082', '#2E8B57'
  ];
  const fontFamilies = ['System', 'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana'];

  // Veri yükleme
  useEffect(() => {
    loadData();
  }, []);

  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const loadData = async () => {
    try {
      const savedNotes = await AsyncStorage.getItem('boardNotes');
      const savedSettings = await AsyncStorage.getItem('boardSettings');
      
      console.log('Yüklenen notlar:', savedNotes ? JSON.parse(savedNotes).length : 0);
      console.log('Yüklenen ayarlar:', savedSettings);
      
      if (savedNotes) {
        const parsedNotes = JSON.parse(savedNotes);
        // Eski notlar için varsayılan pozisyonlar ekle
        const notesWithPositions = parsedNotes.map((note: Note, index: number) => ({
          ...note,
          x: note.x !== undefined ? note.x : Math.random() * 100,
          y: note.y !== undefined ? note.y : Math.floor(index / 2) * 200 + Math.random() * 50,
        }));
        setNotes(notesWithPositions);
      }
      
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        console.log('Ayarlar parse edildi:', settings);
        setBoardColor(settings.boardColor || '#D2691E');
        setFrameColor(settings.frameColor || '#8B4513');
        setFontFamily(settings.fontFamily || 'System');
        setSelectedColor(settings.selectedColor || '#FFE066');
        setSelectedTextColor(settings.selectedTextColor || '#000000');
        setBoardImage(settings.boardImage || null);
      }
      
      setIsDataLoaded(true);
    } catch (error) {
      console.log('Veri yüklenirken hata:', error);
      setIsDataLoaded(true);
    }
  };

  // Notları kaydetme
  const saveNotes = async (notesToSave: Note[]) => {
    try {
      await AsyncStorage.setItem('boardNotes', JSON.stringify(notesToSave));
    } catch (error) {
      console.log('Notlar kaydedilirken hata:', error);
    }
  };

  // Ayarları kaydetme
  const saveSettings = async () => {
    try {
      const settings = {
        boardColor,
        frameColor,
        fontFamily,
        selectedColor,
        selectedTextColor,
        boardImage,
      };
      console.log('Ayarlar kaydediliyor:', settings);
      await AsyncStorage.setItem('boardSettings', JSON.stringify(settings));
      console.log('Ayarlar başarıyla kaydedildi');
    } catch (error) {
      console.log('Ayarlar kaydedilirken hata:', error);
    }
  };

  // Ayarlar değiştiğinde kaydet (sadece veri yüklendikten sonra)
  // Bu useEffect'i kaldırdık çünkü çok sık tetikleniyordu
  // Ayarlar artık sadece "Kaydet" butonuna basıldığında kaydediliyor

  const addNote = () => {
    if (!noteTitle.trim() || !noteContent.trim()) {
      Alert.alert('Hata', 'Lütfen başlık ve içerik girin');
      return;
    }

    const newNote: Note = {
      id: Date.now().toString(),
      title: noteTitle,
      content: noteContent,
      subject: '',
      date: new Date().toLocaleDateString('tr-TR'),
      color: selectedColor,
      isFavorite: false,
      x: Math.random() * 100,
      y: Math.random() * 200,
    };

    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
    setModalVisible(false);
    setNoteTitle('');
    setNoteContent('');
    setSelectedColor('#FFE066');
  };

  const deleteNote = (id: string) => {
    // Web için window.confirm, mobil için Alert.alert
    const isWeb = typeof window !== 'undefined' && window.confirm;
    
    if (isWeb) {
      if (window.confirm('Bu notu silmek istediğinizden emin misiniz?')) {
        const updatedNotes = notes.filter(note => note.id !== id);
        setNotes(updatedNotes);
        saveNotes(updatedNotes);
      }
    } else {
      Alert.alert('Sil', 'Bu notu silmek istediğinizden emin misiniz?', [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            const updatedNotes = notes.filter(note => note.id !== id);
            setNotes(updatedNotes);
            saveNotes(updatedNotes);
          },
        },
      ]);
    }
  };

  const editNote = (note: Note) => {
    setSelectedNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setSelectedColor(note.color);
    setModalVisible(true);
  };

  const updateNote = () => {
    if (!selectedNote) return;

    const updatedNotes = notes.map(note =>
      note.id === selectedNote.id
        ? { ...note, title: noteTitle, content: noteContent, color: selectedColor }
        : note
    );

    setNotes(updatedNotes);
    saveNotes(updatedNotes);
    setModalVisible(false);
    setSelectedNote(null);
    setNoteTitle('');
    setNoteContent('');
    setSelectedColor('#FFE066');
  };

  const toggleFavorite = (id: string) => {
    const updatedNotes = notes.map(note =>
      note.id === id
        ? { ...note, isFavorite: !note.isFavorite }
        : note
    );
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
  };

  // Resim seçme fonksiyonu
  const pickImage = async () => {
    try {
      // İzin iste
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Hata', 'Galeri erişim izni gerekli');
        return;
      }

      // Resim seç
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setBoardImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Resim seçilirken hata:', error);
      Alert.alert('Hata', 'Resim seçilemedi');
    }
  };

  // Resmi kaldırma fonksiyonu
  const removeImage = () => {
    setBoardImage(null);
  };

  const filteredNotes = notes.sort((a, b) => {
    // Önce favori durumuna göre sırala (favoriler önce)
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    
    // Favori notlar arasında ID'ye göre sırala (son eklenen/yıldızlanan önce)
    if (a.isFavorite && b.isFavorite) {
      return parseInt(b.id) - parseInt(a.id);
    }
    
    // Favori olmayan notlar arasında tarihe göre sırala (yeni tarihler önce)
    return new Date(b.date.split('.').reverse().join('-')).getTime() - 
           new Date(a.date.split('.').reverse().join('-')).getTime();
  });

  // Not kartı komponenti - sürükle bırak için
  const DraggableNote = React.memo(({ 
    note, 
    onPositionUpdate,
    onToggleFavorite,
    onEditNote,
    onDeleteNote,
    fontFamily,
    selectedTextColor,
  }: { 
    note: Note; 
    onPositionUpdate: (id: string, x: number, y: number) => void;
    onToggleFavorite: (id: string) => void;
    onEditNote: (note: Note) => void;
    onDeleteNote: (id: string) => void;
    fontFamily: string;
    selectedTextColor: string;
  }) => {
    const rotation = (note.id.charCodeAt(0) % 9 - 4) * 1.0;
    const pan = useRef(new Animated.ValueXY({
      x: note.x || 0,
      y: note.y || 0,
    })).current;

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          pan.setOffset({
            x: (pan.x as any).__getValue(),
            y: (pan.y as any).__getValue(),
          });
          pan.setValue({ x: 0, y: 0 });
        },
        onPanResponderMove: Animated.event(
          [null, { dx: pan.x, dy: pan.y }],
          { useNativeDriver: false }
        ),
        onPanResponderRelease: () => {
          pan.flattenOffset();
          const newX = (pan.x as any).__getValue();
          const newY = (pan.y as any).__getValue();
          onPositionUpdate(note.id, newX, newY);
        },
      })
    ).current;

    // Pozisyon değiştiğinde animasyon değerini güncelle
    useEffect(() => {
      if (note.x !== undefined && note.y !== undefined) {
        pan.setValue({ x: note.x, y: note.y });
      }
    }, [note.x, note.y]);

    return (
      <Animated.View
        style={[
          styles.noteCard,
          {
            backgroundColor: note.color,
            transform: [
              { rotate: `${rotation}deg` },
              { translateX: pan.x },
              { translateY: pan.y },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.noteHeader}>
          <Text style={[styles.noteTitle, { fontFamily: fontFamily, color: selectedTextColor }]} numberOfLines={2}>{note.title}</Text>
          <View style={styles.noteActions}>
            <TouchableOpacity onPress={() => onToggleFavorite(note.id)}>
              <Ionicons 
                name={note.isFavorite ? "star" : "star-outline"} 
                size={18} 
                color={note.isFavorite ? "#ef4444" : "#6b7280"} 
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onEditNote(note)}>
              <Ionicons name="create-outline" size={18} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDeleteNote(note.id)}>
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.noteText, { fontFamily: fontFamily, color: selectedTextColor }]} numberOfLines={4}>
          {note.content}
        </Text>
        <View style={styles.noteFooter}>
          <Text style={styles.noteDate}>{note.date}</Text>
        </View>
      </Animated.View>
    );
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <LinearGradient
        colors={['#3b82f6', '#1e40af', '#7c3aed']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Mantar Pano</Text>
        <Text style={styles.headerSubtitle}>Notlarını organize et</Text>
      </LinearGradient>

      <View style={styles.content}>
        <ScrollView 
          style={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          alwaysBounceVertical={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Mantar Pano - Notlarla Entegre */}
          <View style={[
            styles.corkBoard,
            { 
              minHeight: Math.max(800, Math.ceil(filteredNotes.length / 3) * 180 + 200),
              backgroundColor: boardImage ? 'transparent' : boardColor,
              borderColor: frameColor,
            }
          ]}>
            {/* Pano Resmi */}
            {boardImage && (
              <Image 
                source={{ uri: boardImage }} 
                style={styles.boardImage}
                resizeMode="cover"
              />
            )}
            {/* Notlar Mantar Panonun İçinde */}
            <View style={styles.notesContainer}>
              {filteredNotes.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="document-text-outline" size={64} color="#9ca3af" />
                  <Text style={styles.emptyStateText}>Henüz not eklenmemiş</Text>
                  <Text style={styles.emptyStateSubtext}>
                    İlk notunu eklemek için + butonuna tıkla
                  </Text>
                </View>
              ) : (
                filteredNotes.map((note) => (
                  <DraggableNote
                    key={note.id}
                    note={note}
                    onPositionUpdate={(id, x, y) => {
                      const updatedNotes = notes.map((n) =>
                        n.id === id ? { ...n, x, y } : n
                      );
                      setNotes(updatedNotes);
                      saveNotes(updatedNotes);
                    }}
                    onToggleFavorite={toggleFavorite}
                    onEditNote={editNote}
                    onDeleteNote={deleteNote}
                    fontFamily={fontFamily}
                    selectedTextColor={selectedTextColor}
                  />
                ))
              )}
            </View>
          </View>
          {/* Pano altına yerleştirilen geri dön butonu */}
          <TouchableOpacity 
            style={styles.backHomeBottomButton}
            onPress={() => navigation.navigate('Main' as never, { screen: 'Ana Sayfa' } as never)}
          >
            <Ionicons name="home" size={18} color="white" />
            <Text style={styles.backHomeBottomText}>Ana Sayfaya Dön</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fab, styles.customizeFab]}
          onPress={() => setShowCustomizeModal(true)}
        >
          <Ionicons name="create" size={24} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.fab, styles.addFab]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

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
                {selectedNote ? 'Notu Düzenle' : 'Yeni Not'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Başlık</Text>
              <TextInput
                style={styles.input}
                placeholder="Not başlığı"
                value={noteTitle}
                onChangeText={setNoteTitle}
              />
            </View>


            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>İçerik</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Not içeriği..."
                value={noteContent}
                onChangeText={setNoteContent}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>


            <TouchableOpacity
              style={styles.saveButton}
              onPress={selectedNote ? updateNote : addNote}
            >
              <Text style={styles.saveButtonText}>
                {selectedNote ? 'Güncelle' : 'Kaydet'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

        {/* Özelleştirme Modalı */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showCustomizeModal}
          onRequestClose={() => setShowCustomizeModal(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20
          }}>
            <View style={{
              backgroundColor: themeColors.surface,
              borderRadius: 20,
              width: '100%',
              maxHeight: '80%',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 10
            }}>
              {/* Modal Header */}
              <View style={{
                padding: 20,
                borderBottomWidth: 1,
                borderBottomColor: themeColors.border,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Text style={{fontSize: 20, fontWeight: 'bold', color: themeColors.text}}>Pano Özelleştir</Text>
                <TouchableOpacity onPress={() => setShowCustomizeModal(false)}>
                  <Ionicons name="close" size={24} color={themeColors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{maxHeight: 400, padding: 20, backgroundColor: themeColors.surface}} showsVerticalScrollIndicator={false}>
            <View style={{marginBottom: 30}}>
              <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: themeColors.text}}>
                Pano Rengi
              </Text>
              <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 15}}>
                {boardColors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={{
                      width: 45,
                      height: 45,
                      backgroundColor: color,
                      borderRadius: 22.5,
                      borderWidth: boardColor === color ? 4 : 2,
                      borderColor: boardColor === color ? '#1f2937' : '#d1d5db'
                    }}
                    onPress={() => setBoardColor(color)}
                  />
                ))}
              </View>
            </View>

            <View style={{marginBottom: 30}}>
              <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: themeColors.text}}>
                Pano Resmi
              </Text>
              <View style={{alignItems: 'center'}}>
                <TouchableOpacity 
                  style={{
                    backgroundColor: themeColors.card,
                    paddingHorizontal: 20,
                    paddingVertical: 15,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: themeColors.border,
                    borderStyle: 'dashed',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10
                  }}
                  onPress={pickImage}
                >
                  <Ionicons name="image-outline" size={24} color="#3b82f6" />
                  <Text style={{fontSize: 16, color: '#3b82f6', fontWeight: '500'}}>
                    {boardImage ? 'Resmi Değiştir' : 'Resim Seç'}
                  </Text>
                </TouchableOpacity>
                
                {boardImage && (
                  <View style={{marginTop: 15, position: 'relative'}}>
                    <Image 
                      source={{ uri: boardImage }} 
                      style={{
                        width: 120,
                        height: 80,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor: '#d1d5db'
                      }} 
                    />
                    <TouchableOpacity 
                      style={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        backgroundColor: 'white',
                        borderRadius: 12,
                        width: 24,
                        height: 24,
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onPress={removeImage}
                    >
                      <Ionicons name="close-circle" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            <View style={{marginBottom: 30}}>
              <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: themeColors.text}}>
                Çerçeve Rengi
              </Text>
              <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 15}}>
                {frameColors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={{
                      width: 45,
                      height: 45,
                      backgroundColor: color,
                      borderRadius: 22.5,
                      borderWidth: frameColor === color ? 4 : 2,
                      borderColor: frameColor === color ? '#1f2937' : '#d1d5db'
                    }}
                    onPress={() => setFrameColor(color)}
                  />
                ))}
              </View>
            </View>

            <View style={{marginBottom: 30}}>
              <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: themeColors.text}}>
                Not Kağıdı Rengi
              </Text>
              <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 15}}>
                {colors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={{
                      width: 45,
                      height: 45,
                      backgroundColor: color,
                      borderRadius: 22.5,
                      borderWidth: selectedColor === color ? 4 : 2,
                      borderColor: selectedColor === color ? '#1f2937' : '#d1d5db'
                    }}
                    onPress={() => setSelectedColor(color)}
                  />
                ))}
              </View>
            </View>

            <View style={{marginBottom: 30}}>
              <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: themeColors.text}}>
                Yazı Rengi
              </Text>
              <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 15}}>
                {textColors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={{
                      width: 45,
                      height: 45,
                      backgroundColor: color,
                      borderRadius: 22.5,
                      borderWidth: selectedTextColor === color ? 4 : 2,
                      borderColor: selectedTextColor === color ? '#1f2937' : '#d1d5db'
                    }}
                    onPress={() => setSelectedTextColor(color)}
                  />
                ))}
              </View>
            </View>

            <View style={{marginBottom: 30}}>
              <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: themeColors.text}}>
                Yazı Tipi
              </Text>
              <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10}}>
                {fontFamilies.map((font) => (
                  <TouchableOpacity
                    key={font}
                    style={{
                      paddingHorizontal: 15,
                      paddingVertical: 10,
                      backgroundColor: fontFamily === font ? '#3b82f6' : themeColors.card,
                      borderRadius: 20,
                      borderWidth: fontFamily === font ? 2 : 1,
                      borderColor: fontFamily === font ? '#1d4ed8' : themeColors.border
                    }}
                    onPress={() => setFontFamily(font)}
                  >
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: fontFamily === font ? 'white' : themeColors.text,
                      fontFamily: font
                    }}>
                      {font}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
              </ScrollView>

              <View style={{padding: 20, backgroundColor: themeColors.surface, borderTopWidth: 1, borderTopColor: themeColors.border}}>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#3b82f6',
                    paddingVertical: 15,
                    borderRadius: 10,
                    alignItems: 'center'
                  }}
                  onPress={async () => {
                    await saveSettings();
                    setShowCustomizeModal(false);
                  }}
                >
                  <Text style={{color: 'white', fontSize: 16, fontWeight: 'bold'}}>Kaydet</Text>
                </TouchableOpacity>
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
  backHomeBottomButton: {
    alignSelf: 'center',
    marginTop: 16,
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  backHomeBottomText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
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
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // FAB ve tab navigator için boşluk
  },
  corkBoard: {
    margin: 20,
    backgroundColor: '#D2691E', // Ana mantar rengi
    borderRadius: 12, // Normal köşeler
    borderWidth: 6, // Normal çerçeve kalınlığı
    borderColor: '#8B4513', // Düz kahverengi çerçeve
    minHeight: 800, // Yeterli yükseklik
    width: '90%', // Genişlik sabit
    alignSelf: 'center', // Pano ortalama
    position: 'relative',
    overflow: 'hidden', // Notların panodan taşmaması için
    // Basit mantar dokusu için
    borderStyle: 'solid',
  },
  notesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 30,
    paddingVertical: 30,
    width: '100%',
    height: '100%',
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
  noteCard: {
    width: 180, // Küçültüldü
    height: 120, // Küçültüldü
    backgroundColor: '#FFE066',
    borderRadius: 8,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    padding: 12,
    zIndex: 1,
  },
  noteContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    marginRight: 4,
  },
  noteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  noteText: {
    fontSize: 11,
    color: '#4b5563',
    lineHeight: 16,
    marginBottom: 6,
    flex: 1,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteSubject: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  noteDate: {
    fontSize: 10,
    color: '#6b7280',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    flexDirection: 'column',
    gap: 16,
  },
  fab: {
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
  customizeFab: {
    backgroundColor: '#f59e0b', // Turuncu renk
  },
  addFab: {
    backgroundColor: '#3b82f6', // Mavi renk
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
    flexDirection: 'column',
  },
  modalScrollView: {
    flex: 1,
    maxHeight: 500, // ScrollView için maksimum yükseklik
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
    height: 120,
    textAlignVertical: 'top',
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    justifyContent: 'center',
  },
  colorOption: {
    width: 35,
    height: 35,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  whiteColorOption: {
    width: 35,
    height: 35,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#D2B48C', // Beyaz için krem çerçeve
    backgroundColor: '#FFFFFF',
  },
  selectedColor: {
    borderColor: '#374151',
    borderWidth: 3,
  },
  fontPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  fontOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  selectedFont: {
    borderColor: '#3b82f6',
    backgroundColor: '#dbeafe',
  },
  fontOptionText: {
    fontSize: 14,
    color: '#374151',
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
  boardImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 6, // Pano border radius'u ile aynı (6px border için)
  },
  imagePickerContainer: {
    marginTop: 8,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  imagePickerText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '500',
  },
  imagePreviewContainer: {
    marginTop: 12,
    position: 'relative',
    alignSelf: 'center',
  },
  imagePreview: {
    width: 120,
    height: 90,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 10,
  },
});