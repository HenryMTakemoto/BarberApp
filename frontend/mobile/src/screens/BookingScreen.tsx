import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation';
import { C } from '../theme/colors';
import GoldButton from '../components/GoldButton';
import Avatar from '../components/Avatar';
import apiRequest from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Booking'>;
  route: RouteProp<RootStackParamList, 'Booking'>;
};

const generateNextDays = () => {
  const days = [];
  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    const year = date.getFullYear();
    const monthNum = String(date.getMonth() + 1).padStart(2, '0');
    const dayNum = String(date.getDate()).padStart(2, '0');
    
    days.push({
      weekday: weekdays[date.getDay()],
      day: date.getDate(),
      month: months[date.getMonth()],
      dateString: `${year}-${monthNum}-${dayNum}`,
    });
  }
  return days;
};

export default function BookingScreen({ navigation, route }: Props) {
  const { barber, service } = route.params;
  const days = generateNextDays();

  const [selectedDay, setSelectedDay] = useState(days[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedTime(null);
      try {
        const response = await apiRequest(
          `/barbers/${barber.id}/availability/slots?date=${selectedDay.dateString}`
        );
        const data = await response.json();
        // Safety check — ensure data is always an array
        setSlots(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching slots:', error);
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDay]);

  return (
    <View style={styles.container}>
      <SafeAreaView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Escolher Horário</Text>
        </View>

        {/* Barber + service summary card */}
        <View style={styles.summaryCard}>
          <Avatar url={barber.avatarUrl} size={44} borderColor={C.gold} />
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryName}>{barber.name}</Text>
            <Text style={styles.summaryService}>{service.name}</Text>
          </View>
          <View style={styles.summaryPricing}>
            <Text style={styles.summaryPrice}>R$ {service.price.toFixed(2)}</Text>
            <Text style={styles.summaryDuration}>⏱ {service.duration}min</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Day selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Selecione o dia</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysGrid}>
            {days.map((day) => {
              const active = selectedDay.dateString === day.dateString;
              return (
                <TouchableOpacity
                  key={day.dateString}
                  onPress={() => setSelectedDay(day)}
                  style={[styles.dayCard, active && styles.dayCardActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dayWeekday, active && styles.dayTextActive]}>
                    {day.weekday}
                  </Text>
                  <Text style={[styles.dayNumber, active && styles.dayTextActive]}>
                    {day.day}
                  </Text>
                  <Text style={[styles.dayMonth, active && styles.dayTextActive]}>
                    {day.month}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Time slots */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            Horários disponíveis — {selectedDay.weekday}, {selectedDay.day} {selectedDay.month}
          </Text>

          {loadingSlots ? (
            <ActivityIndicator color={C.gold} style={{ marginTop: 24 }} />
          ) : slots.length === 0 ? (
            <View style={styles.noSlots}>
              <Text style={styles.noSlotsEmoji}>📅</Text>
              <Text style={styles.noSlotsText}>Nenhum horário disponível para este dia.</Text>
              <Text style={styles.noSlotsSubtext}>Tente outro dia!</Text>
            </View>
          ) : (
            <View style={styles.slotsGrid}>
              {slots.map((time) => {
                const active = selectedTime === time;
                return (
                  <TouchableOpacity
                    key={time}
                    onPress={() => setSelectedTime(active ? null : time)}
                    style={[styles.slotCard, active && styles.slotCardActive]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.slotTime, active && styles.slotTimeActive]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {selectedTime && (
            <View style={styles.selectedConfirm}>
              <Text style={styles.selectedConfirmText}>
                ✓ {selectedDay.weekday}, {selectedDay.day} {selectedDay.month} às {selectedTime} · {service.duration} min
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed bottom button */}
      <View style={styles.bottomBar}>
        {selectedTime && (
          <View style={styles.bottomSummary}>
            <Text style={styles.bottomDate}>
              📅 {selectedDay.weekday}, {selectedDay.day} {selectedDay.month} · 🕐 {selectedTime}
            </Text>
            <Text style={styles.bottomPrice}>R$ {service.price.toFixed(2)}</Text>
          </View>
        )}
        <GoldButton
          label={selectedTime ? 'Confirmar →' : 'Selecione um horário'}
          disabled={!selectedTime}
          onPress={() => {
            if (selectedTime) {
              navigation.navigate('Confirmation', {
                barber,
                service,
                day: `${selectedDay.weekday}, ${selectedDay.day} ${selectedDay.month}`,
                time: selectedTime,
                dateString: selectedDay.dateString,
              });
            }
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: C.gold,
    fontSize: 18,
  },
  title: {
    color: C.white,
    fontSize: 20,
    fontWeight: '800',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    margin: 20,
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryName: {
    color: C.white,
    fontWeight: '700',
    fontSize: 15,
  },
  summaryService: {
    color: C.gold,
    fontSize: 13,
    marginTop: 2,
  },
  summaryPricing: {
    alignItems: 'flex-end',
  },
  summaryPrice: {
    color: C.gold,
    fontWeight: '800',
    fontSize: 17,
  },
  summaryDuration: {
    color: C.gray,
    fontSize: 11,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionLabel: {
    color: C.gray,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  daysGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
  },
  dayCard: {
    minWidth: 60,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  dayCardActive: {
    backgroundColor: C.gold,
    borderColor: C.gold,
  },
  dayWeekday: {
    color: C.gray,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  dayNumber: {
    color: C.white,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  dayMonth: {
    color: C.gray,
    fontSize: 10,
    marginTop: 2,
  },
  dayTextActive: {
    color: '#0A0A0A',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotCard: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 13,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  slotCardActive: {
    backgroundColor: C.gold,
    borderColor: C.gold,
  },
  slotTime: {
    color: C.white,
    fontSize: 15,
    fontWeight: '700',
  },
  slotTimeActive: {
    color: '#0A0A0A',
  },
  noSlots: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noSlotsEmoji: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.5,
  },
  noSlotsText: {
    color: C.white,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  noSlotsSubtext: {
    color: C.gray,
    fontSize: 13,
  },
  selectedConfirm: {
    marginTop: 16,
    backgroundColor: 'rgba(82,192,138,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(82,192,138,0.3)',
    borderRadius: 12,
    padding: 12,
  },
  selectedConfirmText: {
    color: C.green,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
    padding: 20,
    paddingBottom: 32,
  },
  bottomSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bottomDate: {
    color: C.gray,
    fontSize: 13,
  },
  bottomPrice: {
    color: C.gold,
    fontWeight: '700',
    fontSize: 15,
  },
});
