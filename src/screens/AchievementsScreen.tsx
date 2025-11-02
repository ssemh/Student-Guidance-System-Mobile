import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';

const achievements = [
  { 
    id: 1, 
    title: 'Matematik Ustası', 
    description: '100 matematik sorusunu doğru çözdün!', 
    icon: 'trophy', 
    color: '#f59e0b',
    category: 'academic',
    status: 'earned',
    date: '15.03.2024',
    progress: 100,
    total: 100
  },
  { 
    id: 2, 
    title: 'Haftalık Şampiyon', 
    description: 'Bu hafta en çok puanı sen topladın!', 
    icon: 'star', 
    color: '#ef4444',
    category: 'social',
    status: 'earned',
    date: '12.03.2024',
    progress: 100,
    total: 100
  },
  { 
    id: 3, 
    title: 'Fizik Dehası', 
    description: '50 fizik sorusunu doğru çözdün!', 
    icon: 'book', 
    color: '#10b981',
    category: 'academic',
    status: 'earned',
    date: '10.03.2024',
    progress: 50,
    total: 50
  },
  { 
    id: 4, 
    title: 'Hedef Avcısı', 
    description: '3 günlük hedefini tamamladın!', 
    icon: 'target', 
    color: '#3b82f6',
    category: 'academic',
    status: 'earned',
    date: '18.03.2024',
    progress: 3,
    total: 3
  },
  { 
    id: 5, 
    title: 'Topluluk Lideri', 
    description: '10 arkadaşını platforma davet ettin!', 
    icon: 'people', 
    color: '#8b5cf6',
    category: 'social',
    status: 'earned',
    date: '17.03.2024',
    progress: 10,
    total: 10
  },
  { 
    id: 6, 
    title: 'Oyun Ustası', 
    description: '5 farklı oyunda en yüksek puanı al!', 
    icon: 'game-controller', 
    color: '#f5576c',
    category: 'games',
    status: 'locked',
    date: 'Kilitli',
    progress: 3,
    total: 5
  },
  { 
    id: 7, 
    title: 'Sürekli Öğrenen', 
    description: '30 gün boyunca her gün ders çalış!', 
    icon: 'school', 
    color: '#4facfe',
    category: 'academic',
    status: 'locked',
    date: 'Kilitli',
    progress: 12,
    total: 30
  },
  { 
    id: 8, 
    title: 'Kimya Uzmanı', 
    description: '75 kimya sorusunu doğru çöz!', 
    icon: 'flask', 
    color: '#11998e',
    category: 'academic',
    status: 'locked',
    date: 'Kilitli',
    progress: 22,
    total: 75
  },
  { 
    id: 9, 
    title: 'Analiz Uzmanı', 
    description: '10 farklı analiz raporunu incele!', 
    icon: 'stats-chart', 
    color: '#6c5ce7',
    category: 'academic',
    status: 'locked',
    date: 'Kilitli',
    progress: 4,
    total: 10
  },
  { 
    id: 10, 
    title: 'Sohbet Ustası', 
    description: 'Yapay zeka ile 50 sohbet gerçekleştir!', 
    icon: 'chatbubbles', 
    color: '#ff6b6b',
    category: 'social',
    status: 'locked',
    date: 'Kilitli',
    progress: 10,
    total: 50
  },
];

