// Nutrition Calculator Service
// This service calculates optimal macronutrient and calorie intake based on user profile

class NutritionCalculator {
  /**
   * Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
   * @param {number} weight - Weight in kg
   * @param {number} height - Height in cm
   * @param {number} age - Age in years
   * @param {string} gender - Gender ('male', 'female', 'other')
   * @returns {number} BMR in calories
   */
  static calculateBMR(weight, height, age, gender) {
    if (!weight || !height || !age) return 0;
    
    // Convert to numbers if they are strings
    weight = parseFloat(weight);
    height = parseFloat(height);
    age = parseInt(age, 10);
    
    if (isNaN(weight) || isNaN(height) || isNaN(age) || weight <= 0 || height <= 0 || age <= 0) {
      return 0;
    }
    
    // Mifflin-St Jeor Equation
    let bmr;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else if (gender === 'female') {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    } else {
      // For 'other', use average of male and female formulas
      const maleBmr = 10 * weight + 6.25 * height - 5 * age + 5;
      const femaleBmr = 10 * weight + 6.25 * height - 5 * age - 161;
      bmr = (maleBmr + femaleBmr) / 2;
    }
    
    return Math.round(bmr);
  }
  
  /**
   * Calculate Total Daily Energy Expenditure (TDEE) based on activity level
   * @param {number} bmr - Basal Metabolic Rate
   * @param {string} activityLevel - Activity level ('sedentary', 'light', 'moderate', 'active')
   * @returns {number} TDEE in calories
   */
  static calculateTDEE(bmr, activityLevel) {
    if (!bmr) return 0;
    
    // Activity multipliers
    const activityFactors = {
      sedentary: 1.2,      // Little to no exercise
      light: 1.375,        // Light exercise (1-3 days/week)
      moderate: 1.55,      // Moderate exercise (3-5 days/week)
      active: 1.725,       // Heavy exercise (6-7 days/week)
    };
    
    const factor = activityFactors[activityLevel] || activityFactors.moderate;
    return Math.round(bmr * factor);
  }
  
  /**
   * Calculate target calories based on fitness goal
   * @param {number} tdee - Total Daily Energy Expenditure
   * @param {string} goal - Fitness goal ('lose', 'maintain', 'gain')
   * @returns {number} Target calories
   */
  static calculateTargetCalories(tdee, goal) {
    if (!tdee) return 0;
    
    let targetCalories;
    switch (goal) {
      case 'lose':
        // 500 calorie deficit for safe weight loss
        targetCalories = tdee - 500;
        break;
      case 'gain':
        // 300 calorie surplus for muscle gain
        targetCalories = tdee + 300;
        break;
      case 'maintain':
      default:
        targetCalories = tdee;
        break;
    }
    
    // Ensure minimum calories (1200 for women, 1500 for men as general guideline)
    const minCalories = 1200;
    targetCalories = Math.max(targetCalories, minCalories);
    
    return Math.round(targetCalories);
  }
  
