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
import { useAppStore, ProductComponent, Product, PricingProfileType } from '../store/useAppStore';
import { RootStackParamList } from '../navigation/types';
import { usePricing } from '../hooks/usePricing';

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
  const { 
    getIngredientUnitCost, 
    getRecipeUnitCost, 
    getPackagingUnitCost,
    getLaborCost,
    getProductProductionCost,
    getProductUnitCost,
    getSuggestedPrice,
  } = usePricing();

  // Estados do Produto
  const [productName, setProductName] = useState('');
  const [productionTimeMinutes, setProductionTimeMinutes] = useState('');
  const [decorationTimeMinutes, setDecorationTimeMinutes] = useState('');
  const [pricingProfile, setPricingProfile] = useState<PricingProfileType>('padrao');
  const [batchYieldQuantity, setBatchYieldQuantity] = useState('1');
  const [targetWeightKg, setTargetWeightKg] = useState('');

  const [components, setComponents] = useState<LocalComponent[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'content' | 'packaging'>('content');
  // Estados para o Modal de Quantidade
  const [quantityModalVisible, setQuantityModalVisible] = useState(false);
  const [selectedCompForQty, setSelectedCompForQty] = useState<any | null>(null);
  const [inputQty, setInputQty] = useState('');
  const [inputUnit, setInputUnit] = useState<'base' | 'pkg'>('base');

  const handleOpenQuantityModal = (comp: any) => {
    setSelectedCompForQty(comp);
    setInputQty(comp.type === 'packaging' ? (batchYieldQuantity || '1') : '');
    setInputUnit('base');
    setQuantityModalVisible(true);
    setModalVisible(false);
  };

  const confirmAddComponent = () => {
    if (!selectedCompForQty || !inputQty) return;

    const parsedInput = parseFloat(inputQty.replace(',', '.')) || 0;
    if (parsedInput <= 0) {
      Alert.alert('Atenção', 'Digite uma quantidade válida.');
      return;
    }

    let finalBaseQty = parsedInput;
    if (inputUnit === 'pkg') {
      if (selectedCompForQty.type === 'recipe') {
        const recipe = recipes.find(r => r.id === selectedCompForQty.id);
        finalBaseQty = parsedInput * (recipe?.yieldQuantity || 0);
      } else {
        const item = selectedCompForQty.type === 'ingredient' 
          ? ingredients.find(i => i.id === selectedCompForQty.id)
          : packagings.find(p => p.id === selectedCompForQty.id);
        finalBaseQty = parsedInput * (item?.quantity || 0);
      }
    }

    const newItem: LocalComponent = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      componentId: selectedCompForQty.id,
      name: selectedCompForQty.name,
      type: selectedCompForQty.type,
      usedQuantity: finalBaseQty.toString().replace('.', ','),
      costPerUnit: selectedCompForQty.costPerUnit,
      unit: selectedCompForQty.unit
    };

    setComponents([...components, newItem]);
    setQuantityModalVisible(false);
    setSelectedCompForQty(null);
  };

  // Carregar dados se for edição
  useEffect(() => {
    if (productId) {
      const existingProduct = products.find(p => p.id === productId);
      if (existingProduct) {
        setProductName(existingProduct.name);
        setProductionTimeMinutes(existingProduct.productionTimeMinutes.toString().replace('.', ','));
        if (existingProduct.pricingProfile) setPricingProfile(existingProduct.pricingProfile);
        if (existingProduct.decorationTimeMinutes) setDecorationTimeMinutes(existingProduct.decorationTimeMinutes.toString().replace('.', ','));
        if (existingProduct.batchYieldQuantity) setBatchYieldQuantity(existingProduct.batchYieldQuantity.toString().replace('.', ','));
        if (existingProduct.targetWeightKg) setTargetWeightKg(existingProduct.targetWeightKg.toString().replace('.', ','));

        const loadedComponents = existingProduct.components.map(comp => {
          let name = 'Item removido';
          let costPerUnit = 0;
          let unit = 'un';

          if (comp.type === 'ingredient') {
            const ing = ingredients.find(i => i.id === comp.componentId);
            if (ing) {
              name = ing.name; unit = ing.unit;
              costPerUnit = getIngredientUnitCost(ing.id);
            }
          } else if (comp.type === 'packaging') {
            const pkg = packagings.find(p => p.id === comp.componentId);
            if (pkg) {
              name = pkg.name; unit = pkg.unit;
              costPerUnit = getPackagingUnitCost(pkg.id);
            }
          } else if (comp.type === 'recipe') {
            const recipe = recipes.find(r => r.id === comp.componentId);
            if (recipe) {
              name = recipe.name; unit = recipe.yieldUnit;
              costPerUnit = getRecipeUnitCost(recipe.id);
            }
          }

          return {
            id: comp.id,
            componentId: comp.componentId,
            name, type: comp.type,
            usedQuantity: comp.usedQuantity.toString().replace('.', ','),
            costPerUnit, unit
          };
        });

        setComponents(loadedComponents);
      }
    }
  }, [productId, products, ingredients, recipes, packagings]);

  // Objeto temporário para cálculos
  const tempProduct: Product = {
    id: productId || 'temp',
    name: productName || '',
    productionTimeMinutes: parseFloat(productionTimeMinutes.toString().replace(',', '.')) || 0,
    decorationTimeMinutes: parseFloat(decorationTimeMinutes.toString().replace(',', '.')) || 0,
    pricingProfile,
    batchYieldQuantity: parseFloat(batchYieldQuantity.toString().replace(',', '.')) || 1,
    targetWeightKg: parseFloat(targetWeightKg.toString().replace(',', '.')) || 0,
    components: components.map(c => ({
      id: c.id,
      componentId: c.componentId,
      type: c.type,
      usedQuantity: parseFloat(c.usedQuantity.toString().replace(',', '.')) || 0
    }))
  };

  const productionCost = getProductProductionCost(tempProduct) || 0;
  const totalCost = getProductUnitCost(tempProduct) || 0;
  const suggestedPrice = getSuggestedPrice(tempProduct) || 0;

  const handleSaveProduct = () => {
    if (!productName.trim() || !productionTimeMinutes.trim()) {
      Alert.alert('Atenção', 'Preencha os campos obrigatórios.');
      return;
    }
    if (components.length === 0) {
      Alert.alert('Atenção', 'Adicione componentes ao produto.');
      return;
    }

    const formattedComponents: ProductComponent[] = components.map(c => ({
      id: c.id,
      componentId: c.componentId,
      type: c.type,
      usedQuantity: parseFloat(c.usedQuantity.replace(',', '.')) || 0
    }));

    const productPayload: Omit<Product, 'id'> = {
      name: productName.trim(),
      productionTimeMinutes: tempProduct.productionTimeMinutes,
      decorationTimeMinutes: tempProduct.decorationTimeMinutes,
      pricingProfile,
      batchYieldQuantity: tempProduct.batchYieldQuantity,
      targetWeightKg: tempProduct.targetWeightKg,
      components: formattedComponents,
    };

    if (productId) {
      updateProduct(productId, productPayload);
      Alert.alert('Sucesso', 'Produto atualizado!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } else {
      addProduct(productPayload);
      Alert.alert('Sucesso', 'Produto salvo!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    }
  };

  // Helper para agrupar opções por categoria
  const getGroupedOptions = () => {
    const groups: { [key: string]: any[] } = {};

    if (modalType === 'content') {
      // Receitas
      recipes.forEach(r => {
        const cat = r.category || 'Receitas Sem Categoria';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push({...r, type: 'recipe', costPerUnit: getRecipeUnitCost(r.id), unit: r.yieldUnit});
      });
      // Ingredientes
      ingredients.forEach(i => {
        const cat = i.category || 'Ingredientes Sem Categoria';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push({...i, type: 'ingredient', costPerUnit: getIngredientUnitCost(i.id), unit: i.unit});
      });
    } else {
      // Embalagens
      packagings.forEach(p => {
        const cat = p.category || 'Embalagens Sem Categoria';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push({...p, type: 'packaging', costPerUnit: getPackagingUnitCost(p.id), unit: p.unit});
      });
    }

    return groups;
  };

  const groupedOptions = getGroupedOptions();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>{productId ? 'Editar Produto' : 'Novo Produto'}</Text>
        <View style={{ width: 28 }} /> 
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.label}>Perfil de Precificação Adaptativa</Text>
            <Text style={styles.sublabel}>Ajusta perdas e custos de energia conforme a confeção:</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.profileScroll}>
              {[
                { id: 'padrao', label: 'Padrão', icon: 'package-variant' },
                { id: 'bolo_festa', label: 'Bolo Festa (Kg)', icon: 'cake-layered' },
                { id: 'brigadeiro', label: 'Brigadeiros', icon: 'candy' },
                { id: 'bolo_pote', label: 'Bolo no Pote', icon: 'glass-fragile' },
                { id: 'macaron', label: 'Macaron/Fino', icon: 'cookie' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.profileChip, pricingProfile === item.id && styles.profileChipActive]}
                  onPress={() => setPricingProfile(item.id as PricingProfileType)}
                >
                  <MaterialCommunityIcons 
                    name={item.icon as any} 
                    size={18} 
                    color={pricingProfile === item.id ? colors.white : colors.text} 
                  />
                  <Text style={[styles.profileChipText, pricingProfile === item.id && styles.profileChipTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Nome do Produto</Text>
            <TextInput style={styles.input} placeholder="Ex: Bolo de Pote Ninho" value={productName} onChangeText={setProductName} />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Montagem (min)</Text>
                <TextInput style={styles.input} placeholder="Ex: 15" keyboardType="numeric" value={productionTimeMinutes} onChangeText={(val) => setProductionTimeMinutes(val.replace(',', '.'))} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Rendimento Lote (un)</Text>
                <TextInput style={styles.input} placeholder="Ex: 18 potes" keyboardType="numeric" value={batchYieldQuantity} onChangeText={(val) => setBatchYieldQuantity(val.replace(',', '.'))} />
              </View>
            </View>

            {pricingProfile === 'bolo_festa' && (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Decoração (min)</Text>
                  <TextInput style={styles.input} placeholder="Ex: 30" keyboardType="numeric" value={decorationTimeMinutes} onChangeText={(val) => setDecorationTimeMinutes(val.replace(',', '.'))} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Peso Estimado (Kg)</Text>
                  <TextInput style={styles.input} placeholder="Ex: 1.5" keyboardType="numeric" value={targetWeightKg} onChangeText={(val) => setTargetWeightKg(val.replace(',', '.'))} />
                </View>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Conteúdo</Text><TouchableOpacity onPress={() => { setModalType('content'); setModalVisible(true); }}><MaterialCommunityIcons name="plus-circle" size={28} color={colors.primary} /></TouchableOpacity></View>
            {components.filter(c => c.type !== 'packaging').map((item) => (
              <View key={item.id} style={styles.ingredientRow}>
                <View style={styles.ingredientInfo}><Text style={styles.ingredientName}>{item.name}</Text><Text style={styles.ingredientCost}>R$ {((parseFloat(item.usedQuantity.replace(',','.'))||0)*item.costPerUnit).toFixed(2)}</Text></View>
                <View style={styles.qtyContainer}><TextInput style={styles.qtyInput} keyboardType="numeric" value={item.usedQuantity} onChangeText={(t) => setComponents(prev => prev.map(c => c.id === item.id ? {...c, usedQuantity: t} : c))} /><Text style={styles.qtyUnit}>{item.unit}</Text></View>
                <TouchableOpacity onPress={() => setComponents(prev => prev.filter(c => c.id !== item.id))}><MaterialCommunityIcons name="close-circle" size={24} color={colors.muted} /></TouchableOpacity>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Embalagem</Text><TouchableOpacity onPress={() => { setModalType('packaging'); setModalVisible(true); }}><MaterialCommunityIcons name="plus-circle" size={28} color={colors.primary} /></TouchableOpacity></View>
            {components.filter(c => c.type === 'packaging').map((item) => (
              <View key={item.id} style={styles.ingredientRow}>
                <View style={styles.ingredientInfo}><Text style={styles.ingredientName}>{item.name}</Text><Text style={styles.ingredientCost}>R$ {((parseFloat(item.usedQuantity.replace(',','.'))||0)*item.costPerUnit).toFixed(2)}</Text></View>
                <View style={styles.qtyContainer}><TextInput style={styles.qtyInput} keyboardType="numeric" value={item.usedQuantity} onChangeText={(t) => setComponents(prev => prev.map(c => c.id === item.id ? {...c, usedQuantity: t} : c))} /><Text style={styles.qtyUnit}>{item.unit}</Text></View>
                <TouchableOpacity onPress={() => setComponents(prev => prev.filter(c => c.id !== item.id))}><MaterialCommunityIcons name="close-circle" size={24} color={colors.muted} /></TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.pricingCard}>
            <View style={styles.pricingHeader}>
              <MaterialCommunityIcons name="calculator" size={24} color={colors.white} />
              <Text style={styles.pricingTitle}>Resumo de Precificação</Text>
            </View>
            <View style={styles.pricingBody}>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Custo Produção</Text>
                <Text style={styles.calcValue}>R$ {productionCost.toFixed(2).replace('.', ',')}</Text>
              </View>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Custo Final (c/ Emb.)</Text>
                <Text style={styles.calcValue}>R$ {totalCost.toFixed(2).replace('.', ',')}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.suggestedPriceBox}>
                <Text style={styles.suggestedLabel}>Preço Sugerido</Text>
                <Text style={styles.suggestedValue}>R$ {suggestedPrice.toFixed(2).replace('.', ',')}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveProduct}><Text style={styles.saveButtonText}>Salvar Produto</Text></TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Lista AGRUPADO por Categoria */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Adicionar</Text><TouchableOpacity onPress={() => setModalVisible(false)}><MaterialCommunityIcons name="close" size={24} color={colors.text} /></TouchableOpacity></View>
            <ScrollView showsVerticalScrollIndicator={false}>
               {Object.keys(groupedOptions).length === 0 ? (
                 <Text style={{textAlign:'center', marginTop:20, opacity:0.5}}>Nenhum item encontrado.</Text>
               ) : (
                 Object.keys(groupedOptions).sort().map(catName => (
                   <View key={catName}>
                     <View style={styles.modalSectionHeader}>
                       <MaterialCommunityIcons name="folder-outline" size={18} color={colors.primary} />
                       <Text style={styles.modalSectionTitle}>{catName}</Text>
                     </View>
                     {groupedOptions[catName].map(comp => (
                       <TouchableOpacity key={comp.id} style={styles.modalItem} onPress={() => handleOpenQuantityModal(comp)}>
                         <View style={{ flex: 1 }}>
                           <Text style={styles.modalItemName}>{comp.name}</Text>
                           <Text style={styles.modalItemType}>
                             {comp.type === 'recipe' ? 'Receita Base' : comp.type === 'packaging' ? 'Embalagem' : 'Ingrediente'}
                           </Text>
                         </View>
                         <Text style={styles.modalItemCost}>R$ {comp.costPerUnit.toFixed(3)}</Text>
                       </TouchableOpacity>
                     ))}
                   </View>
                 ))
               )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Quantidade */}
      <Modal visible={quantityModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.qtyModalContent]}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Quantidade</Text><TouchableOpacity onPress={() => setQuantityModalVisible(false)}><MaterialCommunityIcons name="close" size={24} color={colors.text} /></TouchableOpacity></View>
            <Text style={styles.qtyModalSubtitle}>{selectedCompForQty?.name}</Text>
            <View style={styles.unitToggleRow}>
              <TouchableOpacity style={[styles.toggleBtn, inputUnit === 'base' && styles.toggleBtnActive]} onPress={() => setInputUnit('base')}><Text style={{fontWeight: inputUnit==='base'?'bold':'normal'}}>Em {selectedCompForQty?.unit}</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, inputUnit === 'pkg' && styles.toggleBtnActive]} onPress={() => setInputUnit('pkg')}><Text style={{fontWeight: inputUnit==='pkg'?'bold':'normal'}}>{selectedCompForQty?.type === 'recipe' ? 'Porções' : 'Pacotes'}</Text></TouchableOpacity>
            </View>
            <View style={styles.qtyInputRow}>
              <TextInput 
                style={styles.bigQtyInput} 
                keyboardType="numeric" 
                value={inputQty} 
                onChangeText={setInputQty} 
                autoFocus 
                placeholder="Ex: 1"
              />
              <Text style={styles.bigQtyUnit}>{inputUnit === 'base' ? selectedCompForQty?.unit : 'un'}</Text>
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={confirmAddComponent}><Text style={styles.saveButtonText}>Confirmar</Text></TouchableOpacity>
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
  sublabel: { fontSize: 12, color: colors.textMuted, marginBottom: 10 },
  profileScroll: { flexDirection: 'row', marginBottom: 16 },
  profileChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.background, 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 20, 
    marginRight: 8, 
    borderWidth: 1, 
    borderColor: colors.border,
    gap: 6 
  },
  profileChipActive: { 
    backgroundColor: colors.primary, 
    borderColor: colors.primary 
  },
  profileChipText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: colors.text 
  },
  profileChipTextActive: { 
    color: colors.white 
  },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.muted, borderRadius: 8, padding: 12, fontSize: 16, color: colors.text, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, padding: 12, borderRadius: 8, marginBottom: 8 },
  ingredientInfo: { flex: 1 },
  ingredientName: { fontSize: 15, fontWeight: '600', color: colors.text },
  ingredientCost: { fontSize: 12, color: colors.text, opacity: 0.7 },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 6, borderWidth: 1, borderColor: colors.muted, paddingHorizontal: 8, marginRight: 12, width: 80 },
  qtyInput: { flex: 1, paddingVertical: 8, fontSize: 15, textAlign: 'center' },
  qtyUnit: { fontSize: 12, color: colors.text, opacity: 0.6 },
  divider: { height: 1, backgroundColor: colors.muted, marginVertical: 12 },
  pricingCard: { backgroundColor: colors.white, borderRadius: 12, marginBottom: 24, elevation: 3, overflow: 'hidden' },
  pricingHeader: { backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', padding: 16 },
  pricingTitle: { color: colors.white, fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  pricingBody: { padding: 16 },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  calcLabel: { fontSize: 14, color: colors.text, opacity: 0.8 },
  calcValue: { fontSize: 14, color: colors.text, fontWeight: '500' },
  suggestedPriceBox: { backgroundColor: colors.secondary, borderRadius: 8, padding: 16, alignItems: 'center' },
  suggestedLabel: { fontSize: 12, fontWeight: 'bold', opacity: 0.7 },
  suggestedValue: { fontSize: 32, fontWeight: 'bold', color: colors.text },
  profitText: { fontSize: 13, fontWeight: '500', color: colors.text, marginTop: 4 },
  saveButton: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  modalSectionHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.muted, marginBottom: 5, marginTop: 10 },
  modalSectionTitle: { fontSize: 13, fontWeight: 'bold', color: colors.primary, marginLeft: 8, textTransform: 'uppercase' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.muted },
  modalItemName: { fontSize: 16, fontWeight: '500' },
  modalItemType: { fontSize: 12, color: colors.text, opacity: 0.5 },
  modalItemCost: { fontSize: 14, opacity: 0.8 },
  qtyModalContent: { paddingBottom: 40 },
  qtyModalSubtitle: { fontSize: 16, marginBottom: 20, textAlign: 'center' },
  unitToggleRow: { flexDirection: 'row', backgroundColor: colors.background, borderRadius: 12, padding: 4, marginBottom: 24 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  toggleBtnActive: { backgroundColor: colors.white, elevation: 2 },
  qtyInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  bigQtyInput: { fontSize: 48, fontWeight: 'bold', color: colors.primary, textAlign: 'center', minWidth: 100 },
  bigQtyUnit: { fontSize: 24, opacity: 0.5, marginLeft: 10 },
});
