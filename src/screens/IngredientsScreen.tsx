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
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAppStore, Ingredient } from '../store/useAppStore';

export default function IngredientsScreen() {
  const { ingredients, addIngredient, removeIngredient, updateIngredient } = useAppStore();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Estados do formulário principal
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [stock, setStock] = useState('');
  const [unit, setUnit] = useState<'g' | 'ml' | 'un'>('g');
  const [category, setCategory] = useState(''); // NOVO

  // Estados para o Modal de Entrada Rápida
  const [quickStockModalVisible, setQuickStockModalVisible] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [quickStockValue, setQuickStockValue] = useState('1');

  const handleSave = () => {
    if (!name || !price || !quantity) {
      Alert.alert('Erro', 'Preencha todos os campos!');
      return;
    }

    const parsedPrice = parseFloat(price.replace(',', '.'));
    const parsedQuantity = parseFloat(quantity.replace(',', '.'));
    const parsedStock = parseFloat(stock.replace(',', '.')) || 0;

    if (isNaN(parsedPrice) || isNaN(parsedQuantity)) {
      Alert.alert('Erro', 'Preço ou quantidade inválidos!');
      return;
    }

    if (editingId) {
      updateIngredient(editingId, {
        name,
        price: parsedPrice,
        quantity: parsedQuantity,
        unit,
        stock: parsedStock,
        category: category.trim() || undefined,
      });
    } else {
      addIngredient({
        name,
        price: parsedPrice,
        quantity: parsedQuantity,
        unit, 
        stock: parsedStock,
        category: category.trim() || undefined,
      });
    }
    
    closeModal();
  };

  const handleEdit = (item: Ingredient) => {
    setEditingId(item.id);
    setName(item.name);
    setPrice(item.price.toString().replace('.', ','));
    setQuantity(item.quantity.toString().replace('.', ','));
    setUnit(item.unit as 'g' | 'ml' | 'un');
    setStock(item.stock?.toString().replace('.', ',') || '0');
    setCategory(item.category || '');
    setModalVisible(true);
  };

  const handleRemove = (id: string) => {
    Alert.alert(
      "Excluir Ingrediente",
      "Tem certeza que deseja apagar este ingrediente?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: () => removeIngredient(id) }
      ]
    );
  };

  const openNewModal = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setQuantity('');
    setUnit('g');
    setStock('');
    setCategory('');
    setModalVisible(true);
  };

  const closeModal = () => {
    setName('');
    setPrice('');
    setQuantity('');
    setUnit('g');
    setStock('');
    setCategory('');
    setEditingId(null);
    setModalVisible(false);
  };

  // Funções para o Modal de Entrada Rápida
  const openQuickStockModal = (item: Ingredient) => {
    setSelectedIngredient(item);
    setQuickStockValue('1');
    setQuickStockModalVisible(true);
  };

  const handleQuickStockSave = () => {
    if (!selectedIngredient) return;
    
    const added = parseFloat(quickStockValue.replace(',', '.')) || 0;
    if (added <= 0) {
      Alert.alert('Erro', 'Digite uma quantidade válida.');
      return;
    }

    updateIngredient(selectedIngredient.id, { 
      stock: (selectedIngredient.stock || 0) + added 
    });
    
    setQuickStockModalVisible(false);
    setSelectedIngredient(null);
  };

  const renderItem = ({ item }: { item: Ingredient }) => {
    const itemPrice = item.price || 0;
    const itemQuantity = item.quantity || 0;
    const costPerUnit = itemQuantity > 0 ? (itemPrice / itemQuantity).toFixed(3) : '0.000';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.metaRow}>
              {item.category ? (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              ) : null}
              <View style={styles.stockBadge}>
                <MaterialCommunityIcons name="archive-outline" size={13} color={colors.textMuted} style={{ marginRight: 3 }} />
                <Text style={styles.stockText}>
                  Estoque: {((item.stock || 0) % 1 === 0 ? (item.stock || 0) : (item.stock || 0).toFixed(1)).toString().replace('.', ',')} pct(s)/unid.
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.iconButton} onPress={() => openQuickStockModal(item)}>
              <MaterialCommunityIcons name="plus-circle" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => handleEdit(item)}>
              <MaterialCommunityIcons name="pencil" size={20} color={colors.text} style={{ opacity: 0.6 }} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => handleRemove(item.id)}>
              <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="cash" size={16} color={colors.text} style={styles.icon} />
            <Text style={styles.infoText}>R$ {itemPrice.toFixed(2).replace('.', ',')}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="scale" size={16} color={colors.text} style={styles.icon} />
            <Text style={styles.infoText}>{itemQuantity}{item.unit || 'g'} por pacote</Text>
          </View>

          <View style={styles.costBadge}>
            <Text style={styles.costText}>R$ {costPerUnit} / {item.unit || 'g'}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {ingredients.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="basket-outline" size={60} color={colors.muted} />
          <Text style={styles.emptyStateText}>Sua despensa está vazia!</Text>
          <Text style={styles.emptyStateSub}>Clique no + para adicionar ingredientes.</Text>
        </View>
      ) : (
        <FlatList
          data={ingredients}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity 
        style={styles.fab}
        activeOpacity={0.8}
        onPress={openNewModal}
      >
        <MaterialCommunityIcons name="plus" size={30} color={colors.white} />
      </TouchableOpacity>

      {/* Modal de Cadastro Principal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingId ? 'Editar Ingrediente' : 'Novo Ingrediente'}</Text>
                <TouchableOpacity onPress={closeModal}><MaterialCommunityIcons name="close" size={24} color={colors.text} /></TouchableOpacity>
              </View>
              <Text style={styles.inputLabel}>Nome do Ingrediente</Text>
              <TextInput style={styles.input} placeholder="Ex: Leite Moça" value={name} onChangeText={setName} />
              
              <Text style={styles.inputLabel}>Categoria (Opcional)</Text>
              <TextInput style={styles.input} placeholder="Ex: Laticínios, Frutas, Chocolates" value={category} onChangeText={setCategory} />

              <View style={styles.row}>
                <View style={[styles.inputContainer, { marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Preço Pacote (R$)</Text>
                  <TextInput style={styles.input} placeholder="Ex: 7,50" keyboardType="numeric" value={price} onChangeText={setPrice} />
                </View>
                <View style={[styles.inputContainer, { marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Peso/Qtd no Pacote</Text>
                  <TextInput style={styles.input} placeholder="Ex: 395" keyboardType="numeric" value={quantity} onChangeText={setQuantity} />
                </View>
              </View>
              <Text style={styles.inputLabel}>Unidade de Medida</Text>
              <View style={styles.unitSelector}>
                {['g', 'ml', 'un'].map((u) => (
                  <TouchableOpacity key={u} style={[styles.unitButton, unit === u && styles.unitButtonActive]} onPress={() => setUnit(u as any)}>
                    <Text style={[styles.unitButtonText, unit === u && styles.unitButtonTextActive]}>{u === 'g' ? 'Gramas (g)' : u === 'ml' ? 'Mililitros (ml)' : 'Unidades (un)'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.inputLabel}>Estoque Atual (Qtd. de Pacotes)</Text>
              <TextInput style={styles.input} placeholder="Ex: 5" keyboardType="numeric" value={stock} onChangeText={setStock} />
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}><Text style={styles.saveButtonText}>Salvar Ingrediente</Text></TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal de Entrada Rápida de Estoque */}
      <Modal visible={quickStockModalVisible} animationType="fade" transparent={true}>
        <TouchableWithoutFeedback onPress={() => setQuickStockModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, styles.quickStockContent]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Entrada de Estoque</Text>
                <TouchableOpacity onPress={() => setQuickStockModalVisible(false)}><MaterialCommunityIcons name="close" size={24} color={colors.text} /></TouchableOpacity>
              </View>
              <Text style={styles.quickStockSubtitle}>Quantos pacotes de <Text style={{ fontWeight: 'bold' }}>{selectedIngredient?.name}</Text> você comprou?</Text>
              <View style={styles.quickStockInputContainer}>
                <TextInput 
                  style={styles.quickStockInput} 
                  keyboardType="numeric" 
                  value={quickStockValue} 
                  onChangeText={setQuickStockValue} 
                  autoFocus 
                  placeholder="Ex: 1"
                />
                <Text style={styles.quickStockLabel}>pacote(s)</Text>
              </View>
              <TouchableOpacity style={styles.saveButton} onPress={handleQuickStockSave}><Text style={styles.saveButtonText}>Adicionar ao Estoque</Text></TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  itemName: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  categoryBadge: { backgroundColor: colors.secondary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  categoryText: { fontSize: 10, fontWeight: 'bold', color: colors.white, textTransform: 'uppercase', letterSpacing: 0.5 },
  stockBadge: { flexDirection: 'row', alignItems: 'center', opacity: 0.8 },
  stockText: { fontSize: 12, color: colors.text, fontWeight: '500' },
  actionButtons: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { padding: 6, marginLeft: 4 },
  cardBody: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 8 },
  icon: { marginRight: 4, opacity: 0.7 },
  infoText: { fontSize: 15, color: colors.text },
  costBadge: { backgroundColor: '#E6F4F8', borderWidth: 1, borderColor: '#B2E2F2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginLeft: 'auto' },
  costText: { fontSize: 12, fontWeight: 'bold', color: '#1A5B70' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  inputLabel: { fontSize: 14, color: colors.text, marginBottom: 8, fontWeight: '600' },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.muted, borderRadius: 12, padding: 12, fontSize: 16, color: colors.text, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  inputContainer: { flex: 1 },
  unitSelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  unitButton: { flex: 1, paddingVertical: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.muted, borderRadius: 8, marginHorizontal: 4, alignItems: 'center' },
  unitButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  unitButtonText: { color: colors.text, fontSize: 14, fontWeight: '500' },
  unitButtonTextActive: { color: colors.white, fontWeight: 'bold' },
  saveButton: { backgroundColor: colors.accent, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyStateText: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginTop: 16 },
  emptyStateSub: { fontSize: 14, color: colors.text, opacity: 0.6, marginTop: 8, textAlign: 'center' },
  quickStockContent: { paddingBottom: 50 },
  quickStockSubtitle: { fontSize: 16, color: colors.text, marginBottom: 20, textAlign: 'center' },
  quickStockInputContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  quickStockInput: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.primary, borderRadius: 12, width: 80, padding: 15, fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: colors.text },
  quickStockLabel: { fontSize: 18, marginLeft: 12, color: colors.text, fontWeight: '500' },
});
