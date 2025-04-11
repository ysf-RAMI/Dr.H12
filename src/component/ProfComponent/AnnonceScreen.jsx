import React, { useEffect, useState, useRef } from 'react';
import { View, ScrollView, StyleSheet, Image, RefreshControl, Alert } from 'react-native';
import {
  Button,
  Dialog,
  Portal,
  Text,
  TextInput,
  Provider as PaperProvider,
  ActivityIndicator,
  IconButton,
  Card,
  ProgressBar,
  Chip,
} from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NotificationService from '../../services/NotificationService';

const AnnouncementScreen = () => {
  // State management
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profId, setProfId] = useState('');
  const [token, setToken] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  // Configuration
  const baseUrl = 'https://doctorh1-kjmev.ondigitalocean.app';
  const defaultImage = require('../../../assets/annonceDefaultImage.jpg');

  // Refs for form inputs to prevent lag
  const titleRef = useRef(null);
  const descriptionRef = useRef(null);

  // Load authentication data
  const loadAuthData = async () => {
    try {
      const [authData, storedProfId] = await Promise.all([
        AsyncStorage.getItem('auth'),
        AsyncStorage.getItem('profId')
      ]);
      
      if (authData && storedProfId) {
        const parsedAuth = JSON.parse(authData);
        setToken(parsedAuth.token);
        setProfId(storedProfId);
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
      // Removed Alert dialog
    }
  };

  // Fetch announcements
  // Remove Alert from fetchAnnouncements function
  const fetchAnnouncements = async () => {
    if (!token || !profId) return;
    
    try {
      setLoading(true);
      const response = await axios.get(
        `${baseUrl}/api/professeur/getAllAnnonceByIdProfesseru/${profId}`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        }
      );
      
      const fetchedData = response.data || [];
      setAnnouncements(Array.isArray(fetchedData) ? fetchedData : []);
      
      if (page > 1 && fetchedData.length <= (page - 1) * itemsPerPage) {
        setPage(1);
      }
      
    } catch (error) {
      console.error('Fetch error details:', error.response?.data || error.message);
      setAnnouncements([]);
      // Removed Alert dialog
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh with improved implementation
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (token && profId) {
        await fetchAnnouncements();
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadAuthData();
  }, []);

  // Fetch data when token and profId are available
  useEffect(() => {
    if (token && profId) {
      fetchAnnouncements();
    }
  }, [token, profId]);

 

  // Pagination
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedAnnouncements = announcements.slice(startIndex, endIndex);

  if (loading && announcements.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
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
            colors={["#01162e"]}
            tintColor="#01162e"
          />
        }
      >
        {/* Header with Add Button */}
        <View style={styles.headerContainer}>
          <AddAnnouncementDialog 
            token={token}
            profId={profId}
            baseUrl={baseUrl}
            onSuccess={fetchAnnouncements}
            titleRef={titleRef}
            descriptionRef={descriptionRef}
          />
        </View>

        {/* Announcement Grid */}
        {announcements.length > 0 ? (
          <View style={styles.gridContainer}>
            {displayedAnnouncements.map((announcement) => (
              <AnnouncementCard 
                key={announcement.id}
                announcement={announcement}
                baseUrl={baseUrl}
                defaultImage={defaultImage}
                token={token}
                onDeleteSuccess={fetchAnnouncements}
                titleRef={titleRef}
                descriptionRef={descriptionRef}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="bullhorn" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No announcements found</Text>
            <AddAnnouncementDialog 
              token={token}
              profId={profId}
              baseUrl={baseUrl}
              onSuccess={fetchAnnouncements}
              titleRef={titleRef}
              descriptionRef={descriptionRef}
              triggerStyle={styles.emptyButton}
              triggerText="Create your first announcement"
            />
          </View>
        )}

        {/* Pagination Controls */}
        {announcements.length > itemsPerPage && (
          <View style={styles.paginationContainer}>
            <Button 
              disabled={page === 1}
              onPress={() => handlePageChange(page - 1)}
            >
              Previous
            </Button>
            <Text style={styles.pageText}>Page {page}</Text>
            <Button 
              disabled={endIndex >= announcements.length}
              onPress={() => handlePageChange(page + 1)}
            >
              Next
            </Button>
          </View>
        )}
      </ScrollView>
    </PaperProvider>
  );
};

// Separate Add Announcement Dialog Component
const AddAnnouncementDialog = ({ 
  token, 
  profId, 
  baseUrl, 
  onSuccess,
  titleRef,
  descriptionRef,
  triggerStyle,
  triggerText = "Add Announcement"
}) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setImageUri({ uri: asset.uri });
        const uriSegments = asset.uri.split('/');
        setFileName(uriSegments[uriSegments.length - 1]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // In the AddAnnouncementDialog component
  const validateForm = () => {
    if (!title || !description) {
      Alert.alert('Error', 'Title and description are required');
      return false;
    }
    return true;
  };

  // Remove the useEffect for notification setup
  
  const handleSave = async () => {
    if (!validateForm() || isUploading || !token || !profId) return;
  
    setIsUploading(true);
    setUploadProgress(0);
  
    try {
      const formData = new FormData();
      formData.append('titre', title);
      formData.append('description', description);
      formData.append('idProfesseur', profId);
  
      if (imageUri?.uri) {
        formData.append('image', {
          uri: imageUri.uri,
          name: fileName || 'image.jpg',
          type: 'image/jpeg'
        });
      }
  
      const response = await axios.post(
        `${baseUrl}/api/professeur/addAnnonce`, 
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: progressEvent => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setUploadProgress(percentCompleted);
          },
        }
      );
  
      Alert.alert('Success', 'Announcement added successfully and notification sent');
      await NotificationService.sendAnnouncementNotification({
        title: title,
        body: description,
      });
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save announcement');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setOpen(false);
      setTitle('');
      setDescription('');
      setImageUri(null);
      setFileName('');
      setUploadProgress(0);
    }
  };

  return (
    <>
      <Button
        mode="contained"
        onPress={() => setOpen(true)}
        style={[styles.addButton, triggerStyle]}
        icon="plus"
        buttonColor="#01162e"
      >
        {triggerText}
      </Button>

      <Portal>
        <Dialog visible={open} onDismiss={handleClose} style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>
            Add New Announcement
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              ref={titleRef}
              label="Title"
              onChangeText={setTitle}
              style={styles.input}
              mode="outlined"
              defaultValue=""
              outlineColor="#4080be"
              activeOutlineColor="#01162e"
            />
            
            <TextInput
              ref={descriptionRef}
              label="Description"
              onChangeText={setDescription}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={4}
              defaultValue=""
              outlineColor="#4080be"
              activeOutlineColor="#01162e"
            />
            
            <Button
              mode="outlined"
              onPress={pickImage}
              icon="image"
              style={styles.uploadButton}
              textColor="#4080be"
            >
              {imageUri ? 'Change Image' : 'Select Image'}
            </Button>
            
            {fileName && (
              <Chip icon="file-image" style={styles.fileChip}>
                {fileName}
              </Chip>
            )}
            
            {imageUri && (
              <Image 
                source={imageUri} 
                style={styles.previewImage}
                resizeMode="contain"
              />
            )}
            
            {isUploading && (
              <View style={styles.progressContainer}>
                <ProgressBar progress={uploadProgress / 100} />
                <Text style={styles.progressText}>
                  Uploading: {uploadProgress}%
                </Text>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleClose}>Cancel</Button>
            <Button 
              onPress={handleSave} 
              mode="contained"
              loading={isUploading}
              disabled={isUploading}
              buttonColor="#01162e"
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

// Separate Edit Announcement Dialog Component
const EditAnnouncementDialog = ({ 
  announcement, 
  token, 
  baseUrl, 
  onSuccess,
  titleRef,
  descriptionRef
}) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(announcement?.titre || '');
  const [description, setDescription] = useState(announcement?.description || '');
  const [imageUri, setImageUri] = useState(
    announcement?.imageUrl ? { uri: `${baseUrl}${announcement.imageUrl}` } : null
  );
  const [fileName, setFileName] = useState(
    announcement?.imageUrl ? announcement.imageUrl.split('/').pop() : ''
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setImageUri({ uri: asset.uri });
        const uriSegments = asset.uri.split('/');
        setFileName(uriSegments[uriSegments.length - 1]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const validateForm = () => {
    if (!title || !description) {
      Alert.alert('Error', 'Title and description are required');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm() || isUploading || !token || !announcement?.id) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('titre', title);
      formData.append('description', description);
      formData.append('id', announcement.id);

      if (imageUri?.uri) {
        formData.append('image', {
          uri: imageUri.uri,
          name: fileName || 'image.jpg',
          type: 'image/jpeg'
        });
      }

      await axios.put(
        `${baseUrl}/api/professeur/updateAnnonce`, 
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: progressEvent => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setUploadProgress(percentCompleted);
          },
        }
      );

      Alert.alert('Success', 'Announcement updated successfully');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update announcement');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setOpen(false);
      // Reset to original values
      setTitle(announcement?.titre || '');
      setDescription(announcement?.description || '');
      setImageUri(
        announcement?.imageUrl ? { uri: `${baseUrl}${announcement.imageUrl}` } : null
      );
      setFileName(
        announcement?.imageUrl ? announcement.imageUrl.split('/').pop() : ''
      );
      setUploadProgress(0);
    }
  };

  return (
    <>
      <IconButton
        icon="pencil"
        size={20}
        onPress={() => setOpen(true)}
        iconColor="#4080be"
      />

      <Portal>
        <Dialog visible={open} onDismiss={handleClose} style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>
            Edit Announcement
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              ref={titleRef}
              label="Title"
              defaultValue={title}
              onChangeText={setTitle}
              style={styles.input}
              mode="outlined"
              outlineColor="#4080be"
              activeOutlineColor="#01162e"
            />
            
            <TextInput
              ref={descriptionRef}
              label="Description"
              defaultValue={description}
              onChangeText={setDescription}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={4}
              outlineColor="#4080be"
              activeOutlineColor="#01162e"
            />
            
            <Button
              mode="outlined"
              onPress={pickImage}
              icon="image"
              style={styles.uploadButton}
              textColor="#4080be"
            >
              {imageUri ? 'Change Image' : 'Select Image'}
            </Button>
            
            {fileName && (
              <Chip icon="file-image" style={styles.fileChip}>
                {fileName}
              </Chip>
            )}
            
            {imageUri && (
              <Image 
                source={imageUri} 
                style={styles.previewImage}
                resizeMode="contain"
              />
            )}
            
            {isUploading && (
              <View style={styles.progressContainer}>
                <ProgressBar progress={uploadProgress / 100} />
                <Text style={styles.progressText}>
                  Uploading: {uploadProgress}%
                </Text>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleClose} textColor="#666">Cancel</Button>
            <Button 
              onPress={handleSave} 
              mode="contained"
              loading={isUploading}
              disabled={isUploading}
              buttonColor="#01162e"
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

// Separate Delete Confirmation Dialog Component
const DeleteAnnouncementDialog = ({ 
  announcement, 
  token, 
  baseUrl, 
  onSuccess 
}) => {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // In the DeleteAnnouncementDialog component
  const handleDelete = async () => {
    if (isDeleting || !announcement?.id) return;
  
    // Use native Alert for confirmation
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete "${announcement?.titre}"?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            
            try {
              await axios.delete(
                `${baseUrl}/api/professeur/deleteAnnonce/${announcement.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              
              // Close the dialog
              setOpen(false);
              
              // Show success message with native Alert
              Alert.alert('Success', 'Announcement deleted successfully');
              
              // Force a refresh of the announcements list
              setTimeout(() => {
                onSuccess();
              }, 300);
              
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete announcement');
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <>
      <IconButton
        icon="delete"
        size={20}
        onPress={handleDelete}
        iconColor="#f44336"
        disabled={isDeleting}
      />
    </>
  );
};

// Separate Announcement Card Component
const AnnouncementCard = ({ 
  announcement, 
  baseUrl, 
  defaultImage,
  token,
  onDeleteSuccess,
  titleRef,
  descriptionRef
}) => {
  return (
    <Card style={styles.card}>
      <Card.Content>
        {/* Card Header with Title and Actions */}
        <View style={styles.cardHeader}>
          <Text variant="titleLarge" style={styles.cardTitle}>
            {announcement.titre}
          </Text>
          <View style={styles.cardActions}>
            <EditAnnouncementDialog 
              announcement={announcement}
              token={token}
              baseUrl={baseUrl}
              onSuccess={onDeleteSuccess}
              titleRef={titleRef}
              descriptionRef={descriptionRef}
            />
            <DeleteAnnouncementDialog 
              announcement={announcement}
              token={token}
              baseUrl={baseUrl}
              onSuccess={onDeleteSuccess}
            />
          </View>
        </View>

        {/* Date */}
        <View style={styles.dateContainer}>
          <MaterialCommunityIcons name="clock-outline" size={16} color="#4080be" />
          <Text variant="bodySmall" style={styles.dateText}>
            Posted on: {announcement.date}
          </Text>
        </View>

        {/* Image */}
        <Image
          source={
            announcement.imageUrl 
              ? { uri: `${baseUrl}${announcement.imageUrl}` }
              : defaultImage
          }
          style={styles.cardImage}
          resizeMode="cover"
          defaultSource={defaultImage}
        />

        {/* Description */}
        <Text variant="bodyMedium" style={styles.descriptionText}>
          {announcement.description}
        </Text>
      </Card.Content>
    </Card>
  );
};

export default AnnouncementScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f7fa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  addButton: {
    borderRadius: 8,
    elevation: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#01162e',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: 'bold',
    flex: 1,
    color: '#01162e',
  },
  cardActions: {
    flexDirection: 'row',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    marginLeft: 4,
    color: '#4080be',
  },
  cardImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginVertical: 8,
  },
  descriptionText: {
    color: '#333',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 10,
    color: '#666',
    fontSize: 16,
  },
  emptyButton: {
    marginTop: 10,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  pageText: {
    marginHorizontal: 12,
    color: '#01162e',
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'white',
    marginBottom: 12,
  },
  uploadButton: {
    marginBottom: 12,
    borderColor: '#4080be',
  },
  fileChip: {
    marginBottom: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#e8f0fe',
  },
  progressContainer: {
    marginVertical: 12,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 4,
    color: '#4080be',
  },
  dialogTitle: {
    fontWeight: 'bold',
    color: '#01162e',
    textAlign: 'center',
    fontSize: 18,
  },
  deleteDialogTitle: {
    fontWeight: 'bold',
    color: '#f44336',
    textAlign: 'center',
    fontSize: 18,
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
  dialog: {
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 5,
  },
});