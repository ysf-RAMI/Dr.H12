import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Button, Dialog, Portal, Text, TextInput, Provider as PaperProvider, Searchbar, IconButton, HelperText, Menu, Divider, Card, ProgressBar } from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import MediaViewer from '../MediaViewer';

const TdScreen = () => {
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tds, setTds] = useState([]);
  const [modules, setModules] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogType, setDialogType] = useState(null); // 'add', 'edit', 'delete', 'menu'
  const [selectedTd, setSelectedTd] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    module: '',
    type: 'FICHIER',
    file: null,
    videoUrl: ''
  });
  const [errors, setErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [token, setToken] = useState('');
  const [profId, setProfId] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const baseUrl = 'https://doctorh1-kjmev.ondigitalocean.app';

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const authData = await AsyncStorage.getItem('auth');
        const storedProfId = await AsyncStorage.getItem('profId');
        
        if (!authData || !storedProfId) {
          throw new Error('Authentication data not found');
        }

        const parsedAuth = JSON.parse(authData);
        if (!parsedAuth.token) {
          throw new Error('Token not found');
        }

        setToken(parsedAuth.token);
        setProfId(storedProfId);
        
        await fetchTds(parsedAuth.token, storedProfId);
        await fetchModules(parsedAuth.token, storedProfId);
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('Error', 'Failed to load data. Please login again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Fetch TDs with proper authentication
  const fetchTds = async (authToken, professorId) => {
    try {
      const response = await axios.get(
        `${baseUrl}/api/professeur/getAllResources/${professorId}`,
        { 
          headers: { 
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setTds(response.data.filter(r => r.type === "TD"));
    } catch (error) {
      console.error('Error fetching TDs:', error);
      if (error.response?.status === 403) {
        Alert.alert('Session Expired', 'Your session has expired. Please login again.');
      } else {
        Alert.alert('Error', 'Failed to fetch TDs. Please try again later.');
      }
    }
  };

  // Fetch modules with proper authentication
  const fetchModules = async (authToken, professorId) => {
    try {
      const response = await axios.get(
        `${baseUrl}/api/professeur/getAllModuleByProfId/${professorId}`,
        { 
          headers: { 
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setModules(response.data);
    } catch (error) {
      console.error('Error fetching modules:', error);
      if (error.response?.status === 403) {
        Alert.alert('Session Expired', 'Your session has expired. Please login again.');
      } else {
        Alert.alert('Error', 'Failed to fetch modules. Please try again later.');
      }
    }
  };

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchTds(token, profId);
      await fetchModules(token, profId);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, [token, profId]);

  // Dialog handlers
  const openDialog = (type, td = null) => {
    setDialogType(type);
    setSelectedTd(td);
    
    if (type === 'edit' && td) {
      setFormData({
        name: td.nom || '',
        module: td.moduleName || '',
        type: td.dataType || 'FICHIER',
        file: null,
        videoUrl: td.lien || ''
      });
    } else if (type === 'add') {
      setFormData({
        name: '',
        module: '',
        type: 'FICHIER',
        file: null,
        videoUrl: ''
      });
    }
    
    setErrors({});
    setUploadProgress(0);
  };

  const closeDialog = () => {
    setDialogType(null);
    setSelectedTd(null);
  };

  // File picker
  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      
      if (result.assets && result.assets[0]) {
        const file = result.assets[0];
        
        if (file.size > 50 * 1024 * 1024) {
          Alert.alert('Error', 'File size should be less than 50MB');
          return;
        }
        
        if (!file.mimeType || !file.mimeType.includes('pdf')) {
          Alert.alert('Error', 'Please select a PDF file');
          return;
        }
        
        setFormData(prev => ({ ...prev, file }));
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  // Form validation
  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'TD name is required';
    if (!formData.module) newErrors.module = 'Module is required';
    
    if (formData.type === 'VIDEO') {
      if (!formData.videoUrl.trim()) {
        newErrors.videoUrl = 'Video URL is required';
      } else if (!formData.videoUrl.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/)) {
        newErrors.videoUrl = 'Please enter a valid YouTube URL';
      }
    } else if (formData.type === 'FICHIER' && !formData.file && !selectedTd?.lien) {
      newErrors.file = 'PDF file is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save TD
  const saveTd = async () => {
    if (!validate()) return;

    try {
      const form = new FormData();
      form.append('nom', formData.name.trim());
      form.append('type', 'TD');
      form.append('dataType', formData.type);
      
      if (formData.type === 'VIDEO') {
        form.append('lien', formData.videoUrl.trim());
      } else if (formData.file) {
        form.append('data', {
          uri: formData.file.uri,
          name: formData.file.name,
          type: formData.file.mimeType || 'application/pdf',
        });
      } else if (selectedTd?.lien) {
        form.append('lien', selectedTd.lien);
      }
      
      const selectedModuleObj = modules.find(m => m.name === formData.module);
      if (selectedModuleObj) {
        form.append('moduleId', selectedModuleObj.id);
      }
      form.append('professorId', profId);
      
      if (dialogType === 'edit' && selectedTd) {
        form.append('id', selectedTd.id);
      }

      const url = dialogType === 'add' 
        ? `${baseUrl}/api/professeur/addResource`
        : `${baseUrl}/api/professeur/updateResource`;
      
      const method = dialogType === 'add' ? 'post' : 'put';
      
      await axios[method](url, form, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: progressEvent => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      Alert.alert('Success', `TD ${dialogType === 'add' ? 'added' : 'updated'} successfully`);
      await fetchTds(token, profId);
      closeDialog();
    } catch (error) {
      console.error('Error saving TD:', error);
      let errorMessage = 'Failed to save TD';
      if (error.response) {
        if (error.response.status === 413) {
          errorMessage = 'File size is too large (max 50MB)';
        } else if (error.response.status === 403) {
          errorMessage = 'Session expired. Please login again.';
        } else {
          errorMessage = error.response.data?.message || errorMessage;
        }
      }
      Alert.alert('Error', errorMessage);
    }
  };

  // Delete TD
  const deleteTd = async () => {
    try {
      await axios.delete(
        `${baseUrl}/api/professeur/deleteResource/${selectedTd.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'TD deleted successfully');
      await fetchTds(token, profId);
      closeDialog();
    } catch (error) {
      console.error('Error deleting TD:', error);
      let errorMessage = 'Failed to delete TD';
      if (error.response) {
        if (error.response.status === 403) {
          errorMessage = 'Session expired. Please login again.';
        } else {
          errorMessage = error.response.data?.message || errorMessage;
        }
      }
      Alert.alert('Error', errorMessage);
    }
  };

  // Filter TDs based on search
  const filteredTds = tds.filter(td => 
    (td.nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (td.moduleName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#01162e" />
        <Text style={{ marginTop: 16, color: '#01162e' }}>Loading data...</Text>
      </View>
    );
  }

  return (
    <PaperProvider>
      <View style={styles.container}>
        <ScrollView
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              colors={["#01162e"]}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Searchbar
              placeholder="Search TDs..."
              onChangeText={setSearchTerm}
              value={searchTerm}
              style={styles.search}
              iconColor="#01162e"
            />
            <Button
              mode="contained"
              onPress={() => openDialog('add')}
              style={styles.addButton}
              buttonColor="#01162e"
              icon="plus"
            >
              Add
            </Button>
          </View>

          {/* TD List */}
          {filteredTds.length > 0 ? (
            filteredTds.map((td, index) => (
              <Card key={index} style={styles.card}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <Text variant="titleMedium" style={styles.cardTitle}>{td.nom}</Text>
                    <Menu
                      visible={selectedTd?.id === td.id && dialogType === 'menu'}
                      onDismiss={closeDialog}
                      anchor={
                        <IconButton
                          icon="dots-vertical"
                          onPress={() => openDialog('menu', td)}
                        />
                      }
                    >
                      <Menu.Item 
                        title="Edit" 
                        leadingIcon="pencil" 
                        onPress={() => openDialog('edit', td)} 
                      />
                      <Divider />
                      <Menu.Item 
                        title="Delete" 
                        leadingIcon="delete" 
                        onPress={() => openDialog('delete', td)}
                        titleStyle={{ color: 'red' }}
                      />
                    </Menu>
                  </View>
                  
                  <Text variant="bodyMedium" style={styles.moduleText}>
                    Module: {td.moduleName}
                  </Text>
                  
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setSelectedTd(td);
                      setIsFullscreen(true);
                    }}
                    icon={td.dataType === 'VIDEO' ? 'video' : 'file'}
                    style={styles.viewButton}
                  >
                    {td.dataType === 'VIDEO' ? 'Watch Video' : 'View PDF'}
                  </Button>
                </Card.Content>
              </Card>
            ))
          ) : (
            <Text style={styles.emptyText}>No TDs found</Text>
          )}
        </ScrollView>

        {/* Add/Edit Dialog */}
        <Portal>
          <Dialog visible={['add', 'edit'].includes(dialogType)} onDismiss={closeDialog}>
            <Dialog.Title style={styles.dialogTitle}>
              {dialogType === 'add' ? 'Add New TD' : 'Edit TD'}
            </Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="TD Name"
                defaultValue={formData.name || ''}
                onChangeText={text => setFormData(prev => ({ ...prev, name: text }))}
                style={styles.input}
                error={!!errors.name}
              />
              {errors.name && <HelperText type="error">{errors.name}</HelperText>}
              
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeButtons}>
                <Button
                  mode={formData.type === 'FICHIER' ? 'contained' : 'outlined'}
                  onPress={() => setFormData(prev => ({ ...prev, type: 'FICHIER' }))}
                  style={styles.typeButton}
                >
                  PDF
                </Button>
                <Button
                  mode={formData.type === 'VIDEO' ? 'contained' : 'outlined'}
                  onPress={() => setFormData(prev => ({ ...prev, type: 'VIDEO' }))}
                  style={styles.typeButton}
                >
                  Video
                </Button>
              </View>
              
              {formData.type === 'FICHIER' ? (
                <>
                  <Button
                    mode="outlined"
                    onPress={pickFile}
                    icon="file-upload"
                    style={styles.uploadButton}
                  >
                    {formData.file ? `Selected: ${formData.file.name}` : 'Upload PDF'}
                  </Button>
                  {errors.file && <HelperText type="error">{errors.file}</HelperText>}
                  {selectedTd?.lien && !formData.file && (
                    <Text style={styles.currentFile}> upload file again</Text>
                  )}
                </>
              ) : (
                <>
                  <TextInput
                    label="Video URL"
                    defaultValue={formData.videoUrl || ''}
                    onChangeText={text => setFormData(prev => ({ ...prev, videoUrl: text }))}
                    style={styles.input}
                    error={!!errors.videoUrl}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  {errors.videoUrl && <HelperText type="error">{errors.videoUrl}</HelperText>}
                </>
              )}
              
              <Text style={styles.label}>Module</Text>
              <View style={styles.moduleButtons}>
                {modules.map(module => (
                  <Button
                    key={module.id}
                    mode={formData.module === module.name ? 'contained' : 'outlined'}
                    onPress={() => setFormData(prev => ({ ...prev, module: module.name }))}
                    style={styles.moduleButton}
                  >
                    {module.name}
                  </Button>
                ))}
              </View>
              {errors.module && <HelperText type="error">{errors.module}</HelperText>}
              
              {uploadProgress > 0 && uploadProgress < 100 && (
                <View style={styles.progressContainer}>
                  <Text>Uploading: {uploadProgress}%</Text>
                  <ProgressBar progress={uploadProgress / 100} color="#01162e" />
                </View>
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={closeDialog}>Cancel</Button>
              <Button onPress={saveTd} mode="contained">
                Save
              </Button>
            </Dialog.Actions>
          </Dialog>
          
          {/* Delete Dialog */}
          <Dialog visible={dialogType === 'delete'} onDismiss={closeDialog}>
            <Dialog.Title>Confirm Delete</Dialog.Title>
            <Dialog.Content>
              <Text>Are you sure you want to delete this TD?</Text>
              <Text style={styles.tdName}>{selectedTd?.nom}</Text>
              <Text style={styles.deleteWarning}>This action cannot be undone.</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={closeDialog}>Cancel</Button>
              <Button onPress={deleteTd} mode="contained" buttonColor="red">
                Delete
              </Button>
            </Dialog.Actions>
          </Dialog>
          
          {/* Media Viewer */}
          {isFullscreen && selectedTd && (
            <MediaViewer
              uri={selectedTd.lien}
              type={selectedTd.dataType}
              onClose={() => setIsFullscreen(false)}
            />
          )}
        </Portal>
      </View>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  search: {
    flex: 1,
    marginRight: 8,
    backgroundColor: 'white',
  },
  addButton: {
    width: 80,
    height: 40,
  },
  card: {
    marginBottom: 12,
    backgroundColor: 'white',
    borderLeftWidth: 4,
    borderLeftColor: '#01162e',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontWeight: 'bold',
    color: '#01162e',
  },
  moduleText: {
    color: '#4080be',
    marginVertical: 8,
  },
  viewButton: {
    marginTop: 8,
    borderColor: '#01162e',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    color: '#666',
  },
  input: {
    marginBottom: 8,
    backgroundColor: 'white',
  },
  label: {
    marginTop: 8,
    marginBottom: 4,
    color: '#666',
  },
  typeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  uploadButton: {
    marginBottom: 8,
    borderColor: '#01162e',
  },
  currentFile: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  moduleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  moduleButton: {
    margin: 4,
  },
  progressContainer: {
    marginTop: 8,
  },
  dialogTitle: {
    color: '#01162e',
    fontWeight: 'bold',
  },
  tdName: {
    fontWeight: 'bold',
    marginVertical: 8,
    color: '#01162e',
  },
  deleteWarning: {
    color: 'red',
    fontStyle: 'italic',
  },
});

export default TdScreen;