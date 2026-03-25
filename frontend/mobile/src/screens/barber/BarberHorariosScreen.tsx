import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C } from '../../theme/colors';
import CustomInput from '../../components/CustomInput';
import GoldButton from '../../components/GoldButton';

type Period = {
  id?: number;
  barberId?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
};

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const EMPTY_PERIOD: Period = {
  dayOfWeek: 1,
  startTime: '08:00',
  endTime: '18:00',
  slotDurationMinutes: 30,
};

export default function BarberHorariosScreen({ navigation }: any) {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Period>({ ...EMPTY_PERIOD });
  // Raw string for slot duration — avoids parseInt blocking the user from clearing the field
  const [slotStr, setSlotStr] = useState('30');

  const [userId, setUserId] = useState<number | null>(null);
  const [token, setToken] = useState<string>('');

  const fetchPeriods = useCallback(async (uid: number, tok: string) => {
    try {
      const res = await fetch(
        `http://192.168.3.56:8080/api/barbers/${uid}/availability/periods`,
        { headers: { Authorization: `Bearer ${tok}` } }
      );
      const data = await res.json();
      setPeriods(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching periods:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const userJson = await AsyncStorage.getItem('user');
      const tok = await AsyncStorage.getItem('token');
      if (!userJson || !tok) return;
      const u = JSON.parse(userJson);
      setUserId(u.id);
      setToken(tok);
      fetchPeriods(u.id, tok);
    })();
  }, []);

  const openNew = () => {
    setEditing({ ...EMPTY_PERIOD });
    setSlotStr('30');
    setModalVisible(true);
  };

  // Validates time format HH:MM
  const isValidTime = (t: string) => /^\d{2}:\d{2}$/.test(t);

  const handleSave = async () => {
    if (!isValidTime(editing.startTime) || !isValidTime(editing.endTime)) {
      Alert.alert('Atenção', 'Use o formato HH:MM para os horários (ex: 08:00).');
      return;
    }
    const slotMinutes = parseInt(slotStr);
    if (!slotMinutes || slotMinutes <= 0) {
      Alert.alert('Atenção', 'Informe uma duração de slot válida (minutos).');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(
        `http://192.168.3.56:8080/api/barbers/${userId}/availability/periods`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...editing, slotDurationMinutes: slotMinutes }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        Alert.alert('Erro', err.message || 'Horário inválido ou conflito.');
        return;
      }

      setModalVisible(false);
      fetchPeriods(userId!, token);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível salvar o período.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (period: Period) => {
    Alert.alert(
      'Remover período',
      `Remover ${WEEKDAYS[period.dayOfWeek]} — ${period.startTime} às ${period.endTime}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(
                `http://192.168.3.56:8080/api/barbers/${userId}/availability/periods/${period.id}`,
                { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
              );
              fetchPeriods(userId!, token);
            } catch {
              Alert.alert('Erro', 'Não foi possível remover o período.');
            }
          },
        },
      ]
    );
  };

  // Group periods by day for display
  const grouped: Record<number, Period[]> = {};
  periods.forEach((p) => {
    if (!grouped[p.dayOfWeek]) grouped[p.dayOfWeek] = [];
    grouped[p.dayOfWeek].push(p);
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Horários</Text>
          <Text style={styles.subtitle}>Seus períodos de atendimento</Text>
        </View>
        <TouchableOpacity onPress={openNew} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={C.gold} style={{ marginTop: 48 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {/* Info card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              💡 Cada período define um bloco de horários para um dia da semana. Você pode ter múltiplos períodos por dia (ex: manhã + tarde).
            </Text>
          </View>

          {periods.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🕐</Text>
              <Text style={styles.emptyTitle}>Nenhum horário cadastrado</Text>
              <Text style={styles.emptySubtitle}>Toque em "+ Novo" para definir seus horários de atendimento.</Text>
            </View>
          ) : (
            [0, 1, 2, 3, 4, 5, 6].map((day) => {
              const dayPeriods = grouped[day];
              if (!dayPeriods) return null;
              return (
                <View key={day} style={styles.daySection}>
                  <Text style={styles.dayLabel}>{WEEKDAYS[day]}</Text>
                  {dayPeriods.map((p) => (
                    <View key={p.id} style={styles.periodCard}>
                      <View style={styles.periodTime}>
                        <Text style={styles.periodTimeText}>{p.startTime}</Text>
                        <Text style={styles.periodTimeSep}>→</Text>
                        <Text style={styles.periodTimeText}>{p.endTime}</Text>
                      </View>
                      <View style={styles.periodSlot}>
                        <Text style={styles.periodSlotText}>Slot: {p.slotDurationMinutes}min</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDelete(p)}
                      >
                        <Text style={styles.deleteBtnText}>🗑</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              );
            })
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      {/* Add Period Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Novo Período</Text>

            {/* Day of week selector */}
            <Text style={styles.fieldLabel}>Dia da semana</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daySelector}
            >
              {WEEKDAYS.map((d, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setEditing((e) => ({ ...e, dayOfWeek: i }))}
                  style={[
                    styles.dayChip,
                    editing.dayOfWeek === i && styles.dayChipActive,
                  ]}
                >
                  <Text style={[
                    styles.dayChipText,
                    editing.dayOfWeek === i && styles.dayChipTextActive,
                  ]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <CustomInput
              placeholder="Hora início (ex: 08:00)"
              icon="🕐"
              value={editing.startTime}
              onChangeText={(v) => setEditing((e) => ({ ...e, startTime: v }))}
              keyboardType="numbers-and-punctuation"
            />
            <CustomInput
              placeholder="Hora fim (ex: 18:00)"
              icon="🕔"
              value={editing.endTime}
              onChangeText={(v) => setEditing((e) => ({ ...e, endTime: v }))}
              keyboardType="numbers-and-punctuation"
            />
            <CustomInput
              placeholder="Duração de cada slot em min (ex: 30)"
              icon="⏱"
              value={slotStr}
              onChangeText={setSlotStr}
              keyboardType="numeric"
            />

            <GoldButton label="Salvar Período" onPress={handleSave} loading={saving} />
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.cancelLink}
            >
              <Text style={styles.cancelLinkText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backText: { color: C.gold, fontSize: 18 },
  title: { color: C.white, fontSize: 20, fontWeight: '800' },
  subtitle: { color: C.gray, fontSize: 12, marginTop: 2 },
  addButton: {
    backgroundColor: C.gold, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  addButtonText: { color: '#0A0A0A', fontWeight: '800', fontSize: 13 },
  list: { padding: 20 },
  infoCard: {
    backgroundColor: C.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: C.border, marginBottom: 20,
  },
  infoText: { color: C.gray, fontSize: 12, lineHeight: 18 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 52, marginBottom: 16, opacity: 0.4 },
  emptyTitle: { color: C.white, fontSize: 17, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { color: C.gray, fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  daySection: { marginBottom: 20 },
  dayLabel: {
    color: C.gray, fontSize: 11, fontWeight: '700',
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8,
  },
  periodCard: {
    backgroundColor: C.card, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    padding: 12, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  periodTime: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  periodTimeText: { color: C.white, fontWeight: '700', fontSize: 15 },
  periodTimeSep: { color: C.gray, fontSize: 13 },
  periodSlot: {
    backgroundColor: C.goldDim, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(212,168,67,0.3)',
  },
  periodSlotText: { color: C.gold, fontSize: 11, fontWeight: '700' },
  deleteBtn: {
    backgroundColor: 'rgba(224,82,82,0.1)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(224,82,82,0.3)',
  },
  deleteBtnText: { fontSize: 14 },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    borderTopWidth: 1, borderColor: C.border,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: C.grayDim,
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { color: C.white, fontSize: 18, fontWeight: '800', marginBottom: 16 },
  fieldLabel: {
    color: C.gray, fontSize: 11, fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10,
  },
  daySelector: { gap: 8, marginBottom: 16 },
  dayChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: C.card, borderRadius: 20,
    borderWidth: 1, borderColor: C.border,
  },
  dayChipActive: { backgroundColor: C.gold, borderColor: C.gold },
  dayChipText: { color: C.gray, fontWeight: '600', fontSize: 13 },
  dayChipTextActive: { color: '#0A0A0A', fontWeight: '800' },
  cancelLink: { alignItems: 'center', marginTop: 12 },
  cancelLinkText: { color: C.gray, fontSize: 14 },
});
