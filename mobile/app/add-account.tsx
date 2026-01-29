import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, FlatList } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { accountApi } from '../src/api/services';
import { FontAwesome } from '@expo/vector-icons';

export default function AddAccountScreen() {
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState('checking');
  const [initialBalance, setInitialBalance] = useState('0');
  const [currency, setCurrency] = useState('BRL');
  const [submitting, setSubmitting] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const router = useRouter();

  const accountTypes = [
    { value: 'checking', label: 'Conta Corrente' },
    { value: 'savings', label: 'Poupança' },
    { value: 'credit', label: 'Cartão de Crédito' },
    { value: 'investment', label: 'Investimento' },
    { value: 'cash', label: 'Dinheiro' },
    { value: 'other', label: 'Outro' },
  ];

  const currencies = [
    { value: 'BRL', label: 'Real (R$)' },
    { value: 'USD', label: 'Dólar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
  ];

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Informe o nome da conta');
      return;
    }

    setSubmitting(true);
    try {
      await accountApi.createAccount({
        name: name.trim(),
        account_type: accountType,
        initial_balance: parseFloat(initialBalance.replace(',', '.')) || 0,
        currency,
      });
      
      Alert.alert('Sucesso', 'Conta criada com sucesso!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível criar a conta');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Nova Conta</Text>

        <Text style={styles.label}>Nome da conta *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Nubank, Itaú, Carteira..."
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Tipo de conta</Text>
        <TouchableOpacity 
          style={styles.selectButton}
          onPress={() => setShowTypeModal(true)}
        >
          <Text style={styles.selectText}>
            {accountTypes.find(t => t.value === accountType)?.label || 'Selecione'}
          </Text>
          <FontAwesome name="chevron-down" size={14} color="#718096" />
        </TouchableOpacity>

        <Text style={styles.label}>Saldo inicial</Text>
        <TextInput
          style={styles.input}
          placeholder="0,00"
          value={initialBalance}
          onChangeText={setInitialBalance}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Moeda</Text>
        <TouchableOpacity 
          style={styles.selectButton}
          onPress={() => setShowCurrencyModal(true)}
        >
          <Text style={styles.selectText}>
            {currencies.find(c => c.value === currency)?.label || 'Selecione'}
          </Text>
          <FontAwesome name="chevron-down" size={14} color="#718096" />
        </TouchableOpacity>

        {/* Modal Tipo de Conta */}
        <Modal visible={showTypeModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Tipo de Conta</Text>
              <FlatList
                data={accountTypes}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, accountType === item.value && styles.modalItemSelected]}
                    onPress={() => { setAccountType(item.value); setShowTypeModal(false); }}
                  >
                    <Text style={styles.modalItemText}>{item.label}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity style={styles.modalClose} onPress={() => setShowTypeModal(false)}>
                <Text style={styles.modalCloseText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal Moeda */}
        <Modal visible={showCurrencyModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Moeda</Text>
              <FlatList
                data={currencies}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, currency === item.value && styles.modalItemSelected]}
                    onPress={() => { setCurrency(item.value); setShowCurrencyModal(false); }}
                  >
                    <Text style={styles.modalItemText}>{item.label}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity style={styles.modalClose} onPress={() => setShowCurrencyModal(false)}>
                <Text style={styles.modalCloseText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <TouchableOpacity 
          style={[styles.saveButton, submitting && styles.buttonDisabled]} 
          onPress={handleSave}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Criar Conta</Text>
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
    marginBottom: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginBottom: 10,
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#f7fafc',
  },
  selectText: {
    fontSize: 16,
    color: '#2d3748',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
  },
  modalItemSelected: {
    backgroundColor: '#ebf8ff',
  },
  modalItemText: {
    fontSize: 16,
    color: '#2d3748',
  },
  modalClose: {
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  modalCloseText: {
    color: '#718096',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#2b6cb0',
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
