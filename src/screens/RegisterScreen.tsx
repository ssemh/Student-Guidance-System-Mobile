import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { showToast } = useToast();

  const handleRegister = () => {
    if (!name || !email || !password || !confirmPassword) {
      showToast('Lütfen tüm alanları doldurun', 'error', 'Hata');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Şifreler eşleşmiyor', 'error', 'Hata');
      return;
    }
    // Burada kayıt işlemi yapılacak
    showToast('Hesabınız oluşturuldu!', 'success', 'Başarılı', 2000);
    setTimeout(() => {
      navigation.navigate('Login' as never);
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#3b82f6', '#1e40af', '#7c3aed']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.logoContainer}>
              <Ionicons name="compass" size={80} color="white" />
              <Text style={styles.logoText}>Pusula</Text>
              <Text style={styles.subtitle}>Hemen Kaydol ve Başla!</Text>
            </View>

            <View style={[styles.formContainer, { backgroundColor: colors.surface }]}>
              <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="person" size={20} color={colors.primary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Ad Soyad"
                  placeholderTextColor={colors.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="mail" size={20} color={colors.primary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="E-posta"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="lock-closed" size={20} color={colors.primary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Şifre"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>

              <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="lock-closed" size={20} color={colors.primary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Şifre Tekrar"
                  placeholderTextColor={colors.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.registerButton, { backgroundColor: colors.primary }]} onPress={handleRegister}>
                <Text style={styles.registerButtonText}>Kaydol</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => navigation.navigate('Login' as never)}
              >
                <Text style={[styles.loginButtonText, { color: colors.primary }]}>
                  Zaten hesabın var mı? Giriş Yap
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginTop: 5,
  },
  formContainer: {
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  eyeButton: {
    padding: 5,
  },
  registerButton: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginButton: {
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 16,
  },
});