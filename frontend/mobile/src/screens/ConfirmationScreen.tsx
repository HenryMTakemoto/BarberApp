import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../navigation';
import { C } from '../theme/colors';
import GoldButton from '../components/GoldButton';
import Avatar from '../components/Avatar';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Confirmation'>;
  route: RouteProp<RootStackParamList, 'Confirmation'>;
};

export default function ConfirmationScreen({ navigation, route }: Props) {
  const { barber, service, day, time, dateString } = route.params;
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);

      // Get logged user from AsyncStorage — saved during login
      const userJson = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');

      if (!userJson || !token) {
        Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
        navigation.replace('Login');
        return;
      }

      const user = JSON.parse(userJson);

      // Combine dateString (YYYY-MM-DD) + time (HH:MM) into ISO format
      // Backend expects: "2026-03-22T09:00:00"
      const scheduledAt = `${dateString}T${time}:00`;

      // POST /api/appointments — creates appointment with PENDING status
      const response = await fetch('http://192.168.3.56:8080/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
        clientId: user.id,
        barberId: barber.id,
        serviceId: service.id,
        date: scheduledAt,  // changed from scheduledAt to date
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Erro', data.message || 'Erro ao criar agendamento.');
        return;
      }

      // Show success screen
      setConfirmed(true);

    } catch (error) {
      Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Success screen after confirmed
  if (confirmed) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.successContainer}>
          {/* Success icon */}
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Agendado!</Text>
          <Text style={styles.successSubtitle}>
            Seu horário com{' '}
            <Text style={styles.successHighlight}>{barber.name}</Text>{' '}
            foi confirmado.
          </Text>

          {/* Ticket card */}
          <View style={styles.ticket}>
            {/* Ticket header */}
            <View style={styles.ticketHeader}>
              <Avatar url={barber.avatarUrl} size={44} borderColor={C.gold} />
              <View style={styles.ticketHeaderInfo}>
                <Text style={styles.ticketBarber}>{barber.name}</Text>
                <Text style={styles.ticketService}>{service.name}</Text>
              </View>
            </View>

            {/* Ticket divider */}
            <View style={styles.ticketDivider} />

            {/* Ticket details */}
            {[
              { icon: '📅', label: 'Data', value: day },
              { icon: '🕐', label: 'Horário', value: time },
              { icon: '⏱', label: 'Duração', value: `${service.duration} min` },
              { icon: '💰', label: 'Valor', value: `R$ ${service.price.toFixed(2)}` },
              { icon: '📋', label: 'Status', value: 'Pendente' },
            ].map((row, i, arr) => (
              <View
                key={row.label}
                style={[
                  styles.ticketRow,
                  i < arr.length - 1 && styles.ticketRowBorder,
                ]}
              >
                <Text style={styles.ticketLabel}>
                  {row.icon} {row.label}
                </Text>
                <Text style={[
                  styles.ticketValue,
                  row.label === 'Status' && styles.ticketPending,
                ]}>
                  {row.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Action buttons */}
          <View style={styles.successButtons}>
            <GoldButton
              label="Ver meus agendamentos"
              onPress={() => navigation.replace('MainTabs')}
            />
            <View style={{ height: 10 }} />
            <GoldButton
              label="Voltar ao início"
              outline
              onPress={() => navigation.replace('MainTabs')}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Confirmation review screen
  return (
    <View style={styles.container}>
      <SafeAreaView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Confirmar</Text>
            <Text style={styles.subtitle}>Revise antes de confirmar</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Barber card */}
        <View style={styles.section}>
          <View style={styles.barberCard}>
            <Avatar url={barber.avatarUrl} size={60} borderColor={C.gold} />
            <View style={styles.barberInfo}>
              <Text style={styles.barberName}>{barber.name}</Text>
              <Text style={styles.barberRating}>
                {'★'.repeat(Math.round(barber.rating || 0))} {barber.rating?.toFixed(1) || '0.0'}
              </Text>
              {barber.address && (
                <Text style={styles.barberAddress}>
                  📍 {barber.address.street}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Appointment details */}
        <View style={styles.section}>
          <View style={styles.detailsCard}>
            {[
              { icon: '✂️', label: 'Serviço', value: service.name, highlight: true },
              { icon: '📅', label: 'Data', value: day },
              { icon: '🕐', label: 'Horário', value: time },
              { icon: '⏱', label: 'Duração', value: `${service.duration} min` },
            ].map((row, i, arr) => (
              <View
                key={row.label}
                style={[
                  styles.detailRow,
                  i < arr.length - 1 && styles.detailRowBorder,
                ]}
              >
                <View style={[styles.detailIcon, row.highlight && styles.detailIconHighlight]}>
                  <Text style={{ fontSize: 18 }}>{row.icon}</Text>
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>{row.label}</Text>
                  <Text style={[styles.detailValue, row.highlight && styles.detailValueHighlight]}>
                    {row.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Price summary */}
        <View style={styles.section}>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{service.name}</Text>
              <Text style={styles.priceValue}>R$ {service.price.toFixed(2)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Taxa</Text>
              <Text style={styles.priceFree}>Grátis</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceTotalLabel}>Total</Text>
              <Text style={styles.priceTotalValue}>R$ {service.price.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Cancellation policy */}
        <View style={styles.section}>
          <View style={styles.policyCard}>
            <Text style={styles.policyTitle}>⚠️ Política de cancelamento</Text>
            <Text style={styles.policyText}>
              Cancelamentos com menos de 2h podem ter cobrança parcial.
            </Text>
          </View>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Fixed bottom bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomSummary}>
          <View>
            <Text style={styles.bottomLabel}>Total</Text>
            <Text style={styles.bottomTotal}>R$ {service.price.toFixed(2)}</Text>
          </View>
          <View style={styles.bottomRight}>
            <Text style={styles.bottomLabel}>Horário</Text>
            <Text style={styles.bottomTime}>{day} · {time}</Text>
          </View>
        </View>
        <View style={styles.bottomButtons}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <GoldButton
              label="✓ Confirmar"
              onPress={handleConfirm}
              loading={loading}
            />
          </View>
        </View>
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
  subtitle: {
    color: C.gray,
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  barberCard: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  barberInfo: {
    flex: 1,
  },
  barberName: {
    color: C.white,
    fontSize: 17,
    fontWeight: '700',
  },
  barberRating: {
    color: C.gold,
    fontSize: 13,
    marginTop: 4,
  },
  barberAddress: {
    color: C.gray,
    fontSize: 12,
    marginTop: 4,
  },
  detailsCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  detailIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailIconHighlight: {
    backgroundColor: C.goldDim,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    color: C.gray,
    fontSize: 12,
  },
  detailValue: {
    color: C.white,
    fontWeight: '600',
    fontSize: 15,
    marginTop: 2,
  },
  detailValueHighlight: {
    color: C.gold,
  },
  priceCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {
    color: C.gray,
    fontSize: 14,
  },
  priceValue: {
    color: C.white,
    fontWeight: '600',
  },
  priceFree: {
    color: C.green,
    fontWeight: '600',
  },
  priceDivider: {
    height: 1,
    backgroundColor: C.border,
    marginBottom: 12,
    borderStyle: 'dashed',
  },
  priceTotalLabel: {
    color: C.white,
    fontWeight: '700',
    fontSize: 16,
  },
  priceTotalValue: {
    color: C.gold,
    fontWeight: '800',
    fontSize: 20,
  },
  policyCard: {
    backgroundColor: 'rgba(224,82,82,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(224,82,82,0.2)',
    borderRadius: 12,
    padding: 14,
  },
  policyTitle: {
    color: C.red,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 4,
  },
  policyText: {
    color: C.gray,
    fontSize: 12,
    lineHeight: 18,
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
    marginBottom: 14,
  },
  bottomLabel: {
    color: C.gray,
    fontSize: 12,
  },
  bottomTotal: {
    color: C.gold,
    fontWeight: '800',
    fontSize: 22,
  },
  bottomRight: {
    alignItems: 'flex-end',
  },
  bottomTime: {
    color: C.white,
    fontWeight: '700',
    fontSize: 13,
    marginTop: 2,
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: 'rgba(224,82,82,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(224,82,82,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: C.red,
    fontWeight: '700',
    fontSize: 14,
  },
  // Success screen styles
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  successEmoji: {
    color: 'white',
    fontSize: 46,
    fontWeight: '800',
  },
  successTitle: {
    color: C.white,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  successSubtitle: {
    color: C.gray,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  successHighlight: {
    color: C.white,
    fontWeight: '700',
  },
  ticket: {
    width: '100%',
    backgroundColor: C.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    marginBottom: 24,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(212,168,67,0.08)',
  },
  ticketHeaderInfo: {
    flex: 1,
  },
  ticketBarber: {
    color: C.white,
    fontWeight: '700',
    fontSize: 15,
  },
  ticketService: {
    color: C.gold,
    fontSize: 13,
    marginTop: 2,
  },
  ticketDivider: {
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: C.border,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ticketRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  ticketLabel: {
    color: C.gray,
    fontSize: 13,
  },
  ticketValue: {
    color: C.white,
    fontWeight: '600',
    fontSize: 13,
  },
  ticketPending: {
    color: C.gold,
  },
  successButtons: {
    width: '100%',
  },
});