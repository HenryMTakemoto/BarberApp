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
import { C } from '../theme/colors';
import GoldButton from '../components/GoldButton';
import CustomInput from '../components/CustomInput';
import apiRequest from '../services/api';

type Props = {
  navigation: any;
};

type Specialty = {
  id: number;
  name: string;
  description: string;
};

export default function BarberSetupScreen({ navigation }: Props) {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bio, setBio] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSpecialties, setLoadingSpecialties] = useState(true);

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const response = await apiRequest('/specialties');
        const data = await response.json();
        setSpecialties(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching specialties:', error);
      } finally {
        setLoadingSpecialties(false);
      }
    };
    fetchSpecialties();
  }, []);

  const toggleSpecialty = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      Alert.alert('Atenção', 'Selecione ao menos uma especialidade.');
      return;
    }
    if (!street || !city || !state) {
      Alert.alert('Atenção', 'Preencha rua, cidade e estado.');
      return;
    }
    if (!latitude || !longitude) {
      Alert.alert('Atenção', 'Preencha latitude e longitude para aparecer no Radar.');
      return;
    }

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('token');
      const userJson = await AsyncStorage.getItem('user');

      if (!token || !userJson) {
        navigation.replace('Login');
        return;
      }

      const user = JSON.parse(userJson);

      const response = await apiRequest(
        `/users/${user.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bio: bio || null,
            specialtyIds: selectedIds,
            address: {
              street,
              number: number || null,
              city,
              state,
              zipCode: zipCode || null,
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Erro', data.message || 'Erro ao salvar perfil.');
        return;
      }

      await AsyncStorage.setItem('user', JSON.stringify(data));

      Alert.alert(
        'Perfil ativado! ✓',
        'Seu perfil profissional foi criado. Você agora aparece no Radar dos clientes!',
        [{ text: 'Começar', onPress: () => navigation.replace('MainTabs') }]
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Perfil Profissional</Text>
          <Text style={styles.subtitle}>Complete para aparecer no Radar</Text>
        </View>
      </View>

      {/* KeyboardAvoidingView pushes content up when keyboard opens */}
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
          {/* Bio */}
          <Text style={styles.sectionLabel}>Sobre você</Text>
          <CustomInput
            placeholder="Sua bio — conte sua experiência..."
            icon="📝"
            value={bio}
            onChangeText={setBio}
            multiline
          />

          {/* Specialties */}
          <Text style={styles.sectionLabel}>
            Especialidades ({selectedIds.length} selecionadas)
          </Text>
          {loadingSpecialties ? (
            <ActivityIndicator color={C.gold} style={{ marginBottom: 20 }} />
          ) : (
            <View style={styles.specialtiesGrid}>
              {specialties.map((s) => {
                const active = selectedIds.includes(s.id);
                return (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => toggleSpecialty(s.id)}
                    style={[styles.specialtyChip, active && styles.specialtyChipActive]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.specialtyText, active && styles.specialtyTextActive]}>
                      {s.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Address */}
          <Text style={styles.sectionLabel}>Endereço do estabelecimento</Text>
          <CustomInput
            placeholder="Rua"
            icon="📍"
            value={street}
            onChangeText={setStreet}
          />
          <CustomInput
            placeholder="Número"
            icon="🔢"
            value={number}
            onChangeText={setNumber}
            keyboardType="numeric"
          />
          <CustomInput
            placeholder="Cidade"
            icon="🏙️"
            value={city}
            onChangeText={setCity}
          />
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

          {/* Coordinates */}
          <Text style={styles.sectionLabel}>Coordenadas para o Radar</Text>
          <View style={styles.coordinatesHintCard}>
            <Text style={styles.coordinatesHint}>
              💡 Acesse maps.google.com, clique no seu endereço e copie as coordenadas.
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

          {/* Info card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              ✓ Ao salvar, sua conta será promovida para{' '}
              <Text style={styles.infoHighlight}>BARBER</Text> e você começará
              a aparecer no Radar dos clientes.
            </Text>
          </View>

          <GoldButton
            label="Salvar e Ativar Perfil ✓"
            onPress={handleSave}
            loading={loading}
          />

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  scroll: {
    padding: 20,
  },
  sectionLabel: {
    color: C.gray,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 8,
  },
  specialtiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  specialtyChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  specialtyChipActive: {
    backgroundColor: C.gold,
    borderColor: C.gold,
  },
  specialtyText: {
    color: C.gray,
    fontSize: 13,
    fontWeight: '600',
  },
  specialtyTextActive: {
    color: '#0A0A0A',
    fontWeight: '700',
  },
  coordinatesHintCard: {
    marginBottom: 12,
  },
  coordinatesHint: {
    color: C.gray,
    fontSize: 12,
    lineHeight: 18,
    backgroundColor: C.card,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  infoCard: {
    backgroundColor: C.goldDim,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.3)',
    marginBottom: 20,
    marginTop: 8,
  },
  infoText: {
    color: '#A88A40',
    fontSize: 13,
    lineHeight: 20,
  },
  infoHighlight: {
    color: C.gold,
    fontWeight: '700',
  },
});
