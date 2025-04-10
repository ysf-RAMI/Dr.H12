import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Dimensions } from "react-native";
import { Text, Card, Avatar } from "react-native-paper";

const Educational = () => {
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const isMobile = screenWidth <= 768;

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

  const timelineData = [
    {
      year: "2025-Présent",
      title: "Maître de Conférences Habilité",
      institution: "École Supérieure de Technologie Guelmim",
      icon: "school",
      isLeft: true
    },
    {
      year: "2021-2025",
      title: "Professeur d'Enseignement Supérieur Assistant",
      institution: "École Supérieure de Technologie Guelmim",
      icon: "account",
      isLeft: false
    },
    {
      year: "2024",
      title: "Habilité Universitaire à Diriger des Recherches",
      institution: "Laboratoire des Systèmes Informatiques & Vision (LabSIV), Université Ibno Zohr",
      specialty: "Informatique",
      research: "Algorithme de Réduction de la Complexité des Tailles Intra et des Modes Intra Appliqué au Codage en Intra des Cartes de Profondeur en 3D-HEVC",
      icon: "file-document-edit",
      isLeft: true
    },
    {
      year: "2016-2020",
      title: "Doctorat en Mathématiques, Informatique et Applications",
      institution: "Laboratoire des Systèmes Informatiques & Vision (LabSIV), Université Ibno Zohr",
      specialty: "Informatique",
      research: "La réduction de la complexité des algorithmes de la compression des cartes de profondeurs de la vidéo 3D dans la norme de codage de la vidéo 3D-HEVC",
      mention: "Très Honorable avec Félicitation du Jury",
      icon: "certificate",
      isLeft: false
    },
    {
      year: "2014-2016",
      title: "Master Technique: Systèmes Intelligents et Réseaux (SIR)",
      institution: "Faculté des Sciences et Techniques de Fès, Université Sidi Mohamed Ben Abdellah",
      specialty: "Informatique",
      research: "Amélioration des algorithmes de codage de la vidéo 3D",
      mention: "Bien",
      icon: "school-outline",
      isLeft: true
    },
    {
      year: "2011-2014",
      title: "Licence Fondamentale en Sciences Mathématique et Informatique (SMI)",
      institution: "Faculté des Sciences d'Agadir, Université Ibn Zohr",
      specialty: "Génie Logiciel",
      research: "Réalisation d'un outil E-Learning : Application pour la résolution des équations linéaires",
      mention: "Bien (Majorant)",
      icon: "book-education",
      isLeft: false
    }
  ];

  const renderTimelineItem = (item, index) => {
    return (
      <View key={index} style={styles.timelineItem}>
        <View style={styles.timelineConnector}>
          <View style={styles.timelineDot}>
            <Avatar.Icon 
              size={40} 
              icon={item.icon} 
              style={styles.avatar} 
              color="#fff"
              backgroundColor="#01162e"
            />
          </View>
        </View>
        
        <Card style={[
          styles.timelineCard, 
          isMobile ? styles.timelineCardMobile : (index % 2 === 0 ? styles.timelineCardLeft : styles.timelineCardRight)
        ]}>
          <Card.Content>
            <Text style={styles.year}>{item.year}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.institution}>{item.institution}</Text>
            {item.specialty && <Text style={styles.detail}>Spécialité: {item.specialty}</Text>}
            {item.research && <Text style={styles.detail}>Sujet de recherche: {item.research}</Text>}
            {item.mention && <Text style={styles.detail}>Mention: {item.mention}</Text>}
          </Card.Content>
        </Card>
      </View>
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Parcours Universitaire</Text>
      </View>
      
      <View style={styles.timeline}>
        {timelineData.map((item, index) => renderTimelineItem(item, index))}
      </View>
     
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 10,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#01162e',
    marginBottom: 8,
  },
  timeline: {
    position: 'relative',
  },
  timelineItem: {
    marginBottom: 30,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineConnector: {
    width: 40,
    alignItems: 'center',
  },
  timelineDot: {
    zIndex: 2,
  },
  avatar: {
    backgroundColor: '#01162e',
  },
  timelineCard: {
    flex: 1,
    marginLeft: 16,
    borderRadius: 8,
    elevation: 2,
  },
  timelineCardMobile: {
    marginLeft: 16,
  },
  timelineCardLeft: {
    marginLeft: 16,
  },
  timelineCardRight: {
    marginLeft: 16,
  },
  year: {
    fontSize: 14,
    color: '#70ade0',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#01162e',
    marginBottom: 8,
  },
  institution: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  detail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
});

export default Educational;