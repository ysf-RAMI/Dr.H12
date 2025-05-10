// Remove animation-related imports
import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from "react-native";
import { Text, Chip } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";

export default function Responsabilies() {
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  useEffect(() => {
    const handleDimensionChange = ({ window }) => {
      setScreenWidth(window.width);
    };

    Dimensions.addEventListener('change', handleDimensionChange);
    return () => {
      if (Dimensions.removeEventListener) {
        Dimensions.removeEventListener('change', handleDimensionChange);
      }
    };
  }, []);

  const responsibilities = [
    {
      id: 1,
      title: "Coordinateur de Filière Génie Informatique",
      description: [
        "Département Génie Informatique à l'Ecole Supérieure de Technologie à Guelmim",
      ],
      period: "06/2024-présent",
      category: "Coordination",
      color: "#333",
      iconName: "settings",
    },
    {
      id: 2,
      title: "Membre au Conseil d'Etablissement",
      description: [
        "Participation active aux décisions stratégiques",
        "Développement de l'établissement",
      ],
      period: "2024-présent",
      category: "Administration",
      color: "#333",
      iconName: "groups",
    },
    {
      id: 3,
      title: "Coordinateur de Modules DUT-Génie Informatique",
      description: [
        "Architecture des Ordinateurs",
        "Réseaux Informatiques",
        "Culture Digitale",
        "Analyse et Conception Orientées Objet avec UML",
      ],
      period: "2022-présent",
      category: "Module",
      color: "#333",
      iconName: "settings",
    },
    {
      id: 4,
      title: "Coordinateur DUT-Ingénierie de données",
      description: [
        "Data Mining",
        "Initiation en Machine Learning avec Python",
      ],
      period: "2024-présent",
      category: "Module",
      color: "#333",
      iconName: "settings",
    },
    {
      id: 5,
      title: "Coordinateur Licence-Sciences de données",
      description: ["Exploration de données", "Apprentissage Automatique"],
      period: "2024-présent",
      category: "Module",
      color: "#333",
      iconName: "settings",
    },
    {
      id: 6,
      title: "Coordinateur Licence-Sécurité Informatique",
      description: ["Administration des Systèmes"],
      period: "2024-présent",
      category: "Module",
      color: "#333",
      iconName: "settings",
    },
  ];

  const ResponsibilityCard = ({ item, index }) => {
    const [pressed, setPressed] = useState(false);
    
    const handlePress = () => {
      setPressed(!pressed);
    };
    
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        style={styles.cardContainer}
      >
        <View 
          style={[
            styles.card,
            pressed && styles.cardPressed
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={2} ellipsizeMode="tail">
              {item.title}
            </Text>
            <View style={styles.iconContainer}>
              <MaterialIcons name={item.iconName} size={22} color="#333" />
            </View>
          </View>
          
          <View style={styles.descriptionList}>
            {item.description.map((desc, descIndex) => (
              <View key={descIndex} style={styles.descriptionItem}>
                <View style={styles.bulletPoint} />
                <Text style={styles.descriptionText}>{desc}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.cardFooter}>
            <View style={styles.chipContainer}>
              <Text style={styles.chipText}>{item.category}</Text>
            </View>
            <Text style={styles.periodText}>{item.period}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>
            Responsabilités Pédagogiques & Tâches Administratives
          </Text>
          
          <View style={styles.cardsGrid}>
            {responsibilities.map((responsibility, index) => (
              <ResponsibilityCard 
                key={responsibility.id} 
                item={responsibility} 
                index={index} 
              />
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 10,
    paddingBottom: 20,
  },
  contentContainer: {
    padding: 16,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  cardsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardContainer: {
    width: '100%',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardPressed: {
    backgroundColor: '#f8f9fa',
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(51, 51, 51, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  descriptionList: {
    marginBottom: 12,
  },
  descriptionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bulletPoint: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#333',
    marginTop: 7,
    marginRight: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  chipContainer: {
    backgroundColor: 'rgba(51, 51, 51, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipText: {
    fontSize: 12,
    color: '#333',
  },
  periodText: {
    fontSize: 12,
    color: '#666',
  },
});