  /**
   * Calculate macronutrients based on target calories and activity
   * @param {number} targetCalories - Target daily calories
   * @param {number} weight - Weight in kg
   * @param {string} goal - Fitness goal
   * @param {Array} fitnessGoals - Array of fitness activities
   * @returns {Object} Macronutrients in grams {protein, carbs, fat}
   */
  static calculateMacronutrients(targetCalories, weight, goal, fitnessGoals = []) {
    if (!targetCalories || !weight) return { protein: 0, carbs: 0, fat: 0 };
    
    weight = parseFloat(weight);
    if (isNaN(weight) || weight <= 0) {
      return { protein: 0, carbs: 0, fat: 0 };
    }
    
    // Protein calculation (in grams)
    // Higher for muscle gain, slightly higher for weight loss to preserve muscle
    let proteinMultiplier;
    if (goal === 'gain') {
      proteinMultiplier = 2.0; // 2.0g per kg for muscle gain
    } else if (goal === 'lose') {
      proteinMultiplier = 1.8; // 1.8g per kg for weight loss (to preserve muscle)
    } else {
      proteinMultiplier = 1.6; // 1.6g per kg for maintenance
    }
    
    // Adjust protein based on strength training
    const doesStrengthTraining = fitnessGoals.includes('strength') || 
                                fitnessGoals.includes('hiit') ||
                                fitnessGoals.includes('weightlifting');
    
    if (doesStrengthTraining) {
      proteinMultiplier += 0.2;
    }
    
    let protein = weight * proteinMultiplier;
    
    // Fat calculation (in grams)
    // 25-30% of total calories from fat
    const fatPercentage = 0.27; // 27% as middle ground
    let fat = (targetCalories * fatPercentage) / 9; // 9 calories per gram of fat
    
    // Carbohydrate calculation (in grams)
    // Remaining calories from carbs
    const proteinCalories = protein * 4; // 4 calories per gram of protein
    const fatCalories = fat * 9; // 9 calories per gram of fat
    const carbCalories = targetCalories - proteinCalories - fatCalories;
    let carbs = carbCalories / 4; // 4 calories per gram of carbs
    
    // Adjust carbs based on endurance activities
    const doesEnduranceTraining = fitnessGoals.includes('running') || 
                                 fitnessGoals.includes('cycling') ||
                                 fitnessGoals.includes('swimming');
    
    if (doesEnduranceTraining && goal !== 'lose') {
      // Increase carbs for endurance athletes
      const extraCarbs = targetCalories * 0.05 / 4; // Additional 5% of calories from carbs
      carbs += extraCarbs;
      fat = (targetCalories * (fatPercentage - 0.05)) / 9; // Reduce fat percentage by 5%
    }
    
    return {
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat)
    };
  }
  
  /**
   * Get daily nutrition summary based on user profile
   * @param {Object} userProfile - User profile object
   * @returns {Object} Nutrition summary with calories and macronutrients
   */
  static getDailyNutrition(userProfile) {
    if (!userProfile) {
      return {
        bmr: 0,
        tdee: 0,
        targetCalories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      };
    }
    
    const { weight, height, age, gender, activityLevel, goal, fitnessGoals } = userProfile;
    
    // Calculate BMR
    const bmr = this.calculateBMR(weight, height, age, gender);
    
    // Calculate TDEE
    const tdee = this.calculateTDEE(bmr, activityLevel);
    
    // Calculate target calories
    const targetCalories = this.calculateTargetCalories(tdee, goal);
    
    // Calculate macronutrients
    const macros = this.calculateMacronutrients(targetCalories, weight, goal, fitnessGoals);
    
    return {
      bmr,
      tdee,
      targetCalories,
      ...macros
    };
  }
  
  /**
   * Get meal breakdown suggestions
   * @param {Object} nutrition - Nutrition summary object
   * @returns {Object} Meal breakdown
   */
  static getMealBreakdown(nutrition) {
    if (!nutrition || !nutrition.targetCalories) {
      return {
        breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        lunch: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        dinner: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        snacks: { calories: 0, protein: 0, carbs: 0, fat: 0 }
      };
    }
    
    const { targetCalories, protein, carbs, fat } = nutrition;
    
    // Typical meal distribution
    // Breakfast: 25%, Lunch: 30%, Dinner: 30%, Snacks: 15%
    return {
      breakfast: {
        calories: Math.round(targetCalories * 0.25),
        protein: Math.round(protein * 0.25),
        carbs: Math.round(carbs * 0.30), // Slightly higher carbs for breakfast
        fat: Math.round(fat * 0.20)      // Slightly lower fat for breakfast
      },
      lunch: {
        calories: Math.round(targetCalories * 0.30),
        protein: Math.round(protein * 0.30),
        carbs: Math.round(carbs * 0.30),
        fat: Math.round(fat * 0.30)
      },
      dinner: {
        calories: Math.round(targetCalories * 0.30),
        protein: Math.round(protein * 0.30),
        carbs: Math.round(carbs * 0.25), // Slightly lower carbs for dinner
        fat: Math.round(fat * 0.35)      // Slightly higher fat for dinner
      },
      snacks: {
        calories: Math.round(targetCalories * 0.15),
        protein: Math.round(protein * 0.15),
        carbs: Math.round(carbs * 0.15),
        fat: Math.round(fat * 0.15)
      }
    };
  }
}

export default NutritionCalculator;