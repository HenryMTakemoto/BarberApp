import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { RootStackParamList } from '../navigation';
import { C } from '../theme/colors';
import BarberCard from '../components/BarberCard';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Explore'>;
};

const DEFAULT_LAT = -23.5505;
const DEFAULT_LNG = -46.6333;

const RADIUS_OPTIONS = [
  { label: '2 km', value: 2 },
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '25 km', value: 25 },
  { label: '50 km', value: 50 },
];

// QUICK_FILTERS is now dynamically fetched

export default function ExploreScreen({ navigation }: Props) {
  const [barbers, setBarbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [dynamicFilters, setDynamicFilters] = useState<string[]>([]);
  const [radius, setRadius] = useState(10);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userLat, setUserLat] = useState(DEFAULT_LAT);
  const [userLng, setUserLng] = useState(DEFAULT_LNG);
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  const [aiRecommendation, setAiRecommendation] = useState<{ recommendedBarberId: number | null, reason: string } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const mapRef = useRef<MapView>(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia 👋';
    if (hour < 18) return 'Boa tarde 👋';
    return 'Boa noite 👋';
  };

  // Request location once on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setUserLat(loc.coords.latitude);
          setUserLng(loc.coords.longitude);
          setLocationGranted(true);
        } catch {
          setLocationGranted(true); // fallback to SP but marked as granted to proceed
        }
      } else {
        setLocationGranted(false);
        Alert.alert(
          'Localização',
          'Permissão negada. Usando São Paulo como localização padrão.',
          [{ text: 'OK' }]
        );
      }

      // Fetch dynamic specialties filters
      try {
        const specsRes = await fetch('http://192.168.3.56:8080/api/specialties');
        if (specsRes.ok) {
          const specsData = await specsRes.json();
          const filterNames = specsData.map((s: any) => s.name);
          setDynamicFilters(filterNames);
        }
      } catch (err) {
        console.log('Error fetching filters:', err);
      }
    })();
  }, []);

  const fetchBarbers = useCallback(
    async (specialty?: string | null, rad?: number, lat?: number, lng?: number) => {
      try {
        const usedRadius = rad ?? radius;
        const usedLat = lat ?? userLat;
        const usedLng = lng ?? userLng;
        let url = `http://192.168.3.56:8080/api/users/nearby-barbers?lat=${usedLat}&lng=${usedLng}&radius=${usedRadius}`;
        if (specialty) url += `&specialty=${encodeURIComponent(specialty)}`;

        const response = await fetch(url);
        const data = await response.json();
        setBarbers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching barbers:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [radius, userLat, userLng]
  );

  const fetchAiRecommendation = useCallback(async () => {
    try {
      setLoadingAi(true);
      const userJson = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      if (!userJson || !token) return;
      const u = JSON.parse(userJson);

      const response = await fetch(
        `http://192.168.3.56:8080/api/ai/clients/${u.id}/recommendation?lat=${userLat}&lng=${userLng}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      setAiRecommendation(data);
    } catch (error) {
      console.error('Error fetching AI recommendation:', error);
    } finally {
      setLoadingAi(false);
    }
  }, [userLat, userLng]);

  // Re-fetch when location is resolved or radius/specialty changes
  useEffect(() => {
    if (locationGranted !== null) {
      setLoading(true);
      fetchBarbers(activeFilter, radius, userLat, userLng);
    }
  }, [activeFilter, radius, userLat, userLng, locationGranted]);

  useEffect(() => {
    if (locationGranted !== null) {
      fetchAiRecommendation();
    }
  }, [locationGranted, fetchAiRecommendation]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBarbers(activeFilter);
  };

  const handleRadiusChange = (r: number) => {
    setRadius(r);
    setLoading(true);
  };

  const handleFilter = (filter: string) => {
    const next = activeFilter === filter ? null : filter;
    setActiveFilter(next);
    setLoading(true);
  };

  const filtered = barbers.filter((b) => {
    if (!search) return true;
    return (
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.specialties?.some((s: string) =>
        s.toLowerCase().includes(search.toLowerCase())
      )
    );
  });

  // Center map on user location
  const handleCenterMap = () => {
    mapRef.current?.animateToRegion({
      latitude: userLat,
      longitude: userLng,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }, 500);
  };

  const SkeletonCard = () => (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonCover} />
      <View style={styles.skeletonBody}>
        <View style={styles.skeletonRow}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonLines}>
            <View style={[styles.skeletonLine, { width: '60%' }]} />
            <View style={[styles.skeletonLine, { width: '40%', marginTop: 6 }]} />
          </View>
        </View>
      </View>
    </View>
  );

  const renderAiCard = () => {
    if (loadingAi) {
      return (
        <View style={styles.aiCard}>
          <ActivityIndicator color={C.gold} size="small" />
          <Text style={styles.aiLoadingText}>Analisando seu perfil com IA...</Text>
        </View>
      );
    }
    if (!aiRecommendation) return null;

    const recommendedBarber = aiRecommendation.recommendedBarberId
      ? barbers.find(b => b.id === aiRecommendation.recommendedBarberId)
      : null;

    return (
      <View style={styles.aiCard}>
        <View style={styles.aiHeader}>
          <Text style={styles.aiTitle}>🤖 Escolha Ideal para Você</Text>
        </View>
        <Text style={styles.aiReason}>{aiRecommendation.reason}</Text>
        {recommendedBarber ? (
          <TouchableOpacity
            style={styles.aiBarberBtn}
            onPress={() => navigation.navigate('BarberProfile', { barber: recommendedBarber })}
          >
            <Text style={styles.aiBarberBtnText}>Agendar com {recommendedBarber.name} →</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.title}>Encontre seu barbeiro</Text>
          </View>
          {/* List / Map toggle */}
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
              onPress={() => setViewMode('list')}
            >
              <Text style={[styles.toggleBtnText, viewMode === 'list' && styles.toggleBtnTextActive]}>
                ☰
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
              onPress={() => setViewMode('map')}
            >
              <Text style={[styles.toggleBtnText, viewMode === 'map' && styles.toggleBtnTextActive]}>
                🗺
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Location status */}
        {locationGranted === false && (
          <View style={styles.locationWarning}>
            <Text style={styles.locationWarningText}>
              📍 Localização não disponível — usando São Paulo como padrão
            </Text>
          </View>
        )}

        {/* Search bar */}
        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Buscar barbeiro ou serviço..."
            placeholderTextColor={C.gray}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Radius filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          <Text style={styles.filterLabel}>📍</Text>
          {RADIUS_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => handleRadiusChange(opt.value)}
              style={[styles.filterChip, radius === opt.value && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, radius === opt.value && styles.filterChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Specialty quick filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          <TouchableOpacity
            onPress={() => setActiveFilter(null)}
            style={[styles.filterChip, !activeFilter && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, !activeFilter && styles.filterChipTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>
          {dynamicFilters.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => handleFilter(f)}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Result count */}
        {!loading && (
          <Text style={styles.resultCount}>
            {filtered.length} barbeiro{filtered.length !== 1 ? 's' : ''} em {radius} km
          </Text>
        )}
      </View>

      {/* ── MAP VIEW ── */}
      {viewMode === 'map' ? (
        <View style={{ flex: 1 }}>
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            provider={PROVIDER_DEFAULT}
            initialRegion={{
              latitude: userLat,
              longitude: userLng,
              latitudeDelta: radius < 5 ? 0.04 : radius < 15 ? 0.15 : 0.5,
              longitudeDelta: radius < 5 ? 0.04 : radius < 15 ? 0.15 : 0.5,
            }}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {/* User location pulse — handled by showsUserLocation */}
            {filtered.map((barber) =>
              barber.address?.latitude && barber.address?.longitude ? (
                <Marker
                  key={barber.id}
                  coordinate={{
                    latitude: barber.address.latitude,
                    longitude: barber.address.longitude,
                  }}
                  pinColor={C.gold}
                  onPress={() => navigation.navigate('BarberProfile', { barber })}
                  onCalloutPress={() => navigation.navigate('BarberProfile', { barber })}
                >
                  <Callout tooltip onPress={() => navigation.navigate('BarberProfile', { barber })}>
                    <View style={styles.callout}>
                      <Text style={styles.calloutName}>{barber.name}</Text>
                      <Text style={styles.calloutRating}>
                        ★ {barber.rating?.toFixed(1) || '—'} · {barber.distanceKm ?? '?'} km
                      </Text>
                      {barber.specialties?.length > 0 && (
                        <Text style={styles.calloutSpec} numberOfLines={1}>
                          {barber.specialties.slice(0, 2).join(' · ')}
                        </Text>
                      )}
                      <View style={styles.calloutBtn}>
                        <Text style={styles.calloutBtnText}>Ver perfil →</Text>
                      </View>
                    </View>
                  </Callout>
                </Marker>
              ) : null
            )}
          </MapView>

          {/* Center button */}
          <TouchableOpacity style={styles.centerBtn} onPress={handleCenterMap}>
            <Text style={styles.centerBtnText}>📍</Text>
          </TouchableOpacity>

          {/* Loading overlay on map */}
          {loading && (
            <View style={styles.mapLoadingOverlay}>
              <ActivityIndicator color={C.gold} size="large" />
            </View>
          )}
        </View>
      ) : (
        /* ── LIST VIEW ── */
        loading ? (
          <View style={styles.listContent}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : filtered.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={C.gold}
              />
            }
          >
            {renderAiCard()}
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>✂️</Text>
              <Text style={styles.emptyTitle}>
                {search ? 'Nenhum resultado' : 'Sem barbeiros por aqui'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {search
                  ? `Nenhum barbeiro para "${search}"`
                  : `Tente aumentar o raio de busca (atual: ${radius} km)`}
              </Text>
              {search ? (
                <TouchableOpacity onPress={() => setSearch('')} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>Limpar busca</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => handleRadiusChange(50)}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>Ampliar para 50 km</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={renderAiCard}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={C.gold}
              />
            }
            renderItem={({ item }) => (
              <BarberCard
                barber={item}
                onPress={() => navigation.navigate('BarberProfile', { barber: item })}
              />
            )}
          />
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.bg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  greeting: { color: C.gray, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: C.white, fontSize: 22, fontWeight: '800' },
  // View toggle
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  toggleBtnActive: { backgroundColor: C.gold },
  toggleBtnText: { fontSize: 16, color: C.gray },
  toggleBtnTextActive: { color: '#0A0A0A' },
  // Location warning
  locationWarning: {
    backgroundColor: 'rgba(212,168,67,0.1)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.3)',
  },
  locationWarningText: { color: C.gold, fontSize: 11 },
  // Search
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: C.white, fontSize: 14, paddingVertical: 12 },
  searchClear: { color: C.gray, fontSize: 16, paddingLeft: 8 },
  // Filters
  filterLabel: { fontSize: 14, marginRight: 4, alignSelf: 'center' },
  filtersRow: { flexDirection: 'row', gap: 8, marginBottom: 8, paddingRight: 20 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  filterChipActive: { backgroundColor: C.gold, borderColor: C.gold },
  filterChipText: { color: C.gray, fontSize: 12, fontWeight: '600' },
  filterChipTextActive: { color: '#0A0A0A', fontWeight: '700' },
  resultCount: { color: C.gold, fontSize: 12, fontWeight: '600', marginTop: 2 },
  // List
  listContent: { padding: 20, paddingBottom: 100 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyEmoji: { fontSize: 64, marginBottom: 20, opacity: 0.5 },
  emptyTitle: { color: C.white, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: {
    color: C.gray, fontSize: 14, textAlign: 'center',
    lineHeight: 22, marginBottom: 24,
  },
  clearButton: {
    backgroundColor: C.goldDim, borderRadius: 20,
    paddingHorizontal: 24, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(212,168,67,0.4)',
  },
  clearButtonText: { color: C.gold, fontWeight: '700', fontSize: 14 },
  // Skeleton
  skeletonCard: {
    backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden', marginBottom: 14,
  },
  skeletonCover: { height: 100, backgroundColor: C.grayDim },
  skeletonBody: { padding: 16, paddingTop: 28 },
  skeletonRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  skeletonAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.grayDim },
  skeletonLines: { flex: 1 },
  skeletonLine: { height: 14, backgroundColor: C.grayDim, borderRadius: 7 },
  // Map
  callout: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    minWidth: 180,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  calloutName: { color: C.white, fontWeight: '800', fontSize: 15, marginBottom: 4 },
  calloutRating: { color: C.gold, fontSize: 12, fontWeight: '600', marginBottom: 4 },
  calloutSpec: { color: C.gray, fontSize: 11, marginBottom: 10 },
  calloutBtn: {
    backgroundColor: C.gold,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  calloutBtnText: { color: '#0A0A0A', fontWeight: '800', fontSize: 12 },
  centerBtn: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  centerBtnText: { fontSize: 20 },
  mapLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,10,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // AI Card
  aiCard: {
    backgroundColor: 'rgba(212,168,67,0.08)',
    borderRadius: 16, padding: 20, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(212,168,67,0.3)',
    alignItems: 'flex-start',
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  aiTitle: { color: C.gold, fontSize: 16, fontWeight: '800' },
  aiReason: { color: C.gray, fontSize: 13, lineHeight: 20, marginBottom: 16 },
  aiLoadingText: { color: C.gold, fontSize: 13, marginTop: 12, fontWeight: '600' },
  aiBarberBtn: { backgroundColor: C.gold, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  aiBarberBtnText: { color: '#0A0A0A', fontSize: 13, fontWeight: '700' },
});