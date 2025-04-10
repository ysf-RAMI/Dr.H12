import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, StatusBar, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, ActivityIndicator, Chip, Searchbar, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';

const BASE_URL = "https://doctorh1-kjmev.ondigitalocean.app";

export default function ModulesList({ route, navigation }) {
  const { filiereId, filiereName } = route.params;
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState(null);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/student/getAllModuleByFiliereId/${filiereId}`);
      setModules(response.data);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching modules:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchModules();
  };

  const semesters = [...new Set(modules.map(module => module.semestre))];

  const filteredModules = modules.filter(module => {
    const matchesSearch = module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSemester = !selectedSemester || module.semestre === selectedSemester;
    return matchesSearch && matchesSemester;
  });

  const handleModulePress = (module) => {
    navigation.navigate('ResourcesList', {
      moduleId: module.id, // Pass only the moduleId
      moduleName: module.name,
      filiereName: filiereName
    });
  };

  const renderModule = ({ item }) => (
    <TouchableOpacity onPress={() => handleModulePress(item)}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.titleContainer}>
            <MaterialCommunityIcons name="book-open-variant" size={24} color="#fff" />
            <Title style={styles.moduleTitle}>{item.name}</Title>
          </View>
          <Chip 
            icon="calendar-month"
            style={styles.semesterChip}
          >
            {item.semestre}
          </Chip>
          <View style={styles.descriptionContainer}>
            <MaterialCommunityIcons name="information" size={20} color="#a0c3e8" />
            <Paragraph style={styles.description}>{item.description}</Paragraph>
          </View>
          <View style={styles.resourcesHint}>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#a0c3e8" />
            <Text style={styles.hintText}>Appuyez pour voir les ressources</Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        Aucun module disponible pour cette filière
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar backgroundColor="#01162e" barStyle="light-content" />
        <ActivityIndicator size="large" color="#4080be" />
        <Text style={styles.loadingText}>Chargement des modules...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#01162e" barStyle="light-content" />
      <View style={styles.filterContainer}>
        <Title style={styles.headerTitle}>Filière :  {filiereName}</Title>
        <Text style={styles.headerStats}>
          {filteredModules.length} module(s) trouvé(s)
        </Text>
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Rechercher un module..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
        </View>
      </View>
      
      <FlatList
        style={styles.listWrapper}
        contentContainerStyle={[
          styles.listContainer,
          filteredModules.length === 0 && styles.emptyList
        ]}
        data={filteredModules}
        renderItem={renderModule}
        ListEmptyComponent={renderEmptyList}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4080be"]}
            tintColor="#4080be"
            title="Actualisation..."
            titleColor="#333"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#01162e',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#70ade0',
    marginTop: 16,
    fontSize: 16,
  },
  listWrapper: {
    backgroundColor: '#f5f5f7',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 8,
  },
  listContainer: {
    padding: 16,
  },
  filterContainer: {
    padding: 16,
    paddingTop: 45,
    backgroundColor: '#01162e',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerStats: {
    color: '#70ade0',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchbar: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#4080be',
    elevation: 0,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: '#365e8e',
    borderColor: '#365e8e',
    borderWidth: 1,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#fff',
  },
  semesterChip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    backgroundColor: '#4080be',
  },
  description: {
    color: '#70ade0',
    fontSize: 14,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    backgroundColor: '#365e8e',
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
  },
  resourcesHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  hintText: {
    color: '#a0c3e8',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f7',
  }
});