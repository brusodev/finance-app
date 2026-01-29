import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { FontAwesome } from '@expo/vector-icons';
import { accountApi } from '../../src/api/services';
import { useRouter } from 'expo-router';

export default function AccountsScreen() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadAccounts = async () => {
    try {
      const data = await accountApi.getAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAccounts();
    setRefreshing(false);
  }, []);

  const handleDelete = (id: number, name: string) => {
    Alert.alert(
      'Excluir Conta',
      `Deseja realmente excluir a conta "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              await accountApi.deleteAccount(id);
              loadAccounts();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir a conta');
            }
          }
        }
      ]
    );
  };

  const getAccountIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'checking':
      case 'corrente':
        return 'bank';
      case 'savings':
      case 'poupanca':
        return 'money';
      case 'credit':
      case 'credito':
        return 'credit-card';
      case 'investment':
      case 'investimento':
        return 'line-chart';
      case 'cash':
      case 'dinheiro':
        return 'dollar';
      default:
        return 'university';
    }
  };

  const renderAccount = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.accountCard}
      onLongPress={() => handleDelete(item.id, item.name)}
    >
      <View style={styles.iconContainer}>
        <FontAwesome name={getAccountIcon(item.account_type)} size={24} color="#2b6cb0" />
      </View>
      <View style={styles.accountInfo}>
        <Text style={styles.accountName}>{item.name}</Text>
        <Text style={styles.accountType}>{item.account_type}</Text>
      </View>
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>Saldo</Text>
        <Text style={[styles.balance, { color: item.balance >= 0 ? '#48bb78' : '#f56565' }]}>
          R$ {item.balance?.toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.totalLabel}>Saldo Total</Text>
        <Text style={[styles.totalValue, { color: totalBalance >= 0 ? '#48bb78' : '#f56565' }]}>
          R$ {totalBalance.toFixed(2)}
        </Text>
      </View>

      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderAccount}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome name="bank" size={50} color="#cbd5e0" />
            <Text style={styles.emptyText}>Nenhuma conta cadastrada</Text>
            <Text style={styles.emptySubtext}>Toque no + para adicionar</Text>
          </View>
        }
      />

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('/add-account')}
      >
        <FontAwesome name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  header: {
    backgroundColor: '#2b6cb0',
    padding: 20,
    alignItems: 'center',
  },
  totalLabel: {
    color: '#ebf8ff',
    fontSize: 14,
    backgroundColor: 'transparent',
  },
  totalValue: {
    fontSize: 28,
    fontWeight: 'bold',
    backgroundColor: 'transparent',
  },
  listContent: {
    padding: 15,
    paddingBottom: 100,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ebf8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  accountInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  accountName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  accountType: {
    fontSize: 12,
    color: '#718096',
    textTransform: 'capitalize',
  },
  balanceContainer: {
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
  },
  balanceLabel: {
    fontSize: 10,
    color: '#a0aec0',
    backgroundColor: 'transparent',
  },
  balance: {
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'transparent',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2b6cb0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
