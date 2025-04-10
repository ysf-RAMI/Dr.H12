import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Platform,
  StatusBar,
  RefreshControl
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Avatar, Title } from 'react-native-paper';
import defaultImage from '../../assets/annonceDefaultImage.jpg';
import axios from 'axios';

const { width } = Dimensions.get('window');
const BASE_URL = "https://doctorh1-kjmev.ondigitalocean.app";

const Announcements = ({ navigation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnnonces();
  }, []);

  const fetchAnnonces = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/student/getAllAnnoces`);
      setAnnouncements(res.data);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnnonces();
  };

  const formatDate = (dateString) => {
    return dateString.split(' ')[0]; // Just get the date part
  };

  const filterAnnouncements = () => {
    if (!searchTerm) return announcements;
    return announcements.filter((announcement) => {
      const matchesSearch =
        announcement.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  };

  const renderAnnouncementItem = ({ item }) => (
    <View
      style={styles.card}
    >
      <Image
        source={
          item.imageUrl 
            ? { uri: `${BASE_URL}${item.imageUrl}` } 
            : defaultImage
        }
        style={styles.cardImage}
        defaultSource={defaultImage}
        onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
      />
      
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.titre}</Text>
        
        <Text 
          style={styles.cardDescription}
          numberOfLines={3}
          ellipsizeMode="tail"
        >
          {item.description}
        </Text>
        
        <View style={styles.professorContainer}>
          <Avatar.Icon 
            icon="account-circle" 
            size={40} 
            style={styles.avatar} 
          />
          <View style={styles.professorInfo}>
            <Text style={styles.professorName}>
              {item.nomProfesseur} {item.prenomProfesseur}
            </Text>
            <Text style={styles.professorRole}>Professeur</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#01162e" barStyle="light-content" />
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <Title style={styles.headerTitle}>Annonces</Title>
          <Text style={styles.headerSubtitle}>
            Restez informé des dernières actualités
          </Text>
          
          {/* Search Bar - now properly inside header */}
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher des annonces..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Content */}
        <View style={{flex: 1, backgroundColor: '#f5f5f7', borderTopLeftRadius: 20, borderTopRightRadius: 20}}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : (
            <FlatList
              data={filterAnnouncements()}
              renderItem={renderAnnouncementItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.content}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Aucune annonce trouvée</Text>
                </View>
              }
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={["#4080be"]}
                  tintColor="#4080be"
                />
              }
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#01162e',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  container: {
    flex: 1,
    backgroundColor: '#01162e',
    
  },
  header: {
    padding: 16,
    backgroundColor: '#01162e',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#70ade0',
    fontSize: 16,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 16,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333',
  },
  content: {
    padding: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#eee', // Fallback color
  },
  cardContent: {
    padding: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  cardDescription: {
    fontSize: 15,
    color: '#666',
    marginBottom: 16,
    lineHeight: 22,
  },
  professorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  avatar: {
    backgroundColor: '#007AFF',
    marginRight: 12,
  },
  professorInfo: {
    flex: 1,
  },
  professorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  professorRole: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default Announcements;