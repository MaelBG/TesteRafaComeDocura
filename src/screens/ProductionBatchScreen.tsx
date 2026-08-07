import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  FlatList
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppStore, ProductionBatchItem, ProductionBatch } from '../store/useAppStore';
import { usePricing } from '../hooks/usePricing';
import { useStock } from '../hooks/useStock';

export default function ProductionBatchScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { products, recipes, productionBatches, addProductionBatch, removeProductionBatch } = useAppStore();
  const { calculateBatchBalance } = usePricing();
  const { deductProductStock, deductRecipeStock } = useStock();

  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [batchTitle, setBatchTitle] = useState('Fornada do Dia');
  
  // Quantidades selecionadas por produto ou receita { targetId: quantity }
  const [selectedQuantities, setSelectedQuantities] = useState<{ [key: string]: number }>({});

  const handleUpdateQuantity = (targetId: string, delta: number) => {
    const current = selectedQuantities[targetId] || 0;
    const next = Math.max(0, current + delta);
    setSelectedQuantities({
      ...selectedQuantities,
      [targetId]: next,
    });
  };

  // Monta a lista de items da fornada
  const currentBatchItems: ProductionBatchItem[] = [];
  products.forEach(p => {
    const qty = selectedQuantities[p.id] || 0;
    if (qty > 0) {
      currentBatchItems.push({
        targetId: p.id,
        type: 'product',
        name: p.name,
        quantity: qty,
      });
    }
  });

  recipes.forEach(r => {
    const qty = selectedQuantities[r.id] || 0;
    if (qty > 0) {
      currentBatchItems.push({
        targetId: r.id,
        type: 'recipe',
        name: r.name,
        quantity: qty,
      });
    }
  });

  const balance = calculateBatchBalance(currentBatchItems);

  const handleSaveAndDeduct = () => {
    if (currentBatchItems.length === 0) {
      Alert.alert('Atenção', 'Adicione pelo menos um doce ou receita à fornada.');
      return;
    }

    Alert.alert(
      'Salvar Fornada & Baixar Estoque',
      `Deseja registrar esta fornada ("${batchTitle}") e dar baixa automática em todos os ${balance.consumedIngredients.length} insumos consumidos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, registrar e baixar',
          onPress: () => {
            // 1. Grava a Fornada no Diário
            addProductionBatch({
              date: new Date().toISOString(),
              title: batchTitle.trim() || 'Fornada do Dia',
              items: currentBatchItems,
              consumedIngredients: balance.consumedIngredients,
              totalIngredientsCost: balance.totalIngredientsCost,
              totalPackagingCost: balance.totalPackagingCost,
              totalLaborCost: balance.totalLaborCost,
              totalFixedCost: balance.totalFixedCost,
              totalProductionCost: balance.totalProductionCost,
              totalEstimatedRevenue: balance.totalEstimatedRevenue,
              totalEstimatedProfit: balance.totalEstimatedProfit,
              totalHoursWorked: balance.totalHoursWorked,
            });

            // 2. Dá Baixa Atômica no Estoque
            currentBatchItems.forEach(item => {
              if (item.type === 'product') {
                deductProductStock(item.targetId, item.quantity);
              } else if (item.type === 'recipe') {
                deductRecipeStock(item.targetId, item.quantity);
              }
            });

            Alert.alert('Sucesso!', 'Fornada salva no Diário de Produção e despensa atualizada!');
            setSelectedQuantities({});
            setActiveTab('history');
          }
        }
      ]
    );
  };

  const renderHistoryItem = ({ item }: { item: ProductionBatch }) => {
    const formattedDate = new Date(item.date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.historyTitle}>{item.title}</Text>
            <Text style={styles.historyDate}>{formattedDate}</Text>
          </View>
          <TouchableOpacity 
            onPress={() => {
              Alert.alert('Excluir Registro', 'Deseja remover este registro do diário de produção?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Excluir', style: 'destructive', onPress: () => removeProductionBatch(item.id) }
              ]);
            }}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#E56B6F" />
          </TouchableOpacity>
        </View>

        <View style={styles.historyItemsList}>
          {item.items.map((prod, idx) => (
            <View key={idx} style={styles.historyItemRow}>
              <MaterialCommunityIcons 
                name={prod.type === 'product' ? 'cupcake' : 'pot-mix'} 
                size={14} 
                color={colors.primary} 
                style={{ marginRight: 6 }} 
              />
              <Text style={styles.historyItemText}>{prod.name}</Text>
              <Text style={styles.historyItemQty}>{prod.quantity}x</Text>
            </View>
          ))}
        </View>

        <View style={styles.historySummaryGrid}>
          <View style={styles.historyStatCol}>
            <Text style={styles.historyStatLabel}>Custo Total</Text>
            <Text style={styles.historyStatValue}>R$ {item.totalProductionCost.toFixed(2).replace('.', ',')}</Text>
          </View>
          <View style={styles.historyStatCol}>
            <Text style={styles.historyStatLabel}>Faturamento Est.</Text>
            <Text style={styles.historyStatValue}>R$ {item.totalEstimatedRevenue.toFixed(2).replace('.', ',')}</Text>
          </View>
          <View style={styles.historyStatCol}>
            <Text style={styles.historyStatLabel}>Lucro Limpo</Text>
            <Text style={[styles.historyStatValue, { color: '#27AE60' }]}>
              + R$ {item.totalEstimatedProfit.toFixed(2).replace('.', ',')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header com Safe Area */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Balanço da Fornada</Text>
          <View style={{ width: 32 }} />
        </View>
      </View>

      {/* Segment Selector Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'current' && styles.tabButtonActive]}
          onPress={() => setActiveTab('current')}
        >
          <MaterialCommunityIcons 
            name="scale-balance" 
            size={18} 
            color={activeTab === 'current' ? colors.primary : colors.textMuted} 
            style={{ marginRight: 6 }} 
          />
          <Text style={[styles.tabButtonText, activeTab === 'current' && styles.tabButtonTextActive]}>
            Nova Fornada do Dia
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
          onPress={() => setActiveTab('history')}
        >
          <MaterialCommunityIcons 
            name="history" 
            size={18} 
            color={activeTab === 'history' ? colors.primary : colors.textMuted} 
            style={{ marginRight: 6 }} 
          />
          <Text style={[styles.tabButtonText, activeTab === 'history' && styles.tabButtonTextActive]}>
            Diário de Produção ({productionBatches.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'history' ? (
        <View style={{ flex: 1 }}>
          {productionBatches.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={60} color={colors.muted} />
              <Text style={styles.emptyTitle}>Nenhuma fornada gravada ainda.</Text>
              <Text style={styles.emptySub}>Monte sua primeira fornada na aba "Nova Fornada do Dia".</Text>
            </View>
          ) : (
            <FlatList
              data={productionBatches}
              keyExtractor={(item) => item.id}
              renderItem={renderHistoryItem}
              contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            />
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Identificação da Fornada */}
          <View style={styles.titleInputCard}>
            <Text style={styles.inputLabel}>Título / Identificação da Fornada</Text>
            <TextInput
              style={styles.titleInput}
              value={batchTitle}
              onChangeText={setBatchTitle}
              placeholder="Ex: Produção de Sexta-feira"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Hero Balanço Financeiro da Fornada */}
          <View style={styles.balanceHeroCard}>
            <View style={styles.heroTopRow}>
              <View>
                <Text style={styles.heroSubtitle}>Faturamento Estimado</Text>
                <Text style={styles.heroRevenueValue}>
                  R$ {balance.totalEstimatedRevenue.toFixed(2).replace('.', ',')}
                </Text>
              </View>
              <View style={styles.heroProfitBadge}>
                <Text style={styles.heroProfitLabel}>Lucro Limpo Estimado</Text>
                <Text style={styles.heroProfitValue}>
                  + R$ {balance.totalEstimatedProfit.toFixed(2).replace('.', ',')}
                </Text>
              </View>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroMetricsGrid}>
              <View style={styles.heroMetricCol}>
                <Text style={styles.heroMetricLabel}>Insumos & Emb.</Text>
                <Text style={styles.heroMetricValue}>
                  R$ {(balance.totalIngredientsCost + balance.totalPackagingCost).toFixed(2).replace('.', ',')}
                </Text>
              </View>
              <View style={styles.heroMetricCol}>
                <Text style={styles.heroMetricLabel}>Mão de Obra</Text>
                <Text style={styles.heroMetricValue}>
                  R$ {balance.totalLaborCost.toFixed(2).replace('.', ',')} ({balance.totalHoursWorked.toFixed(1)}h)
                </Text>
              </View>
              <View style={styles.heroMetricCol}>
                <Text style={styles.heroMetricLabel}>Custo Total</Text>
                <Text style={styles.heroMetricValue}>
                  R$ {balance.totalProductionCost.toFixed(2).replace('.', ',')}
                </Text>
              </View>
            </View>
          </View>

          {/* Seletor de Doces para a Fornada */}
          <Text style={styles.sectionHeaderTitle}>1. Escolha os Doces Produzidos</Text>
          <View style={styles.selectionCard}>
            {products.length === 0 ? (
              <Text style={styles.emptySectionText}>Nenhum doce cadastrado ainda no Catálogo.</Text>
            ) : (
              products.map((product) => {
                const qty = selectedQuantities[product.id] || 0;
                return (
                  <View key={product.id} style={styles.selectionRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectionName}>{product.name}</Text>
                      <Text style={styles.selectionSub}>Lote padrão: {product.batchYieldQuantity || 1} un</Text>
                    </View>
                    <View style={styles.counterContainer}>
                      <TouchableOpacity 
                        style={styles.counterBtn}
                        onPress={() => handleUpdateQuantity(product.id, -(product.batchYieldQuantity || 1))}
                      >
                        <MaterialCommunityIcons name="minus" size={18} color={colors.primary} />
                      </TouchableOpacity>
                      <Text style={styles.counterValue}>{qty}</Text>
                      <TouchableOpacity 
                        style={styles.counterBtn}
                        onPress={() => handleUpdateQuantity(product.id, (product.batchYieldQuantity || 1))}
                      >
                        <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Lista Detalhada de Insumos Gastos */}
          <Text style={styles.sectionHeaderTitle}>2. Insumos & Embalagens Gastos</Text>
          <View style={styles.ingredientsCard}>
            {balance.consumedIngredients.length === 0 ? (
              <Text style={styles.emptySectionText}>
                Selecione doces ou receitas acima para calcular o consumo de estoque.
              </Text>
            ) : (
              balance.consumedIngredients.map((item, idx) => (
                <View key={idx} style={[styles.consumedRow, idx !== balance.consumedIngredients.length - 1 && styles.consumedDivider]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.consumedName}>{item.name}</Text>
                    <View style={styles.consumedMetaRow}>
                      {item.brand ? (
                        <View style={styles.brandBadge}>
                          <Text style={styles.brandBadgeText}>Marca: {item.brand}</Text>
                        </View>
                      ) : null}
                      <Text style={styles.consumedGrams}>
                        {item.totalGramsOrUnits.toFixed(0)} {item.packageUnit} ({item.packagesUsed} pct/lata)
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.consumedCost}>R$ {item.totalCost.toFixed(2).replace('.', ',')}</Text>
                </View>
              ))
            )}
          </View>

          {/* Botão de Gravação e Baixa no Estoque */}
          <TouchableOpacity 
            style={[styles.primaryActionBtn, currentBatchItems.length === 0 && styles.primaryActionBtnDisabled]}
            activeOpacity={0.8}
            onPress={handleSaveAndDeduct}
          >
            <MaterialCommunityIcons name="check-decagram" size={22} color={colors.white} style={{ marginRight: 8 }} />
            <Text style={styles.primaryActionBtnText}>Salvar Fornada & Dar Baixa no Estoque</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: colors.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabButtonTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
  },
  titleInputCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  titleInput: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    paddingVertical: 4,
  },
  balanceHeroCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroSubtitle: {
    fontSize: 13,
    color: colors.white,
    opacity: 0.85,
    fontWeight: '600',
  },
  heroRevenueValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 2,
  },
  heroProfitBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'flex-end',
  },
  heroProfitLabel: {
    fontSize: 11,
    color: colors.white,
    fontWeight: 'bold',
  },
  heroProfitValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 2,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginVertical: 16,
  },
  heroMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroMetricCol: {
    flex: 1,
  },
  heroMetricLabel: {
    fontSize: 11,
    color: colors.white,
    opacity: 0.8,
  },
  heroMetricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 2,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
    marginLeft: 4,
  },
  selectionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectionName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
  },
  selectionSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  counterBtn: {
    padding: 6,
  },
  counterValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
    minWidth: 32,
    textAlign: 'center',
  },
  ingredientsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  consumedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  consumedDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  consumedName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  consumedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  brandBadge: {
    backgroundColor: '#E6F4F8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  brandBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1A5B70',
  },
  consumedGrams: {
    fontSize: 12,
    color: colors.textMuted,
  },
  consumedCost: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  emptySectionText: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  primaryActionBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  primaryActionBtnDisabled: {
    opacity: 0.5,
  },
  primaryActionBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },
  historyCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  historyDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  historyItemsList: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  historyItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  historyItemText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  historyItemQty: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.primary,
  },
  historySummaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  historyStatCol: {
    flex: 1,
  },
  historyStatLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  historyStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 2,
  },
});
