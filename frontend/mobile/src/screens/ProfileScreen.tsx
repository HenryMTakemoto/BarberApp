import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../navigation';
import { C } from '../theme/colors';
import Avatar from '../components/Avatar';
import GoldButton from '../components/GoldButton';

type Props = {
  navigation: any;
};

// Menu items for profile options
const MENU_ITEMS = [
  { icon: '👤', label: 'Editar perfil' },
  { icon: '🔔', label: 'Notificações' },
  { icon: '🔒', label: 'Segurança' },
  { icon: '❓', label: 'Ajuda & Suporte' },
];

export default function ProfileScreen({ navigation }: Props) {
  const [user, setUser] = useState<any>(null);

  // Load user from AsyncStorage — saved during login
  const loadUser = useCallback(async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) setUser(JSON.parse(userJson));
    } catch (error) {
      console.error('Error loading user:', error);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, []);

  // Reload user when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadUser);
    return unsubscribe;
  }, [navigation]);

  // Logout — clears AsyncStorage and redirects to Login
  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const handleEditAvatar = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Error launching image picker: ', err);
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      let filename = uri.split('/').pop() || 'photo.jpg';
      let match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : `image`;

      let formData = new FormData();
      formData.append('file', { uri, name: filename, type } as any);

      // Upload file
      const uploadRes = await fetch('http://192.168.3.56:8080/api/upload', {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const data = await uploadRes.json();
      if (!data.url) throw new Error('Upload failed');
      const imageUrl = data.url;

      // Update user profile
      await fetch(`http://192.168.3.56:8080/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ avatarUrl: imageUrl })
      });

      const updatedUser = { ...user, avatarUrl: imageUrl };
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      Alert.alert('Sucesso', 'Sua foto de perfil foi atualizada!');
    } catch (e) {
      console.log('Avatar upload error', e);
      Alert.alert('Erro', 'Não foi possível salvar a foto.');
    }
  };

  if (!user) return null;

  const isBarber = user.role === 'BARBER';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header — gradient background */}
        <View style={styles.header}>
          {/* Avatar + user info */}
          <View style={styles.userRow}>
            <View style={styles.avatarWrapper}>
              <TouchableOpacity onPress={handleEditAvatar} activeOpacity={0.8}>
                <Avatar
                  url={user.avatarUrl}
                  size={72}
                  borderColor={C.gold}
                />
                {/* Edit avatar button */}
                <View style={styles.editAvatarButton}>
                  <Text style={styles.editAvatarIcon}>✏️</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>

              {/* Role badge */}
              <View style={[
                styles.roleBadge,
                isBarber ? styles.roleBadgeBarber : styles.roleBadgeClient,
              ]}>
                <Text style={[
                  styles.roleBadgeText,
                  isBarber ? styles.roleBadgeTextBarber : styles.roleBadgeTextClient,
                ]}>
                  {isBarber ? 'BARBER ✓' : 'CLIENT'}
                </Text>
              </View>
            </View>
          </View>

          {/* "Sou Profissional" card — only for clients */}
          {!isBarber && (
            <TouchableOpacity
              style={styles.proCard}
              onPress={() => navigation.navigate('BarberSetup')}
              activeOpacity={0.85}
            >
              <View style={styles.proCardIcon}>
                <Text style={styles.proCardEmoji}>✂️</Text>
              </View>
              <View style={styles.proCardInfo}>
                <Text style={styles.proCardTitle}>Sou Profissional</Text>
                <Text style={styles.proCardSubtitle}>
                  Ative seu perfil e comece a receber agendamentos
                </Text>
              </View>
              <Text style={styles.proCardArrow}>→</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Menu items */}
        <View style={styles.menu}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemIcon}>
                <Text style={{ fontSize: 18 }}>{item.icon}</Text>
              </View>
              <Text style={styles.menuItemLabel}>{item.label}</Text>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout button */}
        <View style={styles.logoutWrapper}>
          <GoldButton
            label="Sair"
            onPress={handleLogout}
            outline
            danger
          />
        </View>

        {/* App version */}
        <Text style={styles.version}>BarberApp v1.0.0</Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    padding: 20,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: '#0F0E09',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: C.gold,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarIcon: {
    fontSize: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: C.white,
    fontSize: 20,
    fontWeight: '800',
  },
  userEmail: {
    color: C.gray,
    fontSize: 13,
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 6,
  },
  roleBadgeClient: {
    backgroundColor: 'rgba(82,153,224,0.15)',
  },
  roleBadgeBarber: {
    backgroundColor: C.goldDim,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  roleBadgeTextClient: {
    color: C.blue,
  },
  roleBadgeTextBarber: {
    color: C.gold,
  },
  proCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#2A1F00',
    borderWidth: 1.5,
    borderColor: C.gold,
    borderRadius: 18,
    padding: 16,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  proCardIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proCardEmoji: {
    fontSize: 26,
  },
  proCardInfo: {
    flex: 1,
  },
  proCardTitle: {
    color: C.gold,
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 3,
  },
  proCardSubtitle: {
    color: '#A88A40',
    fontSize: 12,
    lineHeight: 16,
  },
  proCardArrow: {
    color: C.gold,
    fontSize: 20,
  },
  menu: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  menuItemIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemLabel: {
    color: C.white,
    fontSize: 15,
    flex: 1,
  },
  menuItemArrow: {
    color: C.grayDim,
    fontSize: 18,
  },
  logoutWrapper: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  version: {
    color: C.grayDim,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});