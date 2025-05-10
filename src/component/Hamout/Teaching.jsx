// Remove animation-related imports
import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Dimensions } from "react-native";
import { Text } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";

export default function Teaching() {
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

  const teachingData = [
    {
      year: "2021-2022",
      title: "Enseignant",
      courses: [
        {
          name: "Réseaux Locaux et Internet",
          details: "Filière DUT-Informatique, Semestre S3"
        },
        {
          name: "Conception Objet Avec UML",
          details: "Filière DUT-Informatique, Semestre S3"
        },
        {
          name: "Architecture des Ordinateurs",
          details: "Filière DUT-Informatique, Semestre S2"
        },
        {
          name: "Programmation Evénementielle",
          details: "Filière DUT-Informatique, Semestre S2"
        }
      ]
    },
    {
      year: "2022-2023",
      title: "Enseignant",
      courses: [
        {
          name: "Codage Numérique et Architecture des Ordinateurs",
          details: "Filière DUT-Génie Informatique, Semestre S1"
        },
        {
          name: "Fondements des Réseaux Informatique",
          details: "Filière DUT-Génie Informatique, Semestre S2"
        },
        {
          name: "Réseaux Locaux et Internet",
          details: "Filière DUT-Informatique, Semestre S3"
        },
        {
          name: "Conception Objet Avec UML",
          details: "Filière DUT-Informatique, Semestre S3"
        },
        {
          name: "Programmation HTML/CSS",
          details: "Filière DUT-Informatique, Semestre S4"
        },
        {
          name: "Programmation Web",
          details: "Filière LP-ISD, Semestre S5"
        },
        {
          name: "Informatique Décisionnelle",
          details: "Filière LP-ISD, Semestre S6"
        }
      ]
    },
    {
      year: "2023-2024",
      title: "Enseignant",
      courses: [
        {
          name: "Codage Numérique et Architecture des Ordinateurs",
          details: "Filière DUT-Génie Informatique, Semestre S1"
        },
        {
          name: "Fondements des Réseaux Informatique",
          details: "Filière DUT-Génie Informatique, Semestre S2"
        },
        {
          name: "Conception Objet Avec UML",
          details: "Filière DUT-Génie Informatique, Semestre S3"
        },
        {
          name: "Administration des Systèmes",
          details: "Filière DUT-Génie Informatique, Semestre S4"
        },
        {
          name: "Programmation Web",
          details: "Filière LP-ISD, Semestre S5"
        },
        {
          name: "Génie Logiciel",
          details: "Filière LP-ISD, Semestre S5"
        },
        {
          name: "Informatique Décisionnelle",
          details: "Filière LP-ISD, Semestre S6"
        }
      ]
    },
    {
      year: "2024-2025",
      title: "Enseignant",
      courses: [
        {
          name: "Circuit logique et Architecture des Ordinateurs",
          details: "Filière DUT-Génie Informatique, Semestre S1"
        },
        {
          name: "Algorithme et Bases de la Programmation",
          details: "Filière DUT-Génie Informatique, Semestre S1"
        },
        {
          name: "Circuit logique et Architecture des Ordinateurs",
          details: "Filière DUT-Réseaux Informatiques et Sécurités, Semestre S1"
        },
        {
          name: "Réseaux Informatiques",
          details: "Filière DUT-Réseaux Informatiques et Sécurités, Semestre S1"
        },
        {
          name: "Conception Objet Avec UML",
          details: "Filière DUT-Génie Informatique, Semestre S3"
        },
        {
          name: "Administration des Systèmes",
          details: "Filière DUT-Génie Informatique, Semestre S4"
        }
      ]
    }
  ];

  const TimelineItem = ({ item, index }) => {
    return (
      <View style={styles.timelineItem}>
        <View style={styles.timelineIconContainer}>
          <MaterialIcons name="school" size={24} color="#01162e" />
        </View>
        
        <View style={styles.timelineConnector} />
        
        <View style={styles.timelineContent}>
          <Text style={styles.timelineYear}>{item.year}</Text>
          <Text style={styles.timelineTitle}>{item.title}</Text>
          
          <View style={styles.coursesList}>
            {item.courses.map((course, courseIndex) => (
              <View key={courseIndex} style={styles.courseItem}>
                <View style={styles.bulletPoint} />
                <View style={styles.courseTextContainer}>
                  <Text style={styles.courseName}>{course.name}</Text>
                  <Text style={styles.courseDetails}>{course.details}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>
            Activités Pédagogiques Universitaires
          </Text>
          
          <Text style={styles.sectionSubtitle}>
            Enseignant (Cours/TD/TP) à l'Ecole Supérieure de Technologie à Guelmim
          </Text>
          
          <View style={styles.timelineContainer}>
            {teachingData.map((item, index) => (
              <TimelineItem key={index} item={item} index={index} />
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
    marginBottom: 10,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  timelineContainer: {
    width: '100%',
    paddingLeft: 20,
    marginTop: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  timelineIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    zIndex: 2,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  timelineConnector: {
    position: 'absolute',
    left: 20,
    top: 40,
    bottom: -30,
    width: 2,
    backgroundColor: '#e0e0e0',
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timelineYear: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#01162e',
    marginBottom: 5,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  coursesList: {
    marginTop: 5,
  },
  courseItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#01162e',
    marginTop: 8,
    marginRight: 10,
  },
  courseTextContainer: {
    flex: 1,
  },
  courseName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 3,
  },
  courseDetails: {
    fontSize: 13,
    color: '#666',
  },
});