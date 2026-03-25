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

type Service = {
  id?: number;
  name: string;
  duration: number;
  price: number;
  barberId?: number;
};

const EMPTY_SERVICE: Service = { name: '', duration: 30, price: 0 };

export default function BarberServicesScreen({ navigation }: any) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Service>(EMPTY_SERVICE);
  const [isNew, setIsNew] = useState(true);
  // Raw strings — avoids parseInt/parseFloat blocking the user from clearing the field
  const [priceStr, setPriceStr] = useState('');
  const [durationStr, setDurationStr] = useState('');

  const [userId, setUserId] = useState<number | null>(null);
  const [token, setToken] = useState<string>('');

  const fetchServices = useCallback(async (uid: number, tok: string) => {
    try {
      const res = await fetch(
        `http://192.168.3.56:8080/api/barbers/${uid}/services`,
        { headers: { Authorization: `Bearer ${tok}` } }
      );
      const data = await res.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching services:', e);
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
      fetchServices(u.id, tok);
    })();
  }, []);

  const openNew = () => {
    setEditing({ ...EMPTY_SERVICE });
    setPriceStr('');
    setDurationStr('');
    setIsNew(true);
    setModalVisible(true);
  };

  const openEdit = (service: Service) => {
    setEditing({ ...service });
    setPriceStr(String(service.price));
    setDurationStr(String(service.duration));
    setIsNew(false);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!editing.name.trim()) {
      Alert.alert('Atenção', 'Informe o nome do serviço.');
      return;
    }
    const parsedPrice = parseFloat(priceStr);
    const parsedDuration = parseInt(durationStr);
    if (!parsedPrice || parsedPrice <= 0) {
      Alert.alert('Atenção', 'Informe um preço válido.');
      return;
    }
    if (!parsedDuration || parsedDuration <= 0) {
      Alert.alert('Atenção', 'Informe uma duração válida.');
      return;
    }

    try {
      setSaving(true);
      const url = isNew
        ? `http://192.168.3.56:8080/api/barbers/${userId}/services`
        : `http://192.168.3.56:8080/api/barbers/${userId}/services/${editing.id}`;

      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editing.name,
          duration: parsedDuration,
          price: parsedPrice,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        Alert.alert('Erro', err.message || 'Não foi possível salvar.');
        return;
      }

      setModalVisible(false);
      fetchServices(userId!, token);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (service: Service) => {
    Alert.alert(
      'Excluir serviço',
      `Tem certeza que deseja excluir "${service.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(
                `http://192.168.3.56:8080/api/barbers/${userId}/services/${service.id}`,
                {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              fetchServices(userId!, token);
            } catch (e) {
              Alert.alert('Erro', 'Não foi possível excluir o serviço.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Serviços e Preços</Text>
          <Text style={styles.subtitle}>Gerencie o que você oferece</Text>
        </View>
        <TouchableOpacity onPress={openNew} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={C.gold} style={{ marginTop: 48 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {services.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>✂️</Text>
              <Text style={styles.emptyTitle}>Nenhum serviço cadastrado</Text>
              <Text style={styles.emptySubtitle}>Toque em "+ Novo" para adicionar seu primeiro serviço.</Text>
            </View>
          ) : (
            services.map((s) => (
              <View key={s.id} style={styles.serviceCard}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{s.name}</Text>
                  <Text style={styles.serviceMeta}>⏱ {s.duration} min</Text>
                </View>
                <Text style={styles.servicePrice}>R$ {Number(s.price).toFixed(2)}</Text>
                <View style={styles.serviceActions}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => openEdit(s)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.editBtnText}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(s)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.deleteBtnText}>🗑</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      {/* Add / Edit Modal */}
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
            <Text style={styles.modalTitle}>
              {isNew ? 'Novo Serviço' : 'Editar Serviço'}
            </Text>

            <CustomInput
              placeholder="Nome do serviço (ex: Corte + Barba)"
              icon="✂️"
              value={editing.name}
              onChangeText={(v) => setEditing((e) => ({ ...e, name: v }))}
            />
            <CustomInput
              placeholder="Preço (ex: 45.00)"
              icon="💰"
              value={priceStr}
              onChangeText={setPriceStr}
              keyboardType="decimal-pad"
            />
            <CustomInput
              placeholder="Duração em minutos (ex: 30)"
              icon="⏱"
              value={durationStr}
              onChangeText={setDurationStr}
              keyboardType="numeric"
            />

            <GoldButton
              label={isNew ? 'Adicionar Serviço' : 'Salvar Alterações'}
              onPress={handleSave}
              loading={saving}
            />
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
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 52, marginBottom: 16, opacity: 0.4 },
  emptyTitle: { color: C.white, fontSize: 17, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { color: C.gray, fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  serviceCard: {
    backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  serviceInfo: { flex: 1 },
  serviceName: { color: C.white, fontWeight: '700', fontSize: 15 },
  serviceMeta: { color: C.gray, fontSize: 12, marginTop: 3 },
  servicePrice: { color: C.gold, fontWeight: '800', fontSize: 16, marginRight: 4 },
  serviceActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  editBtn: {
    backgroundColor: C.goldDim, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(212,168,67,0.3)',
  },
  editBtnText: { color: C.gold, fontSize: 12, fontWeight: '700' },
  deleteBtn: {
    backgroundColor: 'rgba(224,82,82,0.1)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(224,82,82,0.3)',
  },
  deleteBtnText: { fontSize: 14 },
  // Modal
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
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
  modalTitle: {
    color: C.white, fontSize: 18, fontWeight: '800',
    marginBottom: 20,
  },
  cancelLink: { alignItems: 'center', marginTop: 12 },
  cancelLinkText: { color: C.gray, fontSize: 14 },
});
