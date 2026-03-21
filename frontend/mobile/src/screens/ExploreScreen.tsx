import React from 'react';
import { View, Text } from 'react-native';
import { C } from '../theme/colors';

export default function ExploreScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: C.gold, fontSize: 24 }}>Explore</Text>
    </View>
  );
}