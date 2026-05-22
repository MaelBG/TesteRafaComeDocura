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
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAppStore } from '../store/useAppStore';

export default function SettingsScreen() {
  const { settings, updateSettings } = useAppStore();

  // Estados locais para edição (populados com o valor global na montagem)
  const [hourlyRate, setHourlyRate] = useState(settings.hourlyRate.toString().replace('.', ','));
  const [workerProfile, setWorkerProfile] = useState<'beginner' | 'professional' | 'expert'>(settings.workerProfile);
  const [fixedCostsPercent, setFixedCostsPercent] = useState(settings.fixedCostsPercent.toString());
  const [profitMargin, setProfitMargin] = useState(settings.profitMarginPercent.toString());

  // Atualiza os inputs se o estado global mudar em outro lugar
  useEffect(() => {
    setHourlyRate(settings.hourlyRate.toFixed(2).replace('.', ','));
    setWorkerProfile(settings.workerProfile);
    setFixedCostsPercent(settings.fixedCostsPercent.toString());
    setProfitMargin(settings.profitMarginPercent.toString());
  }, [settings]);

  const selectProfile = (profile: 'beginner' | 'professional' | 'expert', recommendedRate: number) => {
    setWorkerProfile(profile);
    setHourlyRate(recommendedRate.toFixed(2).replace('.', ','));
  };

  const handleSave = () => {
    const parsedRate = parseFloat(hourlyRate.replace(',', '.')) || 0;
    if (parsedRate < 0) {
      Alert.alert('Erro', 'O valor da hora não pode ser negativo.');
      return;
    }

    updateSettings({
      hourlyRate: parsedRate,
      workerProfile,
      fixedCostsPercent: parseFloat(fixedCostsPercent.replace(',', '.')) || 0,
      profitMarginPercent: parseFloat(profitMargin.replace(',', '.')) || 0,
    });
    Alert.alert('Sucesso', 'Configurações salvas com sucesso!');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        
        {/* Assistente de Mão de Obra */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account-hard-hat" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Sua Mão de Obra</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Como você se vê hoje na confeitaria? Escolha um perfil para calcularmos um valor justo para a sua hora de trabalho.
          </Text>

          <View style={styles.profilesContainer}>
            {/* Iniciante */}
            <TouchableOpacity 
              style={[styles.profileCard, workerProfile === 'beginner' && styles.profileCardActive]}
              onPress={() => selectProfile('beginner', 15)}
              activeOpacity={0.8}
            >
              <View style={styles.profileHeader}>
                <MaterialCommunityIcons name="seed-outline" size={20} color={workerProfile === 'beginner' ? colors.white : colors.primary} />
                <Text style={[styles.profileTitle, workerProfile === 'beginner' && styles.textWhite]}>Iniciante / Extra</Text>
              </View>
              <Text style={[styles.profileDesc, workerProfile === 'beginner' && styles.textWhite]}>
                Faço doces nas horas vagas e estou ganhando velocidade.
              </Text>
              <Text style={[styles.profileRate, workerProfile === 'beginner' && styles.textWhite]}>Sugerido: ~R$ 15/h</Text>
            </TouchableOpacity>

            {/* Profissional */}
            <TouchableOpacity 
              style={[styles.profileCard, workerProfile === 'professional' && styles.profileCardActive]}
              onPress={() => selectProfile('professional', 20)}
              activeOpacity={0.8}
            >
              <View style={styles.profileHeader}>
                <MaterialCommunityIcons name="chef-hat" size={20} color={workerProfile === 'professional' ? colors.white : colors.primary} />
                <Text style={[styles.profileTitle, workerProfile === 'professional' && styles.textWhite]}>Profissional</Text>
              </View>
              <Text style={[styles.profileDesc, workerProfile === 'professional' && styles.textWhite]}>
                É minha renda principal, já tenho técnica e clientes fixos.
              </Text>
              <Text style={[styles.profileRate, workerProfile === 'professional' && styles.textWhite]}>Sugerido: ~R$ 20/h</Text>
            </TouchableOpacity>

            {/* Especialista */}
            <TouchableOpacity 
              style={[styles.profileCard, workerProfile === 'expert' && styles.profileCardActive]}
              onPress={() => selectProfile('expert', 35)}
              activeOpacity={0.8}
            >
              <View style={styles.profileHeader}>
                <MaterialCommunityIcons name="crown-outline" size={20} color={workerProfile === 'expert' ? colors.white : colors.primary} />
                <Text style={[styles.profileTitle, workerProfile === 'expert' && styles.textWhite]}>Especialista</Text>
              </View>
              <Text style={[styles.profileDesc, workerProfile === 'expert' && styles.textWhite]}>
                Faço doces finos, modelagens complexas ou grandes eventos.
              </Text>
              <Text style={[styles.profileRate, workerProfile === 'expert' && styles.textWhite]}>Sugerido: R$ 35+/h</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Valor da Minha Hora (R$)</Text>
            <Text style={styles.helperText}>Você pode ajustar o valor manualmente se preferir.</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={hourlyRate}
              onChangeText={setHourlyRate}
              placeholder="Ex: 15,00"
            />
          </View>
        </View>

        {/* Seção: Custos Invariáveis e Lucro */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="calculator-variant" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Custos e Margem</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Taxas padrões aplicadas conforme as regras de negócio do app.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Custos Fixos Indiretos (%)</Text>
            <Text style={styles.helperText}>Cobre água, luz, gás e perdas. Sugerido: 12%.</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                keyboardType="numeric"
                value={fixedCostsPercent}
                onChangeText={setFixedCostsPercent}
                placeholder="Ex: 12"
              />
              <Text style={styles.percentIcon}>%</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Margem de Lucro Padrão (%)</Text>
            <Text style={styles.helperText}>O quanto você quer lucrar líquido em cima do custo total.</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                keyboardType="numeric"
                value={profitMargin}
                onChangeText={setProfitMargin}
                placeholder="Ex: 40"
              />
              <Text style={styles.percentIcon}>%</Text>
            </View>
          </View>
        </View>

        {/* Botão Salvar */}
        <TouchableOpacity 
          style={styles.saveButton}
          activeOpacity={0.8}
          onPress={handleSave}
        >
          <MaterialCommunityIcons name="content-save" size={20} color={colors.white} style={{ marginRight: 8 }} />
          <Text style={styles.saveButtonText}>Salvar Configurações</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.7,
    marginBottom: 20,
    lineHeight: 20,
  },
  profilesContainer: {
    marginBottom: 20,
  },
  profileCard: {
    borderWidth: 2,
    borderColor: colors.muted,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    backgroundColor: colors.white,
  },
  profileCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  profileTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
  },
  profileDesc: {
    fontSize: 13,
    color: colors.text,
    opacity: 0.8,
    marginBottom: 8,
  },
  profileRate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  textWhite: {
    color: colors.white,
  },
  inputGroup: {
    marginBottom: 16,
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
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 12,
  },
  saveButton: {
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
