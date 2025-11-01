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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigation } from '@react-navigation/native';

interface Note {
  id: string;
  title: string;
  content: string;
  subject: string;
  date: string;
  color: string;
  textColor: string;
  isFavorite: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  shape?: 'rectangle' | 'rounded' | 'circle';
  font?: string;
  isEditing?: boolean;
}

interface BoardSettings {
  boardColor: string;
  frameColor: string;
  boardWidth: number;
  boardHeight: number;
  boardImage: any;
  defaultNoteShape: 'rectangle' | 'rounded' | 'circle';
  defaultNoteFont: string;
  defaultNoteColor: string;
  defaultTextColor: string;
}

export default function BoardScreen() {
  const { colors: themeColors } = useTheme();
  const { showToast } = useToast();
  const navigation = useNavigation();
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const [notes, setNotes] = useState<Note[]>([]);
  const [boardSettings, setBoardSettings] = useState<BoardSettings>({
    boardColor: '#D2691E',
    frameColor: '#8B4513',
    boardWidth: Math.min(screenWidth * 0.9, 900),
    boardHeight: 800,
    boardImage: require('../image/ss.jpg'),
    defaultNoteShape: 'rectangle',
    defaultNoteFont: 'System',
    defaultNoteColor: '#FFE066',
    defaultTextColor: '#000000',
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerType, setColorPickerType] = useState<'note' | 'text' | 'board' | 'frame' | null>(null);
  const [selectedNoteForColor, setSelectedNoteForColor] = useState<Note | null>(null);
  const [hexColorInput, setHexColorInput] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FF0000');
  const [hue, setHue] = useState(0); // 0-360
  const [saturation, setSaturation] = useState(100); // 0-100
  const [lightness, setLightness] = useState(50); // 0-100
  const hueSliderLayoutRef = useRef<{ width: number; x: number } | null>(null);
  const saturationLightnessLayoutRef = useRef<{ width: number; height: number; x: number; y: number } | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollPositionRef = useRef<number>(0);
  const isEditingRef = useRef<boolean>(false);
  const scrollLockRef = useRef<boolean>(false);

  const noteColors = [
    '#FFE066', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#800080', '#FFFFFF',
    '#FFFACD', '#E6E6FA', '#F0FFF0', '#FFE4E1', '#F0F8FF'
  ];
  const textColors = [
    '#000000', '#FFFFFF', '#000080', '#FF0000', '#800080',
    '#008000', '#FFA500', '#008080', '#4B0082', '#DC143C'
  ];
  const boardColors = [
    '#D2691E', '#CD853F', '#DEB887', '#F4A460', '#D2B48C',
    '#F5DEB3', '#DDA0DD', '#98FB98', '#F0E68C', '#FFB6C1'
  ];
  const frameColors = [
    '#8B4513', '#A0522D', '#654321', '#5D4037', '#3E2723',
    '#000000', '#2F4F4F', '#8B0000', '#4B0082', '#2E8B57'
  ];
  const fontFamilies = ['System', 'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana'];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (showColorPicker && colorPickerType) {
      let currentColor = '';
      if (selectedNoteForColor) {
        currentColor = colorPickerType === 'note' ? selectedNoteForColor.color : selectedNoteForColor.textColor;
      } else if (colorPickerType === 'board') {
        currentColor = boardSettings.boardColor;
      } else if (colorPickerType === 'frame') {
        currentColor = boardSettings.frameColor;
      } else if (colorPickerType === 'note') {
        currentColor = boardSettings.defaultNoteColor;
      } else if (colorPickerType === 'text') {
        currentColor = boardSettings.defaultTextColor;
      }
      setHexColorInput(currentColor.replace('#', ''));
      
      // Convert hex to HSL
      const hex = currentColor.replace('#', '');
      if (hex.length === 6) {
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;
        
        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          if (max === r) {
            h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          } else if (max === g) {
            h = ((b - r) / d + 2) / 6;
          } else {
            h = ((r - g) / d + 4) / 6;
          }
        }
        
        setHue(h * 360);
        setSaturation(s * 100);
        setLightness(l * 100);
      }
    }
  }, [showColorPicker, colorPickerType, selectedNoteForColor]);

  const loadData = async () => {
    try {
      const savedNotes = await AsyncStorage.getItem('boardNotes');
      const savedSettings = await AsyncStorage.getItem('boardSettings');
      
      if (savedNotes) {
        const parsedNotes = JSON.parse(savedNotes);
        const notesWithDefaults = parsedNotes.map((note: Note, index: number) => ({
          ...note,
          x: note.x ?? Math.random() * 200,
          y: note.y ?? Math.floor(index / 2) * 200 + Math.random() * 50,
          width: note.width ?? 160,
          height: note.height ?? 120,
          rotation: note.rotation ?? (Math.random() * 6 - 3),
          shape: note.shape ?? 'rectangle',
          font: note.font ?? 'System',
          textColor: note.textColor ?? '#000000',
          isEditing: false,
        }));
        setNotes(notesWithDefaults);
      }
      
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setBoardSettings({
          ...boardSettings,
          ...settings,
          boardWidth: settings.boardWidth ?? boardSettings.boardWidth,
          boardHeight: settings.boardHeight ?? boardSettings.boardHeight,
          // Eğer kaydedilen ayarlarda resim yoksa veya geçersizse varsayılan resmi kullan
          boardImage: settings.boardImage ? (typeof settings.boardImage === 'string' ? settings.boardImage : require('../image/ss.jpg')) : require('../image/ss.jpg'),
        });
      }
      
      setIsDataLoaded(true);
    } catch (error) {
      console.log('Veri yüklenirken hata:', error);
      setIsDataLoaded(true);
    }
  };

  const saveNotes = async (notesToSave: Note[]) => {
    try {
      await AsyncStorage.setItem('boardNotes', JSON.stringify(notesToSave));
    } catch (error) {
      console.log('Notlar kaydedilirken hata:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('boardSettings', JSON.stringify(boardSettings));
      showToast('Ayarlar kaydedildi', 'success');
    } catch (error) {
      console.log('Ayarlar kaydedilirken hata:', error);
      showToast('Ayarlar kaydedilemedi', 'error');
    }
  };

  const createNewNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Yeni Not',
      content: 'Not içeriğini buraya yazın...',
      subject: '',
      date: new Date().toLocaleDateString('tr-TR'),
      color: boardSettings.defaultNoteColor,
      textColor: boardSettings.defaultTextColor,
      isFavorite: false,
      x: Math.random() * (boardSettings.boardWidth - 200),
      y: Math.random() * (boardSettings.boardHeight - 160),
      width: 160,
      height: 120,
      rotation: Math.random() * 6 - 3,
      shape: boardSettings.defaultNoteShape,
      font: boardSettings.defaultNoteFont,
      isEditing: true,
    };

    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
    setEditingNoteId(newNote.id);
  };

  const deleteNote = (id: string) => {
    Alert.alert('Sil', 'Bu notu silmek istediğinizden emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          const updatedNotes = notes.filter(note => note.id !== id);
          setNotes(updatedNotes);
          saveNotes(updatedNotes);
          if (editingNoteId === id) setEditingNoteId(null);
        },
      },
    ]);
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    const updatedNotes = notes.map(note =>
      note.id === id ? { ...note, ...updates } : note
    );
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
    
    // Clear editingNoteId when editing is finished
    if (updates.isEditing === false && editingNoteId === id) {
      setEditingNoteId(null);
    }
  };

  const toggleFavorite = (id: string) => {
    updateNote(id, { isFavorite: !notes.find(n => n.id === id)?.isFavorite });
  };

  // HSL to HEX conversion
  const hslToHex = (h: number, s: number, l: number): string => {
    // Normalize h to 0-360 range
    h = h % 360;
    if (h < 0) h += 360;
    
    // Normalize s and l to 0-1 range
    s = Math.max(0, Math.min(1, s));
    l = Math.max(0, Math.min(1, l));
    
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const hNorm = h / 360;
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, hNorm + 1/3);
      g = hue2rgb(p, q, hNorm);
      b = hue2rgb(p, q, hNorm - 1/3);
    }
    
    const toHex = (c: number) => {
      const hex = Math.round(Math.max(0, Math.min(255, c * 255))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  };

  const colorGridRef = useRef<View>(null);
  const hueSliderRef = useRef<View>(null);
  const saturationLightnessRef = useRef<View>(null);

  // Update color when HSL changes
  useEffect(() => {
    if (showColorPicker) {
      const color = hslToHex(hue, saturation / 100, lightness / 100);
      setSelectedColor(color);
      setHexColorInput(color.replace('#', ''));
      applySelectedColor(color);
    }
  }, [hue, saturation, lightness, showColorPicker]);

  const handleColorGridTouch = (event: any, row?: number, col?: number) => {
    if (row !== undefined && col !== undefined) {
      // Direkt hücre koordinatlarından renk hesapla
      const newHue = (col / 12) * 360;
      const newSaturation = 100 - (row / 12) * 50;
      const newLightness = 50 + (row / 12) * 50;
      setHue(newHue);
      setSaturation(newSaturation);
      setLightness(newLightness);
    }
  };

  const handleHueSliderTouch = (evt: any, gestureState: any) => {
    if (hueSliderLayoutRef.current) {
      const touchX = evt.nativeEvent?.locationX ?? (gestureState.moveX - hueSliderLayoutRef.current.x);
      const clampedX = Math.max(0, Math.min(hueSliderLayoutRef.current.width, touchX));
      const newHue = Math.round((clampedX / hueSliderLayoutRef.current.width) * 360);
      if (newHue !== hue) {
        setHue(newHue);
      }
    } else if (hueSliderRef.current) {
      hueSliderRef.current.measure((x, y, width, height, pageX, pageY) => {
        hueSliderLayoutRef.current = { width, x: pageX };
        const touchX = evt.nativeEvent?.locationX ?? (gestureState.moveX - pageX);
        const clampedX = Math.max(0, Math.min(width, touchX));
        const newHue = Math.round((clampedX / width) * 360);
        if (newHue !== hue) {
          setHue(newHue);
        }
      });
    }
  };

  const handleSaturationLightnessTouch = (evt: any, gestureState: any) => {
    if (saturationLightnessLayoutRef.current) {
      const touchX = evt.nativeEvent?.locationX ?? (gestureState.moveX - saturationLightnessLayoutRef.current.x);
      const touchY = evt.nativeEvent?.locationY ?? (gestureState.moveY - saturationLightnessLayoutRef.current.y);
      const clampedX = Math.max(0, Math.min(saturationLightnessLayoutRef.current.width, touchX));
      const clampedY = Math.max(0, Math.min(saturationLightnessLayoutRef.current.height, touchY));
      const newSaturation = Math.round((clampedX / saturationLightnessLayoutRef.current.width) * 100);
      const newLightness = Math.round(100 - (clampedY / saturationLightnessLayoutRef.current.height) * 100);
      if (newSaturation !== saturation || newLightness !== lightness) {
        setSaturation(newSaturation);
        setLightness(newLightness);
      }
    } else if (saturationLightnessRef.current) {
      saturationLightnessRef.current.measure((x, y, width, height, pageX, pageY) => {
        saturationLightnessLayoutRef.current = { width, height, x: pageX, y: pageY };
        const touchX = evt.nativeEvent?.locationX ?? (gestureState.moveX - pageX);
        const touchY = evt.nativeEvent?.locationY ?? (gestureState.moveY - pageY);
        const clampedX = Math.max(0, Math.min(width, touchX));
        const clampedY = Math.max(0, Math.min(height, touchY));
        const newSaturation = Math.round((clampedX / width) * 100);
        const newLightness = Math.round(100 - (clampedY / height) * 100);
        if (newSaturation !== saturation || newLightness !== lightness) {
          setSaturation(newSaturation);
          setLightness(newLightness);
        }
      });
    }
  };

  // Hue Slider PanResponder
  const hueSliderPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        handleHueSliderTouch(evt, gestureState);
      },
      onPanResponderMove: (evt, gestureState) => {
        handleHueSliderTouch(evt, gestureState);
      },
    })
  ).current;

  // Saturation/Lightness Grid PanResponder
  const saturationLightnessPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        handleSaturationLightnessTouch(evt, gestureState);
      },
      onPanResponderMove: (evt, gestureState) => {
        handleSaturationLightnessTouch(evt, gestureState);
      },
    })
  ).current;

  const applySelectedColor = (color: string) => {
    if (selectedNoteForColor) {
      if (colorPickerType === 'note') {
        updateNote(selectedNoteForColor.id, { color });
      } else if (colorPickerType === 'text') {
        updateNote(selectedNoteForColor.id, { textColor: color });
      }
    } else if (colorPickerType === 'board') {
      setBoardSettings({ ...boardSettings, boardColor: color });
    } else if (colorPickerType === 'frame') {
      setBoardSettings({ ...boardSettings, frameColor: color });
    } else if (colorPickerType === 'note') {
      setBoardSettings({ ...boardSettings, defaultNoteColor: color });
    } else if (colorPickerType === 'text') {
      setBoardSettings({ ...boardSettings, defaultTextColor: color });
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('Galeri erişim izni gerekli', 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setBoardSettings({ ...boardSettings, boardImage: result.assets[0].uri });
      }
    } catch (error) {
      console.log('Resim seçilirken hata:', error);
      showToast('Resim seçilemedi', 'error');
    }
  };

  const getRandomRotation = () => Math.random() * 6 - 3;

  const getNoteStyle = (note: Note) => {
    const baseStyle: any = {
      width: note.width ?? 160,
      height: note.height ?? 120,
      backgroundColor: note.color,
      borderRadius: note.shape === 'circle' ? (note.width ?? 160) / 2 : note.shape === 'rounded' ? 16 : 0,
      transform: [{ rotate: `${note.rotation ?? 0}deg` }],
    };
    return baseStyle;
  };

  // Draggable Note Component
  const DraggableNote = React.memo(({ 
    note, 
    onPositionUpdate,
    onUpdate,
    onDelete,
    onToggleFavorite,
    onStartEditing,
    onStartColorPicker,
    boardWidth,
    boardHeight,
  }: { 
    note: Note; 
    onPositionUpdate: (id: string, x: number, y: number) => void;
    onUpdate: (id: string, updates: Partial<Note>) => void;
    onDelete: (id: string) => void;
    onToggleFavorite: (id: string) => void;
    onStartEditing: (id: string) => void;
    onStartColorPicker: (note: Note, type: 'note' | 'text') => void;
    boardWidth: number;
    boardHeight: number;
  }) => {
    const pan = useRef(new Animated.ValueXY({
      x: note.x ?? 0,
      y: note.y ?? 0,
    })).current;
    
    // Local state for editing to prevent keyboard flicker
    const [localTitle, setLocalTitle] = useState(note.title);
    const [localContent, setLocalContent] = useState(note.content);
    const noteViewRef = useRef<View>(null);
    const notePositionRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
    const titleInputRef = useRef<TextInput>(null);
    
    // Sync local state when note changes (but not when editing)
    useEffect(() => {
      if (!note.isEditing) {
        setLocalTitle(note.title);
        setLocalContent(note.content);
      } else {
        // When entering edit mode, initialize local state
        setLocalTitle(note.title);
        setLocalContent(note.content);
        // Düzenleme modunu işaretle
        isEditingRef.current = true;
        scrollLockRef.current = true;
        // Scroll pozisyonunu kaydet ve koru
        setTimeout(() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({
              y: scrollPositionRef.current,
              animated: false,
            });
          }
        }, 0);
      }
      
      // Düzenleme modu kapandığında lock'u kaldır
      if (!note.isEditing) {
        isEditingRef.current = false;
        scrollLockRef.current = false;
      }
    }, [note.title, note.content, note.isEditing]);

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: (evt, gestureState) => {
          // Butonlara dokunulduysa sürükleme başlatma
          return !note.isEditing;
        },
        onMoveShouldSetPanResponder: () => !note.isEditing,
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
          const newX = Math.max(0, Math.min((pan.x as any).__getValue(), boardWidth - (note.width ?? 160)));
          const newY = Math.max(0, Math.min((pan.y as any).__getValue(), boardHeight - (note.height ?? 120)));
          pan.setValue({ x: newX, y: newY });
          onPositionUpdate(note.id, newX, newY);
        },
      })
    ).current;

    useEffect(() => {
      if (note.x !== undefined && note.y !== undefined) {
        pan.setValue({ x: note.x, y: note.y });
      }
    }, [note.x, note.y]);

    return (
      <Animated.View
        ref={noteViewRef}
        style={[
          styles.noteCard,
          getNoteStyle(note),
          {
            transform: [
              { rotate: note.isEditing ? '0deg' : `${note.rotation ?? 0}deg` },
              { translateX: pan.x },
              { translateY: pan.y },
            ],
          },
        ]}
        {...(!note.isEditing ? panResponder.panHandlers : {})}
        onLayout={(event) => {
          const { x, y, width, height } = event.nativeEvent.layout;
          notePositionRef.current = { x, y, width, height };
        }}
      >
        {note.isEditing ? (
          <View style={styles.noteEditingContent}>
            <TextInput
              ref={titleInputRef}
              style={[styles.noteTitleInput, { color: note.textColor, fontFamily: note.font }]}
              value={localTitle}
              onChangeText={setLocalTitle}
              placeholder="Başlık"
              placeholderTextColor={note.textColor + '80'}
              blurOnSubmit={false}
              scrollEnabled={false}
              onFocus={(e) => {
                // Scroll lock'u aktif et
                scrollLockRef.current = true;
                isEditingRef.current = true;
                
                // Mevcut scroll pozisyonunu hemen kaydet ve koru
                const savedPosition = scrollPositionRef.current;
                
                // Scroll pozisyonunu korumak için farklı zamanlarda dene
                const restorePosition = () => {
                  if (scrollViewRef.current && scrollLockRef.current) {
                    scrollViewRef.current.scrollTo({
                      y: savedPosition,
                      animated: false,
                    });
                  }
                };
                
                // Hemen koru
                restorePosition();
                // Kısa gecikmelerle tekrar dene (klavye animasyonu için)
                setTimeout(restorePosition, 10);
                setTimeout(restorePosition, 30);
                setTimeout(restorePosition, 50);
                setTimeout(restorePosition, 100);
                setTimeout(restorePosition, 200);
                setTimeout(restorePosition, 350);
                setTimeout(restorePosition, 500);
                setTimeout(restorePosition, 700);
                setTimeout(restorePosition, 1000);
              }}
              onBlur={() => {
                // Blur olduğunda scroll lock'u kaldır
                setTimeout(() => {
                  scrollLockRef.current = false;
                  isEditingRef.current = false;
                }, 100);
              }}
            />
            <TextInput
              style={[styles.noteContentInput, { color: note.textColor, fontFamily: note.font }]}
              value={localContent}
              onChangeText={setLocalContent}
              placeholder="İçerik..."
              placeholderTextColor={note.textColor + '80'}
              multiline
              textAlignVertical="top"
              scrollEnabled={false}
              blurOnSubmit={false}
              onFocus={(e) => {
                // Mevcut scroll pozisyonunu koru
                const savedPosition = scrollPositionRef.current;
                
                // Scroll pozisyonunu korumak için farklı zamanlarda dene
                const restorePosition = () => {
                  scrollViewRef.current?.scrollTo({
                    y: savedPosition,
                    animated: false,
                  });
                };
                
                // Hemen koru
                restorePosition();
                // Kısa gecikmelerle tekrar dene (klavye animasyonu için)
                setTimeout(restorePosition, 50);
                setTimeout(restorePosition, 100);
                setTimeout(restorePosition, 200);
                setTimeout(restorePosition, 350);
                setTimeout(restorePosition, 500);
              }}
              onBlur={() => {
                // Blur olduğunda scroll lock'u kaldır
                setTimeout(() => {
                  scrollLockRef.current = false;
                  isEditingRef.current = false;
                }, 100);
              }}
            />
            <TouchableOpacity
              style={styles.noteSaveButton}
              onPress={() => {
                onUpdate(note.id, { 
                  title: localTitle, 
                  content: localContent,
                  isEditing: false 
                });
              }}
            >
              <Ionicons name="checkmark" size={20} color={note.textColor} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.noteHeader}>
              <Text 
                style={[styles.noteTitle, { color: note.textColor, fontFamily: note.font }]} 
                numberOfLines={2}
              >
                {note.title}
              </Text>
              <View style={styles.noteActions}>
                <TouchableOpacity onPress={() => onToggleFavorite(note.id)}>
                  <Ionicons 
                    name={note.isFavorite ? "star" : "star-outline"} 
                    size={16} 
                    color={note.isFavorite ? "#ef4444" : note.textColor + '80'} 
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onStartEditing(note.id)}>
                  <Ionicons name="create-outline" size={16} color={note.textColor + '80'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDelete(note.id)}>
                  <Ionicons name="trash-outline" size={16} color={note.textColor + '80'} />
                </TouchableOpacity>
              </View>
            </View>
            <Text 
              style={[styles.noteText, { color: note.textColor, fontFamily: note.font }]} 
              numberOfLines={6}
            >
              {note.content}
            </Text>
            {!note.isEditing && (
              <View style={styles.noteColorButtons}>
                <TouchableOpacity
                  style={styles.noteColorButton}
                  onPress={() => onStartColorPicker(note, 'note')}
                >
                  <Ionicons name="color-palette-outline" size={14} color={note.textColor + '80'} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.noteColorButton}
                  onPress={() => onStartColorPicker(note, 'text')}
                >
                  <Ionicons name="text-outline" size={14} color={note.textColor + '80'} />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </Animated.View>
    );
  });

  const filteredNotes = notes.sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return parseInt(b.id) - parseInt(a.id);
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <LinearGradient
        colors={['#3b82f6', '#1e40af', '#7c3aed']}
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
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.headerTitle}>Mantar Pano</Text>
            <Text style={styles.headerSubtitle}>Notlarını organize et</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setShowSettingsModal(true)}
          >
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          scrollEventThrottle={16}
          nestedScrollEnabled={false}
          onScroll={(event) => {
            const currentY = event.nativeEvent.contentOffset.y;
            // Eğer düzenleme modundaysak ve scroll pozisyonu beklenmedik şekilde değiştiyse geri yükle
            if (isEditingRef.current && scrollLockRef.current) {
              const savedY = scrollPositionRef.current;
              // Eğer scroll beklenmedik şekilde değiştiyse (yukarı gittiyse veya çok aşağı gittiyse) geri yükle
              if (Math.abs(currentY - savedY) > 50) {
                // Sadece yukarı gidiyorsa geri yükle (aşağı gitmesine izin ver)
                if (currentY < savedY - 50) {
                  scrollViewRef.current?.scrollTo({
                    y: savedY,
                    animated: false,
                  });
                  return;
                }
              }
            }
            // Scroll pozisyonunu güncelle (sadece lock yoksa veya beklenen değişiklikse)
            if (!scrollLockRef.current || !isEditingRef.current) {
              scrollPositionRef.current = currentY;
            }
          }}
          scrollEnabled={true}
        >
          <View style={[
            styles.corkBoard,
            { 
              width: boardSettings.boardWidth,
              minHeight: boardSettings.boardHeight,
              backgroundColor: boardSettings.boardColor,
              borderColor: boardSettings.frameColor,
            }
          ]}>
            {/* Tahta border gradient overlay */}
            <LinearGradient
              colors={['#654321', '#8B4513', '#A0522D', '#8B4513', '#654321']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              locations={[0, 0.25, 0.5, 0.75, 1]}
              style={styles.woodBorderOverlay}
            />
            {boardSettings.boardImage && (
              <Image 
                source={typeof boardSettings.boardImage === 'string' ? { uri: boardSettings.boardImage } : boardSettings.boardImage}
                style={[
                  styles.boardImage,
                  {
                    width: boardSettings.boardWidth,
                    height: boardSettings.boardHeight,
                  }
                ]}
                resizeMode="stretch"
              />
            )}
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
                    onPositionUpdate={(id, x, y) => updateNote(id, { x, y })}
                    onUpdate={updateNote}
                    onDelete={deleteNote}
                    onToggleFavorite={toggleFavorite}
                    onStartEditing={(id) => {
                      // Düzenleme moduna geçmeden önce mevcut scroll pozisyonunu kaydet
                      if (scrollViewRef.current) {
                        // Mevcut scroll pozisyonunu kaydet
                        scrollViewRef.current.scrollTo({
                          y: scrollPositionRef.current,
                          animated: false,
                        });
                      }
                      setEditingNoteId(id);
                      updateNote(id, { isEditing: true });
                    }}
                    onStartColorPicker={(note, type) => {
                      setSelectedNoteForColor(note);
                      setColorPickerType(type);
                      setShowColorPicker(true);
                    }}
                    boardWidth={boardSettings.boardWidth}
                    boardHeight={boardSettings.boardHeight}
                  />
                ))
              )}
            </View>
          </View>
        </ScrollView>
      </View>

      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fab, styles.addFab]}
          onPress={createNewNote}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Settings Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showSettingsModal}
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Pano Ayarları</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <Ionicons name="close" size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollView}>
              <View style={styles.settingsSection}>
                <Text style={[styles.settingsSectionTitle, { color: themeColors.text }]}>Pano Rengi</Text>
                <TouchableOpacity
                  style={styles.colorPickerButton}
                  onPress={() => {
                    setColorPickerType('board');
                    setSelectedNoteForColor(null);
                    setHexColorInput(boardSettings.boardColor.replace('#', ''));
                    setShowColorPicker(true);
                  }}
                >
                  <View style={[styles.colorPreviewButton, { backgroundColor: boardSettings.boardColor }]} />
                  <Text style={[styles.colorPickerButtonText, { color: themeColors.text }]}>Renk Seç</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.settingsSection}>
                <Text style={[styles.settingsSectionTitle, { color: themeColors.text }]}>Pano Resmi</Text>
                <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                  <Ionicons name="image-outline" size={24} color="#3b82f6" />
                  <Text style={styles.imagePickerText}>
                    {boardSettings.boardImage ? 'Resmi Değiştir' : 'Resim Seç'}
                  </Text>
                </TouchableOpacity>
                {boardSettings.boardImage && (
                  <View style={styles.imagePreviewContainer}>
                    <Image 
                      source={typeof boardSettings.boardImage === 'string' ? { uri: boardSettings.boardImage } : boardSettings.boardImage}
                      style={styles.imagePreview}
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => setBoardSettings({ ...boardSettings, boardImage: require('../image/ss.jpg') })}
                    >
                      <Ionicons name="close-circle" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.settingsSection}>
                <Text style={[styles.settingsSectionTitle, { color: themeColors.text }]}>Çerçeve Rengi</Text>
                <TouchableOpacity
                  style={styles.colorPickerButton}
                  onPress={() => {
                    setColorPickerType('frame');
                    setSelectedNoteForColor(null);
                    setHexColorInput(boardSettings.frameColor.replace('#', ''));
                    setShowColorPicker(true);
                  }}
                >
                  <View style={[styles.colorPreviewButton, { backgroundColor: boardSettings.frameColor }]} />
                  <Text style={[styles.colorPickerButtonText, { color: themeColors.text }]}>Renk Seç</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.settingsSection}>
                <Text style={[styles.settingsSectionTitle, { color: themeColors.text }]}>Varsayılan Not Şekli</Text>
                <View style={styles.shapeButtons}>
                  {(['rectangle', 'rounded', 'circle'] as const).map((shape) => (
                    <TouchableOpacity
                      key={shape}
                      style={[
                        styles.shapeButton,
                        {
                          backgroundColor: boardSettings.defaultNoteShape === shape ? '#3b82f6' : themeColors.card,
                          borderColor: boardSettings.defaultNoteShape === shape ? '#1d4ed8' : themeColors.border
                        }
                      ]}
                      onPress={() => setBoardSettings({ ...boardSettings, defaultNoteShape: shape })}
                    >
                      <Text style={[
                        styles.shapeButtonText,
                        { color: boardSettings.defaultNoteShape === shape ? 'white' : themeColors.text }
                      ]}>
                        {shape === 'rectangle' ? 'Dikdörtgen' : shape === 'rounded' ? 'Yuvarlak Köşeli' : 'Yuvarlak'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.settingsSection}>
                <Text style={[styles.settingsSectionTitle, { color: themeColors.text }]}>Varsayılan Font</Text>
                <View style={styles.fontButtons}>
                  {fontFamilies.map((font) => (
                    <TouchableOpacity
                      key={font}
                      style={[
                        styles.fontButton,
                        {
                          backgroundColor: boardSettings.defaultNoteFont === font ? '#3b82f6' : themeColors.card,
                          borderColor: boardSettings.defaultNoteFont === font ? '#1d4ed8' : themeColors.border
                        }
                      ]}
                      onPress={() => setBoardSettings({ ...boardSettings, defaultNoteFont: font })}
                    >
                      <Text style={[
                        styles.fontButtonText,
                        { color: boardSettings.defaultNoteFont === font ? 'white' : themeColors.text },
                        { fontFamily: font }
                      ]}>
                        {font}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.settingsSection}>
                <Text style={[styles.settingsSectionTitle, { color: themeColors.text }]}>Varsayılan Not Rengi</Text>
                <TouchableOpacity
                  style={styles.colorPickerButton}
                  onPress={() => {
                    setColorPickerType('note');
                    setSelectedNoteForColor(null);
                    setHexColorInput(boardSettings.defaultNoteColor.replace('#', ''));
                    setShowColorPicker(true);
                  }}
                >
                  <View style={[styles.colorPreviewButton, { backgroundColor: boardSettings.defaultNoteColor }]} />
                  <Text style={[styles.colorPickerButtonText, { color: themeColors.text }]}>Renk Seç</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.settingsSection}>
                <Text style={[styles.settingsSectionTitle, { color: themeColors.text }]}>Varsayılan Yazı Rengi</Text>
                <TouchableOpacity
                  style={styles.colorPickerButton}
                  onPress={() => {
                    setColorPickerType('text');
                    setSelectedNoteForColor(null);
                    setHexColorInput(boardSettings.defaultTextColor.replace('#', ''));
                    setShowColorPicker(true);
                  }}
                >
                  <View style={[styles.colorPreviewButton, { backgroundColor: boardSettings.defaultTextColor }]} />
                  <Text style={[styles.colorPickerButtonText, { color: themeColors.text }]}>Renk Seç</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.saveSettingsButton}
                onPress={async () => {
                  await saveSettings();
                  setShowSettingsModal(false);
                }}
              >
                <Text style={styles.saveSettingsButtonText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Color Picker Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showColorPicker}
        onRequestClose={() => setShowColorPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.colorPickerModal, { backgroundColor: themeColors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                {colorPickerType === 'note' ? 'Not Rengi Seç' : 
                 colorPickerType === 'text' ? 'Yazı Rengi Seç' :
                 colorPickerType === 'board' ? 'Pano Rengi Seç' :
                 'Çerçeve Rengi Seç'}
              </Text>
              <TouchableOpacity onPress={() => setShowColorPicker(false)}>
                <Ionicons name="close" size={24} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.colorPickerContent}>
              {/* Tam Renk Seçici */}
              <View style={styles.fullColorPickerContainer}>
                {/* Hue Slider */}
                <View style={styles.hueSliderContainer}>
                  <Text style={[styles.colorSectionTitle, { color: themeColors.text }]}>Renk Tonu (Hue)</Text>
                  <View
                    ref={hueSliderRef}
                    style={styles.hueSlider}
                    onLayout={(e) => {
                      const { width, x } = e.nativeEvent.layout;
                      hueSliderLayoutRef.current = { width, x: e.nativeEvent.layout.x };
                    }}
                    {...hueSliderPanResponder.panHandlers}
                  >
                    <LinearGradient
                      colors={['#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FF0000']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.hueSliderGradient}
                    />
                    <View
                      style={[
                        styles.hueSliderIndicator,
                        { left: `${(hue / 360) * 100}%` }
                      ]}
                    />
                  </View>
                </View>

                {/* Saturation & Lightness Grid */}
                <View style={styles.saturationLightnessContainer}>
                  <Text style={[styles.colorSectionTitle, { color: themeColors.text }]}>Doygunluk ve Parlaklık</Text>
                  <View
                    ref={saturationLightnessRef}
                    style={styles.saturationLightnessGrid}
                    onLayout={(e) => {
                      const { width, height, x, y } = e.nativeEvent.layout;
                      saturationLightnessLayoutRef.current = { width, height, x, y };
                    }}
                    {...saturationLightnessPanResponder.panHandlers}
                  >
                    {/* HSL Color Picker Grid */}
                    {/* Saturation gradient (X-axis): sol (gri) -> sağ (tam renk hue) */}
                    <LinearGradient
                      colors={[
                        hslToHex(hue, 0.0, 0.5), // Sol: Saturation=0%, Lightness=50% → Gri
                        hslToHex(hue, 1.0, 0.5)  // Sağ: Saturation=100%, Lightness=50% → Tam renk
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                    {/* Lightness overlay (Y-axis): üst (beyaz) -> alt (siyah) */}
                    {/* Bu overlay, base rengi lightness'a göre açıklaştırır/koyulaştırır */}
                    <LinearGradient
                      colors={[
                        'rgba(255,255,255,1)',    // Üst: Tam beyaz (lightness=100%)
                        'rgba(255,255,255,0)',    // Orta: Şeffaf (lightness=50%)
                        'rgba(0,0,0,1)'           // Alt: Tam siyah (lightness=0%)
                      ]}
                      locations={[0, 0.5, 1]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <View
                      style={[
                        styles.colorPickerIndicator,
                        {
                          left: `${saturation}%`,
                          top: `${100 - lightness}%`,
                        }
                      ]}
                    />
                  </View>
                </View>

              </View>

              {/* Önceden Tanımlı Renkler */}
              <Text style={[styles.colorSectionTitle, { color: themeColors.text }]}>Önceden Tanımlı Renkler</Text>
              <View style={styles.colorGrid}>
                {(colorPickerType === 'note' ? noteColors : 
                  colorPickerType === 'text' ? textColors :
                  colorPickerType === 'board' ? boardColors : 
                  colorPickerType === 'frame' ? frameColors :
                  boardColors).map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorPickerOption,
                      { backgroundColor: color }
                    ]}
                    onPress={() => {
                      setHexColorInput(color.replace('#', ''));
                      if (selectedNoteForColor) {
                        if (colorPickerType === 'note') {
                          updateNote(selectedNoteForColor.id, { color });
                        } else if (colorPickerType === 'text') {
                          updateNote(selectedNoteForColor.id, { textColor: color });
                        }
                      } else if (colorPickerType === 'board') {
                        setBoardSettings({ ...boardSettings, boardColor: color });
                      } else if (colorPickerType === 'frame') {
                        setBoardSettings({ ...boardSettings, frameColor: color });
                      } else if (colorPickerType === 'note') {
                        setBoardSettings({ ...boardSettings, defaultNoteColor: color });
                      } else if (colorPickerType === 'text') {
                        setBoardSettings({ ...boardSettings, defaultTextColor: color });
                      }
                      setShowColorPicker(false);
                    }}
                  />
                ))}
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
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
    alignItems: 'center',
    paddingTop: 20,
  },
  corkBoard: {
    margin: 20,
    borderRadius: 16,
    borderWidth: 8,
    borderColor: '#8B4513',
    position: 'relative',
    overflow: 'hidden',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  boardImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: -12,
  },
  woodBorderOverlay: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 24,
    pointerEvents: 'none',
    zIndex: 1,
    opacity: 0.4,
  },
  notesContainer: {
    position: 'relative',
    width: '100%',
    minHeight: '100%',
    padding: 20,
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
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    padding: 12,
    zIndex: 1,
  },
  noteEditingContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 4,
  },
  noteTitleInput: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    borderBottomWidth: 1,
    paddingBottom: 2,
    paddingHorizontal: 0,
    minHeight: 24,
  },
  noteText: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  noteContentInput: {
    fontSize: 11,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderRadius: 4,
    padding: 4,
    marginBottom: 4,
    minHeight: 60,
    maxHeight: 80,
    width: '100%',
    paddingHorizontal: 4,
  },
  noteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  noteColorButtons: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
  noteColorButton: {
    padding: 4,
  },
  noteSaveButton: {
    alignSelf: 'flex-end',
    padding: 4,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 30,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addFab: {
    backgroundColor: '#3b82f6',
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
    width: '90%',
    maxHeight: '90%',
  },
  modalScrollView: {
    maxHeight: 500,
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  settingsSection: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  settingsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 8,
    marginTop: 8,
  },
  colorOption: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
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
    gap: 8,
  },
  imagePickerText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '500',
  },
  imagePreviewContainer: {
    marginTop: 15,
    position: 'relative',
    alignSelf: 'center',
  },
  imagePreview: {
    width: 120,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeInputContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  sizeInput: {
    flex: 1,
  },
  sizeInputLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  sizeInputField: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  shapeButtons: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  shapeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
  },
  shapeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  fontButtons: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  fontButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
  },
  fontButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  saveSettingsButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveSettingsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  colorPickerModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '85%',
    maxWidth: 350,
    maxHeight: '75%',
  },
  colorPickerContent: {
    padding: 15,
    paddingBottom: 10,
  },
  colorPickerOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  colorPreview: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  colorSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 6,
  },
  colorPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  colorPreviewButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  colorPickerButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  colorPickerGridContainer: {
    marginBottom: 20,
  },
  colorPickerGrid: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  colorPickerRow: {
    flexDirection: 'row',
    flex: 1,
  },
  colorGridCell: {
    flex: 1,
  },
  selectedColorPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  selectedColorBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  selectedColorText: {
    fontSize: 16,
    fontWeight: '600',
  },
  fullColorPickerContainer: {
    marginBottom: 12,
  },
  hueSliderContainer: {
    marginBottom: 12,
  },
  hueSlider: {
    height: 24,
    borderRadius: 12,
    marginTop: 6,
    position: 'relative',
    overflow: 'visible',
  },
  hueSliderGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  hueSliderIndicator: {
    position: 'absolute',
    top: -3,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
    transform: [{ translateX: -15 }],
  },
  saturationLightnessContainer: {
    marginBottom: 12,
  },
  saturationLightnessGrid: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 6,
    position: 'relative',
    overflow: 'visible',
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  colorPickerIndicator: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    transform: [{ translateX: -10 }, { translateY: -10 }],
  },
  colorInfo: {
    alignItems: 'flex-start',
  },
  colorInfoText: {
    fontSize: 12,
    marginTop: 4,
  },
});
