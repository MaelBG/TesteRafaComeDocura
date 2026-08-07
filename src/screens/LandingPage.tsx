import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/types';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Landing'>;

const LandingPage: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.content}>
        {/* Hero Section / Illustration */}
        <View style={styles.heroContainer}>
          <View style={styles.circleDecoration} />
          <View style={styles.illustrationPlaceholder}>
            <Image 
              source={require('../../assets/icon.png')} 
              style={styles.heroImage} 
            />
          </View>
        </View>

        {/* Text Section */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Rafa com Doçura</Text>
          <Text style={styles.subtitle}>
            Gerencie sua produção e precifique seus doces com perfeição.
          </Text>
        </View>

        {/* Button Section */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.button}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Main')}
          >
            <Text style={styles.buttonText}>Começar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  heroContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: width * 0.7,
  },
  circleDecoration: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: (width * 0.6) / 2,
    backgroundColor: colors.primary,
    opacity: 0.5,
  },
  illustrationPlaceholder: {
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  heroImage: {
    width: width * 0.4,
    height: width * 0.4,
    resizeMode: 'contain',
  },
  textContainer: {
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  footer: {
    width: '100%',
    paddingHorizontal: 30,
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LandingPage;
