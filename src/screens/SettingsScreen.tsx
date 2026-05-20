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
  const [salary, setSalary] = useState(settings.salary.toString().replace('.', ','));
  const [hoursPerDay, setHoursPerDay] = useState(settings.hoursPerDay.toString());
  const [daysPerWeek, setDaysPerWeek] = useState(settings.daysPerWeek.toString());
  const [fixedCostsPercent, setFixedCostsPercent] = useState(settings.fixedCostsPercent.toString());
  const [profitMargin, setProfitMargin] = useState(settings.profitMarginPercent.toString());

  // Atualiza os inputs se o estado global mudar em outro lugar
  useEffect(() => {
    setSalary(settings.salary.toFixed(2).replace('.', ','));
    setHoursPerDay(settings.hoursPerDay.toString());
    setDaysPerWeek(settings.daysPerWeek.toString());
    setFixedCostsPercent(settings.fixedCostsPercent.toString());
    setProfitMargin(settings.profitMarginPercent.toString());
  }, [settings]);

  // Cálculos baseados nos inputs atuais
  const parsedSalary = parseFloat(salary.replace(',', '.')) || 0;
  const parsedHours = parseFloat(hoursPerDay) || 0;
  const parsedDays = parseFloat(daysPerWeek) || 0;
  
  // (Horas/dia * Dias/semana * 4 semanas/mês)
  const totalHoursMonth = parsedHours * parsedDays * 4;
  const hourlyRate = totalHoursMonth > 0 ? (parsedSalary / totalHoursMonth) : 0;

  const handleSave = () => {
    updateSettings({
      salary: parsedSalary,
      hoursPerDay: parsedHours,
      daysPerWeek: parsedDays,
      fixedCostsPercent: parseFloat(fixedCostsPercent) || 0,
      profitMarginPercent: parseFloat(profitMargin) || 0,
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
        
        {/* Seção: Mão de Obra */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account-hard-hat" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Sua Mão de Obra</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Defina o quanto você quer ganhar para calcularmos o custo da sua hora de trabalho.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Salário Desejado Mensal (R$)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={salary}
              onChangeText={setSalary}
              placeholder="Ex: 2500,00"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Horas / Dia</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={hoursPerDay}
                onChangeText={setHoursPerDay}
                placeholder="Ex: 8"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Dias / Semana</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={daysPerWeek}
                onChangeText={setDaysPerWeek}
                placeholder="Ex: 5"
              />
            </View>
          </View>

          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>Custo da sua Hora (Aprox.)</Text>
            <Text style={styles.resultValue}>
              R$ {hourlyRate.toFixed(2).replace('.', ',')} / hora
            </Text>
          </View>
        </View>

        {/* Seção: Custos Invariáveis e Lucro */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="calculator-variant" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Custos e Margem</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Taxas padrões que serão aplicadas em todos os seus produtos finais.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Custos Fixos Invariáveis (%)</Text>
            <Text style={styles.helperText}>Adicional para cobrir água, luz, gás, detergente, etc.</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                keyboardType="numeric"
                value={fixedCostsPercent}
                onChangeText={setFixedCostsPercent}
                placeholder="Ex: 15"
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
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  resultBox: {
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.8,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
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
