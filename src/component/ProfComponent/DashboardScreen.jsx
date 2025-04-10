import React, { useEffect, useState } from 'react';
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
  Title,
  Paragraph,
  Avatar,
  DataTable,
  ProgressBar,
  Chip,
  useTheme,
  Text,
} from 'react-native-paper';
import { PieChart } from 'react-native-chart-kit';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MaterialCommunityIcons,
  MaterialIcons,
  FontAwesome5,
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

  // Load dashboard data
  const loadData = async () => {
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

      setDashboardData(response.data);
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError('Failed to load dashboard data');
      setDashboardData(FALLBACK_DATA);
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
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  // Memoized chart data
  const resourcesPieData = [
    {
      name: 'Cours',
      count: dashboardData?.nbrCours || 0,
      color: '#4CAF50',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'TD',
      count: dashboardData?.nbrTd || 0,
      color: '#2196F3',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'TP',
      count: dashboardData?.nbrTp || 0,
      color: '#FF9800',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'Examens',
      count: dashboardData?.nbrExam || 0,
      color: '#F44336',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
  ].filter(item => item.count > 0);

  const filesPieData = [
    {
      name: 'Fichiers',
      count: dashboardData?.nbrFichier || 0,
      color: '#9C27B0',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'Vidéos',
      count: dashboardData?.nbrVideo || 0,
      color: '#009688',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
  ].filter(item => item.count > 0);

  // Stats cards data
  const statsCards = [
    {
      title: 'Modules',
      value: dashboardData?.nbrModule || 0,
      icon: 'book',
      color: '#003366',
    },
    {
      title: 'Ressources',
      value: dashboardData?.nbrResources || 0,
      icon: 'file-document',
      color: '#01162e',
    },
    {
      title: 'Cours',
      value: dashboardData?.nbrCours || 0,
      icon: 'school',
      color: '#003366',
    },
    {
      title: 'Annonces',
      value: dashboardData?.nbrAnnonce || 0,
      icon: 'bullhorn',
      color: '#01162e',
    },
  ];

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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statsContainer}
      >
        {statsCards.map((stat, index) => (
          <Card key={index} style={[styles.statCard, { backgroundColor: stat.color }]}>
            <Card.Content style={styles.statCardContent}>
              <Avatar.Icon
                icon={stat.icon}
                size={40}
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              />
              <View style={styles.statTextContainer}>
                <Text style={styles.statTitle}>{stat.title}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

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
                Total: {dashboardData?.nbrResources || 0}
              </Text>
              <View style={styles.chipContainer}>
                <Chip
                  icon="file"
                  style={[styles.chip, { backgroundColor: '#01162e' }]}
                  textStyle={styles.chipText}
                >
                  Fichiers: {dashboardData?.nbrFichier || 0}
                </Chip>
                <Chip
                  icon="video"
                  style={[styles.chip, { backgroundColor: '#4080be' }]}
                  textStyle={styles.chipText}
                >
                  Vidéos: {dashboardData?.nbrVideo || 0}
                </Chip>
              </View>
            </View>

            <View style={styles.resourceGrid}>
              <View style={styles.resourceItem}>
                <MaterialCommunityIcons name="book" size={24} color="#4CAF50" />
                <Text style={styles.resourceText}>Cours: {dashboardData?.nbrCours || 0}</Text>
              </View>
              <View style={styles.resourceItem}>
                <Feather name="file-text" size={24} color="#2196F3" />
                <Text style={styles.resourceText}>TD: {dashboardData?.nbrTd || 0}</Text>
              </View>
              <View style={styles.resourceItem}>
                <Ionicons name="flask" size={24} color="#FF9800" />
                <Text style={styles.resourceText}>TP: {dashboardData?.nbrTp || 0}</Text>
              </View>
              <View style={styles.resourceItem}>
                <MaterialIcons name="assignment" size={24} color="#F44336" />
                <Text style={styles.resourceText}>Examens: {dashboardData?.nbrExam || 0}</Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Charts Section */}
      <View style={styles.chartsContainer}>
        {/* Resource Distribution Chart */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="chart-pie"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={styles.sectionTitle}>Contenu Éducatif</Text>
            </View>

            {resourcesPieData.length > 0 ? (
              <PieChart
                data={resourcesPieData}
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
            ) : (
              <View style={styles.noDataContainer}>
                <MaterialCommunityIcons
                  name="chart-line"
                  size={40}
                  color={theme.colors.textSecondary}
                />
                <Text style={styles.noDataText}>
                  Aucune donnée de contenu éducatif disponible
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* File Type Chart */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="file-chart"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={styles.sectionTitle}>Types de Fichiers</Text>
            </View>

            {filesPieData.length > 0 ? (
              <PieChart
                data={filesPieData}
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
            ) : (
              <View style={styles.noDataContainer}>
                <MaterialCommunityIcons
                  name="chart-bar"
                  size={40}
                  color={theme.colors.textSecondary}
                />
                <Text style={styles.noDataText}>
                  Aucune donnée de type de fichier disponible
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
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
              <DataTable.Cell numeric>{dashboardData?.nbrModule || 0}</DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>Cours</DataTable.Cell>
              <DataTable.Cell numeric>{dashboardData?.nbrCours || 0}</DataTable.Cell>
             
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>TD</DataTable.Cell>
              <DataTable.Cell numeric>{dashboardData?.nbrTd || 0}</DataTable.Cell>
             
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>TP</DataTable.Cell>
              <DataTable.Cell numeric>{dashboardData?.nbrTp || 0}</DataTable.Cell>
              
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noDataText: {
    marginTop: 10,
    color: '#666',
    textAlign: 'center',
  },
});

export default DashboardScreen;

