import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { C } from '../theme/colors';
import BarberCard from '../components/BarberCard';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Explore'>;
};

const DEFAULT_LAT = -23.5505;
const DEFAULT_LNG = -46.6333;
const DEFAULT_RADIUS = 10;

const QUICK_FILTERS = ['Degradê', 'Barba', 'Afro', 'Navalhado', 'Tranças'];

export default function ExploreScreen({ navigation }: Props) {
  const [barbers, setBarbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Dynamic greeting based on current device hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia 👋';
    if (hour < 18) return 'Boa tarde 👋';
    return 'Boa noite 👋';
  };

  // Fetch barbers from backend
  const fetchBarbers = useCallback(async (specialty?: string | null) => {
    try {
      let url = `http://192.168.3.56:8080/api/users/nearby-barbers?lat=${DEFAULT_LAT}&lng=${DEFAULT_LNG}&radius=${DEFAULT_RADIUS}`;

      if (specialty) {
        url += `&specialty=${encodeURIComponent(specialty)}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setBarbers(data);
    } catch (error) {
      console.error('Error fetching barbers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBarbers(activeFilter);
  }, [activeFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBarbers(activeFilter);
  };

  const filtered = barbers.filter((b) => {
    const matchSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.specialties?.some((s: string) =>
        s.toLowerCase().includes(search.toLowerCase())
      );
    return matchSearch;
  });

  const handleFilter = (filter: string) => {
    const next = activeFilter === filter ? null : filter;
    setActiveFilter(next);
    setLoading(true);
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            {/* Dynamic greeting — changes based on device time */}
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.title}>Encontre seu barbeiro</Text>
          </View>
        </View>

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

        {/* Quick filters */}
        <View style={styles.filtersRow}>
          <TouchableOpacity
            onPress={() => setActiveFilter(null)}
            style={[styles.filterChip, !activeFilter && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, !activeFilter && styles.filterChipTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>

          {QUICK_FILTERS.map((f) => (
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
        </View>

        {/* Result count */}
        {!loading && (
          <Text style={styles.resultCount}>
            {filtered.length} barbeiros encontrados
          </Text>
        )}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.listContent}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>✂️</Text>
          <Text style={styles.emptyTitle}>
            {search ? 'Nenhum resultado' : 'Sem barbeiros por aqui'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {search
              ? `Nenhum barbeiro para "${search}"`
              : 'Expanda o raio de busca'}
          </Text>
          {search && (
            <TouchableOpacity onPress={() => setSearch('')} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Limpar busca</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
  greeting: {
    color: C.gray,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: C.white,
    fontSize: 22,
    fontWeight: '800',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: C.white,
    fontSize: 14,
    paddingVertical: 12,
  },
  searchClear: {
    color: C.gray,
    fontSize: 16,
    paddingLeft: 8,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'nowrap',
    overflow: 'hidden',
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  filterChipActive: {
    backgroundColor: C.gold,
    borderColor: C.gold,
  },
  filterChipText: {
    color: C.gray,
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#0A0A0A',
  },
  resultCount: {
    color: C.gold,
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  skeletonCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    marginBottom: 14,
  },
  skeletonCover: {
    height: 100,
    backgroundColor: C.grayDim,
  },
  skeletonBody: {
    padding: 16,
    paddingTop: 28,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  skeletonAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.grayDim,
  },
  skeletonLines: {
    flex: 1,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: C.grayDim,
    borderRadius: 7,
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
  clearButton: {
    backgroundColor: C.goldDim,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.4)',
  },
  clearButtonText: {
    color: C.gold,
    fontWeight: '700',
    fontSize: 14,
  },
});