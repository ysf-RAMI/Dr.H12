import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import {
  Text,
  Button,
  Dialog,
  Portal,
  TextInput,
  HelperText,
  Snackbar,
  Avatar,
  Card,
  Divider
} from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { jwtDecode } from 'jwt-decode';
import { useNavigation } from '@react-navigation/native';

const AdminProfile = () => {
  // Colors
  const colors = {
    primary: '#01162e',
    secondary: '#003366',
    accent: '#365e8e',
    background: '#f8f9fa',
    surface: 'white',
    text: '#01162e',
    textLight: '#666666',
    error: '#d90429',
  };

  // Refs for uncontrolled inputs
  const nomInputRef = useRef('');
  const prenomInputRef = useRef('');
  const emailInputRef = useRef('');
  const oldPasswordRef = useRef('');
  const newPasswordRef = useRef('');
  const confirmPasswordRef = useRef('');
  const navigation = useNavigation();

  // Profile state
  const [profile, setProfile] = useState({
    nom: '',
    prenom: '',
    email: '',
    id: null
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errors, setErrors] = useState({});
  const [visibleDialog, setVisibleDialog] = useState(null);
  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false
  });
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: ''
  });

  const API_URL = 'https://doctorh1-kjmev.ondigitalocean.app/api/admin';

  // Load profile data
  const loadProfile = async () => {
    try {
      setLoading(true);
      const authData = await AsyncStorage.getItem('auth');
      if (!authData) throw new Error('Aucune donnée d\'authentification');
      
      const { token } = JSON.parse(authData);
      const decoded = jwtDecode(token);
      
      const response = await axios.get(`${API_URL}/getProfil/${decoded.sub}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        setProfile({
          nom: response.data.nom || '',
          prenom: response.data.prenom || '',
          email: response.data.email || '',
          id: response.data.id
        });
      }
    } catch (error) {
      showMessage('Échec du chargement du profil');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  // Initialize
  useEffect(() => {
    loadProfile();
  }, []);

  // Initialize edit form with current profile data
  const initEditForm = () => {
    nomInputRef.current = profile.nom;
    prenomInputRef.current = profile.prenom;
    emailInputRef.current = profile.email;
  };

  // Form validation
  const validateProfile = () => {
    const newErrors = {};
    
    if (!nomInputRef.current.trim()) newErrors.nom = 'Le nom est obligatoire';
    if (!prenomInputRef.current.trim()) newErrors.prenom = 'Le prénom est obligatoire';
    if (!emailInputRef.current.trim()) {
      newErrors.email = 'L\'email est obligatoire';
    } else if (!/\S+@\S+\.\S+/.test(emailInputRef.current)) {
      newErrors.email = 'Format d\'email invalide';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};
    
    if (!oldPasswordRef.current) newErrors.oldPassword = 'Le mot de passe actuel est obligatoire';
    if (!newPasswordRef.current) {
      newErrors.newPassword = 'Le nouveau mot de passe est obligatoire';
    } else if (newPasswordRef.current.length < 6) {
      newErrors.newPassword = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    if (!confirmPasswordRef.current) {
      newErrors.confirmPassword = 'Veuillez confirmer votre mot de passe';
    } else if (confirmPasswordRef.current !== newPasswordRef.current) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update profile
  const updateProfile = async () => {
    if (!validateProfile()) return;
    
    try {
      const authData = await AsyncStorage.getItem('auth');
      const { token } = JSON.parse(authData);
      
      const response = await axios.put(
        `${API_URL}/ModifierProfil`,
        {
          id: profile.id,
          nom: nomInputRef.current,
          prenom: prenomInputRef.current,
          email: emailInputRef.current
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.status === 200) {
        const emailChanged = emailInputRef.current !== profile.email;
        
        setProfile({
          ...profile,
          nom: nomInputRef.current,
          prenom: prenomInputRef.current,
          email: emailInputRef.current
        });
        
        setVisibleDialog(null);
        showMessage('Profil mis à jour avec succès');
        
        // Only logout if email changed
        if (emailChanged) {
          await AsyncStorage.removeItem('auth');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }], 
          });
        }
      }
    } catch (error) {
      showMessage('Échec de la mise à jour du profil');
    }
  };

  // Update password
  const updatePassword = async () => {
    if (!validatePassword()) return;
    
    try {
      const authData = await AsyncStorage.getItem('auth');
      const { token } = JSON.parse(authData);
      
      const response = await axios.put(
        `${API_URL}/updatePassword`,
        {
          id: profile.id,
          oldPassword: oldPasswordRef.current,
          newPassword: newPasswordRef.current
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.status === 200) {
        setVisibleDialog(null);
        oldPasswordRef.current = '';
        newPasswordRef.current = '';
        confirmPasswordRef.current = '';
        showMessage('Mot de passe mis à jour avec succès');
      }
    } catch (error) {
      showMessage('Échec de la mise à jour du mot de passe');
    }
  };

  // Helper functions
  const showMessage = (message) => {
    setSnackbar({
      visible: true,
      message
    });
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Loading state
  if (loading && !profile.email) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{marginTop: 10, color: colors.primary}}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: colors.background}]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary, colors.accent]}
          tintColor={colors.primary}
        />
      }
    >
      {/* Profile Header */}
      <View style={styles.headerContainer}>
        <Avatar.Image 
          size={120}
          source={require('../../../assets/image-Photoroom.jpg')}
          style={styles.avatar}
        />
        
        <Text variant="headlineSmall" style={styles.nameText}>
          {profile.prenom} {profile.nom.toUpperCase()}
        </Text>
        
        <View style={styles.roleContainer}>
          <MaterialIcons name="admin-panel-settings" size={20} color="#003366" />
          <Text variant="bodyLarge" style={styles.roleText}>
            Administrateur
          </Text>
        </View>
        
        <View style={styles.emailContainer}>
          <MaterialIcons name="email" size={16} color="#666" />
          <Text variant="bodyMedium" style={styles.emailText}>
            {profile.email}
          </Text>
        </View>
        
        <Divider style={styles.divider} />
      </View>

      {/* Admin Information */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Informations de l'Administrateur
          </Text>
          
          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.infoLabel}>
              Prénom
            </Text>
            <Text variant="bodyLarge" style={styles.infoValue}>
              {profile.prenom}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.infoLabel}>
              Nom
            </Text>
            <Text variant="bodyLarge" style={styles.infoValue}>
              {profile.nom}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.infoLabel}>
              Email
            </Text>
            <Text variant="bodyLarge" style={styles.infoValue}>
              {profile.email}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <Button
          mode="contained"
          icon="account-edit"
          onPress={() => {
            initEditForm();
            setVisibleDialog('profile');
            setErrors({});
          }}
          style={styles.editButton}
        >
          Modifier Profil
        </Button>
        
        <Button
          mode="outlined"
          icon="lock-reset"
          onPress={() => {
            oldPasswordRef.current = '';
            newPasswordRef.current = '';
            confirmPasswordRef.current = '';
            setVisibleDialog('password');
            setErrors({});
          }}
          style={styles.passwordButton}
        >
          Changer Mot de Passe
        </Button>
      </View>

      {/* Edit Profile Dialog */}
      <Portal>
        <Dialog 
          visible={visibleDialog === 'profile'} 
          onDismiss={() => setVisibleDialog(null)}
          style={{borderRadius: 16, backgroundColor: colors.surface}}
        >
          <Dialog.Title style={{color: colors.primary}}>Modifier Profil</Dialog.Title>
          <Text variant="bodyMedium" style={styles.requiredText}>
            <MaterialCommunityIcons name="alert" size={16} color={colors.error} /> 
            Si vos informations sont modifiées, vous serez déconnecté.
          </Text>
          <Dialog.Content>
            <TextInput
              label="Nom"
              defaultValue={profile.nom}
              onChangeText={(text) => nomInputRef.current = text}
              error={!!errors.nom}
              style={{backgroundColor: colors.background, marginBottom: 8}}
              mode="outlined"
              theme={{ colors: { primary: colors.primary, error: colors.error } }}
            />
            <HelperText type="error" visible={!!errors.nom}>
              {errors.nom || "Le nom est obligatoire"}
            </HelperText>
            
            <TextInput
              label="Prénom"
              defaultValue={profile.prenom}
              onChangeText={(text) => prenomInputRef.current = text}
              error={!!errors.prenom}
              style={{backgroundColor: colors.background, marginBottom: 8}}
              mode="outlined"
              theme={{ colors: { primary: colors.primary, error: colors.error } }}
            />
            <HelperText type="error" visible={!!errors.prenom}>
              {errors.prenom || "Le prénom est obligatoire"}
            </HelperText>
            
            <TextInput
              label="Email"
              defaultValue={profile.email}
              onChangeText={(text) => emailInputRef.current = text}
              error={!!errors.email}
              keyboardType="email-address"
              style={{backgroundColor: colors.background, marginBottom: 8}}
              mode="outlined"
              theme={{ colors: { primary: colors.primary, error: colors.error } }}
            />
            <HelperText type="error" visible={!!errors.email}>
              {errors.email || "L'email est obligatoire"}
            </HelperText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setVisibleDialog(null)} color={colors.accent}>Annuler</Button>
            <Button onPress={updateProfile} color={colors.primary}>Enregistrer</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Change Password Dialog */}
      <Portal>
        <Dialog 
          visible={visibleDialog === 'password'} 
          onDismiss={() => setVisibleDialog(null)}
          style={{borderRadius: 16, backgroundColor: colors.surface}}
        >
          <Dialog.Title style={{color: colors.primary}}>Changer Mot de Passe</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Mot de passe actuel"
              secureTextEntry={!showPassword.old}
              onChangeText={(text) => oldPasswordRef.current = text}
              error={!!errors.oldPassword}
              style={{backgroundColor: colors.background, marginBottom: 8}}
              mode="outlined"
              theme={{ colors: { primary: colors.primary, error: colors.error } }}
              right={
                <TextInput.Icon 
                  icon={showPassword.old ? "eye-off" : "eye"} 
                  onPress={() => togglePasswordVisibility('old')}
                  color={colors.accent}
                />
              }
            />
            <HelperText type="error" visible={!!errors.oldPassword}>
              {errors.oldPassword || "Le mot de passe actuel est obligatoire"}
            </HelperText>
            
            <TextInput
              label="Nouveau mot de passe"
              secureTextEntry={!showPassword.new}
              onChangeText={(text) => newPasswordRef.current = text}
              error={!!errors.newPassword}
              style={{backgroundColor: colors.background, marginBottom: 8}}
              mode="outlined"
              theme={{ colors: { primary: colors.primary, error: colors.error } }}
              right={
                <TextInput.Icon 
                  icon={showPassword.new ? "eye-off" : "eye"} 
                  onPress={() => togglePasswordVisibility('new')}
                  color={colors.accent}
                />
              }
            />
            <HelperText type="error" visible={!!errors.newPassword}>
              {errors.newPassword || "Le nouveau mot de passe est obligatoire"}
            </HelperText>
            
            <TextInput
              label="Confirmer mot de passe"
              secureTextEntry={!showPassword.confirm}
              onChangeText={(text) => confirmPasswordRef.current = text}
              error={!!errors.confirmPassword}
              style={{backgroundColor: colors.background, marginBottom: 8}}
              mode="outlined"
              theme={{ colors: { primary: colors.primary, error: colors.error } }}
              right={
                <TextInput.Icon 
                  icon={showPassword.confirm ? "eye-off" : "eye"} 
                  onPress={() => togglePasswordVisibility('confirm')}
                  color={colors.accent}
                />
              }
            />
            <HelperText type="error" visible={!!errors.confirmPassword}>
              {errors.confirmPassword || "Les mots de passe ne correspondent pas"}
            </HelperText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setVisibleDialog(null)} color={colors.accent}>Annuler</Button>
            <Button onPress={updatePassword} color={colors.primary}>Mettre à jour</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Snackbar */}
      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({...snackbar, visible: false})}
        duration={3000}
        style={{backgroundColor: colors.primary}}
      >
        {snackbar.message}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 3
  },
  avatar: {
    marginBottom: 15,
    backgroundColor: '#e0e0e0'
  },
  nameText: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#01162e'
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  roleText: {
    marginLeft: 5,
    fontWeight: 'bold',
    color: '#003366'
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  emailText: {
    marginLeft: 5,
    color: '#666'
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 15
  },
  infoCard: {
    marginBottom: 20,
    borderRadius: 10,
    elevation: 2
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#01162e'
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 5
  },
  infoLabel: {
    color: '#666'
  },
  infoValue: {
    fontWeight: '500',
    color: '#01162e'
  },
  actionsContainer: {
    marginTop: 10
  },
  editButton: {
    marginBottom: 15,
    backgroundColor: '#01162e',
    borderRadius: 18,
    elevation: 2,
  },
  passwordButton: {
    borderColor: '#365e8e',
    borderRadius: 18,
    marginBottom: 15,
    elevation: 1,
  },
  requiredText: {
    color: '#d90429',
    marginBottom: 10,
    fontSize: 14,
    paddingHorizontal: 24
  },
});

export default AdminProfile;