import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  Dimensions,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from "react-native";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { Avatar } from "react-native-paper";

const { width } = Dimensions.get("window");

const BASE_URL = "https://doctorh1-kjmev.ondigitalocean.app";

const Home = () => {
  const navigation = useNavigation();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/student/getAllAnnoces`,
        {
          timeout: 5000,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      setAnnouncements(response.data);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnnouncements();
  };

  const handleSeeAllAnnouncements = () => {
    navigation.navigate('Main', { screen: 'AnnouncementsTab' });
  };

  const handleSeeHamout = () => {
    navigation.navigate('Hamout');
  };

  const handleGetStarted = () => {
    navigation.navigate('Main', { screen: 'FilièresTab' });
  };

  const renderAnnouncementItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.announcementCard}
      activeOpacity={0.7}
    >
      <Text style={styles.announcementTitle} numberOfLines={1}>{item.titre}</Text>
      <Text style={styles.announcementDate}>
        {item.date.split(" ")[0]}
      </Text>
      <Text style={styles.announcementDesc} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.professorContainer}>
        <Avatar.Icon 
          icon="account-circle" 
          size={24} 
          style={styles.professorAvatar} 
        />
        <Text style={styles.professorName} numberOfLines={1}>
          {item.nomProfesseur} {item.prenomProfesseur}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const teamMembers = [
    {
      id: 1,
      name: "Hamza HAMOUT",
      role: "Chef de projet",
      image: require("../../assets/team/hamoutimage.jpg"),
      gmail : "h.hamout@uiz.ac.ma",
      researchgate:"https://www.researchgate.net/profile/Hamza-Hamout"
    },
    {
      id: 2,
      name: "Youssef RAMI",
      role: "Full Stack Developer",
      image: require("../../assets/team/youssef.jpg"),
      gmail:"yousseframi012@gmail.com",
      linkedin:"https://www.linkedin.com/in/youssef-rami/"
    },
  ];

  // Remove the notification section from the Why Choose Us section
  const advantages = [
    {
      id: 1,
      icon: "school",
      title: "Filières Diversifiées",
      description: "Une large sélection de filières adaptées aux besoins des étudiants"
    },
    {
      id: 3,
      icon: "menu-book",
      title: "Modules Structurés",
      description: "Des modules bien organisés pour une progression fluide et efficace"
    }
  ];

  return (
    <>
      <StatusBar backgroundColor="#01162e" barStyle="light-content" />
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4080be"]} />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Doctor H1</Text>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Bienvenue sur votre plateforme d'apprentissage</Text>
          <TouchableOpacity
            style={styles.heroButton}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.heroButtonText}>Explorer les filières</Text>
            <MaterialIcons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Dr. Hamout Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dr. Hamza Hamout</Text>
            <TouchableOpacity onPress={handleSeeHamout}>
              <Text style={styles.seeMoreText}>Voir plus</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.professorCard}>
            <Image
              source={require("../../assets/team/hamoutimage.jpg")}
              style={styles.professorImage}
            />

            <View style={styles.professorInfo}>
              <Text style={styles.professorRole}>
                Maître de Conférences Habilité
              </Text>
              <Text style={styles.professorInstitution}>
                École Supérieure de Technologie Guelmim
              </Text>
              <Text style={styles.professorDate}>
                23/02/2025 - Présent
              </Text>
            </View>
          </View>
        </View>

        {/* Announcements Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Annonces</Text>
            {announcements.length > 0 && (
              <TouchableOpacity onPress={handleSeeAllAnnouncements}>
                <Text style={styles.seeMoreText}>Voir tout</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : announcements.length > 0 ? (
            <FlatList
              data={announcements.slice(0, 5)}
              renderItem={renderAnnouncementItem}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.announcementsList}
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="alert-circle-outline" size={32} color="#999" />
              <Text style={styles.emptyStateText}>Aucune annonce disponible</Text>
            </View>
          )}
        </View>

        {/* Why Choose Us Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Pourquoi Nous Choisir</Text>
          
          <View style={styles.advantagesContainer}>
            {advantages.map((advantage) => (
              <View key={advantage.id} style={styles.advantageCard}>
                <MaterialIcons name={advantage.icon} size={28} color="#007AFF" style={styles.advantageIcon} />
                <Text style={styles.advantageTitle}>{advantage.title}</Text>
                <Text style={styles.advantageDescription}>{advantage.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Team Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Notre Équipe</Text>
          <FlatList
            data={teamMembers}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.teamList}
            renderItem={({ item }) => (
              <View style={styles.teamMemberCard}>
                <Image source={item.image} style={styles.teamMemberImage} />
                <Text style={styles.teamMemberName}>{item.name}</Text>
                <Text style={styles.teamMemberRole}>{item.role}</Text>
                <View style={styles.teamMemberSocial}>
                  {item.gmail && (
                    <TouchableOpacity 
                      style={styles.teamSocialButton}
                      onPress={() => Linking.openURL(`mailto:${item.gmail}`)}
                    >
                      <MaterialIcons name="email" size={18}   color="#666"/>
                    </TouchableOpacity>
                  )}
                  {item.linkedin && (
                    <TouchableOpacity 
                      style={styles.teamSocialButton}
                      onPress={() => Linking.openURL(item.linkedin)}
                    >
                      <FontAwesome5 name="linkedin" size={18}  color="#666"/>
                    </TouchableOpacity>
                  )}
                  {item.researchgate && (
                    <TouchableOpacity 
                      style={styles.teamSocialButton}
                      onPress={() => Linking.openURL(item.researchgate)}
                    >
                      <FontAwesome5 name="researchgate" size={18}  color="#666"  />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 Dr. H1. Tous droits réservés.</Text>
          <View style={styles.socialLinks}>
          </View>
        </View>
      </ScrollView>
    </>
  );
};

// Add these new styles to your StyleSheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#01162e",
    paddingTop: 45,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  notificationButton: {
    padding: 8,
  },
  // Hero Section
  heroSection: {
    backgroundColor: "#01162e",
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 18,
    color: "#70ade0",
    textAlign: "center",
    marginBottom: 20,
  },
  heroButton: {
    flexDirection: "row",
    backgroundColor: "#4080be",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
  },
  heroButtonText: {
    color: "white",
    fontWeight: "bold",
    marginRight: 8,
  },
  // Section Container
  sectionContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#01162e",
    marginBottom: 12,
    textAlign: "center"
  },
  seeMoreText: {
    color: "#4080be",
    fontWeight: "600",
    fontSize: 14,
  },
  // Professor Card
  professorCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 5
  },
  professorImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  professorInfo: {
    flex: 1,
    justifyContent: "center",
  },
  professorRole: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  professorInstitution: {
    fontSize: 13,
    color: "#555",
    marginBottom: 4,
  },
  professorDate: {
    fontSize: 12,
    color: "#777",
  },
  // Announcements
  loaderContainer: {
    padding: 30,
    alignItems: "center",
  },
  emptyStateContainer: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    color: "#777",
    marginTop: 10,
    fontSize: 15,
  },
  announcementsList: {
    paddingTop: 5,
    paddingBottom: 15,
    paddingLeft: 2,
  },
  announcementCard: {
    width: width * 0.7,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  announcementTitle: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#333",
  },
  announcementDate: {
    fontSize: 12,
    color: "#4080be",
    marginBottom: 6,
  },
  announcementDesc: {
    fontSize: 13,
    color: "#555",
    lineHeight: 18,
    marginBottom: 8,
  },
  professorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  professorAvatar: {
    backgroundColor: "#4080be",
    marginRight: 6,
  },
  professorName: {
    fontSize: 12,
    color: "#666",
    flex: 1,
  },
  // Why Choose Us
  advantagesContainer: {
    marginBottom: 15,
  },
  advantageCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  advantageIcon: {
    marginBottom: 10,
    color: "#4080be",
  },
  advantageTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
  },
  advantageDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  // Team Section
  teamList: {

    paddingTop: 5,
    paddingBottom: 15,
    paddingLeft: 2,
    flex:1,
    justifyContent:"center",
    alignItems:"center"
  },
  teamMemberCard: {
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginRight: 12,
    width: 150,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  teamMemberImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  teamMemberName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 4,
  },
  teamMemberRole: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
  },
  teamMemberSocial: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 5,
  },
  teamSocialButton: {
    marginHorizontal: 8,
    padding: 5,
  },
  // Footer
  footer: {
    padding: 20,
    alignItems: "center",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  footerText: {
    fontSize: 13,
    color: "#777",
    marginBottom: 10,
  },
  socialLinks: {
    flexDirection: "row",
  },
  socialButton: {
    marginHorizontal: 15,
    padding: 5,
  },
});

export default Home;
