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
import { usePricing } from '../hooks/usePricing';

export default function ProductsScreen() {
  const { products, removeProduct, settings } = useAppStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { 
    getProductUnitCost, 
    getSuggestedPrice, 
    getProductProductionCost,
    getActualMarginAndProfit,
    getCostPerKg
  } = usePricing();

  const handleRemove = (id: string) => {
    Alert.alert(
      "Excluir Doce",
      "Tem certeza que deseja apagar este doce?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: () => removeProduct(id) }
      ]
    );
  };

  const getProfileBadgeInfo = (profile?: string) => {
    switch (profile) {
      case 'bolo_festa': return { label: 'Bolo Festa (Kg)', icon: 'cake-layered', color: '#8E44AD' };
      case 'brigadeiro': return { label: 'Brigadeiros', icon: 'candy', color: '#D35400' };
      case 'bolo_pote': return { label: 'Bolo no Pote', icon: 'glass-fragile', color: '#27AE60' };
      case 'macaron': return { label: 'Macaron/Fino', icon: 'cookie', color: '#C0392B' };
      default: return { label: 'Padrão', icon: 'package-variant', color: colors.secondary };
    }
  };

  const renderItem = ({ item }: { item: Product }) => {
    const totalCost = getProductUnitCost(item) || 0;
    const productionCost = getProductProductionCost(item) || 0;
    const suggestedPrice = getSuggestedPrice(item) || 0;
    const profit = suggestedPrice - totalCost;
    const badge = getProfileBadgeInfo(item.pricingProfile);
    const costPerKg = item.pricingProfile === 'bolo_festa' ? getCostPerKg(item) : 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Text style={styles.itemName}>{item.name || 'Sem nome'}</Text>
              <View style={[styles.profileBadge, { backgroundColor: badge.color }]}>
                <MaterialCommunityIcons name={badge.icon as any} size={12} color={colors.white} />
                <Text style={styles.profileBadgeText}>{badge.label}</Text>
              </View>
            </View>
            <Text style={styles.itemDescription}>
              Montagem: {item.productionTimeMinutes || 0} min
              {item.decorationTimeMinutes ? ` | Decoração: ${item.decorationTimeMinutes} min` : ''}
            </Text>
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
            <Text style={styles.costLabel}>Custo Produção</Text>
            <Text style={styles.costValue}>R$ {productionCost.toFixed(2).replace('.', ',')}</Text>
          </View>
          <View style={styles.costDivider} />
          <View style={styles.costColumn}>
            <Text style={styles.costLabel}>Custo Final (c/ Emb.)</Text>
            <Text style={styles.costValue}>R$ {totalCost.toFixed(2).replace('.', ',')}</Text>
            {costPerKg > 0 && (
              <Text style={styles.costSubValue}>R$ {costPerKg.toFixed(2).replace('.', ',')}/Kg</Text>
            )}
          </View>
        </View>

        <View style={styles.priceContainer}>
          <View style={styles.priceHeader}>
            <MaterialCommunityIcons name="star-circle" size={18} color={colors.white} style={{ marginRight: 6 }} />
            <Text style={styles.priceLabel}>Preço Recomendado de Venda</Text>
          </View>
          <View style={styles.priceFooter}>
            <Text style={styles.priceValue}>R$ {suggestedPrice.toFixed(2).replace('.', ',')}</Text>
            <View style={styles.profitBadge}>
              <Text style={styles.profitBadgeText}>
                Lucro Limpo: R$ {profit.toFixed(2).replace('.', ',')} ({settings.profitMarginPercent || 0}%)
              </Text>
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
          <Text style={styles.emptyStateText}>Nenhum doce cadastrado.</Text>
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
  costSubValue: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2,
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  profileBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  profitBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.white,
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
