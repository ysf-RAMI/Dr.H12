import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  Text,
  Platform,
  StatusBar,
  TouchableOpacity,
  Linking
} from 'react-native';
import { WebView } from 'react-native-webview';
import { IconButton } from 'react-native-paper';

const MediaViewer = ({ uri, type = 'PDF', onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    StatusBar.setHidden(true);
    console.log('MediaViewer URI:', uri);
    console.log('MediaViewer Type:', type);
    return () => StatusBar.setHidden(false);
  }, [uri, type]);

  const getWebViewSource = () => {
    const BASE_URL = 'https://doctorh1-kjmev.ondigitalocean.app';
    
    if (type === 'VIDEO') {
      // For videos, use the URI directly (full YouTube URL)
      return { uri };
    }
    
    // For both PDF and FICHIER types, add the BASE_URL
    return { 
      uri: `${BASE_URL}/api/files/getFile/${uri}`
    };
  };

  const renderContent = () => {
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Failed to load {type === 'VIDEO' ? 'video' : 'document'}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              setError(false);
              setLoading(true);
            }}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <WebView
        source={getWebViewSource()}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        androidLayerType="hardware"
        cacheEnabled={true}
        incognito={Platform.OS === 'android'}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerControls}>
        <IconButton 
          icon="close" 
          size={24} 
          onPress={onClose} 
          color="#fff"
        />
        {type === 'VIDEO' ? (
          <IconButton 
            icon="open-in-new" 
            size={24} 
            onPress={() => Linking.openURL(uri)} 
            color="#fff"
            style={styles.externalLinkButton}
          />
        ) : (
          <IconButton 
            icon="open-in-new" 
            size={24} 
            onPress={() => {
              const BASE_URL = 'https://doctorh1-kjmev.ondigitalocean.app';
              Linking.openURL(`${BASE_URL}/api/files/getFile/${uri}`);
            }} 
            color="#fff"
            style={styles.externalLinkButton}
          />
        )}
      </View>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
        </View>
      )}
      <View style={styles.webviewContainer}>
        {renderContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000',
    width: '100%',
    height: '100%',
  },
  headerControls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 20,
    right: 10,
    zIndex: 10,
    flexDirection: 'row',
  },
  externalLinkButton: {
    marginRight: 10,
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    zIndex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#fff',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
  },
  webviewContainer: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 40 : 0,
  }
});

export default MediaViewer;