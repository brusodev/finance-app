import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { dashboardApi, transactionApi } from '../../src/api/services';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

// Função para obter primeiro e último dia do mês atual
const getCurrentMonthDates = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  return {
    startDate: formatDate(firstDay),
    endDate: formatDate(lastDay),
    monthName: now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  };
};

export default function TabOneScreen() {
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState('');
  const router = useRouter();
  const [stats, setStats] = useState({ 
    total_balance: 0, 
    total_income: 0, 
    total_expense: 0,
    total_accounts: 0,
    total_categories: 0,
    total_transactions: 0
  });

  const checkAuth = async () => {
    const token = await SecureStore.getItemAsync('userToken');
    if (!token) {
      router.replace('/(auth)/login');
      return false;
    }
    return true;
  };

  const loadData = async () => {
    const isAuth = await checkAuth();
    if (!isAuth) return;
    
    // Obter datas do mês atual
    const { startDate, endDate, monthName } = getCurrentMonthDates();
    setCurrentMonth(monthName);
    
    try {
      // Tenta carregar apenas transações primeiro (endpoint mais confiável)
      const transactionsData = await transactionApi.getTransactions(0, 10);
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      
      // Tenta carregar stats do dashboard com filtro do mês atual
      try {
        const statsData = await dashboardApi.getStats(startDate, endDate);
        if (statsData && statsData.stats) {
          setStats(statsData.stats);
        }
        if (statsData && statsData.recent_transactions) {
          setTransactions(statsData.recent_transactions);
        }
      } catch (dashErr) {
        // Dashboard pode falhar, mas continuamos com as transações
        console.log('Dashboard stats não disponível');
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      if (error.response?.status === 401) {
        await SecureStore.deleteItemAsync('userToken');
        router.replace('/(auth)/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const handleDeleteTransaction = (id: number, description: string) => {
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
              loadData();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir');
            }
          }
        }
      ]
    );
  };

  const handleEditTransaction = (transaction: any) => {
    router.push({
      pathname: '/edit-transaction',
      params: { id: transaction.id }
    });
  };

  const renderTransaction = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.transactionItem}
      onPress={() => handleEditTransaction(item)}
      onLongPress={() => handleDeleteTransaction(item.id, item.description)}
    >
      <View style={styles.iconContainer}>
        <FontAwesome 
          name={item.transaction_type === 'income' ? 'arrow-up' : 'arrow-down'} 
          size={16} 
          color={item.transaction_type === 'income' ? '#48bb78' : '#f56565'} 
        />
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.category}>{item.category?.name || 'Sem categoria'}</Text>
      </View>
      <View style={styles.amountContainer}>
        <Text style={[
          styles.amount, 
          { color: item.transaction_type === 'income' ? '#48bb78' : '#f56565' }
        ]}>
          {item.transaction_type === 'income' ? '+' : '-'} 
          R$ {Math.abs(item.amount).toFixed(2)}
        </Text>
        <FontAwesome name="chevron-right" size={12} color="#cbd5e0" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header com ícone de perfil */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Finance App</Text>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <FontAwesome name="user-circle" size={28} color="#2b6cb0" />
        </TouchableOpacity>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Saldo Total</Text>
        <Text style={styles.balanceValue}>R$ {stats.total_balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
        
        {currentMonth && (
          <Text style={styles.monthLabel}>{currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)}</Text>
        )}
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Receitas do mês</Text>
            <Text style={[styles.statValue, { color: '#68d391' }]}>+ R$ {stats.total_income?.toFixed(2)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Despesas do mês</Text>
            <Text style={[styles.statValue, { color: '#fc8181' }]}>- R$ {stats.total_expense?.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.quickStats}>
        <View style={styles.quickStatItem}>
          <FontAwesome name="bank" size={20} color="#2b6cb0" />
          <Text style={styles.quickStatNumber}>{stats.total_accounts}</Text>
          <Text style={styles.quickStatLabel}>Contas</Text>
        </View>
        <View style={styles.quickStatItem}>
          <FontAwesome name="tags" size={20} color="#805ad5" />
          <Text style={styles.quickStatNumber}>{stats.total_categories}</Text>
          <Text style={styles.quickStatLabel}>Categorias</Text>
        </View>
        <View style={styles.quickStatItem}>
          <FontAwesome name="exchange" size={20} color="#38a169" />
          <Text style={styles.quickStatNumber}>{stats.total_transactions}</Text>
          <Text style={styles.quickStatLabel}>Transações</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Transações Recentes</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
          <Text style={styles.seeAllLink}>Ver todas</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTransaction}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome name="inbox" size={50} color="#cbd5e0" />
            <Text style={styles.emptyText}>Nenhuma transação</Text>
            <Text style={styles.emptySubtext}>Toque em "Nova" para adicionar</Text>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2b6cb0',
  },
  profileButton: {
    padding: 5,
  },
  balanceCard: {
    backgroundColor: '#2b6cb0',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  balanceLabel: {
    color: '#ebf8ff',
    fontSize: 14,
    backgroundColor: 'transparent',
  },
  balanceValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 5,
    backgroundColor: 'transparent',
  },
  monthLabel: {
    color: '#bee3f8',
    fontSize: 13,
    backgroundColor: 'transparent',
    marginBottom: 5,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 10,
    backgroundColor: 'transparent',
  },
  statItem: {
    backgroundColor: 'transparent',
  },
  statLabel: {
    color: '#ebf8ff',
    fontSize: 12,
    backgroundColor: 'transparent',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'transparent',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickStatItem: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  quickStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginTop: 5,
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#718096',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 15,
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  seeAllLink: {
    fontSize: 14,
    color: '#4299e1',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#edf2f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  description: {
    fontSize: 15,
    color: '#2d3748',
    fontWeight: '500',
    backgroundColor: 'transparent',
  },
  category: {
    fontSize: 12,
    color: '#718096',
    backgroundColor: 'transparent',
  },
  amount: {
    fontSize: 15,
    fontWeight: 'bold',
    backgroundColor: 'transparent',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
    backgroundColor: 'transparent',
  },
  emptyText: {
    marginTop: 15,
    fontSize: 18,
    color: '#718096',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#a0aec0',
  },
});
