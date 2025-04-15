import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {
  Card,
  Avatar,
  DataTable,
  ProgressBar,
  Chip,
  useTheme,
  Text,
} from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MaterialCommunityIcons,
  MaterialIcons,
  Feather,
  Ionicons,
} from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';

const DashboardScreen = () => {
  const theme = useTheme();
  const isFocused = useIsFocused();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const baseUrl = 'https://doctorh1-kjmev.ondigitalocean.app';

  // Fallback data
  const FALLBACK_DATA = {
    nbrModule: 0,
    nbrAnnonce: 0,
    nbrResources: 0,
    nbrTd: 0,
    nbrTp: 0,
    nbrCours: 0,
    nbrExam: 0,
    nbrFichier: 0,
    nbrVideo: 0,
  };

  // Memoized data processing
  const processData = useCallback((data) => {
    return {
      ...data,
      resourcesPieData: [
        {
          name: 'Cours',
          count: data?.nbrCours || 0,
          color: '#4CAF50',
        },
        {
          name: 'TD',
          count: data?.nbrTd || 0,
          color: '#2196F3',
        },
        {
          name: 'TP',
          count: data?.nbrTp || 0,
          color: '#FF9800',
        },
        {
          name: 'Examens',
          count: data?.nbrExam || 0,
          color: '#F44336',
        },
      ].filter(item => item.count > 0),
      filesPieData: [
        {
          name: 'Fichiers',
          count: data?.nbrFichier || 0,
          color: '#9C27B0',
        },
        {
          name: 'Vidéos',
          count: data?.nbrVideo || 0,
          color: '#009688',
        },
      ].filter(item => item.count > 0),
      statsCards: [
        {
          title: 'Modules',
          value: data?.nbrModule || 0,
          icon: 'book',
          color: '#003366',
        },
        {
          title: 'Ressources',
          value: data?.nbrResources || 0,
          icon: 'file-document',
          color: '#01162e',
        },
        {
          title: 'Cours',
          value: data?.nbrCours || 0,
          icon: 'school',
          color: '#003366',
        },
        {
          title: 'Annonces',
          value: data?.nbrAnnonce || 0,
          icon: 'bullhorn',
          color: '#01162e',
        },
      ]
    };
  }, []);

  // Load dashboard data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const authData = await AsyncStorage.getItem('auth');
      const { token } = JSON.parse(authData);
      const profId = await AsyncStorage.getItem('profId');

      const response = await axios.get(
        `${baseUrl}/api/professeur/getDashboard/${profId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );

      setDashboardData(processData(response.data));
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError('Failed to load dashboard data');
      setDashboardData(processData(FALLBACK_DATA));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [processData]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Initial load
  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused, loadData]);

  // Loading state
  if (loading && !dashboardData) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Error state
  if (error && !dashboardData) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons
          name="alert-circle"
          size={48}
          color={theme.colors.error}
        />
        <Text style={styles.errorText}>{error}</Text>
        <Chip
          icon="reload"
          onPress={loadData}
          style={{ marginTop: 16, backgroundColor: theme.colors.primary }}
          textStyle={{ color: 'white' }}
        >
          Réessayer
        </Chip>
      </View>
    );
  }

  // Helper component for progress bars
  const ProgressChart = ({ data, title, icon }) => {
    const maxValue = Math.max(...data.map(item => item.count), 1);
    
    return (
      <Card style={styles.chartCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name={icon}
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>

          {data.map((item, index) => (
            <View key={index} style={styles.statBar}>
              <View style={styles.statBarHeader}>
                <Text style={styles.statLabel}>{item.name}</Text>
                <Text style={styles.statValue}>{item.count}</Text>
              </View>
              <ProgressBar
                progress={item.count / maxValue}
                color={item.color}
                style={styles.progressBar}
              />
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  };

  // Stats card component
  const StatCard = ({ title, value, icon, color }) => (
    <Card style={[styles.statCard, { backgroundColor: color }]}>
      <Card.Content style={styles.statCardContent}>
        <Avatar.Icon
          icon={icon}
          size={40}
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
        />
        <View style={styles.statTextContainer}>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={styles.statValue}>{value}</Text>
        </View>
      </Card.Content>
    </Card>
  );

  // Resource item component
  const ResourceItem = ({ icon, value, label, iconColor }) => (
    <View style={styles.resourceItem}>
      {React.createElement(icon, { size: 24, color: iconColor })}
      <Text style={styles.resourceText}>{label}: {value}</Text>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[theme.colors.primary]}
        />
      }
    >
      {/* Header with professor info */}
      <Card style={[styles.headerCard, { backgroundColor: '#003366' }]}>
        <Card.Content style={styles.headerContent}>
          <Avatar.Text
            size={64}
            label="P"
            style={styles.avatar}
            labelStyle={styles.avatarLabel}
          />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Tableau de Bord Professeur</Text>
            <Text style={styles.headerSubtitle}>
              Bienvenue, Professeur
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Stats Cards */}
      <View style={{flex : 1,flexDirection:"row",justifyContent:'center',alignItems:'center'}}>
      <MaterialCommunityIcons
          name="chevron-left"
          size={24}
          color="black"
        />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statsContainer}
      >
        {dashboardData.statsCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </ScrollView> 
       <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color="black"
        />
      </View>

      {/* Resources Overview */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="bookshelf"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.sectionTitle}>Aperçu des Ressources</Text>
          </View>

          <View style={styles.resourceSummary}>
            <View style={styles.resourceTotal}>
              <Text style={styles.totalText}>
                Total: {dashboardData.nbrResources || 0}
              </Text>
              <View style={styles.chipContainer}>
                <Chip
                  icon="file"
                  style={[styles.chip, { backgroundColor: '#01162e' }]}
                  textStyle={styles.chipText}
                >
                  Fichiers: {dashboardData.nbrFichier || 0}
                </Chip>
                <Chip
                  icon="video"
                  style={[styles.chip, { backgroundColor: '#4080be' }]}
                  textStyle={styles.chipText}
                >
                  Vidéos: {dashboardData.nbrVideo || 0}
                </Chip>
              </View>
            </View>

            <View style={styles.resourceGrid}>
              <ResourceItem 
                icon={MaterialCommunityIcons} 
                name="book" 
                value={dashboardData.nbrCours} 
                label="Cours" 
                iconColor="#4CAF50" 
              />
              <ResourceItem 
                icon={Feather} 
                name="file-text" 
                value={dashboardData.nbrTd} 
                label="TD" 
                iconColor="#2196F3" 
              />
              <ResourceItem 
                icon={Ionicons} 
                name="flask" 
                value={dashboardData.nbrTp} 
                label="TP" 
                iconColor="#FF9800" 
              />
              <ResourceItem 
                icon={MaterialIcons} 
                name="assignment" 
                value={dashboardData.nbrExam} 
                label="Examens" 
                iconColor="#F44336" 
              />
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Charts Section */}
      <View style={styles.chartsContainer}>
        <ProgressChart 
          data={dashboardData.resourcesPieData} 
          title="Contenu Éducatif" 
          icon="chart-pie" 
        />
        <ProgressChart 
          data={dashboardData.filesPieData} 
          title="Types de Fichiers" 
          icon="file-chart" 
        />
      </View>

      {/* Detailed Stats */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="chart-bar"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.sectionTitle}>Statistiques Détailées</Text>
          </View>

          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Catégorie</DataTable.Title>
              <DataTable.Title numeric>Nombre</DataTable.Title>
            </DataTable.Header>

            <DataTable.Row>
              <DataTable.Cell>Modules</DataTable.Cell>
              <DataTable.Cell numeric>{dashboardData.nbrModule}</DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>Cours</DataTable.Cell>
              <DataTable.Cell numeric>{dashboardData.nbrCours}</DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>TD</DataTable.Cell>
              <DataTable.Cell numeric>{dashboardData.nbrTd}</DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>TP</DataTable.Cell>
              <DataTable.Cell numeric>{dashboardData.nbrTp}</DataTable.Cell>
            </DataTable.Row>
          </DataTable>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  headerCard: {
    marginBottom: 20,
    borderRadius: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 16,
  },
  avatarLabel: {
    color: 'white',
    fontSize: 24,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsContainer: {
    marginBottom: 20,
  },
  statCard: {
    width: 160,
    marginRight: 12,
    borderRadius: 12,
  },
  statCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 12,
  },
  statTextContainer: {
    marginLeft: 12,
  },
  statTitle: {
    color: 'white',
    fontSize: 14,
  },
  statValue: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionCard: {
    marginBottom: 20,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  resourceSummary: {
    marginBottom: 16,
  },
  resourceTotal: {
    marginBottom: 16,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    color: 'white',
  },
  resourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  resourceItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  resourceText: {
    marginLeft: 10,
    fontSize: 14,
  },
  chartsContainer: {
    marginBottom: 20,
  },
  chartCard: {
    marginBottom: 15,
    borderRadius: 12,
  },
  statBar: {
    marginBottom: 12,
  },
  statBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
});

export default DashboardScreen;