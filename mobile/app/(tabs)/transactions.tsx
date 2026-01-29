import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Text, View } from '@/components/Themed';
import { FontAwesome } from '@expo/vector-icons';
import { transactionApi } from '../../src/api/services';
import { useRouter } from 'expo-router';

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const router = useRouter();

  const loadTransactions = async () => {
    try {
      const data = await transactionApi.getTransactions(0, 100);
      const sorted = Array.isArray(data) 
        ? data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        : [];
      setTransactions(sorted);
      setFilteredTransactions(sorted);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    let filtered = transactions;
    
    // Filtro por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.transaction_type === filterType);
    }
    
    // Filtro por texto
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(t => 
        t.description?.toLowerCase().includes(search) ||
        t.category?.name?.toLowerCase().includes(search)
      );
    }
    
    setFilteredTransactions(filtered);
  }, [searchText, filterType, transactions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  }, []);

  const handleEdit = (transaction: any) => {
    router.push({
      pathname: '/edit-transaction',
      params: { id: transaction.id }
    });
  };

  const handleDelete = (id: number, description: string) => {
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
              await transactionApi.deleteTransaction(id);
              loadTransactions();
              Alert.alert('Sucesso', 'Transação excluída!');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  const renderTransaction = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.transactionCard}
      onPress={() => handleEdit(item)}
      onLongPress={() => handleDelete(item.id, item.description)}
    >
      <View style={[
        styles.typeIndicator,
        { backgroundColor: item.transaction_type === 'income' ? '#48bb78' : '#f56565' }
      ]} />
      
      <View style={styles.transactionInfo}>
        <View style={styles.topRow}>
          <Text style={styles.description}>{item.description}</Text>
          <Text style={[
            styles.amount,
            { color: item.transaction_type === 'income' ? '#48bb78' : '#f56565' }
          ]}>
            {item.transaction_type === 'income' ? '+' : '-'} R$ {Math.abs(item.amount).toFixed(2)}
          </Text>
        </View>
        
        <View style={styles.bottomRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category?.name || 'Sem categoria'}</Text>
          </View>
          <Text style={styles.date}>{formatDate(item.date)}</Text>
        </View>
        
        <Text style={styles.account}>
          <FontAwesome name="bank" size={10} color="#718096" /> {item.account?.name || 'Sem conta'}
        </Text>
      </View>
      
      <FontAwesome name="chevron-right" size={14} color="#cbd5e0" style={styles.chevron} />
    </TouchableOpacity>
  );

  const totalIncome = filteredTransactions
    .filter(t => t.transaction_type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpense = filteredTransactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <View style={styles.container}>
      {/* Barra de pesquisa */}
      <View style={styles.searchContainer}>
        <FontAwesome name="search" size={16} color="#a0aec0" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar transação..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#a0aec0"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <FontAwesome name="times-circle" size={18} color="#a0aec0" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'all' && styles.filterActive]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>
            Todas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'income' && styles.filterActiveIncome]}
          onPress={() => setFilterType('income')}
        >
          <Text style={[styles.filterText, filterType === 'income' && styles.filterTextActive]}>
            Receitas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'expense' && styles.filterActiveExpense]}
          onPress={() => setFilterType('expense')}
        >
          <Text style={[styles.filterText, filterType === 'expense' && styles.filterTextActive]}>
            Despesas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Resumo */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Receitas</Text>
          <Text style={[styles.summaryValue, { color: '#48bb78' }]}>
            R$ {totalIncome.toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Despesas</Text>
          <Text style={[styles.summaryValue, { color: '#f56565' }]}>
            R$ {totalExpense.toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Saldo</Text>
          <Text style={[styles.summaryValue, { color: totalIncome - totalExpense >= 0 ? '#48bb78' : '#f56565' }]}>
            R$ {(totalIncome - totalExpense).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Lista */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTransaction}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome name="inbox" size={50} color="#cbd5e0" />
            <Text style={styles.emptyText}>
              {searchText ? 'Nenhuma transação encontrada' : 'Nenhuma transação'}
            </Text>
          </View>
        }
        ListHeaderComponent={
          <Text style={styles.countText}>
            {filteredTransactions.length} transação(ões)
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    height: 45,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2d3748',
  },
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginBottom: 10,
    gap: 10,
    backgroundColor: 'transparent',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
  },
  filterActive: {
    backgroundColor: '#4299e1',
  },
  filterActiveIncome: {
    backgroundColor: '#48bb78',
  },
  filterActiveExpense: {
    backgroundColor: '#f56565',
  },
  filterText: {
    color: '#4a5568',
    fontWeight: '600',
    fontSize: 13,
  },
  filterTextActive: {
    color: '#fff',
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#718096',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  countText: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 10,
    marginTop: 5,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 12,
    minHeight: 50,
  },
  transactionInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  description: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3748',
    flex: 1,
    marginRight: 10,
  },
  amount: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  categoryBadge: {
    backgroundColor: '#edf2f7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 11,
    color: '#4a5568',
  },
  date: {
    fontSize: 12,
    color: '#718096',
  },
  account: {
    fontSize: 11,
    color: '#a0aec0',
  },
  chevron: {
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    backgroundColor: 'transparent',
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: '#a0aec0',
  },
});
