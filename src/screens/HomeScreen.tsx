import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tam Ekran TYT Deneme Bileşeni
function FullscreenTYTPracticeView({ onClose, initialTimeLeft, initialIsRunning }: { onClose: (p?: { timeLeft: number; isRunning: boolean }) => void; initialTimeLeft?: number; initialIsRunning?: boolean }) {
  const { showToast } = useToast();
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft ?? (165 * 60));
  const [isRunning, setIsRunning] = useState(initialIsRunning ?? false);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            showToast('TYT Deneme süreniz dolmuştur.', 'warning', 'Süre Doldu!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return {
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0'),
    };
  };

  const formattedTime = formatTime(timeLeft);

  return (
    <SafeAreaView style={styles.fullscreenContainer}>
      <View style={styles.fullscreenContent}>
        <TouchableOpacity 
          style={styles.fullscreenCloseButton} 
          onPress={() => onClose({ timeLeft, isRunning })}
        >
          <Ionicons name="close" size={32} color="white" />
        </TouchableOpacity>

        <Text style={styles.fullscreenTitle}>TYT Deneme</Text>

        <View style={styles.fullscreenTimeContainer}>
          <View style={styles.fullscreenTimeCircle}>
            <Text style={styles.fullscreenTimeText}>{formattedTime.minutes}</Text>
          </View>
          <Text style={styles.fullscreenSeparator}>:</Text>
          <View style={styles.fullscreenTimeCircle}>
            <Text style={styles.fullscreenTimeText}>{formattedTime.seconds}</Text>
          </View>
        </View>

        <View style={styles.fullscreenControlsRow}>
          <TouchableOpacity 
            style={styles.fullscreenControlButton}
            onPress={() => setIsRunning(!isRunning)}
          >
            <Ionicons name={isRunning ? "pause" : "play"} size={24} color="white" />
            <Text style={styles.fullscreenControlText}>
              {isRunning ? 'Duraklat' : 'Başlat'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.fullscreenControlButton}
            onPress={() => {
              setTimeLeft(165 * 60);
              setIsRunning(false);
            }}
          >
            <Ionicons name="refresh" size={24} color="white" />
            <Text style={styles.fullscreenControlText}>Sıfırla</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Özel Geri Sayım Tam Ekran Bileşeni
function FullscreenCustomCountdownView({ 
  onClose, 
  duration, 
  initialTimeLeftSeconds,
  initialIsRunning,
}: { 
  onClose: (p?: { timeLeftSeconds: number; isRunning: boolean }) => void; 
  duration: number;
  initialTimeLeftSeconds?: number;
  initialIsRunning?: boolean;
}) {
  const { showToast } = useToast();
  const [timeLeft, setTimeLeft] = useState((initialTimeLeftSeconds ?? (duration * 60)));
  const [isRunning, setIsRunning] = useState(initialIsRunning ?? false);
  const [selectedSound, setSelectedSound] = useState<{ uri: string; name: string } | null>(null);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const soundRef = React.useRef<Audio.Sound | null>(null);

  const playSound = async () => {
    try {
      if (selectedSound) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: selectedSound.uri },
          { shouldPlay: true }
        );
        await sound.playAsync();
        soundRef.current = sound;
      }
    } catch (error) {
      console.error('Ses çalınamadı:', error);
    }
  };

  const stopSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      console.error('Ses durdurulamadı:', error);
    }
  };

  const pickSound = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedSound({
          uri: result.assets[0].uri,
          name: result.assets[0].name || 'Ses',
        });
        showToast('Ses seçildi: ' + result.assets[0].name, 'success', 'Başarılı');
      }
    } catch (error) {
      showToast('Ses seçilemedi', 'error', 'Hata');
    }
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            showToast('Geri sayımınız tamamlandı.', 'warning', 'Süre Doldu!');
            playSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0'),
    };
  };

  const formattedTime = formatTime(timeLeft);

  return (
    <SafeAreaView style={styles.fullscreenContainer}>
      <View style={styles.fullscreenContent}>
        <TouchableOpacity 
          style={styles.fullscreenCloseButton} 
          onPress={() => onClose({ timeLeftSeconds: timeLeft, isRunning })}
        >
          <Ionicons name="close" size={32} color="white" />
        </TouchableOpacity>

        <Text style={styles.fullscreenTitle}>Özel Geri Sayım</Text>

        <View style={styles.fullscreenTimeContainer}>
          <View style={styles.fullscreenTimeCircle}>
            <Text style={styles.fullscreenTimeText}>{formattedTime.hours}</Text>
          </View>
          <Text style={styles.fullscreenSeparator}>:</Text>
          <View style={styles.fullscreenTimeCircle}>
            <Text style={styles.fullscreenTimeText}>{formattedTime.minutes}</Text>
          </View>
          <Text style={styles.fullscreenSeparator}>:</Text>
          <View style={styles.fullscreenTimeCircle}>
            <Text style={styles.fullscreenTimeText}>{formattedTime.seconds}</Text>
          </View>
        </View>

        <View style={styles.fullscreenControlsRow}>
          <TouchableOpacity 
            style={styles.fullscreenControlButton}
            onPress={() => setIsRunning(!isRunning)}
          >
            <Ionicons name={isRunning ? "pause" : "play"} size={24} color="white" />
            <Text style={styles.fullscreenControlText}>
              {isRunning ? 'Duraklat' : 'Başlat'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.fullscreenControlButton}
            onPress={() => {
              setTimeLeft(duration * 60);
              setIsRunning(false);
            }}
          >
            <Ionicons name="refresh" size={24} color="white" />
            <Text style={styles.fullscreenControlText}>Sıfırla</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.fullscreenControlButton}
            onPress={pickSound}
          >
            <Ionicons name="volume-high" size={24} color="white" />
            <Text style={styles.fullscreenControlText}>
              {selectedSound ? 'Ses: ' + selectedSound.name.substring(0, 10) : 'Ses Seç'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Tam Ekran AYT Deneme Bileşeni
function FullscreenAYTPracticeView({ onClose, initialTimeLeft, initialIsRunning }: { onClose: (p?: { timeLeft: number; isRunning: boolean }) => void; initialTimeLeft?: number; initialIsRunning?: boolean }) {
  const { showToast } = useToast();
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft ?? (180 * 60));
  const [isRunning, setIsRunning] = useState(initialIsRunning ?? false);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            showToast('AYT Deneme süreniz dolmuştur.', 'warning', 'Süre Doldu!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return {
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0'),
    };
  };

  const formattedTime = formatTime(timeLeft);

  return (
    <SafeAreaView style={styles.fullscreenContainer}>
      <View style={styles.fullscreenContent}>
        <TouchableOpacity 
          style={styles.fullscreenCloseButton} 
          onPress={() => onClose({ timeLeft, isRunning })}
        >
          <Ionicons name="close" size={32} color="white" />
        </TouchableOpacity>

        <Text style={styles.fullscreenTitle}>AYT Deneme</Text>

        <View style={styles.fullscreenTimeContainer}>
          <View style={styles.fullscreenTimeCircle}>
            <Text style={styles.fullscreenTimeText}>{formattedTime.minutes}</Text>
          </View>
          <Text style={styles.fullscreenSeparator}>:</Text>
          <View style={styles.fullscreenTimeCircle}>
            <Text style={styles.fullscreenTimeText}>{formattedTime.seconds}</Text>
          </View>
        </View>

        <View style={styles.fullscreenControlsRow}>
          <TouchableOpacity 
            style={styles.fullscreenControlButton}
            onPress={() => setIsRunning(!isRunning)}
          >
            <Ionicons name={isRunning ? "pause" : "play"} size={24} color="white" />
            <Text style={styles.fullscreenControlText}>
              {isRunning ? 'Duraklat' : 'Başlat'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.fullscreenControlButton}
            onPress={() => {
              setTimeLeft(180 * 60);
              setIsRunning(false);
            }}
          >
            <Ionicons name="refresh" size={24} color="white" />
            <Text style={styles.fullscreenControlText}>Sıfırla</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Tam Ekran Kronometre Bileşeni
function FullscreenStopwatchView({ onClose, initialTime, initialIsRunning }: { onClose: (p?: { time: number; isRunning: boolean }) => void; initialTime?: number; initialIsRunning?: boolean }) {
  const [time, setTime] = useState(initialTime ?? 0);
  const [isRunning, setIsRunning] = useState(initialIsRunning ?? false);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const sec = totalSeconds % 60;

    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: sec.toString().padStart(2, '0'),
    };
  };

  const formattedTime = formatTime(time);

  return (
    <View style={styles.fullscreenContainer}>
      <SafeAreaView style={styles.fullscreenContainer2}>
        <View style={styles.fullscreenContent}>
        <TouchableOpacity 
          style={styles.fullscreenCloseButton} 
          onPress={() => onClose({ time, isRunning })}
        >
          <Ionicons name="close" size={32} color="white" />
        </TouchableOpacity>

        <Text style={styles.fullscreenTitle}>Kronometre</Text>

        <View style={styles.fullscreenTimeContainer}>
          <View style={styles.fullscreenTimeAndLabelWrapper}>
            <View style={styles.fullscreenTimeCircle}>
              <Text style={styles.fullscreenTimeText}>{formattedTime.hours}</Text>
            </View>
            <Text style={styles.fullscreenLabelTextSmall}>Saat</Text>
          </View>
          <Text style={styles.fullscreenSeparator}>:</Text>
          <View style={styles.fullscreenTimeAndLabelWrapper}>
            <View style={styles.fullscreenTimeCircle}>
              <Text style={styles.fullscreenTimeText}>{formattedTime.minutes}</Text>
            </View>
            <Text style={styles.fullscreenLabelTextSmall}>Dakika</Text>
          </View>
          <Text style={styles.fullscreenSeparator}>:</Text>
          <View style={styles.fullscreenTimeAndLabelWrapper}>
            <View style={styles.fullscreenTimeCircle}>
              <Text style={styles.fullscreenTimeText}>{formattedTime.seconds}</Text>
            </View>
            <Text style={styles.fullscreenLabelTextSmall}>Saniye</Text>
          </View>
        </View>

        <View style={styles.fullscreenControlsRow}>
          <TouchableOpacity 
            style={styles.fullscreenControlButton}
            onPress={() => setIsRunning(!isRunning)}
          >
            <Ionicons name={isRunning ? "pause" : "play"} size={24} color="white" />
            <Text style={styles.fullscreenControlText}>
              {isRunning ? 'Duraklat' : 'Başlat'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.fullscreenControlButton}
            onPress={() => {
              setTime(0);
              setIsRunning(false);
            }}
          >
            <Ionicons name="refresh" size={24} color="white" />
            <Text style={styles.fullscreenControlText}>Sıfırla</Text>
          </TouchableOpacity>
        </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// Kronometre Bileşeni
function StopwatchView({ onBack, onFullscreen, externalState }: { onBack: () => void; onFullscreen: (p: { time: number; isRunning: boolean }) => void; externalState?: { time?: number; isRunning?: boolean } | null }) {
  const { colors } = useTheme();
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  useEffect(() => {
    if (externalState) {
      if (typeof externalState.time === 'number') {
        setTime(externalState.time);
      }
      if (typeof externalState.isRunning === 'boolean') {
        setIsRunning(externalState.isRunning);
      }
    }
  }, [externalState?.time, externalState?.isRunning]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const sec = totalSeconds % 60;

    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: sec.toString().padStart(2, '0'),
    };
  };

  const handleStart = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setTime(0);
    setIsRunning(false);
  };

  const formattedTime = formatTime(time);

  return (
    <View style={[styles.stopwatchContainer, { backgroundColor: colors.card }]}>
      {/* Kronometre Gösterimi */}
      <View style={styles.timeContainerWithLabels}>
        <View style={styles.timeAndLabelWrapper}>
          <View style={[styles.timeCircle, { backgroundColor: colors.surface }]}>
            <Text style={[styles.timeText, { color: colors.text }]}>{formattedTime.hours}</Text>
          </View>
          <Text style={[styles.labelTextSmall, { color: colors.textSecondary }]}>Saat</Text>
        </View>
        <Text style={[styles.separator, { color: colors.text }]}>:</Text>
        <View style={styles.timeAndLabelWrapper}>
          <View style={[styles.timeCircle, { backgroundColor: colors.surface }]}>
            <Text style={[styles.timeText, { color: colors.text }]}>{formattedTime.minutes}</Text>
          </View>
          <Text style={[styles.labelTextSmall, { color: colors.textSecondary }]}>Dakika</Text>
        </View>
        <Text style={[styles.separator, { color: colors.text }]}>:</Text>
        <View style={styles.timeAndLabelWrapper}>
          <View style={[styles.timeCircle, { backgroundColor: colors.surface }]}>
            <Text style={[styles.timeText, { color: colors.text }]}>{formattedTime.seconds}</Text>
          </View>
          <Text style={[styles.labelTextSmall, { color: colors.textSecondary }]}>Saniye</Text>
        </View>
      </View>

      {/* Kontrol Butonları */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={handleStart}
        >
          <Ionicons 
            name={isRunning ? "pause" : "play"} 
            size={18} 
            color="white" 
          />
          <Text style={styles.controlButtonText}>
            {isRunning ? 'Duraklat' : 'Başlat'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={handleReset}
        >
          <Ionicons name="refresh" size={18} color="white" />
          <Text style={styles.controlButtonText}>Sıfırla</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.countdownControls}>
        <TouchableOpacity style={styles.backButton2} onPress={onBack}>
          <Ionicons name="arrow-back" size={18} color="white" />
          <Text style={styles.controlButtonText}>Geri</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.fullscreenButton}
          onPress={() => onFullscreen({ time, isRunning })}
        >
          <Ionicons name="expand" size={18} color="white" />
          <Text style={styles.fullscreenButtonText}>Tam Ekran</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Tam Ekran TYT Geri Sayım Bileşeni
function FullscreenTYTCountdownView({ onClose }: { onClose: () => void }) {
  const { colors } = useTheme();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const targetDate = new Date('2026-06-20T00:00:00');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.fullscreenContainer}>
      <View style={styles.fullscreenContent}>
        <TouchableOpacity 
          style={styles.fullscreenCloseButton} 
          onPress={onClose}
        >
          <Ionicons name="close" size={32} color="white" />
        </TouchableOpacity>

        <Text style={styles.fullscreenTitle}>TYT Geri Sayım</Text>

        <View style={styles.fullscreenTimeContainer}>
          <View style={styles.fullscreenTimeCircle}>
            <Text style={styles.fullscreenTimeText}>{timeLeft.days.toString().padStart(2, '0')}</Text>
          </View>
          <Text style={styles.fullscreenSeparator}>:</Text>
          <View style={styles.fullscreenTimeCircle}>
            <Text style={styles.fullscreenTimeText}>{timeLeft.hours.toString().padStart(2, '0')}</Text>
          </View>
          <Text style={styles.fullscreenSeparator}>:</Text>
          <View style={styles.fullscreenTimeCircle}>
            <Text style={styles.fullscreenTimeText}>{timeLeft.minutes.toString().padStart(2, '0')}</Text>
          </View>
          <Text style={styles.fullscreenSeparator}>:</Text>
          <View style={styles.fullscreenTimeCircle}>
            <Text style={styles.fullscreenTimeText}>{timeLeft.seconds.toString().padStart(2, '0')}</Text>
          </View>
        </View>
        
        <View style={styles.fullscreenLabelContainer}>
          <Text style={styles.fullscreenTimeLabel}>Gün</Text>
          <Text style={styles.fullscreenLabelSeparator}>   </Text>
          <Text style={styles.fullscreenTimeLabel}>Saat</Text>
          <Text style={styles.fullscreenLabelSeparator}>   </Text>
          <Text style={styles.fullscreenTimeLabel}>Dakika</Text>
          <Text style={styles.fullscreenLabelSeparator}>   </Text>
          <Text style={styles.fullscreenTimeLabel}>Saniye</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Tam Ekran AYT Geri Sayım Bileşeni
function FullscreenAYTCountdownView({ onClose }: { onClose: () => void }) {
  const { colors } = useTheme();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const targetDate = new Date('2026-06-21T00:00:00');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.fullscreenContainer}>
      <View style={styles.fullscreenContent}>
        <TouchableOpacity 
          style={styles.fullscreenCloseButton} 
          onPress={onClose}
        >
          <Ionicons name="close" size={32} color="white" />
        </TouchableOpacity>

        <Text style={styles.fullscreenTitle}>AYT Geri Sayım</Text>

        <View style={styles.fullscreenTimeContainer}>
          <View style={styles.fullscreenTimeCircle}>
            <Text style={styles.fullscreenTimeText}>{timeLeft.days.toString().padStart(2, '0')}</Text>
          </View>
          <Text style={styles.fullscreenSeparator}>:</Text>
          <View style={styles.fullscreenTimeCircle}>
            <Text style={styles.fullscreenTimeText}>{timeLeft.hours.toString().padStart(2, '0')}</Text>
          </View>
          <Text style={styles.fullscreenSeparator}>:</Text>
          <View style={styles.fullscreenTimeCircle}>
            <Text style={styles.fullscreenTimeText}>{timeLeft.minutes.toString().padStart(2, '0')}</Text>
          </View>
          <Text style={styles.fullscreenSeparator}>:</Text>
          <View style={styles.fullscreenTimeCircle}>
            <Text style={styles.fullscreenTimeText}>{timeLeft.seconds.toString().padStart(2, '0')}</Text>
          </View>
        </View>
        
        <View style={styles.fullscreenLabelContainer}>
          <Text style={styles.fullscreenTimeLabel}>Gün</Text>
          <Text style={styles.fullscreenLabelSeparator}>   </Text>
          <Text style={styles.fullscreenTimeLabel}>Saat</Text>
          <Text style={styles.fullscreenLabelSeparator}>   </Text>
          <Text style={styles.fullscreenTimeLabel}>Dakika</Text>
          <Text style={styles.fullscreenLabelSeparator}>   </Text>
          <Text style={styles.fullscreenTimeLabel}>Saniye</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

// TYT Geri Sayım Bileşeni
function TYTCountdownView({ onBack, onFullscreen }: { onBack: () => void; onFullscreen: () => void }) {
  const { colors } = useTheme();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const targetDate = new Date('2026-06-20T00:00:00');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.stopwatchContainer, { backgroundColor: colors.card }]}>
      {/* Zaman Gösterimi */}
      <View style={styles.timeContainer}>
        <View style={[styles.smallTimeCircle, { backgroundColor: colors.surface }]}>
          <Text style={[styles.smallTimeText, { color: colors.text }]}>{timeLeft.days}</Text>
        </View>
        <Text style={[styles.smallSeparator, { color: colors.text }]}>:</Text>
        <View style={[styles.smallTimeCircle, { backgroundColor: colors.surface }]}>
          <Text style={[styles.smallTimeText, { color: colors.text }]}>{timeLeft.hours}</Text>
        </View>
        <Text style={[styles.smallSeparator, { color: colors.text }]}>:</Text>
        <View style={[styles.smallTimeCircle, { backgroundColor: colors.surface }]}>
          <Text style={[styles.smallTimeText, { color: colors.text }]}>{timeLeft.minutes}</Text>
        </View>
        <Text style={[styles.smallSeparator, { color: colors.text }]}>:</Text>
        <View style={[styles.smallTimeCircle, { backgroundColor: colors.surface }]}>
          <Text style={[styles.smallTimeText, { color: colors.text }]}>{timeLeft.seconds}</Text>
        </View>
      </View>

      {/* Etiketler */}
      <View style={styles.labelContainer}>
        <Text style={[styles.smallLabelText, { color: colors.textSecondary }]}>Gün</Text>
        <Text style={[styles.smallLabelSeparator, { color: colors.textSecondary }]}>:</Text>
        <Text style={[styles.smallLabelText, { color: colors.textSecondary }]}>Saat</Text>
        <Text style={[styles.smallLabelSeparator, { color: colors.textSecondary }]}>:</Text>
        <Text style={[styles.smallLabelText, { color: colors.textSecondary }]}>Dakika</Text>
        <Text style={[styles.smallLabelSeparator, { color: colors.textSecondary }]}>:</Text>
        <Text style={[styles.smallLabelText, { color: colors.textSecondary }]}>Saniye</Text>
      </View>

      {/* Kontrol Butonları */}
      <View style={styles.countdownControls}>
        <TouchableOpacity style={styles.backButton2} onPress={onBack}>
          <Ionicons name="arrow-back" size={18} color="white" />
          <Text style={styles.controlButtonText}>Geri</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.fullscreenButton} onPress={onFullscreen}>
          <Ionicons name="expand" size={18} color="white" />
          <Text style={styles.fullscreenButtonText}>Tam Ekran</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// AYT Geri Sayım Bileşeni
