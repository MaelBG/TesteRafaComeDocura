import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../navigation/types';
import { useAppStore } from '../store/useAppStore';
import { usePricing } from '../hooks/usePricing';

type DashboardNavigationProp = BottomTabNavigationProp<TabParamList, 'Dashboard'>;

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardNavigationProp>();
  const { ingredients, packagings, recipes, products, sales, settings } = useAppStore();
  const { getProductUnitCost } = usePricing();

  const totalSalesCount = sales.reduce((acc, sale) => acc + sale.quantity, 0);
  const totalRevenue = sales.reduce((acc, sale) => acc + (sale.salePrice * sale.quantity), 0);

  // Calcula o lucro líquido de todas as vendas e gera estatísticas por produto
  let totalProfit = 0;
  
  const productStats = products.map(product => {
    const productSales = sales.filter(s => s.productId === product.id);
    const qtySold = productSales.reduce((sum, s) => sum + s.quantity, 0);
    const unitCost = getProductUnitCost(product) || 0;

    const revenue = productSales.reduce((sum, s) => sum + ((s.salePrice || 0) * s.quantity), 0);
    const cost = unitCost * qtySold;
    const profit = revenue - cost;

    totalProfit += profit;

    return {
      id: product.id,
      name: product.name,
      qtySold,
      profit
    };
  }).filter(p => p.qtySold > 0);

  // Top 3 Mais Vendidos
  const topSellers = [...productStats].sort((a, b) => b.qtySold - a.qtySold).slice(0, 3);
  
  // Top 3 Maior Lucro
  const topProfitable = [...productStats].sort((a, b) => b.profit - a.profit).slice(0, 3);

  const renderRankingPodium = (index: number) => {
    if (index === 0) return <MaterialCommunityIcons name="trophy" size={20} color="#FFD700" />; // Ouro
    if (index === 1) return <MaterialCommunityIcons name="medal" size={20} color="#C0C0C0" />; // Prata
    if (index === 2) return <MaterialCommunityIcons name="medal" size={20} color="#CD7F32" />; // Bronze
    return <Text style={styles.rankNumber}>{index + 1}º</Text>;
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Cabeçalho de Boas-vindas */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Olá, Confeiteira!</Text>
          <Text style={styles.subtitle}>Aqui está o resumo da sua doceria hoje.</Text>
        </View>

        {/* Faturamento em Destaque */}
        <View style={styles.revenueCard}>
          <View>
            <Text style={styles.revenueLabel}>Faturamento Total</Text>
            <Text style={styles.revenueValue}>R$ {totalRevenue.toFixed(2).replace('.', ',')}</Text>
          </View>
          <View style={styles.profitContainer}>
            <Text style={styles.profitLabel}>Lucro Limpo</Text>
            <Text style={styles.profitValue}>R$ {totalProfit.toFixed(2).replace('.', ',')}</Text>
          </View>
        </View>

        {/* Barramento de Ações Rápidas */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity 
            style={[styles.quickActionBtn, { backgroundColor: colors.accent }]} 
            onPress={() => navigation.navigate('Sales' as any)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="cash-register" size={18} color={colors.white} />
            <Text style={styles.quickActionBtnText}>+ Venda</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickActionBtn, { backgroundColor: colors.secondary }]} 
            onPress={() => navigation.navigate('Inventory' as any)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="food-apple" size={18} color={colors.white} />
            <Text style={styles.quickActionBtnText}>+ Insumo</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickActionBtn, { backgroundColor: colors.primary }]} 
            onPress={() => navigation.navigate('CreateProduct' as any)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="cupcake" size={18} color={colors.white} />
            <Text style={styles.quickActionBtnText}>+ Doce</Text>
          </TouchableOpacity>
        </View>

        {/* Campeões de Venda */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="crown" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Campeões de Vendas</Text>
          </View>
          
          <View style={styles.rankingCard}>
            {topSellers.length === 0 ? (
              <Text style={styles.emptyRankingText}>Nenhuma venda registrada ainda.</Text>
            ) : (
              topSellers.map((item, index) => (
                <View key={item.id} style={[styles.rankingRow, index !== topSellers.length - 1 && styles.rankingDivider]}>
                  <View style={styles.rankIconContainer}>
                    {renderRankingPodium(index)}
                  </View>
                  <Text style={styles.rankingName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.rankingValueBadge}>
                    <Text style={styles.rankingValueText}>{item.qtySold} unid.</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Destaques em Lucro */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="diamond-stone" size={24} color={colors.secondary} />
            <Text style={styles.sectionTitle}>Destaques em Lucro</Text>
          </View>
          
          <View style={styles.rankingCard}>
            {topProfitable.length === 0 ? (
              <Text style={styles.emptyRankingText}>Nenhum lucro registrado ainda.</Text>
            ) : (
              topProfitable.map((item, index) => (
                <View key={item.id} style={[styles.rankingRow, index !== topProfitable.length - 1 && styles.rankingDivider]}>
                  <View style={styles.rankIconContainer}>
                    {renderRankingPodium(index)}
                  </View>
                  <Text style={styles.rankingName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.rankingProfitText}>
                    + R$ {item.profit.toFixed(2).replace('.', ',')}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Grid de Estatísticas Gerais */}
        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Estoque & Geral</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="shopping-outline" size={28} color={colors.accent} style={styles.statIcon} />
            <Text style={styles.statValue}>{totalSalesCount}</Text>
            <Text style={styles.statLabel}>Vendas Totais</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialCommunityIcons name="cupcake" size={28} color={colors.accent} style={styles.statIcon} />
            <Text style={styles.statValue}>{products.length}</Text>
            <Text style={styles.statLabel}>Produtos Ativos</Text>
          </View>
          
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="food-apple" size={28} color={colors.accent} style={styles.statIcon} />
            <Text style={styles.statValue}>{ingredients.length + packagings.length}</Text>
            <Text style={styles.statLabel}>Itens Despensa</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialCommunityIcons name="pot-mix" size={28} color={colors.accent} style={styles.statIcon} />
            <Text style={styles.statValue}>{recipes.length}</Text>
            <Text style={styles.statLabel}>Receitas Base</Text>
          </View>
        </View>

        {/* Ações Rápidas */}
        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Ações Rápidas</Text>

        <TouchableOpacity 
          style={styles.actionButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('MarketList' as any)} // Cast temporário até atualizar types
        >
          <View style={[styles.actionIconContainer, { backgroundColor: colors.accent }]}>
            <MaterialCommunityIcons name="cart-outline" size={24} color={colors.white} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Lista de Mercado</Text>
            <Text style={styles.actionDescription}>Veja o que está faltando no seu estoque.</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.muted} />
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    marginTop: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.7,
    marginTop: 4,
  },
  revenueCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  revenueLabel: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.8,
    fontWeight: '600',
    marginBottom: 4,
  },
  revenueValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  profitContainer: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'flex-end',
  },
  profitLabel: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.8,
    fontWeight: '600',
  },
  profitValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
  },
  rankingCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rankingDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.muted,
  },
  rankIconContainer: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    opacity: 0.6,
  },
  rankingName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginRight: 10,
  },
  rankingValueBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.muted,
  },
  rankingValueText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text,
  },
  rankingProfitText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  emptyRankingText: {
    textAlign: 'center',
    color: colors.text,
    opacity: 0.5,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: colors.white,
    width: '48%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: colors.text,
    opacity: 0.7,
  },
  actionButton: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 13,
    color: colors.text,
    opacity: 0.7,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    gap: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  quickActionBtnText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 13,
  },
});
