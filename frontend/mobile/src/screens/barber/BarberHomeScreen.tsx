import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C } from '../../theme/colors';
import Avatar from '../../components/Avatar';

export default function BarberHomeScreen({ navigation }: any) {
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // Format date to YYYY-MM-DD for API
  const todayString = () => new Date().toISOString().split('T')[0];

  const fetchData = useCallback(async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      if (!userJson || !token) return;

      const u = JSON.parse(userJson);
      setUser(u);

      // Fetch today's appointments
      // GET /api/appointments/barber/{id}/date/{date}
      const apptResponse = await fetch(
        `http://192.168.3.56:8080/api/appointments/barber/${u.id}/date/${todayString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const apptData = await apptResponse.json();
      setAppointments(Array.isArray(apptData) ? apptData : []);

      // Fetch recent reviews
      // GET /api/barbers/{id}/reviews
      const reviewResponse = await fetch(
        `http://192.168.3.56:8080/api/barbers/${u.id}/reviews`
      );
      const reviewData = await reviewResponse.json();
      setReviews(Array.isArray(reviewData) ? reviewData.slice(0, 3) : []);

    } catch (error) {
      console.error('Error fetching barber home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchData);
    return unsubscribe;
  }, [navigation]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Stats derived from today's appointments
  const done = appointments.filter(a => a.status === 'COMPLETED').length;
  const total = appointments.length;
  const todayEarnings = appointments
    .filter(a => a.status === 'COMPLETED')
    .reduce((sum, a) => sum + (a.servicePrice || 0), 0);
  const upcoming = appointments.filter(
    a => a.status === 'PENDING' || a.status === 'CONFIRMED'
  );

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const renderStars = (rating: number) =>
    '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={C.gold} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.gold} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}, profissional ✂️</Text>
              <Text style={styles.userName}>{user?.name}</Text>
              <View style={styles.ratingRow}>
                <Text style={styles.stars}>{renderStars(Math.round(user?.rating || 0))}</Text>
                <Text style={styles.ratingText}>
                  {user?.rating?.toFixed(1) || '0.0'} · {user?.reviewCount || 0} avaliações
                </Text>
              </View>
            </View>
            <View style={styles.avatarWrapper}>
              <Avatar url={user?.avatarUrl} size={52} borderColor={C.gold} />
              <View style={styles.onlineDot} />
            </View>
          </View>

          {/* Quick stats */}
          <View style={styles.statsGrid}>
            {[
              { icon: '👥', label: 'Hoje', value: `${done}/${total}`, sub: 'atendidos' },
              { icon: '💰', label: 'Hoje', value: `R$${todayEarnings.toFixed(0)}`, sub: 'faturado' },
              { icon: '⭐', label: 'Avaliação', value: user?.rating?.toFixed(1) || '0.0', sub: 'média geral' },
            ].map((stat) => (
              <View key={stat.sub} style={styles.statCard}>
                <Text style={styles.statIcon}>{stat.icon}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statSub}>{stat.sub}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.content}>
          {/* Upcoming appointments */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Próximos hoje ({upcoming.length})</Text>
              <TouchableOpacity onPress={() => navigation.navigate('BarberAgenda')}>
                <Text style={styles.seeAll}>Ver todos →</Text>
              </TouchableOpacity>
            </View>

            {upcoming.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>Nenhum atendimento pendente hoje</Text>
              </View>
            ) : (
              upcoming.slice(0, 3).map((appt) => (
                <View key={appt.id} style={styles.apptCard}>
                  <View style={styles.apptTime}>
                    <Text style={styles.apptTimeText}>{formatTime(appt.date)}</Text>
                  </View>
                  <View style={styles.apptInfo}>
                    <Text style={styles.apptClient}>{appt.clientName}</Text>
                    <Text style={styles.apptService}>{appt.serviceName}</Text>
                  </View>
                  <Text style={styles.apptPrice}>R${appt.servicePrice?.toFixed(0)}</Text>
                </View>
              ))
            )}
          </View>

          {/* Recent reviews */}
          {reviews.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Avaliações recentes</Text>
              {reviews.map((r) => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewClient}>{r.clientName || 'Cliente'}</Text>
                    <Text style={styles.reviewStars}>{renderStars(r.rating)}</Text>
                  </View>
                  {r.comment && (
                    <Text style={styles.reviewComment}>"{r.comment}"</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  loadingContainer: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  header: {
    padding: 20,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: '#0F0E09',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: { color: C.gray, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  userName: { color: C.white, fontSize: 22, fontWeight: '800', marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  stars: { color: C.gold, fontSize: 13 },
  ratingText: { color: C.gray, fontSize: 12 },
  avatarWrapper: { position: 'relative' },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: C.green, borderWidth: 2, borderColor: C.bg,
  },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14, padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { color: C.gold, fontWeight: '800', fontSize: 18 },
  statSub: { color: C.gray, fontSize: 10, marginTop: 1 },
  content: { padding: 20 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: C.white, fontSize: 16, fontWeight: '700' },
  seeAll: { color: C.gold, fontSize: 13, fontWeight: '600' },
  emptyCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 20,
    borderWidth: 1, borderColor: C.border, alignItems: 'center',
  },
  emptyText: { color: C.gray, fontSize: 14 },
  apptCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: C.border,
  },
  apptTime: {
    backgroundColor: C.goldDim, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  apptTimeText: { color: C.gold, fontWeight: '700', fontSize: 14 },
  apptInfo: { flex: 1 },
  apptClient: { color: C.white, fontWeight: '600', fontSize: 14 },
  apptService: { color: C.gray, fontSize: 12, marginTop: 2 },
  apptPrice: { color: C.gold, fontWeight: '800', fontSize: 15 },
  reviewCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: C.border,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  reviewClient: { color: C.white, fontWeight: '600', fontSize: 13 },
  reviewStars: { color: C.gold, fontSize: 13 },
  reviewComment: { color: C.gray, fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
});