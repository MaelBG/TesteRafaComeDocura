import React, { useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppStore, Ingredient, Packaging } from '../store/useAppStore';

type MarketItem = (Ingredient | Packaging) & { isPackaging: boolean; checked: boolean };

export default function MarketListScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { ingredients, packagings } = useAppStore();

  // Filtra itens com estoque <= 1 e adiciona a propriedade checked temporária
  const initialList: MarketItem[] = [
    ...ingredients
      .filter(i => (i.stock || 0) <= 1)
      .map(i => ({ ...i, isPackaging: false, checked: false })),
    ...packagings
      .filter(p => (p.stock || 0) <= 1)
      .map(p => ({ ...p, isPackaging: true, checked: false }))
  ];

  const [marketList, setMarketList] = useState<MarketItem[]>(initialList);

  const toggleCheck = (id: string) => {
    setMarketList(current => 
      current.map(item => item.id === id ? { ...item, checked: !item.checked } : item)
    );
  };

  const renderItem = ({ item }: { item: MarketItem }) => {
    return (
      <TouchableOpacity 
        style={[styles.itemCard, item.checked && styles.itemCardChecked]}
        activeOpacity={0.7}
        onPress={() => toggleCheck(item.id)}
      >
        <MaterialCommunityIcons 
          name={item.checked ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} 
          size={28} 
          color={item.checked ? colors.primary : colors.muted} 
        />
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, item.checked && styles.textStrikethrough]}>
            {item.name}
          </Text>
          <View style={styles.itemDetailsRow}>
            <Text style={styles.itemType}>
              {item.isPackaging ? 'Embalagem' : 'Ingrediente'}
            </Text>
            <Text style={styles.itemStock}>
              Estoque: {Math.floor(item.stock || 0)} {item.isPackaging ? 'unid.' : 'pct'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Lista de Mercado</Text>
          <Text style={styles.headerSubtitle}>Itens com estoque baixo</Text>
        </View>
        <View style={{ width: 28 }} /> 
      </View>

      {marketList.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="cart-check" size={80} color={colors.primary} />
          <Text style={styles.emptyStateText}>Tudo em ordem!</Text>
          <Text style={styles.emptyStateSub}>Seu estoque está abastecido.</Text>
        </View>
      ) : (
        <FlatList
          data={marketList}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.6,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  itemCardChecked: {
    opacity: 0.6,
    backgroundColor: '#f9f9f9',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  textStrikethrough: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  itemDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  itemType: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginRight: 10,
  },
  itemStock: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
  },
  emptyStateSub: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.6,
    marginTop: 8,
    textAlign: 'center',
  },
});
