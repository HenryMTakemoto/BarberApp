import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { C } from '../theme/colors';
import Avatar from './Avatar';

type Barber = {
  id: number;
  name: string;
  email: string;
  role: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  avatarUrl: string | null;
  address: {
    street: string;
    city: string;
  } | null;
  specialties: string[];
};

type Props = {
  barber: Barber;
  onPress: () => void;
};

export default function BarberCard({ barber, onPress }: Props) {
  const distanceLabel =
    barber.distanceKm < 1
      ? `${(barber.distanceKm * 1000).toFixed(0)}m`
      : `${barber.distanceKm.toFixed(1)}km`;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Cover image area — gradient placeholder */}
      <View style={styles.cover}>
        <View style={styles.coverGradient} />

        {/* Distance tag — top right */}
        <View style={styles.distanceTag}>
          <Text style={styles.distanceText}>📍 {distanceLabel}</Text>
        </View>

        {/* Avatar overlapping cover bottom */}
        <View style={styles.avatarWrapper}>
          <Avatar
            url={barber.avatarUrl}
            size={52}
            borderColor={C.gold}
          />
        </View>
      </View>

      {/* Card body */}
      <View style={styles.body}>
        {/* Name + rating row */}
        <View style={styles.nameRow}>
          <View>
            <Text style={styles.name}>{barber.name}</Text>
            <View style={styles.ratingRow}>
              <Text style={styles.stars}>
                {'★'.repeat(Math.round(barber.rating || 0))}
                {'☆'.repeat(5 - Math.round(barber.rating || 0))}
              </Text>
              <Text style={styles.ratingText}>
                {barber.rating?.toFixed(1) || '0.0'} ({barber.reviewCount || 0})
              </Text>
            </View>
          </View>

          {/* Radar badge */}
          <View style={styles.radarBadge}>
            <Text style={styles.radarText}>RADAR ✓</Text>
          </View>
        </View>

        {/* Specialties */}
        {barber.specialties?.length > 0 && (
          <View style={styles.specialties}>
            {barber.specialties.slice(0, 3).map((s) => (
              <View key={s} style={styles.badge}>
                <Text style={styles.badgeText}>{s}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.address} numberOfLines={1}>
            {barber.address?.street || 'Endereço não informado'}
          </Text>
          <Text style={styles.seeProfile}>Ver perfil →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    marginBottom: 14,
  },
  cover: {
    height: 100,
    backgroundColor: C.grayDim,
    position: 'relative',
  },
  coverGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(26,26,26,0.8)',
  },
  distanceTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  distanceText: {
    color: C.white,
    fontSize: 12,
  },
  avatarWrapper: {
    position: 'absolute',
    bottom: -20,
    left: 16,
  },
  body: {
    padding: 16,
    paddingTop: 28,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    color: C.white,
    fontSize: 17,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  stars: {
    color: C.gold,
    fontSize: 12,
  },
  ratingText: {
    color: C.gray,
    fontSize: 12,
  },
  radarBadge: {
    backgroundColor: C.goldDim,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  radarText: {
    color: C.gold,
    fontSize: 11,
    fontWeight: '700',
  },
  specialties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  badge: {
    backgroundColor: C.goldDim,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(212,168,67,0.3)',
  },
  badgeText: {
    color: C.gold,
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  address: {
    color: C.gray,
    fontSize: 12,
    flex: 1,
  },
  seeProfile: {
    color: C.gold,
    fontSize: 13,
    fontWeight: '600',
  },
});