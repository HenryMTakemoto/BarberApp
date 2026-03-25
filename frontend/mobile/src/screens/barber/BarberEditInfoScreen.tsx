import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C } from '../../theme/colors';
import CustomInput from '../../components/CustomInput';
import GoldButton from '../../components/GoldButton';

type Props = {
  navigation: any;
  route: { params?: { section?: 'bio' | 'address' } };
};

export default function BarberEditInfoScreen({ navigation, route }: Props) {
  const initialSection = route?.params?.section || 'bio';

  const [activeSection, setActiveSection] = useState<'bio' | 'address' | 'specialties'>(initialSection as any);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Specialties
  const [masterSpecialties, setMasterSpecialties] = useState<{ id: number; name: string }[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<number[]>([]);

  // Bio
  const [bio, setBio] = useState('');

  // Address
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const [userId, setUserId] = useState<number | null>(null);
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    (async () => {
      const userJson = await AsyncStorage.getItem('user');
      const tok = await AsyncStorage.getItem('token');
      if (!userJson || !tok) return;
      const u = JSON.parse(userJson);
      setUserId(u.id);
      setToken(tok);

      // Pre-fill fields from stored user
      setBio(u.bio || '');
      if (u.address) {
        setStreet(u.address.street || '');
        setNumber(u.address.number || '');
        setCity(u.address.city || '');
        setState(u.address.state || '');
        setZipCode(u.address.zipCode || '');
        setLatitude(u.address.latitude ? String(u.address.latitude) : '');
        setLongitude(u.address.longitude ? String(u.address.longitude) : '');
      }
      // Config specialties
      if (u.specialties && Array.isArray(u.specialties)) {
        setSelectedSpecialties(u.specialties.map((s: any) => s.id));
      }

      // Fetch master specialties
      try {
        const specsRes = await fetch('http://192.168.3.56:8080/api/specialties');
        if (specsRes.ok) {
          const specsData = await specsRes.json();
          setMasterSpecialties(specsData);
        }
      } catch (e) {
        console.log('Error fetching specialties', e);
      }

      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    if (activeSection === 'address' && (!street || !city || !state)) {
      Alert.alert('Atenção', 'Rua, cidade e estado são obrigatórios.');
      return;
    }

    try {
      setSaving(true);

      const body: any = {};

      if (activeSection === 'bio') {
        body.bio = bio;
      } else if (activeSection === 'address') {
        body.address = {
          street: street || null,
          number: number || null,
          city: city || null,
          state: state || null,
          zipCode: zipCode || null,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
        };
      } else if (activeSection === 'specialties') {
        body.specialtyIds = selectedSpecialties;
      }

      const res = await fetch(`http://192.168.3.56:8080/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        Alert.alert('Erro', err.message || 'Não foi possível salvar.');
        return;
      }

      const updated = await res.json();
      await AsyncStorage.setItem('user', JSON.stringify(updated));

      Alert.alert('✓ Salvo', 'Suas informações foram atualizadas.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={C.gold} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Editar Perfil</Text>
          <Text style={styles.subtitle}>Perfil e estabelecimento</Text>
        </View>
      </View>

      {/* Tab selector */}
      <View style={styles.tabs}>
        {(['bio', 'specialties', 'address'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeSection === tab && styles.tabActive]}
            onPress={() => setActiveSection(tab)}
          >
            <Text style={[styles.tabText, activeSection === tab && styles.tabTextActive]}>
              {tab === 'bio' ? '📝 Bio' : tab === 'specialties' ? '✂️ Esp.' : '📍 Endereço'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {activeSection === 'bio' ? (
            <>
              <Text style={styles.sectionLabel}>Sobre você</Text>
              <CustomInput
                placeholder="Conte sua experiência, especialidades e estilo..."
                icon="📝"
                value={bio}
                onChangeText={setBio}
                multiline
              />
              <View style={styles.tipCard}>
                <Text style={styles.tipText}>
                  💡 Uma bio bem escrita aumenta sua visibilidade no Radar e passa mais confiança para os clientes.
                </Text>
              </View>
            </>
          ) : activeSection === 'specialties' ? (
            <>
              <Text style={styles.sectionLabel}>Suas especialidades</Text>
              <View style={styles.tipCard}>
                <Text style={styles.tipText}>
                  💡 Selecione quais os tipos de cortes e estilos você domina. O Radar usa isso para cruzar você com os clientes certos!
                </Text>
              </View>
              <View style={styles.specsGrid}>
                {masterSpecialties.map((spec) => {
                  const isSelected = selectedSpecialties.includes(spec.id);
                  return (
                    <TouchableOpacity
                      key={spec.id}
                      style={[styles.specChip, isSelected && styles.specChipActive]}
                      onPress={() => {
                        setSelectedSpecialties((prev) =>
                          isSelected ? prev.filter((id) => id !== spec.id) : [...prev, spec.id]
                        );
                      }}
                    >
                      <Text style={[styles.specText, isSelected && styles.specTextActive]}>
                        {spec.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : (
            <>
              <Text style={styles.sectionLabel}>Endereço do estabelecimento</Text>
              <CustomInput placeholder="Rua" icon="📍" value={street} onChangeText={setStreet} />
              <CustomInput
                placeholder="Número"
                icon="🔢"
                value={number}
                onChangeText={setNumber}
                keyboardType="numeric"
              />
              <CustomInput placeholder="Cidade" icon="🏙️" value={city} onChangeText={setCity} />
              <CustomInput
                placeholder="Estado (ex: SP)"
                icon="🗺️"
                value={state}
                onChangeText={setState}
                autoCapitalize="characters"
              />
              <CustomInput
                placeholder="CEP"
                icon="📮"
                value={zipCode}
                onChangeText={setZipCode}
                keyboardType="numeric"
              />

              <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Coordenadas para o Radar</Text>
              <View style={styles.tipCard}>
                <Text style={styles.tipText}>
                  💡 Acesse maps.google.com, clique no seu endereço e copie as coordenadas para aparecer no Radar.
                </Text>
              </View>
              <CustomInput
                placeholder="Latitude (ex: -23.5505)"
                icon="🌐"
                value={latitude}
                onChangeText={setLatitude}
                keyboardType="numbers-and-punctuation"
              />
              <CustomInput
                placeholder="Longitude (ex: -46.6333)"
                icon="🌐"
                value={longitude}
                onChangeText={setLongitude}
                keyboardType="numbers-and-punctuation"
              />
            </>
          )}

          <GoldButton label="Salvar alterações ✓" onPress={handleSave} loading={saving} />
          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  loadingContainer: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
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
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20, paddingVertical: 12,
    gap: 10, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 12,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: C.goldDim, borderColor: 'rgba(212,168,67,0.5)' },
  tabText: { color: C.gray, fontWeight: '700', fontSize: 13 },
  tabTextActive: { color: C.gold },
  scroll: { padding: 20 },
  sectionLabel: {
    color: C.gray, fontSize: 11, letterSpacing: 1.2,
    textTransform: 'uppercase', marginBottom: 12, fontWeight: '700',
  },
  tipCard: {
    backgroundColor: C.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: C.border, marginBottom: 16,
  },
  tipText: { color: C.gray, fontSize: 12, lineHeight: 18 },
  specsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  specChip: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20, backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border,
  },
  specChipActive: { backgroundColor: C.gold, borderColor: C.gold },
  specText: { color: C.gray, fontWeight: '600', fontSize: 13 },
  specTextActive: { color: '#0A0A0A', fontWeight: '800' },
});
