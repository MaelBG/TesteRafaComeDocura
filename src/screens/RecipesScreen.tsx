import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppStore, Recipe } from '../store/useAppStore';
import { usePricing } from '../hooks/usePricing';
import { useStock } from '../hooks/useStock';

export default function RecipesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { recipes, removeRecipe, ingredients } = useAppStore();
  const { getRecipeTotalCost } = usePricing();
  const { deductRecipeStock } = useStock();

  // Estados para o Modo Produção
  const [productionModalVisible, setProductionModalVisible] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [multiplier, setProductionMultiplier] = useState('1');
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  const handleRemove = (id: string) => {
    Alert.alert(
      "Excluir Receita",
      "Tem certeza que deseja apagar esta preparação?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: () => removeRecipe(id) }
      ]
    );
  };

  const openProductionMode = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setProductionMultiplier('1');
    setCheckedItems([]);
    setProductionModalVisible(true);
  };

  const toggleCheckItem = (id: string) => {
    if (checkedItems.includes(id)) {
      setCheckedItems(checkedItems.filter(i => i !== id));
    } else {
      setCheckedItems([...checkedItems, id]);
    }
  };

  const handleFinishProduction = () => {
    if (!selectedRecipe) return;

    Alert.alert(
      "Finalizar Produção",
      "Deseja dar baixa automática desses ingredientes no seu estoque atual?",
      [
        { text: "Não, apenas fechar", style: "cancel", onPress: () => setProductionModalVisible(false) },
        { 
          text: "Sim, dar baixa", 
          onPress: () => {
            const m = parseFloat(multiplier.replace(',', '.')) || 1;
            deductRecipeStock(selectedRecipe.id, m);
            Alert.alert("Sucesso", "Produção finalizada e estoque atualizado!");
            setProductionModalVisible(false);
          } 
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Recipe }) => {
    const totalCost = getRecipeTotalCost(item.id) || 0;
    const unitCost = item.yieldQuantity > 0 ? totalCost / item.yieldQuantity : 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="pot-mix" size={14} color={colors.text} style={{ opacity: 0.6, marginRight: 4 }} />
              <Text style={styles.yieldText}>Rende: {item.yieldQuantity}{item.yieldUnit}</Text>
            </View>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('CreateRecipe', { recipeId: item.id })}>
              <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => handleRemove(item.id)}>
              <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.cardBody}>
          <View style={styles.costInfo}>
            <Text style={styles.costLabel}>Custo Total</Text>
            <Text style={styles.costValue}>R$ {totalCost.toFixed(2).replace('.', ',')}</Text>
          </View>
          <View style={styles.costDivider} />
          <View style={styles.costInfo}>
            <Text style={styles.costLabel}>Custo por {item.yieldUnit}</Text>
            <Text style={styles.costValue}>R$ {unitCost.toFixed(3).replace('.', ',')}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.productionModeBtn}
          activeOpacity={0.8}
          onPress={() => openProductionMode(item)}
        >
          <MaterialCommunityIcons name="chef-hat" size={20} color={colors.white} style={{ marginRight: 8 }} />
          <Text style={styles.productionModeBtnText}>Modo Produção (Escalar)</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {recipes.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="notebook-outline" size={60} color={colors.muted} />
          <Text style={styles.emptyStateText}>Nenhuma receita base criada.</Text>
          <Text style={styles.emptyStateSub}>Clique no + para misturar ingredientes.</Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB para Nova Receita */}
      <TouchableOpacity 
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('CreateRecipe')}
      >
        <MaterialCommunityIcons name="plus" size={30} color={colors.white} />
      </TouchableOpacity>

      {/* Modal Modo Produção */}
      <Modal
        visible={productionModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setProductionModalVisible(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setProductionModalVisible(false)} style={styles.modalCloseBtn}>
              <MaterialCommunityIcons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Preparar Agora</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.recipeScaleBox}>
              <Text style={styles.recipeNameHeader}>{selectedRecipe?.name}</Text>
              
              <View style={styles.scaleInputRow}>
                <Text style={styles.scaleLabel}>Quantas vezes deseja fazer?</Text>
                <View style={styles.multiplierInputContainer}>
                   <TextInput
                    style={styles.multiplierInput}
                    keyboardType="numeric"
                    value={multiplier}
                    onChangeText={setProductionMultiplier}
                    placeholder="1"
                   />
                   <Text style={styles.multiplierSuffix}>x</Text>
                </View>
              </View>

              <View style={styles.yieldScaleInfo}>
                <MaterialCommunityIcons name="scale-balance" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={styles.yieldScaleText}>
                  Rendimento Final: {((selectedRecipe?.yieldQuantity || 0) * (parseFloat(multiplier.replace(',', '.')) || 1)).toFixed(0)}{selectedRecipe?.yieldUnit}
                </Text>
              </View>
            </View>

            <Text style={styles.checklistTitle}>Checklist de Ingredientes</Text>
            
            {selectedRecipe?.items.map((item) => {
              const ing = ingredients.find(i => i.id === item.ingredientId);
              const m = parseFloat(multiplier.replace(',', '.')) || 1;
              const scaledQty = (item.usedQuantity || 0) * m;
              const isChecked = checkedItems.includes(item.id);

              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.checkItem, isChecked && styles.checkItemDisabled]}
                  onPress={() => toggleCheckItem(item.id)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons 
                    name={isChecked ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} 
                    size={28} 
                    color={isChecked ? colors.primary : colors.muted} 
                  />
                  <View style={styles.checkItemInfo}>
                    <Text style={[styles.checkItemName, isChecked && styles.textStrikethrough]}>
                      {ing?.name || 'Item Removido'}
                    </Text>
                    <Text style={[styles.checkItemQty, isChecked && styles.textStrikethrough]}>
                      {scaledQty.toFixed(0).replace('.', ',')}g
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity 
              style={[styles.finishBtn, checkedItems.length < (selectedRecipe?.items.length || 0) && styles.finishBtnDisabled]}
              onPress={handleFinishProduction}
            >
              <Text style={styles.finishBtnText}>Finalizar e Dar Baixa</Text>
            </TouchableOpacity>
            
            <View style={{ height: 40 }} />
          </ScrollView>
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
  yieldText: {
    fontSize: 13,
    color: colors.text,
    opacity: 0.6,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 6,
    marginLeft: 4,
  },
  cardBody: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  costInfo: {
    flex: 1,
  },
  costDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.muted,
    marginHorizontal: 12,
  },
  costLabel: {
    fontSize: 11,
    color: colors.text,
    opacity: 0.7,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  costValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  productionModeBtn: {
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  productionModeBtnText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
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
  // Estilos do Modal de Produção
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.muted,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalScroll: {
    flex: 1,
    padding: 20,
  },
  recipeScaleBox: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    elevation: 2,
  },
  recipeNameHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  scaleInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scaleLabel: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  multiplierInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    width: 80,
  },
  multiplierInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: colors.primary,
  },
  multiplierSuffix: {
    fontSize: 16,
    color: colors.muted,
    fontWeight: 'bold',
  },
  yieldScaleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: 8,
    borderRadius: 8,
  },
  yieldScaleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  checklistTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    marginLeft: 4,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 1,
  },
  checkItemDisabled: {
    opacity: 0.5,
    backgroundColor: '#f9f9f9',
  },
  checkItemInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkItemName: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.text,
  },
  checkItemQty: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  textStrikethrough: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  finishBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
  },
  finishBtnDisabled: {
    backgroundColor: colors.muted,
    opacity: 0.5,
  },
  finishBtnText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
