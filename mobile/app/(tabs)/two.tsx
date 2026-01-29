import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, FlatList } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { transactionApi, categoryApi, accountApi } from '../../src/api/services';
import { FontAwesome } from '@expo/vector-icons';

export default function TabTwoScreen() {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('expense');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cats, accs] = await Promise.all([
        categoryApi.getCategories(),
        accountApi.getAccounts()
      ]);
      setCategories(cats);
      setAccounts(accs);
      
      if (cats.length > 0) setCategoryId(cats[0].id.toString());
      if (accs.length > 0) setAccountId(accs[0].id.toString());
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar categorias ou contas');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!amount || !description || !categoryId || !accountId) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    setSubmitting(true);
    try {
      await transactionApi.createTransaction({
        description,
        amount: parseFloat(amount.replace(',', '.')),
        date,
        transaction_type: type,
        category_id: parseInt(categoryId),
        account_id: parseInt(accountId)
      });
      
      Alert.alert('Sucesso', 'Transação registrada!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível salvar a transação');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2b6cb0" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Tipo</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity 
            style={[styles.typeButton, type === 'expense' && styles.typeButtonActiveExpense]}
            onPress={() => setType('expense')}
          >
            <Text style={[styles.typeButtonText, type === 'expense' && styles.textWhite]}>Despesa</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeButton, type === 'income' && styles.typeButtonActiveIncome]}
            onPress={() => setType('income')}
          >
            <Text style={[styles.typeButtonText, type === 'income' && styles.textWhite]}>Receita</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Valor (R$)</Text>
        <TextInput
          style={styles.input}
          placeholder="0,00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Aluguel, Supermercado..."
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.label}>Data (AAAA-MM-DD)</Text>
        <TextInput
          style={styles.input}
          placeholder="2026-01-29"
          value={date}
          onChangeText={setDate}
        />

        <Text style={styles.label}>Conta</Text>
        <TouchableOpacity 
          style={styles.selectButton}
          onPress={() => setShowAccountModal(true)}
        >
          <Text style={styles.selectText}>
            {accounts.find((a: any) => a.id.toString() === accountId)?.name || 'Selecione uma conta'}
          </Text>
          <FontAwesome name="chevron-down" size={14} color="#718096" />
        </TouchableOpacity>

        <Text style={styles.label}>Categoria</Text>
        <TouchableOpacity 
          style={styles.selectButton}
          onPress={() => setShowCategoryModal(true)}
        >
          <Text style={styles.selectText}>
            {categories.find((c: any) => c.id.toString() === categoryId)?.name || 'Selecione uma categoria'}
          </Text>
          <FontAwesome name="chevron-down" size={14} color="#718096" />
        </TouchableOpacity>

        {/* Modal de Contas */}
        <Modal visible={showAccountModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Selecione a Conta</Text>
              <FlatList
                data={accounts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, accountId === item.id.toString() && styles.modalItemSelected]}
                    onPress={() => { setAccountId(item.id.toString()); setShowAccountModal(false); }}
                  >
                    <Text style={styles.modalItemText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity style={styles.modalClose} onPress={() => setShowAccountModal(false)}>
                <Text style={styles.modalCloseText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal de Categorias */}
        <Modal visible={showCategoryModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Selecione a Categoria</Text>
              <FlatList
                data={categories}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, categoryId === item.id.toString() && styles.modalItemSelected]}
                    onPress={() => { setCategoryId(item.id.toString()); setShowCategoryModal(false); }}
                  >
                    <Text style={styles.modalItemText}>{item.icon} {item.name}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity style={styles.modalClose} onPress={() => setShowCategoryModal(false)}>
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
            <Text style={styles.saveButtonText}>Salvar Transação</Text>
          )}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  label: {
    fontSize: 14,
    fontWeight: 'bold',
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
  typeRow: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: 'transparent',
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    marginRight: 5,
  },
  typeButtonActiveExpense: {
    backgroundColor: '#f56565',
    borderColor: '#f56565',
  },
  typeButtonActiveIncome: {
    backgroundColor: '#48bb78',
    borderColor: '#48bb78',
  },
  typeButtonText: {
    fontWeight: 'bold',
    color: '#4a5568',
  },
  textWhite: {
    color: '#fff',
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
    maxHeight: '60%',
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
});
