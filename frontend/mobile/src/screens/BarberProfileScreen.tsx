import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation';
import { C } from '../theme/colors';
import Avatar from '../components/Avatar';
import GoldButton from '../components/GoldButton';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BarberProfile'>;
  route: RouteProp<RootStackParamList, 'BarberProfile'>;
};

export default function BarberProfileScreen({ navigation, route }: Props) {
  const { barber } = route.params;
  const [services, setServices] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [tab, setTab] = useState<'services' | 'reviews'>('services');

  // Fetch barber services from backend
  // GET /api/barbers/{id}/services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(
          `http://192.168.3.56:8080/api/barbers/${barber.id}/services`
        );
        const data = await response.json();
        setServices(data);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, [barber.id]);

  // Fetch barber reviews from backend
  // GET /api/barbers/{id}/reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(
          `http://192.168.3.56:8080/api/barbers/${barber.id}/reviews`
        );
        const data = await response.json();
        setReviews(data);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [barber.id]);

  // Star rating display
  const renderStars = (rating: number) => {
    const rounded = Math.round(rating || 0);
    return '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover area with back button */}
        <View style={styles.cover}>
          <SafeAreaView>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
          </SafeAreaView>
          <View style={styles.coverGradient} />

          {/* Avatar overlapping cover */}
          <View style={styles.avatarWrapper}>
            <Avatar url={barber.avatarUrl} size={80} borderColor={C.gold} />
          </View>
        </View>

        {/* Profile info */}
        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <View>
              <Text style={styles.name}>{barber.name}</Text>
              <View style={styles.ratingRow}>
                <Text style={styles.stars}>
                  {renderStars(barber.rating || 0)}
                </Text>
                <Text style={styles.ratingText}>
                  {barber.rating?.toFixed(1) || '0.0'} · {barber.reviewCount || 0} avaliações
                </Text>
              </View>
            </View>
          </View>

          {/* Specialties */}
          {barber.specialties?.length > 0 && (
            <View style={styles.specialties}>
              {barber.specialties.map((s: string) => (
                <View key={s} style={styles.badge}>
                  <Text style={styles.badgeText}>{s}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Address */}
          {barber.address && (
            <Text style={styles.address}>
              📍 {barber.address.street}, {barber.address.city}
            </Text>
          )}
        </View>

        {/* Tabs — Services / Reviews */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === 'services' && styles.tabActive]}
            onPress={() => setTab('services')}
          >
            <Text style={[styles.tabText, tab === 'services' && styles.tabTextActive]}>
              Serviços
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'reviews' && styles.tabActive]}
            onPress={() => setTab('reviews')}
          >
            <Text style={[styles.tabText, tab === 'reviews' && styles.tabTextActive]}>
              Avaliações
            </Text>
          </TouchableOpacity>
        </View>

        {/* Services tab */}
        {tab === 'services' && (
          <View style={styles.section}>
            {loadingServices ? (
              <ActivityIndicator color={C.gold} style={{ marginTop: 24 }} />
            ) : services.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum serviço cadastrado.</Text>
            ) : (
              services.map((service) => {
                const active = selectedService?.id === service.id;
                return (
                  <TouchableOpacity
                    key={service.id}
                    onPress={() => setSelectedService(active ? null : service)}
                    activeOpacity={0.85}
                    style={[styles.serviceCard, active && styles.serviceCardActive]}
                  >
                    <View style={styles.serviceLeft}>
                      <Text style={[styles.serviceName, active && styles.serviceNameActive]}>
                        {service.name}
                      </Text>
                      <Text style={styles.serviceDuration}>
                        ⏱ {service.duration} min
                      </Text>
                    </View>
                    <View style={styles.serviceRight}>
                      <Text style={styles.servicePrice}>
                        R$ {service.price.toFixed(2)}
                      </Text>
                      {active && (
                        <Text style={styles.serviceSelected}>✓ Selecionado</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* Reviews tab */}
        {tab === 'reviews' && (
          <View style={styles.section}>
            {loadingReviews ? (
              <ActivityIndicator color={C.gold} style={{ marginTop: 24 }} />
            ) : reviews.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma avaliação ainda.</Text>
            ) : (
              reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewClient}>
                      {review.clientName || 'Cliente'}
                    </Text>
                    <Text style={styles.reviewStars}>
                      {renderStars(review.rating)}
                    </Text>
                  </View>
                  {review.comment && (
                    <Text style={styles.reviewComment}>"{review.comment}"</Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* Bottom spacing for fixed button */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed bottom button */}
      <View style={styles.bottomBar}>
        {selectedService && (
          <Text style={styles.selectedServiceLabel}>
            {selectedService.name} — R$ {selectedService.price.toFixed(2)}
          </Text>
        )}
        <GoldButton
          label={selectedService ? 'Agendar Horário →' : 'Selecione um serviço'}
          disabled={!selectedService}
          onPress={() => {
            if (selectedService) {
              navigation.navigate('Booking', {
                barber,
                service: selectedService,
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
  cover: {
    height: 200,
    backgroundColor: C.grayDim,
    position: 'relative',
  },
  backButton: {
    margin: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: C.white,
    fontSize: 18,
  },
  coverGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(10,10,10,0.8)',
  },
  avatarWrapper: {
    position: 'absolute',
    bottom: -40,
    left: 20,
  },
  profileInfo: {
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  name: {
    color: C.white,
    fontSize: 22,
    fontWeight: '800',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  stars: {
    color: C.gold,
    fontSize: 14,
  },
  ratingText: {
    color: C.gray,
    fontSize: 13,
  },
  specialties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: C.goldDim,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.3)',
  },
  badgeText: {
    color: C.gold,
    fontSize: 12,
    fontWeight: '600',
  },
  address: {
    color: C.gray,
    fontSize: 13,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginTop: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: C.gold,
  },
  tabText: {
    color: C.gray,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: C.gold,
  },
  section: {
    padding: 20,
  },
  serviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    padding: 14,
    marginBottom: 10,
  },
  serviceCardActive: {
    backgroundColor: 'rgba(212,168,67,0.05)',
    borderColor: C.gold,
  },
  serviceLeft: {
    flex: 1,
  },
  serviceName: {
    color: C.white,
    fontSize: 15,
    fontWeight: '500',
  },
  serviceNameActive: {
    fontWeight: '700',
  },
  serviceDuration: {
    color: C.gray,
    fontSize: 12,
    marginTop: 3,
  },
  serviceRight: {
    alignItems: 'flex-end',
  },
  servicePrice: {
    color: C.gold,
    fontSize: 17,
    fontWeight: '800',
  },
  serviceSelected: {
    color: C.green,
    fontSize: 11,
    marginTop: 2,
  },
  reviewCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewClient: {
    color: C.white,
    fontWeight: '600',
    fontSize: 14,
  },
  reviewStars: {
    color: C.gold,
    fontSize: 13,
  },
  reviewComment: {
    color: C.gray,
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  emptyText: {
    color: C.gray,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
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
  selectedServiceLabel: {
    color: C.gold,
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 10,
  },
});