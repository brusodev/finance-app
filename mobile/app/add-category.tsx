import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, FlatList } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { categoryApi } from '../src/api/services';

const EMOJI_LIST = [
  '🍔', '🍕', '🍜', '🥗', '🍱', '🚗', '🚕', '🚌', '🚇', '✈️',
  '🏥', '💊', '🩺', '💉', '🧘', '📚', '🎓', '✏️', '📝', '🏫',
  '🎮', '🎬', '🎵', '🎨', '🎪', '🏠', '🏡', '🏢', '🔑', '🛋️',
  '👔', '👕', '👗', '👟', '🧥', '💄', '💅', '💇', '🧴', '✨',
  '🐶', '🐱', '🐹', '🐠', '🐾', '💻', '📱', '🖥️', '⌚', '🎧',
  '⚽', '🏋️', '🏊', '🏃', '🧗', '🏖️', '🗺️', '🎒', '🧳', '🛒',
  '🛍️', '🏪', '🥕', '🍞', '📄', '💡', '💧', '📞', '📺', '📈',
  '💰', '💵', '💳', '🏦', '🎁', '🎉', '🎂', '💝', '🌹', '❤️',
  '🤝', '🙏', '💙', '💚', '📌', '⭐', '🔔', '🎯',
];

export default function AddCategoryScreen() {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📌');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Informe o nome da categoria');
      return;
    }

    setSubmitting(true);
    try {
      await categoryApi.createCategory({
        name: name.trim(),
        icon: selectedIcon,
      });
      
      Alert.alert('Sucesso', 'Categoria criada com sucesso!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível criar a categoria');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Nova Categoria</Text>

        <View style={styles.previewContainer}>
          <View style={styles.previewIcon}>
            <Text style={styles.previewEmoji}>{selectedIcon}</Text>
          </View>
          <Text style={styles.previewName}>{name || 'Nome da categoria'}</Text>
        </View>

        <Text style={styles.label}>Nome da categoria *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Alimentação, Transporte..."
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Escolha um ícone</Text>
        <View style={styles.emojiGrid}>
          {EMOJI_LIST.map((emoji, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.emojiButton,
                selectedIcon === emoji && styles.emojiButtonSelected
              ]}
              onPress={() => setSelectedIcon(emoji)}
            >
              <Text style={styles.emoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, submitting && styles.buttonDisabled]} 
          onPress={handleSave}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Criar Categoria</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  card: {
    margin: 20,
    padding: 20,
    borderRadius: 15,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 20,
    textAlign: 'center',
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#f7fafc',
    padding: 20,
    borderRadius: 12,
  },
  previewIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  previewEmoji: {
    fontSize: 35,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4a5568',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 8,
    marginTop: 10,
    backgroundColor: 'transparent',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1a202c',
    marginBottom: 15,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    backgroundColor: 'transparent',
  },
  emojiButton: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 3,
    borderRadius: 8,
    backgroundColor: '#f7fafc',
  },
  emojiButtonSelected: {
    backgroundColor: '#e9d8fd',
    borderWidth: 2,
    borderColor: '#805ad5',
  },
  emoji: {
    fontSize: 22,
  },
  saveButton: {
    backgroundColor: '#805ad5',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 25,
  },
  buttonDisabled: {
    backgroundColor: '#a0aec0',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#718096',
    fontSize: 16,
  },
});
