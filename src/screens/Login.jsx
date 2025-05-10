import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  ActivityIndicator, 
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const baseUrl = "https://doctorh1-kjmev.ondigitalocean.app";

// Theme colors
const themeColors = {
  primary: '#01162e',
  secondary: '#3a86ff',
  accent: '#4361ee',
  background: '#f8f9fa',
  surface: '#ffffff',
  text: '#333333',
  textLight: '#666666',
  error: '#d90429',
  success: '#38b000',
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  const navigation = useNavigation();
  
  useEffect(() => {
    // Check if user is already logged in
    checkLoginStatus();
  }, []);
  
  // Update checkLoginStatus Alert to French
  const checkLoginStatus = async () => {
    const auth = await AsyncStorage.getItem('auth');
    if (auth) {
      Alert.alert('Déjà connecté', 'Redirection vers le tableau de bord');
      navigation.replace('Main');
    }
  };
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Clear form and errors
    setEmail('');
    setPassword('');
    setError('');
    setRefreshing(false);
  }, []);
  
  // Update error message to French
  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez saisir votre email et mot de passe');
      return;
    }
  
    setLoading(true);
    setError('');
  
    try {
      const response = await axios.post(
        `${baseUrl}/api/authenticate`,
        { email, password }
      );
      
      if (response.data && response.data.jwt) {
        const token = response.data.jwt;
        await AsyncStorage.setItem('auth', JSON.stringify({ token }));
        
        // This will trigger the TabNavigator to update
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }], // Make sure 'Main' is your TabNavigator route name
        });
      }
    } catch (error) {
      setError('Email ou mot de passe invalide');
      console.log('Login error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Update UI text to French
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
     
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[themeColors.primary]}
            tintColor={themeColors.primary}
          />
        }
      >
        <View style={styles.logoContainer}>
          <Text style={[styles.title, { color: themeColors.primary }]}>Doctor H1</Text>
          <Text style={[styles.slogan, { color: themeColors.textLight }]}>Votre plateforme d'apprentissage</Text>
        </View>
        
        <View style={styles.formContainer}>
          {error ? (
            <View style={[styles.errorContainer, { borderLeftColor: themeColors.error }]}>
              <Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text>
            </View>
          ) : null}
          
          <View style={styles.inputWrapper}>
            <Text style={[styles.label, { color: themeColors.text }]}>Email</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: themeColors.surface, borderColor: themeColors.secondary, borderWidth: 1 }]} 
              placeholder="Entrez votre email" 
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              placeholderTextColor={themeColors.textLight}
            />
          </View>
          
          <View style={styles.inputWrapper}>
            <Text style={[styles.label, { color: themeColors.text }]}>Mot de passe</Text>
            <View style={[styles.passwordContainer, { backgroundColor: themeColors.surface, borderColor: themeColors.secondary, borderWidth: 1 }]}>
              <TextInput 
                style={styles.passwordInput} 
                placeholder="Entrez votre mot de passe" 
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                placeholderTextColor={themeColors.textLight}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.showPasswordButton}
              >
                <Text style={[styles.showPasswordText, { color: themeColors.secondary }]}>
                  {showPassword ? 'Cacher' : 'Afficher'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={() => Alert.alert('Réinitialiser le mot de passe', 'Contactez l\'administrateur pour réinitialiser votre mot de passe')}
          >
            <Text style={[styles.forgotPasswordText, { color: themeColors.secondary }]}>Mot de passe oublié?</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.loginButton, { backgroundColor: themeColors.primary }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Connexion</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 15,
  },
  slogan: {
    fontSize: 16,
    marginTop: 5,
  },
  formContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorContainer: {
    backgroundColor: '#ffeeee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 3,
  },
  errorText: {
    fontWeight: '500',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    height: 50,
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  showPasswordButton: {
    paddingHorizontal: 15,
    height: '100%',
    justifyContent: 'center',
  },
  showPasswordText: {
    fontWeight: '500',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 25,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  loginButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Login;