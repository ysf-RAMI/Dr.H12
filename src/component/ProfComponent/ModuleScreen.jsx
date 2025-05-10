import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert, ActivityIndicator,RefreshControl } from 'react-native';
import { Text, Button, Dialog, Portal, Provider as PaperProvider, TextInput, DataTable, Searchbar, IconButton, HelperText } from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

const ModuleScreen = () => {
  // State management
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [dialogState, setDialogState] = useState({
    addVisible: false,
    editVisible: false,
    deleteVisible: false,
    selectedModule: null
  });
  const [error, setError] = useState('');
  const [filiers, setFiliers] = useState([]);
  const [semestre, setSemestre] = useState('1');
  const [description, setDescription] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Refs for input values
  const addInputRef = useRef(null);
  const editInputRef = useRef(null);
  
  // Track input values with simple state but don't use for rendering
  const [addInputValue, setAddInputValue] = useState('');
  const [editInputValue, setEditInputValue] = useState('');
  const [selectedFiliereId, setSelectedFiliereId] = useState('');

  // Constants
  const ITEMS_PER_PAGE = 5;
  const API_URL = 'https://doctorh1-kjmev.ondigitalocean.app/api/professeur';

  // Load data on component mount
  useEffect(() => {
    fetchModules();
    fetchFiliers();
  }, []);

  // Get auth token
  const getToken = async () => {
    const authData = await AsyncStorage.getItem('auth');
    return JSON.parse(authData).token;
  };

  // Get professor ID
  const getProfId = async () => {
    return await AsyncStorage.getItem('profId');
  };

  // Fetch filieres from API
  const fetchFiliers = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(`${API_URL}/getAllFiliere`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFiliers(response.data || []);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de récupérer les filières');
    }
  };

  // Fetch modules from API
  const fetchModules = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const profId = await getProfId();
      
      const response = await axios.get(`${API_URL}/getAllModuleByProfId/${profId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setModules(response.data || []);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de récupérer les modules');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refresh function
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchModules();
  }, [fetchModules]);

  // Handle Add operation
  const handleAdd = async () => {
    const name = addInputValue;
    if (!name || !name.trim()) {
      setError('Le nom est obligatoire');
      return;
    }
    if (!selectedFiliereId) {
      setError('La filière est obligatoire');
      return;
    }

    try {
      const token = await getToken();
      const profId = await getProfId();
      const selectedFiliere = filiers.find(f => String(f.id) === selectedFiliereId);

      await axios.post(
        `${API_URL}/AddNewModule`,
        { 
          idProfesseur: profId,
          name: name,
          filiereName: selectedFiliere.nom,
          semestre: `Semestre ${semestre}`,
          description: description
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await fetchModules();
      Alert.alert('Succès', 'Module ajouté avec succès');
      closeAllDialogs();
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Échec de l\'ajout du module');
    }
  };

  // Handle Edit operation
  const handleEdit = async () => {
    const name = editInputValue;
    if (!name || !name.trim()) {
      setError('Le nom est obligatoire');
      return;
    }
    if (!selectedFiliereId) {
      setError('La filière est obligatoire');
      return;
    }

    try {
      const token = await getToken();
      const selectedFiliere = filiers.find(f => String(f.id) === selectedFiliereId);

      await axios.put(
        `${API_URL}/ModifyModule`,
        { 
          id: dialogState.selectedModule.id,
          name: name,
          filiereName: selectedFiliere.nom,
          semestre: `Semestre ${semestre}`,
          description: description
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await fetchModules();
      Alert.alert('Succès', 'Module mis à jour avec succès');
      closeAllDialogs();
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Échec de la mise à jour du module');
    }
  };

  // Handle Delete operation
  const handleDelete = async () => {
    try {
      const token = await getToken();
      await axios.delete(
        `${API_URL}/DeleteModule/${dialogState.selectedModule.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await fetchModules();
      Alert.alert('Succès', 'Module supprimé avec succès');
      closeAllDialogs();
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Échec de la suppression du module');
    }
  };

  // Dialog controls
  const openAddDialog = () => {
    setDialogState({
      addVisible: true,
      editVisible: false,
      deleteVisible: false,
      selectedModule: null
    });
    setAddInputValue('');
    setSelectedFiliereId('');
    setSemestre('1'); // Fixed at 1
    setDescription('');
    setError('');
  };

  const openEditDialog = (module) => {
    setDialogState({
      addVisible: false,
      editVisible: true,
      deleteVisible: false,
      selectedModule: module
    });
    setEditInputValue(module.name);
    setSelectedFiliereId(String(module.filiereId));
    setSemestre(module.semestre ? module.semestre.replace('Semestre ', '') : '1');
    setDescription(module.description || '');
    setError('');
  };

  const openDeleteDialog = (module) => {
    setDialogState({
      addVisible: false,
      editVisible: false,
      deleteVisible: true,
      selectedModule: module
    });
    setError('');
  };

  const closeAllDialogs = () => {
    setDialogState({
      addVisible: false,
      editVisible: false,
      deleteVisible: false,
      selectedModule: null
    });
    setError('');
  };

  // Filter and paginate data
  const filteredModules = modules.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.filiereName && m.filiereName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const paginatedModules = filteredModules.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  // Loading state
  if (loading && modules.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#01162e" />
        <Text style={{marginTop: 10, color: '#01162e'}}>Chargement...</Text>
      </View>
    );
  }

  return (
    <PaperProvider>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Searchbar
            placeholder="Rechercher des modules..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={styles.searchBar}
            theme={{ 
              colors: { 
                primary: '#01162e',
                placeholder: '#01162e',
                text: '#01162e'
              } 
            }}
            />
          <Button 
            mode="contained" 
            onPress={openAddDialog}
            style={styles.addButton}
          >
            Ajouter
          </Button>
        </View>

        {/* Data Table */}
        <ScrollView 
          style={styles.dataContainer}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={["#01162e"]} 
            />
          }
        >
          <DataTable>
            // In the DataTable.Header section:
            <DataTable.Header style={{backgroundColor: '#f0f4f8', borderRadius: 8}}>
              <DataTable.Title>
                <Text style={{color: '#01162e', fontWeight: 'bold'}}>Module</Text>
              </DataTable.Title>
              <DataTable.Title>
                <Text style={{color: '#01162e', fontWeight: 'bold'}}>Filière</Text>
              </DataTable.Title>
              <DataTable.Title numeric>
                <Text style={{color: '#01162e', fontWeight: 'bold'}}>Actions</Text>
              </DataTable.Title>
            </DataTable.Header>
            
            // In the DataTable.Row section:
            {paginatedModules.map(module => (
              <DataTable.Row key={module.id} style={{borderBottomWidth: 1, borderBottomColor: '#f0f4f8'}}>
                <DataTable.Cell>
                  <View>
                    <Text style={{color: '#333333'}}>{module.name}</Text>
                    <Text style={{color: '#666666', fontSize: 12}}>{module.semestre || '-'}</Text>
                  </View>
                </DataTable.Cell>
                <DataTable.Cell textStyle={{color: '#333333'}}>{module.filiereName || '-'}</DataTable.Cell>
                <DataTable.Cell numeric>
                  <View style={styles.actionButtons}>
                    <IconButton 
                      icon="pencil" 
                      size={20} 
                      color="#3a86ff"
                      onPress={() => openEditDialog(module)} 
                    />
                    <IconButton 
                      icon="delete" 
                      size={20} 
                      color="#d90429"
                      onPress={() => openDeleteDialog(module)} 
                    />
                  </View>
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </ScrollView>

        {/* Pagination */}
        <DataTable.Pagination
          page={currentPage}
          numberOfPages={Math.ceil(filteredModules.length / ITEMS_PER_PAGE)}
          onPageChange={setCurrentPage}
          label={`${currentPage * ITEMS_PER_PAGE + 1}-${Math.min(
            (currentPage + 1) * ITEMS_PER_PAGE,
            filteredModules.length
          )} sur ${filteredModules.length}`}
          style={{backgroundColor: 'white', borderRadius: 8}}
          theme={{ colors: { primary: '#01162e' } }}
        />

        {/* Add Dialog */}
        <Portal>
          <Dialog visible={dialogState.addVisible} onDismiss={closeAllDialogs} style={{borderRadius: 16, backgroundColor: 'white'}}>
            <Dialog.Title style={{color: '#01162e'}}>Ajouter un Module</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Nom du module"
                defaultValue=""
                ref={addInputRef}
                onChangeText={setAddInputValue}
                autoFocus
                error={!!error}
                autoComplete="off"
                autoCorrect={false}
                autoCapitalize="words"
                style={{backgroundColor: '#f8f9fa', marginBottom: 10}}
                theme={{ colors: { primary: '#01162e', error: '#d90429' } }}
              />
              
              <Text style={styles.inputLabel}>Filière</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedFiliereId}
                  onValueChange={setSelectedFiliereId}
                  style={styles.picker}
                >
                  <Picker.Item label="Sélectionner une filière" value="" />
                  {filiers.map(filiere => (
                    <Picker.Item 
                      key={String(filiere.id)} 
                      label={filiere.nom} 
                      value={String(filiere.id)} 
                    />
                  ))}
                </Picker>
              </View>

              <TextInput
                label="Semestre"
                value={semestre}
                editable={dialogState.addVisible ? false : true} // Disabled when adding
                onChangeText={(text) => {
                  if (!dialogState.addVisible) { // Only allow changes when editing
                    const numericValue = text.replace(/[^0-9]/g, '');
                    if (numericValue === '') {
                      setSemestre('1');
                    } else {
                      const num = parseInt(numericValue, 10);
                      setSemestre(Math.min(Math.max(num, 1), 12).toString());
                    }
                  }
                }}
                keyboardType="numeric"
                style={{backgroundColor: '#f8f9fa', marginBottom: 10}}
                theme={{ colors: { primary: '#01162e' } }}
              />

              <TextInput
                label="Description"
                defaultValue={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                style={{backgroundColor: '#f8f9fa'}}
                theme={{ colors: { primary: '#01162e' } }}
              />
              
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={closeAllDialogs} color="#365e8e">Annuler</Button>
              <Button onPress={handleAdd} color="#01162e">Ajouter</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* Edit Dialog */}
        <Portal>
          <Dialog visible={dialogState.editVisible} onDismiss={closeAllDialogs} style={{borderRadius: 16, backgroundColor: 'white'}}>
            <Dialog.Title style={{color: '#01162e'}}>Modifier le Module</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Nom du module"
                defaultValue={dialogState.selectedModule?.name}
                ref={editInputRef}
                onChangeText={setEditInputValue}
                autoFocus
                error={!!error}
                autoComplete="off"
                autoCorrect={false}
                autoCapitalize="words"
                style={{backgroundColor: '#f8f9fa', marginBottom: 10}}
                theme={{ colors: { primary: '#01162e', error: '#d90429' } }}
              />
              
              <Text style={styles.inputLabel}>Filière</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedFiliereId}
                  onValueChange={setSelectedFiliereId}
                  style={styles.picker}
                >
                  <Picker.Item label="Sélectionner une filière" value="" />
                  {filiers.map(filiere => (
                    <Picker.Item 
                      key={String(filiere.id)} 
                      label={filiere.nom} 
                      value={String(filiere.id)} 
                    />
                  ))}
                </Picker>
              </View>

              <TextInput
                label="Semestre"
                value={semestre}
                onChangeText={(text) => {
                  const numericValue = text.replace(/[^0-9]/g, '');
                  if (numericValue === '') {
                    setSemestre('1');
                  } else {
                    const num = parseInt(numericValue, 10);
                    setSemestre(Math.min(Math.max(num, 1), 12).toString());
                  }
                }}
                keyboardType="numeric"
                style={{backgroundColor: '#f8f9fa', marginBottom: 10}}
                theme={{ colors: { primary: '#01162e' } }}
              />

              <TextInput
                label="Description"
                defaultValue={dialogState.selectedModule?.description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                style={{backgroundColor: '#f8f9fa'}}
                theme={{ colors: { primary: '#01162e' } }}
              />
              
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={closeAllDialogs} color="#365e8e">Annuler</Button>
              <Button onPress={handleEdit} color="#01162e">Enregistrer</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* Delete Dialog */}
        <Portal>
          <Dialog visible={dialogState.deleteVisible} onDismiss={closeAllDialogs} style={{borderRadius: 16, backgroundColor: 'white'}}>
            <Dialog.Title style={{color: '#01162e'}}>Supprimer le Module</Dialog.Title>
            <Dialog.Content>
              <Text style={{color: '#003366'}}>Êtes-vous sûr de vouloir supprimer {dialogState.selectedModule?.name}?</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={closeAllDialogs} color="#365e8e">Annuler</Button>
              <Button onPress={handleDelete} color="#d90429">Supprimer</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </PaperProvider>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    marginRight: 8,
    backgroundColor: 'white',
    borderRadius: 18,
  },
  addButton: {
    width: 100,
    borderRadius: 18,
    backgroundColor: '#01162e'
  },
  dataContainer: {
    flex: 1,
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 8
  },
  actionButtons: {
    flexDirection: 'row'
  },
  error: {
    color: '#d90429',
    marginTop: 4
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginBottom: 10,
    backgroundColor: '#f8f9fa'
  },
  picker: {
    height: 50,
  },
  inputLabel: {
    fontSize: 12,
    color: '#01162e',
    marginBottom: 4,
    marginLeft: 4
  }
});

export default ModuleScreen;