import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from "react-native";
import { Text, Surface } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";

export default function Communications() {
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  // Remove animation-related states
  const [loaded, setLoaded] = useState(true);

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

  const publications = [
    {
      year: "2016",
      title: "IEEE/ACS 13th International Conference",
      description:
        'A. Elyousfi, H. Hamout and A. E. Hachimi, "An efficient intra block size decision for H.264/AVC encoding optimization," Agadir, 2016, pp. 1-5.',
      iconName: "article",
      people: "H. Hamout and A. Elyousfi, A. E. Hachimi,",
    },
    {
      year: "2017",
      title: "Intelligent Systems and Computer Vision (ISCV)",
      description:
        'A. Elyousfi, A. E. Hachimi and H. Hamout, "Texture complexity based fast and efficient intra block mode decision algorithm for H.264/AVC," Fez, 2017, pp. 1-4.',
      iconName: "code",
      people: "H. Hamout and A. Elyousfi, A. E. Hachimi",
    },
    {
      year: "2017",
      title: "European Signal Processing Conference (EUSIPCO)",
      description:
        'H. Hamout and A. Elyousfi, "Low complexity intra mode decision algorithm for 3D-HEVC," Kos, 2017, pp. 1475-1479.',
      iconName: "computer",
      people: "H. Hamout and A. Elyousfi,",
    },
    {
      year: "2018",
      title:
        "IEEE International Conference on Acoustics, Speech and Signal Processing (ICASSP)",
      description:
        '"Fast Texture Intra Size Coding Based On Big Data Clustering for 3D-Hevc," Calgary, AB, 2018, pp. 1728-1732.',
      iconName: "article",
      people: "H. Hamout and A. Elyousfi,",
    },
    {
      year: "2018",
      title: "IEEE International Conference on Image Processing (ICIP)",
      description:
        'H. Hamout and A. Elyousfi, "Fast Depth Map Intra Coding Based Structure Tensor Data Analysis," Athens, 2018, pp. 1802-1806.',
      iconName: "code",
      people: "H. Hamout and A. Elyousfi,",
    },
    {
      year: "2020",
      title:
        "IEEE International Conference on Intelligent Systems and Computer Sciences",
      description:
        'A. Hammani, H. Hamout and A. Elyousfi, "Fast Depth Map Intra Mode Prediction Based on Self-Organizing Map," Fez, 2020, pp. 1-5.',
      iconName: "computer",
      people: "H. Hamout and A. Elyousfi, A. Hammani,",
    },
    {
      year: "2023",
      title:
        "International Conference on Artificial Intelligence and Green Computing (ICAIGC)",
      description:
        'H. Hamout and A. Elyousfi, "Low 3D-HEVC Depth Map Intra Modes Selection Complexity Based on Clustering Algorithm and an Efficient Edge Detection," Beni Mellal, 2023, pp. 1-14.',
      iconName: "article",
      people: "H. Hamout and A. Elyousfi,",
    },
  ];

  const PublicationCard = ({ publication, index }) => {
    const [pressed, setPressed] = useState(false);
    
    const handlePress = () => {
      setPressed(!pressed);
    };
    
    const getIconName = (name) => {
      switch(name) {
        case "article": return "article";
        case "code": return "code";
        case "computer": return "computer";
        default: return "article";
      }
    };
    
    return (
      <TouchableOpacity 
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View 
          style={[
            styles.publicationCard,
            pressed && styles.cardPressed
          ]}
        >
          <View style={styles.cardIconContainer}>
            <MaterialIcons name={getIconName(publication.iconName)} size={28} color="#01162e" />
          </View>
          
          <Text style={styles.cardYear}>{publication.year}</Text>
          
          <Text style={styles.cardTitle} numberOfLines={3} ellipsizeMode="tail">
            {publication.title}
          </Text>
          
          <Text style={styles.cardDescription} numberOfLines={4} ellipsizeMode="tail">
            {publication.description}
          </Text>
          
          <View style={styles.peopleContainer}>
            <MaterialIcons name="group" size={18} color="#666" style={styles.peopleIcon} />
            <Text style={styles.peopleText}>{publication.people}</Text>
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
            Communications Nationales & Internationales
          </Text>
          
          <View style={styles.publicationsContainer}>
            {publications.map((publication, index) => (
              <PublicationCard 
                key={index} 
                publication={publication} 
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
  publicationsContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },
  publicationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  cardPressed: {
    backgroundColor: '#f8f9fa',
    elevation: 5,
  },
  cardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardYear: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#01162e',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 20,
  },
  peopleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  peopleIcon: {
    marginRight: 6,
  },
  peopleText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});