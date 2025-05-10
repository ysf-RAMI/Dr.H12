import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Linking, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
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
// JWT decoding library
import {jwtDecode} from 'jwt-decode';

// Theme colors matching ExamScreen's theme
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

const CoursScreen = () => {
  // State management
  const [refreshing, setRefreshing] = useState(false);
  const [resources, setResources] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [modules, setModules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [dialogType, setDialogType] = useState(null); // 'add', 'edit', 'delete', 'media'
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    module: '',
    type: 'FICHIER',
    file: null,
    videoUrl: ''
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [profId, setProfId] = useState('');
  const [token, setToken] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Configuration
  const baseUrl = 'https://doctorh1-kjmev.ondigitalocean.app';

  // Refresh data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (token && profId) {
        await Promise.all([fetchResources(), fetchFilieres(), fetchModules()]);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [token, profId]);

  // Show alert function
  const showAlert = (title, message) => {
    Alert.alert(title, message);
  };

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
      showAlert('Error', 'Failed to load authentication data. Please login again.');
    } finally {
      setInitialLoading(false);
    }
  };

  // Fetch data functions
  const fetchResources = async () => {
    if (!token || !profId) return;
    
    try {
      const response = await axios.get(
        `${baseUrl}/api/professeur/getAllResources/${profId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResources(response.data);
      setCourses(response.data.filter(r => r.type === "COURS"));
    } catch (error) {
      console.error('Error fetching resources:', error);
      showAlert('Error', 'Failed to fetch courses');
    }
  };

  const fetchFilieres = async () => {
    if (!token) return;
    
    try {
      const response = await axios.get(
        `${baseUrl}/api/professeur/getAllFiliere`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFilieres(response.data);
    } catch (error) {
      console.error('Error fetching filières:', error);
      showAlert('Error', 'Failed to fetch filières');
    }
  };

  const fetchModules = async () => {
    if (!token || !profId) return;
    
    try {
      const response = await axios.get(
        `${baseUrl}/api/professeur/getAllModuleByProfId/${profId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setModules(response.data);
    } catch (error) {
      console.error('Error fetching modules:', error);
      showAlert('Error', 'Failed to fetch modules');
    }
  };

  // Initial load
  useEffect(() => {
    loadAuthData();
  }, []);

  // Fetch data when token and profId are available
  useEffect(() => {
    if (token && profId) {
      Promise.all([fetchResources(), fetchFilieres(), fetchModules()])
        .finally(() => setLoading(false));
    }
  }, [token, profId]);

  // Filter courses based on search term
  const filteredCourses = courses.filter(
    course =>
      (course.nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (course.moduleName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  // Dialog handlers
  const openDialog = (type, course = null) => {
    setDialogType(type);
    setSelectedCourse(course);
    
    if (type === 'edit' && course) {
      setFormData({
        name: course.nom || '',
        module: course.moduleName || '',
        type: course.dataType || 'FICHIER',
        file: null,
        videoUrl: course.lien || ''
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
    if (!isUploading && !isProcessing) {
      setDialogType(null);
      setSelectedCourse(null);
      setSelectedIndex(null);
      setIsFullscreen(false);
    } else {
      showAlert('Please wait', 'Please wait until the operation is complete');
    }
  };

  // File picker
  const pickDocument = async () => {
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
        
        setFormData(prev => ({ ...prev, file }));
        return file;
      }
    } catch (error) {
      console.error('Error picking document:', error);
      showAlert('Error', 'Failed to pick document');
    }
    return null;
  };

  // Form validation
  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Course name is required';
    if (!formData.module) newErrors.module = 'Module is required';
    
    if (formData.type === 'VIDEO') {
      if (!formData.videoUrl.trim()) {
        newErrors.videoUrl = 'Video URL is required';
      } else if (!formData.videoUrl.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/)) {
        newErrors.videoUrl = 'Please enter a valid YouTube URL';
      }
    } else if (formData.type === 'FICHIER' && !formData.file && !selectedCourse?.lien) {
      newErrors.file = 'PDF file is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save course
  const handleSaveCourse = async () => {
    if (!validate()) return;
  
    try {
      // First decode token to get email
      const decoded = jwtDecode(token);
      const email = decoded.sub;
  
      // Get professor's profile
      const profileResponse = await axios.get(
        `${baseUrl}/api/professeur/getProfil/${email}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const professorName = `${profileResponse.data.prenom} ${profileResponse.data.nom}`;
  
      const form = new FormData();
      form.append('nom', formData.name.trim());
      form.append('type', 'COURS');
      form.append('dataType', formData.type);
      
      if (formData.type === 'VIDEO') {
        form.append('lien', formData.videoUrl.trim());
      } else if (formData.file) {
        form.append('data', {
          uri: formData.file.uri,
          name: formData.file.name,
          type: formData.file.mimeType || 'application/pdf',
        });
      } else if (selectedCourse?.lien) {
        form.append('lien', selectedCourse.lien);
      }
      
      const selectedModuleObj = modules.find(m => m.name === formData.module);
      if (selectedModuleObj) {
        form.append('moduleId', selectedModuleObj.id);
      }
      form.append('professorId', profId);
      
      if (dialogType === 'edit' && selectedCourse) {
        form.append('id', selectedCourse.id);
      }
  
      const url = dialogType === 'add' 
        ? `${baseUrl}/api/professeur/addResource`
        : `${baseUrl}/api/professeur/updateResource`;
      
      const method = dialogType === 'add' ? 'post' : 'put';
      
      const response = await axios[method](url, form, {
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
  
      // Get all tokens for notification
      const tokensResponse = await axios.get(
        `${baseUrl}/api/student/getTokens`
      );
      
      const tokens = tokensResponse.data;
  
      // Send notification to each token
      if (tokens && tokens.length > 0) {
        const resourceType = formData.type === 'VIDEO' ? 'vidéo' : 'PDF';
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
                title: `Nouveau Cours: ${formData.name}`,
                body: `Dr.${professorName} a ajouté un nouveau cours  dans module : ${formData.module}`,
                data: { 
                  profId,
                  courseId: response.data.id,
                  professorName,
                  courseName: formData.name,
                  moduleId: modules.find(m => m.name === formData.module)?.id,
                  type: formData.type
                },
              })
            });
          } catch (error) {
            console.error('Erreur lors de l\'envoi de la notification:', error);
          }
        }));
      }
  
      // In the handleSaveCourse function, replace:
      Alert.alert('Succès', `Cours ${dialogType === 'add' ? 'ajouté' : 'modifié'} avec succès`);
      await fetchResources(token, profId); // This line is incorrect
      closeDialog();
      await fetchResources(); // Use the correct function name
      closeDialog();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du cours:', error);
      let errorMessage = 'Échec de la sauvegarde du cours';
      if (error.response) {
        if (error.response.status === 413) {
          errorMessage = 'Fichier trop volumineux (max 50MB)';
        } else if (error.response.status === 403) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        } else {
          errorMessage = error.response.data?.message || errorMessage;
        }
      }
      Alert.alert('Erreur', errorMessage);
    }
  };

  // Delete course
  const handleDeleteCourse = async () => {
    try {
      await axios.delete(
        `${baseUrl}/api/professeur/deleteResource/${selectedCourse.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showAlert('Success', 'Course deleted successfully');
      fetchResources();
      closeDialog();
    } catch (error) {
      console.error('Error deleting course:', error);
      let errorMessage = 'Failed to delete course';
      if (error.response) {
        if (error.response.status === 403) {
          errorMessage = 'Session expired. Please login again.';
        } else {
          errorMessage = error.response.data?.message || errorMessage;
        }
      }
      showAlert('Error', errorMessage);
    }
  };

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
                      title={item.name || item.nom}
                      onPress={() => {
                        onSelect(item.name || item.nom);
                        setVisible(false);
                      }}
                      titleStyle={styles.listItemTitle}
                      right={props => 
                        (item.name === value || item.nom === value) ? 
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

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={{ marginTop: 16, color: themeColors.primary }}>
          Chargement des données...
        </Text>
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
              onRefresh={onRefresh} 
              colors={[themeColors.primary]} 
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Searchbar
              placeholder="Search courses..."
              onChangeText={(text) => setSearchTerm(text)}
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

          {/* Loading state */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator animating size="large" color={themeColors.primary} />
            </View>
          ) : (
            <>
              {/* Course List */}
              {filteredCourses.length > 0 ? (
                filteredCourses.map((course, index) => (
                  <Card key={index} style={styles.card}>
                    <Card.Content>
                      <View style={styles.cardHeader}>
                        <Text variant="titleMedium" style={styles.cardTitle}>{course.nom}</Text>
                        <Menu
                          visible={selectedIndex === index && dialogType === 'menu'}
                          onDismiss={closeDialog}
                          contentStyle={{ backgroundColor: themeColors.surface }}
                          anchor={
                            <IconButton
                              icon="dots-vertical"
                              iconColor={themeColors.accent}
                              onPress={() => {
                                setSelectedIndex(index);
                                openDialog('menu', course);
                              }}
                            />
                          }
                        >
                          <Menu.Item 
                            onPress={() => {
                              openDialog('edit', course);
                            }}
                            title="Edit"
                            leadingIcon="pencil"
                            titleStyle={{ color: themeColors.text }}
                          />
                          <Divider />
                          <Menu.Item 
                            onPress={() => {
                              openDialog('delete', course);
                            }}
                            title="Delete"
                            leadingIcon="delete"
                            titleStyle={{ color: themeColors.error }}
                          />
                        </Menu>
                      </View>
                      
                      <Text variant="bodyMedium" style={styles.moduleText}>
                        Module: {course.moduleName}
                      </Text>
                      
                      <Button
                        mode="outlined"
                        onPress={() => {
                          setSelectedCourse(course);
                          setIsFullscreen(true);
                        }}
                        icon={course.dataType === 'VIDEO' ? 'video' : 'file'}
                        style={styles.viewButton}
                        textColor={themeColors.accent}
                      >
                        {course.dataType === 'VIDEO' ? 'Watch Video' : 'View PDF'}
                      </Button>
                    </Card.Content>
                  </Card>
                ))
              ) : (
                <Text style={styles.emptyText}>No courses found</Text>
              )}
            </>
          )}
        </ScrollView>

        {/* Add/Edit Dialog */}
        <Portal>
          <Dialog visible={['add', 'edit'].includes(dialogType)} onDismiss={closeDialog} style={styles.dialog}>
            <Dialog.Title style={styles.dialogTitle}>
              {dialogType === 'add' ? 'Add New Course' : 'Edit Course'}
            </Dialog.Title>
            <Divider style={styles.divider} />
            <Dialog.ScrollArea>
              <View style={styles.dialogContent}>
                <TextInput
                  label="Course Name"
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
                      onPress={pickDocument}
                      icon="file-upload"
                      style={styles.uploadButton}
                      textColor={themeColors.accent}
                    >
                      {formData.file ? `Selected: ${formData.file.name}` : 'Upload PDF'}
                    </Button>
                    {errors.file && <HelperText type="error" style={styles.errorText}>{errors.file}</HelperText>}
                    {selectedCourse?.lien && !formData.file && dialogType === 'edit' && (
                      <Text style={styles.currentFile}>You should upload file again </Text>
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
            <Dialog.Actions  style={{color:"white",padding:1}}>
              <Button onPress={closeDialog}textColor={themeColors.textLight}>Cancel</Button>
              <Button 
                onPress={handleSaveCourse} 
                mode="text"
                loading={isProcessing}
                disabled={isProcessing}
              >
                {dialogType === 'add' ? 'Add Course' : 'Save Changes'}
              </Button>
            </Dialog.Actions>
          </Dialog>

          {/* Delete Dialog */}
          <Dialog visible={dialogType === 'delete'} onDismiss={closeDialog}>
            <Dialog.Title style={styles.dialogTitle}>Confirm Delete</Dialog.Title>
            <Dialog.Content>
              <Text>Are you sure you want to delete this course?</Text>
              <Text style={styles.courseName}>{selectedCourse?.nom}</Text>
              <Text style={styles.deleteWarning}>This action cannot be undone.</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={closeDialog} textColor={themeColors.textLight}>Cancel</Button>
              <Button 
                onPress={handleDeleteCourse} 
                mode="contained" 
                buttonColor={themeColors.error}
              >
                Delete
              </Button>
            </Dialog.Actions>
          </Dialog>
          
          {/* Media Viewer */}
          {isFullscreen && selectedCourse && (
            <MediaViewer
              uri={selectedCourse.lien}
              type={selectedCourse.dataType}
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
    backgroundColor: themeColors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    borderColor: themeColors.accent,
    borderRadius: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    borderRadius: 8,
  },
  uploadSection: {
    gap: 1,
  },
  videoSection: {
    gap: 4,
  },
  progressContainer: {
    marginTop:8,
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
  },
  dialog: {
    backgroundColor: themeColors.surface,
    borderRadius: 12,
  },
  dialogContent: {
    padding: 6,
    gap: 6,
  },
  currentFile: {
    color: themeColors.secondary,
    fontSize: 14,
    fontStyle: 'italic',
  },
  courseName: {
    fontWeight: 'bold',
    marginVertical: 1,
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

export default CoursScreen;