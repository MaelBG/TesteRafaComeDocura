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
import { useAppStore, Ingredient, RecipeItem } from '../store/useAppStore';
import { RootStackParamList } from '../navigation/types';

// Interface local apenas para gerenciar o estado da tela antes de salvar
interface LocalRecipeItem {
  id: string; // ID único para a linha na receita
  ingredientId: string;
  name: string;
  usedQuantity: string; // Mantido como string para o TextInput
  costPerUnit: number;
}

type CreateRecipeRouteProp = RouteProp<RootStackParamList, 'CreateRecipe'>;

export default function CreateRecipeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<CreateRecipeRouteProp>();
  const recipeId = route.params?.recipeId;
  
  // Pegando dados e ações do Zustand
  const { ingredients, recipes, addRecipe, updateRecipe } = useAppStore();

  // Estados principais da Receita
  const [recipeName, setRecipeName] = useState('');
  const [recipeYield, setRecipeYield] = useState('');
  const [recipeItems, setRecipeItems] = useState<LocalRecipeItem[]>([]);

  // Estados do Modal de Seleção de Ingrediente
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (recipeId) {
      const existingRecipe = recipes.find(r => r.id === recipeId);
      if (existingRecipe) {
        setRecipeName(existingRecipe.name);
        setRecipeYield(existingRecipe.yieldQuantity.toString().replace('.', ','));
        
        const loadedItems = existingRecipe.items.map(item => {
          const ing = ingredients.find(i => i.id === item.ingredientId);
          const costUnit = ing && ing.quantity > 0 ? ing.price / ing.quantity : 0;
          return {
            id: item.id,
            ingredientId: item.ingredientId,
            name: ing ? ing.name : 'Ingrediente removido',
            usedQuantity: item.usedQuantity.toString().replace('.', ','),
            costPerUnit: costUnit
          };
        });
        setRecipeItems(loadedItems);
      }
    }
  }, [recipeId, recipes, ingredients]);

  // Calcula o custo total da receita com base nos itens adicionados
  const totalRecipeCost = recipeItems.reduce((total, item) => {
    const qty = parseFloat(item.usedQuantity.replace(',', '.')) || 0;
    return total + (qty * item.costPerUnit);
  }, 0);

  // Custo por grama da receita final
  const parsedYield = parseFloat(recipeYield.replace(',', '.')) || 0;
  const costPerGram = parsedYield > 0 ? (totalRecipeCost / parsedYield) : 0;

  const handleAddIngredient = (ingredient: Ingredient) => {
    const costUnit = ingredient.quantity > 0 ? ingredient.price / ingredient.quantity : 0;
    
    const newItem: LocalRecipeItem = {
      id: Date.now().toString(),
      ingredientId: ingredient.id,
      name: ingredient.name,
      usedQuantity: '', // Começa vazio para o usuário preencher
      costPerUnit: costUnit,
    };

    setRecipeItems([...recipeItems, newItem]);
    setModalVisible(false);
  };

  const updateItemQuantity = (id: string, text: string) => {
    setRecipeItems(items => 
      items.map(item => item.id === id ? { ...item, usedQuantity: text } : item)
    );
  };

  const removeItem = (id: string) => {
    setRecipeItems(items => items.filter(item => item.id !== id));
  };

  const handleSaveRecipe = () => {
    if (!recipeName.trim() || !recipeYield.trim()) {
      Alert.alert('Atenção', 'Preencha o nome e o rendimento da receita.');
      return;
    }

    if (recipeItems.length === 0) {
      Alert.alert('Atenção', 'Adicione pelo menos um ingrediente à receita.');
      return;
    }

    // Valida e formata os itens para salvar no formato correto da store
    const formattedItems: RecipeItem[] = recipeItems.map(item => ({
      id: item.id,
      ingredientId: item.ingredientId,
      usedQuantity: parseFloat(item.usedQuantity.replace(',', '.')) || 0
    }));

    // Verifica se tem alguma quantidade zerada
    const hasZeroQuantity = formattedItems.some(item => item.usedQuantity <= 0);
    if (hasZeroQuantity) {
       Alert.alert('Atenção', 'Existem ingredientes com quantidade zero ou inválida.');
       return;
    }

    if (recipeId) {
      updateRecipe(recipeId, {
        name: recipeName,
        yieldQuantity: parsedYield,
        items: formattedItems
      });
      Alert.alert('Sucesso', 'Receita atualizada com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } else {
      addRecipe({
        name: recipeName,
        yieldQuantity: parsedYield,
        yieldUnit: 'g', // Fixo por enquanto, podendo evoluir
        items: formattedItems
      });
      Alert.alert('Sucesso', 'Receita salva com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Customizado com Voltar */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{recipeId ? 'Editar Receita Base' : 'Nova Receita Base'}</Text>
        <View style={{ width: 28 }} /> 
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Informações Básicas */}
          <View style={styles.card}>
            <Text style={styles.label}>Nome da Preparação</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Massa Amanteigada"
              value={recipeName}
              onChangeText={setRecipeName}
            />

            <Text style={styles.label}>Rendimento Total Final (g/ml)</Text>
            <Text style={styles.helperText}>Pese tudo depois de pronto (já cozido/assado).</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 800"
              keyboardType="numeric"
              value={recipeYield}
              onChangeText={setRecipeYield}
            />
          </View>

          {/* Lista de Ingredientes da Receita */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ingredientes na Panela</Text>
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <MaterialCommunityIcons name="plus-circle" size={28} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {recipeItems.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="pot-mix" size={40} color={colors.muted} />
                <Text style={styles.emptyText}>Nenhum ingrediente adicionado.</Text>
              </View>
            ) : (
              recipeItems.map((item) => {
                const qty = parseFloat(item.usedQuantity.replace(',', '.')) || 0;
                const itemCost = qty * item.costPerUnit;

                return (
                  <View key={item.id} style={styles.ingredientRow}>
                    <View style={styles.ingredientInfo}>
                      <Text style={styles.ingredientName}>{item.name}</Text>
                      <Text style={styles.ingredientCost}>Custo: R$ {itemCost.toFixed(2).replace('.', ',')}</Text>
                    </View>
                    
                    <View style={styles.qtyContainer}>
                      <TextInput
                        style={styles.qtyInput}
                        placeholder="0"
                        keyboardType="numeric"
                        value={item.usedQuantity}
                        onChangeText={(text) => updateItemQuantity(item.id, text)}
                      />
                      <Text style={styles.qtyUnit}>g</Text>
                    </View>

                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(item.id)}>
                      <MaterialCommunityIcons name="trash-can-outline" size={24} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>

          {/* Resumo Final (Sticky visual) */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Resumo do Custo</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Custo Total da Receita</Text>
              <Text style={styles.summaryValue}>R$ {totalRecipeCost.toFixed(2).replace('.', ',')}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Custo por Unidade (1g)</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                R$ {costPerGram.toFixed(3)}
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.saveButton} 
            activeOpacity={0.8}
            onPress={handleSaveRecipe}
          >
            <Text style={styles.saveButtonText}>Salvar Receita</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal para Escolher Ingrediente da Despensa */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Escolha um Ingrediente</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {ingredients.length === 0 ? (
                <Text style={{ textAlign: 'center', color: colors.text, opacity: 0.6, marginTop: 20 }}>
                  Sua despensa está vazia. Adicione ingredientes primeiro!
                </Text>
              ) : (
                ingredients.map((ing) => {
                  const costPerG = ing.quantity > 0 ? (ing.price / ing.quantity).toFixed(3) : '0.000';
                  return (
                    <TouchableOpacity 
                      key={ing.id} 
                      style={styles.modalItem}
                      onPress={() => handleAddIngredient(ing)}
                    >
                      <Text style={styles.modalItemName}>{ing.name}</Text>
                      <Text style={styles.modalItemCost}>
                        R$ {costPerG}/{ing.unit}
                      </Text>
                    </TouchableOpacity>
                  );
                })
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
    marginBottom: 16,
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
    width: 80,
  },
  qtyInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 15,
    textAlign: 'center',
  },
  qtyUnit: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.6,
  },
  removeBtn: {
    padding: 4,
  },
  summaryCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.text,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 12,
  },
  saveButton: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },
  saveButtonText: {
    color: colors.white,
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
    maxHeight: '60%',
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
    color: colors.text,
  },
  modalItemCost: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.6,
  },
});
