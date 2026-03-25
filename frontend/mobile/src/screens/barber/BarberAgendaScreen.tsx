import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C } from '../../theme/colors';
import Avatar from '../../components/Avatar';
import apiRequest from '../../services/api';


export default function BarberAgendaScreen({ navigation }: any) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Generate next 7 days
  const generateDays = () => {
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      const year = date.getFullYear();
      const monthNum = String(date.getMonth() + 1).padStart(2, '0');
      const dayNum = String(date.getDate()).padStart(2, '0');
      
      return {
        weekday: weekdays[date.getDay()],
        day: date.getDate(),
        month: months[date.getMonth()],
        dateString: `${year}-${monthNum}-${dayNum}`,
      };
    });
  };

  const days = generateDays();

  const fetchAppointments = useCallback(async (dayIndex: number) => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      if (!userJson || !token) return;

      const u = JSON.parse(userJson);
      setUser(u);

      const dateString = days[dayIndex].dateString;

      // GET /api/appointments/barber/{id}/date/{date}
      const response = await apiRequest(
        `/appointments/barber/${u.id}/date/${dateString}`
      );
      const data = await response.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching agenda:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments(selectedDay);
  }, [selectedDay]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => fetchAppointments(selectedDay));
    return unsubscribe;
  }, [navigation, selectedDay]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAppointments(selectedDay);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  // Update appointment status
  const handleUpdateStatus = async (appointmentId: number, status: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await apiRequest(
        `/appointments/${appointmentId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      );
      if (response.ok) {
        fetchAppointments(selectedDay);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o status.');
    }
  };

  const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    PENDING: { color: C.gold, bg: 'rgba(212,168,67,0.15)', label: 'Pendente' },
    CONFIRMED: { color: C.green, bg: 'rgba(82,192,138,0.15)', label: 'Confirmado' },
    COMPLETED: { color: C.gray, bg: 'rgba(138,138,138,0.15)', label: 'Concluído' },
    CANCELLED: { color: C.red, bg: 'rgba(224,82,82,0.15)', label: 'Cancelado' },
  };

  const totalEarnings = appointments
    .filter(a => a.status === 'COMPLETED')
    .reduce((sum, a) => sum + (a.servicePrice || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Agenda</Text>

        {/* Day selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysRow}
        >
          {days.map((day, i) => {
            const active = selectedDay === i;
            return (
              <TouchableOpacity
                key={day.dateString}
                onPress={() => { setSelectedDay(i); setLoading(true); }}
                style={[styles.dayCard, active && styles.dayCardActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.dayWeekday, active && styles.dayTextActive]}>{day.weekday}</Text>
                <Text style={[styles.dayNumber, active && styles.dayTextActive]}>{day.day}</Text>
                <Text style={[styles.dayMonth, active && styles.dayTextActive]}>{day.month}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Day summary */}
        {!loading && (
          <View style={styles.daySummary}>
            <Text style={styles.daySummaryText}>
              {appointments.length} atendimentos
            </Text>
            {totalEarnings > 0 && (
              <Text style={styles.daySummaryEarnings}>
                R$ {totalEarnings.toFixed(2)} faturados
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Appointments list */}
      {loading ? (
        <ActivityIndicator color={C.gold} style={{ marginTop: 48 }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.gold} />
          }
        >
          {appointments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📅</Text>
              <Text style={styles.emptyTitle}>Nenhum atendimento</Text>
              <Text style={styles.emptySubtitle}>Sem agendamentos para este dia.</Text>
            </View>
          ) : (
            appointments.map((appt, index) => {
              const st = STATUS_CONFIG[appt.status] || STATUS_CONFIG.PENDING;
              return (
                <View key={appt.id} style={styles.timelineRow}>
                  {/* Timeline indicator */}
                  <View style={styles.timelineIndicator}>
                    <View style={[styles.timelineDot, { backgroundColor: st.color }]} />
                    {index < appointments.length - 1 && <View style={styles.timelineLine} />}
                  </View>

                  {/* Appointment card */}
                  <View style={[styles.apptCard, { borderColor: appt.status === 'CONFIRMED' ? 'rgba(82,192,138,0.4)' : C.border }]}>
                    <View style={styles.apptHeader}>
                      <View style={styles.apptHeaderLeft}>
                        <Text style={styles.apptTime}>{formatTime(appt.date)}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                          <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                        </View>
                      </View>
                      <Text style={styles.apptPrice}>R$ {appt.servicePrice?.toFixed(2)}</Text>
                    </View>

                    <View style={styles.apptBody}>
                      <Avatar url={null} size={40} />
                      <View style={styles.apptInfo}>
                        <Text style={styles.apptClient}>{appt.clientName}</Text>
                        <Text style={styles.apptService}>{appt.serviceName} · {appt.serviceDuration}min</Text>
                      </View>
                    </View>

                    {/* Action buttons */}
                    {appt.status === 'PENDING' && (
                      <View style={styles.apptActions}>
                        <TouchableOpacity
                          style={styles.confirmButton}
                          onPress={() => handleUpdateStatus(appt.id, 'CONFIRMED')}
                        >
                          <Text style={styles.confirmButtonText}>✓ Confirmar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={() => Alert.alert(
                            'Cancelar', 'Cancelar este agendamento?',
                            [
                              { text: 'Não', style: 'cancel' },
                              { text: 'Sim', style: 'destructive', onPress: () => handleUpdateStatus(appt.id, 'CANCELLED') },
                            ]
                          )}
                        >
                          <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {appt.status === 'CONFIRMED' && (
                      <TouchableOpacity
                        style={styles.completeButton}
                        onPress={() => handleUpdateStatus(appt.id, 'COMPLETED')}
                      >
                        <Text style={styles.completeButtonText}>✓ Marcar como concluído</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  title: { color: C.white, fontSize: 26, fontWeight: '800', marginBottom: 16 },
  daysRow: { gap: 8, paddingRight: 20, marginBottom: 12 },
  dayCard: {
    alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12,
    backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.border, minWidth: 52,
  },
  dayCardActive: { backgroundColor: C.gold, borderColor: C.gold },
  dayWeekday: { color: C.gray, fontSize: 10, fontWeight: '600', marginBottom: 2 },
  dayNumber: { color: C.white, fontSize: 18, fontWeight: '800', lineHeight: 22 },
  dayMonth: { color: C.gray, fontSize: 10, marginTop: 2 },
  dayTextActive: { color: '#0A0A0A' },
  daySummary: { flexDirection: 'row', justifyContent: 'space-between' },
  daySummaryText: { color: C.gray, fontSize: 13 },
  daySummaryEarnings: { color: C.green, fontSize: 13, fontWeight: '600' },
  list: { padding: 20, paddingBottom: 100 },
  timelineRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  timelineIndicator: { alignItems: 'center', width: 12, paddingTop: 16 },
  timelineDot: { width: 10, height: 10, borderRadius: 5 },
  timelineLine: { width: 2, flex: 1, backgroundColor: C.border, marginTop: 4 },
  apptCard: {
    flex: 1, backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1, padding: 14,
  },
  apptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  apptHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  apptTime: { color: C.white, fontWeight: '700', fontSize: 15 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  apptPrice: { color: C.gold, fontWeight: '800', fontSize: 15 },
  apptBody: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  apptInfo: { flex: 1 },
  apptClient: { color: C.white, fontWeight: '600', fontSize: 14 },
  apptService: { color: C.gray, fontSize: 12, marginTop: 2 },
  apptActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  confirmButton: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: 'rgba(82,192,138,0.15)',
    borderWidth: 1, borderColor: 'rgba(82,192,138,0.4)',
    alignItems: 'center',
  },
  confirmButtonText: { color: C.green, fontWeight: '700', fontSize: 13 },
  cancelButton: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: 'rgba(224,82,82,0.1)',
    borderWidth: 1, borderColor: 'rgba(224,82,82,0.3)',
    alignItems: 'center',
  },
  cancelButtonText: { color: C.red, fontWeight: '600', fontSize: 13 },
  completeButton: {
    marginTop: 12, paddingVertical: 10, borderRadius: 10,
    backgroundColor: 'rgba(82,192,138,0.15)',
    borderWidth: 1, borderColor: 'rgba(82,192,138,0.4)',
    alignItems: 'center',
  },
  completeButtonText: { color: C.green, fontWeight: '700', fontSize: 13 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 52, marginBottom: 16, opacity: 0.5 },
  emptyTitle: { color: C.white, fontSize: 17, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { color: C.gray, fontSize: 14 },
});
