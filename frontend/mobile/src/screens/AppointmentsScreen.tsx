import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../navigation';
import { C } from '../theme/colors';
import Avatar from '../components/Avatar';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Appointments'>;
};

// Status display config — color and label for each status
const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  PENDING:   { color: C.gold,  bg: 'rgba(212,168,67,0.15)',  label: 'Pendente'   },
  CONFIRMED: { color: C.green, bg: 'rgba(82,192,138,0.15)',  label: 'Confirmado' },
  COMPLETED: { color: C.gray,  bg: 'rgba(138,138,138,0.15)', label: 'Concluído'  },
  CANCELLED: { color: C.red,   bg: 'rgba(224,82,82,0.15)',   label: 'Cancelado'  },
};

export default function AppointmentsScreen({ navigation }: Props) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'upcoming' | 'history'>('upcoming');

  // Fetch appointments for logged user
  // GET /api/appointments/client/{clientId}
  const fetchAppointments = useCallback(async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');

      if (!userJson || !token) return;

      const user = JSON.parse(userJson);

      const response = await fetch(
        `http://192.168.3.56:8080/api/appointments/client/${user.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Refresh when screen comes into focus — catches new appointments
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchAppointments);
    return unsubscribe;
  }, [navigation]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  // Split appointments by status into two tabs
  const upcoming = appointments.filter(
    (a) => a.status === 'PENDING' || a.status === 'CONFIRMED'
  );
  const history = appointments.filter(
    (a) => a.status === 'COMPLETED' || a.status === 'CANCELLED'
  );

  const currentList = tab === 'upcoming' ? upcoming : history;

  // Format date from ISO string — "2026-03-22T09:00:00" → "Dom, 22 Mar · 09:00"
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const weekday = weekdays[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${weekday}, ${day} ${month} · ${hours}:${minutes}`;
  };

  // Cancel appointment — PATCH /api/appointments/{id}/status
  const handleCancel = async (appointmentId: number) => {
    Alert.alert(
      'Cancelar agendamento',
      'Tem certeza que deseja cancelar?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await fetch(
                `http://192.168.3.56:8080/api/appointments/${appointmentId}/status`,
                {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ status: 'CANCELLED' }),
                }
              );
              fetchAppointments();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível cancelar.');
            }
          },
        },
      ]
    );
  };

  const renderAppointment = ({ item }: { item: any }) => {
    const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          {/* Barber avatar placeholder */}
          <Avatar url={null} size={52} />

          <View style={styles.cardInfo}>
            <View style={styles.cardTopRow}>
              <Text style={styles.barberName}>{item.barberName}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                <Text style={[styles.statusText, { color: statusConfig.color }]}>
                  {statusConfig.label}
                </Text>
              </View>
            </View>

            {/* Service name */}
            <Text style={styles.serviceName}>{item.serviceName}</Text>

            {/* Date and time */}
            <Text style={styles.dateText}>
              📅 {formatDate(item.date)}
            </Text>

            {/* Price and duration */}
            {item.servicePrice && (
              <Text style={styles.priceText}>
                💰 R$ {item.servicePrice?.toFixed(2)} · ⏱ {item.serviceDuration} min
              </Text>
            )}
          </View>
        </View>

        {/* Action buttons for upcoming appointments */}
        {tab === 'upcoming' && (
          <View style={styles.cardActions}>
            {item.status === 'PENDING' || item.status === 'CONFIRMED' ? (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancel(item.id)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {/* Review button for completed appointments */}
        {tab === 'history' && item.status === 'COMPLETED' && (
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={() =>
              navigation.navigate('Review', {
                barber: { id: item.barberId, name: item.barberName, avatarUrl: null },
                service: item.serviceName,
                appointmentId: item.id,
              })
            }
          >
            <Text style={styles.reviewButtonText}>⭐ Avaliar atendimento</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Agendamentos</Text>

        {/* Tab switcher */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === 'upcoming' && styles.tabActive]}
            onPress={() => setTab('upcoming')}
          >
            <Text style={[styles.tabText, tab === 'upcoming' && styles.tabTextActive]}>
              Próximos {upcoming.length > 0 && `(${upcoming.length})`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'history' && styles.tabActive]}
            onPress={() => setTab('history')}
          >
            <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>
              Histórico
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator color={C.gold} style={{ marginTop: 48 }} />
      ) : currentList.length === 0 ? (
        // Empty state
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyTitle}>
            {tab === 'upcoming' ? 'Nenhum agendamento' : 'Sem histórico'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {tab === 'upcoming'
              ? 'Que tal agendar agora?'
              : 'Seus agendamentos concluídos aparecerão aqui.'}
          </Text>
          {tab === 'upcoming' && (
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => navigation.navigate('Explore')}
            >
              <Text style={styles.exploreButtonText}>Explorar barbeiros</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={C.gold}
            />
          }
          renderItem={renderAppointment}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  title: {
    color: C.white,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 0,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },
  tabActive: {
    backgroundColor: C.gold,
    borderColor: C.gold,
  },
  tabText: {
    color: C.gray,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#0A0A0A',
  },
  list: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  barberName: {
    color: C.white,
    fontWeight: '700',
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  serviceName: {
    color: C.gold,
    fontSize: 13,
    marginBottom: 4,
  },
  dateText: {
    color: C.gray,
    fontSize: 12,
    marginBottom: 2,
  },
  priceText: {
    color: C.gray,
    fontSize: 12,
  },
  cardActions: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(224,82,82,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(224,82,82,0.3)',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: C.red,
    fontWeight: '600',
    fontSize: 13,
  },
  reviewButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.goldDim,
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.3)',
    alignItems: 'center',
  },
  reviewButtonText: {
    color: C.gold,
    fontWeight: '600',
    fontSize: 13,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 20,
    opacity: 0.5,
  },
  emptyTitle: {
    color: C.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: C.gray,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: C.goldDim,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.4)',
  },
  exploreButtonText: {
    color: C.gold,
    fontWeight: '700',
    fontSize: 14,
  },
});