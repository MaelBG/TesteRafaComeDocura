import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppStore, Product } from '../store/useAppStore';

export default function ProductsScreen() {
  const { products, removeProduct, ingredients, recipes, settings } = useAppStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Custo por hora de mão de obra
  const totalHoursMonth = settings.hoursPerDay * settings.daysPerWeek * 4;
  const hourlyRate = totalHoursMonth > 0 ? (settings.salary / totalHoursMonth) : 0;

  const handleRemove = (id: string) => {
    Alert.alert(
      "Excluir Produto",
      "Tem certeza que deseja apagar este produto?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: () => removeProduct(id) }
      ]
    );
  };

  const renderItem = ({ item }: { item: Product }) => {
    // Calcula custo material de todos os componentes daquele produto
    const materialCost = item.components.reduce((acc, comp) => {
      let costPerUnit = 0;

      if (comp.type === 'ingredient' || comp.type === 'packaging') {
        const ing = ingredients.find(i => i.id === comp.componentId);
        if (ing && ing.quantity > 0) costPerUnit = ing.price / ing.quantity;
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

      return acc + (costPerUnit * comp.usedQuantity);
    }, 0);

    // Custos adicionais (Mão de Obra e Fixos)
    const laborCost = (item.productionTimeMinutes / 60) * hourlyRate;
    const directCost = materialCost + laborCost;
    const fixedCostValue = directCost * (settings.fixedCostsPercent / 100);
    const totalCost = directCost + fixedCostValue;

    // Preço Sugerido e Lucro
    const suggestedPrice = totalCost > 0 ? (totalCost / (1 - (settings.profitMarginPercent / 100))) : 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDescription}>Tempo montagem: {item.productionTimeMinutes} min</Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('CreateProduct', { productId: item.id })}>
              <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => handleRemove(item.id)}>
              <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.costsContainer}>
          <View style={styles.costColumn}>
            <Text style={styles.costLabel}>Custo Material</Text>
            <Text style={styles.costValue}>R$ {materialCost.toFixed(2).replace('.', ',')}</Text>
          </View>
          <View style={styles.costDivider} />
          <View style={styles.costColumn}>
            <Text style={styles.costLabel}>Custo Total</Text>
            <Text style={styles.costValue}>R$ {totalCost.toFixed(2).replace('.', ',')}</Text>
          </View>
        </View>

        <View style={styles.priceContainer}>
          <View style={styles.priceHeader}>
            <MaterialCommunityIcons name="tag-heart" size={20} color={colors.white} style={{ marginRight: 6 }} />
            <Text style={styles.priceLabel}>Preço Sugerido</Text>
          </View>
          <View style={styles.priceFooter}>
            <Text style={styles.priceValue}>R$ {suggestedPrice.toFixed(2).replace('.', ',')}</Text>
            <View style={styles.profitBadge}>
              <Text style={styles.profitText}>Lucro: {settings.profitMarginPercent}%</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {products.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="store-outline" size={60} color={colors.muted} />
          <Text style={styles.emptyStateText}>Nenhum produto cadastrado.</Text>
          <Text style={styles.emptyStateSub}>Comece a criar seus doces clicando no +.</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB para Novo Produto */}
      <TouchableOpacity 
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('CreateProduct')}
      >
        <MaterialCommunityIcons name="plus" size={30} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, 
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden', 
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  itemDescription: {
    fontSize: 13,
    color: colors.text,
    opacity: 0.6,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 6,
    marginLeft: 4,
  },
  costsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  costColumn: {
    flex: 1,
  },
  costDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.muted,
    marginHorizontal: 12,
  },
  costLabel: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
    marginBottom: 4,
  },
  costValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  priceContainer: {
    backgroundColor: colors.accent,
    padding: 16,
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  profitBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  profitText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
  },
  emptyStateSub: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.6,
    marginTop: 8,
    textAlign: 'center',
  },
});
