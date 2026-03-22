import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardTypeOptions,
} from 'react-native';
import { C } from '../theme/colors';

type Props = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  icon: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

export default function CustomInput({
  placeholder,
  value,
  onChangeText,
  icon,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  autoCapitalize = 'sentences',
}: Props) {
  const [focused, setFocused] = useState(false);
  // Controls whether password is visible — only relevant when secureTextEntry=true
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrapper}>
      {/* Left icon */}
      <Text style={[styles.icon, focused && styles.iconFocused]}>{icon}</Text>

      <TextInput
        placeholder={placeholder}
        placeholderTextColor={C.gray}
        value={value}
        onChangeText={onChangeText}
        // If secureTextEntry is true, hide text UNLESS user toggled visible
        secureTextEntry={secureTextEntry && !visible}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          focused && styles.inputFocused,
          multiline && styles.multiline,
          // Add right padding when show/hide button is present
          secureTextEntry && styles.inputWithToggle,
        ]}
      />

      {/* Show/hide password button — only rendered for password fields */}
      {secureTextEntry && (
        <TouchableOpacity
          onPress={() => setVisible((v) => !v)}
          style={styles.toggle}
        >
          <Text style={styles.toggleText}>{visible ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginBottom: 14,
  },
  icon: {
    position: 'absolute',
    left: 14,
    top: 16,
    fontSize: 16,
    color: C.gray,
    zIndex: 1,
  },
  iconFocused: {
    color: C.gold,
  },
  input: {
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingLeft: 44,
    paddingRight: 14,
    color: C.white,
    fontSize: 15,
  },
  inputFocused: {
    borderColor: C.gold,
  },
  inputWithToggle: {
    paddingRight: 48,
  },
  multiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  toggle: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
  toggleText: {
    fontSize: 18,
  },
});