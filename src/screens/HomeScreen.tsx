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
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';

// Tam Ekran TYT Deneme Bileşeni
function FullscreenTYTPracticeView({ onClose }: { onClose: () => void }) {
  const [timeLeft, setTimeLeft] = useState(165 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            Alert.alert('Süre Doldu!', 'TYT Deneme süreniz dolmuştur.');
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
          onPress={onClose}
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
  duration 
}: { 
  onClose: () => void; 
  duration: number;
}) {
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            Alert.alert('Süre Doldu!', 'Geri sayımınız tamamlandı.');
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
          onPress={onClose}
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
        </View>
      </View>
    </SafeAreaView>
  );
}

// Tam Ekran AYT Deneme Bileşeni
function FullscreenAYTPracticeView({ onClose }: { onClose: () => void }) {
  const [timeLeft, setTimeLeft] = useState(180 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            Alert.alert('Süre Doldu!', 'AYT Deneme süreniz dolmuştur.');
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
          onPress={onClose}
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
function FullscreenStopwatchView({ onClose }: { onClose: () => void }) {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
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
          onPress={onClose}
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
function StopwatchView({ onBack, onFullscreen }: { onBack: () => void; onFullscreen: () => void }) {
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
    <View style={styles.stopwatchContainer}>
      {/* Kronometre Gösterimi */}
      <View style={styles.timeContainerWithLabels}>
        <View style={styles.timeAndLabelWrapper}>
          <View style={styles.timeCircle}>
            <Text style={styles.timeText}>{formattedTime.hours}</Text>
          </View>
          <Text style={styles.labelTextSmall}>Saat</Text>
        </View>
        <Text style={styles.separator}>:</Text>
        <View style={styles.timeAndLabelWrapper}>
          <View style={styles.timeCircle}>
            <Text style={styles.timeText}>{formattedTime.minutes}</Text>
          </View>
          <Text style={styles.labelTextSmall}>Dakika</Text>
        </View>
        <Text style={styles.separator}>:</Text>
        <View style={styles.timeAndLabelWrapper}>
          <View style={styles.timeCircle}>
            <Text style={styles.timeText}>{formattedTime.seconds}</Text>
          </View>
          <Text style={styles.labelTextSmall}>Saniye</Text>
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

      <View style={styles.stopwatchButtonsRow}>
        <TouchableOpacity style={styles.backButton2} onPress={onBack}>
          <Ionicons name="arrow-back" size={18} color="white" />
          <Text style={styles.controlButtonText}>Geri</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.fullscreenButton}
          onPress={onFullscreen}
        >
          <Ionicons name="expand" size={18} color="white" />
          <Text style={styles.controlButtonText}>Tam Ekran</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// TYT Geri Sayım Bileşeni
function TYTCountdownView({ onBack }: { onBack: () => void }) {
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
    <View style={styles.stopwatchContainer}>
      {/* Zaman Gösterimi */}
      <View style={styles.timeContainer}>
        <View style={styles.smallTimeCircle}>
          <Text style={styles.smallTimeText}>{timeLeft.days}</Text>
        </View>
        <Text style={styles.smallSeparator}>:</Text>
        <View style={styles.smallTimeCircle}>
          <Text style={styles.smallTimeText}>{timeLeft.hours}</Text>
        </View>
        <Text style={styles.smallSeparator}>:</Text>
        <View style={styles.smallTimeCircle}>
          <Text style={styles.smallTimeText}>{timeLeft.minutes}</Text>
        </View>
        <Text style={styles.smallSeparator}>:</Text>
        <View style={styles.smallTimeCircle}>
          <Text style={styles.smallTimeText}>{timeLeft.seconds}</Text>
        </View>
      </View>

      {/* Etiketler */}
      <View style={styles.labelContainer}>
        <Text style={styles.smallLabelText}>Gün</Text>
        <Text style={styles.smallLabelSeparator}>:</Text>
        <Text style={styles.smallLabelText}>Saat</Text>
        <Text style={styles.smallLabelSeparator}>:</Text>
        <Text style={styles.smallLabelText}>Dakika</Text>
        <Text style={styles.smallLabelSeparator}>:</Text>
        <Text style={styles.smallLabelText}>Saniye</Text>
      </View>

      {/* Geri Butonu */}
      <TouchableOpacity style={styles.backButton2} onPress={onBack}>
        <Ionicons name="arrow-back" size={18} color="white" />
        <Text style={styles.controlButtonText}>Geri</Text>
      </TouchableOpacity>
    </View>
  );
}

// AYT Geri Sayım Bileşeni
function AYTCountdownView({ onBack }: { onBack: () => void }) {
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
    <View style={styles.stopwatchContainer}>
      {/* Zaman Gösterimi */}
      <View style={styles.timeContainer}>
        <View style={styles.smallTimeCircle}>
          <Text style={styles.smallTimeText}>{timeLeft.days}</Text>
        </View>
        <Text style={styles.smallSeparator}>:</Text>
        <View style={styles.smallTimeCircle}>
          <Text style={styles.smallTimeText}>{timeLeft.hours}</Text>
        </View>
        <Text style={styles.smallSeparator}>:</Text>
        <View style={styles.smallTimeCircle}>
          <Text style={styles.smallTimeText}>{timeLeft.minutes}</Text>
        </View>
        <Text style={styles.smallSeparator}>:</Text>
        <View style={styles.smallTimeCircle}>
          <Text style={styles.smallTimeText}>{timeLeft.seconds}</Text>
        </View>
      </View>

      {/* Etiketler */}
      <View style={styles.labelContainer}>
        <Text style={styles.smallLabelText}>Gün</Text>
        <Text style={styles.smallLabelSeparator}>:</Text>
        <Text style={styles.smallLabelText}>Saat</Text>
        <Text style={styles.smallLabelSeparator}>:</Text>
        <Text style={styles.smallLabelText}>Dakika</Text>
        <Text style={styles.smallLabelSeparator}>:</Text>
        <Text style={styles.smallLabelText}>Saniye</Text>
      </View>

      {/* Geri Butonu */}
      <TouchableOpacity style={styles.backButton2} onPress={onBack}>
        <Ionicons name="arrow-back" size={18} color="white" />
        <Text style={styles.controlButtonText}>Geri</Text>
      </TouchableOpacity>
    </View>
  );
}

// Özel Geri Sayım Bileşeni
function CustomCountdownView({ 
  onBack, 
  onFullscreen,
  customDuration 
}: { 
  onBack: () => void; 
  onFullscreen: (duration: number) => void;
  customDuration: number;
}) {
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
        Alert.alert('Başarılı', 'Ses seçildi: ' + result.assets[0].name);
      }
    } catch (error) {
      Alert.alert('Hata', 'Ses seçilemedi');
    }
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            Alert.alert('Süre Doldu!', 'Geri sayımınız tamamlandı.', [
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
    <View style={styles.stopwatchContainer}>
      {/* Zaman Gösterimi */}
      <View style={styles.timeContainer}>
        <View style={styles.timeCircle}>
          <Text style={styles.timeText}>{formattedTime.hours}</Text>
        </View>
        <Text style={styles.separator}>:</Text>
        <View style={styles.timeCircle}>
          <Text style={styles.timeText}>{formattedTime.minutes}</Text>
        </View>
        <Text style={styles.separator}>:</Text>
        <View style={styles.timeCircle}>
          <Text style={styles.timeText}>{formattedTime.seconds}</Text>
        </View>
      </View>

      {/* Etiketler */}
      <View style={styles.labelContainer}>
        <Text style={styles.labelText}>Saat</Text>
        <Text style={styles.labelSeparator}>:</Text>
        <Text style={styles.labelText}>Dakika</Text>
        <Text style={styles.labelSeparator}>:</Text>
        <Text style={styles.labelText}>Saniye</Text>
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

      <View style={styles.stopwatchButtonsRow}>
        <TouchableOpacity style={styles.backButton2} onPress={onBack}>
          <Ionicons name="arrow-back" size={18} color="white" />
          <Text style={styles.controlButtonText}>Geri</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.fullscreenButton}
          onPress={() => onFullscreen(customDuration)}
        >
          <Ionicons name="expand" size={18} color="white" />
          <Text style={styles.controlButtonText}>Tam Ekran</Text>
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
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('0');
  const [seconds, setSeconds] = useState('0');
  const [isEditing, setIsEditing] = useState(false);
  const [editingType, setEditingType] = useState<'hours' | 'minutes' | 'seconds' | null>(null);

  const totalSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);

  const handleStart = () => {
    if (totalSeconds <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir süre girin.');
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
    <View style={styles.stopwatchContainer}>
      <Text style={styles.setupTitle}>Geri sayım süresini ayarlayın</Text>
      
      {/* Input Alanları */}
      <View style={styles.timeInputRow}>
        <View style={styles.timeInputWrapper}>
          <Text style={styles.timeInputLabel}>Saat:</Text>
          <TouchableOpacity 
            style={styles.timeInputBox}
            onPress={() => handleEdit('hours')}
          >
            <Text style={styles.timeInputText}>{formatTime(hours)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.timeInputWrapper}>
          <Text style={styles.timeInputLabel}>Dakika:</Text>
          <TouchableOpacity 
            style={styles.timeInputBox}
            onPress={() => handleEdit('minutes')}
          >
            <Text style={styles.timeInputText}>{formatTime(minutes)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.timeInputWrapper}>
          <Text style={styles.timeInputLabel}>Saniye:</Text>
          <TouchableOpacity 
            style={styles.timeInputBox}
            onPress={() => handleEdit('seconds')}
          >
            <Text style={styles.timeInputText}>{formatTime(seconds)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Zaman Göstergesi */}
      <View style={styles.timeContainer}>
        <View style={styles.timeCircle}>
          <Text style={styles.timeText}>{formatTime(hours)}</Text>
        </View>
        <Text style={styles.separator}>:</Text>
        <View style={styles.timeCircle}>
          <Text style={styles.timeText}>{formatTime(minutes)}</Text>
        </View>
        <Text style={styles.separator}>:</Text>
        <View style={styles.timeCircle}>
          <Text style={styles.timeText}>{formatTime(seconds)}</Text>
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
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>
                {editingType === 'hours' ? 'Saat Giriniz' : 
                 editingType === 'minutes' ? 'Dakika Giriniz' : 
                 'Saniye Giriniz'}
              </Text>
              <TextInput
                style={styles.modalInput}
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
function AYTPracticeView({ onBack, onFullscreen }: { onBack: () => void; onFullscreen: () => void }) {
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
        Alert.alert('Ses Seç', 'Lütfen önce bir ses seçin!');
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
        Alert.alert('Başarılı', 'Ses seçildi: ' + result.assets[0].name);
      }
    } catch (error) {
      Alert.alert('Hata', 'Ses seçilemedi');
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
    <View style={styles.stopwatchContainer}>
      {/* Zaman Gösterimi ve Etiketler */}
      <View style={styles.timeContainerWithLabels}>
        <View style={styles.timeAndLabelWrapper}>
          <View style={styles.timeCircle}>
            <Text style={styles.timeText}>{formattedTime.minutes}</Text>
          </View>
          <Text style={styles.labelTextSmall}>Dakika</Text>
        </View>
        <Text style={styles.separator}>:</Text>
        <View style={styles.timeAndLabelWrapper}>
          <View style={styles.timeCircle}>
            <Text style={styles.timeText}>{formattedTime.seconds}</Text>
          </View>
          <Text style={styles.labelTextSmall}>Saniye</Text>
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
            Alert.alert('Bildirim Sesi', 'Ses seçme özelliği yakında eklenecek');
          }}
        >
          <Ionicons name="volume-high" size={18} color="white" />
          <Text style={styles.controlButtonText}>Ses</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stopwatchButtonsRow}>
        <TouchableOpacity style={styles.backButton2} onPress={onBack}>
          <Ionicons name="arrow-back" size={18} color="white" />
          <Text style={styles.controlButtonText}>Geri</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.fullscreenButton}
          onPress={onFullscreen}
        >
          <Ionicons name="expand" size={18} color="white" />
          <Text style={styles.controlButtonText}>Tam Ekran</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// TYT Deneme Geri Sayım Bileşeni
