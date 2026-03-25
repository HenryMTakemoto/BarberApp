import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C } from '../../theme/colors';
import Avatar from '../../components/Avatar';
import GoldButton from '../../components/GoldButton';

export default function BarberProfileEditScreen({ navigation }: any) {
  const [user, setUser] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      if (!userJson || !token) return;

      const u = JSON.parse(userJson);
      setUser(u);

      // Fetch barber services
      const response = await fetch(
        `http://192.168.3.56:8080/api/barbers/${u.id}/services`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching barber profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchData);
    return unsubscribe;
  }, [navigation]);

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          navigation.replace('Login');
        },
      },
    ]);
  };

  const renderStars = (rating: number) =>
    '★'.repeat(Math.round(rating || 0)) + '☆'.repeat(5 - Math.round(rating || 0));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={C.gold} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userRow}>
            <View style={styles.avatarWrapper}>
              <Avatar url={user?.avatarUrl} size={72} borderColor={C.gold} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name}</Text>
              <View style={styles.ratingRow}>
                <Text style={styles.stars}>{renderStars(user?.rating || 0)}</Text>
                <Text style={styles.ratingText}>
                  {user?.rating?.toFixed(1) || '0.0'} · {user?.reviewCount || 0} avaliações
                </Text>
              </View>
              <View style={styles.barberBadge}>
                <Text style={styles.barberBadgeText}>BARBER ✓</Text>
              </View>
            </View>
          </View>

          {/* Online toggle */}
          <View style={[styles.onlineCard, isOnline && styles.onlineCardActive]}>
            <View style={styles.onlineInfo}>
              <Text style={styles.onlineTitle}>
                {isOnline ? '🟢 Disponível para agendamentos' : '🔴 Indisponível'}
              </Text>
              <Text style={styles.onlineSubtitle}>
                {isOnline
                  ? 'Você está visível no Radar dos clientes'
                  : 'Você não aparece no Radar'}
              </Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={setIsOnline}
              trackColor={{ false: C.grayDim, true: C.green }}
              thumbColor={isOnline ? 'white' : C.gray}
            />
          </View>
        </View>

        <View style={styles.content}>
          {/* Services section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Meus serviços ({services.length})</Text>
            </View>
            {services.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>Nenhum serviço cadastrado</Text>
              </View>
            ) : (
              services.map((s) => (
                <View key={s.id} style={styles.serviceCard}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{s.name}</Text>
                    <Text style={styles.serviceDuration}>⏱ {s.duration} min</Text>
                  </View>
                  <Text style={styles.servicePrice}>R$ {s.price.toFixed(2)}</Text>
                </View>
              ))
            )}
          </View>

          {/* Specialties */}
          {user?.specialties?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Especialidades</Text>
              <View style={styles.specialtiesRow}>
                {user.specialties.map((s: string) => (
                  <View key={s} style={styles.specialtyBadge}>
                    <Text style={styles.specialtyBadgeText}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Address */}
          {user?.address && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Endereço</Text>
              <View style={styles.addressCard}>
                <Text style={styles.addressText}>
                  📍 {user.address.street}{user.address.number ? `, ${user.address.number}` : ''}
                </Text>
                <Text style={styles.addressText}>
                  {user.address.city} - {user.address.state}
                </Text>
              </View>
            </View>
          )}

          {/* Menu items */}
          <View style={styles.section}>
            {[
              {
                icon: '✂️',
                label: 'Gerenciar serviços e preços',
                onPress: () => navigation.navigate('BarberServices'),
              },
              {
                icon: '🕐',
                label: 'Horários de atendimento',
                onPress: () => navigation.navigate('BarberHorarios'),
              },
              {
                icon: '📍',
                label: 'Editar endereço',
                onPress: () => navigation.navigate('BarberEditInfo', { section: 'address' }),
              },
              {
                icon: '📝',
                label: 'Editar bio',
                onPress: () => navigation.navigate('BarberEditInfo', { section: 'bio' }),
              },
            ].map((item) => (
              <TouchableOpacity key={item.label} style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
                <View style={styles.menuIcon}>
                  <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout */}
          <View style={styles.section}>
            <GoldButton label="Sair" onPress={handleLogout} outline danger />
          </View>
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
    padding: 20, paddingTop: 8,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: '#0F0E09',
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  avatarWrapper: { position: 'relative' },
  userInfo: { flex: 1 },
  userName: { color: C.white, fontSize: 20, fontWeight: '800' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  stars: { color: C.gold, fontSize: 13 },
  ratingText: { color: C.gray, fontSize: 12 },
  barberBadge: {
    alignSelf: 'flex-start', backgroundColor: C.goldDim,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6,
  },
  barberBadgeText: { color: C.gold, fontSize: 11, fontWeight: '700' },
  onlineCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(224,82,82,0.1)',
    borderWidth: 1, borderColor: 'rgba(224,82,82,0.3)',
    borderRadius: 14, padding: 14, gap: 12,
  },
  onlineCardActive: {
    backgroundColor: 'rgba(82,192,138,0.1)',
    borderColor: 'rgba(82,192,138,0.3)',
  },
  onlineInfo: { flex: 1 },
  onlineTitle: { color: C.white, fontWeight: '700', fontSize: 14 },
  onlineSubtitle: { color: C.gray, fontSize: 12, marginTop: 2 },
  content: { padding: 20 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: C.white, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  emptyCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 20,
    borderWidth: 1, borderColor: C.border, alignItems: 'center',
  },
  emptyText: { color: C.gray, fontSize: 14 },
  serviceCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: C.border,
  },
  serviceInfo: { flex: 1 },
  serviceName: { color: C.white, fontWeight: '600', fontSize: 14 },
  serviceDuration: { color: C.gray, fontSize: 12, marginTop: 2 },
  servicePrice: { color: C.gold, fontWeight: '800', fontSize: 16 },
  specialtiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  specialtyBadge: {
    backgroundColor: C.goldDim, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(212,168,67,0.3)',
  },
  specialtyBadgeText: { color: C.gold, fontSize: 12, fontWeight: '600' },
  addressCard: {
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border,
  },
  addressText: { color: C.gray, fontSize: 13, lineHeight: 20 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  menuIcon: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { color: C.white, fontSize: 15, flex: 1 },
  menuArrow: { color: C.grayDim, fontSize: 18 },
});