import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import {
  Button,
  Dialog,
  Portal,
  Text,
  TextInput,
  Provider as PaperProvider,
  Searchbar,
  IconButton,
  HelperText,
  Menu,
  Divider,
  Card,
  ProgressBar,
  List,
} from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { debounce } from 'lodash';
import MediaViewer from '../MediaViewer';

const ExamScreen = () => {
  // State management
  const [resources, setResources] = useState([]);
  const [modules, setModules] = useState([]);
  const [exams, setExams] = useState([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedModule, setSelectedModule] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [examName, setExamName] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [profId, setProfId] = useState('');
  const [token, setToken] = useState('');
  const [isFullscreenMedia, setIsFullscreenMedia] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Refs for abort controller
  const abortControllerRef = useRef(null);

  // Configuration
  const baseUrl = 'https://doctorh1-kjmev.ondigitalocean.app';

  // Debounced handlers
  const debouncedSetExamName = debounce((text) => {
    setExamName(text);
  }, 300);
  
  const debouncedSetVideoUrl = debounce((text) => {
    setVideoUrl(text);
  }, 300);

  // Show alert function
  const showAlert = useCallback((title, message) => {
    Alert.alert(title, typeof message === 'string' ? message : JSON.stringify(message));
  }, []);

  // Load authentication data
  const loadAuthData = useCallback(async () => {
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
      showAlert('Error', 'Failed to load authentication data. Please login again.');
    } finally {
      setInitialLoading(false);
    }
  }, [showAlert]);

  // Fetch data functions
  const fetchResources = useCallback(async () => {
    if (!token || !profId) return;
    
    try {
      abortControllerRef.current = new AbortController();
      const response = await axios.get(
        `${baseUrl}/api/professeur/getAllResources/${profId}`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          signal: abortControllerRef.current.signal
        }
      );
      setResources(response.data);
      setExams(response.data.filter(r => r.type === "EXAM"));
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error('Error fetching resources:', error);
        showAlert('Error', 'Failed to fetch exams');
      }
    }
  }, [token, profId, showAlert]);

  const fetchModules = useCallback(async () => {
    if (!token || !profId) return;
    
    try {
      abortControllerRef.current = new AbortController();
      const response = await axios.get(
        `${baseUrl}/api/professeur/getAllModuleByProfId/${profId}`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          signal: abortControllerRef.current.signal
        }
      );
      setModules(response.data);
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error('Error fetching modules:', error);
        showAlert('Error', 'Failed to fetch modules');
      }
    }
  }, [token, profId, showAlert]);

  // Add refresh function
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (token && profId) {
        await Promise.all([fetchResources(), fetchModules()]);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      showAlert('Error', 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  }, [token, profId, fetchResources, fetchModules, showAlert]);

  // Initial load
  useEffect(() => {
    loadAuthData();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadAuthData]);

  // Fetch data when token and profId are available
  useEffect(() => {
    if (token && profId) {
      Promise.all([fetchResources(), fetchModules()])
        .finally(() => setLoading(false));
    }
  }, [token, profId, fetchResources, fetchModules]);

  // Filter exams based on search term
  const filteredExams = React.useMemo(() => {
    return exams.filter(
      exam =>
        (exam.nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (exam.moduleName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  }, [exams, searchTerm]);

  // Dialog handlers
  const handleOpenAddDialog = useCallback(() => {
    setSelectedExam({ dataType: '' });
    setSelectedModule('');
    setFileName('');
    setExamName('');
    setVideoUrl('');
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setFormErrors({});
    setOpenAddDialog(true);
  }, []);

  const handleOpenEditDialog = useCallback((exam) => {
    setSelectedExam(exam);
    setSelectedModule(exam.moduleName);
    setExamName(exam.nom || '');
    setVideoUrl(exam.lien || '');
    setFileName(exam.dataType === 'FICHIER' ? exam.lien?.split('/').pop() || '' : '');
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setFormErrors({});
    setOpenEditDialog(true);
  }, []);

  const handleOpenDeleteDialog = useCallback((exam) => {
    setSelectedExam(exam);
    setOpenDeleteDialog(true);
  }, []);

  const handleViewFile = useCallback((exam) => {
    setSelectedExam(exam);
    setIsFullscreenMedia(true);
  }, []);

  const handleCloseDialogs = useCallback(() => {
    if (!isUploading && !isProcessing) {
      setOpenAddDialog(false);
      setOpenEditDialog(false);
      setOpenDeleteDialog(false);
      setSelectedExam(null);
      setSelectedModule('');
      setFileName('');
      setExamName('');
      setVideoUrl('');
      setSelectedFile(null);
      setUploadProgress(0);
      setFormErrors({});
    } else {
      showAlert('Please wait', 'Please wait until the operation is complete');
    }
  }, [isUploading, isProcessing, showAlert]);

  // File picker
  const pickDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      
      if (result.type === 'success' || (result.assets && result.assets.length > 0)) {
        const file = result.assets ? result.assets[0] : result;
        
        if (file.size > 50 * 1024 * 1024) {
          showAlert('Error', 'File size should be less than 50MB');
          return null;
        }
        
        if (!file.mimeType || !file.mimeType.includes('pdf')) {
          showAlert('Error', 'Please select a PDF file');
          return null;
        }
        
        setFileName(file.name);
        setSelectedFile(file);
        return file;
      }
    } catch (error) {
      console.error('Error picking document:', error);
      showAlert('Error', 'Failed to pick document');
    }
    return null;
  }, [showAlert]);

  // Form validation
  const validateVideoUrl = useCallback((url) => {
    const videoUrlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return videoUrlPattern.test(url);
  }, []);
  
  const validateForm = useCallback(() => {
    const errors = {};
    
    if (!examName) {
      errors.name = 'Exam name is required';
    }
    
    if (!selectedModule) {
      errors.module = 'Module is required';
    }
    
    if (!selectedExam?.dataType) {
      errors.dataType = 'Type is required';
    } else if (selectedExam.dataType === 'VIDEO') {
      if (!videoUrl) {
        errors.lien = 'Video URL is required';
      } else if (!validateVideoUrl(videoUrl)) {
        errors.lien = 'Please enter a valid YouTube URL';
      }
    } else if (selectedExam.dataType === 'FICHIER' && !fileName && !selectedExam?.lien) {
      errors.file = 'PDF file is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [examName, selectedModule, selectedExam, videoUrl, fileName, validateVideoUrl]);

  const handleSaveExam = useCallback(async () => {
    if (!validateForm() || isProcessing) return;

    setIsProcessing(true);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('id', selectedExam?.id || '');
      formData.append('nom', examName);
      formData.append('type', 'EXAM');
      formData.append('dataType', selectedExam.dataType);

      if (selectedExam.dataType === 'VIDEO') {
        formData.append('lien', videoUrl);
      } else if (selectedExam.dataType === 'FICHIER') {
        if (selectedFile) {
          formData.append('data', {
            uri: selectedFile.uri,
            name: fileName,
            type: selectedFile.mimeType || 'application/pdf',
          });
        } else if (selectedExam?.lien) {
          formData.append('lien', selectedExam.lien);
        }
      }

      const selectedModuleObj = modules.find(m => m.name === selectedModule);
      if (selectedModuleObj) {
        formData.append('moduleId', selectedModuleObj.id);
      }
      formData.append('professorId', profId);

      const url = selectedExam?.id
        ? `${baseUrl}/api/professeur/updateResource`
        : `${baseUrl}/api/professeur/addResource`;
      const method = selectedExam?.id ? 'put' : 'post';

      const response = await axios[method](url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: progressEvent => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      showAlert('Success', `Exam ${selectedExam?.id ? 'updated' : 'added'} successfully`);
      fetchResources();
      handleCloseDialogs();
    } catch (error) {
      console.error('Error saving exam:', error);
      let errorMessage = 'Failed to save exam';
      if (error.response) {
        if (error.response.status === 413) {
          errorMessage = 'File size is too large (max 50MB)';
        } else {
          errorMessage = error.response.data?.message || errorMessage;
        }
      }
      showAlert('Error', errorMessage);
    } finally {
      setIsProcessing(false);
      setIsUploading(false);
    }
  }, [validateForm, isProcessing, selectedExam, examName, videoUrl, selectedFile, fileName, modules, selectedModule, profId, token, showAlert, fetchResources, handleCloseDialogs]);

  // Delete exam
  const handleDeleteExam = useCallback(async () => {
    try {
      await axios.delete(
        `${baseUrl}/api/professeur/deleteResource/${selectedExam.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showAlert('Success', 'Exam deleted successfully');
      fetchResources();
      handleCloseDialogs();
    } catch (error) {
      console.error('Error deleting exam:', error);
      showAlert('Error', error.response?.data?.message || 'Failed to delete exam');
    }
  }, [selectedExam, token, showAlert, fetchResources, handleCloseDialogs]);

  // Custom dropdown component
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
          <IconButton icon="chevron-down" size={20} iconColor="#4080be" />
        </TouchableOpacity>
        
        {error && (
          <HelperText type="error">{error}</HelperText>
        )}
        
        <Portal>
          <Dialog 
            visible={visible} 
            onDismiss={() => setVisible(false)}
            style={styles.dialog}
          >
            <Dialog.Title style={styles.dialogTitle}>Select {label}</Dialog.Title>
            <Divider style={styles.divider} />
            <Dialog.ScrollArea style={styles.dropdownScrollArea}>
              <ScrollView>
                {items.map((item, index) => (
                  <React.Fragment key={index}>
                    <List.Item
                      title={item.name || item.nom}
                      onPress={() => {
                        onSelect(item.name || item.nom);
                        setVisible(false);
                      }}
                      right={props => 
                        (item.name === value || item.nom === value) ? 
                          <List.Icon {...props} icon="check" color="#4080be" /> : null
                      }
                      titleStyle={{ color: '#01162e' }}
                    />
                    {index < items.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </ScrollView>
            </Dialog.ScrollArea>
            <Divider style={styles.divider} />
            <Dialog.Actions>
              <Button onPress={() => setVisible(false)} textColor="#666">Cancel</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    );
  };

  if (initialLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#01162e" />
      </View>
    );
  }

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
            placeholder="Search exams..."
            onChangeText={(text) => setSearchTerm(text)}
            value={searchTerm}
            style={styles.search}
            iconColor="#4080be"
          />
          <Button
            mode="contained"
            onPress={handleOpenAddDialog}
            style={styles.addButton}
            buttonColor="#01162e"
            icon="plus"
          >
            Add
          </Button>
        </View>

        {/* Loading state */}
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator 
              style={styles.loader} 
              animating 
              size="large" 
              color="#01162e"
            />
          </View>
        ) : (
          <>
            {/* Exam List */}
            {filteredExams.length > 0 ? (
              <View style={styles.listContainer}>
                {filteredExams.map((exam, index) => (
                  <Card key={index} style={styles.examCard}>
                    <Card.Content>
                      <View style={styles.examHeader}>
                        <Text style={styles.examName}>{exam.nom}</Text>
                        <Menu
                          style={{ marginTop: -40 }}
                          visible={selectedIndex === index && menuVisible}
                          onDismiss={() => setMenuVisible(false)}
                          anchor={
                            <IconButton
                              icon="dots-vertical"
                              iconColor="#4080be"
                              onPress={() => {
                                setSelectedIndex(index);
                                setMenuVisible(true);
                              }}
                            />
                          }
                        >
                          <Menu.Item
                            onPress={() => {
                              handleOpenEditDialog(exam);
                              setMenuVisible(false);
                            }}
                            title="Edit"
                            leadingIcon="pencil"
                            titleStyle={{ color: '#01162e' }}
                          />
                          <Divider />
                          <Menu.Item
                            onPress={() => {
                              handleOpenDeleteDialog(exam);
                              setMenuVisible(false);
                            }}
                            title="Delete"
                            leadingIcon="delete"
                            titleStyle={{ color: '#f44336' }}
                          />
                        </Menu>
                      </View>
                      
                      <Text style={styles.examModule}>Module: {exam.moduleName}</Text>
                      
                      <View style={styles.examActions}>
                        <Button
                          mode="outlined"
                          onPress={() => handleViewFile(exam)}
                          icon={exam.dataType === 'VIDEO' ? 'video' : 'file'}
                          textColor="#4080be"
                          style={styles.viewButton}
                        >
                          {exam.dataType === 'VIDEO' ? 'Watch Video' : 'View PDF'}
                        </Button>
                      </View>
                    </Card.Content>
                  </Card>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No exams found</Text>
            )}
          </>
        )}

        {/* Add Exam Dialog */}
        <Portal>
          <Dialog 
            visible={openAddDialog} 
            onDismiss={handleCloseDialogs}
            style={styles.dialog}
          >
            <Dialog.Title style={styles.dialogTitle}>Add New Exam</Dialog.Title>
            <Divider style={styles.divider} />
            <Dialog.ScrollArea style={styles.dialogScrollArea}>
              <ScrollView>
                <View style={styles.dialogContent}>
                  <TextInput
                    label="Exam Name"
                    onChangeText={debouncedSetExamName}
                    style={styles.input}
                    mode="outlined"
                    error={!!formErrors.name}
                    outlineColor="#4080be"
                    activeOutlineColor="#01162e"
                  />
                  {formErrors.name && <HelperText type="error">{formErrors.name}</HelperText>}

                  <CustomDropdown
                    label="Type"
                    value={selectedExam?.dataType === 'VIDEO' ? 'Video' : 
                          selectedExam?.dataType === 'FICHIER' ? 'PDF' : ''}
                    items={[
                      { id: 'VIDEO', name: 'Video' },
                      { id: 'FICHIER', name: 'PDF' }
                    ]}
                    onSelect={(value) => 
                      setSelectedExam({
                        ...selectedExam,
                        dataType: value === 'Video' ? 'VIDEO' : 'FICHIER'
                      })
                    }
                    error={formErrors.dataType}
                  />

                  {selectedExam?.dataType === 'VIDEO' ? (
                    <>
                      <TextInput
                        label="Video URL"
                        onChangeText={debouncedSetVideoUrl}
                        style={styles.input}
                        mode="outlined"
                        error={!!formErrors.lien}
                        outlineColor="#4080be"
                        activeOutlineColor="#01162e"
                      />
                      {formErrors.lien && <HelperText type="error">{formErrors.lien}</HelperText>}
                      <HelperText type="info" style={styles.infoText}>
                        Example: https://www.youtube.com/watch?v=videoId
                      </HelperText>
                    </>
                  ) : selectedExam?.dataType === 'FICHIER' ? (
                    <>
                      <Button
                        mode="outlined"
                        onPress={pickDocument}
                        icon="file-upload"
                        style={styles.uploadButton}
                        textColor="#4080be"
                      >
                        {fileName ? `Selected: ${fileName}` : 'Upload PDF'}
                      </Button>
                      {formErrors.file && (
                        <HelperText type="error">{formErrors.file}</HelperText>
                      )}
                      {isUploading && (
                        <View style={styles.progressContainer}>
                          <Text>Uploading: {uploadProgress}%</Text>
                          <ProgressBar progress={uploadProgress / 100} color="#4080be" />
                        </View>
                      )}
                    </>
                  ) : null}

                  <CustomDropdown
                    label="Module"
                    value={selectedModule}
                    items={modules}
                    onSelect={setSelectedModule}
                    error={formErrors.module}
                  />
                </View>
              </ScrollView>
            </Dialog.ScrollArea>
            <Divider style={styles.divider} />
            <Dialog.Actions>
              <Button onPress={handleCloseDialogs} textColor="#666">Cancel</Button>
              <Button 
                onPress={handleSaveExam} 
                mode="contained"
                buttonColor="#01162e"
                loading={isProcessing}
                disabled={isProcessing}
              >
                Save
              </Button>
            </Dialog.Actions>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog 
            visible={openEditDialog} 
            onDismiss={handleCloseDialogs}
            style={styles.dialog}
          >
            <Dialog.Title style={styles.dialogTitle}>Edit Exam</Dialog.Title>
            <Divider style={styles.divider} />
            <Dialog.ScrollArea style={styles.dialogScrollArea}>
              <ScrollView>
                <View style={styles.dialogContent}>
                  <TextInput
                    label="Exam Name"
                    defaultValue={selectedExam?.nom || ''}
                    onChangeText={debouncedSetExamName}
                    style={styles.input}
                    mode="outlined"
                    error={!!formErrors.name}
                    outlineColor="#4080be"
                    activeOutlineColor="#01162e"
                  />
                  {formErrors.name && <HelperText type="error">{formErrors.name}</HelperText>}

                  <CustomDropdown
                    label="Type"
                    value={selectedExam?.dataType === 'VIDEO' ? 'Video' : 
                          selectedExam?.dataType === 'FICHIER' ? 'PDF' : ''}
                    items={[
                      { id: 'VIDEO', name: 'Video' },
                      { id: 'FICHIER', name: 'PDF' }
                    ]}
                    onSelect={(value) => 
                      setSelectedExam({
                        ...selectedExam,
                        dataType: value === 'Video' ? 'VIDEO' : 'FICHIER'
                      })
                    }
                    error={formErrors.dataType}
                  />

                  {selectedExam?.dataType === 'VIDEO' ? (
                    <>
                      <TextInput
                        label="Video URL"
                        defaultValue={selectedExam?.lien || ''}
                        onChangeText={debouncedSetVideoUrl}
                        style={styles.input}
                        mode="outlined"
                        error={!!formErrors.lien}
                        outlineColor="#4080be"
                        activeOutlineColor="#01162e"
                      />
                      {formErrors.lien && <HelperText type="error">{formErrors.lien}</HelperText>}
                      <HelperText type="info" style={styles.infoText}>
                        Example: https://www.youtube.com/watch?v=videoId
                      </HelperText>
                    </>
                  ) : selectedExam?.dataType === 'FICHIER' ? (
                    <>
                      <Text style={styles.currentFile}>
                        Current file: {fileName || 'None'}
                      </Text>
                      <Button
                        mode="outlined"
                        onPress={pickDocument}
                        icon="file-upload"
                        style={styles.uploadButton}
                        textColor="#4080be"
                      >
                        {selectedFile ? `Selected: ${fileName}` : 'Upload New PDF'}
                      </Button>
                      {formErrors.file && (
                        <HelperText type="error">{formErrors.file}</HelperText>
                      )}
                      {isUploading && (
                        <View style={styles.progressContainer}>
                          <Text>Uploading: {uploadProgress}%</Text>
                          <ProgressBar progress={uploadProgress / 100} color="#4080be" />
                        </View>
                      )}
                    </>
                  ) : null}

                  <CustomDropdown
                    label="Module"
                    value={selectedModule}
                    items={modules}
                    onSelect={setSelectedModule}
                    error={formErrors.module}
                  />
                </View>
              </ScrollView>
            </Dialog.ScrollArea>
            <Divider style={styles.divider} />
            <Dialog.Actions>
              <Button onPress={handleCloseDialogs} textColor="#666">Cancel</Button>
              <Button 
                onPress={handleSaveExam} 
                mode="contained"
                buttonColor="#01162e"
                loading={isProcessing}
                disabled={isProcessing}
              >
                Save Changes
              </Button>
            </Dialog.Actions>
          </Dialog>

          {/* Delete Dialog */}
          <Dialog 
            visible={openDeleteDialog} 
            onDismiss={handleCloseDialogs}
            style={styles.dialog}
          >
            <Dialog.Title style={styles.dialogTitle}>Confirm Delete</Dialog.Title>
            <Divider style={styles.divider} />
            <Dialog.Content>
              <Text style={styles.deleteText}>
                Are you sure you want to delete this exam?
              </Text>
              <Text style={styles.examName}>{selectedExam?.nom}</Text>
              <Text style={styles.deleteWarning}>This action cannot be undone.</Text>
            </Dialog.Content>
            <Divider style={styles.divider} />
            <Dialog.Actions>
              <Button onPress={handleCloseDialogs} textColor="#666">Cancel</Button>
              <Button 
                onPress={handleDeleteExam} 
                mode="contained" 
                buttonColor="#f44336"
              >
                Delete
              </Button>
            </Dialog.Actions>
          </Dialog>

          {/* Media Viewer */}
          {isFullscreenMedia && selectedExam && (
            <MediaViewer
              uri={selectedExam.dataType === 'VIDEO' ? 
                selectedExam.lien : 
                `${baseUrl}/api/files/getFile/${selectedExam.lien}`
              }
              type={selectedExam.dataType}
              onClose={() => {
                setIsFullscreenMedia(false);
                setSelectedExam(null);
              }}
            />
          )}
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  listContainer: {
    marginBottom: 16,
  },
  examCard: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 8,
    backgroundColor: 'white',
    borderLeftWidth: 4,
    borderLeftColor: '#01162e',
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  examName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    color: '#01162e',
  },
  examModule: {
    fontSize: 14,
    color: '#4080be',
    marginBottom: 4,
    fontWeight: '500',
  },
  examActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  viewButton: {
    borderColor: '#4080be',
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 32,
    color: '#666',
    fontSize: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  uploadButton: {
    marginBottom: 16,
    borderColor: '#4080be',
  },
  currentFile: {
    marginBottom: 8,
    color: '#4080be',
    fontSize: 14,
  },
  progressContainer: {
    marginBottom: 16,
  },
  dialog: {
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 5,
  },
  dialogTitle: {
    color: '#01162e',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 18,
  },
  dialogContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dialogScrollArea: {
    maxHeight: 400,
  },
  divider: {
    backgroundColor: '#e0e0e0',
    height: 1,
    marginVertical: 4,
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#4080be',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'white',
  },
  dropdownButtonError: {
    borderColor: '#f44336',
  },
  dropdownSelectedText: {
    color: '#01162e',
  },
  dropdownPlaceholderText: {
    color: '#aaa',
  },
  dropdownScrollArea: {
    maxHeight: 300,
    paddingHorizontal: 0,
  },
  inputLabel: {
    fontSize: 12,
    color: '#4080be',
    marginBottom: 4,
    paddingLeft: 8,
    fontWeight: '500',
  },
  infoText: {
    marginBottom: 16,
    color: '#4080be',
  },
  deleteText: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  deleteWarning: {
    fontSize: 14,
    color: '#f44336',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  fullscreenDialog: {
    margin: 0,
    backgroundColor: 'white',
  },
  pdfContainer: {
    padding: 0,
    flex: 1,
  },
});

export default ExamScreen;