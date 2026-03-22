import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { C } from '../theme/colors';

type Props = {
  label: string;
  onPress: () => void;
  outline?: boolean;        // border style instead of filled
  disabled?: boolean;
  loading?: boolean;        // shows spinner while waiting API response
  small?: boolean;
  danger?: boolean;         // red color for destructive actions
};

export default function GoldButton({
  label,
  onPress,
  outline = false,
  disabled = false,
  loading = false,
  small = false,
  danger = false,
}: Props) {
  const color = danger ? C.red : C.gold;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        small && styles.small,
        outline
          ? { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: color }
          : { backgroundColor: disabled ? C.grayDim : color },
        disabled && styles.disabled,
      ]}
    >
      {loading ? (
        // Spinner shown while API call is in progress
        <ActivityIndicator color={outline ? color : '#0A0A0A'} />
      ) : (
        <Text
          style={[
            styles.label,
            small && styles.smallLabel,
            outline
              ? { color }
              : { color: disabled ? C.gray : '#0A0A0A' },
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: {
    paddingVertical: 10,
    borderRadius: 10,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
  smallLabel: {
    fontSize: 13,
  },
});