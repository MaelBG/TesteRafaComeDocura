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
import { useAppStore, Ingredient, RecipeItem, Recipe } from '../store/useAppStore';
import { RootStackParamList } from '../navigation/types';
import { usePricing } from '../hooks/usePricing';

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
  
  // Pegando dados e ações do Zustand e Hook de Precificação
  const { ingredients, recipes, addRecipe, updateRecipe } = useAppStore();
  const { getIngredientUnitCost, getRecipeTotalCost, getRecipeUnitCost } = usePricing();

  // Estados principais da Receita
  const [recipeName, setRecipeName] = useState('');
  const [recipeYield, setRecipeYield] = useState('');
  const [recipeYieldUnit, setRecipeYieldUnit] = useState<'g' | 'ml'>('g');
  const [recipeItems, setRecipeItems] = useState<LocalRecipeItem[]>([]);
  const [category, setCategory] = useState(''); // NOVO

  // Estados do Modal de Seleção de Ingrediente
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (recipeId) {
      const existingRecipe = recipes.find(r => r.id === recipeId);
      if (existingRecipe) {
        setRecipeName(existingRecipe.name);
        setRecipeYield(existingRecipe.yieldQuantity.toString().replace('.', ','));
        setRecipeYieldUnit((existingRecipe.yieldUnit as 'g' | 'ml') || 'g');
        setCategory(existingRecipe.category || '');
        
        const loadedItems = existingRecipe.items.map(item => {
          const ing = ingredients.find(i => i.id === item.ingredientId);
          return {
            id: item.id,
            ingredientId: item.ingredientId,
            name: ing ? ing.name : 'Ingrediente removido',
            usedQuantity: item.usedQuantity.toString().replace('.', ','),
            costPerUnit: getIngredientUnitCost(item.ingredientId)
          };
        });
        setRecipeItems(loadedItems);
      }
    }
  }, [recipeId, recipes, ingredients]);

  // Objeto temporário para usar as funções do hook
  const tempRecipe: Recipe = {
    id: recipeId || 'temp',
    name: recipeName,
    yieldQuantity: parseFloat(recipeYield.replace(',', '.')) || 0,
    yieldUnit: 'g',
    items: recipeItems.map(item => ({
      id: item.id,
      ingredientId: item.ingredientId,
      usedQuantity: parseFloat(item.usedQuantity.replace(',', '.')) || 0
    }))
  };

  // Calcula o custo total da receita com base nos itens adicionados (via hook com 5% de perda)
  const totalRecipeCost = getRecipeTotalCost(tempRecipe.id) || 0;
  
  // Cálculo manual respeitando a regra (para receitas em criação) com segurança absoluta
  const baseCost = recipeItems.reduce((acc, item) => {
    const qty = parseFloat((item.usedQuantity || '0').toString().replace(',', '.')) || 0;
    const unitCost = item.costPerUnit || 0;
    return acc + (qty * unitCost);
  }, 0);
  const realCostWithLoss = baseCost * 1.05;

  const yieldQty = parseFloat((recipeYield || '0').toString().replace(',', '.')) || 0;
  const costPerGram = yieldQty > 0 ? (realCostWithLoss / yieldQty) : 0;

  // Estados para o Modal de Quantidade do Ingrediente Selecionado
  const [quantityModalVisible, setQuantityModalVisible] = useState(false);
  const [selectedIngForQty, setSelectedIngForQty] = useState<Ingredient | null>(null);
  const [inputQty, setInputQty] = useState('');
  const [inputUnit, setInputUnit] = useState<'base' | 'pkg'>('base'); // 'base' (g/ml) ou 'pkg' (pacotes)

  const handleOpenQuantityModal = (ingredient: Ingredient) => {
    setSelectedIngForQty(ingredient);
    setInputQty('');
    setInputUnit('base');
    setQuantityModalVisible(true);
    setModalVisible(false); // Fecha o modal de lista
  };

  const confirmAddIngredient = () => {
    if (!selectedIngForQty || !inputQty) return;

    const parsedInput = parseFloat(inputQty.replace(',', '.')) || 0;
    if (parsedInput <= 0) {
      Alert.alert('Atenção', 'Digite uma quantidade válida.');
      return;
    }

    // Calcula a quantidade final na unidade base (g/ml)
    let finalBaseQty = parsedInput;
    if (inputUnit === 'pkg') {
      finalBaseQty = parsedInput * (selectedIngForQty.quantity || 0);
    }

    const costUnit = selectedIngForQty.quantity > 0 ? selectedIngForQty.price / selectedIngForQty.quantity : 0;
    
    const newItem: LocalRecipeItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      ingredientId: selectedIngForQty.id,
      name: selectedIngForQty.name,
      usedQuantity: finalBaseQty.toString().replace('.', ','),
      costPerUnit: costUnit,
    };

    setRecipeItems([...recipeItems, newItem]);
    setQuantityModalVisible(false);
    setSelectedIngForQty(null);
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

    const formattedItems: RecipeItem[] = recipeItems.map(item => ({
      id: item.id,
      ingredientId: item.ingredientId,
      usedQuantity: parseFloat(item.usedQuantity.replace(',', '.')) || 0
    }));

    const hasZeroQuantity = formattedItems.some(item => item.usedQuantity <= 0);
    if (hasZeroQuantity) {
       Alert.alert('Atenção', 'Existem ingredientes com quantidade zero ou inválida.');
       return;
    }

    if (recipeId) {
      updateRecipe(recipeId, {
        name: recipeName,
        yieldQuantity: yieldQty,
        yieldUnit: recipeYieldUnit,
        items: formattedItems,
        category: category.trim() || undefined
      });
      Alert.alert('Sucesso', 'Receita atualizada!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } else {
      addRecipe({
        name: recipeName,
        yieldQuantity: yieldQty,
        yieldUnit: recipeYieldUnit,
        items: formattedItems,
        category: category.trim() || undefined
      });
      Alert.alert('Sucesso', 'Receita salva!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>{recipeId ? 'Editar Receita' : 'Nova Receita'}</Text>
        <View style={{ width: 28 }} /> 
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.label}>Nome da Preparação</Text>
            <TextInput style={styles.input} placeholder="Ex: Brigadeiro Belga" value={recipeName} onChangeText={setRecipeName} />
            
            <Text style={styles.label}>Categoria (Opcional)</Text>
            <TextInput style={styles.input} placeholder="Ex: Recheios, Massas, Caldas" value={category} onChangeText={setCategory} />

            <View style={styles.yieldRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Rendimento Total</Text>
                <TextInput style={[styles.input, { marginBottom: 0 }]} placeholder="Ex: 800" keyboardType="numeric" value={recipeYield} onChangeText={setRecipeYield} />
              </View>
              <View style={styles.yieldUnitContainer}>
                <Text style={styles.label}>Unidade</Text>
                <View style={styles.smallUnitToggle}>
                  <TouchableOpacity style={[styles.smallToggleBtn, recipeYieldUnit === 'g' && styles.toggleBtnActive]} onPress={() => setRecipeYieldUnit('g')}><Text>g</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.smallToggleBtn, recipeYieldUnit === 'ml' && styles.toggleBtnActive]} onPress={() => setRecipeYieldUnit('ml')}><Text>ml</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Ingredientes</Text><TouchableOpacity onPress={() => setModalVisible(true)}><MaterialCommunityIcons name="plus-circle" size={28} color={colors.primary} /></TouchableOpacity></View>
            {recipeItems.map((item) => (
              <View key={item.id} style={styles.ingredientRow}>
                <View style={styles.ingredientInfo}><Text style={styles.ingredientName}>{item.name}</Text><Text style={styles.ingredientCost}>Custo: R$ {(parseFloat(item.usedQuantity.replace(',','.'))*item.costPerUnit).toFixed(2)}</Text></View>
                <View style={styles.qtyContainer}><TextInput style={styles.qtyInput} keyboardType="numeric" value={item.usedQuantity} onChangeText={(text) => updateItemQuantity(item.id, text)} /><Text style={styles.qtyUnit}>{(ingredients.find(i=>i.id===item.ingredientId)?.unit)||'g'}</Text></View>
                <TouchableOpacity onPress={() => removeItem(item.id)}><MaterialCommunityIcons name="trash-can-outline" size={24} color="#FF6B6B" /></TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Resumo</Text>
            <View style={styles.summaryRow}><Text>Custo Total</Text><Text>R$ {totalRecipeCost.toFixed(2)}</Text></View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}><Text>Custo por 1 {recipeYieldUnit}</Text><Text style={{ color: colors.primary, fontWeight:'bold' }}>R$ {costPerGram.toFixed(3)}</Text></View>
          </View>
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveRecipe}><Text style={styles.saveButtonText}>Salvar Receita</Text></TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Adicionar</Text><TouchableOpacity onPress={() => setModalVisible(false)}><MaterialCommunityIcons name="close" size={24} color={colors.text} /></TouchableOpacity></View>
            <ScrollView>{ingredients.map((ing) => (
              <TouchableOpacity key={ing.id} style={styles.modalItem} onPress={() => handleOpenQuantityModal(ing)}>
                <View style={{ flex: 1 }}><Text>{ing.name}</Text><Text style={{opacity:0.5, fontSize:12}}>{ing.quantity}{ing.unit} | Estoque: {ing.stock}un</Text></View>
                <Text>R$ {(ing.price/ing.quantity).toFixed(3)}</Text>
              </TouchableOpacity>
            ))}</ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={quantityModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.qtyModalContent]}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Quantidade</Text><TouchableOpacity onPress={() => setQuantityModalVisible(false)}><MaterialCommunityIcons name="close" size={24} color={colors.text} /></TouchableOpacity></View>
            <Text style={{textAlign:'center', marginBottom:20}}>{selectedIngForQty?.name}</Text>
            <View style={styles.unitToggleRow}>
              <TouchableOpacity style={[styles.toggleBtn, inputUnit === 'base' && styles.toggleBtnActive]} onPress={() => setInputUnit('base')}><Text>Em {selectedIngForQty?.unit}</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, inputUnit === 'pkg' && styles.toggleBtnActive]} onPress={() => setInputUnit('pkg')}><Text>Em Pacotes</Text></TouchableOpacity>
            </View>
            <View style={styles.qtyInputRow}><TextInput style={styles.bigQtyInput} keyboardType="numeric" value={inputQty} onChangeText={setInputQty} autoFocus /><Text style={styles.bigQtyUnit}>{inputUnit === 'base' ? selectedIngForQty?.unit : 'un'}</Text></View>
            <TouchableOpacity style={styles.saveButton} onPress={confirmAddIngredient}><Text style={styles.saveButtonText}>Confirmar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.muted },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.muted, borderRadius: 8, padding: 12, fontSize: 16, color: colors.text, marginBottom: 16 },
  yieldRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 10 },
  yieldUnitContainer: { marginLeft: 16, width: 100 },
  smallUnitToggle: { flexDirection: 'row', backgroundColor: colors.background, borderRadius: 8, padding: 2, borderWidth: 1, borderColor: colors.muted },
  smallToggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  toggleBtnActive: { backgroundColor: colors.white, elevation: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, padding: 12, borderRadius: 8, marginBottom: 8 },
  ingredientInfo: { flex: 1 },
  ingredientName: { fontSize: 15, fontWeight: '600', color: colors.text },
  ingredientCost: { fontSize: 12, color: colors.text, opacity: 0.7 },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 6, borderWidth: 1, borderColor: colors.muted, paddingHorizontal: 8, marginRight: 12, width: 80 },
  qtyInput: { flex: 1, paddingVertical: 8, fontSize: 15, textAlign: 'center' },
  qtyUnit: { fontSize: 14, color: colors.text, opacity: 0.6 },
  summaryCard: { backgroundColor: colors.secondary, borderRadius: 12, padding: 16, marginBottom: 24 },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.1)', marginVertical: 12 },
  saveButton: { backgroundColor: colors.accent, paddingVertical: 16, borderRadius: 12, alignItems: 'center', elevation: 3 },
  saveButtonText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.muted },
  qtyModalContent: { paddingBottom: 40 },
  unitToggleRow: { flexDirection: 'row', backgroundColor: colors.background, borderRadius: 12, padding: 4, marginBottom: 24 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  qtyInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  bigQtyInput: { fontSize: 48, fontWeight: 'bold', color: colors.primary, textAlign: 'center', minWidth: 100 },
  bigQtyUnit: { fontSize: 24, color: colors.text, opacity: 0.5, marginLeft: 10 },
});