function AYTCountdownView({ onBack, onFullscreen }: { onBack: () => void; onFullscreen: () => void }) {
  const { colors } = useTheme();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const targetDate = new Date('2026-06-21T00:00:00');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.stopwatchContainer, { backgroundColor: colors.card }]}>
      {/* Zaman Gösterimi */}
      <View style={styles.timeContainer}>
        <View style={[styles.smallTimeCircle, { backgroundColor: colors.surface }]}>
          <Text style={[styles.smallTimeText, { color: colors.text }]}>{timeLeft.days}</Text>
        </View>
        <Text style={[styles.smallSeparator, { color: colors.text }]}>:</Text>
        <View style={[styles.smallTimeCircle, { backgroundColor: colors.surface }]}>
          <Text style={[styles.smallTimeText, { color: colors.text }]}>{timeLeft.hours}</Text>
        </View>
        <Text style={[styles.smallSeparator, { color: colors.text }]}>:</Text>
        <View style={[styles.smallTimeCircle, { backgroundColor: colors.surface }]}>
          <Text style={[styles.smallTimeText, { color: colors.text }]}>{timeLeft.minutes}</Text>
        </View>
        <Text style={[styles.smallSeparator, { color: colors.text }]}>:</Text>
        <View style={[styles.smallTimeCircle, { backgroundColor: colors.surface }]}>
          <Text style={[styles.smallTimeText, { color: colors.text }]}>{timeLeft.seconds}</Text>
        </View>
      </View>

      {/* Etiketler */}
      <View style={styles.labelContainer}>
        <Text style={[styles.smallLabelText, { color: colors.textSecondary }]}>Gün</Text>
        <Text style={[styles.smallLabelSeparator, { color: colors.textSecondary }]}>:</Text>
        <Text style={[styles.smallLabelText, { color: colors.textSecondary }]}>Saat</Text>
        <Text style={[styles.smallLabelSeparator, { color: colors.textSecondary }]}>:</Text>
        <Text style={[styles.smallLabelText, { color: colors.textSecondary }]}>Dakika</Text>
        <Text style={[styles.smallLabelSeparator, { color: colors.textSecondary }]}>:</Text>
        <Text style={[styles.smallLabelText, { color: colors.textSecondary }]}>Saniye</Text>
      </View>

      {/* Kontrol Butonları */}
      <View style={styles.countdownControls}>
        <TouchableOpacity style={styles.backButton2} onPress={onBack}>
          <Ionicons name="arrow-back" size={18} color="white" />
          <Text style={styles.controlButtonText}>Geri</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.fullscreenButton} onPress={onFullscreen}>
          <Ionicons name="expand" size={18} color="white" />
          <Text style={styles.fullscreenButtonText}>Tam Ekran</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Özel Geri Sayım Bileşeni
