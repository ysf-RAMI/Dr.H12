import React, { useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { View, ScrollView, StyleSheet, Alert, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Button, Dialog, Portal, Text, TextInput, Provider as PaperProvider, Searchbar, IconButton, HelperText, Menu, Divider, Card, ProgressBar, List } from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import MediaViewer from '../MediaViewer';

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

const TpScreen = () => {
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tps, setTps] = useState([]);
  const [modules, setModules] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogType, setDialogType] = useState(null); // 'add', 'edit', 'delete', 'menu'
  const [selectedTp, setSelectedTp] = useState(null);
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
          throw new Error('Données d\'authentification non trouvées');
        }

        const parsedAuth = JSON.parse(authData);
        if (!parsedAuth.token) {
          throw new Error('Token non trouvé');
        }

        setToken(parsedAuth.token);
        setProfId(storedProfId);
        
        await fetchTps(parsedAuth.token, storedProfId);
        await fetchModules(parsedAuth.token, storedProfId);
      } catch (error) {
        console.error('Erreur de chargement des données:', error);
        Alert.alert('Erreur', 'Échec du chargement des données. Veuillez vous reconnecter.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Fetch TPs with proper authentication
  const fetchTps = async (authToken, professorId) => {
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
      setTps(response.data.filter(r => r.type === "TP"));
    } catch (error) {
      console.error('Erreur lors de la récupération des TPs:', error);
      if (error.response?.status === 403) {
        Alert.alert('Session expirée', 'Votre session a expiré. Veuillez vous reconnecter.');
      } else {
        Alert.alert('Erreur', 'Échec de la récupération des TPs. Veuillez réessayer plus tard.');
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
      console.error('Erreur lors de la récupération des modules:', error);
      if (error.response?.status === 403) {
        Alert.alert('Session expirée', 'Votre session a expiré. Veuillez vous reconnecter.');
      } else {
        Alert.alert('Erreur', 'Échec de la récupération des modules. Veuillez réessayer plus tard.');
      }
    }
  };

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchTps(token, profId);
      await fetchModules(token, profId);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setRefreshing(false);
    }
  }, [token, profId]);

  // Dialog handlers
  const openDialog = (type, tp = null) => {
    setDialogType(type);
    setSelectedTp(tp);
    
    if (type === 'edit' && tp) {
      setFormData({
        name: tp.nom || '',
        module: tp.moduleName || '',
        type: tp.dataType || 'FICHIER',
        file: null,
        videoUrl: tp.lien || ''
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
    setSelectedTp(null);
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
        
        // File picker error messages
        if (file.size > 50 * 1024 * 1024) {
          Alert.alert('Erreur', 'La taille du fichier doit être inférieure à 50MB');
          return;
        }
        
        if (!file.mimeType || !file.mimeType.includes('pdf')) {
          Alert.alert('Erreur', 'Veuillez sélectionner un fichier PDF');
          return;
        }
        
        setFormData(prev => ({ ...prev, file }));
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du fichier:', error);
      Alert.alert('Erreur', 'Échec de la sélection du fichier');
    }
  };

  // Form validation
  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Le nom du TP est requis';
    if (!formData.module) newErrors.module = 'Le module est requis';
    
    if (formData.type === 'VIDEO') {
      if (!formData.videoUrl.trim()) {
        newErrors.videoUrl = 'L\'URL de la vidéo est requise';
      } else if (!formData.videoUrl.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/)) {
        newErrors.videoUrl = 'Veuillez entrer une URL YouTube valide';
      }
    } else if (formData.type === 'FICHIER' && !formData.file && !selectedTp?.lien) {
      newErrors.file = 'Un fichier PDF est requis';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save TP
  const saveTp = async () => {
    if (!validate()) return;

    try {
      const form = new FormData();
      form.append('nom', formData.name.trim());
      form.append('type', 'TP');
      form.append('dataType', formData.type);
      
      if (formData.type === 'VIDEO') {
        form.append('lien', formData.videoUrl.trim());
      } else if (formData.file) {
        form.append('data', {
          uri: formData.file.uri,
          name: formData.file.name,
          type: formData.file.mimeType || 'application/pdf',
        });
      } else if (selectedTp?.lien) {
        form.append('lien', selectedTp.lien);
      }
      
      const selectedModuleObj = modules.find(m => m.name === formData.module);
      if (selectedModuleObj) {
        form.append('moduleId', selectedModuleObj.id);
      }
      form.append('professorId', profId);
      
      if (dialogType === 'edit' && selectedTp) {
        form.append('id', selectedTp.id);
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
      
      // Send notification only for new TPs
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
                  title: `Nouveau TP: ${formData.name}`,
                  body: `Dr.${professorName} a ajouté un nouveau TP dans module : ${formData.module}`,
                })
              });
            } catch (error) {
              console.error('Erreur lors de l\'envoi de la notification:', error);
            }
          }));
        }
      }

      Alert.alert('Succès', `TP ${dialogType === 'add' ? 'ajouté' : 'mis à jour'} avec succès`);
      await fetchTps(token, profId);
      closeDialog();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du TP:', error);
      let errorMessage = 'Échec de la sauvegarde du TP';
      if (error.response) {
        if (error.response.status === 413) {
          errorMessage = 'La taille du fichier est trop grande (max 50MB)';
        } else if (error.response.status === 403) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        } else {
          errorMessage = error.response.data?.message || errorMessage;
        }
      }
      Alert.alert('Erreur', errorMessage);
    }
  };

  // Delete TP
  const deleteTp = async () => {
    try {
      await axios.delete(
        `${baseUrl}/api/professeur/deleteResource/${selectedTp.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Succès', 'TP supprimé avec succès');
      await fetchTps(token, profId);
      closeDialog();
    } catch (error) {
      console.error('Erreur lors de la suppression du TP:', error);
      let errorMessage = 'Échec de la suppression du TP';
      if (error.response) {
        if (error.response.status === 403) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        } else {
          errorMessage = error.response.data?.message || errorMessage;
        }
      }
      Alert.alert('Erreur', errorMessage);
    }
  };

  // Filter TPs based on search
  const filteredTps = tps.filter(tp => 
    (tp.nom?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (tp.moduleName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={{ marginTop: 16, color: themeColors.primary }}>Chargement des données...</Text>
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
              placeholder="Rechercher des TPs..."
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
              Ajouter
            </Button>
          </View>

          {/* TP List */}
          {filteredTps.length > 0 ? (
            filteredTps.map((tp, index) => (
              <Card key={index} style={styles.card}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <Text variant="titleMedium" style={styles.cardTitle}>{tp.nom}</Text>
                    <Menu
                      visible={selectedTp?.id === tp.id && dialogType === 'menu'}
                      onDismiss={closeDialog}
                      contentStyle={{ backgroundColor: themeColors.surface }}
                      anchor={
                        <IconButton
                          icon="dots-vertical"
                          onPress={() => openDialog('menu', tp)}
                        />
                      }
                    >
                      <Menu.Item 
                        title="Modifier" 
                        leadingIcon="pencil" 
                        onPress={() => openDialog('edit', tp)} 
                      />
                      <Divider />
                      <Menu.Item 
                        title="Supprimer" 
                        leadingIcon="delete" 
                        onPress={() => openDialog('delete', tp)}
                        titleStyle={{ color: themeColors.error }}
                      />
                    </Menu>
                  </View>
                  
                  <Text variant="bodyMedium" style={styles.moduleText}>
                    Module: {tp.moduleName}
                  </Text>
                  
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setSelectedTp(tp);
                      setIsFullscreen(true);
                    }}
                    icon={tp.dataType === 'VIDEO' ? 'video' : 'file'}
                    style={styles.viewButton}
                    textColor={themeColors.accent}
                  >
                    {tp.dataType === 'VIDEO' ? 'Voir la vidéo' : 'Voir le PDF'}
                  </Button>
                </Card.Content>
              </Card>
            ))
          ) : (
            <Text style={styles.emptyText}>Aucun TP trouvé</Text>
          )}
        </ScrollView>

        {/* Add/Edit Dialog */}
        <Portal>
          <Dialog visible={['add', 'edit'].includes(dialogType)} onDismiss={closeDialog} style={styles.dialog}>
            <Dialog.Title style={styles.dialogTitle}>
              {dialogType === 'add' ? 'Ajouter un nouveau TP' : 'Modifier le TP'}
            </Dialog.Title>
            <Divider style={styles.divider} />
            <Dialog.ScrollArea>
              <View style={styles.dialogContent}>
                <TextInput
                  label="Nom du TP"
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
                  <Text style={styles.inputLabel}>Type de ressource</Text>
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
                      Vidéo
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
                      {formData.file ? `Sélectionné: ${formData.file.name}` : 'Téléverser PDF'}
                    </Button>
                    {errors.file && <HelperText type="error" style={styles.errorText}>{errors.file}</HelperText>}
                    {selectedTp?.lien && !formData.file && (
                      <Text style={styles.currentFile}>Vous devez téléverser le fichier à nouveau</Text>
                    )}
                    {uploadProgress > 0 && (
                      <View style={styles.progressContainer}>
                        <Text style={styles.progressText}>Téléversement: {uploadProgress}%</Text>
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
                      label="URL YouTube"
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
                    <HelperText type="info" style={styles.infoText}>Exemple: https://www.youtube.com/watch?v=videoId</HelperText>
                  </View>
                )}
              </View>
            </Dialog.ScrollArea>
            <Divider style={styles.divider} />
            <Dialog.Actions>
              <Button onPress={closeDialog} textColor={themeColors.textLight}>Annuler</Button>
              <Button 
                onPress={saveTp} 
                mode="contained"
                loading={uploadProgress > 0 && uploadProgress < 100}
                disabled={uploadProgress > 0 && uploadProgress < 100}
                buttonColor={themeColors.primary}
              >
                {dialogType === 'add' ? 'Ajouter TP' : 'Enregistrer'}
              </Button>
            </Dialog.Actions>
          </Dialog>
          
          {/* Delete Dialog */}
          <Dialog visible={dialogType === 'delete'} onDismiss={closeDialog}>
            <Dialog.Title style={styles.dialogTitle}>Confirmer la suppression</Dialog.Title>
            <Dialog.Content>
              <Text>Êtes-vous sûr de vouloir supprimer ce TP?</Text>
              <Text style={styles.tpName}>{selectedTp?.nom}</Text>
              <Text style={styles.deleteWarning}>Cette action est irréversible.</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={closeDialog} textColor={themeColors.textLight}>Annuler</Button>
              <Button onPress={deleteTp} mode="contained" buttonColor={themeColors.error}>
                Supprimer
              </Button>
            </Dialog.Actions>
          </Dialog>
          
          {/* Media Viewer */}
          {isFullscreen && selectedTp && (
            <MediaViewer
              uri={selectedTp.lien}
              type={selectedTp.dataType}
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
          {value || `Sélectionner ${label}`}
        </Text>
        <IconButton icon="chevron-down" size={20} iconColor={themeColors.textLight} />
      </TouchableOpacity>
      
      {error && (
        <HelperText type="error" style={styles.errorText}>{error}</HelperText>
      )}
      
      <Portal>
        <Dialog visible={visible} onDismiss={() => setVisible(false)} style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>Sélectionner {label}</Dialog.Title>
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
            <Button onPress={() => setVisible(false)} textColor={themeColors.textLight}>Annuler</Button>
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
  tpName: {
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

export default TpScreen;