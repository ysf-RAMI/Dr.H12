import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from "react-native";
import { Text, Surface, IconButton } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";

export default function PublicationsJournaux() {
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const scrollViewRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation for fade-in effect
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
    
    setLoaded(true);
    
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
      title:
        "An efficient edge detection algorithm for fast intra-coding for 3D video extension of HEVC",
      journal: "Journal of Real-Time Image Processing",
      date: "Sept. 13, 2017",
      doi: "10.1007/s11554-017-0718-z",
      authors: "H. Hamout, A. Elyousfi",
    },
    {
      title:
        "Fast Depth Map Intra Coding for 3D Video Compression Based Tensor Feature Extraction and Data Analysis",
      journal: "IEEE Transactions on Circuits and Systems for Video Technology",
      date: "May 24, 2019",
      doi: "10.1109/TCSVT.2019.2918770",
      authors: "H. Hamout, A. Elyousfi",
    },
    {
      title:
        "Fast 3D-HEVC PU size decision algorithm for depth map intra-video coding",
      journal: "Journal of Real-Time Image Processing",
      date: "June 14, 2019",
      doi: "10.1007/s11554-019-00890-x",
      authors: "H. Hamout, A. Elyousfi",
    },
    {
      title: "Fast CU size and mode decision algorithm for 3D-HEVC intercoding",
      journal: "Multimedia Tools and Application",
      date: "Dec. 18, 2019",
      doi: "10.1007/s11042-019-08461-9",
      authors: "S. Bakkouri, A. Elyousfi, H. Hamout",
    },
    {
      title: "Fast depth map intra-mode selection for 3D-HEVC intra-coding",
      journal: "Signal, Image and Video Processing",
      date: "March 17, 2020",
      doi: "10.1007/s11760-020-01669-5",
      authors: "H. Hamout, A. Elyousfi",
    },
    {
      title:
        "A Computation Complexity Reduction of Size Decision Algorithm in 3D-HEVC Depth Map Intracoding",
      journal: "Advances in Multimedia",
      date: "June 29, 2022",
      doi: "10.1155/2022/3507201",
      authors: "H. Hamout, A. Elyousfi",
    },
    {
      title:
        "Fast 3D-HEVC intra-prediction for depth map based on a self-organizing map and efficient features",
      journal: "Signal, Image and Video Processing",
      date: "December 16, 2023",
      doi: "10.1007/s11760-023-02904-5",
      authors: "H. Hamout, A. Elyousfi",
    },
  ];

  const PublicationCard = ({ publication, index }) => {
    const [pressed, setPressed] = useState(false);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    
    const handlePress = () => {
      setPressed(true);
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start(() => setPressed(false));
    };
    
    return (
      <TouchableOpacity 
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <Animated.View 
          style={[
            styles.publicationCard,
            {
              transform: [
                { scale: scaleAnim },
                { translateY: loaded ? 0 : 50 }
              ],
              opacity: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
            },
            pressed && styles.cardPressed
          ]}
        >
          <View style={styles.publicationIcon}>
            <MaterialIcons name="article" size={24} color="#01162e" />
          </View>
          <View style={styles.publicationContent}>
            <Text style={styles.publicationTitle} numberOfLines={3} ellipsizeMode="tail">
              {publication.title}
            </Text>
            <Text style={styles.publicationDetails}>
              <Text style={styles.detailLabel}>Journal: </Text>
              <Text>{publication.journal}</Text>
            </Text>
            <Text style={styles.publicationDetails}>
              <Text style={styles.detailLabel}>Date: </Text>
              <Text>{publication.date}</Text>
            </Text>
            <Text style={styles.publicationDetails}>
              <Text style={styles.detailLabel}>DOI: </Text>
              <Text>{publication.doi}</Text>
            </Text>
            <Text style={styles.publicationAuthors}>
              {publication.authors}
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.contentContainer}>
          <Animated.Text 
            style={[
              styles.sectionTitle,
              {
                opacity: fadeAnim,
                transform: [{
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  })
                }]
              }
            ]}
          >
            Publications Journaux
          </Animated.Text>
          
          <Animated.Text 
            style={[
              styles.sectionSubtitle,
              {
                opacity: fadeAnim,
                transform: [{
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-15, 0],
                  })
                }]
              }
            ]}
          >
            Journal articles in the field of computer vision and signal processing.
          </Animated.Text>
          
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
    marginTop: 10,
  },
  innerContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  contentContainer: {
    padding: 16,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  publicationsContainer: {
    width: '100%',
  },
  publicationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 8,
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
  publicationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  publicationContent: {
    flex: 1,
  },
  publicationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#01162e',
    marginBottom: 8,
  },
  publicationDetails: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  detailLabel: {
    fontWeight: 'bold',
  },
  publicationAuthors: {
    fontSize: 14,
    color: '#555',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
