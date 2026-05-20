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
  
  // Estados do formulário
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');

  const handleSave = () => {
    if (!name || !price || !quantity) {
      Alert.alert('Erro', 'Preencha todos os campos!');
      return;
    }

    const parsedPrice = parseFloat(price.replace(',', '.'));
    const parsedQuantity = parseFloat(quantity.replace(',', '.'));

    if (isNaN(parsedPrice) || isNaN(parsedQuantity)) {
      Alert.alert('Erro', 'Preço ou quantidade inválidos!');
      return;
    }

    if (editingId) {
      updateIngredient(editingId, {
        name,
        price: parsedPrice,
        quantity: parsedQuantity,
      });
    } else {
      addIngredient({
        name,
        price: parsedPrice,
        quantity: parsedQuantity,
        unit: 'g', // Futuramente podemos deixar selecionar entre g/ml/un
      });
    }
    
    closeModal();
  };

  const handleEdit = (item: Ingredient) => {
    setEditingId(item.id);
    setName(item.name);
    setPrice(item.price.toString().replace('.', ','));
    setQuantity(item.quantity.toString().replace('.', ','));
    setModalVisible(true);
  };

  const handleRemove = (id: string) => {
    Alert.alert(
      "Excluir Ingrediente",
      "Tem certeza que deseja apagar este ingrediente da sua despensa?",
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
    setModalVisible(true);
  };

  const closeModal = () => {
    setName('');
    setPrice('');
    setQuantity('');
    setEditingId(null);
    setModalVisible(false);
  };

  const renderItem = ({ item }: { item: Ingredient }) => {
    const costPerUnit = item.quantity > 0 ? (item.price / item.quantity).toFixed(3) : '0.000';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.iconButton} onPress={() => handleEdit(item)}>
              <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => handleRemove(item.id)}>
              <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="cash" size={16} color={colors.text} style={styles.icon} />
            <Text style={styles.infoText}>R$ {item.price.toFixed(2).replace('.', ',')}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="scale" size={16} color={colors.text} style={styles.icon} />
            <Text style={styles.infoText}>{item.quantity}{item.unit}</Text>
          </View>

          <View style={styles.costBadge}>
            <Text style={styles.costText}>R$ {costPerUnit} / {item.unit}</Text>
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

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity 
        style={styles.fab}
        activeOpacity={0.8}
        onPress={openNewModal}
      >
        <MaterialCommunityIcons name="plus" size={30} color={colors.white} />
      </TouchableOpacity>

      {/* Modal de Cadastro */}
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
                <Text style={styles.modalTitle}>
                  {editingId ? 'Editar Ingrediente' : 'Novo Ingrediente'}
                </Text>
                <TouchableOpacity onPress={closeModal}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Nome do Ingrediente</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Leite Ninho"
                value={name}
                onChangeText={setName}
              />

              <View style={styles.row}>
                <View style={[styles.inputContainer, { marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Preço (R$)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 15,90"
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                  />
                </View>
                
                <View style={[styles.inputContainer, { marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Quantidade (g/ml)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 400"
                    keyboardType="numeric"
                    value={quantity}
                    onChangeText={setQuantity}
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={styles.saveButton}
                activeOpacity={0.8}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Salvar Ingrediente</Text>
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
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 6,
    marginLeft: 4,
  },
  deleteButton: {
    padding: 4,
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
  editButton: {
    padding: 4,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  icon: {
    marginRight: 4,
    opacity: 0.7,
  },
  infoText: {
    fontSize: 15,
    color: colors.text,
  },
  costBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 'auto', 
  },
  costText: {
    fontSize: 12,
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
  // Estilos do Modal
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
});
