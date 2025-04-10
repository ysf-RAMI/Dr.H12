import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Text, 
  Appbar, 
  Drawer, 
  useTheme, 
  Portal, 
  Modal 
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { Buffer } from 'buffer';

// Import screens
import DashboardScreen from '../component/ProfComponent/DashboardScreen';
import ModuleScreen from '../component/ProfComponent/ModuleScreen';
import CoursScreen from '../component/ProfComponent/CoursScreen';
import TdScreen from '../component/ProfComponent/TdScreen';
import TpScreen from '../component/ProfComponent/TpScreen';
import ExamScreen from '../component/ProfComponent/ExamScreen';
import AnnonceScreen from '../component/ProfComponent/AnnonceScreen';
import ProfileScreen from '../component/ProfComponent/ProfileScreen';

const Stack = createStackNavigator();

const TeacherDashboard = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainDrawer" component={MainDrawerNavigator} />
    </Stack.Navigator>
  );
};

const MainDrawerNavigator = () => {
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [professorData, setProfessorData] = useState(null);
  const navigation = useNavigation();
  const theme = useTheme();

  const baseUrl = 'https://doctorh1-kjmev.ondigitalocean.app';

  const colors = {
    primary: '#01162e',       // Changed from #003366 to match your app's dark blue
    secondary: '#04142c',     // Slightly darker shade for contrast
    accent: '#4080be',        // Changed from #4a90e2 to match your app's accent color
    background: theme.colors.background || '#ffffff',
    surface: theme.colors.surface || '#f8f8f8',
    text: theme.colors.text || '#000000',
    onPrimary: theme.colors.onPrimary || '#ffffff',
  };

  const navigationSections = [
    {
      title: "Enseignement",
      description: "Gestion des cours et activités pédagogiques",
      items: [
        { 
          key: 'module', 
          title: 'Modules', 
          icon: 'menu-book',
          description: 'Gestion des modules enseignés'
        },
        { 
          key: 'cours', 
          title: 'Cours Magistraux', 
          icon: 'school',
          description: 'Documents et supports de cours'
        },
        { 
          key: 'td', 
          title: 'Travaux Dirigés', 
          icon: 'description',
          description: 'Exercices et corrigés'
        },
        { 
          key: 'tp', 
          title: 'Travaux Pratiques', 
          icon: 'science',
          description: 'Manuels de laboratoire'
        },
      ]
    },
    {
      title: "Évaluation",
      description: "Gestion des examens et communications",
      items: [
        { 
          key: 'exam', 
          title: 'Examens', 
          icon: 'assignment',
          description: 'Sujets et corrections'
        },
        { 
          key: 'annonce', 
          title: 'Annonces', 
          icon: 'announcement',
          description: 'Communications aux étudiants'
        },
      ]
    }
  ];

  useEffect(() => {
    
    const fetchProfessorData = async () => {
      try {
        const authData = await AsyncStorage.getItem('auth');
        if (!authData) {
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          return;
        }

        const { token } = JSON.parse(authData);
        const decoded = decodeToken(token);
        
        if (decoded?.sub) {
          const response = await axios.get(
            `${baseUrl}/api/professeur/GetProfesseur/${decoded.sub}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (response.data?.id) {
            await AsyncStorage.setItem('profId', response.data.id.toString());
            setProfessorData(response.data);
          }
        }
      } catch (error) {
        console.error('Erreur de chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessorData();
  }, []);

  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(Buffer.from(base64, 'base64').toString('ascii'));
    } catch (error) {
      console.error('Erreur de décodage:', error);
      return null;
    }
  };

  const renderScreen = () => {
    const screenMap = {
      dashboard: <DashboardScreen professorData={professorData} />,
      module: <ModuleScreen professorData={professorData} />,
      cours: <CoursScreen professorData={professorData} />,
      td: <TdScreen professorData={professorData} />,
      tp: <TpScreen professorData={professorData} />,
      exam: <ExamScreen professorData={professorData} />,
      annonce: <AnnonceScreen professorData={professorData} />,
      profile: <ProfileScreen professorData={professorData} />,
    };
    return screenMap[activeScreen] || <DashboardScreen professorData={professorData} />;
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['auth', 'profId']); 
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }], // Make sure 'Main' is your TabNavigator route name
      });
    } catch (error) {
      console.error('Déconnexion échouée:', error);
    }
  };

  const renderIcon = (name, color, size = 24) => {
    return <MaterialIcons name={name} color={color} size={size} />;
  };

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.text }}>
          Chargement des données...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.primary }]}>
     
      
      {/* Header */}
      <Appbar.Header style={{ 
        backgroundColor: colors.primary, 
        elevation: 0,
      }}>
        <Appbar.Action 
          icon={() => renderIcon('menu', colors.onPrimary)} 
          onPress={() => setDrawerOpen(true)} 
        />
        <Appbar.Content 
          title={
            activeScreen === 'dashboard' ? 'Tableau de Bord' :
            activeScreen === 'module' ? 'Modules' :
            activeScreen === 'cours' ? 'Cours Magistraux' :
            activeScreen === 'td' ? 'Travaux Dirigés' :
            activeScreen === 'tp' ? 'Travaux Pratiques' :
            activeScreen === 'exam' ? 'Examens' :
            activeScreen === 'annonce' ? 'Annonces' :
            'Profil'
          }
          titleStyle={{ 
            color: colors.onPrimary, 
            fontWeight: '600',
            fontSize: 18
          }} 
        />
      </Appbar.Header>

      {/* Main Content */}
      <View style={styles.content}>
        {renderScreen()}
      </View>

      {/* Enhanced Drawer Menu */}
      <Portal>
        <Modal 
          visible={drawerOpen} 
          onDismiss={() => setDrawerOpen(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={[styles.drawerContainer, { backgroundColor: colors.surface }]}>
            {/* Drawer Header with Profile and Logo */}
            <View style={[styles.drawerHeader, { backgroundColor: colors.primary }]}>
              <Image 
                source={require('../../assets/logoSite.png')} 
                style={styles.logo} 
                resizeMode="contain"
              />
              <View style={styles.profileContainer}>
                
                <View style={styles.profileText}>
                  <Text style={[styles.drawerTitle, { color: colors.onPrimary }]}>
                    {professorData ? `Prof. ${professorData.prenom} ${professorData.nom}` : 'Portail Enseignant'}
                  </Text>
                  
                </View>
              </View>
            </View>

            <ScrollView style={styles.scrollContainer}>
              {/* Dashboard Item (always first) */}
              <Drawer.Section style={styles.drawerSection}>
                <Drawer.Item
                  label="Tableau de Bord"
                  icon={() => renderIcon(
                    'dashboard',
                    activeScreen === 'dashboard' ? colors.accent : colors.text
                  )}
                  active={activeScreen === 'dashboard'}
                  onPress={() => {
                    setActiveScreen('dashboard');
                    setDrawerOpen(false);
                  }}
                  style={[
                    styles.drawerItem,
                    activeScreen === 'dashboard' && { 
                      backgroundColor: `${colors.accent}20`,
                      borderLeftWidth: 4,
                      borderLeftColor: colors.accent
                    }
                  ]}
                  labelStyle={{
                    color: activeScreen === 'dashboard' 
                      ? colors.accent 
                      : colors.text,
                    fontWeight: '500'
                  }}
                />
              </Drawer.Section>

              {/* Navigation Sections */}
              {navigationSections.map((section, index) => (
                <View key={index} style={styles.sectionContainer}>
                  <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                    {section.title}
                  </Text>
                  <Text style={[styles.sectionDescription, { color: colors.text }]}>
                    {section.description}
                  </Text>
                  
                  <Drawer.Section style={styles.drawerSection}>
                    {section.items.map((item) => (
                      <Drawer.Item
                        key={item.key}
                        label={item.title}
                        icon={() => renderIcon(
                          item.icon,
                          activeScreen === item.key ? colors.accent : colors.text
                        )}
                        active={activeScreen === item.key}
                        onPress={() => {
                          setActiveScreen(item.key);
                          setDrawerOpen(false);
                        }}
                        style={[
                          styles.drawerItem,
                          activeScreen === item.key && { 
                            backgroundColor: `${colors.accent}20`,
                            borderLeftWidth: 4,
                            borderLeftColor: colors.accent
                          }
                        ]}
                        labelStyle={{
                          color: activeScreen === item.key 
                            ? colors.accent 
                            : colors.text,
                          fontWeight: '500'
                        }}
                      />
                    ))}
                  </Drawer.Section>
                </View>
              ))}
            </ScrollView>

            {/* Fixed Bottom Section */}
            <View style={[styles.bottomSection, { borderTopColor: colors.primary + '20' }]}>
              <Drawer.Section style={styles.drawerSection}>
                <Drawer.Item
                  label="Mon Profil"
                  icon={() => renderIcon(
                    'account-circle',
                    activeScreen === 'profile' ? colors.accent : colors.text
                  )}
                  active={activeScreen === 'profile'}
                  onPress={() => {
                    setActiveScreen('profile');
                    setDrawerOpen(false);
                  }}
                  style={[
                    styles.drawerItem,
                    activeScreen === 'profile' && { 
                      backgroundColor: `${colors.accent}20`,
                      borderLeftWidth: 4,
                      borderLeftColor: colors.accent
                    }
                  ]}
                  labelStyle={{
                    color: activeScreen === 'profile' 
                      ? colors.accent 
                      : colors.text,
                    fontWeight: '500'
                  }}
                />
                <Drawer.Item
                  label="Déconnexion"
                  icon={() => renderIcon('logout', colors.text)}
                  onPress={handleLogout}
                  style={styles.logoutItem}
                  labelStyle={{ 
                    color: colors.text,
                    fontWeight: '500'
                  }}
                />
               
              </Drawer.Section>
            </View>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    backgroundColor: '#fff',
  },
  modalContainer: {
    flex: 1,
    margin: 0,
    justifyContent: 'flex-start',
  },
  drawerContainer: {
    width: '85%',
    height: '100%',
    justifyContent: 'space-between',
  },
  drawerHeader: {
    padding: 20,
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 50,
    marginBottom: 20,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  profileText: {
    flex: 1,
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  drawerSubtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  sectionContainer: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    marginLeft: 15,
  },
  sectionDescription: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 10,
    marginLeft: 15,
  },
  drawerSection: {
    marginTop: 5,
  },
  drawerItem: {
    marginHorizontal: 8,
    borderRadius: 6,
    marginVertical: 3,
    paddingVertical: 8,
  },
  bottomSection: {
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  logoutItem: {
    marginHorizontal: 8,
    borderRadius: 6,
    marginVertical: 3,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  versionText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  copyrightText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TeacherDashboard;