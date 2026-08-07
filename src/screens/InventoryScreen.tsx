import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

import IngredientsScreen from './IngredientsScreen';
import PackagingScreen from './PackagingScreen';
import MarketListScreen from './MarketListScreen';

type Segment = 'ingredients' | 'packaging' | 'market';

export default function InventoryScreen() {
  const [activeSegment, setActiveSegment] = useState<Segment>('ingredients');

  return (
    <View style={styles.container}>
      {/* Top Segmented Pill Bar */}
      <View style={styles.segmentedContainer}>
        <TouchableOpacity
          style={[styles.segmentButton, activeSegment === 'ingredients' && styles.segmentActive]}
          onPress={() => setActiveSegment('ingredients')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons 
            name="food-apple" 
            size={18} 
            color={activeSegment === 'ingredients' ? colors.white : colors.textMuted} 
          />
          <Text style={[styles.segmentText, activeSegment === 'ingredients' && styles.segmentTextActive]}>
            Despensa
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentButton, activeSegment === 'packaging' && styles.segmentActive]}
          onPress={() => setActiveSegment('packaging')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons 
            name="package-variant-closed" 
            size={18} 
            color={activeSegment === 'packaging' ? colors.white : colors.textMuted} 
          />
          <Text style={[styles.segmentText, activeSegment === 'packaging' && styles.segmentTextActive]}>
            Embalagens
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentButton, activeSegment === 'market' && styles.segmentActive]}
          onPress={() => setActiveSegment('market')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons 
            name="cart-outline" 
            size={18} 
            color={activeSegment === 'market' ? colors.white : colors.textMuted} 
          />
          <Text style={[styles.segmentText, activeSegment === 'market' && styles.segmentTextActive]}>
            Compras
          </Text>
        </TouchableOpacity>
      </View>

      {/* Segment Content */}
      <View style={styles.content}>
        {activeSegment === 'ingredients' && <IngredientsScreen />}
        {activeSegment === 'packaging' && <PackagingScreen />}
        {activeSegment === 'market' && <MarketListScreen />}
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
