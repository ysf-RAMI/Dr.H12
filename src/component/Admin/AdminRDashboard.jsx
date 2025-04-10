import React, { useState, useEffect } from 'react';
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
  Title,
  Paragraph,
  Avatar,
  IconButton,
  Colors,
  DataTable,
  ProgressBar,
  Chip
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
import { useTheme } from 'react-native-paper';
import { PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const AdminRDashboard = () => {
  const theme = useTheme();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const API_URL = 'https://doctorh1-kjmev.ondigitalocean.app/api/admin';

  // Load dashboard data
  const loadData = async () => {
    try {
      setLoading(true);
      const authData = await AsyncStorage.getItem('auth');
      const { token } = JSON.parse(authData);
      
      const response = await axios.get(`${API_URL}/dashboardAdmin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDashboardData(response.data);
    } catch (error) {
      // Fallback data if API fails
      setDashboardData({
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
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Loading state
  // Update loading state to use French
  if (loading && !dashboardData) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#01162e" />
        <Text style={{ marginTop: 10, color: '#01162e' }}>Chargement...</Text>
      </View>
    );
  }

  // Chart data
  // Update chart data labels to French
  const resourceChartData = [
    {
      name: "Cours",
      count: dashboardData.nbrCours,
      color: "#4CAF50",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15
    },
    {
      name: "TD",
      count: dashboardData.nbrTd,
      color: "#2196F3",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15
    },
    {
      name: "TP",
      count: dashboardData.nbrTp,
      color: "#FF9800",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15
    },
    {
      name: "Examens",
      count: dashboardData.nbrExam,
      color: "#F44336",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15
    }
  ];

  const fileTypeChartData = [
    {
      name: "Fichiers",
      count: dashboardData.nbrFichier,
      color: "#9C27B0",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15
    },
    {
      name: "Vidéos",
      count: dashboardData.nbrVideo,
      color: "#009688",
      legendFontColor: "#7F7F7F",
      legendFontSize: 15
    }
  ];

  // Update stats cards data to French
  const statsCards = [
    {
      title: "Professeurs",
      value: dashboardData.nbrProfesseur,
      icon: <MaterialIcons name="people" size={24} color="white" />,
      color: '#003366'
    },
    {
      title: "Filières",
      value: dashboardData.nbrFiliere,
      icon: <MaterialIcons name="category" size={24} color="white" />,
      color: '#01162e'
    },
    {
      title: "Modules",
      value: dashboardData.nbrModule,
      icon: <MaterialIcons name="menu-book" size={24} color="white" />,
      color: '#003366'
    },
    {
      title: "Annonces",
      value: dashboardData.nbrAnnonce,
      icon: <MaterialIcons name="announcement" size={24} color="white" />,
      color: '#01162e'
      
    }
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: '#f8f9fa' }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#01162e']}
        />
      }
    >
      {/* Stats Cards */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.statsContainer}
      >
        {statsCards.map((stat, index) => (
          <Card key={index} style={[styles.statCard, { backgroundColor: stat.color, borderRadius: 16 }]}>
            <Card.Content style={styles.statCardContent}>
              <Avatar.Icon 
                icon={() => stat.icon}
                size={40}
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.65)' }}
              />
              <View style={styles.statTextContainer}>
                <Text style={styles.statTitle}>{stat.title}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      {/* Resources Summary */}
      <Card style={[styles.sectionCard, { borderRadius: 16 }]}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons 
              name="bookshelf" 
              size={24} 
              color="#01162e" 
            />
            <Text style={[styles.sectionTitle, { color: '#01162e' }]}>Aperçu des Ressources</Text>
          </View>
          
          <View style={styles.resourceSummary}>
            <View style={[styles.resourceItem, { borderRadius: 12 }]}>
              <FontAwesome5 name="book" size={20} color="#4CAF50" />
              <Text style={styles.resourceText}>Cours: {dashboardData.nbrCours}</Text>
            </View>
            <View style={[styles.resourceItem, { borderRadius: 12 }]}>
              <Feather name="file-text" size={20} color="#2196F3" />
              <Text style={styles.resourceText}>TD: {dashboardData.nbrTd}</Text>
            </View>
            <View style={[styles.resourceItem, { borderRadius: 12 }]}>
              <Ionicons name="flask" size={20} color="#FF9800" />
              <Text style={styles.resourceText}>TP: {dashboardData.nbrTp}</Text>
            </View>
            <View style={[styles.resourceItem, { borderRadius: 12 }]}>
              <MaterialIcons name="assignment" size={20} color="#F44336" />
              <Text style={styles.resourceText}>Examens: {dashboardData.nbrExam}</Text>
            </View>
          </View>

          <View style={styles.totalResources}>
            <Text style={[styles.totalText, { color: '#01162e' }]}>
              Total des Ressources: {dashboardData.nbrResources}
            </Text>
            <Chip icon="file" style={[styles.fileChip, { borderRadius: 20 }]}>
              Fichiers: {dashboardData.nbrFichier}
            </Chip>
            <Chip icon="video" style={[styles.videoChip, { borderRadius: 20 }]}>
              Vidéos: {dashboardData.nbrVideo}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Charts Section */}
      <View style={styles.chartsContainer}>
        {/* Resource Distribution Chart */}
        <Card style={[styles.chartCard, { borderRadius: 16 }]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons 
                name="chart-pie" 
                size={24} 
                color="#01162e" 
              />
              <Text style={[styles.sectionTitle, { color: '#01162e' }]}>Distribution des Ressources</Text>
            </View>
            
            <PieChart
              data={resourceChartData}
              width={Dimensions.get('window').width - 40}
              height={200}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </Card.Content>
        </Card>

        {/* File Type Chart */}
        <Card style={[styles.chartCard, { borderRadius: 16 }]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons 
                name="file-chart" 
                size={24} 
                color="#01162e" 
              />
              <Text style={[styles.sectionTitle, { color: '#01162e' }]}>Types de Fichiers</Text>
            </View>
            
            <PieChart
              data={fileTypeChartData}
              width={Dimensions.get('window').width - 40}
              height={200}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </Card.Content>
        </Card>
      </View>

      {/* Detailed Stats */}
      <Card style={[styles.sectionCard, { borderRadius: 16 }]}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons 
              name="chart-bar" 
              size={24} 
              color="#01162e" 
            />
            <Text style={[styles.sectionTitle, { color: '#01162e' }]}>Statistiques Détaillées</Text>
          </View>
          
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Catégorie</DataTable.Title>
              <DataTable.Title numeric>Nombre</DataTable.Title>
            </DataTable.Header>

            <DataTable.Row>
              <DataTable.Cell>Professeurs</DataTable.Cell>
              <DataTable.Cell numeric>{dashboardData.nbrProfesseur}</DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>Filières</DataTable.Cell>
              <DataTable.Cell numeric>{dashboardData.nbrFiliere}</DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>Modules</DataTable.Cell>
              <DataTable.Cell numeric>{dashboardData.nbrModule}</DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>Ressources</DataTable.Cell>
              <DataTable.Cell numeric>{dashboardData.nbrResources}</DataTable.Cell>
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
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    elevation: 2,
  },
  statCard: {
    width: 200,
    marginRight: 15,
    borderRadius: 16,
    elevation: 3,
  },
  statCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  statTextContainer: {
    marginLeft: 15,
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
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  resourceSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  resourceItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  resourceText: {
    marginLeft: 10,
    fontSize: 14,
  },
  totalResources: {
    marginTop: 15,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  fileChip: {
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: '#9C27B0',
    borderRadius: 20,
  },
  videoChip: {
    backgroundColor: '#009688',
    borderRadius: 20,
  },
  chartsContainer: {
    marginBottom: 20,
  },
  chartCard: {
    marginBottom: 15,
    borderRadius: 16,
    elevation: 2,
  },
});

export default AdminRDashboard;
