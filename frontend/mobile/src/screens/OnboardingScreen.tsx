import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { C } from '../theme/colors';

const slides = [
  {
    id: '1',
    emoji: '📍',
    title: 'Barbeiros perto de você',
    description: 'Use o Radar e encontre os melhores profissionais no seu bairro em segundos.',
    color: '#1A1500',
  },
  {
    id: '2',
    emoji: '✂️',
    title: 'Agende sem complicação',
    description: 'Escolha o serviço, o horário e confirme em menos de 30 segundos.',
    color: '#0A1A0A',
  },
  {
    id: '3',
    emoji: '⭐',
    title: 'Profissionais avaliados',
    description: 'Veja avaliações reais de outros clientes e escolha sempre o melhor.',
    color: '#0A0A1A',
  },
];

const { width } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

export default function OnboardingScreen({ navigation }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const isLast = currentIndex === slides.length - 1;

  const handleNext = () => {
    if (isLast) {
      navigation.replace('Login');
      return;
    }
    const next = currentIndex + 1;
    flatListRef.current?.scrollToIndex({ index: next });
    setCurrentIndex(next);
  };

  const handleSkip = () => {
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip button — top right */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Pular</Text>
        </TouchableOpacity>
      </View>

      {/* Slides — horizontal scroll */}
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            {/* Emoji card */}
            <View style={[styles.emojiCard, { backgroundColor: item.color }]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
      />

      {/* Bottom — dots + button */}
      <View style={styles.footer}>
        {/* Dot indicators */}
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                flatListRef.current?.scrollToIndex({ index: i });
                setCurrentIndex(i);
              }}
            >
              <View
                style={[
                  styles.dot,
                  {
                    width: i === currentIndex ? 24 : 6,
                    backgroundColor: i === currentIndex ? C.gold : C.grayDim,
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Next button — full width */}
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {isLast ? 'Começar agora →' : 'Próximo →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    alignItems: 'flex-end',
  },
  skipText: {
    color: C.gray,
    fontSize: 14,
    fontWeight: '600',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emojiCard: {
    width: 120,
    height: 120,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  emoji: {
    fontSize: 58,
  },
  title: {
    color: C.white,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  description: {
    color: C.gray,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  footer: {
    paddingHorizontal: 28,
    paddingBottom: 32,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 28,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  nextButton: {
    backgroundColor: C.gold,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  nextButtonText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontWeight: '700',
  },
});