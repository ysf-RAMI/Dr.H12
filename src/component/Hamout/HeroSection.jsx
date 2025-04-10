import React, { useEffect, useState } from "react";
import { View, StyleSheet, Image, Dimensions, Linking, Platform, ScrollView } from "react-native";
import { Text, IconButton, Surface, Card } from "react-native-paper";
import { MaterialCommunityIcons,FontAwesome6} from "@expo/vector-icons";

export default function HeroSection() {
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

  const email = "h.hamout@uiz.ac.ma";
  const researchGate = "https://www.researchgate.net/profile/Hamza-Hamout";

  const openLink = (url) => {
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      }
    });
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <Surface style={styles.surface}>
        {/* Image Section First */}
       
        
        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.name}>Dr. Hamza HAMOUT</Text>
          <Text style={styles.title}>Maître de Conférences Habilité</Text>
          <Text style={styles.institution}>École Supérieure de Technologie . Guelmim</Text>
          
          {/* Description */}
          <Card style={styles.descriptionCard}>
            <Card.Content>
              <Text style={styles.descriptionText}>
                Hamza Hamout a obtenu une licence en mathématiques et sciences informatiques de l'Université Ibn Zohr d'Agadir, Agadir, Maroc, en 2014, un master en réseaux et systèmes intelligents de l'Université Sidi Mohamed Ben Abdellah de Fès, Fès, Maroc, en 2016, et un doctorat en informatique de l'Université Ibn Zohr d'Agadir, Agadir, Maroc, en 2020. Ses intérêts de recherche actuels portent sur le codage d'images et de vidéos ainsi que sur les extensions du codage vidéo à haute efficacité.
              </Text>
            </Card.Content>
          </Card>
          
          {/* Social Media */}
          <View style={styles.socialIcons}>
            <IconButton
              icon={() => <FontAwesome6 name="researchgate" size={24} color="#1A202C" />}
              size={40}
              style={styles.iconButton}
              onPress={() => openLink(researchGate)}
            />
            <IconButton
              icon={() => <MaterialCommunityIcons name="gmail" size={24} color="#1A202C" />}
              size={40}
              color="#1A202C"
              style={styles.iconButton}
              onPress={() => openLink(`mailto:${email}`)}
            />
          </View>
        </View>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#01162e',
    marginTop: 10,
  },
 
  surface: {
    elevation: 4,
    padding: 0,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
  },
  infoSection: {
    padding: 24,
    alignItems: 'center',
    borderTopRightRadius:20,
    borderTopLeftRadius:20,
    backgroundColor: '#fff',
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#01162e',
    marginBottom: 4,
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    color: '#4080be',
    marginBottom: 4,
    textAlign: 'center',
  },
  institution: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  descriptionCard: {
    width: '100%',
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    flex: 1,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
    textAlign: 'center',
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  iconButton: {
    margin: 8,
    backgroundColor: '#f0f8ff',
  },
});
