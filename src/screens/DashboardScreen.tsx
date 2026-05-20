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

type DashboardNavigationProp = BottomTabNavigationProp<TabParamList, 'Dashboard'>;

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardNavigationProp>();
  const { ingredients, packagings, recipes, products, sales, settings } = useAppStore();

  const totalSalesCount = sales.reduce((acc, sale) => acc + sale.quantity, 0);
  const totalRevenue = sales.reduce((acc, sale) => acc + (sale.salePrice * sale.quantity), 0);

  // Calcula o lucro líquido de todas as vendas
  const totalProfit = sales.reduce((acc, sale) => {
    const product = products.find(p => p.id === sale.productId);
    let unitCost = 0;

    if (product) {
      const totalHoursMonth = settings.hoursPerDay * settings.daysPerWeek * 4;
      const hourlyRate = totalHoursMonth > 0 ? (settings.salary / totalHoursMonth) : 0;

      const materialCost = product.components.reduce((costAcc, comp) => {
        let costPerUnit = 0;
        if (comp.type === 'ingredient') {
          const ing = ingredients.find(i => i.id === comp.componentId);
          if (ing && ing.quantity > 0) costPerUnit = ing.price / ing.quantity;
        } else if (comp.type === 'packaging') {
          const pkg = packagings.find(p => p.id === comp.componentId);
          if (pkg && pkg.quantity > 0) costPerUnit = pkg.price / pkg.quantity;
        } else if (comp.type === 'recipe') {
          const recipe = recipes.find(r => r.id === comp.componentId);
          if (recipe && recipe.yieldQuantity > 0) {
            const recipeTotalCost = recipe.items.reduce((rcpAcc, rcpItem) => {
              const rcpIng = ingredients.find(i => i.id === rcpItem.ingredientId);
              const rcpCostPerUnit = rcpIng && rcpIng.quantity > 0 ? rcpIng.price / rcpIng.quantity : 0;
              return rcpAcc + (rcpCostPerUnit * rcpItem.usedQuantity);
            }, 0);
            costPerUnit = recipeTotalCost / recipe.yieldQuantity;
          }
        }
        return costAcc + (costPerUnit * comp.usedQuantity);
      }, 0);

      const laborCost = (product.productionTimeMinutes / 60) * hourlyRate;
      const directCost = materialCost + laborCost;
      const fixedCostValue = directCost * (settings.fixedCostsPercent / 100);
      unitCost = directCost + fixedCostValue;
    }

    const profitPerUnit = sale.salePrice - unitCost;
    return acc + (profitPerUnit * sale.quantity);
  }, 0);

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

        {/* Grid de Estatísticas */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="shopping-outline" size={28} color={colors.accent} style={styles.statIcon} />
            <Text style={styles.statValue}>{totalSalesCount}</Text>
            <Text style={styles.statLabel}>Unid. Vendidas</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialCommunityIcons name="cupcake" size={28} color={colors.accent} style={styles.statIcon} />
            <Text style={styles.statValue}>{products.length}</Text>
            <Text style={styles.statLabel}>Produtos Ativos</Text>
          </View>
          
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="food-apple" size={28} color={colors.accent} style={styles.statIcon} />
            <Text style={styles.statValue}>{ingredients.length + packagings.length}</Text>
            <Text style={styles.statLabel}>Estoque (Itens)</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialCommunityIcons name="pot-mix" size={28} color={colors.accent} style={styles.statIcon} />
            <Text style={styles.statValue}>{recipes.length}</Text>
            <Text style={styles.statLabel}>Receitas Base</Text>
          </View>
        </View>

        {/* Ações Rápidas */}
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        
        <TouchableOpacity 
          style={styles.actionButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Products')}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="plus-circle-outline" size={24} color={colors.white} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Novo Produto Final</Text>
            <Text style={styles.actionDescription}>Monte um novo bolo de pote para venda.</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.muted} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Ingredients')}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: colors.secondary }]}>
            <MaterialCommunityIcons name="cart-plus" size={24} color={colors.white} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Comprei Ingredientes</Text>
            <Text style={styles.actionDescription}>Atualize sua despensa com novas compras.</Text>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
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
});
