import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { FontAwesome } from '@expo/vector-icons';
import { transactionApi, categoryApi, accountApi } from '../src/api/services';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function EditTransactionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transaction, setTransaction] = useState<any>(null);
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar transação, categorias e contas em paralelo
      const [transData, catsData, accsData] = await Promise.all([
        transactionApi.getTransaction(Number(id)),
        categoryApi.getCategories(),
        accountApi.getAccounts()
      ]);
      
      setTransaction(transData);
      setCategories(catsData);
      setAccounts(accsData);
      
      // Preencher campos
      setDescription(transData.description || '');
      setAmount(Math.abs(transData.amount).toString());
      setTransactionType(transData.transaction_type || 'expense');
      setDate(transData.date?.split('T')[0] || new Date().toISOString().split('T')[0]);
      
      // Encontrar categoria e conta selecionadas
      const cat = catsData.find((c: any) => c.id === transData.category_id);
      const acc = accsData.find((a: any) => a.id === transData.account_id);
      setSelectedCategory(cat || null);
      setSelectedAccount(acc || null);
      
    } catch (error) {
      console.error('Erro ao carregar:', error);
      Alert.alert('Erro', 'Não foi possível carregar a transação');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!description.trim()) {
      Alert.alert('Erro', 'Informe uma descrição');
      return;
    }
    if (!amount || isNaN(parseFloat(amount))) {
      Alert.alert('Erro', 'Informe um valor válido');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Erro', 'Selecione uma categoria');
      return;
    }
    if (!selectedAccount) {
      Alert.alert('Erro', 'Selecione uma conta');
      return;
    }

    try {
      setSaving(true);
      
      await transactionApi.updateTransaction(Number(id), {
        description: description.trim(),
        amount: parseFloat(amount),
        transaction_type: transactionType,
        category_id: selectedCategory.id,
        account_id: selectedAccount.id,
        date: date,
      });
      
      Alert.alert('Sucesso', 'Transação atualizada!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      Alert.alert('Erro', 'Não foi possível salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Excluir Transação',
      `Deseja excluir "${description}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await transactionApi.deleteTransaction(Number(id));
              Alert.alert('Sucesso', 'Transação excluída!', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir');
            }
          }
        }
      ]
    );
  };

  // Categorias não têm tipo no backend - mostrar todas
  const filteredCategories = categories;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4299e1" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={20} color="#4a5568" />
        </TouchableOpacity>
        <Text style={styles.title}>Editar Transação</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <FontAwesome name="trash" size={20} color="#f56565" />
        </TouchableOpacity>
      </View>

      {/* Tipo */}
      <View style={styles.typeContainer}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            transactionType === 'expense' && styles.typeButtonExpense,
          ]}
          onPress={() => setTransactionType('expense')}
        >
          <FontAwesome 
            name="arrow-down" 
            size={16} 
            color={transactionType === 'expense' ? '#fff' : '#f56565'} 
          />
          <Text style={[
            styles.typeText,
            transactionType === 'expense' && styles.typeTextActive,
          ]}>Despesa</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.typeButton,
            transactionType === 'income' && styles.typeButtonIncome,
          ]}
          onPress={() => setTransactionType('income')}
        >
          <FontAwesome 
            name="arrow-up" 
            size={16} 
            color={transactionType === 'income' ? '#fff' : '#48bb78'} 
          />
          <Text style={[
            styles.typeText,
            transactionType === 'income' && styles.typeTextActive,
          ]}>Receita</Text>
        </TouchableOpacity>
      </View>

      {/* Valor */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Valor</Text>
        <View style={styles.amountContainer}>
          <Text style={styles.currency}>R$</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0,00"
          />
        </View>
      </View>

      {/* Descrição */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="Ex: Almoço"
        />
      </View>

      {/* Data */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Data</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="AAAA-MM-DD"
        />
      </View>

      {/* Categoria */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Categoria</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowCategoryModal(true)}
        >
          <Text style={[
            styles.selectText,
            !selectedCategory && styles.selectPlaceholder
          ]}>
            {selectedCategory?.name || 'Selecione uma categoria'}
          </Text>
          <FontAwesome name="chevron-down" size={14} color="#a0aec0" />
        </TouchableOpacity>
      </View>

      {/* Conta */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Conta</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowAccountModal(true)}
        >
          <Text style={[
            styles.selectText,
            !selectedAccount && styles.selectPlaceholder
          ]}>
            {selectedAccount?.name || 'Selecione uma conta'}
          </Text>
          <FontAwesome name="chevron-down" size={14} color="#a0aec0" />
        </TouchableOpacity>
      </View>

      {/* Botão Salvar */}
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <FontAwesome name="check" size={18} color="#fff" />
            <Text style={styles.saveButtonText}>Salvar Alterações</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Modal Categoria */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione a Categoria</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <FontAwesome name="times" size={24} color="#4a5568" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={filteredCategories}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedCategory?.id === item.id && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setSelectedCategory(item);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  {selectedCategory?.id === item.id && (
                    <FontAwesome name="check" size={16} color="#4299e1" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyModalText}>
                  Nenhuma categoria de {transactionType === 'income' ? 'receita' : 'despesa'}
                </Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Modal Conta */}
      <Modal
        visible={showAccountModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAccountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione a Conta</Text>
              <TouchableOpacity onPress={() => setShowAccountModal(false)}>
                <FontAwesome name="times" size={24} color="#4a5568" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={accounts}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedAccount?.id === item.id && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setSelectedAccount(item);
                    setShowAccountModal(false);
                  }}
                >
                  <View style={styles.accountInfo}>
                    <Text style={styles.modalItemText}>{item.name}</Text>
                    <Text style={styles.accountBalance}>
                      R$ {item.balance?.toFixed(2) || '0.00'}
                    </Text>
                  </View>
                  {selectedAccount?.id === item.id && (
                    <FontAwesome name="check" size={16} color="#4299e1" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
  },
  loadingText: {
    marginTop: 10,
    color: '#718096',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  deleteButton: {
    padding: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    margin: 15,
    gap: 10,
    backgroundColor: 'transparent',
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  typeButtonExpense: {
    backgroundColor: '#f56565',
    borderColor: '#f56565',
  },
  typeButtonIncome: {
    backgroundColor: '#48bb78',
    borderColor: '#48bb78',
  },
  typeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4a5568',
  },
  typeTextActive: {
    color: '#fff',
  },
  inputGroup: {
    marginHorizontal: 15,
    marginBottom: 15,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 15,
  },
  currency: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a5568',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    paddingVertical: 15,
    color: '#2d3748',
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectText: {
    fontSize: 16,
    color: '#2d3748',
  },
  selectPlaceholder: {
    color: '#a0aec0',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#4299e1',
    marginHorizontal: 15,
    marginVertical: 20,
    padding: 16,
    borderRadius: 10,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: 'transparent',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalItemSelected: {
    backgroundColor: '#ebf8ff',
  },
  modalItemText: {
    fontSize: 16,
    color: '#2d3748',
  },
  accountInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  accountBalance: {
    fontSize: 13,
    color: '#718096',
    marginTop: 2,
  },
  emptyModalText: {
    textAlign: 'center',
    padding: 20,
    color: '#a0aec0',
  },
});
