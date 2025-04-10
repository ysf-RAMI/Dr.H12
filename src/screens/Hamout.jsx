import React, { useState, useRef } from 'react';
import { StyleSheet, ScrollView, View, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import HeroSection from '../component/Hamout/HeroSection';
import Competnces from '../component/Hamout/Competnces';
import PublicationsJournaux from '../component/Hamout/PublicationsJournaux';
import Educational from '../component/Hamout/Educational';
import Communications from '../component/Hamout/Communications';
import Teaching from '../component/Hamout/Teaching';
import Responsabilies from '../component/Hamout/Responsabilies';
import hamoutimage from "../../assets/team/hamoutimage.jpg";
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Hamout() {
  const [activeSection, setActiveSection] = useState(0);
  const scrollViewRef = useRef(null);
  const screenWidth = Dimensions.get('window').width;
  
  const sections = [
    { name: 'Profil', component: HeroSection },
    { name: 'Éducation', component: Educational },
    { name: 'Compétences', component: Competnces },
    { name: 'Publications', component: PublicationsJournaux },
    { name: 'Communications', component: Communications },
    { name: 'Enseignement', component: Teaching },
    { name: 'Responsabilités', component: Responsabilies },
  ];
  
  const handleSectionChange = (index) => {
    setActiveSection(index);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageSection}>
        <Image
          source={hamoutimage}
          style={styles.profileImage}
          resizeMode="cover"
        />
      </View>
      
      {/* Horizontal Menu */}
      <View style={styles.menuContainer}>
        <MaterialCommunityIcons
          name="chevron-left"
          size={24}
          color="#e0e0e0"
          style={{ marginRight: 10 }}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.menuContentContainer}
        >
          {sections.map((section, index) => (
            <TouchableOpacity
            key={index}
            style={[
              styles.menuItem,
              activeSection === index && styles.activeMenuItem
              ]}
              onPress={() => handleSectionChange(index)}
            >
              <Text 
                style={[
                  styles.menuText,
                  activeSection === index && styles.activeMenuText
                ]}
              >
                {section.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color="#e0e0e0"
            style={{ marginLeft: 10 }}
          />
      </View>
      
      {/* Content Section */}
      <ScrollView ref={scrollViewRef} style={styles.contentContainer}>
        {React.createElement(sections[activeSection].component)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#01162e',
  },
  imageSection: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#01162e',
    paddingTop: 20,
    paddingBottom: 0,
    marginBottom: -1, // Negative margin to pull elements closer
  }, 
  profileImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 10, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 10, // Negative margin to pull elements closer
  },
  menuContainer: {
    backgroundColor: '#01162e',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    padding: 0,
    margin: 0,
    height: 30, // Fixed 
    marginTop: 0,
    marginBottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 26,
    paddingRight: 25, // Add padding to make room for the indicator
  },
  menuItem: {
    paddingHorizontal: 10,
    marginHorizontal: 3,
    borderRadius: 15,
    backgroundColor: 'transparent',
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeMenuItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  menuText: {
    color: '#e0e0e0',
    fontSize: 14,
    fontWeight: '500',
  },
  activeMenuText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#01162e',
  },
});