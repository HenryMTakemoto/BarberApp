import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../navigation';
import { C } from '../theme/colors';
import GoldButton from '../components/GoldButton';
import Avatar from '../components/Avatar';
import apiRequest from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Review'>;
  route: RouteProp<RootStackParamList, 'Review'>;
};

const POSITIVE_TAGS = [
  'Pontual', 'Atencioso', 'Habilidoso',
  'Ambiente clean', 'Preço justo', 'Recomendo',
];

const NEGATIVE_TAGS = [
  'Atrasou', 'Pouco cuidado', 'Ambiente ruim',
  'Preço alto', 'Resultado diferente',
];

const RATING_LABELS = ['', 'Ruim', 'Regular', 'Bom', 'Ótimo', 'Incrível!'];

export default function ReviewScreen({ navigation, route }: Props) {
  const { barber, service, appointmentId } = route.params;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Atenção', 'Selecione uma avaliação.');
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

      // Combine tags and written comment
      const fullComment = [
        selectedTags.join(', '),
        comment,
      ]
        .filter(Boolean)
        .join(' · ');

      // POST /api/reviews — requires appointmentId, clientId, barberId, rating
      const response = await apiRequest('/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          barberId: barber.id,
          clientId: user.id,
          appointmentId,
          rating,
          comment: fullComment || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Erro', data.message || 'Erro ao enviar avaliação.');
        return;
      }

      setSubmitted(true);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (submitted) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.successContainer}>
          <Text style={styles.successEmoji}>⭐</Text>
          <Text style={styles.successTitle}>Obrigado!</Text>
          <Text style={styles.successSubtitle}>
            Sua avaliação ajuda outros clientes a encontrar os melhores profissionais.
          </Text>
          <View style={styles.successButton}>
            <GoldButton
              label="Voltar aos agendamentos"
              onPress={() => navigation.replace('MainTabs')}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const tags = rating >= 4 ? POSITIVE_TAGS : rating > 0 ? NEGATIVE_TAGS : [];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <SafeAreaView>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <Text style={styles.backText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Avaliar atendimento</Text>
            </View>
          </SafeAreaView>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Barber info card */}
            <View style={styles.section}>
              <View style={styles.barberCard}>
                <Avatar url={barber.avatarUrl} size={56} borderColor={C.gold} />
                <View style={styles.barberInfo}>
                  <Text style={styles.barberName}>{barber.name}</Text>
                  <Text style={styles.serviceName}>{service}</Text>
                </View>
              </View>
            </View>

            {/* Star rating */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Como foi seu atendimento?</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => {
                      setRating(star);
                      setSelectedTags([]);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.star,
                      rating >= star && styles.starActive,
                    ]}>
                      {rating >= star ? '★' : '☆'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {rating > 0 && (
                <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>
              )}
            </View>

            {/* Quick tags */}
            {tags.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  {rating >= 4 ? 'O que você mais gostou?' : 'O que poderia melhorar?'}
                </Text>
                <View style={styles.tagsRow}>
                  {tags.map((tag) => {
                    const active = selectedTags.includes(tag);
                    return (
                      <TouchableOpacity
                        key={tag}
                        onPress={() => toggleTag(tag)}
                        style={[styles.tag, active && styles.tagActive]}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.tagText, active && styles.tagTextActive]}>
                          {rating >= 4 ? '👍' : '👎'} {tag}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Comment input */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Comentário (opcional)</Text>
              <TextInput
                placeholder="Conte como foi o atendimento..."
                placeholderTextColor={C.gray}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                style={styles.commentInput}
                textAlignVertical="top"
              />
            </View>

            <View style={{ height: 120 }} />
          </ScrollView>

          {/* Fixed bottom button */}
          <View style={styles.bottomBar}>
            <GoldButton
              label={rating === 0 ? 'Selecione uma avaliação' : 'Enviar avaliação ⭐'}
              disabled={rating === 0}
              loading={loading}
              onPress={handleSubmit}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
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
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionLabel: {
    color: C.gray,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
    textAlign: 'center',
  },
  barberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
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
    fontWeight: '700',
    fontSize: 17,
  },
  serviceName: {
    color: C.gold,
    fontSize: 13,
    marginTop: 2,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  star: {
    fontSize: 40,
    color: C.grayDim,
  },
  starActive: {
    color: C.gold,
  },
  ratingLabel: {
    color: C.gold,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  tagActive: {
    backgroundColor: C.goldDim,
    borderColor: C.gold,
  },
  tagText: {
    color: C.gray,
    fontSize: 13,
  },
  tagTextActive: {
    color: C.gold,
    fontWeight: '600',
  },
  commentInput: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 14,
    color: C.white,
    fontSize: 14,
    minHeight: 100,
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
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  successEmoji: {
    fontSize: 80,
    marginBottom: 20,
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
    marginBottom: 32,
  },
  successButton: {
    width: '100%',
  },
});