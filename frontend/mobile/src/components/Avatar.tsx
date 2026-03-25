import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { C } from '../theme/colors';

type Props = {
  url?: string | null;
  size?: number;
  borderColor?: string;
};

export default function Avatar({ url, size = 48, borderColor = C.border }: Props) {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor,
        },
      ]}
    >
      {url ? (
        <Image
          source={{ uri: url }}
          style={[
            styles.image,
            { width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 },
          ]}
        />
      ) : (
        // Fallback when no photo — shows initials placeholder
        <View
          style={[
            styles.placeholder,
            { width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.card,
  },
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: C.grayDim,
  },
});
