import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert, ActivityIndicator as NativeActivityIndicator, RefreshControl } from 'react-native';
import {
  DataTable,
  Button,
  Dialog,
  Portal,
  Text,
  TextInput,
  Provider as PaperProvider,
  Searchbar,
  IconButton,
  HelperText,
  Divider,
} from 'react-native-paper';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { debounce } from 'lodash';

const ModuleScreen = () => {
  // State management
  const [modules, setModules] = useState([]);
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [newModuleName, setNewModuleName] = useState('');
  const [addModuleName, setAddModuleName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFiliereId, setSelectedFiliereId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [semestreSelected, setSemestreSelected] = useState('1');
  const [filiers, setFiliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');
  const [profId, setProfId] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  // Configuration
  const baseUrl = 'https://doctorh1-kjmev.ondigitalocean.app';

  // Debounced functions for text input
  const debouncedSetNewName = debounce(setNewModuleName, 100);
  const debouncedSetAddName = debounce(setAddModuleName, 100);
  const debouncedSetDescription = debounce(setDescription, 100);

  // Load authentication data
  const loadAuthData = async () => {
    try {
      const [authData, storedProfId] = await Promise.all([
        AsyncStorage.getItem('auth'),
        AsyncStorage.getItem('profId')
      ]);
      
      if (!authData || !storedProfId) {
        throw new Error('Authentication data not found');
      }

      const parsedAuth = JSON.parse(authData);
      if (!parsedAuth.token) {
        throw new Error('Token not found');
      }

      setToken(parsedAuth.token);
      setProfId(storedProfId);
    } catch (error) {
      console.error('Error loading auth data:', error);
      Alert.alert('Error', 'Failed to load authentication data. Please login again.');
    } finally {
      setInitialLoading(false);
    }
  };

  // Fetch filieres
  const fetchFiliers = async () => {
    if (!token) return;
    
    try {
      const response = await axios.get(`${baseUrl}/api/professeur/getAllFiliere`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setFiliers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching filières:', error);
      setFiliers([]);
      Alert.alert('Error', 'Failed to fetch filières');
    }
  };

  // Fetch modules with useCallback
  const fetchModules = useCallback(async () => {
    if (!token || !profId) return;
    
    setLoading(true);
    try {
      const response = await axios.get(
        `${baseUrl}/api/professeur/getAllModuleByProfId/${profId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setModules(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching modules:', error);
      setModules([]);
      Alert.alert('Error', 'Failed to fetch modules');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, profId, baseUrl]);

  // Refresh function
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchModules();
  }, [fetchModules]);

  // Initial load
  useEffect(() => {
    loadAuthData();
  }, []);

  // Fetch data when token and profId are available
  useEffect(() => {
    if (token && profId) {
      fetchFiliers();
      fetchModules();
    }
  }, [token, profId, fetchModules]);

  // Search functionality
  const filteredModules = modules.filter(
    (module) =>
      (module.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (module.filiereName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  // Pagination
  const paginatedModules = filteredModules.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Form validation
  const validateForm = (isAdd = false) => {
    const errors = {};
    const nameToValidate = isAdd ? addModuleName : newModuleName;
    
    if (!nameToValidate || nameToValidate.trim() === '') {
      errors.moduleName = 'Module name is required';
    }
    
    if (!selectedFiliereId) {
      errors.filiere = 'Filière is required';
    }
    
    if (!semestreSelected) {
      errors.semestre = 'Semestre is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Edit module
  const handleEditClick = (module) => {
    if (!module) return;
    
    setSelectedModuleId(module.id || null);
    setNewModuleName(module.name || '');
    setSelectedFiliereId(String(module.filiereId) || '');
    setSemestreSelected(
      module.semestre 
        ? module.semestre.replace('Semestre ', '') 
        : '1'
    );
    setDescription(module.description || '');
    setOpenEdit(true);
    setFormErrors({});
  };

  const handleEditSubmit = async () => {
    if (!validateForm()) return;

    try {
      const selectedFiliere = filiers.find(f => String(f.id) === selectedFiliereId);
      if (!selectedFiliere) throw new Error('Filière not found');

      await axios.put(`${baseUrl}/api/professeur/ModifyModule`, {
        id: selectedModuleId,
        name: newModuleName,
        filiereName: selectedFiliere.nom,
        semestre: `Semestre ${semestreSelected}`,
        description,
      }, { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      });

      Alert.alert('Success', 'Module updated successfully');
      fetchModules();
      handleClose();
    } catch (error) {
      console.error('Error updating module:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update module');
    }
  };

  // Delete module
  const handleDeleteSubmit = async () => {
    if (!token || !selectedModuleId) {
      Alert.alert('Error', 'Invalid module selection');
      return;
    }

    try {
      await axios.delete(`${baseUrl}/api/professeur/DeleteModule/${selectedModuleId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      Alert.alert('Success', 'Module deleted successfully');
      fetchModules();
      handleClose();
    } catch (error) {
      console.error('Error deleting module:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete module');
    }
  };

  // Add module
  const handleAddSubmit = async () => {
    if (!validateForm(true)) return;

    try {
      const selectedFiliere = filiers.find(f => String(f.id) === selectedFiliereId);
      if (!selectedFiliere) throw new Error('Filière not found');

      await axios.post(`${baseUrl}/api/professeur/AddNewModule`, {
        idProfesseur: Number(profId),
        name: addModuleName,
        semestre: `Semestre ${semestreSelected}`,
        filiereName: selectedFiliere.nom,
        description,
      }, { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      });

      Alert.alert('Success', 'Module added successfully');
      fetchModules();
      handleClose();
    } catch (error) {
      console.error('Error adding module:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add module');
    }
  };

  // Close all dialogs
  const handleClose = () => {
    setOpenDelete(false);
    setOpenEdit(false);
    setOpenAdd(false);
    setSelectedModuleId(null);
    setNewModuleName('');
    setAddModuleName('');
    setSelectedFiliereId('');
    setSemestreSelected('1');
    setDescription('');
    setFormErrors({});
  };

  // Safe Picker component
  const SafePicker = ({ items, selectedValue, onValueChange, ...props }) => {
    if (!Array.isArray(items)) {
      return (
        <View style={styles.pickerContainer}>
          <NativeActivityIndicator size="small" />
        </View>
      );
    }
    
    return (
      <Picker
        selectedValue={String(selectedValue)}
        onValueChange={onValueChange}
        style={styles.picker}
        {...props}
      >
        <Picker.Item label="Select Filière" value="" />
        {items.map(item => (
          <Picker.Item 
            key={String(item.id)} 
            label={item.nom || 'Unnamed Filière'} 
            value={String(item.id)} 
          />
        ))}
      </Picker>
    );
  };

  // Loading state
  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <NativeActivityIndicator 
          size="large" 
          color="#01162e" 
        />
        <Text style={{ marginTop: 16 }}>
          Chargement des données...
        </Text>
      </View>
    );
  }

  // Form content for Add/Edit dialogs
  const renderFormContent = (isAdd = false) => (
    <>
      <View style={styles.pickerContainer}>
        <Text style={styles.inputLabel}>Filière</Text>
        <SafePicker
          items={filiers}
          selectedValue={selectedFiliereId}
          onValueChange={setSelectedFiliereId}
        />
        {formErrors.filiere && <HelperText type="error">{formErrors.filiere}</HelperText>}
      </View>

      <TextInput
        label="Semestre"
        value={semestreSelected}
        onChangeText={(text) => {
          const numericValue = text.replace(/[^0-9]/g, '');
          if (numericValue === '') {
            setSemestreSelected('1');
          } else {
            const num = parseInt(numericValue, 10);
            setSemestreSelected(Math.min(Math.max(num, 1), 12).toString());
          }
        }}
        keyboardType="numeric"
        style={styles.input}
        mode="outlined"
        error={!!formErrors.semestre}
      />
      {formErrors.semestre && <HelperText type="error">{formErrors.semestre}</HelperText>}

      <TextInput
        label="Module Name"
        defaultValue={isAdd ? addModuleName : newModuleName}
        onChangeText={isAdd ? debouncedSetAddName : debouncedSetNewName}
        style={styles.input}
        mode="outlined"
        error={!!formErrors.moduleName}
      />
      {formErrors.moduleName && <HelperText type="error">{formErrors.moduleName}</HelperText>}

      <TextInput
        label="Description"
        defaultValue={description}
        onChangeText={debouncedSetDescription}
        multiline
        numberOfLines={3}
        style={[styles.input, styles.multilineInput]}
        mode="outlined"
        textAlignVertical="top"
        blurOnSubmit={false}
      />
    </>
  );

  return (
    <PaperProvider>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={["#4080be"]} 
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Searchbar
            placeholder="Search modules..."
            onChangeText={setSearchTerm}
            value={searchTerm}
            style={styles.search}
            iconColor="#4080be"
          />
          <Button
            mode="contained"
            onPress={() => setOpenAdd(true)}
            style={styles.addButton}
            buttonColor="#01162e"
            icon="plus"
          >
            Add
          </Button>
        </View>

        {/* Module List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <NativeActivityIndicator 
              size="large" 
              color="#01162e"
            />
          </View>
        ) : (
          <>
            {paginatedModules.length > 0 ? (
              <DataTable style={styles.table}>
                <DataTable.Header style={styles.tableHeader}>
                  <DataTable.Title><Text style={styles.headerText}>Module</Text></DataTable.Title>
                  <DataTable.Title><Text style={styles.headerText}>Filière</Text></DataTable.Title>
                  <DataTable.Title numeric><Text style={styles.headerText}>Actions</Text></DataTable.Title>
                </DataTable.Header>

                {paginatedModules.map(module => (
                  <DataTable.Row key={module.id || Math.random().toString()}>
                    <DataTable.Cell>
                      <View>
                        <Text style={styles.moduleName}>{module.name || 'Unnamed Module'}</Text>
                        <Text style={styles.semestre}>{module.semestre || ''}</Text>
                      </View>
                    </DataTable.Cell>
                    <DataTable.Cell>{module.filiereName || '-'}</DataTable.Cell>
                    <DataTable.Cell numeric>
                      <View style={styles.actions}>
                        <IconButton
                          icon="pencil"
                          iconColor="#4080be"
                          size={20}
                          onPress={() => handleEditClick(module)}
                        />
                        <IconButton
                          icon="delete"
                          iconColor="#f44336"
                          size={20}
                          onPress={() => {
                            setSelectedModuleId(module.id);
                            setOpenDelete(true);
                          }}
                        />
                      </View>
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            ) : (
              <Text style={styles.emptyText}>No modules found</Text>
            )}

            <DataTable.Pagination
              page={page}
              numberOfPages={Math.ceil(filteredModules.length / rowsPerPage)}
              onPageChange={setPage}
              label={`${page * rowsPerPage + 1}-${Math.min(
                (page + 1) * rowsPerPage,
                filteredModules.length
              )} of ${filteredModules.length}`}
              numberOfItemsPerPage={rowsPerPage}
              onItemsPerPageChange={setRowsPerPage}
              showFastPaginationControls
              selectPageDropdownLabel="Rows per page"
            />
          </>
        )}

        {/* Dialogs */}
        <Portal>
          <Dialog visible={openAdd} onDismiss={handleClose} style={styles.dialog}>
            <Dialog.Title style={styles.dialogTitle}>Add New Module</Dialog.Title>
            <Divider style={styles.divider} />
            <Dialog.ScrollArea>
              <ScrollView contentContainerStyle={styles.dialogContent}>
                {renderFormContent(true)}
              </ScrollView>
            </Dialog.ScrollArea>
            <Divider style={styles.divider} />
            <Dialog.Actions>
              <Button onPress={handleClose} textColor="#666">Cancel</Button>
              <Button onPress={handleAddSubmit} mode="contained" buttonColor="#01162e">
                Add
              </Button>
            </Dialog.Actions>
          </Dialog>

          <Dialog visible={openEdit} onDismiss={handleClose} style={styles.dialog}>
            <Dialog.Title style={styles.dialogTitle}>Edit Module</Dialog.Title>
            <Divider style={styles.divider} />
            <Dialog.ScrollArea>
              <ScrollView contentContainerStyle={styles.dialogContent}>
                {renderFormContent()}
              </ScrollView>
            </Dialog.ScrollArea>
            <Divider style={styles.divider} />
            <Dialog.Actions>
              <Button onPress={handleClose} textColor="#666">Cancel</Button>
              <Button onPress={handleEditSubmit} mode="contained" buttonColor="#01162e">
                Save
              </Button>
            </Dialog.Actions>
          </Dialog>

          <Dialog visible={openDelete} onDismiss={handleClose} style={styles.dialog}>
            <Dialog.Title style={styles.dialogTitle}>Confirm Delete</Dialog.Title>
            <Divider style={styles.divider} />
            <Dialog.Content>
              <Text style={styles.deleteText}>Are you sure you want to delete this module?</Text>
              <Text style={styles.deleteWarning}>This action cannot be undone.</Text>
            </Dialog.Content>
            <Divider style={styles.divider} />
            <Dialog.Actions>
              <Button onPress={handleClose} textColor="#666">Cancel</Button>
              <Button onPress={handleDeleteSubmit} mode="contained" buttonColor="#f44336">
                Delete
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </ScrollView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f7',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  search: {
    flex: 1,
    marginRight: 8,
    height: 40,
    backgroundColor: '#ffffff',
  },
  addButton: {
    width: 80,
    height: 40,
    justifyContent: 'center',
  },
  loader: {
    marginVertical: 32,
  },
  table: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    overflow: 'hidden',
  },
  tableHeader: {
    backgroundColor: '#01162e',
  },
  headerText: {
    color: 'white',
    fontWeight: 'bold',
  },
  moduleName: {
    fontWeight: 'bold',
    color: '#01162e',
  },
  semestre: {
    fontSize: 12,
    color: '#4080be',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 32,
    color: '#666',
    fontSize: 16,
  },
  pickerContainer: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  inputLabel: {
    fontSize: 12,
    color: '#4080be',
    marginBottom: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
  picker: {
    height: 50,
  },
  input: {
    marginBottom: 12,
    backgroundColor: 'white',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContent: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  dialog: {
    backgroundColor: 'white',
    borderRadius: 12,
  },
  dialogTitle: {
    color: '#01162e',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  divider: {
    backgroundColor: '#e0e0e0',
    height: 1,
    marginVertical: 4,
  },
  deleteText: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteWarning: {
    fontSize: 14,
    color: '#f44336',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default ModuleScreen;