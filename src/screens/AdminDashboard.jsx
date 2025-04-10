import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Image
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
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Import screens
import FiliereScreen from '../component/Admin/FiliereScreen';
import AdminProfile from '../component/Admin/AdminProfile';
import AdminRDashboard from '../component/Admin/AdminRDashboard';
import Professeures from '../component/Admin/Professeures';

const Stack = createStackNavigator();

const AdminDashboard = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainDrawer" component={MainDrawerNavigator} />
  </Stack.Navigator>
);

const MainDrawerNavigator = () => {
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();
  const theme = useTheme();

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  const colors = {
    primary: '#01162e',
    secondary: '#003366',
    accent: '#4a90e2',
    background:'#01162e',
    surface: 'white',
    text: '#01162e',
    onPrimary:  'white',
  };

  const navigationSections = [
    {
      title: "Gestion Doctor H1",
      description: "Administration du système éducatif",
      items: [
        { 
          key: 'dashboard', 
          title: 'Tableau de Bord', 
          icon: 'view-dashboard', 
          description: 'Statistiques et aperçu global' 
        },
        { 
          key: 'filiere', 
          title: 'Filières', 
          icon: 'book-education-outline', 
          description: 'Gestion des programmes d\'études' 
        },
        { 
          key: 'professeures', 
          title: 'Enseignants', 
          icon: 'account-group-outline', 
          description: 'Gestion du corps professoral' 
        },
      ]
    },
    {
      title: "Paramètres",
      description: "Préférences et configuration",
      items: [
        { 
          key: 'profile', 
          title: 'Profil Administrateur', 
          icon: 'account-cog-outline', 
          description: 'Modifier vos informations' 
        },
      ]
    }
  ];

  const renderScreen = () => {
    const screenMap = {
      dashboard: <AdminRDashboard />,
      filiere: <FiliereScreen />,
      professeures: <Professeures />,
      profile: <AdminProfile />,
    };
    return screenMap[activeScreen] || <AdminRDashboard />;
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['auth']);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }], 
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

      <Appbar.Header style={{ backgroundColor: colors.primary, elevation: 4 }}>
        <Appbar.Action 
          icon={() => <MaterialCommunityIcons name="menu" color={colors.onPrimary} size={24} />} 
          onPress={() => setDrawerOpen(true)} 
        />
        <Appbar.Content 
          title={activeScreen === 'dashboard' ? 'Tableau de Bord' : 
                activeScreen === 'filiere' ? 'Filières' :
                activeScreen === 'professeures' ? 'Enseignants' : 
                'Profil'}
          titleStyle={{ 
            color: colors.onPrimary, 
            fontWeight: '600',
            fontSize: 18
          }} 
        />
      </Appbar.Header>

      {/* Main Content */}
      <View style={styles.content}>{renderScreen()}</View>

      {/* Enhanced Drawer Menu */}
      <Portal>
        <Modal 
          visible={drawerOpen} 
          onDismiss={() => setDrawerOpen(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={[styles.drawerContainer, { backgroundColor: colors.surface }]}>
            {/* Drawer Header */}
            <View style={[styles.drawerHeader, { backgroundColor: colors.primary }]}>
              <Image 
                source={require('../../assets/logoSite.png')} 
                style={styles.logo} 
                resizeMode="contain"
              />
              <Text style={styles.welcomeText}>Portail Administratif</Text>
              <Text style={styles.institutionText}>Doctor H1 - Plateforme d'apprentissage</Text>
            </View>

            <ScrollView style={styles.scrollContainer}>
              {navigationSections.map((section, index) => (
                <View key={index} style={styles.sectionContainer}>
                  <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                    {section.title}
                  </Text>
                  <Text style={[styles.sectionDescription, { color: colors.textLight }]}>
                    {section.description}
                  </Text>
                  
                  <Drawer.Section style={styles.drawerSection}>
                    {section.items.map((item) => (
                      <Drawer.Item
                        key={item.key}
                        label={item.title}
                        icon={() => (
                          <MaterialCommunityIcons 
                            name={item.icon} 
                            color={activeScreen === item.key ? colors.secondary : colors.text} 
                            size={24} 
                          />
                        )}
                        active={activeScreen === item.key}
                        onPress={() => {
                          setActiveScreen(item.key);
                          setDrawerOpen(false);
                        }}
                        style={[
                          styles.drawerItem, 
                          activeScreen === item.key && { 
                            backgroundColor: `${colors.secondary}15`,
                            borderLeftWidth: 4,
                            borderLeftColor: colors.secondary
                          }
                        ]}
                        labelStyle={{ 
                          color: activeScreen === item.key ? colors.secondary : colors.text,
                          fontWeight: activeScreen === item.key ? '600' : '500'
                        }}
                      />
                    ))}
                  </Drawer.Section>
                </View>
              ))}
            </ScrollView>

            {/* Fixed Bottom Section */}
            <View style={[styles.bottomSection, { borderTopColor: colors.divider }]}>
              <Drawer.Item
                label="Déconnexion"
                icon={() => (
                  <MaterialCommunityIcons 
                    name="logout" 
                    color={colors.error} 
                    size={22} 
                  />
                )}
                onPress={handleLogout}
                style={styles.logoutItem}
                labelStyle={{ 
                  color: colors.error,
                  fontWeight: '500'
                }}
              />
              <Text style={[styles.versionText, { color: colors.textLight }]}>
              Tous les droits reserves • Doctor H1
              </Text>
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
  },
  modalContainer: {
    flex: 1,
    margin: 0,
    justifyContent: 'flex-start',
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
  },
  drawerContainer: {
    width: '85%',
    height: '100%',
    justifyContent: 'space-between',
  },
  drawerHeader: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 25,
  },
  logo: {
    width: 180,
    height: 50,
    marginBottom: 15,
  },
  welcomeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  institutionText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    marginLeft: 15,
  },
  sectionDescription: {
    fontSize: 12,
    opacity: 0.8,
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
    backgroundColor: 'transparent',
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
  versionText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 5,
    opacity: 0.6,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});

export default AdminDashboard;