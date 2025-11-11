import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Card, Title, Avatar, ActivityIndicator } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { sendMessageToAI, analyzeHealthData } from '../src/services/aiService';
import { useTranslation } from '../src/locales/TranslationProvider';

const AIAssistantScreen = ({ navigation }) => {
  const { translations } = useTranslation();
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userData, setUserData] = useState(null);
  const [todayCalories, setTodayCalories] = useState(0);
  const [calorieTarget, setCalorieTarget] = useState(2000);
  const [bmi, setBmi] = useState(null);
  const [calorieDiff, setCalorieDiff] = useState(0);
  const scrollViewRef = useRef(null);

  // Load user data
  useEffect(() => {
    loadUserData();
    loadChatHistory();
  }, []);

  const loadUserData = async () => {
    try {
      // Simulate loading user data
      const userDataJson = await AsyncStorage.getItem('userData');
      if (userDataJson) {
        const data = JSON.parse(userDataJson);
        setUserData(data);
        
        // Calculate BMI
        if (data.weight && data.height) {
          const bmiValue = data.weight / Math.pow(data.height / 100, 2);
          setBmi(parseFloat(bmiValue.toFixed(1)));
        }
      }

      // Load today's intake and target
      const calorieTarget = await AsyncStorage.getItem('calorieTarget');
      if (calorieTarget) {
        setCalorieTarget(parseInt(calorieTarget, 10));
      }

      // Simulate loading today's calorie intake
      const todayCalories = await AsyncStorage.getItem('todayCalories');
      if (todayCalories) {
        setTodayCalories(parseInt(todayCalories, 10));
      }

      // Calculate calorie difference
      setCalorieDiff(calorieTarget ? parseInt(calorieTarget, 10) - (todayCalories ? parseInt(todayCalories, 10) : 0) : 0);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  // Load AI chat history
  const loadChatHistory = async () => {
    try {
      const savedChat = await AsyncStorage.getItem('aiChatHistory');
      if (savedChat) {
        setChatMessages(JSON.parse(savedChat));
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  // Save AI chat history
  const saveChatHistory = async (messages) => {
    try {
      await AsyncStorage.setItem('aiChatHistory', JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  };

  // Send message to AI
  const sendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;
    
    const userMessage = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    saveChatHistory(updatedMessages);
    setInputMessage('');
    setIsTyping(true);
    
    try {
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      const response = await sendMessageToAI([{ role: 'user', content: inputMessage.trim() }], userData);
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      
      const finalMessages = [...updatedMessages, aiMessage];
      setChatMessages(finalMessages);
      saveChatHistory(finalMessages);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I cannot provide a reply at the moment. Please try again later.',
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      const errorMessages = [...updatedMessages, errorMessage];
      setChatMessages(errorMessages);
      saveChatHistory(errorMessages);
    } finally {
      setIsTyping(false);
      // Scroll to bottom again
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };
  
  // Use AI to analyze health data
  const analyzeHealthWithAI = async () => {
    if (!userData || !bmi) {
      setInputMessage('I need your health data to perform analysis. Please complete your profile first.')
      return;
    }
    
    const healthSummary = {
      bmi: bmi,
      bmiCategory: bmi < 18.5 ? 'Underweight' : (bmi < 24 ? 'Normal Range' : (bmi < 28 ? 'Overweight' : 'Obese')),
      calorieIntake: todayCalories,
      calorieTarget: calorieTarget,
      calorieDiff: calorieDiff,
      ...userData
    };
    
    setIsTyping(true);
    
    try {
      const response = await analyzeHealthData(healthSummary);
      const aiMessage = {
        id: Date.now().toString(),
        text: response,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      
      const updatedMessages = [...chatMessages, aiMessage];
      setChatMessages(updatedMessages);
      saveChatHistory(updatedMessages);
    } catch (error) {
      console.error('Failed to analyze health data:', error);
    } finally {
      setIsTyping(false);
    }
  };
  
  // Clear chat history
  const clearChat = async () => {
    setChatMessages([]);
    await AsyncStorage.removeItem('aiChatHistory');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView style={styles.scrollContainer}>
        <Card style={styles.headerCard}>
          <Card.Content style={styles.headerContent}>
            <Avatar.Icon size={50} icon="robot" backgroundColor="#2196F3" />
            <View style={styles.titleContainer}>
              <Title style={styles.title}>{translations.aiAssistant || 'AI Health Assistant'}</Title>
              <Text style={styles.subtitle}>{translations.askHealthQuestions || 'Ask me health questions'}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Chat Message List */}
        <View style={styles.chatContainer}>
          <FlatList
            ref={scrollViewRef}
            data={chatMessages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[
                styles.messageContainer,
                item.sender === 'user' ? styles.userMessageContainer : styles.aiMessageContainer
              ]}>
                {item.sender === 'ai' && (
                  <Avatar.Icon size={32} icon="robot" backgroundColor="#2196F3" style={styles.avatar} />
                )}
                <View style={[
                  styles.messageBubble,
                  item.sender === 'user' ? styles.userMessageBubble : styles.aiMessageBubble
                ]}>
                  <Text style={[
                    styles.messageText,
                    item.sender === 'user' ? styles.userMessageText : styles.aiMessageText
                  ]}>{item.text}</Text>
                </View>
                {item.sender === 'user' && (
                  <Avatar.Icon size={32} icon="account" backgroundColor="#4CAF50" style={styles.avatar} />
                )}
              </View>
            )}
            style={styles.chatMessagesList}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
            onLayout={() => scrollViewRef.current?.scrollToEnd()}
          />
        </View>

        {/* Loading Indicator */}
        {isTyping && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2196F3" />
            <Text style={styles.typingText}>{translations.aiThinking || 'AI is thinking...'}</Text>
          </View>
        )}
      </ScrollView>

      {/* Health Data Analysis Button */}
      {!isTyping && (
        <TouchableOpacity 
          style={styles.analyzeButton}
          onPress={analyzeHealthWithAI}
        >
          <MaterialCommunityIcons name="chart-box" size={18} color="#fff" />
          <Text style={styles.analyzeButtonText}>{translations.analyzeMyHealth || 'Analyze my health data'}</Text>
        </TouchableOpacity>
      )}

      {/* Chat Input Box */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder={translations.askYourQuestion || 'Ask your question...'}
          placeholderTextColor="#999"
          value={inputMessage}
          onChangeText={setInputMessage}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity 
          style={[styles.sendButton, (isTyping || !inputMessage.trim()) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={isTyping || !inputMessage.trim()}
        >
          <MaterialCommunityIcons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Clear Chat Button */}
      {chatMessages.length > 0 && (
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={clearChat}
        >
          <Text style={styles.clearButtonText}>{translations.clearChat || 'Clear chat history'}</Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  headerCard: {
    margin: 15,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleContainer: {
    marginLeft: 15,
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  chatContainer: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  chatMessagesList: {
    minHeight: 400,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 8,
    marginHorizontal: 5,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    marginHorizontal: 8,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: '75%',
  },
  userMessageBubble: {
    backgroundColor: '#E3F2FD',
    marginRight: 5,
  },
  aiMessageBubble: {
    backgroundColor: '#f0f0f0',
    marginLeft: 5,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#0D47A1',
  },
  aiMessageText: {
    color: '#333',
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
  },
  typingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  analyzeButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginHorizontal: 15,
    marginBottom: 10,
  },
  analyzeButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
    marginBottom: 15,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sendButton: {
    backgroundColor: '#2196F3',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#b0bec5',
  },
  clearButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 10,
  },
  clearButtonText: {
    color: '#f44336',
    fontSize: 14,
  },
});

export default AIAssistantScreen;