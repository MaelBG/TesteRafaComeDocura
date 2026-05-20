import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAppStore, Sale } from '../store/useAppStore';

export default function SalesScreen() {
  const { sales, addSale, removeSale, products, ingredients, packagings, recipes, settings } = useAppStore();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('');
  const [salePrice, setSalePrice] = useState('');

  // Calcula o custo total de um produto na hora da venda para calcularmos o lucro
  const getProductTotalCost = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;

    const totalHoursMonth = settings.hoursPerDay * settings.daysPerWeek * 4;
    const hourlyRate = totalHoursMonth > 0 ? (settings.salary / totalHoursMonth) : 0;

    const materialCost = product.components.reduce((acc, comp) => {
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
      return acc + (costPerUnit * comp.usedQuantity);
    }, 0);

    const laborCost = (product.productionTimeMinutes / 60) * hourlyRate;
    const directCost = materialCost + laborCost;
    const fixedCostValue = directCost * (settings.fixedCostsPercent / 100);
    return directCost + fixedCostValue;
  };

  const handleSave = () => {
    if (!selectedProductId || !quantity || !salePrice) {
      Alert.alert('Erro', 'Preencha todos os campos!');
      return;
    }

    const parsedQuantity = parseInt(quantity, 10);
    const parsedPrice = parseFloat(salePrice.replace(',', '.'));

    if (isNaN(parsedQuantity) || isNaN(parsedPrice) || parsedQuantity <= 0) {
      Alert.alert('Erro', 'Valores inválidos!');
      return;
    }

    addSale({
      productId: selectedProductId,
      quantity: parsedQuantity,
      salePrice: parsedPrice,
      date: new Date().toISOString(),
    });
    
    closeModal();
  };

  const handleRemove = (id: string) => {
    Alert.alert(
      "Cancelar Venda",
      "Tem certeza que deseja apagar este registro de venda?",
      [
        { text: "Não", style: "cancel" },
        { text: "Sim, apagar", style: "destructive", onPress: () => removeSale(id) }
      ]
    );
  };

  const openNewModal = () => {
    setSelectedProductId(null);
    setQuantity('');
    setSalePrice('');
    setModalVisible(true);
  };

  const closeModal = () => {
    setSelectedProductId(null);
    setQuantity('');
    setSalePrice('');
    setModalVisible(false);
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    // Sugere o preço calculado ao selecionar o produto
    const totalCost = getProductTotalCost(productId);
    const suggestedPrice = totalCost > 0 ? (totalCost / (1 - (settings.profitMarginPercent / 100))) : 0;
    setSalePrice(suggestedPrice.toFixed(2).replace('.', ','));
  };

  const renderItem = ({ item }: { item: Sale }) => {
    const product = products.find(p => p.id === item.productId);
    const productName = product ? product.name : 'Produto Excluído';
    
    const totalRevenue = item.salePrice * item.quantity;
    const unitCost = product ? getProductTotalCost(product.id) : 0;
    const totalCost = unitCost * item.quantity;
    const profit = totalRevenue - totalCost;
    
    const dateFormatted = new Date(item.date).toLocaleDateString('pt-BR');

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>{productName}</Text>
            <Text style={styles.dateText}>{dateFormatted} - {item.quantity} unidades</Text>
          </View>
          <TouchableOpacity style={styles.iconButton} onPress={() => handleRemove(item.id)}>
            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Faturamento:</Text>
            <Text style={styles.infoValue}>R$ {totalRevenue.toFixed(2).replace('.', ',')}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Lucro Líquido:</Text>
            <Text style={[styles.infoValue, { color: profit >= 0 ? '#4CAF50' : '#FF6B6B' }]}>
              R$ {profit.toFixed(2).replace('.', ',')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {sales.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="cash-register" size={60} color={colors.muted} />
          <Text style={styles.emptyStateText}>Nenhuma venda registrada.</Text>
          <Text style={styles.emptyStateSub}>Registre suas encomendas para ver o faturamento.</Text>
        </View>
      ) : (
        <FlatList
          data={sales}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity 
        style={styles.fab}
        activeOpacity={0.8}
        onPress={openNewModal}
      >
        <MaterialCommunityIcons name="plus" size={30} color={colors.white} />
      </TouchableOpacity>

      {/* Modal de Registro de Venda */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView 
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Registrar Venda</Text>
                <TouchableOpacity onPress={closeModal}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Selecione o Produto</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.productsScroll}
                contentContainerStyle={{ paddingRight: 20 }}
              >
                {products.length === 0 ? (
                  <Text style={{ color: colors.muted, fontStyle: 'italic', marginTop: 10 }}>
                    Cadastre um produto final primeiro.
                  </Text>
                ) : (
                  products.map(p => (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.productChip,
                        selectedProductId === p.id && styles.productChipSelected
                      ]}
                      onPress={() => handleSelectProduct(p.id)}
                    >
                      <Text style={[
                        styles.productChipText,
                        selectedProductId === p.id && styles.productChipTextSelected
                      ]}>
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>

              <View style={styles.row}>
                <View style={[styles.inputContainer, { marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Qtd. Vendida</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 5"
                    keyboardType="numeric"
                    value={quantity}
                    onChangeText={setQuantity}
                  />
                </View>
                
                <View style={[styles.inputContainer, { marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Preço Unitário (R$)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 12,50"
                    keyboardType="numeric"
                    value={salePrice}
                    onChangeText={setSalePrice}
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.saveButton, !selectedProductId && { opacity: 0.5 }]}
                activeOpacity={0.8}
                onPress={handleSave}
                disabled={!selectedProductId}
              >
                <Text style={styles.saveButtonText}>Confirmar Venda</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
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
    padding: 16,
    marginBottom: 12,
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.muted,
    paddingBottom: 8,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  dateText: {
    fontSize: 13,
    color: colors.text,
    opacity: 0.6,
    marginTop: 2,
  },
  iconButton: {
    padding: 4,
  },
  cardBody: {
    flexDirection: 'column',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 15,
    color: colors.text,
    opacity: 0.8,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
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
  inputLabel: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.muted,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  productsScroll: {
    flexDirection: 'row',
    marginBottom: 16,
    maxHeight: 50,
  },
  productChip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.muted,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    justifyContent: 'center',
  },
  productChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  productChipText: {
    color: colors.text,
    fontSize: 14,
  },
  productChipTextSelected: {
    color: colors.white,
    fontWeight: 'bold',
  },
});