function CustomCountdownView({ 
  onBack, 
  onFullscreen,
  customDuration, 
  externalState,
}: { 
  onBack: () => void; 
  onFullscreen: (p: { timeLeftSeconds: number; isRunning: boolean }) => void;
  customDuration: number;
  externalState?: { timeLeftSeconds?: number; isRunning?: boolean } | null;
}) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [timeLeft, setTimeLeft] = useState(customDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSound, setSelectedSound] = useState<{ uri: string; name: string } | null>(null);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const soundRef = React.useRef<Audio.Sound | null>(null);

  const playSound = async () => {
    try {
      if (selectedSound) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: selectedSound.uri },
          { shouldPlay: true }
        );
        await sound.playAsync();
        soundRef.current = sound;
      }
    } catch (error) {
      console.error('Ses çalınamadı:', error);
    }
  };

  const stopSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      console.error('Ses durdurulamadı:', error);
    }
  };

  const pickSound = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedSound({
          uri: result.assets[0].uri,
          name: result.assets[0].name || 'Ses',
        });
        showToast('Ses seçildi: ' + result.assets[0].name, 'success', 'Başarılı');
      }
    } catch (error) {
      showToast('Ses seçilemedi', 'error', 'Hata');
    }
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            showToast('Geri sayımınız tamamlandı.', 'warning', 'Süre Doldu!');
            playSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (externalState) {
      if (typeof externalState.timeLeftSeconds === 'number') {
        setTimeLeft(externalState.timeLeftSeconds);
      }
      if (typeof externalState.isRunning === 'boolean') {
        setIsRunning(externalState.isRunning);
      }
    }
  }, [externalState?.timeLeftSeconds, externalState?.isRunning]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0'),
    };
  };

  const handleStart = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setTimeLeft(customDuration * 60);
    setIsRunning(false);
  };

  const formattedTime = formatTime(timeLeft);

  return (
    <View style={[styles.stopwatchContainer, { backgroundColor: colors.card }]}>
      {/* Zaman Gösterimi */}
      <View style={styles.timeContainer}>
        <View style={[styles.timeCircle, { backgroundColor: colors.surface }]}>
          <Text style={[styles.timeText, { color: colors.text }]}>{formattedTime.hours}</Text>
        </View>
        <Text style={[styles.separator, { color: colors.text }]}>:</Text>
        <View style={[styles.timeCircle, { backgroundColor: colors.surface }]}>
          <Text style={[styles.timeText, { color: colors.text }]}>{formattedTime.minutes}</Text>
        </View>
        <Text style={[styles.separator, { color: colors.text }]}>:</Text>
        <View style={[styles.timeCircle, { backgroundColor: colors.surface }]}>
          <Text style={[styles.timeText, { color: colors.text }]}>{formattedTime.seconds}</Text>
        </View>
      </View>

      {/* Etiketler */}
      <View style={styles.labelContainer}>
        <Text style={[styles.labelText, { color: colors.textSecondary }]}>Saat</Text>
        <Text style={[styles.labelSeparator, { color: colors.textSecondary }]}>:</Text>
        <Text style={[styles.labelText, { color: colors.textSecondary }]}>Dakika</Text>
        <Text style={[styles.labelSeparator, { color: colors.textSecondary }]}>:</Text>
        <Text style={[styles.labelText, { color: colors.textSecondary }]}>Saniye</Text>
      </View>

      {/* Kontrol Butonları */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={handleStart}
        >
          <Ionicons 
            name={isRunning ? "pause" : "play"} 
            size={18} 
            color="white" 
          />
          <Text style={styles.controlButtonText}>
            {isRunning ? 'Duraklat' : 'Başlat'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={handleReset}
        >
          <Ionicons name="refresh" size={18} color="white" />
          <Text style={styles.controlButtonText}>Sıfırla</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={pickSound}
        >
          <Ionicons name="volume-high" size={18} color="white" />
          <Text style={styles.controlButtonText}>
            {selectedSound ? 'Ses: ' + selectedSound.name.substring(0, 8) : 'Ses'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Navigasyon ve Tam Ekran Butonları */}
      <View style={[styles.countdownControls, { width: '100%', marginTop: 15, marginBottom: 0 }]}>
        <TouchableOpacity 
          style={[styles.backButton2, { flex: 1 }]} 
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={18} color="white" />
          <Text style={styles.controlButtonText}>Geri</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.fullscreenButton, { flex: 1 }]}
          onPress={() => onFullscreen({ timeLeftSeconds: timeLeft, isRunning })}
        >
          <Ionicons name="expand" size={18} color="white" />
          <Text style={styles.fullscreenButtonText}>Tam Ekran</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Özel Geri Sayım Ayarlama Bileşeni
function CustomCountdownSetup({ 
  onBack, 
  onStart 
}: { 
  onBack: () => void; 
  onStart: (duration: number) => void;
}) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('0');
  const [seconds, setSeconds] = useState('0');
  const [isEditing, setIsEditing] = useState(false);
  const [editingType, setEditingType] = useState<'hours' | 'minutes' | 'seconds' | null>(null);

  const totalSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);

  const handleStart = () => {
    if (totalSeconds <= 0) {
      showToast('Lütfen geçerli bir süre girin.', 'error', 'Hata');
      return;
    }
    onStart(totalSeconds / 60);
  };

  const handleEdit = (type: 'hours' | 'minutes' | 'seconds') => {
    setEditingType(type);
    setIsEditing(true);
  };

  const formatTime = (value: string) => {
    return value.padStart(2, '0');
  };

  return (
    <View style={[styles.stopwatchContainer, { backgroundColor: colors.card }]}>
      <Text style={[styles.setupTitle, { color: colors.text }]}>Geri sayım süresini ayarlayın</Text>
      
      {/* Input Alanları */}
      <View style={styles.timeInputRow}>
        <View style={styles.timeInputWrapper}>
          <Text style={[styles.timeInputLabel, { color: colors.text }]}>Saat:</Text>
          <TouchableOpacity 
            style={[styles.timeInputBox, { backgroundColor: colors.background }]}
            onPress={() => handleEdit('hours')}
          >
            <Text style={[styles.timeInputText, { color: colors.text }]}>{formatTime(hours)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.timeInputWrapper}>
          <Text style={[styles.timeInputLabel, { color: colors.text }]}>Dakika:</Text>
          <TouchableOpacity 
            style={[styles.timeInputBox, { backgroundColor: colors.background }]}
            onPress={() => handleEdit('minutes')}
          >
            <Text style={[styles.timeInputText, { color: colors.text }]}>{formatTime(minutes)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.timeInputWrapper}>
          <Text style={[styles.timeInputLabel, { color: colors.text }]}>Saniye:</Text>
          <TouchableOpacity 
            style={[styles.timeInputBox, { backgroundColor: colors.background }]}
            onPress={() => handleEdit('seconds')}
          >
            <Text style={[styles.timeInputText, { color: colors.text }]}>{formatTime(seconds)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Zaman Göstergesi */}
      <View style={styles.timeContainer}>
        <View style={[styles.timeCircle, { backgroundColor: colors.surface }]}>
          <Text style={[styles.timeText, { color: colors.text }]}>{formatTime(hours)}</Text>
        </View>
        <Text style={[styles.separator, { color: colors.text }]}>:</Text>
        <View style={[styles.timeCircle, { backgroundColor: colors.surface }]}>
          <Text style={[styles.timeText, { color: colors.text }]}>{formatTime(minutes)}</Text>
        </View>
        <Text style={[styles.separator, { color: colors.text }]}>:</Text>
        <View style={[styles.timeCircle, { backgroundColor: colors.surface }]}>
          <Text style={[styles.timeText, { color: colors.text }]}>{formatTime(seconds)}</Text>
        </View>
      </View>

      {/* Modal */}
      {isEditing && (
        <Modal
          visible={isEditing}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsEditing(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingType === 'hours' ? 'Saat Giriniz' : 
                 editingType === 'minutes' ? 'Dakika Giriniz' : 
                 'Saniye Giriniz'}
              </Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="0"
                value={editingType === 'hours' ? hours : editingType === 'minutes' ? minutes : seconds}
                onChangeText={(value) => {
                  if (editingType === 'hours') setHours(value);
                  else if (editingType === 'minutes') setMinutes(value);
                  else setSeconds(value);
                }}
                keyboardType="number-pad"
                autoFocus={true}
                maxLength={2}
                placeholderTextColor="#9ca3af"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.modalCancelButton}
                  onPress={() => setIsEditing(false)}
                >
                  <Text style={styles.modalCancelButtonText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalOkButton}
                  onPress={() => setIsEditing(false)}
                >
                  <Text style={styles.modalOkButtonText}>Tamam</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      <TouchableOpacity 
        style={styles.startButton} 
        onPress={handleStart}
      >
        <Ionicons name="play" size={20} color="white" />
        <Text style={styles.controlButtonText}>Başlat</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton2} onPress={onBack}>
        <Ionicons name="arrow-back" size={18} color="white" />
        <Text style={styles.controlButtonText}>Geri</Text>
      </TouchableOpacity>
    </View>
  );
}

