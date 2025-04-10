import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, StatusBar } from 'react-native';
import { Card, Title, Paragraph, Chip, Searchbar, Text } from 'react-native-paper';
import axios from 'axios';

const BASE_URL = "https://doctorh1-kjmev.ondigitalocean.app";

export default function FilieresList({ navigation }) {
  const [filieres, setFilieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    fetchFilieres();
  }, []);

  const fetchFilieres = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/student/getAllFiliere`);
      setFilieres(response.data);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching filieres:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFilieres();
  };


  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#4080be" />
        <Text style={styles.loadingText}>Chargement des filières...</Text>
      </View>
    );
  }

  const handleFilierePress = (filiere) => {
    // In the handleFilierePress function
    navigation.navigate('ModulesList', {
      filiereId: filiere.id,
      filiereName: filiere.nom
    });
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const filteredAndSortedFilieres = filieres
    .filter(filiere => filiere.nom.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const comparison = a.nom.localeCompare(b.nom);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const renderFiliere = ({ item }) => (
    <TouchableOpacity onPress={() => handleFilierePress(item)}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.filiereTitle}>{item.nom}</Title>
          <Paragraph style={styles.description}>
            Appuyez pour voir les modules disponibles
          </Paragraph>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#01162e" barStyle="light-content" />
      <View style={styles.filterContainer}>
        <Title style={styles.headerTitle}>Filières Disponibles</Title>
        <Text style={styles.headerStats}>
          {filteredAndSortedFilieres.length} filière(s) trouvée(s)
        </Text>
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Rechercher une filière..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
          <Chip 
            onPress={toggleSortOrder}
            style={styles.filterChip}
            textStyle={{ color: 'white' }}
            icon={sortOrder === 'asc' ? 'sort-alphabetical-ascending' : 'sort-alphabetical-descending'}
          >
            {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
          </Chip>
        </View>
      </View>
      
      <FlatList
        data={filteredAndSortedFilieres}
        renderItem={renderFiliere}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={["#4080be"]}
            tintColor="#4080be"
            title="Actualisation..."
            titleColor="#70ade0"
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
  filterContainer: {
    padding: 16,
    paddingTop: 45,
    backgroundColor: '#01162e',
  },
  listWrapper: {
    flex: 1,
    backgroundColor: '#f5f5f7',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 8,
    overflow: 'hidden',
  },
  listContainer: {
    padding: 16,
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
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4080be',
    elevation: 0,
    color: '#fff',
    backgroundColor: 'white',
  },
  filterChip: {
    backgroundColor: '#4080be',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: '#365e8e',
    borderColor: '#365e8e',
    borderWidth: 1,
  },
  listContainer: {
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 8,
  },
  filiereTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#fff',
  },
  description: {
    color: '#70ade0',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#01162e',
  },
  loadingText: {
    color: '#70ade0',
    marginTop: 16,
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#01162e', // Changed from '#f5f5f7' to match header
  },
  listContainer: {
    padding: 16,
    backgroundColor: '#f5f5f7', // Content area remains light
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 8,
  },
  filterContainer: {
    padding: 16,
    paddingTop: 45,
    backgroundColor: '#01162e',
  }
});