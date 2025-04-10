import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, StatusBar, RefreshControl } from 'react-native';
import { Card, Title, Chip, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MediaViewer from '../../component/MediaViewer';
import axios from 'axios';

const getIconName = (type, dataType) => {
  if (dataType === 'VIDEO') {
    switch (type) {
      case 'COURS': return 'book-open-page-variant';
      case 'TD': return 'file-document';
      case 'TP': return 'book';
      case 'EXAM': return 'file-certificate';
      default: return 'video';
    }
  }
  if (dataType === 'FICHIER') {
    switch (type) {
      case 'COURS': return 'book-open-page-variant';
      case 'TD': return 'file-document';
      case 'TP': return 'book';
      case 'EXAM': return 'file-certificate';
      default: return 'file';
    }
  }
  return 'file';
};

const BASE_URL = "https://doctorh1-kjmev.ondigitalocean.app";

export default function ResourcesList({ route }) {
  const scrollViewRef = useRef(null);
  const [activeSection, setActiveSection] = useState('COURS');
  const [sectionRefs, setSectionRefs] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const { moduleId, moduleName, filiereName } = route.params;
  const [resources, setResources] = useState([]);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/student/getAllResourcesByModuleId/${moduleId}`);
      setResources(response.data);
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  const groupedResources = {
    COURS: resources.filter(r => r.type === 'COURS'),
    TD: resources.filter(r => r.type === 'TD'),
    TP: resources.filter(r => r.type === 'TP'),
    EXAM: resources.filter(r => r.type === 'EXAM')
  };

  const sectionCounts = {
    COURS: groupedResources.COURS.length,
    TD: groupedResources.TD.length,
    TP: groupedResources.TP.length,
    EXAM: groupedResources.EXAM.length
  };

  const handleSectionPress = (sectionType) => {
    setActiveSection(sectionType);
    const yOffset = sectionRefs[sectionType] || 0;
    scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
  };

  const handleResourcePress = (resource) => {
    setSelectedResource(resource);
  };

  const handleCloseViewer = () => {
    setSelectedResource(null);
  };

  const renderSection = (title, items, type) => {
    if (items.length === 0) return null;
    
    return (
      <View 
        style={styles.section}
        onLayout={(event) => {
          const layout = event.nativeEvent.layout;
          setSectionRefs(prev => ({
            ...prev,
            [type]: layout.y
          }));
        }}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        {items.map((item, index) => (
          <TouchableOpacity key={index} onPress={() => handleResourcePress(item)}>
            <View style={styles.cardWrapper}>
              <Card style={styles.card}>
                <Card.Content>
                  <View style={styles.resourceHeader}>
                    <MaterialCommunityIcons 
                      name={getIconName(item.type, item.dataType)} 
                      size={24} 
                      color="#fff" 
                    />
                    <Title style={styles.resourceTitle}>{item.nom}</Title>
                  </View>
                  <View style={styles.chipContainer}>
                    <Chip style={[styles.chip, styles.typeChip]}>{item.type}</Chip>
                    <Chip style={[styles.chip, styles.dataTypeChip]}>{item.dataType}</Chip>
                  </View>
                </Card.Content>
              </Card>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchResources().finally(() => setRefreshing(false));
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#01162e" barStyle="light-content" />
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Module : {moduleName}</Title>
        <Text style={styles.headerSubtitle}>Filiere : {filiereName}</Text>
      </View>
      
      {selectedResource ? (
        <View style={styles.mediaViewerContainer}>
          <MediaViewer
            uri={selectedResource.lien}
            type={selectedResource.dataType === "VIDEO" ? "VIDEO" : "PDF"} // Treat both PDF and FICHIER as PDF
            onClose={handleCloseViewer}
            style={styles.mediaViewer}
          />
        </View>
      ) : (
        <>
          <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {Object.entries(sectionCounts).map(([type, count]) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => handleSectionPress(type)}
                  style={[
                    styles.tab,
                    activeSection === type && styles.activeTab
                  ]}
                >
                  <Text style={[
                    styles.tabText,
                    activeSection === type && styles.activeTabText
                  ]}>
                    {type} ({count})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView 
            ref={scrollViewRef}
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#4080be"]}
                tintColor="#4080be"
                title="Actualisation..."
                titleColor="#01162e"
              />
            }
          >
            {renderSection('Cours', groupedResources.COURS, 'COURS')}
            {renderSection('TD', groupedResources.TD, 'TD')}
            {renderSection('TP', groupedResources.TP, 'TP')}
            {renderSection('Examens', groupedResources.EXAM, 'EXAM')}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#01162e',
  },
  header: {
    padding: 16,
    paddingTop: 45,
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
  tabsContainer: {
    backgroundColor: '#01162e',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#003366',
  },
  activeTab: {
    backgroundColor: '#4080be',
  },
  tabText: {
    color: '#70ade0',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    backgroundColor: '#f5f5f7',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#01162e',
    marginBottom: 16,
    marginLeft: 8,
  },
  cardWrapper: {
    marginBottom: 12,
    borderRadius: 12,
  },
  card: {
    backgroundColor: '#003366',
    elevation: 4,
    borderRadius: 12,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  resourceTitle: {
    color: '#fff',
    flex: 1,
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  chip: {
    height: 28,
  },
  typeChip: {
    backgroundColor: '#70ade0',
  },
  dataTypeChip: {
    backgroundColor: '#4080be',
  },
  mediaViewerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#01162e',
    padding: 20,
  },
  mediaViewer: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f5f5f7',
  },
});