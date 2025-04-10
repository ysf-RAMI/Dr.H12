import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Image, RefreshControl, Alert } from 'react-native';
import {
  Button,
  Dialog,
  Portal,
  Text,
  TextInput,
  Provider as PaperProvider,
  ActivityIndicator,
  Avatar,
  Card,
  Divider,
  HelperText,
} from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {  MaterialIcons } from '@expo/vector-icons';
import { jwtDecode } from 'jwt-decode';

const ProfileScreen = () => {
  // State management
  const [profile, setProfile] = useState({
    nom: '',
    prenom: '',
    email: '',
  });
  const [password, setPassword] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({
    profile: {},
    password: {},
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [token, setToken] = useState('');
  const [profId, setProfId] = useState('');
  const [visibleDialog, setVisibleDialog] = useState(null); // 'profile', 'password'
  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const navigation = useNavigation();

  // Configuration
  const baseUrl = 'https://doctorh1-kjmev.ondigitalocean.app';
  const defaultAvatar = require('../../../assets/image-Photoroom.jpg');

  // Theme colors
  const themeColors = {
    primary: '#003366',
    secondary: '#01162e',
    white: '#ffffff',
    lightBlue: '#e6eef5',
    midBlue: '#0055a4',
    background: '#f5f5f5',
    surface: '#ffffff',
    textLight: '#666666',
    warning: '#ff9800',
    divider: '#e0e0e0',
  };

  // Load authentication data
  const loadAuthData = async () => {
    try {
      const [authData, storedProfId] = await Promise.all([
        AsyncStorage.getItem('auth'),
        AsyncStorage.getItem('profId')
      ]);
      
      if (authData && storedProfId) {
        const parsedAuth = JSON.parse(authData);
        setToken(parsedAuth.token);
        setProfId(storedProfId);
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
      showSnackbar('Failed to load authentication data');
    }
  };

  // Fetch profile data
  const fetchProfile = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const decoded = jwtDecode(token);
      const email = decoded.sub;

      const response = await axios.get(
        `${baseUrl}/api/professeur/getProfil/${email}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data) {
        setProfile({
          nom: response.data.nom || '',
          prenom: response.data.prenom || '',
          email: response.data.email || '',
        });
      }
    } catch (error) {
      console.error('Fetch error:', error);
      showSnackbar('Failed to fetch profile data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  // Initial load
  useEffect(() => {
    loadAuthData();
  }, []);

  // Fetch data when token is available
  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  // Validate profile form
  const validateProfile = () => {
    const newErrors = {};
    
    if (!profile.nom) newErrors.nom = 'Last name is required';
    if (!profile.prenom) newErrors.prenom = 'First name is required';
    if (!profile.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profile.email)) {
      newErrors.email = 'Email is invalid';
    }

    setErrors(prev => ({ ...prev, profile: newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  // Validate password form
  const validatePassword = () => {
    const newErrors = {};
    
    if (!password.oldPassword) newErrors.oldPassword = 'Current password is required';
    if (!password.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (password.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (!password.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password.confirmPassword !== password.newPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(prev => ({ ...prev, password: newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  // Update profile
  const updateProfile = async () => {
    if (!validateProfile()) return;
    
    try {
      const response = await axios.put(
        `${baseUrl}/api/professeur/ModifierProfil`,
        {
          id: profId,
          nom: profile.nom,
          prenom: profile.prenom,
          email: profile.email,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        setVisibleDialog(null);
        await AsyncStorage.multiRemove(['auth', 'profId']);
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        showSnackbar('Profile updated successfully. Please login again.');
      }
    } catch (error) {
      console.error('Update error:', error);
      showSnackbar('Failed to update profile');
    }
  };

  // Update password
  const updatePassword = async () => {
    if (!validatePassword()) return;
    
    try {
      const response = await axios.put(
        `${baseUrl}/api/professeur/updatePassword`,
        {
          id: profId,
          oldPassword: password.oldPassword,
          newPassword: password.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        setVisibleDialog(null);
        setPassword({
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        showSnackbar('Password updated successfully');
      }
    } catch (error) {
      console.error('Password update error:', error);
      showSnackbar('Failed to update password');
    }
  };

  // Show snackbar message
  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleLastNameChange = (text) => {
    setProfile({ ...profile, nom: text });
  }

  if (loading && !profile.email) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <PaperProvider>
      <ScrollView 
        style={[styles.container, { backgroundColor: themeColors.background }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[themeColors.primary]}
            tintColor={themeColors.primary}
          />
        }
      >
        {/* Profile Header */}
        <View style={[styles.headerContainer, { backgroundColor: themeColors.surface }]}>
          <Avatar.Image 
            size={150}
            source={defaultAvatar}
            style={styles.avatar}
          />
          
          <Text variant="headlineMedium" style={[styles.nameText, { color: themeColors.primary }]}>
            Dr. {profile.nom.toUpperCase()} {profile.prenom}
          </Text>
          
          <View style={styles.emailContainer}>
            <MaterialIcons name="email" size={20} color={themeColors.secondary} />
            <Text variant="bodyLarge" style={[styles.emailText, { color: themeColors.textLight }]}>
              {profile.email}
            </Text>
          </View>
          
          <Divider style={[styles.divider, { backgroundColor: themeColors.divider }]} />
          
          <Text variant="bodyMedium" style={[styles.idText, { color: themeColors.textLight }]}>
            ID Professeur: {profId}
          </Text>
        </View>

        {/* Profile Information */}
        <Card style={[styles.infoCard, { backgroundColor: themeColors.surface }]}>
          <Card.Content>
            <Text variant="titleLarge" style={[styles.sectionTitle, { color: themeColors.primary }]}>
              Informations du Professeur
            </Text>
            
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={[styles.infoLabel, { color: themeColors.textLight }]}>
                Prénom
              </Text>
              <Text variant="bodyLarge" style={[styles.infoValue, { color: themeColors.primary }]}>
                {profile.prenom}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={[styles.infoLabel, { color: themeColors.textLight }]}>
                Nom
              </Text>
              <Text variant="bodyLarge" style={[styles.infoValue, { color: themeColors.primary }]}>
                {profile.nom}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={[styles.infoLabel, { color: themeColors.textLight }]}>
                Email
              </Text>
              <Text variant="bodyLarge" style={[styles.infoValue, { color: themeColors.primary }]}>
                {profile.email}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={[styles.infoLabel, { color: themeColors.textLight }]}>
                Titre académique
              </Text>
              <Text variant="bodyLarge" style={[styles.infoValue, { color: themeColors.primary }]}>
                Professeur
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            icon="account-edit"
            onPress={() => setVisibleDialog('profile')}
            style={styles.editButton}
            buttonColor={themeColors.primary}
            labelStyle={styles.buttonLabel}
          >
            Modifier Profil
          </Button>
          
          <Button
            mode="outlined"
            icon="lock-reset"
            onPress={() => setVisibleDialog('password')}
            style={[styles.passwordButton, { borderColor: themeColors.primary }]}
            textColor={themeColors.primary}
            labelStyle={styles.buttonLabel}
          >
            Changer Mot de Passe
          </Button>
        </View>

        {/* Edit Profile Dialog */}
        <Portal>
          <Dialog 
            visible={visibleDialog === 'profile'} 
            onDismiss={() => setVisibleDialog(null)}
            style={{ backgroundColor: themeColors.surface, borderRadius: 12 }}
          >
            <Dialog.Title style={[styles.dialogTitle, { color: themeColors.primary }]}>
              <MaterialIcons name="account-circle" size={24} color={themeColors.primary} />
              <Text style={[styles.dialogTitleText, { color: themeColors.primary }]}>Modifier Profil</Text>
            </Dialog.Title>
            <Dialog.Content>
              <Text style={styles.warningText}>
                <MaterialIcons name="warning" size={16} color={themeColors.warning} />
                <Text style={{ marginLeft: 5, color: themeColors.warning }}>
                  Vous devrez peut-être vous reconnecter après les modifications.
                </Text>
              </Text>
              
              <TextInput
                label="Nom"
                value={profile.nom}
                onChangeText={handleLastNameChange}
                onBlur={() => validateProfile()}
                error={!!errors.profile.nom}
                style={[styles.input, { backgroundColor: themeColors.surface }]}
                mode="outlined"
                outlineColor={themeColors.secondary}
                activeOutlineColor={themeColors.primary}
              />
              <HelperText type="error" visible={!!errors.profile.nom}>
                {errors.profile.nom}
              </HelperText>
              
              <TextInput
                label="Prénom"
                value={profile.prenom}
                onChangeText={text => setProfile({...profile, prenom: text})}
                onBlur={() => validateProfile()}
                error={!!errors.profile.prenom}
                style={[styles.input, { backgroundColor: themeColors.surface }]}
                mode="outlined"
                outlineColor={themeColors.secondary}
                activeOutlineColor={themeColors.primary}
              />
              <HelperText type="error" visible={!!errors.profile.prenom}>
                {errors.profile.prenom}
              </HelperText>
              
              <TextInput
                label="Adresse Email"
                value={profile.email}
                onChangeText={text => setProfile({...profile, email: text})}
                onBlur={() => validateProfile()}
                error={!!errors.profile.email}
                keyboardType="email-address"
                style={[styles.input, { backgroundColor: themeColors.surface }]}
                mode="outlined"
                outlineColor={themeColors.secondary}
                activeOutlineColor={themeColors.primary}
                left={<TextInput.Icon icon="email" color={themeColors.secondary} />}
              />
              <HelperText type="error" visible={!!errors.profile.email}>
                {errors.profile.email}
              </HelperText>
            </Dialog.Content>
            <Dialog.Actions>
              <Button 
                onPress={() => setVisibleDialog(null)}
                style={styles.cancelButton}
                textColor={themeColors.textLight}
                labelStyle={styles.dialogButtonLabel}
              >
                Annuler
              </Button>
              <Button 
                onPress={updateProfile}
                mode="contained"
                style={[styles.saveButton, { backgroundColor: themeColors.primary }]}
                labelStyle={styles.dialogButtonLabel}
              >
                Enregistrer
              </Button>
            </Dialog.Actions>
          </Dialog>

          {/* Change Password Dialog */}
          <Dialog 
            visible={visibleDialog === 'password'} 
            onDismiss={() => setVisibleDialog(null)}
            style={{ backgroundColor: themeColors.surface, borderRadius: 12 }}
          >
            <Dialog.Title style={[styles.dialogTitle, { color: themeColors.primary }]}>
              <MaterialIcons name="lock" size={24} color={themeColors.primary} />
              <Text style={[styles.dialogTitleText, { color: themeColors.primary }]}>Changer Mot de Passe</Text>
            </Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Mot de Passe Actuel"
                value={password.oldPassword}
                onChangeText={text => setPassword({...password, oldPassword: text})}
                onBlur={() => validatePassword()}
                error={!!errors.password.oldPassword}
                secureTextEntry={!showPassword.old}
                style={[styles.input, { backgroundColor: themeColors.surface }]}
                mode="outlined"
                outlineColor={themeColors.secondary}
                activeOutlineColor={themeColors.primary}
                left={<TextInput.Icon icon="lock" color={themeColors.secondary} />}
                right={
                  <TextInput.Icon 
                    icon={showPassword.old ? "eye-off" : "eye"} 
                    onPress={() => togglePasswordVisibility('old')}
                    color={themeColors.secondary}
                  />
                }
              />
              <HelperText type="error" visible={!!errors.password.oldPassword}>
                {errors.password.oldPassword}
              </HelperText>
              
              <TextInput
                label="Nouveau Mot de Passe"
                value={password.newPassword}
                onChangeText={text => setPassword({...password, newPassword: text})}
                onBlur={() => validatePassword()}
                error={!!errors.password.newPassword}
                secureTextEntry={!showPassword.new}
                style={[styles.input, { backgroundColor: themeColors.surface }]}
                mode="outlined"
                outlineColor={themeColors.secondary}
                activeOutlineColor={themeColors.primary}
                left={<TextInput.Icon icon="key" color={themeColors.secondary} />}
                right={
                  <TextInput.Icon 
                    icon={showPassword.new ? "eye-off" : "eye"} 
                    onPress={() => togglePasswordVisibility('new')}
                    color={themeColors.secondary}
                  />
                }
              />
              <HelperText type="error" visible={!!errors.password.newPassword}>
                {errors.password.newPassword}
              </HelperText>
              
              <TextInput
                label="Confirmer Mot de Passe"
                value={password.confirmPassword}
                onChangeText={text => setPassword({...password, confirmPassword: text})}
                onBlur={() => validatePassword()}
                error={!!errors.password.confirmPassword}
                secureTextEntry={!showPassword.confirm}
                style={[styles.input, { backgroundColor: themeColors.surface }]}
                mode="outlined"
                outlineColor={themeColors.secondary}
                activeOutlineColor={themeColors.primary}
                left={<TextInput.Icon icon="key" color={themeColors.secondary} />}
                right={
                  <TextInput.Icon 
                    icon={showPassword.confirm ? "eye-off" : "eye"} 
                    onPress={() => togglePasswordVisibility('confirm')}
                    color={themeColors.secondary}
                  />
                }
              />
              <HelperText type="error" visible={!!errors.password.confirmPassword}>
                {errors.password.confirmPassword}
              </HelperText>
            </Dialog.Content>
            <Dialog.Actions>
              <Button 
                onPress={() => setVisibleDialog(null)}
                style={styles.cancelButton}
                textColor={themeColors.textLight}
                labelStyle={styles.dialogButtonLabel}
              >
                Annuler
              </Button>
              <Button 
                onPress={updatePassword}
                mode="contained"
                style={[styles.saveButton, { backgroundColor: themeColors.primary }]}
                labelStyle={styles.dialogButtonLabel}
              >
                Mettre à Jour
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </ScrollView>

      {/* Refresh Overlay */}
      {refreshing && (
        <View style={styles.refreshOverlay}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={styles.refreshText}>Actualisation du profil...</Text>
        </View>
      )}
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  refreshText: {
    marginTop: 10,
    fontSize: 16,
    color: '#01162e',
    fontWeight: '500',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 20,
    borderRadius: 10,
    elevation: 3,
    backgroundColor: '#ffffff',
  },
  avatar: {
    marginBottom: 15,
    backgroundColor: '#e6eef5',
  },
  nameText: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    fontSize: 22,
    color: '#01162e',
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  emailText: {
    marginLeft: 5,
    color: '#666666',
  },
  divider: {
    width: '100%',
    marginVertical: 10,
    height: 1,
  },
  idText: {
    color: '#666666',
  },
  infoCard: {
    marginBottom: 20,
    borderRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#01162e',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    color: '#666666',
  },
  infoValue: {
    fontWeight: '500',
    color: '#01162e',
  },
  actionsContainer: {
    marginTop: 10,
  },
  editButton: {
    marginBottom: 15,
    borderRadius: 8,
    paddingVertical: 5,
    elevation: 2,
    backgroundColor: '#01162e',
  },
  passwordButton: {
    borderRadius: 8,
    paddingVertical: 5,
    marginBottom: 35,
    borderWidth: 1.5,
    borderColor: '#01162e',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  dialogTitle: { 
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  dialogTitleText: {
    marginLeft: 10,
    fontSize: 18,
    fontWeight: 'bold',
  },
  warningText: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  input: {
    marginBottom: 5,
    backgroundColor: '#ffffff',
  },
  cancelButton: {
    marginRight: 10,
  },
  saveButton: {
    minWidth: 100,
  },
  dialogButtonLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ProfileScreen;