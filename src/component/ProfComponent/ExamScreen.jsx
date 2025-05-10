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

const ExamScreen = () => {
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exams, setExams] = useState([]);
  const [modules, setModules] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogType, setDialogType] = useState(null); // 'add', 'edit', 'delete', 'menu'
  const [selectedExam, setSelectedExam] = useState(null);
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
        
        await fetchExams(parsedAuth.token, storedProfId);
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

  // Fetch Exams with proper authentication
  const fetchExams = async (authToken, professorId) => {
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
      setExams(response.data.filter(r => r.type === "EXAM"));
    } catch (error) {
      console.error('Error fetching exams:', error);
      if (error.response?.status === 403) {
        Alert.alert('Session Expired', 'Your session has expired. Please login again.');
      } else {
        Alert.alert('Error', 'Failed to fetch exams. Please try again later.');
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
      await fetchExams(token, profId);
      await fetchModules(token, profId);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, [token, profId]);

  // Dialog handlers
  const openDialog = (type, exam = null) => {
    setDialogType(type);
    setSelectedExam(exam);
    
    if (type === 'edit' && exam) {
      setFormData({
        name: exam.nom || '',
        module: exam.moduleName || '',
        type: exam.dataType || 'FICHIER',
        file: null,
        videoUrl: exam.lien || ''
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
    setSelectedExam(null);
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
    
    if (!formData.name.trim()) newErrors.name = 'Exam name is required';
    if (!formData.module) newErrors.module = 'Module is required';
    
    if (formData.type === 'VIDEO') {
      if (!formData.videoUrl.trim()) {
        newErrors.videoUrl = 'Video URL is required';
      } else if (!formData.videoUrl.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/)) {
        newErrors.videoUrl = 'Please enter a valid YouTube URL';
      }
    } else if (formData.type === 'FICHIER' && !formData.file && !selectedExam?.lien) {
      newErrors.file = 'PDF file is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save Exam
  const saveExam = async () => {
    if (!validate()) return;

    try {
      const form = new FormData();
      form.append('nom', formData.name.trim());
      form.append('type', 'EXAM');
      form.append('dataType', formData.type);
      
      if (formData.type === 'VIDEO') {
        form.append('lien', formData.videoUrl.trim());
      } else if (formData.file) {
        form.append('data', {
          uri: formData.file.uri,
          name: formData.file.name,
          type: formData.file.mimeType || 'application/pdf',
        });
      } else if (selectedExam?.lien) {
        form.append('lien', selectedExam.lien);
      }
      
      const selectedModuleObj = modules.find(m => m.name === formData.module);
      if (selectedModuleObj) {
        form.append('moduleId', selectedModuleObj.id);
      }
      form.append('professorId', profId);
      
      if (dialogType === 'edit' && selectedExam) {
        form.append('id', selectedExam.id);
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

      // Send notification only for new exams
      if (dialogType === 'add') {
        // Get professor's profile
        const decoded = jwtDecode(token);
        const email = decoded.sub;
        
        const profileResponse = await axios.get(
          `${baseUrl}/api/professeur/getProfil/${email}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const professorName = `${profileResponse.data.prenom} ${profileResponse.data.nom}`;

        // Get all tokens for notification
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
                  title: `Nouveau Examen: ${formData.name}`,
                  body: `Dr.${professorName} a ajouté un nouveau examen dans module : ${formData.module}`,
                  
                })
              });
            } catch (error) {
              console.error('Error sending notification:', error);
            }
          }));
        }
      }

      Alert.alert('Success', `Exam ${dialogType === 'add' ? 'added' : 'updated'} successfully`);
      await fetchExams(token, profId);
      closeDialog();
    } catch (error) {
      console.error('Error saving exam:', error);
      let errorMessage = 'Failed to save exam';
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

  // Delete Exam
  const deleteExam = async () => {
    try {
      await axios.delete(
        `${baseUrl}/api/professeur/deleteResource/${selectedExam.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Exam deleted successfully');
      await fetchExams(token, profId);
      closeDialog();
    } catch (error) {
      console.error('Error deleting exam:', error);
      let errorMessage = 'Failed to delete exam';
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

  // Filter exams based on search
  const filteredExams = exams.filter(exam => 
    (exam.nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (exam.moduleName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
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
              placeholder="Search Exams..."
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

          {/* Exam List */}
          {filteredExams.length > 0 ? (
            filteredExams.map((exam, index) => (
              <Card key={index} style={styles.card}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <Text variant="titleMedium" style={styles.cardTitle}>{exam.nom}</Text>
                    <Menu
                      visible={selectedExam?.id === exam.id && dialogType === 'menu'}
                      onDismiss={closeDialog}
                      contentStyle={{ backgroundColor: themeColors.surface }}
                      anchor={
                        <IconButton
                          icon="dots-vertical"
                          onPress={() => openDialog('menu', exam)}
                        />
                      }
                    >
                      <Menu.Item 
                        title="Edit" 
                        leadingIcon="pencil" 
                        onPress={() => openDialog('edit', exam)} 
                      />
                      <Divider />
                      <Menu.Item 
                        title="Delete" 
                        leadingIcon="delete" 
                        onPress={() => openDialog('delete', exam)}
                        titleStyle={{ color: themeColors.error }}
                      />
                    </Menu>
                  </View>
                  
                  <Text variant="bodyMedium" style={styles.moduleText}>
                    Module: {exam.moduleName}
                  </Text>
                  
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setSelectedExam(exam);
                      setIsFullscreen(true);
                    }}
                    icon={exam.dataType === 'VIDEO' ? 'video' : 'file'}
                    style={styles.viewButton}
                    textColor={themeColors.accent}
                  >
                    {exam.dataType === 'VIDEO' ? 'Watch Video' : 'View PDF'}
                  </Button>
                </Card.Content>
              </Card>
            ))
          ) : (
            <Text style={styles.emptyText}>No exams found</Text>
          )}
        </ScrollView>

        {/* Add/Edit Dialog */}
        <Portal>
          <Dialog visible={['add', 'edit'].includes(dialogType)} onDismiss={closeDialog} style={styles.dialog}>
            <Dialog.Title style={styles.dialogTitle}>
              {dialogType === 'add' ? 'Add New Exam' : 'Edit Exam'}
            </Dialog.Title>
            <Divider style={styles.divider} />
            <Dialog.ScrollArea>
              <View style={styles.dialogContent}>
                <TextInput
                  label="Exam Name"
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
                    {selectedExam?.lien && !formData.file && (
                      <Text style={styles.currentFile}>Current file: {selectedExam.lien.split('/').pop()}</Text>
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
                onPress={saveExam} 
                mode="contained"
                loading={uploadProgress > 0 && uploadProgress < 100}
                disabled={uploadProgress > 0 && uploadProgress < 100}
                buttonColor={themeColors.primary}
              >
                {dialogType === 'add' ? 'Add Exam' : 'Save Changes'}
              </Button>
            </Dialog.Actions>
          </Dialog>
          
          {/* Delete Dialog */}
          <Dialog visible={dialogType === 'delete'} onDismiss={closeDialog}>
            <Dialog.Title style={styles.dialogTitle}>Confirm Delete</Dialog.Title>
            <Dialog.Content>
              <Text>Are you sure you want to delete this exam?</Text>
              <Text style={styles.examName}>{selectedExam?.nom}</Text>
              <Text style={styles.deleteWarning}>This action cannot be undone.</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={closeDialog} textColor={themeColors.textLight}>Cancel</Button>
              <Button onPress={deleteExam} mode="contained" buttonColor={themeColors.error}>
                Delete
              </Button>
            </Dialog.Actions>
          </Dialog>
          
          {/* Media Viewer */}
          {isFullscreen && selectedExam && (
            <MediaViewer
              uri={selectedExam.lien}
              type={selectedExam.dataType}
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
  examName: {
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

export default ExamScreen;