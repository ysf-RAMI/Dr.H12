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

const CoursScreen = () => {
  // State management
  const [refreshing, setRefreshing] = useState(false);
  const [resources, setResources] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [modules, setModules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openPdfDialog, setOpenPdfDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
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
  const [courseName, setCourseName] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [profId, setProfId] = useState('');
  const [token, setToken] = useState('');
  const [isFullscreenMedia, setIsFullscreenMedia] = useState(false);

  // Add this new function
  const handleToggleFullscreen = (fullscreen) => {
    setIsFullscreenMedia(fullscreen);
  };
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
  }, [token, profId, fetchResources, fetchFilieres, fetchModules]);

  // Configuration
  const baseUrl = 'https://doctorh1-kjmev.ondigitalocean.app';

  // Debounced handlers
  const debouncedSetCourseName = debounce((text) => {
    setCourseName(text);
  }, 300);
  
  const debouncedSetVideoUrl = debounce((text) => {
    setVideoUrl(text);
  }, 300);

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
  const handleOpenAddDialog = () => {
    setSelectedCourse({ dataType: '' });
    setSelectedModule('');
    setFileName('');
    setCourseName('');
    setVideoUrl('');
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setFormErrors({});
    setOpenAddDialog(true);
  };

  const handleOpenEditDialog = (course) => {
    setSelectedCourse(course);
    setSelectedModule(course.moduleName);
    setCourseName(course.nom || '');
    setVideoUrl(course.lien || '');
    setFileName(course.dataType === 'FICHIER' ? course.lien?.split('/').pop() || '' : '');
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setFormErrors({});
    setOpenEditDialog(true);
  };

  const handleOpenDeleteDialog = (course) => {
    setSelectedCourse(course);
    setOpenDeleteDialog(true);
  };

  const handleOpenPdfDialog = (course) => {
    setSelectedCourse(course);
    setOpenPdfDialog(true);
  };

  const handleCloseDialogs = () => {
    if (!isUploading && !isProcessing) {
      setOpenAddDialog(false);
      setOpenEditDialog(false);
      setOpenDeleteDialog(false);
      setOpenPdfDialog(false);
      setSelectedCourse(null);
      setSelectedModule('');
      setFileName('');
      setCourseName('');
      setVideoUrl('');
      setSelectedFile(null);
      setUploadProgress(0);
      setFormErrors({});
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
        
        setFileName(file.name);
        setSelectedFile(file);
        return file;
      }
    } catch (error) {
      console.error('Error picking document:', error);
      showAlert('Error', 'Failed to pick document');
    }
    return null;
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!courseName) {
      errors.name = 'Course name is required';
    }
    
    if (!selectedModule) {
      errors.module = 'Module is required';
    }
    
    if (!selectedCourse?.dataType) {
      errors.dataType = 'Type is required';
    } else if (selectedCourse.dataType === 'VIDEO' && !videoUrl) {
      errors.lien = 'Video URL is required';
    } else if (selectedCourse.dataType === 'FICHIER') {
      // For edit case, check if there's an existing file or a new one is selected
      if (!selectedFile && !selectedCourse?.lien) {
        errors.file = 'PDF file is required';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save course
  const handleSaveCourse = async () => {
    if (!validateForm() || isProcessing) return;
  
    // Additional check for PDF files in edit mode
    if (selectedCourse?.dataType === 'FICHIER' && 
        !selectedFile && 
        !selectedCourse?.lien && 
        openEditDialog) {
      showAlert('Warning', 'Please select a PDF file or keep the existing one');
      return;
    }
  
    setIsProcessing(true);
    setIsUploading(true);
    setUploadProgress(0);
  
    try {
      // ... rest of the save logic remains the same
    } catch (error) {
      // ... error handling
    } finally {
      setIsProcessing(false);
      setIsUploading(false);
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
      handleCloseDialogs();
    } catch (error) {
      console.error('Error deleting course:', error);
      showAlert('Error', error.response?.data?.message || 'Failed to delete course');
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
          <IconButton icon="chevron-down" size={20} />
        </TouchableOpacity>
        
        {error && (
          <HelperText type="error">{error}</HelperText>
        )}
        
        <Portal>
          <Dialog visible={visible} onDismiss={() => setVisible(false)}>
            <Dialog.Title>Select {label}</Dialog.Title>
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
                          <List.Icon {...props} icon="check" /> : null
                      }
                    />
                    {index < items.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </ScrollView>
            </Dialog.ScrollArea>
            <Dialog.Actions>
              <Button onPress={() => setVisible(false)}>Cancel</Button>
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
        <Text style={{ marginTop: 16, color: '#01162e' }}>
          Chargement des données...
        </Text>
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
            placeholder="Search courses..."
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
            <ActivityIndicator style={styles.loader} animating size="large" color="#01162e" />
          </View>
        ) : (
          <>
            {/* Course List */}
            {filteredCourses.length > 0 ? (
              <View style={styles.listContainer}>
                {filteredCourses.map((course, index) => (
                  <Card key={index} style={styles.courseCard}>
                    <Card.Content>
                      <View style={styles.courseHeader}>
                        <Text style={styles.courseName}>{course.nom}</Text>
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
                              handleOpenEditDialog(course);
                              setMenuVisible(false);
                            }}
                            title="Edit"
                            leadingIcon="pencil"
                            titleStyle={{ color: '#01162e' }}
                          />
                          <Divider />
                          <Menu.Item
                            onPress={() => {
                              handleOpenDeleteDialog(course);
                              setMenuVisible(false);
                            }}
                            title="Delete"
                            leadingIcon="delete"
                            titleStyle={{ color: '#f44336' }}
                          />
                        </Menu>
                      </View>
                      
                      <Text style={styles.courseModule}>Module: {course.moduleName}</Text>
                      
                      <View style={styles.courseActions}>
                        <Button
                          mode="outlined"
                          onPress={() => handleOpenPdfDialog(course)}
                          icon={course.dataType === 'VIDEO' ? 'video' : 'file'}
                          textColor="#4080be"
                          style={styles.viewButton}
                        >
                          {course.dataType === 'VIDEO' ? 'Watch Video' : 'View PDF'}
                        </Button>
                      </View>
                    </Card.Content>
                  </Card>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No courses found</Text>
            )}
          </>
        )}

        {/* Add Course Dialog */}
        <Portal>
          <Dialog visible={openAddDialog} onDismiss={handleCloseDialogs} style={styles.dialog}>
            <Dialog.Title style={styles.dialogTitle}>Add New Course</Dialog.Title>
            <Divider style={styles.divider} />
            <Dialog.ScrollArea style={styles.dialogScrollArea}>
              <ScrollView>
                <View style={styles.dialogContent}>
                  <TextInput
                    label="Course Name"
                    onChangeText={debouncedSetCourseName}
                    style={styles.input}
                    mode="outlined"
                    error={!!formErrors.name}
                    outlineColor="#4080be"
                    activeOutlineColor="#01162e"
                  />
                  {formErrors.name && <HelperText type="error">{formErrors.name}</HelperText>}

                  <CustomDropdown
                    label="Type"
                    value={selectedCourse?.dataType === 'VIDEO' ? 'Video' : 
                          selectedCourse?.dataType === 'FICHIER' ? 'PDF' : ''}
                    items={[
                      { id: 'VIDEO', name: 'Video' },
                      { id: 'FICHIER', name: 'PDF' }
                    ]}
                    onSelect={(value) => 
                      setSelectedCourse({
                        ...selectedCourse,
                        dataType: value === 'Video' ? 'VIDEO' : 'FICHIER'
                      })
                    }
                    error={formErrors.dataType}
                  />

                  {selectedCourse?.dataType === 'VIDEO' ? (
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
                  ) : selectedCourse?.dataType === 'FICHIER' ? (
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
                onPress={handleSaveCourse} 
                mode="contained"
                loading={isProcessing}
                disabled={isProcessing}
                buttonColor="#01162e"
              >
                Save
              </Button>
            </Dialog.Actions>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog visible={openEditDialog} onDismiss={handleCloseDialogs} style={styles.dialog}>
            <Dialog.Title style={styles.dialogTitle}>Edit Course</Dialog.Title>
            <Divider style={styles.divider} />
            <Dialog.ScrollArea style={styles.dialogScrollArea}>
              <ScrollView>
                <View style={styles.dialogContent}>
                  <TextInput
                    label="Course Name"
                    defaultValue={selectedCourse?.nom || ''}
                    onChangeText={debouncedSetCourseName}
                    style={styles.input}
                    mode="outlined"
                    error={!!formErrors.name}
                    outlineColor="#4080be"
                    activeOutlineColor="#01162e"
                    onBlur={() => {
                      if (!courseName) {
                        setFormErrors(prev => ({ ...prev, name: 'Course name is required' }));
                      }
                    }}
                  />
                  {formErrors.name && <HelperText type="error">{formErrors.name}</HelperText>}

                  <CustomDropdown
                    label="Type"
                    value={selectedCourse?.dataType === 'VIDEO' ? 'Video' : 
                          selectedCourse?.dataType === 'FICHIER' ? 'PDF' : ''}
                    items={[
                      { id: 'VIDEO', name: 'Video' },
                      { id: 'FICHIER', name: 'PDF' }
                    ]}
                    onSelect={(value) => 
                      setSelectedCourse({
                        ...selectedCourse,
                        dataType: value === 'Video' ? 'VIDEO' : 'FICHIER'
                      })
                    }
                    error={formErrors.dataType}
                  />

                  {selectedCourse?.dataType === 'VIDEO' ? (
                    <>
                      <TextInput
                        label="Video URL"
                        defaultValue={selectedCourse?.lien || ''}
                        onChangeText={debouncedSetVideoUrl}
                        style={styles.input}
                        mode="outlined"
                        error={!!formErrors.lien}
                        onBlur={() => {
                          if (selectedCourse?.dataType === 'VIDEO' && !videoUrl) {
                            setFormErrors(prev => ({ ...prev, lien: 'Video URL is required' }));
                          }
                        }}
                      />
                      {formErrors.lien && <HelperText type="error">{formErrors.lien}</HelperText>}
                      <HelperText type="info" style={styles.infoText}>
                        Example: https://www.youtube.com/watch?v=videoId
                      </HelperText>
                    </>
                  ) : selectedCourse?.dataType === 'FICHIER' ? (
                    <>
                      <Text style={styles.currentFile}>
                      ajouter le fichier pdf 
                      </Text>
                      <Button
                        mode="outlined"
                        onPress={pickDocument}
                        icon="file-upload"
                        style={styles.uploadButton}
                      >
                        {selectedFile ? `Selected: ${fileName}` : 'Upload New PDF'}
                      </Button>
                      {formErrors.file && (
                        <HelperText type="error">{formErrors.file}</HelperText>
                      )}
                      {isUploading && (
                        <View style={styles.progressContainer}>
                          <Text>Uploading: {uploadProgress}%</Text>
                          <ProgressBar progress={uploadProgress / 100} />
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
                onPress={handleSaveCourse} 
                mode="contained"
                loading={isProcessing}
                disabled={isProcessing}
                buttonColor="#01162e"
              >
                Save Changes
              </Button>
            </Dialog.Actions>
          </Dialog>

          {/* Delete Dialog */}
          <Dialog visible={openDeleteDialog} onDismiss={handleCloseDialogs} style={styles.dialog}>
            <Dialog.Title style={styles.dialogTitle}>Confirm Delete</Dialog.Title>
            <Divider style={styles.divider} />
            <Dialog.Content>
              <Text>
                Are you sure you want to delete this course: {selectedCourse?.nom}?
              </Text>
            </Dialog.Content>
            <Divider style={styles.divider} />
            <Dialog.Actions>
              <Button onPress={handleCloseDialogs} textColor="#666">Cancel</Button>
              <Button 
                onPress={handleDeleteCourse} 
                mode="contained" 
                buttonColor="#f44336"
              >
                Delete
              </Button>
            </Dialog.Actions>
          </Dialog>

          {/* PDF Viewer Dialog */}
          <Dialog 
            visible={openPdfDialog} 
            onDismiss={handleCloseDialogs}
            dismissable={false}
            style={styles.fullscreenDialog}
          >
            <Dialog.Content style={styles.pdfContainer}>
              {selectedCourse?.lien ? (
                <MediaViewer 
                  uri={selectedCourse.lien}
                  type={selectedCourse?.dataType}
                  onClose={handleCloseDialogs}
                />
              ) : (
                <Text>No media available</Text>
              )}
            </Dialog.Content>
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
  courseCard: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 8,
    backgroundColor: 'white',
    borderLeftWidth: 4,
    borderLeftColor: '#01162e',
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    color: '#01162e',
  },
  fullscreenDialog: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    margin: 0,
    padding: 0,
    maxHeight: '100%',
    maxWidth: '100%',
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
    zIndex: 999999,
  },
  pdfContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    padding: 0,
    margin: 0,
  },
  courseModule: {
    fontSize: 14,
    color: '#4080be',
    marginBottom: 4,
    fontWeight: '500',
  },
  courseType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  courseActions: {
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
  pdfDialog: {
    maxHeight: '90%',
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
});

export default CoursScreen;