import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Text, Button, Dialog, Portal, Provider as PaperProvider, TextInput, DataTable, Searchbar, IconButton } from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FiliereScreen = () => {
  // State management
  const [filieres, setFilieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [dialogState, setDialogState] = useState({
    addVisible: false,
    editVisible: false,
    deleteVisible: false,
    selectedFiliere: null
  });
  const [error, setError] = useState('');
  
  // Use refs for input values
  const addInputRef = useRef(null);
  const editInputRef = useRef(null);
  
  // Track input values with simple state but don't use for rendering
  const [addInputValue, setAddInputValue] = useState('');
  const [editInputValue, setEditInputValue] = useState('');

  // Constants
  const ITEMS_PER_PAGE = 5;
  const API_URL = 'https://doctorh1-kjmev.ondigitalocean.app/api/admin';

  // Load data on component mount
  useEffect(() => {
    fetchFilieres();
  }, []);

  // Get auth token
  const getToken = async () => {
    const authData = await AsyncStorage.getItem('auth');
    return JSON.parse(authData).token;
  };

  // Fetch filieres from API
  const fetchFilieres = async () => {
    setLoading(true);
    try {
      const token = await getToken();

      const response = await axios.get(`${API_URL}/getAllFiliere`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFilieres(response.data || []);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de récupérer les filières');
    } finally {
      setLoading(false);
    }
  };

  // Handle Add operation
  const handleAdd = async () => {
    const name = addInputValue;
    if (!name || !name.trim()) {
      setError('Le nom est obligatoire');
      return;
    }

    try {
      const token = await getToken();
      await axios.post(
        `${API_URL}/AddNewFiliere`,
        { nom: name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await fetchFilieres();
      Alert.alert('Succès', 'Filière ajoutée avec succès');
      closeAllDialogs();
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Échec de l\'ajout de la filière');
    }
  };

  // Handle Edit operation
  const handleEdit = async () => {
    const name = editInputValue;
    if (!name || !name.trim()) {
      setError('Le nom est obligatoire');
      return;
    }

    try {
      const token = await getToken();
      await axios.put(
        `${API_URL}/ModifyFiliere`,
        { 
          id: dialogState.selectedFiliere.id, 
          nom: name 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await fetchFilieres();
      Alert.alert('Succès', 'Filière mise à jour avec succès');
      closeAllDialogs();
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Échec de la mise à jour de la filière');
    }
  };

  // Handle Delete operation
  const handleDelete = async () => {
    try {
      const token = await getToken();
      await axios.delete(
        `${API_URL}/RemoveFiliere/${dialogState.selectedFiliere.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await fetchFilieres();
      Alert.alert('Succès', 'Filière supprimée avec succès');
      closeAllDialogs();
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Échec de la suppression de la filière');
    }
  };

  // Dialog controls
  const openAddDialog = () => {
    setDialogState({
      addVisible: true,
      editVisible: false,
      deleteVisible: false,
      selectedFiliere: null
    });
    setAddInputValue('');
    setError('');
  };

  const openEditDialog = (filiere) => {
    setDialogState({
      addVisible: false,
      editVisible: true,
      deleteVisible: false,
      selectedFiliere: filiere
    });
    setEditInputValue(filiere.nom);
    setError('');
  };

  const openDeleteDialog = (filiere) => {
    setDialogState({
      addVisible: false,
      editVisible: false,
      deleteVisible: true,
      selectedFiliere: filiere
    });
    setError('');
  };

  const closeAllDialogs = () => {
    setDialogState({
      addVisible: false,
      editVisible: false,
      deleteVisible: false,
      selectedFiliere: null
    });
    setError('');
  };

  // Filter and paginate data
  const filteredFilieres = filieres.filter(f => 
    f.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedFilieres = filteredFilieres.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  // Loading state
  if (loading && filieres.length === 0) {
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
            placeholder="Rechercher des filières..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={styles.searchBar}
            iconColor="#01162e"
            inputStyle={{color: '#01162e'}}
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
        <ScrollView style={styles.dataContainer}>
          <DataTable>
            <DataTable.Header style={{backgroundColor: '#f0f4f8', borderRadius: 8}}>
              <DataTable.Title textStyle={{color: '#01162e', fontWeight: 'bold'}}>Nom</DataTable.Title>
              <DataTable.Title numeric textStyle={{color: '#01162e', fontWeight: 'bold'}}>Actions</DataTable.Title>
            </DataTable.Header>

            {paginatedFilieres.map(filiere => (
              <DataTable.Row key={filiere.id} style={{borderBottomWidth: 1, borderBottomColor: '#f0f4f8'}}>
                <DataTable.Cell textStyle={{color: '#333333'}}>{filiere.nom}</DataTable.Cell>
                <DataTable.Cell numeric>
                  <View style={styles.actionButtons}>
                    <IconButton 
                      icon="pencil" 
                      size={20} 
                      color="#3a86ff"
                      onPress={() => openEditDialog(filiere)} 
                    />
                    <IconButton 
                      icon="delete" 
                      size={20} 
                      color="#d90429"
                      onPress={() => openDeleteDialog(filiere)} 
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
          numberOfPages={Math.ceil(filteredFilieres.length / ITEMS_PER_PAGE)}
          onPageChange={setCurrentPage}
          label={`${currentPage * ITEMS_PER_PAGE + 1}-${Math.min(
            (currentPage + 1) * ITEMS_PER_PAGE,
            filteredFilieres.length
          )} sur ${filteredFilieres.length}`}
          style={{backgroundColor: 'white', borderRadius: 8}}
          theme={{ colors: { primary: '#01162e' } }}
        />

        {/* Add Dialog */}
        <Portal>
          <Dialog visible={dialogState.addVisible} onDismiss={closeAllDialogs} style={{borderRadius: 16, backgroundColor: 'white'}}>
            <Dialog.Title style={{color: '#01162e'}}>Ajouter une Filière</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Nom de la filière"
                defaultValue=""
                ref={addInputRef}
                onChangeText={setAddInputValue}
                autoFocus
                error={!!error}
                autoComplete="off"
                autoCorrect={false}
                autoCapitalize="words"
                style={{backgroundColor: '#f8f9fa'}}
                theme={{ colors: { primary: '#01162e', error: '#d90429' } }}
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
            <Dialog.Title style={{color: '#01162e'}}>Modifier la Filière</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Nom de la filière"
                defaultValue={dialogState.selectedFiliere?.nom}
                ref={editInputRef}
                onChangeText={setEditInputValue}
                autoFocus
                error={!!error}
                autoComplete="off"
                autoCorrect={false}
                autoCapitalize="words"
                style={{backgroundColor: '#f8f9fa'}}
                theme={{ colors: { primary: '#003366', error: '#d90429' } }}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={closeAllDialogs} color="#365e8e">Annuler</Button>
              <Button onPress={handleEdit} color="#003366">Enregistrer</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* Delete Dialog */}
        <Portal>
          <Dialog visible={dialogState.deleteVisible} onDismiss={closeAllDialogs} style={{borderRadius: 16, backgroundColor: 'white'}}>
            <Dialog.Title style={{color: '#01162e'}}>Supprimer la Filière</Dialog.Title>
            <Dialog.Content>
              <Text style={{color: '#003366'}}>Êtes-vous sûr de vouloir supprimer {dialogState.selectedFiliere?.nom}?</Text>
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
  }
});

export default FiliereScreen;