function TYTPracticeView({ onBack, onFullscreen }: { onBack: () => void; onFullscreen: () => void }) {
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
        Alert.alert('Ses Seç', 'Lütfen önce bir ses seçin!');
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
        Alert.alert('Başarılı', 'Ses seçildi: ' + result.assets[0].name);
      }
    } catch (error) {
      Alert.alert('Hata', 'Ses seçilemedi');
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
    <View style={styles.stopwatchContainer}>
      {/* Zaman Gösterimi ve Etiketler */}
      <View style={styles.timeContainerWithLabels}>
        <View style={styles.timeAndLabelWrapper}>
          <View style={styles.timeCircle}>
            <Text style={styles.timeText}>{formattedTime.minutes}</Text>
          </View>
          <Text style={styles.labelTextSmall}>Dakika</Text>
        </View>
        <Text style={styles.separator}>:</Text>
        <View style={styles.timeAndLabelWrapper}>
          <View style={styles.timeCircle}>
            <Text style={styles.timeText}>{formattedTime.seconds}</Text>
          </View>
          <Text style={styles.labelTextSmall}>Saniye</Text>
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

      <View style={styles.stopwatchButtonsRow}>
        <TouchableOpacity style={styles.backButton2} onPress={onBack}>
          <Ionicons name="arrow-back" size={18} color="white" />
          <Text style={styles.controlButtonText}>Geri</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.fullscreenButton}
          onPress={onFullscreen}
        >
          <Ionicons name="expand" size={18} color="white" />
          <Text style={styles.controlButtonText}>Tam Ekran</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const [showStopwatch, setShowStopwatch] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [fullscreenType, setFullscreenType] = useState<'stopwatch' | 'tyt-practice' | 'ayt-practice' | 'custom-countdown' | null>(null);
  const [fullscreenCustomDuration, setFullscreenCustomDuration] = useState(0);
  const [activeCounter, setActiveCounter] = useState<string | null>(null);
  const [customDuration, setCustomDuration] = useState(0);

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
        colors: ['#FFD700', '#FFA500'],
        textColor: '#FF7F50'
      };
    } else if (hour >= 12 && hour < 18) {
      return { 
        message: 'İyi Günler!', 
        colors: ['#87CEEB', '#4682B4'],
        textColor: '#FF8C42'
      };
    } else if (hour >= 18 && hour < 22) {
      return { 
        message: 'İyi Akşamlar!', 
        colors: ['#FF6347', '#FF4500'],
        textColor: '#FF6B47'
      };
    } else {
      return { 
        message: 'İyi Geceler!', 
        colors: ['#4B0082', '#191970'],
        textColor: '#9370DB'
      };
    }
  };

  const greeting = getGreeting();

  if (showFullscreen) {
    return (
      <Modal visible={true} transparent={true} animationType="fade" statusBarTranslucent>
        <View style={styles.fullscreenOverlay}>
          {fullscreenType === 'stopwatch' ? (
            <FullscreenStopwatchView onClose={() => {
              setShowFullscreen(false);
              setFullscreenType(null);
            }} />
          ) : fullscreenType === 'tyt-practice' ? (
            <FullscreenTYTPracticeView onClose={() => {
              setShowFullscreen(false);
              setFullscreenType(null);
            }} />
          ) : fullscreenType === 'ayt-practice' ? (
            <FullscreenAYTPracticeView onClose={() => {
              setShowFullscreen(false);
              setFullscreenType(null);
            }} />
          ) : fullscreenType === 'custom-countdown' ? (
            <FullscreenCustomCountdownView 
              onClose={() => {
                setShowFullscreen(false);
                setFullscreenType(null);
              }}
              duration={fullscreenCustomDuration}
            />
          ) : null}
        </View>
      </Modal>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#3b82f6', '#1e40af', '#7c3aed']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Ionicons name="compass" size={40} color="white" />
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
            style={styles.greetingCard}
          >
            <Text style={[styles.greetingTitle, { color: greeting.textColor }]}>{greeting.message}</Text>
            <View style={styles.divider} />
            <Text style={styles.quoteText}>"{dailyQuote.quote}"</Text>
            <Text style={styles.authorText}>— {dailyQuote.author}</Text>
          </LinearGradient>
        </View>
        {/* Sayaclar Kartı */}
        <View style={styles.content}>
          <View style={styles.statsCardHeader}>
            <Ionicons name="stopwatch" size={24} color="#1e40af" />
            <Text style={styles.statsCardTitle}>
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
          
          {!activeCounter ? (
            /* Sayaç Butonları */
            <View style={styles.countersCard}>
              <TouchableOpacity 
                style={styles.counterButton}
                onPress={() => setActiveCounter('stopwatch')}
              >
                <Ionicons name="stopwatch" size={22} color="#1e40af" />
                <Text style={styles.counterButtonText}>Kronometre</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.counterButton}
                onPress={() => setActiveCounter('tyt-countdown')}
              >
                <Ionicons name="calendar" size={22} color="#1e40af" />
                <Text style={styles.counterButtonText}>TYT Geri Sayım</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.counterButton}
                onPress={() => setActiveCounter('ayt-countdown')}
              >
                <Ionicons name="calendar" size={22} color="#1e40af" />
                <Text style={styles.counterButtonText}>AYT Geri Sayım</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.counterButton}
                onPress={() => setActiveCounter('tyt-practice')}
              >
                <Ionicons name="hourglass" size={22} color="#1e40af" />
                <Text style={styles.counterButtonText}>TYT Deneme</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.counterButton}
                onPress={() => setActiveCounter('ayt-practice')}
              >
                <Ionicons name="hourglass" size={22} color="#1e40af" />
                <Text style={styles.counterButtonText}>AYT Deneme</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.counterButton}
                onPress={() => setActiveCounter('custom-countdown')}
              >
                <Ionicons name="person-circle" size={22} color="#1e40af" />
                <Text style={styles.counterButtonText}>Özel Geri Sayım</Text>
              </TouchableOpacity>
            </View>
          ) : activeCounter === 'stopwatch' ? (
            /* Kronometre Gösterimi */
            <StopwatchView 
              onBack={() => setActiveCounter(null)} 
              onFullscreen={() => {
                setFullscreenType('stopwatch');
                setShowFullscreen(true);
              }}
            />
          ) : activeCounter === 'tyt-countdown' ? (
            /* TYT Geri Sayım Gösterimi */
            <TYTCountdownView onBack={() => setActiveCounter(null)} />
          ) : activeCounter === 'ayt-countdown' ? (
            /* AYT Geri Sayım Gösterimi */
            <AYTCountdownView onBack={() => setActiveCounter(null)} />
          ) : activeCounter === 'tyt-practice' ? (
            /* TYT Deneme Gösterimi */
            <TYTPracticeView 
              onBack={() => setActiveCounter(null)}
              onFullscreen={() => {
                setFullscreenType('tyt-practice');
                setShowFullscreen(true);
              }}
            />
          ) : activeCounter === 'ayt-practice' ? (
            /* AYT Deneme Gösterimi */
            <AYTPracticeView 
              onBack={() => setActiveCounter(null)}
              onFullscreen={() => {
                setFullscreenType('ayt-practice');
                setShowFullscreen(true);
              }}
            />
          ) : activeCounter === 'custom-countdown' ? (
            /* Özel Geri Sayım Gösterimi */
            customDuration > 0 ? (
              <CustomCountdownView 
                onBack={() => {
                  setCustomDuration(0);
                  setActiveCounter(null);
                }}
                onFullscreen={(dur) => {
                  setFullscreenCustomDuration(dur);
                  setFullscreenType('custom-countdown');
                  setShowFullscreen(true);
                }}
                customDuration={customDuration}
              />
            ) : (
              <CustomCountdownSetup 
                onBack={() => setActiveCounter(null)}
                onStart={(dur) => setCustomDuration(dur)}
              />
            )
          ) : null}
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
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 10,
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
  greetingTitle: {
    fontSize: 36,
    fontWeight: '800',
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
    alignItems: 'center',
    marginBottom: 20,
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
    marginTop: 20,
    flex: 1,
    marginRight: 8,
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
    alignItems: 'center',
    marginBottom: 20,
  },
  timeAndLabelWrapper: {
    alignItems: 'center',
  },
  labelTextSmall: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  smallTimeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
  smallTimeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
  },
  smallSeparator: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginHorizontal: 8,
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
    fontSize: 38,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 40,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  fullscreenTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
    flexWrap: 'nowrap',
  },
  fullscreenTimeCircle: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
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
  },
  fullscreenTimeText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  fullscreenSeparator: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
    marginHorizontal: 6,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
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
    marginTop: 20,
  },
  fullscreenLabelText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    width: 120,
  },
  fullscreenLabelSeparator: {
    fontSize: 16,
    color: '#ffffff',
    marginHorizontal: 10,
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
});
