import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C } from '../../theme/colors';

type ViewMode = 'annual' | 'monthly' | 'weekly';

export default function BarberGanhosScreen({ navigation }: any) {
  const [user, setUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('annual');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const MONTHS_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const fetchAppointments = useCallback(async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      if (!userJson || !token) return;
      const u = JSON.parse(userJson);
      setUser(u);

      // GET /api/appointments/barber/{id} — all appointments
      const response = await fetch(
        `http://192.168.3.56:8080/api/appointments/barber/${u.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      // Only count COMPLETED appointments for earnings
      const completed = Array.isArray(data)
        ? data.filter((a: any) => a.status === 'COMPLETED')
        : [];
      setAppointments(completed);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAppointments(); }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchAppointments);
    return unsubscribe;
  }, [navigation]);

  const handleRefresh = () => { setRefreshing(true); fetchAppointments(); };

  // Group appointments by month for annual view
  const getAnnualData = () => {
    return MONTHS.map((month, i) => {
      const monthAppts = appointments.filter(a => {
        const d = new Date(a.date);
        return d.getFullYear() === selectedYear && d.getMonth() === i;
      });
      return {
        label: month,
        total: monthAppts.reduce((sum, a) => sum + (a.servicePrice || 0), 0),
        count: monthAppts.length,
        monthIndex: i,
      };
    });
  };

  // Group appointments by week for monthly view
  const getMonthlyData = () => {
    const weeks: { label: string; total: number; count: number; weekStart: Date }[] = [];
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);

    let current = new Date(firstDay);
    let weekNum = 1;

    while (current <= lastDay) {
      const weekStart = new Date(current);
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekAppts = appointments.filter(a => {
        const d = new Date(a.date);
        return d >= weekStart && d <= weekEnd &&
          d.getMonth() === selectedMonth &&
          d.getFullYear() === selectedYear;
      });

      weeks.push({
        label: `Semana ${weekNum}`,
        total: weekAppts.reduce((sum, a) => sum + (a.servicePrice || 0), 0),
        count: weekAppts.length,
        weekStart,
      });

      current.setDate(current.getDate() + 7);
      weekNum++;
    }
    return weeks;
  };

  // Group appointments by day for weekly view
  const getWeeklyData = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);

      const dayAppts = appointments.filter(a => {
        const d = new Date(a.date);
        return d.toDateString() === day.toDateString();
      });

      return {
        label: WEEKDAYS[i],
        date: day.getDate(),
        total: dayAppts.reduce((sum, a) => sum + (a.servicePrice || 0), 0),
        count: dayAppts.length,
        isToday: day.toDateString() === today.toDateString(),
      };
    });
  };

  const annualData = getAnnualData();
  const monthlyData = getMonthlyData();
  const weeklyData = getWeeklyData();

  const currentData = viewMode === 'annual' ? annualData
    : viewMode === 'monthly' ? monthlyData
      : weeklyData;

  const maxValue = Math.max(...currentData.map((d: any) => d.total), 1);
  const totalEarnings = currentData.reduce((sum: number, d: any) => sum + d.total, 0);
  const totalCount = currentData.reduce((sum: number, d: any) => sum + d.count, 0);
  const avgTicket = totalCount > 0 ? totalEarnings / totalCount : 0;

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
          <Text style={styles.title}>Ganhos</Text>

          {/* View mode selector */}
          <View style={styles.modeSelector}>
            {(['annual', 'monthly', 'weekly'] as ViewMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setViewMode(mode)}
                style={[styles.modeChip, viewMode === mode && styles.modeChipActive]}
              >
                <Text style={[styles.modeChipText, viewMode === mode && styles.modeChipTextActive]}>
                  {mode === 'annual' ? 'Anual' : mode === 'monthly' ? 'Mensal' : 'Semanal'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Period navigation */}
          {viewMode === 'annual' && (
            <View style={styles.periodNav}>
              <TouchableOpacity onPress={() => setSelectedYear(y => y - 1)} style={styles.navButton}>
                <Text style={styles.navButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.periodLabel}>{selectedYear}</Text>
              <TouchableOpacity onPress={() => setSelectedYear(y => y + 1)} style={styles.navButton}>
                <Text style={styles.navButtonText}>→</Text>
              </TouchableOpacity>
            </View>
          )}
          {viewMode === 'monthly' && (
            <View style={styles.periodNav}>
              <TouchableOpacity
                onPress={() => {
                  if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
                  else setSelectedMonth(m => m - 1);
                }}
                style={styles.navButton}
              >
                <Text style={styles.navButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.periodLabel}>{MONTHS_FULL[selectedMonth]} {selectedYear}</Text>
              <TouchableOpacity
                onPress={() => {
                  if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
                  else setSelectedMonth(m => m + 1);
                }}
                style={styles.navButton}
              >
                <Text style={styles.navButtonText}>→</Text>
              </TouchableOpacity>
            </View>
          )}
          {viewMode === 'weekly' && (
            <Text style={styles.periodLabel}>Esta semana</Text>
          )}
        </View>

        <View style={styles.content}>
          {/* Summary cards */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total do período</Text>
            <Text style={styles.summaryTotal}>R$ {totalEarnings.toFixed(2)}</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{totalCount}</Text>
                <Text style={styles.summaryStatLabel}>atendimentos</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>R$ {avgTicket.toFixed(0)}</Text>
                <Text style={styles.summaryStatLabel}>ticket médio</Text>
              </View>
            </View>
          </View>

          {/* Bar chart */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>
              {viewMode === 'annual' ? 'Por mês'
                : viewMode === 'monthly' ? 'Por semana'
                  : 'Por dia'}
            </Text>
            <View style={styles.chart}>
              {currentData.map((d: any, i: number) => {
                const height = maxValue > 0 ? Math.max((d.total / maxValue) * 80, 4) : 4;
                const isHighlight = viewMode === 'annual'
                  ? d.monthIndex === new Date().getMonth()
                  : viewMode === 'weekly' && d.isToday;

                return (
                  <TouchableOpacity
                    key={i}
                    style={styles.barWrapper}
                    onPress={() => {
                      if (viewMode === 'annual') {
                        setSelectedMonth(d.monthIndex);
                        setViewMode('monthly');
                      } else if (viewMode === 'monthly') {
                        setViewMode('weekly');
                      }
                    }}
                  >
                    {d.total > 0 && (
                      <Text style={styles.barValue}>R${d.total.toFixed(0)}</Text>
                    )}
                    <View style={[
                      styles.bar,
                      { height },
                      isHighlight ? styles.barHighlight : styles.barNormal,
                    ]} />
                    <Text style={[styles.barLabel, isHighlight && styles.barLabelHighlight]}>
                      {d.label}
                    </Text>
                    {viewMode === 'weekly' && (
                      <Text style={[styles.barDate, isHighlight && styles.barLabelHighlight]}>
                        {d.date}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            {viewMode === 'annual' && (
              <Text style={styles.chartHint}>💡 Toque em um mês para ver detalhes</Text>
            )}
            {viewMode === 'monthly' && (
              <Text style={styles.chartHint}>💡 Toque em uma semana para ver detalhes</Text>
            )}
          </View>

          {/* Breadcrumb navigation */}
          {viewMode !== 'annual' && (
            <TouchableOpacity
              style={styles.backToAnnual}
              onPress={() => setViewMode(viewMode === 'weekly' ? 'monthly' : 'annual')}
            >
              <Text style={styles.backToAnnualText}>
                ← Voltar para {viewMode === 'weekly' ? 'visão mensal' : 'visão anual'}
              </Text>
            </TouchableOpacity>
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
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  title: { color: C.white, fontSize: 26, fontWeight: '800', marginBottom: 16 },
  modeSelector: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  modeChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  modeChipActive: { backgroundColor: C.gold, borderColor: C.gold },
  modeChipText: { color: C.gray, fontSize: 13, fontWeight: '600' },
  modeChipTextActive: { color: '#0A0A0A' },
  periodNav: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  navButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  navButtonText: { color: C.gold, fontSize: 16, fontWeight: '700' },
  periodLabel: { color: C.white, fontWeight: '700', fontSize: 15, flex: 1, textAlign: 'center' },
  content: { padding: 20 },
  summaryCard: {
    backgroundColor: '#1A1300',
    borderWidth: 1, borderColor: 'rgba(212,168,67,0.3)',
    borderRadius: 20, padding: 24, marginBottom: 20, alignItems: 'center',
  },
  summaryLabel: { color: C.gray, fontSize: 13, marginBottom: 8 },
  summaryTotal: { color: C.gold, fontWeight: '900', fontSize: 36, letterSpacing: -1 },
  summaryStats: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 16 },
  summaryStat: { alignItems: 'center' },
  summaryStatValue: { color: C.white, fontWeight: '700', fontSize: 16 },
  summaryStatLabel: { color: C.gray, fontSize: 11, marginTop: 2 },
  summaryDivider: { width: 1, height: 30, backgroundColor: C.border },
  chartCard: {
    backgroundColor: C.card, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: C.border, marginBottom: 16,
  },
  chartTitle: { color: C.gray, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 110 },
  barWrapper: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  barValue: { color: C.gray, fontSize: 8, fontWeight: '600' },
  bar: { width: '100%', borderRadius: '6px 6px 0 0' as any, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  barNormal: { backgroundColor: 'rgba(212,168,67,0.25)' },
  barHighlight: { backgroundColor: C.gold },
  barLabel: { color: C.gray, fontSize: 9, fontWeight: '400' },
  barLabelHighlight: { color: C.gold, fontWeight: '700' },
  barDate: { color: C.gray, fontSize: 8 },
  chartHint: { color: C.grayDim, fontSize: 11, textAlign: 'center', marginTop: 12 },
  backToAnnual: {
    backgroundColor: C.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: C.border, alignItems: 'center',
  },
  backToAnnualText: { color: C.gold, fontSize: 13, fontWeight: '600' },
});