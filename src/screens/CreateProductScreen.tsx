import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { useAppStore, ProductComponent } from '../store/useAppStore';
import { RootStackParamList } from '../navigation/types';

// Interface local para a tela antes de salvar
interface LocalComponent {
  id: string;
  componentId: string;
  name: string;
  type: 'ingredient' | 'recipe' | 'packaging';
  usedQuantity: string;
  costPerUnit: number;
  unit: string;
}

type CreateProductRouteProp = RouteProp<RootStackParamList, 'CreateProduct'>;

export default function CreateProductScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<CreateProductRouteProp>();
  const productId = route.params?.productId;

  // Dados globais
  const { ingredients, recipes, packagings, settings, addProduct, updateProduct, products } = useAppStore();

  // Estados do Produto
  const [productName, setProductName] = useState('');
  const [productionTimeMinutes, setProductionTimeMinutes] = useState('');
  const [components, setComponents] = useState<LocalComponent[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  // Variáveis de Configuração globais
  const totalHoursMonth = settings.hoursPerDay * settings.daysPerWeek * 4;
  const hourlyRate = totalHoursMonth > 0 ? (settings.salary / totalHoursMonth) : 0;
  const fixedCostsPercent = settings.fixedCostsPercent;
  const profitMarginPercent = settings.profitMarginPercent;

  // Montar lista combinada para o Modal (Receitas + Ingredientes + Embalagens)
  const availableOptions = [
    ...recipes.map(r => {
      // Calcular o custo real da receita
      const totalRcpCost = r.items.reduce((acc, item) => {
        const ing = ingredients.find(i => i.id === item.ingredientId);
        const costPerG = ing && ing.quantity > 0 ? (ing.price / ing.quantity) : 0;
        return acc + (costPerG * item.usedQuantity);
      }, 0);
      const costPerUnit = r.yieldQuantity > 0 ? (totalRcpCost / r.yieldQuantity) : 0;

      return {
        id: r.id,
        name: r.name,
        type: 'recipe' as const,
        costPerUnit: costPerUnit,
        unit: r.yieldUnit
      };
    }),
    ...ingredients.map(i => ({
      id: i.id,
      name: i.name,
      type: 'ingredient' as const,
      costPerUnit: i.quantity > 0 ? (i.price / i.quantity) : 0,
      unit: i.unit
    })),
    ...packagings.map(p => ({
      id: p.id,
      name: p.name,
      type: 'packaging' as const,
      costPerUnit: p.quantity > 0 ? (p.price / p.quantity) : 0,
      unit: p.unit
    }))
  ];

  // Carregar dados se for edição
  useEffect(() => {
    if (productId) {
      const existingProduct = products.find(p => p.id === productId);
      if (existingProduct) {
        setProductName(existingProduct.name);
        setProductionTimeMinutes(existingProduct.productionTimeMinutes.toString().replace('.', ','));

        const loadedComponents = existingProduct.components.map(comp => {
          let name = 'Item removido';
          let costPerUnit = 0;
          let unit = 'un';

          if (comp.type === 'ingredient') {
            const ing = ingredients.find(i => i.id === comp.componentId);
            if (ing) {
              name = ing.name;
              unit = ing.unit;
              costPerUnit = ing.quantity > 0 ? (ing.price / ing.quantity) : 0;
            }
          } else if (comp.type === 'packaging') {
            const pkg = packagings.find(p => p.id === comp.componentId);
            if (pkg) {
              name = pkg.name;
              unit = pkg.unit;
              costPerUnit = pkg.quantity > 0 ? (pkg.price / pkg.quantity) : 0;
            }
          } else if (comp.type === 'recipe') {
            const recipe = recipes.find(r => r.id === comp.componentId);
            if (recipe) {
              name = recipe.name;
              unit = recipe.yieldUnit;
              const recipeTotalCost = recipe.items.reduce((rcpAcc, rcpItem) => {
                const rcpIng = ingredients.find(i => i.id === rcpItem.ingredientId);
                const rcpCostPerUnit = rcpIng && rcpIng.quantity > 0 ? rcpIng.price / rcpIng.quantity : 0;
                return rcpAcc + (rcpCostPerUnit * rcpItem.usedQuantity);
              }, 0);
              costPerUnit = recipe.yieldQuantity > 0 ? (recipeTotalCost / recipe.yieldQuantity) : 0;
            }
          }

          return {
            id: comp.id,
            componentId: comp.componentId,
            name,
            type: comp.type,
            usedQuantity: comp.usedQuantity.toString().replace('.', ','),
            costPerUnit,
            unit
          };
        });

        setComponents(loadedComponents);
      }
    }
  }, [productId, products, ingredients, recipes]);

  // Cálculos Automáticos
  const materialCost = components.reduce((total, item) => {
    const qty = parseFloat(item.usedQuantity.replace(',', '.')) || 0;
    return total + (qty * item.costPerUnit);
  }, 0);

  const timeMinutes = parseFloat(productionTimeMinutes.replace(',', '.')) || 0;
  const laborCost = (timeMinutes / 60) * hourlyRate;
  
  const directCost = materialCost + laborCost;
  const fixedCostValue = directCost * (fixedCostsPercent / 100);
  const totalCost = directCost + fixedCostValue;

  const suggestedPrice = totalCost > 0 ? (totalCost / (1 - (profitMarginPercent / 100))) : 0;
  const actualProfit = suggestedPrice - totalCost;

  const handleAddComponent = (comp: typeof availableOptions[0]) => {
    const newItem: LocalComponent = {
      id: Date.now().toString(),
      componentId: comp.id,
      name: comp.name,
      type: comp.type,
      usedQuantity: comp.unit === 'un' ? '1' : '', 
      costPerUnit: comp.costPerUnit,
      unit: comp.unit
    };
    setComponents([...components, newItem]);
    setModalVisible(false);
  };

  const updateItemQuantity = (id: string, text: string) => {
    setComponents(items => 
      items.map(item => item.id === id ? { ...item, usedQuantity: text } : item)
    );
  };

  const removeItem = (id: string) => {
    setComponents(items => items.filter(item => item.id !== id));
  };

  const handleSaveProduct = () => {
    if (!productName.trim() || !productionTimeMinutes.trim()) {
      Alert.alert('Atenção', 'Preencha o nome do produto e o tempo de montagem.');
      return;
    }

    if (components.length === 0) {
      Alert.alert('Atenção', 'Adicione pelo menos um componente ao produto.');
      return;
    }

    const formattedComponents: ProductComponent[] = components.map(c => ({
      id: c.id,
      componentId: c.componentId,
      type: c.type,
      usedQuantity: parseFloat(c.usedQuantity.replace(',', '.')) || 0
    }));

    const hasZeroQuantity = formattedComponents.some(c => c.usedQuantity <= 0);
    if (hasZeroQuantity) {
       Alert.alert('Atenção', 'Existem componentes com quantidade zero.');
       return;
    }

    if (productId) {
      updateProduct(productId, {
        name: productName,
        productionTimeMinutes: timeMinutes,
        components: formattedComponents
      });
      Alert.alert('Sucesso', 'Produto atualizado com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } else {
      addProduct({
        name: productName,
        productionTimeMinutes: timeMinutes,
        components: formattedComponents
      });
      Alert.alert('Sucesso', 'Produto salvo com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{productId ? 'Editar Produto Final' : 'Novo Produto Final'}</Text>
        <View style={{ width: 28 }} /> 
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.card}>
            <Text style={styles.label}>Nome do Produto</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Bolo de Pote Ninho com Nutella"
              value={productName}
              onChangeText={setProductName}
            />

            <Text style={styles.label}>Tempo de Montagem (Minutos)</Text>
            <Text style={styles.helperText}>Tempo gasto para montar 1 unidade.</Text>
            <TextInput
              style={[styles.input, { marginBottom: 0 }]}
              placeholder="Ex: 5"
              keyboardType="numeric"
              value={productionTimeMinutes}
              onChangeText={setProductionTimeMinutes}
            />
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Conteúdo (Comestível)</Text>
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <MaterialCommunityIcons name="plus-circle" size={28} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>Massas, recheios e ingredientes adicionais.</Text>

            {components.filter(c => c.type === 'ingredient' || c.type === 'recipe').length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="pot-mix" size={40} color={colors.muted} />
                <Text style={styles.emptyText}>Nenhum conteúdo adicionado.</Text>
              </View>
            ) : (
              components.filter(c => c.type === 'ingredient' || c.type === 'recipe').map((item) => {
                const qty = parseFloat(item.usedQuantity.replace(',', '.')) || 0;
                const itemCost = qty * item.costPerUnit;

                return (
                  <View key={item.id} style={styles.ingredientRow}>
                    <View style={styles.ingredientInfo}>
                      <Text style={styles.ingredientName}>{item.name}</Text>
                      <Text style={styles.ingredientCost}>R$ {itemCost.toFixed(2).replace('.', ',')}</Text>
                    </View>
                    
                    <View style={styles.qtyContainer}>
                      <TextInput
                        style={styles.qtyInput}
                        placeholder="0"
                        keyboardType="numeric"
                        value={item.usedQuantity}
                        onChangeText={(text) => updateItemQuantity(item.id, text)}
                      />
                      <Text style={styles.qtyUnit}>{item.unit}</Text>
                    </View>

                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(item.id)}>
                      <MaterialCommunityIcons name="close-circle" size={24} color={colors.muted} />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}

            <View style={styles.divider} />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Embalagens e Extras</Text>
            </View>
            <Text style={styles.helperText}>Potes, colheres, adesivos e fitas.</Text>

            {components.filter(c => c.type === 'packaging').length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="package-variant" size={40} color={colors.muted} />
                <Text style={styles.emptyText}>Nenhuma embalagem adicionada.</Text>
              </View>
            ) : (
              components.filter(c => c.type === 'packaging').map((item) => {
                const qty = parseFloat(item.usedQuantity.replace(',', '.')) || 0;
                const itemCost = qty * item.costPerUnit;

                return (
                  <View key={item.id} style={styles.ingredientRow}>
                    <View style={styles.ingredientInfo}>
                      <Text style={styles.ingredientName}>{item.name}</Text>
                      <Text style={styles.ingredientCost}>R$ {itemCost.toFixed(2).replace('.', ',')}</Text>
                    </View>
                    
                    <View style={styles.qtyContainer}>
                      <TextInput
                        style={styles.qtyInput}
                        placeholder="0"
                        keyboardType="numeric"
                        value={item.usedQuantity}
                        onChangeText={(text) => updateItemQuantity(item.id, text)}
                      />
                      <Text style={styles.qtyUnit}>{item.unit}</Text>
                    </View>

                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(item.id)}>
                      <MaterialCommunityIcons name="close-circle" size={24} color={colors.muted} />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>

          {/* Área Mágica da Precificação */}
          <View style={styles.pricingCard}>
            <View style={styles.pricingHeader}>
              <MaterialCommunityIcons name="calculator" size={24} color={colors.white} />
              <Text style={styles.pricingTitle}>Calculadora de Preço</Text>
            </View>
            
            <View style={styles.pricingBody}>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Material (Ingred. + Receitas)</Text>
                <Text style={styles.calcValue}>R$ {materialCost.toFixed(2).replace('.', ',')}</Text>
              </View>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Mão de Obra ({timeMinutes} min)</Text>
                <Text style={styles.calcValue}>R$ {laborCost.toFixed(2).replace('.', ',')}</Text>
              </View>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Custos Fixos ({fixedCostsPercent}%)</Text>
                <Text style={styles.calcValue}>R$ {fixedCostValue.toFixed(2).replace('.', ',')}</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.calcRow}>
                <Text style={styles.totalLabel}>Custo Total</Text>
                <Text style={styles.totalValue}>R$ {totalCost.toFixed(2).replace('.', ',')}</Text>
              </View>

              <View style={styles.suggestedPriceBox}>
                <Text style={styles.suggestedLabel}>Preço de Venda Sugerido</Text>
                <Text style={styles.suggestedValue}>R$ {suggestedPrice.toFixed(2).replace('.', ',')}</Text>
                <Text style={styles.profitText}>
                  Lucro líquido: R$ {actualProfit.toFixed(2).replace('.', ',')} ({profitMarginPercent}%)
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.saveButton} 
            activeOpacity={0.8}
            onPress={handleSaveProduct}
          >
            <Text style={styles.saveButtonText}>Salvar Produto</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de Seleção (Receitas + Ingredientes) */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar Componente</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {availableOptions.length === 0 ? (
                <Text style={{ textAlign: 'center', color: colors.text, opacity: 0.6, marginTop: 20 }}>
                  Cadastre ingredientes ou receitas primeiro!
                </Text>
              ) : (
                availableOptions.map((comp) => (
                  <TouchableOpacity 
                    key={comp.id} 
                    style={styles.modalItem}
                    onPress={() => handleAddComponent(comp)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalItemName}>{comp.name}</Text>
                      <Text style={styles.modalItemType}>
                        {comp.type === 'recipe' ? 'Receita Base' : 'Ingrediente/Embalagem'}
                      </Text>
                    </View>
                    <Text style={styles.modalItemCost}>
                      R$ {comp.costPerUnit.toFixed(3)}/{comp.unit}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.muted,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  helperText: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.6,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.muted,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    color: colors.text,
    opacity: 0.5,
    marginTop: 8,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  ingredientCost: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
    marginTop: 2,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.muted,
    paddingHorizontal: 8,
    marginRight: 12,
    width: 70,
  },
  qtyInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 15,
    textAlign: 'center',
  },
  qtyUnit: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.6,
  },
  removeBtn: {
    padding: 4,
  },
  pricingCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    overflow: 'hidden',
  },
  pricingHeader: {
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  pricingTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  pricingBody: {
    padding: 16,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calcLabel: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.8,
  },
  calcValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.muted,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  suggestedPriceBox: {
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  suggestedLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    color: colors.text,
    opacity: 0.7,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  suggestedValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  profitText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  saveButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.muted,
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  modalItemType: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.5,
    marginTop: 2,
  },
  modalItemCost: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.8,
  },
});

