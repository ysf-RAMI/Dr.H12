import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  RefreshControl,
  ActivityIndicator,
  Text
} from 'react-native';
import {
  Card,
  Avatar,
  DataTable,
  Chip,
  useTheme,
  ProgressBar
} from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  MaterialCommunityIcons,
  MaterialIcons,
  FontAwesome5,
  Feather,
  Ionicons
} from '@expo/vector-icons';

const AdminRDashboard = () => {
  const theme = useTheme();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const API_URL = 'https://doctorh1-kjmev.ondigitalocean.app/api/admin';

  // Fallback data
  const FALLBACK_DATA = {
    nbrProfesseur: 0,
    nbrFiliere: 0,
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

  // Load dashboard data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const authData = await AsyncStorage.getItem('auth');
      const { token } = JSON.parse(authData);
      
      const response = await axios.get(`${API_URL}/dashboardAdmin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDashboardData(response.data);
    } catch (error) {
      console.error('Dashboard load error:', error);
      setDashboardData(FALLBACK_DATA);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Loading state
  if (loading && !dashboardData) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#01162e" />
        <Text style={{ marginTop: 10, color: '#01162e' }}>Chargement...</Text>
      </View>
    );
  }

  // Stats cards data
  const statsCards = [
    {
      title: "Professeurs",
      value: dashboardData?.nbrProfesseur || 0,
      icon: 'account-group',
      color: '#003366'
    },
    {
      title: "Filières",
      value: dashboardData?.nbrFiliere || 0,
      icon: 'bookmark-multiple',
      color: '#01162e'
    },
    {
      title: "Modules",
      value: dashboardData?.nbrModule || 0,
      icon: 'book-open-variant',
      color: '#003366'
    },
    {
      title: "Annonces",
      value: dashboardData?.nbrAnnonce || 0,
      icon: 'bullhorn',
      color: '#01162e'
    }
  ];

  // Resource items data
  const resourceItems = [
    {
      icon: 'book',
      iconComponent: MaterialCommunityIcons,
      value: dashboardData?.nbrCours || 0,
      label: "Cours",
      color: "#4CAF50"
    },
    {
      icon: 'file-document',
      iconComponent: MaterialCommunityIcons,
      value: dashboardData?.nbrTd || 0,
      label: "TD",
      color: "#2196F3"
    },
    {
      icon: 'flask',
      iconComponent: MaterialCommunityIcons,
      value: dashboardData?.nbrTp || 0,
      label: "TP",
      color: "#FF9800"
    },
    {
      icon: 'file-chart',
      iconComponent: MaterialCommunityIcons,
      value: dashboardData?.nbrExam || 0,
      label: "Examens",
      color: "#F44336"
    }
  ];

  // File type items
  const fileTypeItems = [
    {
      icon: 'file',
      value: dashboardData?.nbrFichier || 0,
      label: "Fichiers",
      color: "#9C27B0"
    },
    {
      icon: 'video',
      value: dashboardData?.nbrVideo || 0,
      label: "Vidéos",
      color: "#009688"
    }
  ];

  // Reusable components
  const StatCard = ({ title, value, icon, color }) => (
    <Card style={[styles.statCard, { backgroundColor: color }]}>
      <Card.Content style={styles.statCardContent}>
        <Avatar.Icon 
          icon={icon}
          size={40}
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.65)' }}
        />
        <View style={styles.statTextContainer}>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={styles.statValue}>{value}</Text>
        </View>
      </Card.Content>
    </Card>
  );

  const ResourceItem = ({ icon, iconComponent: IconComponent, value, label, color }) => (
    <View style={styles.resourceItem}>
      
      <IconComponent name={icon} size={20} color={color} />
      <Text style={styles.resourceText}>{label}: {value}</Text>
    </View>
  );

  const ProgressChart = ({ title, icon, items }) => (
    <Card style={styles.chartCard}>
      <Card.Content>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons 
            name={icon} 
            size={24} 
            color="#01162e" 
          />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        
        {items.map((item, index) => (
          <View key={index} style={styles.progressItem}>
            <View style={styles.progressHeader}>
              <MaterialCommunityIcons 
                name={item.icon} 
                size={20} 
                color={item.color} 
              />
              <Text style={styles.progressLabel}>{item.label}</Text>
              <Text style={styles.progressValue}>{item.value}</Text>
            </View>
            <ProgressBar 
              progress={item.value / Math.max(...items.map(i => i.value), 1)}
              color={item.color}
              style={styles.progressBar}
            />
          </View>
        ))}
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#01162e']}
        />
      }
    >
      <View style={{flex : 1,flexDirection:"row",justifyContent:'center',alignItems:'center'}}> 
        
     
      <MaterialCommunityIcons
          name="chevron-left"
          size={24}
          color="black"
        />
      {/* Stats Cards */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.statsContainer}
      >
        {statsCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </ScrollView>
      <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color="black"
        />
          </View>

      {/* Resources Summary */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons 
              name="bookshelf" 
              size={24} 
              color="#01162e" 
            />
            <Text style={styles.sectionTitle}>Aperçu des Ressources</Text>
          </View>
          
          <View style={styles.resourceSummary}>
            {resourceItems.map((item, index) => (
              <ResourceItem key={index} {...item} />
            ))}
          </View>

          <View style={styles.totalResources}>
            <Text style={styles.totalText}>
              Total des Ressources: {dashboardData?.nbrResources || 0}
            </Text>
            <View style={styles.chipContainer}>
              {fileTypeItems.map((item, index) => (
                <Chip
                  key={index}
                  icon={item.icon}
                  style={[styles.chip, { backgroundColor: item.color }]}
                  textStyle={styles.chipText}
                >
                  {item.label}: {item.value}
                </Chip>
              ))}
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Charts Section */}
      <View style={styles.chartsContainer}>
        <ProgressChart 
          title="Distribution des Ressources" 
          icon="chart-pie" 
          items={resourceItems}
        />
        <ProgressChart 
          title="Types de Fichiers" 
          icon="file-chart" 
          items={fileTypeItems}
        />
      </View>

      {/* Detailed Stats */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons 
              name="chart-bar" 
              size={24} 
              color="#01162e" 
            />
            <Text style={styles.sectionTitle}>Statistiques Détaillées</Text>
          </View>
          
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Catégorie</DataTable.Title>
              <DataTable.Title numeric>Nombre</DataTable.Title>
            </DataTable.Header>

            <DataTable.Row>
              <DataTable.Cell>Professeurs</DataTable.Cell>
              <DataTable.Cell numeric>{dashboardData?.nbrProfesseur || 0}</DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>Filières</DataTable.Cell>
              <DataTable.Cell numeric>{dashboardData?.nbrFiliere || 0}</DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>Modules</DataTable.Cell>
              <DataTable.Cell numeric>{dashboardData?.nbrModule || 0}</DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>Ressources</DataTable.Cell>
              <DataTable.Cell numeric>{dashboardData?.nbrResources || 0}</DataTable.Cell>
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
    backgroundColor: '#f8f9fa'
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    marginBottom: 20,
  },
  statCard: {
    width: 160,
    marginRight: 12,
    borderRadius: 16,
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
    borderRadius: 16,
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
    color: '#01162e'
  },
  resourceSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  totalResources: {
    marginTop: 16,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#01162e'
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    color: 'white',
  },
  chartsContainer: {
    marginBottom: 20,
  },
  chartCard: {
    marginBottom: 15,
    borderRadius: 16,
  },
  progressItem: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressLabel: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
});

export default AdminRDashboard;