export default function AchievementsScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'academic' | 'social' | 'games'>('all');

  const earnedCount = achievements.filter(a => a.status === 'earned').length;
  const lockedCount = achievements.filter(a => a.status === 'locked').length;
  const totalCount = achievements.length;

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#3b82f6', '#1e40af', '#7c3aed']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerPattern}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
        </View>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="trophy" size={32} color="white" style={styles.headerIcon} />
          <Text style={styles.headerTitle}>Başarımlarım</Text>
          <Text style={styles.headerSubtitle}>{earnedCount} başarım kazandın!</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <LinearGradient
            colors={['#3b82f6', '#2563eb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={styles.statIconWrapper}>
              <Ionicons name="trophy" size={24} color="white" />
            </View>
            <Text style={styles.statNumberWhite}>{totalCount}</Text>
            <Text style={styles.statLabelWhite}>Toplam Başarı</Text>
          </LinearGradient>
          <LinearGradient
            colors={['#8b5cf6', '#7c3aed']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={styles.statIconWrapper}>
              <Ionicons name="checkmark-circle" size={24} color="white" />
            </View>
            <Text style={styles.statNumberWhite}>{earnedCount}</Text>
            <Text style={styles.statLabelWhite}>Kazanılan</Text>
          </LinearGradient>
          <LinearGradient
            colors={['#6366f1', '#4f46e5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={styles.statIconWrapper}>
              <Ionicons name="lock-closed" size={24} color="white" />
            </View>
            <Text style={styles.statNumberWhite}>{lockedCount}</Text>
            <Text style={styles.statLabelWhite}>Kalan</Text>
          </LinearGradient>
        </View>

        <View style={[styles.categoryButtons, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.categoryButton}
            onPress={() => setSelectedCategory('all')}
          >
            {selectedCategory === 'all' ? (
              <LinearGradient
                colors={['#3b82f6', '#2563eb']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.categoryButtonGradient}
              >
                <Text style={styles.activeCategoryButtonText}>Tümü</Text>
              </LinearGradient>
            ) : (
              <Text style={[styles.categoryButtonText, { color: colors.text }]}>Tümü</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.categoryButton}
            onPress={() => setSelectedCategory('academic')}
          >
            {selectedCategory === 'academic' ? (
              <LinearGradient
                colors={['#3b82f6', '#2563eb']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.categoryButtonGradient}
              >
                <Text style={styles.activeCategoryButtonText}>Akademik</Text>
              </LinearGradient>
            ) : (
              <Text style={[styles.categoryButtonText, { color: colors.text }]}>Akademik</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.categoryButton}
            onPress={() => setSelectedCategory('social')}
          >
            {selectedCategory === 'social' ? (
              <LinearGradient
                colors={['#3b82f6', '#2563eb']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.categoryButtonGradient}
              >
                <Text style={styles.activeCategoryButtonText}>Sosyal</Text>
              </LinearGradient>
            ) : (
              <Text style={[styles.categoryButtonText, { color: colors.text }]}>Sosyal</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.categoryButton}
            onPress={() => setSelectedCategory('games')}
          >
            {selectedCategory === 'games' ? (
              <LinearGradient
                colors={['#3b82f6', '#2563eb']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.categoryButtonGradient}
              >
                <Text style={styles.activeCategoryButtonText}>Oyunlar</Text>
              </LinearGradient>
            ) : (
              <Text style={[styles.categoryButtonText, { color: colors.text }]}>Oyunlar</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.achievementsGrid}>
          {filteredAchievements.map((achievement) => (
            <View
              key={achievement.id}
              style={[
                styles.achievementCard,
                achievement.status === 'locked' && styles.achievementCardLocked
              ]}
            >
              {achievement.status === 'earned' ? (
                <View style={[styles.achievementCardGradient, { backgroundColor: colors.card, borderColor: achievement.color, borderWidth: 2 }]}>
                  <View style={styles.achievementHeader}>
                    <LinearGradient
                      colors={[achievement.color, achievement.color + 'DD']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.achievementIconContainer}
                    >
                      <Ionicons name={achievement.icon as any} size={28} color="white" />
                    </LinearGradient>
                    <View style={styles.achievementInfo}>
                      <View style={styles.achievementTitleRow}>
                        <Text style={[styles.achievementTitle, { color: colors.text }]}>{achievement.title}</Text>
                        {achievement.status === 'earned' && (
                          <Ionicons name="checkmark-circle" size={20} color={achievement.color} />
                        )}
                      </View>
                      <Text style={[styles.achievementDate, { color: colors.textSecondary }]}>{achievement.date}</Text>
                    </View>
                  </View>
                  <Text style={[styles.achievementDescription, { color: colors.textSecondary }]}>
                    {achievement.description}
                  </Text>
                  <View style={styles.achievementProgress}>
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                      <LinearGradient
                        colors={[achievement.color, achievement.color + 'CC']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.progressFill,
                          { width: `${(achievement.progress / achievement.total) * 100}%` }
                        ]}
                      />
                    </View>
                    <Text style={[styles.progressText, { color: achievement.color, fontWeight: 'bold' }]}>
                      {achievement.progress}/{achievement.total}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={[styles.achievementCardContent, { backgroundColor: colors.card }]}>
                  <View style={styles.achievementHeader}>
                    <View style={[styles.achievementIconContainer, { backgroundColor: colors.border }]}>
                      <Ionicons name={achievement.icon as any} size={28} color={colors.textSecondary} />
                    </View>
                    <View style={styles.achievementInfo}>
                      <View style={styles.achievementTitleRow}>
                        <Text style={[styles.achievementTitle, { color: colors.textSecondary }]}>{achievement.title}</Text>
                        <Ionicons name="lock-closed" size={20} color={colors.textSecondary} />
                      </View>
                      <Text style={[styles.achievementDate, { color: colors.textSecondary }]}>{achievement.date}</Text>
                    </View>
                  </View>
                  <Text style={[styles.achievementDescription, { color: colors.textSecondary }]}>
                    {achievement.description}
                  </Text>
                  <View style={styles.achievementProgress}>
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${(achievement.progress / achievement.total) * 100}%`,
                            backgroundColor: colors.textSecondary + '60'
                          }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                      {achievement.progress}/{achievement.total}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
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
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -50,
    right: -50,
  },
  circle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: -30,
    left: -30,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 15,
    padding: 8,
    zIndex: 1,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 40,
    zIndex: 1,
  },
  headerIcon: {
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  statIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumberWhite: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statLabelWhite: {
    fontSize: 12,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
    flexWrap: 'wrap',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  categoryButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  activeCategoryButtonText: {
    color: 'white',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  achievementsGrid: {
    gap: 18,
  },
  achievementCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  achievementCardGradient: {
    padding: 18,
    borderRadius: 20,
  },
  achievementCardContent: {
    padding: 18,
  },
  achievementCardLocked: {
    opacity: 0.85,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 14,
  },
  achievementIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  achievementDate: {
    fontSize: 13,
    marginTop: 2,
  },
  achievementDescription: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  achievementProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 45,
    textAlign: 'right',
  },
});

