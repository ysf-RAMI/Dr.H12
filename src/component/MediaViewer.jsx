import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  Text,
  StatusBar,
  TouchableOpacity,
  Linking,
  Button
} from 'react-native';
import { WebView } from 'react-native-webview';
import { IconButton } from 'react-native-paper';

// Modified component with built-in test functionality
const MediaViewer = ({ uri, type = 'PDF', onClose, testMode = false }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // For test mode
  const [showViewer, setShowViewer] = useState(false);
  const [testUri, setTestUri] = useState('');
  const [testType, setTestType] = useState('PDF');
  
  useEffect(() => {
    StatusBar.setHidden(true);
    console.log('MediaViewer URI:', testMode ? testUri : uri);
    console.log('MediaViewer Type:', testMode ? testType : type);
    return () => StatusBar.setHidden(false);
  }, [uri, type, testUri, testType]);

  const getWebViewSource = () => {
    const BASE_URL = 'https://doctorh1-kjmev.ondigitalocean.app';
    
    // Use test values if in test mode
    const currentUri = testMode ? testUri : uri;
    const currentType = testMode ? testType : type;
    
    if (currentType === 'VIDEO') {
      // For videos, use the URI directly (full YouTube URL)
      return { uri: currentUri };
    }
    
    // For PDF files, we need to use a PDF viewer
    if (currentType === 'PDF') {
      const pdfUrl = `${BASE_URL}/api/files/getFile/${currentUri}`;
      // Use Google PDF Viewer to display the PDF
      return { 
        uri: `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true` 
      };
    }
    
    // For other file types (FICHIER), add the BASE_URL
    return { 
      uri: `${BASE_URL}/api/files/getFile/${currentUri}`
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
        incognito={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />
    );
  };

  // Test functions
  const testPDF = () => {
    setTestType('PDF');
    setTestUri('sample-pdf-id'); // Replace with actual PDF ID
    setShowViewer(true);
  };

  const testVideo = () => {
    setTestType('VIDEO');
    setTestUri('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    setShowViewer(true);
  };

  // If in test mode and not showing viewer, show test buttons
  if (testMode && !showViewer) {
    return (
      <View style={styles.testContainer}>
        <Text style={styles.testTitle}>MediaViewer Test</Text>
        <Button title="Test PDF Viewer" onPress={testPDF} />
        <Button title="Test Video Viewer" onPress={testVideo} />
      </View>
    );
  }

  // If in test mode and showing viewer, use test values
  const currentOnClose = testMode ? () => setShowViewer(false) : onClose;

  return (
    <View style={styles.container}>
      <View style={styles.headerControls}>
        <IconButton 
          icon="close" 
          size={24} 
          onPress={currentOnClose} 
          color="#fff"
        />
        {(testMode ? testType : type) === 'VIDEO' ? (
          <IconButton 
            icon="open-in-new" 
            size={24} 
            onPress={() => Linking.openURL(testMode ? testUri : uri)} 
            color="#fff"
            style={styles.externalLinkButton}
          />
        ) : (
          <IconButton 
            icon="open-in-new" 
            size={24} 
            onPress={() => {
              const BASE_URL = 'https://doctorh1-kjmev.ondigitalocean.app';
              Linking.openURL(`${BASE_URL}/api/files/getFile/${testMode ? testUri : uri}`);
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
    top: 20,
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
    marginTop: 0,
  }
});

export default MediaViewer;