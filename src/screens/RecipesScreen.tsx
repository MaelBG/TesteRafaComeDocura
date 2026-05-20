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
import { useAppStore, Recipe } from '../store/useAppStore';

export default function RecipesScreen() {
  const { recipes, removeRecipe, ingredients } = useAppStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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

  const renderItem = ({ item }: { item: Recipe }) => {
    // Calcula o custo total da receita buscando os preços atualizados dos ingredientes
    const totalCost = item.items.reduce((acc, recipeItem) => {
      const ingredient = ingredients.find(ing => ing.id === recipeItem.ingredientId);
      if (ingredient && ingredient.quantity > 0) {
        const costPerGram = ingredient.price / ingredient.quantity;
        return acc + (costPerGram * recipeItem.usedQuantity);
      }
      return acc;
    }, 0);

    // Calcula o custo por grama/ml da receita já pronta
    const costPerUnit = item.yieldQuantity > 0 ? (totalCost / item.yieldQuantity).toFixed(3) : '0.000';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.itemName}>{item.name}</Text>
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
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="pot-mix" size={16} color={colors.text} style={styles.icon} />
            <Text style={styles.infoText}>Rende: {item.yieldQuantity}{item.yieldUnit}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="cash" size={16} color={colors.text} style={styles.icon} />
            <Text style={styles.infoText}>Custo Total: R$ {totalCost.toFixed(2).replace('.', ',')}</Text>
          </View>

          <View style={styles.costBadge}>
            <Text style={styles.costText}>R$ {costPerUnit} / {item.yieldUnit}</Text>
          </View>
        </View>
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
  cardBody: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  icon: {
    marginRight: 8,
    opacity: 0.7,
  },
  infoText: {
    fontSize: 15,
    color: colors.text,
  },
  costBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  costText: {
    fontSize: 13,
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

