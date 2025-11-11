// src/services/aiService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// AI API Configuration
const ZHIPU_API_KEY = 'fb980a1d8b7f4efdba82cf8a4c4dd977.VBOoYT62POIn0nGp';
const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

// AI Agent Configuration
const AGENT_CONFIG = {
  name: 'HealthCoach',
  systemPrompt: `You are a professional health coach AI assistant, specializing in providing personalized health advice. You can:
  1. Provide nutrition and fitness recommendations based on users' diet and exercise data
  2. Answer questions about health, diet, and exercise
  3. Provide diet plans and exercise programs suitable for users' physical conditions
  4. Offer encouragement and guidance for developing healthy habits
  5. Analyze trends in users' health data
  
  Please note:
  - All advice should be scientific, reasonable, and safe
  - Avoid giving extreme dietary or exercise recommendations
  - When necessary, suggest users consult professional doctors
  - Use friendly, encouraging language to help users build confidence in their health journey
  - Provide personalized analysis and recommendations based on user data`
};

// Send message to AI API
export const sendMessageToAI = async (messages, userData = null) => {
  try {
    // Build complete message list including system prompt
    const fullMessages = [
      {
        role: 'system',
        content: AGENT_CONFIG.systemPrompt + (userData ? `\n\nUser information: ${JSON.stringify(userData)}` : '')
      },
      ...messages
    ];

    // Call AI API
    const response = await fetch(ZHIPU_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZHIPU_API_KEY}`
      },
      body: JSON.stringify({
        model: 'glm-4',
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      throw new Error('No response content');
    }
  } catch (error) {
    console.error('AI服务错误:', error);
    return 'Sorry, I cannot provide a reply at the moment. Please try again later.';
  }
};

// Save conversation history
export const saveChatHistory = async (history) => {
  try {
    await AsyncStorage.setItem('aiChatHistory', JSON.stringify(history));
  } catch (error) {
    console.error('保存对话历史失败:', error);
  }
};

// Load conversation history
export const loadChatHistory = async () => {
  try {
    const history = await AsyncStorage.getItem('aiChatHistory');
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('加载对话历史失败:', error);
    return [];
  }
};

// Clear conversation history
export const clearChatHistory = async () => {
  try {
    await AsyncStorage.removeItem('aiChatHistory');
  } catch (error) {
    console.error('清除对话历史失败:', error);
  }
};

// Generate analysis prompt based on user health data
export const generateHealthAnalysisPrompt = (userData, mealData, statsData) => {
  let prompt = '';
  
  if (userData) {
    prompt += `My body data:\n`;
    prompt += `- Age: ${userData.age || 'Unknown'}\n`;
    prompt += `- Gender: ${userData.gender || 'Unknown'}\n`;
    prompt += `- Height: ${userData.height || 'Unknown'}cm\n`;
    prompt += `- Weight: ${userData.weight || 'Unknown'}kg\n`;
    prompt += `- Activity Level: ${userData.activityLevel || 'Unknown'}\n`;
    prompt += `- Daily Calorie Target: ${userData.calorieTarget || 'Unknown'} calories\n\n`;
  }
  
  if (mealData) {
    prompt += `My diet information:\n`;
    prompt += `- Today's calorie intake: ${mealData.totalCalories || 'Unknown'} calories\n`;
    prompt += `- Protein intake: ${mealData.totalProtein || 'Unknown'}g\n`;
    prompt += `- Carbohydrate intake: ${mealData.totalCarbs || 'Unknown'}g\n`;
    prompt += `- Fat intake: ${mealData.totalFat || 'Unknown'}g\n\n`;
  }
  
  if (statsData) {
    prompt += `My health statistics:\n`;
    prompt += `- BMI: ${statsData.bmi || 'Unknown'}\n`;
    prompt += `- Achievement days: ${statsData.achievementDays || 'Unknown'}\n`;
    prompt += `- Current streak: ${statsData.streak || 'Unknown'} days\n\n`;
  }
  
  prompt += `Based on the above data, please provide personalized health advice and improvement plans for me.`;
  
  return prompt;
};

// Analyze health data
export const analyzeHealthData = async (healthData) => {
  const prompt = generateHealthAnalysisPrompt(healthData, null, null);
  const messages = [{ role: 'user', content: prompt }];
  return await sendMessageToAI(messages, healthData);
};
