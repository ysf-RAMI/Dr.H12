import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, ScrollView, Image, Dimensions, TouchableOpacity, Animated } from "react-native";
import { Text, Surface, Divider } from "react-native-paper";

export default function CompetencesEtLangues() {
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const isMobile = screenWidth <= 768;
  
  // Create refs for each ScrollView
  const programmingScrollViewRef = useRef(null);
  const toolsScrollViewRef = useRef(null);
  const languagesScrollViewRef = useRef(null);
  
  // Define all the categories and their items
  const categories = [
    {
      title: "Langages de Programmation",
      ref: programmingScrollViewRef,
      items: ["C", "C++", "Java", "VB", "HTML/CSS", "PHP", "JavaScript", "Java EE"],
      scrollSpeed: 1.5,
      width: 1200
    },
    {
      title: "Outils & Technologies",
      ref: toolsScrollViewRef,
      items: ["MySQL", "UML", "MERISE", "MS Office", "LaTeX", "Eclipse", "Visual Studio", "Windows", "Linux", "Réseaux Informatique", "Data Mining", "Machine Learning"],
      scrollSpeed: 1.7,
      width: 1600
    },
    {
      title: "Langues",
      items: [
        { name: "Arabe", level: "Maternel" },
        { name: "Français", level: "Bon niveau" },
        { name: "Anglais", level: "Bon niveau" }
      ],
      // Remove ref and scroll properties for languages
      width: 100,
    }
  ];

  // Handle window resizing
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

  // Setup infinite scrolling for each category
  useEffect(() => {
    // Create arrays to track scroll position and animation frames
    const positions = categories.map(() => 0);
    const animationFrames = categories.map(() => null);
    
    // Function to animate scrolling for a specific category
    const animateScroll = (index) => {
      // Skip languages section as it doesn't have a ref
      if (!categories[index].ref?.current) return;
      
      // Increment position based on scroll speed
      positions[index] += categories[index].scrollSpeed;
      
      // Reset position when reaching the end of first set of items
      if (positions[index] >= categories[index].width / 2) {
        positions[index] = 0;
        categories[index].ref.current.scrollTo({ x: 0, animated: false });
      } else {
        categories[index].ref.current.scrollTo({
          x: positions[index],
          animated: false
        });
      }
      
      animationFrames[index] = requestAnimationFrame(() => animateScroll(index));
    };
    
    categories.forEach((category, index) => {
      // Only animate categories that have a ref
      if (category.ref) {
        animateScroll(index);
      }
    });
    
    return () => {
      animationFrames.forEach(frame => {
        if (frame) cancelAnimationFrame(frame);
      });
    };
  }, []);

  const SkillItem = ({ name, Icon, level }) => {
    const isLanguage = level !== undefined;
    
    return (
      <TouchableOpacity 
        style={isLanguage ? styles.languageIconContainer : styles.skillIconContainer}
        activeOpacity={0.7}
      >
        <Surface style={[styles.skillIcon, isLanguage && styles.languageIcon]}>
          {typeof Icon === "function" ? <Icon /> : (Icon ? <Icon size={30} /> : null)}
          <Text style={styles.itemName}>{name}</Text>
        </Surface>
      </TouchableOpacity>
    );
  };

  // Render a category section with its ScrollView
  const CategorySection = ({ category, index }) => {
    if (category.title === "Langues") {
      return (
        <View style={styles.languageContainer}>
          <Text style={styles.categoryTitle}>{category.title}</Text>
          <View style={styles.languageItemsContainer}>
            {category.items.map((item) => (
              <SkillItem 
                key={item.name} 
                name={item.name} 
                Icon={iconComponents[item.name]} 
                level={item.level}
              />
            ))}
          </View>
        </View>
      );
    }
    return (
      <View>
        
          <Text style={styles.categoryTitle}>{category.title}</Text>
        <ScrollView 
          ref={category.ref}
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContentContainer}
          scrollEventThrottle={16}
        >
          <View style={styles.itemsRow}>
            {/* First set of items */}
            {category.title === "Langues" 
              ? category.items.map((item, i) => (
                  <SkillItem 
                    key={`first-${item.name}`} 
                    name={item.name} 
                    Icon={iconComponents[item.name]} 
                    level={item.level}
                  />
                ))
              : category.items.map((item) => (
                  <SkillItem 
                    key={`first-${item}`} 
                    name={item} 
                    Icon={iconComponents[item]} 
                  />
                ))
            }
            
            {category.title === "Langues" 
              ? category.items.map((item, i) => (
                  <SkillItem 
                    key={`second-${item.name}`} 
                    name={item.name} 
                    Icon={iconComponents[item.name]} 
                    level={item.level}
                  />
                ))
              : category.items.map((item) => (
                  <SkillItem 
                    key={`second-${item}`} 
                    name={item} 
                    Icon={iconComponents[item]} 
                  />
                ))
            }
          </View>
        </ScrollView>
        
        <View style={styles.scrollIndicators}>
          <View style={[styles.indicator, { opacity: 1.9 }]} />
          <View style={[styles.indicator, { opacity: 1.7 }]} />
          <View style={[styles.indicator, { opacity: 1.5 }]} />
        </View>
      </View>
    );
  };

  return (

      <View style={styles.innerContainer}>
        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>Compétences & Langues</Text>
          
          {categories.map((category, index) => (
            <React.Fragment key={category.title}>
              <CategorySection category={category} index={index} />
              {index < categories.length - 1 && <Divider style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>
      </View>
    
  );
}

const iconComponents = {
  C: () => (
    <Image
      source={{ uri: "https://img.icons8.com/color/48/c-programming.png" }}
      style={styles.iconImage}
    />
  ),
  "C++": () => (
    <Image
      source={{ uri: "https://img.icons8.com/color/48/c-plus-plus-logo.png" }}
      style={styles.iconImage}
    />
  ),
  Java: () => (
    <Image
      source={{ uri: "https://img.icons8.com/color/48/java-coffee-cup-logo.png" }}
      style={styles.iconImage}
    />
  ),
  VB: () => (
    <Image
      source={{ uri: "https://img.icons8.com/?size=100&id=3845&format=png&color=000000" }}
      style={styles.iconImage}
    />
  ),
  MySQL: () => (
    <Image
      source={{ uri: "https://img.icons8.com/color/48/mysql-logo.png" }}
      style={styles.iconImage}
    />
  ),
  UML: () => (
    <Image
      source={{ uri: "https://img.icons8.com/?size=100&id=ZCWpp3WQaB5A&format=png&color=000000" }}
      style={styles.iconImage}
    />
  ),
  MERISE: () => (
    <Image
      source={{ uri: "https://img.icons8.com/?size=100&id=YUKvLGE4zROg&format=png&color=000000" }}
      style={styles.iconImage}
    />
  ),
  "HTML/CSS": () => (
    <Image
      source={{ uri: "https://img.icons8.com/color/48/html-5.png" }}
      style={styles.iconImage}
    />
  ),
  PHP: () => (
    <Image
      source={{ uri: "https://img.icons8.com/color/48/php.png" }}
      style={styles.iconImage}
    />
  ),
  JavaScript: () => (
    <Image
      source={{ uri: "https://img.icons8.com/color/48/javascript.png" }}
      style={styles.iconImage}
    />
  ),
  "Java EE": () => (
    <Image source={{uri:"https://i0.wp.com/antoniogoncalves.org/wp-content/uploads/2014/05/java_ee_logo_vert_v2.png?ssl=1"}} style={styles.iconImage} />
  ),
  "MS Office": () => (
    <Image
      source={{ uri: "https://img.icons8.com/?size=100&id=37619&format=png&color=000000" }}
      style={styles.iconImage}
    />
  ),
  LaTeX: () => (
    <Image
      source={{ uri: "https://img.icons8.com/color/48/latex.png" }}
      style={styles.iconImage}
    />
  ),
  Windows: () => (
    <Image
      source={{ uri: "https://img.icons8.com/color/48/windows-10.png" }}
      style={styles.iconImage}
    />
  ),
  Linux: () => (
    <Image
      source={{ uri: "https://img.icons8.com/color/48/linux.png" }}
      style={styles.iconImage}
    />
  ),
  Eclipse: () => (
    <Image
      source={{ uri: "https://img.icons8.com/color/48/eclipse.png" }}
      style={styles.iconImage}
    />
  ),
  "Visual Studio": () => (
    <Image
      source={{ uri: "https://img.icons8.com/color/48/visual-studio.png" }}
      style={styles.iconImage}
    />
  ),
  "Réseaux Informatique": () => (
    <Image
      source={{ uri: "https://img.icons8.com/color/48/network.png" }}
      style={styles.iconImage}
    />
  ),
  "Data Mining": () => (
    <Image
      source={{ uri: "https://img.icons8.com/?size=100&id=uXgMijzXD4lU&format=png&color=000000" }}
      style={styles.iconImage}
    />
  ),
  "Machine Learning": () => (
    <Image
      source={{ uri: "https://img.icons8.com/?size=100&id=gTN9eaZkKLFI&format=png&color=000000" }}
      style={styles.iconImage}
    />
  ),
  Arabe: () => (
    <Image
      source={{ uri: "https://img.icons8.com/color/48/saudi-arabia.png" }}
      style={styles.iconImage}
    />
  ),
  Français: () => (
    <Image
      source={{ uri: "https://img.icons8.com/color/48/france.png" }}
      style={styles.iconImage}
    />
  ),
  Anglais: () => (
    <Image
      source={{ uri: "https://img.icons8.com/color/48/usa.png" }}
      style={styles.iconImage}
    />
  ),
};

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
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#01162e',
    marginBottom: 24,
    textAlign: 'center',
  },
  categorySection: {
    width: '100%',
    marginBottom: 20,
    
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'left',
    paddingLeft: 10,
  },
  scrollContainer: {
    maxHeight: 150,
  },
  scrollContentContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  itemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillIconContainer: {
    margin: 8,
    width: 100,
  },
  languageIconContainer: {
    margin: 8,
    width: 120,
  },
  skillIcon: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    backgroundColor: '#fff',
    minHeight: 90,
  },
  languageIcon: {
    minHeight: 110,
    padding: 16,
  },
  itemName: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
    marginTop: 6,
    fontWeight: '500',
  },
  languageLevel: {
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  iconImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  scrollIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#01162e',
    marginHorizontal: 3,
  },
  divider: {
    width: '90%',
    height: 1,
    marginVertical: 16,
    alignSelf: 'center',
  },
  languageContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  languageItemsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
});