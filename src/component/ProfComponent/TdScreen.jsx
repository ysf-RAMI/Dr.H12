import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Button, Dialog, Portal, Text, TextInput, Provider as PaperProvider, Searchbar, IconButton, HelperText, Menu, Divider, Card, ProgressBar, List } from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import MediaViewer from '../MediaViewer';
import { jwtDecode } from 'jwt-decode';

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
      // Get professor's profile for notification
      const decoded = jwtDecode(token);
      const email = decoded.sub;
      
      const profileResponse = await axios.get(
        `${baseUrl}/api/professeur/getProfil/${email}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const professorName = `${profileResponse.data.prenom} ${profileResponse.data.nom}`;

      const form = new FormData();
      form.append('nom', formData.name.trim());
      form.append('type', 'TD');
      form.append('dataType', formData.type);
      
      // In the saveTd function, update the file append section:
      if (formData.type === 'VIDEO') {
        form.append('lien', formData.videoUrl.trim());
      } else if (formData.file) {
        const fileToUpload = {
          uri: formData.file.uri,
          type: 'application/pdf',
          name: formData.file.name || 'document.pdf'
        };
        form.append('data', fileToUpload);
      }
      
      if (selectedTd?.lien) {
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

      // Send notification only for new TDs
      if (dialogType === 'add') {
        // Get all tokens for notification - Updated to use baseUrl
        const tokensResponse = await axios.get(
           `${baseUrl}/api/student/getTokens`
        );
        
        const tokens = tokensResponse.data;

        // Send notification to each token
        if (tokens && tokens.length > 0) {
          await Promise.all(tokens.map(async (token) => {
            try {
              await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  to: token,
                  title: `Nouveau TD: ${formData.name}`,
                  body: `Dr.${professorName} a ajouté un nouveau TD dans module : ${formData.module}`,
                
                })
              });
            } catch (error) {
              console.error('Error sending notification:', error);
            }
          }));
        }
      }

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
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={{ marginTop: 16, color: themeColors.primary }}>Loading data...</Text>
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
              colors={[themeColors.primary]}
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
              iconColor={themeColors.primary}
            />
            <Button
              mode="contained"
              onPress={() => openDialog('add')}
              style={styles.addButton}
              buttonColor={themeColors.primary}
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
                      contentStyle={{ backgroundColor: themeColors.surface }}
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
                        titleStyle={{ color: themeColors.error }}

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
                    textColor={themeColors.accent}
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
          <Dialog visible={['add', 'edit'].includes(dialogType)} onDismiss={closeDialog} style={styles.dialog}>
            <Dialog.Title style={styles.dialogTitle}>
              {dialogType === 'add' ? 'Add New TD' : 'Edit TD'}
            </Dialog.Title>
            <Divider style={styles.divider} />
            <Dialog.ScrollArea>
              <View style={styles.dialogContent}>
                <TextInput
                  label="TD Name"
                  defaultValue={formData.name || ''}
                  onChangeText={text => setFormData(prev => ({ ...prev, name: text }))}
                  style={styles.input}
                  mode="outlined"
                  error={!!errors.name}
                  outlineColor={themeColors.textLight}
                  activeOutlineColor={themeColors.accent}
                />
                {errors.name && <HelperText type="error" style={styles.errorText}>{errors.name}</HelperText>}
                
                <CustomDropdown
                  label="Module"
                  value={formData.module}
                  items={modules}
                  onSelect={(value) => setFormData(prev => ({ ...prev, module: value }))}
                  error={errors.module}
                />
                
                <View style={styles.typeSection}>
                  <Text style={styles.inputLabel}>Resource Type</Text>
                  <View style={styles.typeButtons}>
                    <Button
                      mode={formData.type === 'FICHIER' ? 'contained' : 'outlined'}
                      onPress={() => setFormData(prev => ({ ...prev, type: 'FICHIER' }))}
                      style={styles.typeButton}
                      icon="file-pdf-box"
                      buttonColor={formData.type === 'FICHIER' ? themeColors.accent : undefined}
                      textColor={formData.type === 'FICHIER' ? themeColors.surface : themeColors.accent}
                    >
                      PDF
                    </Button>
                    <Button
                      mode={formData.type === 'VIDEO' ? 'contained' : 'outlined'}
                      onPress={() => setFormData(prev => ({ ...prev, type: 'VIDEO' }))}
                      style={styles.typeButton}
                      icon="youtube"
                      buttonColor={formData.type === 'VIDEO' ? themeColors.accent : undefined}
                      textColor={formData.type === 'VIDEO' ? themeColors.surface : themeColors.accent}
                    >
                      Video
                    </Button>
                  </View>
                </View>
                
                {formData.type === 'FICHIER' ? (
                  <View style={styles.uploadSection}>
                    <Button
                      mode="outlined"
                      onPress={pickFile}
                      icon="file-upload"
                      style={styles.uploadButton}
                      textColor={themeColors.accent}
                    >
                      {formData.file ? `Selected: ${formData.file.name}` : 'Upload PDF'}
                    </Button>
                    {errors.file && <HelperText type="error" style={styles.errorText}>{errors.file}</HelperText>}
                    {selectedTd?.lien && !formData.file && (
                      <Text style={styles.currentFile}>you should upload file again </Text>
                    )}
                    {uploadProgress > 0 && (
                      <View style={styles.progressContainer}>
                        <Text style={styles.progressText}>Uploading: {uploadProgress}%</Text>
                        <ProgressBar 
                          progress={uploadProgress / 100} 
                          color={themeColors.accent}
                          style={styles.progressBar}
                        />
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.videoSection}>
                    <TextInput
                      label="YouTube URL"
                      defaultValue={formData.videoUrl || ''}
                      onChangeText={text => setFormData(prev => ({ ...prev, videoUrl: text }))}
                      style={styles.input}
                      mode="outlined"
                      error={!!errors.videoUrl}
                      left={<TextInput.Icon icon="youtube" color={themeColors.accent} />}
                      outlineColor={themeColors.textLight}
                      activeOutlineColor={themeColors.accent}
                    />
                    {errors.videoUrl && <HelperText type="error" style={styles.errorText}>{errors.videoUrl}</HelperText>}
                    <HelperText type="info" style={styles.infoText}>Example: https://www.youtube.com/watch?v=videoId</HelperText>
                  </View>
                )}
              </View>
            </Dialog.ScrollArea>
            <Divider style={styles.divider} />
            <Dialog.Actions>
              <Button onPress={closeDialog} textColor={themeColors.textLight}>Cancel</Button>
              <Button 
                onPress={saveTd} 
                mode="contained"
                loading={uploadProgress > 0 && uploadProgress < 100}
                disabled={uploadProgress > 0 && uploadProgress < 100}
                buttonColor={themeColors.primary}
              >
                {dialogType === 'add' ? 'Add TD' : 'Save Changes'}
              </Button>
            </Dialog.Actions>
          </Dialog>
          
          {/* Delete Dialog */}
          <Dialog visible={dialogType === 'delete'} onDismiss={closeDialog}>
            <Dialog.Title style={styles.dialogTitle}>Confirm Delete</Dialog.Title>
            <Dialog.Content>
              <Text>Are you sure you want to delete this TD?</Text>
              <Text style={styles.tdName}>{selectedTd?.nom}</Text>
              <Text style={styles.deleteWarning}>This action cannot be undone.</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={closeDialog} textColor={themeColors.textLight}>Cancel</Button>
              <Button onPress={deleteTd} mode="contained" buttonColor={themeColors.error}>
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

const CustomDropdown = ({ label, value, items, onSelect, error }) => {
  const [visible, setVisible] = useState(false);
  
  return (
    <View style={styles.dropdownContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          error ? styles.dropdownButtonError : null
        ]}
        onPress={() => setVisible(true)}
      >
        <Text style={value ? styles.dropdownSelectedText : styles.dropdownPlaceholderText}>
          {value || `Select ${label}`}
        </Text>
        <IconButton icon="chevron-down" size={20} iconColor={themeColors.textLight} />
      </TouchableOpacity>
      
      {error && (
        <HelperText type="error" style={styles.errorText}>{error}</HelperText>
      )}
      
      <Portal>
        <Dialog visible={visible} onDismiss={() => setVisible(false)} style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>Select {label}</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView>
              {items.map((item, index) => (
                <React.Fragment key={index}>
                  <List.Item
                    title={item.name}
                    onPress={() => {
                      onSelect(item.name);
                      setVisible(false);
                    }}
                    titleStyle={styles.listItemTitle}
                    right={props => 
                      item.name === value ? 
                        <List.Icon {...props} icon="check" color={themeColors.accent} /> : null
                    }
                  />
                  {index < items.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setVisible(false)} textColor={themeColors.textLight}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: themeColors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themeColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  search: {
    flex: 1,
    backgroundColor: themeColors.surface,
    borderRadius: 8,
    elevation: 2,
  },
  addButton: {
    borderRadius: 8,
    elevation: 2,
  },
  card: {
    marginBottom: 12,
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: themeColors.accent,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontWeight: 'bold',
    color: themeColors.text,
    fontSize: 16,
  },
  moduleText: {
    color: themeColors.secondary,
    marginVertical: 8,
    fontSize: 14,
  },
  viewButton: {
    marginTop: 8,
    borderColor: themeColors.accent,
    borderRadius: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    color: themeColors.textLight,
  },
  input: {
    marginBottom: 8,
    backgroundColor: themeColors.surface,
    borderRadius: 8,
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: themeColors.accent,
    borderRadius: 8,
    padding: 12,
    backgroundColor: themeColors.surface,
  },
  dropdownButtonError: {
    borderColor: themeColors.error,
  },
  dropdownSelectedText: {
    color: themeColors.text,
    fontSize: 16,
  },
  dropdownPlaceholderText: {
    color: themeColors.textLight,
    fontSize: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: themeColors.secondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  dialogTitle: {
    color: themeColors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 20,
  },
  uploadButton: {
    marginBottom: 8,
    borderColor: themeColors.accent,
    borderRadius: 8,
  },
  typeSection: {
    marginBottom: 16,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  typeButton: {
    flex: 1,
    borderRadius: 8,
  },
  uploadSection: {
    gap: 8,
  },
  videoSection: {
    gap: 4,
  },
  progressContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: themeColors.textLight,
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  divider: {
    backgroundColor: themeColors.background,
    height: 1,
    marginVertical: 8,
  },
  dialog: {
    backgroundColor: themeColors.surface,
    borderRadius: 12,
  },
  dialogContent: {
    padding: 16,
    gap: 16,
  },
  currentFile: {
    color: themeColors.secondary,
    fontSize: 14,
    fontStyle: 'italic',
  },
  tdName: {
    fontWeight: 'bold',
    marginVertical: 8,
    color: themeColors.primary,
  },
  deleteWarning: {
    color: themeColors.error,
    fontStyle: 'italic',
    marginTop: 8,
  },
  dialogScrollArea: {
    maxHeight: 300,
    paddingHorizontal: 0,
  },
  listItemTitle: {
    color: themeColors.text,
  },
  errorText: {
    color: themeColors.error,
  },
  infoText: {
    color: themeColors.textLight,
  },
});

export default TdScreen;