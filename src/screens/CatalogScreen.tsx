import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

import RecipesScreen from './RecipesScreen';
import ProductsScreen from './ProductsScreen';

type Segment = 'recipes' | 'products';

export default function CatalogScreen() {
  const [activeSegment, setActiveSegment] = useState<Segment>('recipes');

  return (
    <View style={styles.container}>
      {/* Top Segmented Pill Bar */}
      <View style={styles.segmentedContainer}>
        <TouchableOpacity
          style={[styles.segmentButton, activeSegment === 'recipes' && styles.segmentActive]}
          onPress={() => setActiveSegment('recipes')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons 
            name="pot-mix" 
            size={18} 
            color={activeSegment === 'recipes' ? colors.white : colors.textMuted} 
          />
          <Text style={[styles.segmentText, activeSegment === 'recipes' && styles.segmentTextActive]}>
            Receitas Base
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentButton, activeSegment === 'products' && styles.segmentActive]}
          onPress={() => setActiveSegment('products')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons 
            name="cupcake" 
            size={18} 
            color={activeSegment === 'products' ? colors.white : colors.textMuted} 
          />
          <Text style={[styles.segmentText, activeSegment === 'products' && styles.segmentTextActive]}>
            Doces Precificados
          </Text>
        </TouchableOpacity>
      </View>

      {/* Segment Content */}
      <View style={styles.content}>
        {activeSegment === 'recipes' && <RecipesScreen />}
        {activeSegment === 'products' && <ProductsScreen />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
});