// AYT Deneme Geri Sayım Bileşeni
function AYTPracticeView({ onBack, onFullscreen, externalState }: { onBack: () => void; onFullscreen: (p: { timeLeft: number; isRunning: boolean }) => void; externalState?: { timeLeft?: number; isRunning?: boolean } | null }) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [timeLeft, setTimeLeft] = useState(180 * 60); // 180 dakika = 10800 saniye
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSound, setSelectedSound] = useState<{ uri: string; name: string } | null>(null);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const soundRef = React.useRef<Audio.Sound | null>(null);

  const playSound = async () => {
    try {
      if (selectedSound) {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });
        const { sound } = await Audio.Sound.createAsync(
          { uri: selectedSound.uri },
          { shouldPlay: true }
        );
        await sound.setVolumeAsync(1.0);
        await sound.playAsync();
        soundRef.current = sound;
      } else {
        showToast('Lütfen önce bir ses seçin!', 'warning', 'Ses Seç');
      }
    } catch (error) {
      console.error('Ses çalınamadı:', error);
    }
  };

  const stopSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      console.error('Ses durdurulamadı:', error);
    }
  };

  const pickSound = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedSound({
          uri: result.assets[0].uri,
          name: result.assets[0].name || 'Ses',
        });
        showToast('Ses seçildi: ' + result.assets[0].name, 'success', 'Başarılı');
      }
    } catch (error) {
      showToast('Ses seçilemedi', 'error', 'Hata');
    }
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            Alert.alert('Süre Doldu!', 'AYT Deneme süreniz dolmuştur.', [
              { text: 'Tamam', onPress: stopSound }
            ]);
            playSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (externalState) {
      if (typeof externalState.timeLeft === 'number') {
        setTimeLeft(externalState.timeLeft);
      }
      if (typeof externalState.isRunning === 'boolean') {
        setIsRunning(externalState.isRunning);
      }
    }
  }, [externalState?.timeLeft, externalState?.isRunning]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return {
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0'),
    };
  };

  const handleStart = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setTimeLeft(180 * 60);
    setIsRunning(false);
  };

  const formattedTime = formatTime(timeLeft);

  return (
    <View style={[styles.stopwatchContainer, { backgroundColor: colors.card }]}>
      {/* Zaman Gösterimi ve Etiketler */}
      <View style={styles.timeContainerWithLabels}>
        <View style={styles.timeAndLabelWrapper}>
          <View style={[styles.timeCircle, { backgroundColor: colors.surface }]}>
            <Text style={[styles.timeText, { color: colors.text }]}>{formattedTime.minutes}</Text>
          </View>
          <Text style={[styles.labelTextSmall, { color: colors.textSecondary }]}>Dakika</Text>
        </View>
        <Text style={[styles.separator, { color: colors.text }]}>:</Text>
        <View style={styles.timeAndLabelWrapper}>
          <View style={[styles.timeCircle, { backgroundColor: colors.surface }]}>
            <Text style={[styles.timeText, { color: colors.text }]}>{formattedTime.seconds}</Text>
          </View>
          <Text style={[styles.labelTextSmall, { color: colors.textSecondary }]}>Saniye</Text>
        </View>
      </View>

      {/* Kontrol Butonları */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={handleStart}
        >
          <Ionicons 
            name={isRunning ? "pause" : "play"} 
            size={18} 
            color="white" 
          />
          <Text style={styles.controlButtonText}>
            {isRunning ? 'Duraklat' : 'Başlat'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={handleReset}
        >
          <Ionicons name="refresh" size={18} color="white" />
          <Text style={styles.controlButtonText}>Sıfırla</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={() => {
            // Ses seçme işlemi burada yapılacak
            showToast('Ses seçme özelliği yakında eklenecek', 'info', 'Bildirim Sesi');
          }}
        >
          <Ionicons name="volume-high" size={18} color="white" />
          <Text style={styles.controlButtonText}>Ses</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.countdownControls}>
        <TouchableOpacity style={styles.backButton2} onPress={onBack}>
          <Ionicons name="arrow-back" size={18} color="white" />
          <Text style={styles.controlButtonText}>Geri</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.fullscreenButton}
          onPress={() => onFullscreen({ timeLeft, isRunning })}
        >
          <Ionicons name="expand" size={18} color="white" />
          <Text style={styles.fullscreenButtonText}>Tam Ekran</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// TYT Deneme Geri Sayım Bileşeni
function TYTPracticeView({ onBack, onFullscreen, externalState }: { onBack: () => void; onFullscreen: (p: { timeLeft: number; isRunning: boolean }) => void; externalState?: { timeLeft?: number; isRunning?: boolean } | null }) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [timeLeft, setTimeLeft] = useState(165 * 60); // 165 dakika = 9900 saniye
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSound, setSelectedSound] = useState<{ uri: string; name: string } | null>(null);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const soundRef = React.useRef<Audio.Sound | null>(null);

  const playSound = async () => {
    try {
      if (selectedSound) {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });
        const { sound } = await Audio.Sound.createAsync(
          { uri: selectedSound.uri },
          { shouldPlay: true }
        );
        await sound.setVolumeAsync(1.0);
        await sound.playAsync();
        soundRef.current = sound;
      } else {
        showToast('Lütfen önce bir ses seçin!', 'warning', 'Ses Seç');
      }
    } catch (error) {
      console.error('Ses çalınamadı:', error);
    }
  };

  const stopSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      console.error('Ses durdurulamadı:', error);
    }
  };

  const pickSound = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedSound({
          uri: result.assets[0].uri,
          name: result.assets[0].name || 'Ses',
        });
        showToast('Ses seçildi: ' + result.assets[0].name, 'success', 'Başarılı');
      }
    } catch (error) {
      showToast('Ses seçilemedi', 'error', 'Hata');
    }
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            Alert.alert('Süre Doldu!', 'TYT Deneme süreniz dolmuştur.', [
              { text: 'Tamam', onPress: stopSound }
            ]);
            playSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (externalState) {
      if (typeof externalState.timeLeft === 'number') {
        setTimeLeft(externalState.timeLeft);
      }
      if (typeof externalState.isRunning === 'boolean') {
        setIsRunning(externalState.isRunning);
      }
    }
  }, [externalState?.timeLeft, externalState?.isRunning]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return {
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0'),
    };
  };

  const handleStart = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setTimeLeft(165 * 60);
    setIsRunning(false);
  };

  const formattedTime = formatTime(timeLeft);

  return (
    <View style={[styles.stopwatchContainer, { backgroundColor: colors.card }]}>
      {/* Zaman Gösterimi ve Etiketler */}
      <View style={styles.timeContainerWithLabels}>
        <View style={styles.timeAndLabelWrapper}>
          <View style={[styles.timeCircle, { backgroundColor: colors.surface }]}>
            <Text style={[styles.timeText, { color: colors.text }]}>{formattedTime.minutes}</Text>
          </View>
          <Text style={[styles.labelTextSmall, { color: colors.textSecondary }]}>Dakika</Text>
        </View>
        <Text style={[styles.separator, { color: colors.text }]}>:</Text>
        <View style={styles.timeAndLabelWrapper}>
          <View style={[styles.timeCircle, { backgroundColor: colors.surface }]}>
            <Text style={[styles.timeText, { color: colors.text }]}>{formattedTime.seconds}</Text>
          </View>
          <Text style={[styles.labelTextSmall, { color: colors.textSecondary }]}>Saniye</Text>
        </View>
      </View>

      {/* Kontrol Butonları */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={handleStart}
        >
          <Ionicons 
            name={isRunning ? "pause" : "play"} 
            size={18} 
            color="white" 
          />
          <Text style={styles.controlButtonText}>
            {isRunning ? 'Duraklat' : 'Başlat'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={handleReset}
        >
          <Ionicons name="refresh" size={18} color="white" />
          <Text style={styles.controlButtonText}>Sıfırla</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton} 
          onPress={pickSound}
        >
          <Ionicons name="volume-high" size={18} color="white" />
          <Text style={styles.controlButtonText}>
            {selectedSound ? 'Ses: ' + selectedSound.name.substring(0, 8) : 'Ses'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.countdownControls}>
        <TouchableOpacity style={styles.backButton2} onPress={onBack}>
          <Ionicons name="arrow-back" size={18} color="white" />
          <Text style={styles.controlButtonText}>Geri</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.fullscreenButton}
          onPress={() => onFullscreen({ timeLeft, isRunning })}
        >
          <Ionicons name="expand" size={18} color="white" />
          <Text style={styles.fullscreenButtonText}>Tam Ekran</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Mini Pano Önizleme Bileşeni
function MiniBoardPreview() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [boardNotes, setBoardNotes] = useState<any[]>([]);
  const [boardColor, setBoardColor] = useState('#D2691E');

  const loadBoardData = async () => {
    try {
      const savedNotes = await AsyncStorage.getItem('boardNotes');
      const savedSettings = await AsyncStorage.getItem('boardSettings');
      
      if (savedNotes) {
        const notes = JSON.parse(savedNotes);
        setBoardNotes(notes.slice(0, 6)); // İlk 6 notu göster
      }
      
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setBoardColor(settings.boardColor || '#D2691E');
      }
    } catch (error) {
      console.log('Pano verisi yüklenirken hata:', error);
    }
  };

  // İlk yükleme
  useEffect(() => {
    loadBoardData();
  }, []);

  // Sayfa her açıldığında verileri yeniden yükle
  useFocusEffect(
    React.useCallback(() => {
      loadBoardData();
    }, [])
  );

  return (
    <TouchableOpacity 
      style={styles.miniBoardContainer}
      onPress={() => navigation.navigate('Pano' as never)}
      activeOpacity={0.8}
    >
      <View style={styles.miniBoardHeader}>
        <Ionicons name="clipboard" size={24} color="#1e40af" />
        <Text style={[styles.miniBoardTitle, { color: colors.text }]}>Mantar Pano</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Pano' as never)}>
          <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      
      <View style={[styles.miniBoard, { backgroundColor: boardColor, borderColor: '#8B4513' }]}>
        {boardNotes.length === 0 ? (
          <View style={styles.miniBoardEmpty}>
            <Ionicons name="document-text-outline" size={32} color="#9ca3af" />
            <Text style={styles.miniBoardEmptyText}>Henüz not yok</Text>
          </View>
        ) : (
          <View style={styles.miniBoardNotes}>
            {boardNotes.map((note, index) => {
              // 6 not için 2x3 grid düzeni
              const row = Math.floor(index / 3); // 0 veya 1
              const col = index % 3; // 0, 1 veya 2
              
              return (
                <View 
                  key={note.id}
                  style={[
                    styles.miniNote,
                    {
                      backgroundColor: note.color || '#FFE066',
                      transform: [{ rotate: `${(note.id.charCodeAt(0) % 9 - 4) * 0.3}deg` }],
                      left: `${8 + col * 31}%`,
                      top: `${8 + row * 42}%`,
                    }
                  ]}
                >
                  <Text style={styles.miniNoteTitle} numberOfLines={1}>{note.title}</Text>
                  <Text style={styles.miniNoteContent} numberOfLines={2}>{note.content}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
      
      <Text style={[styles.miniBoardFooter, { color: colors.textSecondary }]}>
        Tüm notları görmek için dokunun
      </Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const navigation = useNavigation();
  const [showStopwatch, setShowStopwatch] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [fullscreenType, setFullscreenType] = useState<'stopwatch' | 'tyt-practice' | 'ayt-practice' | 'custom-countdown' | 'tyt-countdown' | 'ayt-countdown' | null>(null);
  const [fullscreenCustomDuration, setFullscreenCustomDuration] = useState(0);
  const [activeCounter, setActiveCounter] = useState<string | null>(null);
  const [customDuration, setCustomDuration] = useState(0);
  const [fullscreenPayload, setFullscreenPayload] = useState<any>(null);
  const [lastStopwatchState, setLastStopwatchState] = useState<{ time?: number; isRunning?: boolean } | null>(null);
  const [lastTYTPracticeState, setLastTYTPracticeState] = useState<{ timeLeft?: number; isRunning?: boolean } | null>(null);
  const [lastAYTPracticeState, setLastAYTPracticeState] = useState<{ timeLeft?: number; isRunning?: boolean } | null>(null);
  const [lastCustomCountdownState, setLastCustomCountdownState] = useState<{ timeLeftSeconds?: number; isRunning?: boolean } | null>(null);

  // İlham verici sözler dizisi
  const inspirationalQuotes = [
    { quote: "Hayatta en hakiki mürşit ilimdir.", author: "Mustafa Kemal Atatürk" },
    { quote: "Başarısızlıktan başarılı olanları ayıran tek şey zekâ değil, azimdir.", author: "Albert Einstein" },
    { quote: "Eğitim, ferdin yaşadığı cemiyete adapte olabilmesini, sağlar.", author: "Mahatma Gandhi" },
    { quote: "Bildiğini zanneden, bilmediğini görememiş demektir.", author: "Konfüçyüs" },
    { quote: "Hayat akışı boyunca ilerleyen bir öğrenme yolculuğudur.", author: "Steve Jobs" },
    { quote: "Öğrenmek hiçbir zaman boşa harcanan zaman değildir.", author: "Sokrates" },
    { quote: "Başarı, hazırlık ve fırsatın bir araya gelmesidir.", author: "Louis Pasteur" },
    { quote: "Hiçbir şey imkansız değildir; imkansızı kelimesi sözlükten çıkarılmalıdır.", author: "Napoleon Bonaparte" },
    { quote: "Öğretmek, iki kez öğrenmek demektir.", author: "Joseph Joubert" },
    { quote: "Merak bilimin anasıdır.", author: "Aristoteles" },
  ];

  // Rastgele bir söz seç
  const getRandomQuote = () => {
    const today = new Date().getDay(); // Haftanın günü (0-6)
    const quoteIndex = today % inspirationalQuotes.length;
    return inspirationalQuotes[quoteIndex];
  };

  const dailyQuote = getRandomQuote();

  // Saate göre selamlama mesajını belirle
  const getGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return { 
        message: 'Günaydın!', 
        colors: ['#FFE29F', '#FFA99F'],
        textColor: '#1F2937',
        type: 'morning'
      };
    } else if (hour >= 12 && hour < 18) {
      return { 
        message: 'İyi Günler!', 
        colors: ['#A1C4FD', '#C2E9FB'],
        textColor: '#111827',
        type: 'day'
      };
    } else if (hour >= 18 && hour < 22) {
      return { 
        message: 'İyi Akşamlar!', 
        colors: ['#1E3A8A', '#0F172A'],
        textColor: '#FDE68A',
        type: 'evening'
      };
    } else {
      return { 
        message: 'İyi Geceler!', 
        colors: ['#0F172A', '#020617'],
        textColor: '#93C5FD',
        type: 'night'
      };
    }
  };

  const greeting = getGreeting();
  const isEveningGreeting = greeting.message === 'İyi Akşamlar!';
  const isMorningGreeting = greeting.message === 'Günaydın!';
  const isDayGreeting = greeting.message === 'İyi Günler!';
  const isNightGreeting = greeting.message === 'İyi Geceler!';

  if (showFullscreen) {
    return (
      <Modal visible={true} transparent={true} animationType="fade" statusBarTranslucent>
        <View style={styles.fullscreenOverlay}>
          {fullscreenType === 'stopwatch' ? (
            <FullscreenStopwatchView onClose={(p) => {
              setLastStopwatchState(p ?? null);
              setShowFullscreen(false);
              setFullscreenType(null);
            }} initialTime={fullscreenPayload?.time} initialIsRunning={fullscreenPayload?.isRunning} />
          ) : fullscreenType === 'tyt-practice' ? (
            <FullscreenTYTPracticeView onClose={(p) => {
              setLastTYTPracticeState(p ?? null);
              setShowFullscreen(false);
              setFullscreenType(null);
            }} initialTimeLeft={fullscreenPayload?.timeLeft} initialIsRunning={fullscreenPayload?.isRunning} />
          ) : fullscreenType === 'ayt-practice' ? (
            <FullscreenAYTPracticeView onClose={(p) => {
              setLastAYTPracticeState(p ?? null);
              setShowFullscreen(false);
              setFullscreenType(null);
            }} initialTimeLeft={fullscreenPayload?.timeLeft} initialIsRunning={fullscreenPayload?.isRunning} />
          ) : fullscreenType === 'tyt-countdown' ? (
            <FullscreenTYTCountdownView onClose={() => {
              setShowFullscreen(false);
              setFullscreenType(null);
            }} />
          ) : fullscreenType === 'ayt-countdown' ? (
            <FullscreenAYTCountdownView onClose={() => {
              setShowFullscreen(false);
              setFullscreenType(null);
            }} />
          ) : fullscreenType === 'custom-countdown' ? (
            <FullscreenCustomCountdownView 
              onClose={(p) => {
                setLastCustomCountdownState(p ?? null);
                setShowFullscreen(false);
                setFullscreenType(null);
              }}
              duration={fullscreenCustomDuration}
              initialTimeLeftSeconds={fullscreenPayload?.timeLeftSeconds}
              initialIsRunning={fullscreenPayload?.isRunning}
            />
          ) : null}
        </View>
      </Modal>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
          <View style={styles.headerContent}>
            <Ionicons name="compass" size={40} color="white" style={{ marginBottom: 0 }} />
            <Text style={styles.headerTitle}>Pusula</Text>
            <Text style={styles.headerSubtitle}>
              Kişisel Öğrenme Yolculuğuna Hoş Geldin!
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <LinearGradient
            colors={greeting.colors as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.greetingCard, 
              isEveningGreeting && styles.eveningCard,
              isNightGreeting && styles.nightCard,
              isMorningGreeting && styles.morningCard,
              isDayGreeting && styles.dayCard
            ]}
          >
            {isEveningGreeting && (
              <>
                <View style={styles.eveningMoonGlow} />
                <Ionicons name="moon" size={44} color="#FFD27D" style={styles.eveningMoon} />
                <View style={styles.eveningStarsLayer}>
                  <View style={[styles.eveningStar, { top: 8, left: '12%', opacity: 0.9 }]} />
                  <View style={[styles.eveningStar, { top: 22, right: '18%', opacity: 0.7 }]} />
                  <View style={[styles.eveningStar, { top: 36, left: '60%', opacity: 0.8 }]} />
                  <View style={[styles.eveningStar, { top: 54, left: '30%', opacity: 0.6 }]} />
                  <View style={[styles.eveningStar, { top: 70, right: '8%', opacity: 0.85 }]} />
                </View>
              </>
            )}
            {isNightGreeting && (
              <>
                <View style={styles.nightMoonGlow} />
                <Ionicons name="moon" size={52} color="#E0E7FF" style={styles.nightMoon} />
                <View style={styles.nightStarsLayer}>
                  <View style={[styles.nightStar, { top: 10, left: '15%', opacity: 0.95 }]} />
                  <View style={[styles.nightStar, { top: 25, right: '20%', opacity: 0.8 }]} />
                  <View style={[styles.nightStar, { top: 40, left: '65%', opacity: 0.85 }]} />
                  <View style={[styles.nightStar, { top: 60, left: '35%', opacity: 0.7 }]} />
                  <View style={[styles.nightStar, { top: 75, right: '10%', opacity: 0.9 }]} />
                  <View style={[styles.nightStar, { top: 20, left: '45%', opacity: 0.75 }]} />
                  <View style={[styles.nightStar, { top: 55, right: '35%', opacity: 0.65 }]} />
                </View>
              </>
            )}
            {isMorningGreeting && (
              <>
                <View style={styles.morningSunGlow} />
                <Ionicons name="sunny" size={56} color="#FFD700" style={styles.morningSun} />
                <View style={styles.morningCloudsLayer}>
                  <View style={[styles.morningCloud, { top: 15, left: '18%' }]} />
                  <View style={[styles.morningCloudPart, { top: 12, left: '16%', width: 35, height: 35 }]} />
                  <View style={[styles.morningCloudPart, { top: 12, left: '22%', width: 40, height: 35 }]} />
                  <View style={[styles.morningCloudPart, { top: 18, left: '28%', width: 30, height: 30 }]} />
                  <View style={[styles.morningCloud, { top: 38, left: '65%' }]} />
                  <View style={[styles.morningCloudPart, { top: 35, left: '63%', width: 32, height: 32 }]} />
                  <View style={[styles.morningCloudPart, { top: 35, left: '69%', width: 38, height: 32 }]} />
                  <View style={[styles.morningCloudPart, { top: 41, left: '73%', width: 28, height: 28 }]} />
                  <View style={[styles.morningCloud, { top: 53, left: '52%' }]} />
                  <View style={[styles.morningCloudPart, { top: 50, left: '50%', width: 33, height: 33 }]} />
                  <View style={[styles.morningCloudPart, { top: 50, left: '56%', width: 36, height: 33 }]} />
                  <View style={[styles.morningCloudPart, { top: 56, left: '60%', width: 26, height: 26 }]} />
                </View>
              </>
            )}
            {isDayGreeting && (
              <>
                <View style={styles.daySunGlow} />
                <Ionicons name="sunny" size={60} color="#FFA500" style={styles.daySun} />
                <View style={styles.dayCloudsLayer}>
                  <View style={[styles.dayCloud, { top: 20, left: '16%' }]} />
                  <View style={[styles.dayCloudPart, { top: 17, left: '14%', width: 38, height: 38 }]} />
                  <View style={[styles.dayCloudPart, { top: 17, left: '20%', width: 42, height: 38 }]} />
                  <View style={[styles.dayCloudPart, { top: 23, left: '26%', width: 32, height: 32 }]} />
                  <View style={[styles.dayCloud, { top: 43, left: '68%' }]} />
                  <View style={[styles.dayCloudPart, { top: 40, left: '66%', width: 36, height: 36 }]} />
                  <View style={[styles.dayCloudPart, { top: 40, left: '72%', width: 40, height: 36 }]} />
                  <View style={[styles.dayCloudPart, { top: 46, left: '76%', width: 30, height: 30 }]} />
                  <View style={[styles.dayCloud, { top: 58, left: '48%' }]} />
                  <View style={[styles.dayCloudPart, { top: 55, left: '46%', width: 35, height: 35 }]} />
                  <View style={[styles.dayCloudPart, { top: 55, left: '52%', width: 38, height: 35 }]} />
                  <View style={[styles.dayCloudPart, { top: 61, left: '56%', width: 28, height: 28 }]} />
                </View>
              </>
            )}
            <Text style={[styles.greetingTitle, { color: greeting.textColor }]}>{greeting.message}</Text>
            {isEveningGreeting && (
              <Text style={styles.eveningSubtitle}>Günün yorgunluğunu bırak, hedeflerine bir adım daha yaklaş.</Text>
            )}
            {isNightGreeting && (
              <Text style={styles.nightSubtitle}>Huzurlu bir gece geçir, yarın için güç topla.</Text>
            )}
            {isMorningGreeting && (
              <Text style={styles.morningSubtitle}>Yeni bir gün başlıyor, hedeflerine odaklan!</Text>
            )}
            {isDayGreeting && (
              <Text style={styles.daySubtitle}>Gün ortasında motivasyonunu koru, ilerlemeye devam et.</Text>
            )}
            <View style={styles.divider} />
            <Text style={[styles.quoteText, { color: greeting.textColor, opacity: 0.85 }]}>"{dailyQuote.quote}"</Text>
            <Text style={[styles.authorText, { color: greeting.textColor, opacity: 0.8 }]}>— {dailyQuote.author}</Text>
          </LinearGradient>
        </View>

        {/* Mini Pano Önizlemesi */}
        <View style={styles.content}>
          <MiniBoardPreview />
        </View>

        {/* Sayaclar Kartı */}
        <View style={styles.content}>
          <View style={styles.statsCardHeader}>
            <Ionicons name="stopwatch" size={24} color="#1e40af" />
            <Text style={[styles.statsCardTitle, { color: colors.text }]}>
              {activeCounter === 'stopwatch' ? 'Kronometre' 
               : activeCounter === 'tyt-countdown' ? 'TYT Geri Sayım' 
               : activeCounter === 'ayt-countdown' ? 'AYT Geri Sayım'
               : activeCounter === 'tyt-practice' ? 'TYT Deneme'
               : activeCounter === 'ayt-practice' ? 'AYT Deneme'
               : activeCounter === 'custom-countdown' ? 'Özel Geri Sayım'
               : 'Sayaçlar'}
            </Text>
          </View>
          <View style={styles.statsCardHeaderLine} />
          
          <View style={styles.countersWrapper}>
              {!activeCounter ? (
            /* Sayaç Butonları */
            <View style={[styles.countersCard, { backgroundColor: colors.card }]}>
              <TouchableOpacity 
                style={[styles.counterButton, { backgroundColor: colors.background }]}
                onPress={() => setActiveCounter('stopwatch')}
              >
                <Ionicons name="stopwatch" size={22} color="#1e40af" />
                <Text style={[styles.counterButtonText, { color: colors.text }]}>Kronometre</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.counterButton, { backgroundColor: colors.background }]}
                onPress={() => setActiveCounter('tyt-countdown')}
              >
                <Ionicons name="calendar" size={22} color="#1e40af" />
                <Text style={[styles.counterButtonText, { color: colors.text }]}>TYT Geri Sayım</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.counterButton, { backgroundColor: colors.background }]}
                onPress={() => setActiveCounter('ayt-countdown')}
              >
                <Ionicons name="calendar" size={22} color="#1e40af" />
                <Text style={[styles.counterButtonText, { color: colors.text }]}>AYT Geri Sayım</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.counterButton, { backgroundColor: colors.background }]}
                onPress={() => setActiveCounter('tyt-practice')}
              >
                <Ionicons name="hourglass" size={22} color="#1e40af" />
                <Text style={[styles.counterButtonText, { color: colors.text }]}>TYT Deneme</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.counterButton, { backgroundColor: colors.background }]}
                onPress={() => setActiveCounter('ayt-practice')}
              >
                <Ionicons name="hourglass" size={22} color="#1e40af" />
                <Text style={[styles.counterButtonText, { color: colors.text }]}>AYT Deneme</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.counterButton, { backgroundColor: colors.background }]}
                onPress={() => setActiveCounter('custom-countdown')}
              >
                <Ionicons name="person-circle" size={22} color="#1e40af" />
                <Text style={[styles.counterButtonText, { color: colors.text }]}>Özel Geri Sayım</Text>
              </TouchableOpacity>
            </View>
          ) : activeCounter === 'stopwatch' ? (
            /* Kronometre Gösterimi */
            <StopwatchView 
              onBack={() => setActiveCounter(null)} 
              onFullscreen={(p) => {
                setFullscreenType('stopwatch');
                setFullscreenPayload(p);
                setShowFullscreen(true);
              }}
              externalState={lastStopwatchState}
            />
          ) : activeCounter === 'tyt-countdown' ? (
            /* TYT Geri Sayım Gösterimi */
            <TYTCountdownView 
              onBack={() => setActiveCounter(null)}
              onFullscreen={() => {
                setFullscreenType('tyt-countdown');
                setShowFullscreen(true);
              }}
            />
          ) : activeCounter === 'ayt-countdown' ? (
            /* AYT Geri Sayım Gösterimi */
            <AYTCountdownView 
              onBack={() => setActiveCounter(null)}
              onFullscreen={() => {
                setFullscreenType('ayt-countdown');
                setShowFullscreen(true);
              }}
            />
          ) : activeCounter === 'tyt-practice' ? (
            /* TYT Deneme Gösterimi */
            <TYTPracticeView 
              onBack={() => setActiveCounter(null)}
              onFullscreen={(p) => {
                setFullscreenType('tyt-practice');
                setFullscreenPayload(p);
                setShowFullscreen(true);
              }}
              externalState={lastTYTPracticeState}
            />
          ) : activeCounter === 'ayt-practice' ? (
            /* AYT Deneme Gösterimi */
            <AYTPracticeView 
              onBack={() => setActiveCounter(null)}
              onFullscreen={(p) => {
                setFullscreenType('ayt-practice');
                setFullscreenPayload(p);
                setShowFullscreen(true);
              }}
              externalState={lastAYTPracticeState}
            />
          ) : activeCounter === 'custom-countdown' ? (
            /* Özel Geri Sayım Gösterimi */
            customDuration > 0 ? (
              <CustomCountdownView 
                onBack={() => {
                  setCustomDuration(0);
                  setActiveCounter(null);
                }}
                onFullscreen={(p) => {
                  setFullscreenCustomDuration(Math.max(1, Math.ceil((p.timeLeftSeconds ?? 60) / 60)));
                  setFullscreenPayload(p);
                  setFullscreenType('custom-countdown');
                  setShowFullscreen(true);
                }}
                customDuration={customDuration}
                externalState={lastCustomCountdownState}
              />
            ) : (
              <CustomCountdownSetup 
                onBack={() => setActiveCounter(null)}
                onStart={(dur) => setCustomDuration(dur)}
              />
              )
          ) : null}
          </View>
        </View>
      </ScrollView>
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
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    top: -60,
    left: -30,
  },
  circle2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    bottom: -40,
    right: 10,
  },
  circle3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    top: 20,
    right: 50,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 0,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginTop: 5,
  },
  content: {
    padding: 20,
  },
  greetingCard: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  eveningCard: {
    overflow: 'hidden',
  },
  eveningMoon: {
    position: 'absolute',
    top: 12,
    right: 16,
    textShadowColor: 'rgba(255, 210, 125, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    zIndex: 2,
  },
  eveningMoonGlow: {
    position: 'absolute',
    top: -30,
    right: -10,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 210, 125, 0.15)',
    zIndex: 1,
  },
  eveningStarsLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  eveningStar: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  eveningSubtitle: {
    fontSize: 14,
    color: '#FCE7B2',
    marginTop: 6,
    opacity: 0.95,
    textAlign: 'center',
  },
  nightCard: {
    overflow: 'hidden',
  },
  nightMoonGlow: {
    position: 'absolute',
    top: -35,
    right: -15,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(224, 231, 255, 0.12)',
    zIndex: 1,
  },
  nightMoon: {
    position: 'absolute',
    top: 10,
    right: 14,
    textShadowColor: 'rgba(224, 231, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    zIndex: 2,
  },
  nightStarsLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  nightStar: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
  nightSubtitle: {
    fontSize: 14,
    color: '#C7D2FE',
    marginTop: 6,
    opacity: 0.95,
    textAlign: 'center',
  },
  morningCard: {
    overflow: 'hidden',
  },
  morningSunGlow: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 215, 0, 0.25)',
    zIndex: 1,
  },
  morningSun: {
    position: 'absolute',
    top: 8,
    right: 12,
    textShadowColor: 'rgba(255, 215, 0, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    zIndex: 2,
  },
  morningCloudsLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  morningCloud: {
    position: 'absolute',
    width: 50,
    height: 30,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: 'rgba(255, 255, 255, 0.5)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1,
  },
  morningCloudPart: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    shadowColor: 'rgba(255, 255, 255, 0.4)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    zIndex: 0,
  },
  morningSubtitle: {
    fontSize: 14,
    color: '#78350F',
    marginTop: 6,
    opacity: 0.95,
    textAlign: 'center',
  },
  dayCard: {
    overflow: 'hidden',
  },
  daySunGlow: {
    position: 'absolute',
    top: -45,
    right: -25,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    zIndex: 1,
  },
  daySun: {
    position: 'absolute',
    top: 10,
    right: 14,
    textShadowColor: 'rgba(255, 165, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
    zIndex: 2,
  },
  dayCloudsLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  dayCloud: {
    position: 'absolute',
    width: 55,
    height: 35,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: 'rgba(255, 255, 255, 0.4)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    zIndex: 1,
  },
  dayCloudPart: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    shadowColor: 'rgba(255, 255, 255, 0.35)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 0,
  },
  daySubtitle: {
    fontSize: 14,
    color: '#1E3A8A',
    marginTop: 6,
    opacity: 0.95,
    textAlign: 'center',
  },
  greetingTitle: {
    fontSize: 20,
    fontWeight: '400',
    marginBottom: 15,
    textAlign: 'center',
    letterSpacing: 2,
    fontStyle: 'italic',
    transform: [{ skewX: '-8deg' }],
    textShadowColor: 'rgba(255, 255, 255, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  greetingTime: {
    fontSize: 72,
    fontWeight: '900',
    color: 'white',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    letterSpacing: 2,
  },
  divider: {
    width: '60%',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginVertical: 15,
    borderRadius: 1,
  },
  quoteText: {
    fontSize: 16,
    color: '#E0E0E0',
    opacity: 1,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 10,
    lineHeight: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  authorText: {
    fontSize: 14,
    color: '#D0D0D0',
    opacity: 1,
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  statsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsCardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginLeft: 8,
  },
  statsCardHeaderLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#1e40af',
    marginBottom: 20,
  },
  countersWrapper: {
    minHeight: 350, // Sabit minimum yükseklik - sayaç seçildiğinde küçülmesini önlemek için
  },
  countersCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  counterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  counterButtonText: {
    fontSize: 16,
    color: '#1e40af',
    marginLeft: 12,
    fontWeight: '500',
  },
  statsCardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  stopwatchContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 20,
    flexWrap: 'nowrap',
    width: '100%',
    paddingHorizontal: 10,
  },
  timeCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  timeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#374151',
  },
  separator: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#374151',
    marginHorizontal: 10,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 2,
    justifyContent: 'center',
    minWidth: 90,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
    flexShrink: 0,
  },
  backButton2: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    flex: 1,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  labelText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    width: 80,
  },
  labelSeparator: {
    fontSize: 12,
    color: '#6b7280',
    marginHorizontal: 10,
  },
  timeContainerWithLabels: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 20,
    flexWrap: 'nowrap',
  },
  timeAndLabelWrapper: {
    alignItems: 'center',
    marginHorizontal: 8,
    justifyContent: 'flex-start',
    minWidth: 80,
  },
  labelTextSmall: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  smallTimeCircle: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    marginHorizontal: 4,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  smallTimeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
  },
  smallSeparator: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#374151',
    marginHorizontal: 4,
    alignSelf: 'flex-start',
    lineHeight: 65,
  },
  smallLabelText: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
    width: 60,
  },
  smallLabelSeparator: {
    fontSize: 10,
    color: '#6b7280',
    marginHorizontal: 8,
  },
  stopwatchButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  soundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 20,
  },
  fullscreenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    flex: 1,
  },
  fullscreenButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    flexShrink: 1,
  },
  countdownControls: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    alignItems: 'stretch',
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    zIndex: 9999,
  },
  fullscreenContainer2: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    alignSelf: 'center',
  },
  fullscreenCloseButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 10,
  },
  fullscreenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 30,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  fullscreenTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 30,
    flexWrap: 'nowrap',
    paddingHorizontal: 10,
  },
  fullscreenTimeCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1a2332',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    marginHorizontal: 4,
    marginVertical: 8,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  fullscreenTimeText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    textAlign: 'center',
  },
  fullscreenSeparator: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginHorizontal: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    alignSelf: 'flex-start',
    lineHeight: 70,
  },
  fullscreenTimeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    opacity: 0.8,
    marginHorizontal: 8,
  },
  fullscreenControlsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '90%',
    marginTop: 40,
  },
  fullscreenControlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fullscreenControlText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  fullscreenLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  fullscreenLabelSeparator: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.3,
  },
  fullscreenLabelText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    width: 120,
  },
  fullscreenTimeAndLabelWrapper: {
    alignItems: 'center',
  },
  fullscreenLabelTextSmall: {
    fontSize: 18,
    color: '#ffffff',
    marginTop: 10,
    fontWeight: '600',
  },
  setupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 15,
    fontSize: 18,
    color: '#374151',
    borderWidth: 1,
    borderColor: '#d1d5db',
    textAlign: 'center',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    justifyContent: 'center',
    marginBottom: 20,
  },
  bigTimeCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    marginVertical: 30,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  bigTimeText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  bigTimeLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 20,
    fontSize: 32,
    color: '#374151',
    borderWidth: 2,
    borderColor: '#3b82f6',
    width: '100%',
    textAlign: 'center',
    marginBottom: 30,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 5,
  },
  modalCancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOkButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 5,
  },
  modalOkButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  timeInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  timeInputWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  timeInputLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  timeInputBox: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  timeInputText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
  },
  miniBoardContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  miniBoardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  miniBoardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  miniBoard: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    borderWidth: 4,
    borderColor: '#8B4513',
    position: 'relative',
    overflow: 'hidden',
    padding: 12,
  },
  miniBoardEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniBoardEmptyText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  miniBoardNotes: {
    flex: 1,
    position: 'relative',
  },
  miniNote: {
    position: 'absolute',
    width: 90,
    height: 85,
    borderRadius: 6,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  miniNoteTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 3,
  },
  miniNoteContent: {
    fontSize: 7,
    color: '#4b5563',
    lineHeight: 9,
  },
  miniBoardFooter: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
});
