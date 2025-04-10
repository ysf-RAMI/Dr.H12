import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Text,
  Button,
  Portal,
  Dialog,
  Provider as PaperProvider,
  Searchbar,
  IconButton,
  HelperText,
  TextInput,
  Card,
  Menu,
  Divider
} from 'react-native-paper';
import axios from 'axios';

const Professeures = () => {
  // Refs for TextInput components
  const nameInputRef = useRef(null);
  const prenomInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // State management
  const [profs, setProfs] = useState([]);
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [openChangePassword, setOpenChangePassword] = useState(false);
  const [selectedProfId, setSelectedProfId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  
  // Form states with controlled inputs
  const [formData, setFormData] = useState({
    add: {
      name: '',
      prenom: '',
      email: '',
      password: ''
    },
    edit: {
      nom: '',
      prenom: '',
      email: ''
    },
    password: {
      new: '',
      confirm: ''
    }
  });
  
  // Password visibility toggles
  const [showPassword, setShowPassword] = useState({
    add: false,
    new: false,
    confirm: false
  });
  
  // Menu state
  const [menuState, setMenuState] = useState({
    visible: false,
    profId: null,
    x: 0,
    y: 0
  });

  const baseUrl = 'https://doctorh1-kjmev.ondigitalocean.app';
  const colors = {
    primary: '#01162e',
    secondary: '#003366',
    accent: '#365e8e',
    error: '#d90429',
    surface: 'white',
    text: '#01162e',
    textLight: '#666666',
  };

  // Load auth data
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const authData = await AsyncStorage.getItem('auth');
        if (!authData) throw new Error('Authentication data not found');
        const { token } = JSON.parse(authData);
        setToken(token);
      } catch (error) {
        Alert.alert('Error', 'Failed to load authentication data');
      } finally {
        setInitialLoading(false);
      }
    };
    loadAuthData();
  }, []);

  // Fetch professors
  const fetchProfs = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/admin/ListProfesseurs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfs(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch professors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchProfs();
  }, [token]);

  // Filter professors
  const filteredProfs = profs.filter(p => 
    `${p.prenom} ${p.nom} ${p.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Form validation
  const validateForm = (formType) => {
    const errors = {};
    const currentForm = formData[formType];
    
    if (formType === 'add') {
      if (!currentForm.name.trim()) errors.name = 'Name is required';
      if (!currentForm.prenom.trim()) errors.prenom = 'First name is required';
      if (!currentForm.email.trim()) errors.email = 'Email is required';
      if (!currentForm.password.trim()) errors.password = 'Password is required';
    } else if (formType === 'edit') {
      if (!currentForm.nom.trim()) errors.nom = 'Name is required';
      if (!currentForm.prenom.trim()) errors.prenom = 'First name is required';
      if (!currentForm.email.trim()) errors.email = 'Email is required';
    } else if (formType === 'password') {
      if (!currentForm.new.trim()) errors.new = 'New password is required';
      if (!currentForm.confirm.trim()) errors.confirm = 'Confirm password is required';
      if (currentForm.new !== currentForm.confirm) errors.match = 'Passwords do not match';
      if (currentForm.new.length < 8) errors.length = 'Password must be at least 8 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form changes with proper state updates
  const handleFormChange = (formType, field, value) => {
    setFormData(prev => ({
      ...prev,
      [formType]: {
        ...prev[formType],
        [field]: value
      }
    }));
    
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // CRUD Operations
  const handleAddSubmit = async () => {
    if (!validateForm('add')) return;
    setLoading(true);
    try {
      const { name, prenom, email, password } = formData.add;
      const response = await axios.post(
        `${baseUrl}/api/admin/AddNewProfesseur`,
        { nom: name, prenom, email, password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfs(prev => [...prev, response.data]);
      Alert.alert('Success', 'Professor added successfully');
      handleClose();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add professor');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!validateForm('edit')) return;
    setLoading(true);
    try {
      const { nom, prenom, email } = formData.edit;
      await axios.put(
        `${baseUrl}/api/admin/UpdateProfesseur`,
        { id: selectedProfId, nom, prenom, email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchProfs();
      Alert.alert('Success', 'Professor updated successfully');
      handleClose();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update professor');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    setLoading(true);
    try {
      await axios.delete(
        `${baseUrl}/api/admin/DeleteProfesseur/${selectedProfId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchProfs();
      Alert.alert('Success', 'Professor deleted successfully');
      handleClose();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete professor');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePasswordSubmit = async () => {
    if (!validateForm('password')) return;
    
    setLoading(true);
    try {
      await axios.put(
        `${baseUrl}/api/admin/UpdateProfPassword`,
        { id: selectedProfId, password: formData.password.new },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Password updated successfully');
      setOpenChangePassword(false);
      setFormData(prev => ({
        ...prev,
        password: { new: '', confirm: '' }
      }));
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpenDelete(false);
    setOpenEdit(false);
    setOpenAdd(false);
    setOpenChangePassword(false);
    setSelectedProfId(null);
    setFormData({
      add: { name: '', prenom: '', email: '', password: '' },
      edit: { nom: '', prenom: '', email: '' },
      password: { new: '', confirm: '' }
    });
    setFormErrors({});
    setShowPassword({ add: false, new: false, confirm: false });
    setMenuState({ visible: false, profId: null, x: 0, y: 0 });
  };

  // Menu handling
  const openMenu = (profId, event) => {
    const { pageX, pageY } = event.nativeEvent;
    setMenuState({ 
      visible: true, 
      profId, 
      x: pageX,
      y: pageY 
    });
  };
  
  const closeMenu = () => setMenuState(prev => ({ ...prev, visible: false }));

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{marginTop: 10, color: colors.primary}}>Chargement...</Text>
      </View>
    );
  }

  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Search and Add Button Row */}
          <View style={styles.searchAddContainer}>
            <Searchbar
              placeholder="Rechercher..."
              onChangeText={setSearchTerm}
              value={searchTerm}
              style={styles.searchBar}
              iconColor={colors.primary}
              inputStyle={styles.searchInput}
            />
            <Button
              mode="contained"
              onPress={() => setOpenAdd(true)}
              style={styles.addButton}
              labelStyle={styles.addButtonLabel}
            >
              Ajouter
            </Button>
          </View>

          {loading ? (
            <ActivityIndicator style={styles.loader} animating size="large" />
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled">
              {filteredProfs.length > 0 ? (
                <View style={styles.cardsContainer}>
                  {filteredProfs.map(prof => (
                    <Card key={prof.id} style={styles.profCard}>
                      <Card.Content style={styles.cardContent}>
                        <View style={styles.profInfo}>
                          <Text style={styles.profName}>
                            {prof.prenom} {prof.nom}
                          </Text>
                          <Text style={styles.profEmail} numberOfLines={1}>
                            {prof.email}
                          </Text>
                        </View>
                        
                        <IconButton
                          icon="dots-vertical"
                          size={24}
                          onPress={(e) => openMenu(prof.id, e)}
                          style={styles.menuButton}
                        />
                      </Card.Content>
                    </Card>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>Aucun professeur trouvé</Text>
              )}
            </ScrollView>
          )}
        </View>

        {/* Floating Menu */}
        <Portal>
          <Menu
            visible={menuState.visible}
            onDismiss={closeMenu}
            anchor={{ x: menuState.x, y: menuState.y }}
            contentStyle={styles.menuContent}
          >
            <Menu.Item 
              onPress={() => {
                closeMenu();
                const prof = profs.find(p => p.id === menuState.profId);
                if (prof) {
                  setSelectedProfId(prof.id);
                  setFormData(prev => ({
                    ...prev,
                    edit: {
                      nom: prof.nom,
                      prenom: prof.prenom,
                      email: prof.email
                    }
                  }));
                  setOpenEdit(true);
                }
              }}
              title="Modifier"
              leadingIcon="pencil"
            />
            <Menu.Item 
              onPress={() => {
                closeMenu();
                setSelectedProfId(menuState.profId);
                setOpenChangePassword(true);
              }}
              title="Changer mot de passe"
              leadingIcon="key"
            />
            <Divider />
            <Menu.Item 
              onPress={() => {
                closeMenu();
                setSelectedProfId(menuState.profId);
                setOpenDelete(true);
              }}
              title="Supprimer"
              leadingIcon="delete"
              titleStyle={{ color: colors.error }}
            />
          </Menu>
        </Portal>

        {/* Add Dialog */}
        <Dialog visible={openAdd} onDismiss={handleClose} style={{borderRadius: 16, backgroundColor: 'white'}}>
          <Dialog.Title style={{color: colors.primary}}>Ajouter un Enseignant</Dialog.Title>
          <Dialog.Content>
            <TextInput
              ref={nameInputRef}
              label="Nom"
              value={formData.add.name}
              onChangeText={(text) => handleFormChange('add', 'name', text)}
              error={!!formErrors.name}
              style={styles.input}
              mode="outlined"
              autoComplete="off"
              autoCorrect={false}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => prenomInputRef.current.focus()}
              theme={{ colors: { primary: colors.primary, error: colors.error } }}
            />
            <HelperText type="error" visible={!!formErrors.name}>
              {formErrors.name || "Le nom est obligatoire"}
            </HelperText>

            <TextInput
              ref={prenomInputRef}
              label="Prénom"
              value={formData.add.prenom}
              onChangeText={(text) => handleFormChange('add', 'prenom', text)}
              error={!!formErrors.prenom}
              style={styles.input}
              mode="outlined"
              autoComplete="off"
              autoCorrect={false}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => emailInputRef.current.focus()}
              theme={{ colors: { primary: colors.primary, error: colors.error } }}
            />
            <HelperText type="error" visible={!!formErrors.prenom}>
              {formErrors.prenom || "Le prénom est obligatoire"}
            </HelperText>

            <TextInput
              ref={emailInputRef}
              label="Email"
              value={formData.add.email}
              onChangeText={(text) => handleFormChange('add', 'email', text)}
              error={!!formErrors.email}
              style={styles.input}
              mode="outlined"
              keyboardType="email-address"
              autoComplete="off"
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => passwordInputRef.current.focus()}
              theme={{ colors: { primary: colors.primary, error: colors.error } }}
            />
            <HelperText type="error" visible={!!formErrors.email}>
              {formErrors.email || "L'email est obligatoire"}
            </HelperText>

            <TextInput
              ref={passwordInputRef}
              label="Mot de passe"
              value={formData.add.password}
              onChangeText={(text) => handleFormChange('add', 'password', text)}
              error={!!formErrors.password}
              style={styles.input}
              mode="outlined"
              secureTextEntry={!showPassword.add}
              autoComplete="off"
              autoCorrect={false}
              autoCapitalize="none"
              theme={{ colors: { primary: colors.primary, error: colors.error } }}
              right={
                <TextInput.Icon 
                  icon={showPassword.add ? "eye-off" : "eye"} 
                  onPress={() => setShowPassword(prev => ({
                    ...prev,
                    add: !prev.add
                  }))} 
                  color={colors.accent}
                />
              }
            />
            <HelperText type="error" visible={!!formErrors.password}>
              {formErrors.password}
            </HelperText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleClose} >Annuler</Button>
            <Button 
              onPress={handleAddSubmit} 
              mode="contained" 
              loading={loading}
              style={{backgroundColor: colors.primary}}
              disabled={loading}
            >
              Ajouter
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog visible={openEdit} onDismiss={handleClose} style={{borderRadius: 16, backgroundColor: colors.surface}}>
          <Dialog.Title style={{color: colors.primary}}>Modifier l'Enseignant</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nom"
              value={formData.edit.nom}
              onChangeText={(text) => handleFormChange('edit', 'nom', text)}
              error={!!formErrors.nom}
              style={styles.input}
              mode="outlined"
              autoComplete="off"
              autoCorrect={false}
              autoCapitalize="words"
              theme={{ colors: { primary: colors.primary, error: colors.error } }}
            />
            <HelperText type="error" visible={!!formErrors.nom}>
              {formErrors.nom || "Le nom est obligatoire"}
            </HelperText>

            <TextInput
              label="Prénom"
              value={formData.edit.prenom}
              onChangeText={(text) => handleFormChange('edit', 'prenom', text)}
              error={!!formErrors.prenom}
              style={styles.input}
              mode="outlined"
              autoComplete="off"
              autoCorrect={false}
              autoCapitalize="words"
              theme={{ colors: { primary: colors.primary, error: colors.error } }}
            />
            <HelperText type="error" visible={!!formErrors.prenom}>
              {formErrors.prenom || "Le prénom est obligatoire"}
            </HelperText>

            <TextInput
              label="Email"
              value={formData.edit.email}
              onChangeText={(text) => handleFormChange('edit', 'email', text)}
              error={!!formErrors.email}
              style={styles.input}
              mode="outlined"
              keyboardType="email-address"
              autoComplete="off"
              autoCorrect={false}
              autoCapitalize="none"
              theme={{ colors: { primary: colors.primary, error: colors.error } }}
            />
            <HelperText type="error" visible={!!formErrors.email}>
              {formErrors.email || "L'email est obligatoire"}
            </HelperText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleClose} color={colors.accent}>Annuler</Button>
            <Button 
              onPress={handleEditSubmit} 
              mode="contained" 
              loading={loading}
              color={colors.primary}
            >
              Enregistrer
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog visible={openDelete} onDismiss={handleClose} style={{borderRadius: 16, backgroundColor: colors.surface}}>
          <Dialog.Title style={{color: colors.primary}}>Confirmer la Suppression</Dialog.Title>
          <Dialog.Content>
            <Text style={{color: colors.text}}>Êtes-vous sûr de vouloir supprimer cet enseignant?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleClose} color={colors.accent}>Annuler</Button>
            <Button 
              onPress={handleDeleteSubmit} 
              mode="contained" 
              style={{ backgroundColor: colors.error }}
              loading={loading}
            >
              Supprimer
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Change Password Dialog */}
        <Dialog visible={openChangePassword} onDismiss={handleClose} style={{borderRadius: 16, backgroundColor: colors.surface}}>
          <Dialog.Title style={{color: colors.primary}}>Changer le Mot de Passe</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nouveau mot de passe"
              value={formData.password.new}
              onChangeText={(text) => handleFormChange('password', 'new', text)}
              error={!!(formErrors.new || formErrors.length)}
              style={styles.input}
              mode="outlined"
              secureTextEntry={!showPassword.new}
              autoComplete="off"
              autoCorrect={false}
              autoCapitalize="none"
              theme={{ colors: { primary: colors.primary, error: colors.error } }}
              right={
                <TextInput.Icon 
                  icon={showPassword.new ? "eye-off" : "eye"} 
                  onPress={() => setShowPassword(prev => ({
                    ...prev,
                    new: !prev.new
                  }))} 
                  color={colors.accent}
                />
              }
            />
            <HelperText type="error" visible={!!(formErrors.new || formErrors.length)}>
              {formErrors.new || formErrors.length || "Le mot de passe doit contenir au moins 8 caractères"}
            </HelperText>

            <TextInput
              label="Confirmer le mot de passe"
              value={formData.password.confirm}
              onChangeText={(text) => handleFormChange('password', 'confirm', text)}
              error={!!(formErrors.confirm || formErrors.match)}
              style={styles.input}
              mode="outlined"
              secureTextEntry={!showPassword.confirm}
              autoComplete="off"
              autoCorrect={false}
              autoCapitalize="none"
              theme={{ colors: { primary: colors.primary, error: colors.error } }}
              right={
                <TextInput.Icon 
                  icon={showPassword.confirm ? "eye-off" : "eye"} 
                  onPress={() => setShowPassword(prev => ({
                    ...prev,
                    confirm: !prev.confirm
                  }))} 
                  color={colors.accent}
                />
              }
            />
            <HelperText type="error" visible={!!(formErrors.confirm || formErrors.match)}>
              {formErrors.confirm || formErrors.match || "Les mots de passe ne correspondent pas"}
            </HelperText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleClose} color={colors.accent}>Annuler</Button>
            <Button 
              onPress={handleChangePasswordSubmit} 
              mode="contained" 
              loading={loading}
              color={colors.primary}
              disabled={!formData.password.new || formData.password.new !== formData.password.confirm}
            >
              Enregistrer
            </Button>
          </Dialog.Actions>
        </Dialog>
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 32,
  },
  searchAddContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    marginRight: 8,
    backgroundColor: 'white',
    borderRadius: 18,
    elevation: 2,
  },
  searchInput: {
    minHeight: 40,
    color: '#01162e',
  },
  addButton: {
    width: 100,
    borderRadius: 18,
    elevation: 2,
    backgroundColor: '#01162e',
  },
  addButtonLabel: {
    color: 'white',
  },
  cardsContainer: {
    marginBottom: 16,
  },
  profCard: {
    marginBottom: 12,
    elevation: 2,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  profInfo: {
    flex: 1,
    marginRight: 8,
  },
  profName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#01162e',
  },
  profEmail: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  menuButton: {
    margin: 0,
  },
  menuContent: {
    elevation: 4,
    backgroundColor: 'white',
    minWidth: 200,
    borderRadius: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 24,
    fontSize: 16,
    color: '#666',
  },
  input: {
    backgroundColor: '#f8f9fa',
    marginVertical: -8,
  },
  loader: {
    marginVertical: 16,
  },
});

export default Professeures;