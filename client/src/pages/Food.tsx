/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { DefaultLayout } from "@/components/layout/DefaultLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { FeedbackService } from "@/services/feedbackService";
import { SeatService } from "@/services/seatService";
import { CartService, Cart, CartItem } from "@/services/cartService";
import { IndianRupee, ReceiptIndianRupeeIcon } from "lucide-react";

interface Food {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isAvailable: boolean;
  preparationTime: number;
  ingredients: string[];
  nutritionalInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface LocalCartItem extends Food {
  quantity: number;
}

// Food item component
function FoodItem({ item, onAddToCart, cartLoading }: { item: Food; onAddToCart: (item: Food) => void; cartLoading: boolean }) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-video w-full overflow-hidden">
        <img src={item.image || "/placeholder.svg"} alt={item.name} className="h-full w-full object-cover" />
      </div>
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{item.name}</CardTitle>
          <Badge variant="outline" className="border-green-500 text-green-500">
            {item.category}
          </Badge>
        </div>
        <CardDescription>{item.description}</CardDescription>
      </CardHeader>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <span className="font-bold">₹{item.price}</span>
        <Button
          onClick={() => onAddToCart(item)}
          size="sm"
          className="bg-quicktap-teal hover:bg-quicktap-teal/90 text-white"
          disabled={!item.isAvailable || cartLoading}
        >
          {item.isAvailable ? (cartLoading ? 'Adding...' : 'Add to Cart') : 'Not Available'}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Enhanced user preferences with ordering history
const userPreferences = {
  priceRange: { min: 0, max: 1000 },
  preferredVendors: ["all"],
  dietType: "both" as "veg" | "non-veg" | "both",
  previousOrders: [] as string[],
  // NEW: Enhanced ordering patterns
  orderFrequency: {} as Record<string, number>, // How often each food is ordered
  orderTiming: {} as Record<string, number[]>, // When each food is typically ordered
  orderSequences: [] as string[][], // Order sequences (what was ordered together)
  lastOrdered: {} as Record<string, Date>, // When each food was last ordered
  seasonalPreferences: {} as Record<string, number>, // Seasonal food preferences
};

// NEW: Predictive recommendation algorithm based on user behavior
function generatePredictiveRecommendations(allFoodItems: Food[], cart: CartItem[], userId: string) {
  let recommendations: (Food & { reason: string[] })[] = [];

  // Get user's ordering history from localStorage or API
  const userOrderHistory = getUserOrderHistory(userId);

  // Analyze ordering patterns
  const patterns = analyzeOrderingPatterns(userOrderHistory);

  allFoodItems.forEach(item => {
    const reasons: string[] = [];

    // Check if user orders similar items together
    cart.forEach(cartItem => {
      if (cartItem.category === item.category && cartItem._id !== item._id) {
        reasons.push("Similar to items in your cart");
      }
    });

    // Base reason for all items
    reasons.push("Available item");

    // 1. FREQUENCY ANALYSIS - How often user orders this food
    const frequencyScore = calculateFrequencyScore(item._id, patterns.orderFrequency);
    if (frequencyScore.points > 0) {
      reasons.push(`Ordered ${frequencyScore.count} times before`);
    }

    // 2. RECENCY ANALYSIS - How recently user ordered this food
    const recencyScore = calculateRecencyScore(item._id, patterns.lastOrdered);
    if (recencyScore.points > 0) {
      reasons.push(recencyScore.reason);
    }

    // 3. TIMING ANALYSIS - When user typically orders this food
    const timingScore = calculateTimingScore(item._id, patterns.orderTiming);
    if (timingScore.points > 0) {
      reasons.push(timingScore.reason);
    }

    // 4. SEQUENCE ANALYSIS - What user orders together
    const sequenceScore = calculateSequenceScore(item._id, patterns.orderSequences, cart);
    if (sequenceScore.points > 0) {
      reasons.push(sequenceScore.reason);
    }

    // 5. CATEGORY PREFERENCE - User's preferred food categories
    const categoryScore = calculateCategoryScore(item.category, patterns.categoryPreferences);
    if (categoryScore.points > 0) {
      reasons.push(`Preferred category: ${item.category}`);
    }

    // 6. PRICE PATTERN - User's typical spending pattern
    const priceScore = calculatePriceScore(item.price, patterns.pricePreferences);
    if (priceScore.points > 0) {
      reasons.push(priceScore.reason);
    }

    // 7. SEASONAL ANALYSIS - Time-based food preferences
    const seasonalScore = calculateSeasonalScore(item, patterns.seasonalPreferences);
    if (seasonalScore.points > 0) {
      reasons.push(seasonalScore.reason);
    }

    // 8. SIMILARITY TO CART - Items similar to what's already in cart
    const similarityScore = calculateSimilarityScore(item, cart, patterns);
    if (similarityScore.points > 0) {
      reasons.push(similarityScore.reason);
    }

    // 9. AVAILABILITY BOOST
    if (item.isAvailable) {
      reasons.push("Currently available");
    }

    // 10. AVOID RECOMMENDING ITEMS ALREADY IN CART
    if (cart.some(cartItem => cartItem._id === item._id)) {
      recommendations.push({ ...item, reason: ["Already in cart"] });
      return; // Skip to next item
    }

    recommendations.push({ ...item, reason: reasons.slice(0, 3) }); // Show top 3 reasons
  });

  // Sort by number of reasons (more reasons = higher recommendation)
  recommendations.sort((a, b) => b.reason.length - a.reason.length);

  // Return top 4 recommendations
  return recommendations.slice(0, 2);
}

// NEW: Get user's ordering history
function getUserOrderHistory(userId: string) {
  try {
    // Try to get from localStorage first
    const storedHistory = localStorage.getItem(`user-orders-${userId}`);
    if (storedHistory) {
      return JSON.parse(storedHistory);
    }

    // Fallback: return empty history for new users
    return {
      orders: [],
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting user order history:', error);
    return { orders: [], lastUpdated: new Date().toISOString() };
  }
}

// NEW: Analyze ordering patterns from user history
function analyzeOrderingPatterns(orderHistory: any) {
  const patterns = {
    orderFrequency: {} as Record<string, number>,
    orderTiming: {} as Record<string, number[]>,
    orderSequences: [] as string[][],
    lastOrdered: {} as Record<string, Date>,
    categoryPreferences: {} as Record<string, number>,
    pricePreferences: { min: 0, max: 0, avg: 0 },
    seasonalPreferences: {} as Record<string, Record<number, number>>
  };

  if (!orderHistory.orders || orderHistory.orders.length === 0) {
    return patterns;
  }

  const orders = orderHistory.orders;

  // Analyze frequency and timing
  orders.forEach((order: any) => {
    order.items.forEach((item: any) => {
      const foodId = item.foodId || item._id;

      // Count frequency
      patterns.orderFrequency[foodId] = (patterns.orderFrequency[foodId] || 0) + 1;

      // Record timing (hour of day)
      const orderHour = new Date(order.orderDate || order.createdAt).getHours();
      if (!patterns.orderTiming[foodId]) {
        patterns.orderTiming[foodId] = [];
      }
      patterns.orderTiming[foodId].push(orderHour);

      // Record last ordered date
      const orderDate = new Date(order.orderDate || order.createdAt);
      if (!patterns.lastOrdered[foodId] || orderDate > patterns.lastOrdered[foodId]) {
        patterns.lastOrdered[foodId] = orderDate;
      }
    });

    // Analyze order sequences (what was ordered together)
    if (order.items.length > 1) {
      const itemIds = order.items.map((item: any) => item.foodId || item._id);
      patterns.orderSequences.push(itemIds);
    }

    // Analyze category preferences
    order.items.forEach((item: any) => {
      const category = item.category;
      patterns.categoryPreferences[category] = (patterns.categoryPreferences[category] || 0) + 1;
    });

    // Analyze price preferences
    const orderTotal = order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    if (patterns.pricePreferences.min === 0 || orderTotal < patterns.pricePreferences.min) {
      patterns.pricePreferences.min = orderTotal;
    }
    if (orderTotal > patterns.pricePreferences.max) {
      patterns.pricePreferences.max = orderTotal;
    }
  });

  // Calculate average price
  const totalSpent = orders.reduce((sum: number, order: any) =>
    sum + order.items.reduce((orderSum: number, item: any) => orderSum + (item.price * item.quantity), 0), 0);
  patterns.pricePreferences.avg = totalSpent / orders.length;

  // Analyze seasonal preferences (month-based)
  orders.forEach((order: any) => {
    const orderMonth = new Date(order.orderDate || order.createdAt).getMonth();
    order.items.forEach((item: any) => {
      const foodId = item.foodId || item._id;
      if (!patterns.seasonalPreferences[foodId]) {
        patterns.seasonalPreferences[foodId] = {} as Record<number, number>;
      }
      patterns.seasonalPreferences[foodId][orderMonth] = (patterns.seasonalPreferences[foodId][orderMonth] || 0) + 1;
    });
  });

  return patterns;
}

// NEW: Calculate frequency-based score
function calculateFrequencyScore(foodId: string, orderFrequency: Record<string, number>) {
  const count = orderFrequency[foodId] || 0;
  if (count === 0) return { points: 0, count: 0 };

  // Higher frequency = higher score (logarithmic scaling)
  const points = Math.min(30, Math.log(count + 1) * 15);
  return { points: Math.round(points), count };
}

// NEW: Calculate recency-based score
function calculateRecencyScore(foodId: string, lastOrdered: Record<string, Date>) {
  const lastOrder = lastOrdered[foodId];
  if (!lastOrder) return { points: 0, reason: "" };

  const daysSinceLastOrder = (Date.now() - lastOrder.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceLastOrder <= 1) {
    return { points: 0, reason: "Ordered very recently" }; // Don't recommend if ordered today
  } else if (daysSinceLastOrder <= 3) {
    return { points: 15, reason: "Ordered recently (within 3 days)" };
  } else if (daysSinceLastOrder <= 7) {
    return { points: 25, reason: "Ordered last week" };
  } else if (daysSinceLastOrder <= 30) {
    return { points: 35, reason: "Ordered last month" };
  } else {
    return { points: 20, reason: "Ordered a while ago" };
  }
}

// NEW: Calculate timing-based score
function calculateTimingScore(foodId: string, orderTiming: Record<string, number[]>) {
  const timingData = orderTiming[foodId];
  if (!timingData || timingData.length === 0) return { points: 0, reason: "" };

  const currentHour = new Date().getHours();
  const avgOrderHour = timingData.reduce((sum, hour) => sum + hour, 0) / timingData.length;

  // Check if current time matches when user typically orders this food
  const timeDiff = Math.abs(currentHour - avgOrderHour);
  if (timeDiff <= 2) {
    return { points: 20, reason: `Typically ordered around this time (${Math.round(avgOrderHour)}:00)` };
  } else if (timeDiff <= 4) {
    return { points: 10, reason: `Sometimes ordered around this time` };
  }

  return { points: 0, reason: "" };
}

// NEW: Calculate sequence-based score
function calculateSequenceScore(foodId: string, orderSequences: string[][], cart: CartItem[]) {
  let points = 0;
  let reason = "";

  // Check if this food is often ordered with items in cart
  const cartItemIds = cart.map(item => item._id);

  orderSequences.forEach(sequence => {
    if (sequence.includes(foodId)) {
      const otherItems = sequence.filter(id => id !== foodId);
      const matchingCartItems = otherItems.filter(id => cartItemIds.includes(id));

      if (matchingCartItems.length > 0) {
        points += 25;
        reason = `Often ordered with items in your cart`;
      }
    }
  });

  return { points, reason };
}

// NEW: Calculate category preference score
function calculateCategoryScore(category: string, categoryPreferences: Record<string, number>) {
  const preference = categoryPreferences[category] || 0;
  if (preference === 0) return { points: 0, reason: "" };

  // Higher preference = higher score
  const points = Math.min(20, preference * 2);
  return { points, reason: "" };
}

// NEW: Calculate price preference score
function calculatePriceScore(price: number, pricePreferences: any) {
  const { min, max, avg } = pricePreferences;

  if (min === 0 && max === 0) return { points: 0, reason: "" };

  // Prefer items within user's typical price range
  if (price >= min && price <= max) {
    return { points: 20, reason: "Within your typical price range" };
  } else if (price <= avg * 1.5) {
    return { points: 15, reason: "Similar to your usual spending" };
  } else if (price <= avg * 2) {
    return { points: 10, reason: "Slightly above your usual spending" };
  }

  return { points: 0, reason: "" };
}

// NEW: Calculate seasonal preference score
function calculateSeasonalScore(item: Food, seasonalPreferences: any) {
  const currentMonth = new Date().getMonth();
  const itemSeasonalData = seasonalPreferences[item._id];

  if (!itemSeasonalData) return { points: 0, reason: "" };

  const currentMonthOrders = itemSeasonalData[currentMonth] || 0;
  const totalOrders = Object.values(itemSeasonalData).reduce((sum: any, count: any) => sum + count, 0);

  if (totalOrders === 0) return { points: 0, reason: "" };

  const seasonalRatio = currentMonthOrders / (totalOrders as number);

  if (seasonalRatio > 0.3) {
    return { points: 15, reason: "Seasonal favorite" };
  } else if (seasonalRatio > 0.1) {
    return { points: 10, reason: "Sometimes ordered this season" };
  }

  return { points: 0, reason: "" };
}

// NEW: Calculate similarity score
function calculateSimilarityScore(item: Food, cart: CartItem[], patterns: any) {
  let points = 0;
  let reason = "";

  // Check if user orders similar items together
  cart.forEach(cartItem => {
    if (cartItem.category === item.category && cartItem._id !== item._id) {
      points += 15;
      reason = "Similar to items in your cart";
    }
  });

  return { points, reason };
}

// NEW: Content-based filtering algorithm for food recommendations
function generateContentBasedRecommendations(allFoodItems: Food[], cart: CartItem[], userId: string) {
  let recommendations: (Food & { reason: string[] })[] = [];

  // Get user's ordering history and preferences
  const userOrderHistory = getUserOrderHistory(userId);
  const userProfile = buildUserProfile(userOrderHistory, cart);

  // Analyze content similarity for each food item
  allFoodItems.forEach(item => {
    const reasons: string[] = [];

    // Skip items already in cart
    if (cart.some(cartItem => cartItem._id === item._id)) {
      recommendations.push({ ...item, reason: ['Already in cart'] });
      return;
    }

    // 1. INGREDIENT SIMILARITY ANALYSIS
    const ingredientSimilarity = calculateIngredientSimilarity(item, userProfile.preferredIngredients);
    if (ingredientSimilarity.score > 0) {
      reasons.push(`Similar ingredients: ${ingredientSimilarity.matchedIngredients.join(', ')}`);
    }

    // 2. CATEGORY PREFERENCE ANALYSIS
    const categoryScore = calculateCategoryPreference(item.category, userProfile.categoryPreferences);
    if (categoryScore.points > 0) {
      reasons.push(`Preferred category: ${item.category}`);
    }

    // 3. CUISINE TYPE SIMILARITY
    const cuisineSimilarity = calculateCuisineSimilarity(item, userProfile.preferredCuisines);
    if (cuisineSimilarity.score > 0) {
      reasons.push(`Similar cuisine: ${cuisineSimilarity.cuisineType}`);
    }

    // 4. PRICE RANGE COMPATIBILITY
    const priceScore = calculatePriceCompatibility(item.price, userProfile.pricePreferences);
    if (priceScore.points > 0) {
      reasons.push(priceScore.reason);
    }

    // 5. NUTRITIONAL PREFERENCE MATCHING
    const nutritionScore = calculateNutritionalMatch(item.nutritionalInfo, userProfile.nutritionalPreferences);
    if (nutritionScore.points > 0) {
      reasons.push(nutritionScore.reason);
    }

    // 6. TEXT SIMILARITY (name and description)
    const textSimilarity = calculateTextSimilarity(item, userProfile.preferredFoodNames);
    if (textSimilarity.score > 0) {
      reasons.push(`Similar to: ${textSimilarity.similarFood}`);
    }

    // 7. AVAILABILITY BOOST
    if (item.isAvailable) {
      reasons.push('Currently available');
    }

    // 8. SEASONAL RELEVANCE
    const seasonalScore = calculateSeasonalRelevance(item, userProfile.seasonalPreferences);
    if (seasonalScore.points > 0) {
      reasons.push(seasonalScore.reason);
    }

    recommendations.push({
      ...item,
      reason: reasons.slice(0, 3) // Show top 3 reasons
    });
  });

  // Sort by number of reasons (more reasons = higher recommendation)
  recommendations.sort((a, b) => b.reason.length - a.reason.length);

  // Return top 8 recommendations
  return recommendations.slice(0, 2);
}

// NEW: Build comprehensive user profile from order history
function buildUserProfile(orderHistory: any, cart: CartItem[]) {
  const profile = {
    preferredIngredients: {} as Record<string, number>,
    categoryPreferences: {} as Record<string, number>,
    preferredCuisines: {} as Record<string, number>,
    pricePreferences: { min: 0, max: 0, avg: 0, preferredRange: [] as number[] },
    nutritionalPreferences: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    preferredFoodNames: [] as string[],
    seasonalPreferences: {} as Record<string, number>
  };

  // Analyze order history
  if (orderHistory.orders && orderHistory.orders.length > 0) {
    orderHistory.orders.forEach((order: any) => {
      order.items.forEach((item: any) => {
        // Extract food details (this would come from your actual food data)
        const foodDetails = extractFoodDetails(item);

        // Build ingredient preferences
        if (foodDetails.ingredients) {
          foodDetails.ingredients.forEach((ingredient: string) => {
            profile.preferredIngredients[ingredient.toLowerCase()] = (profile.preferredIngredients[ingredient.toLowerCase()] || 0) + 1;
          });
        }

        // Build category preferences
        if (foodDetails.category) {
          profile.categoryPreferences[foodDetails.category] = (profile.categoryPreferences[foodDetails.category] || 0) + 1;
        }

        // Build cuisine preferences
        const cuisineType = detectCuisineType(foodDetails.name, foodDetails.category);
        profile.preferredCuisines[cuisineType] = (profile.preferredCuisines[cuisineType] || 0) + 1;

        // Build price preferences
        if (foodDetails.price) {
          profile.pricePreferences.preferredRange.push(foodDetails.price);
        }

        // Build nutritional preferences
        if (foodDetails.nutritionalInfo) {
          profile.nutritionalPreferences.calories += foodDetails.nutritionalInfo.calories || 0;
          profile.nutritionalPreferences.protein += foodDetails.nutritionalInfo.protein || 0;
          profile.nutritionalPreferences.carbs += foodDetails.nutritionalInfo.carbs || 0;
          profile.nutritionalPreferences.fat += foodDetails.nutritionalInfo.fat || 0;
        }

        // Build food name preferences
        profile.preferredFoodNames.push(foodDetails.name);
      });
    });

    // Calculate averages
    const totalOrders = orderHistory.orders.length;
    if (profile.pricePreferences.preferredRange.length > 0) {
      profile.pricePreferences.avg = profile.pricePreferences.preferredRange.reduce((a, b) => a + b, 0) / profile.pricePreferences.preferredRange.length;
      profile.pricePreferences.min = Math.min(...profile.pricePreferences.preferredRange);
      profile.pricePreferences.max = Math.max(...profile.pricePreferences.preferredRange);
    }

    if (totalOrders > 0) {
      profile.nutritionalPreferences.calories /= totalOrders;
      profile.nutritionalPreferences.protein /= totalOrders;
      profile.nutritionalPreferences.carbs /= totalOrders;
      profile.nutritionalPreferences.fat /= totalOrders;
    }
  }

  // Analyze current cart
  cart.forEach(item => {
    // Add cart items to preferences
    profile.categoryPreferences[item.category] = (profile.categoryPreferences[item.category] || 0) + 2; // Higher weight for current cart
    profile.preferredFoodNames.push(item.name);
  });

  return profile;
}

// NEW: Calculate ingredient similarity between food items
function calculateIngredientSimilarity(item: Food, preferredIngredients: Record<string, number>) {
  let score = 0;
  const matchedIngredients: string[] = [];

  if (!item.ingredients || item.ingredients.length === 0) {
    return { score: 0, matchedIngredients: [] };
  }

  item.ingredients.forEach(ingredient => {
    const preference = preferredIngredients[ingredient.toLowerCase()] || 0;
    if (preference > 0) {
      score += preference * 5; // Higher preference = higher score
      matchedIngredients.push(ingredient);
    }
  });

  return { score: Math.min(score, 50), matchedIngredients };
}

// NEW: Calculate category preference score
function calculateCategoryPreference(category: string, categoryPreferences: Record<string, number>) {
  const preference = categoryPreferences[category] || 0;
  if (preference === 0) return { points: 0, reason: '' };

  const points = Math.min(30, preference * 3);
  return { points, reason: `Likes ${category} foods` };
}

// NEW: Detect cuisine type from food name and category
function detectCuisineType(name: string, category: string): string {
  const lowerName = name.toLowerCase();
  const lowerCategory = category.toLowerCase();

  if (lowerName.includes('dosa') || lowerName.includes('idli') || lowerName.includes('sambar') || lowerCategory.includes('south indian')) {
    return 'South Indian';
  } else if (lowerName.includes('biryani') || lowerName.includes('kebab') || lowerName.includes('naan') || lowerCategory.includes('north indian')) {
    return 'North Indian';
  } else if (lowerName.includes('noodles') || lowerName.includes('fried rice') || lowerName.includes('manchurian')) {
    return 'Chinese';
  } else if (lowerName.includes('pizza') || lowerName.includes('pasta') || lowerName.includes('burger')) {
    return 'Western';
  } else if (lowerName.includes('sushi') || lowerName.includes('ramen') || lowerName.includes('tempura')) {
    return 'Japanese';
  } else {
    return 'Other';
  }
}

// NEW: Calculate cuisine similarity
function calculateCuisineSimilarity(item: Food, preferredCuisines: Record<string, number>) {
  const cuisineType = detectCuisineType(item.name, item.category);
  const preference = preferredCuisines[cuisineType] || 0;

  if (preference === 0) return { score: 0, cuisineType: '' };

  const score = Math.min(40, preference * 8);
  return { score, cuisineType };
}

// NEW: Calculate price compatibility
function calculatePriceCompatibility(price: number, pricePreferences: any) {
  const { min, max, avg } = pricePreferences;

  if (min === 0 && max === 0) return { points: 0, reason: '' };

  if (price >= min && price <= max) {
    return { points: 25, reason: 'Within your preferred price range' };
  } else if (price <= avg * 1.2) {
    return { points: 20, reason: 'Similar to your usual spending' };
  } else if (price <= avg * 1.5) {
    return { points: 15, reason: 'Slightly above your usual spending' };
  } else if (price <= avg * 2) {
    return { points: 10, reason: 'Higher than usual but affordable' };
  }

  return { points: 0, reason: '' };
}

// NEW: Calculate nutritional match
function calculateNutritionalMatch(nutritionalInfo: any, nutritionalPreferences: any) {
  if (!nutritionalInfo || !nutritionalPreferences) return { points: 0, reason: '' };

  let score = 0;
  const tolerance = 0.3; // 30% tolerance

  // Check if nutritional values are within preferred ranges
  if (Math.abs(nutritionalInfo.calories - nutritionalPreferences.calories) <= nutritionalPreferences.calories * tolerance) {
    score += 10;
  }
  if (Math.abs(nutritionalInfo.protein - nutritionalPreferences.protein) <= nutritionalPreferences.protein * tolerance) {
    score += 10;
  }

  if (score > 0) {
    return { points: score, reason: 'Matches your nutritional preferences' };
  }

  return { points: 0, reason: '' };
}

// NEW: Calculate text similarity
function calculateTextSimilarity(item: Food, preferredFoodNames: string[]) {
  let maxSimilarity = 0;
  let mostSimilarFood = '';

  preferredFoodNames.forEach(preferredName => {
    const similarity = calculateStringSimilarity(item.name, preferredName);
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      mostSimilarFood = preferredName;
    }
  });

  const score = Math.min(30, maxSimilarity * 30);
  return { score, similarFood: mostSimilarFood };
}

// NEW: Calculate string similarity using simple algorithm
function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

// NEW: Levenshtein distance for string similarity
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

// NEW: Calculate seasonal relevance
function calculateSeasonalRelevance(item: Food, seasonalPreferences: Record<string, number>) {
  const currentMonth = new Date().getMonth();
  const itemSeasonalData = seasonalPreferences[item._id];

  if (!itemSeasonalData) return { points: 0, reason: '' };

  const currentMonthOrders = itemSeasonalData[currentMonth] || 0;
  const totalOrders = Object.values(itemSeasonalData).reduce((sum: any, count: any) => sum + count, 0);

  if (totalOrders === 0) return { points: 0, reason: '' };

  const seasonalRatio = currentMonthOrders / totalOrders;

  if (seasonalRatio > 0.3) {
    return { points: 20, reason: 'Seasonal favorite' };
  } else if (seasonalRatio > 0.1) {
    return { points: 15, reason: 'Sometimes ordered this season' };
  }

  return { points: 0, reason: '' };
}

// NEW: Extract food details from order items
function extractFoodDetails(orderItem: any) {
  // This function would extract detailed food information
  // For now, return basic structure - you can enhance this based on your data
  return {
    name: orderItem.name || '',
    category: orderItem.category || '',
    price: orderItem.price || 0,
    ingredients: orderItem.ingredients || [],
    nutritionalInfo: orderItem.nutritionalInfo || { calories: 0, protein: 0, carbs: 0, fat: 0 }
  };
}

export default function Food() {
  const navigate = useNavigate();

  const [cart, setCart] = useState<LocalCartItem[]>([]);
  const [dbCart, setDbCart] = useState<Cart | null>(null);
  const [activeDay, setActiveDay] = useState("monday");
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const feedbackRef = useRef<HTMLTextAreaElement>(null);
  const [submitting, setSubmitting] = useState(false);

  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [showSeatSelection, setShowSeatSelection] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [currentOrderId, setCurrentOrderId] = useState<string>("");
  const [seatBookingLoading, setSeatBookingLoading] = useState(false);
  const [seatStatus, setSeatStatus] = useState<{ [key: number]: 'available' | 'occupied' | 'blocked' }>({});
  const [seatDetails, setSeatDetails] = useState<{ [key: number]: any }>({});
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);

  // Orders: keep track of user's orders for this session and show popup
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [lastOrder, setLastOrder] = useState<any | null>(null);

  // Note: Authentication is handled by PrivateRoute in App.tsx
  // This component will only render if user is logged in


  // Get user ID from localStorage
  const getUserId = () => {
    const userInfo = localStorage.getItem('user-info');
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        return user.email || 'guest';
      } catch (error) {
        return 'guest';
      }
    }
    return 'guest';
  };

  // Load persisted orders from localStorage so they remain across reloads
  const loadStoredOrders = () => {
    try {
      const uid = getUserId();
      const key = `user-orders-${uid}`;
      const existing = localStorage.getItem(key);
      if (existing) {
        const parsed = JSON.parse(existing);
        if (Array.isArray(parsed.orders)) {
          setOrdersList(parsed.orders);
        }
      }
    } catch (e) {
      // ignore
    }
  };

  // On mount, and whenever user changes (e.g., login), load orders
  useEffect(() => {
    loadStoredOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Record order locally and open confirmation popup
  const recordOrder = (order: any) => {
    try {
      setOrdersList((prev) => {
        const exists = prev.some((o) => (o?._id || o?.id) === (order?._id || order?.id));
        if (exists) return prev;
        return [order, ...prev];
      });
      setLastOrder(order);
      setShowOrderPopup(true);
      // Also persist a lightweight history in localStorage per user
      const uid = getUserId();
      const key = `user-orders-${uid}`;
      const existing = localStorage.getItem(key);
      const existingOrders = existing ? JSON.parse(existing).orders : [];
      const existsInStorage = existingOrders.some((o: any) => (o?._id || o?.id) === (order?._id || order?.id));
      const payload = {
        orders: existsInStorage
          ? existingOrders
          : [
            {
              _id: order._id || order.id || `local_${Date.now()}`,
              createdAt: order.createdAt || new Date().toISOString(),
              items: order.items || [],
              totalAmount: order.totalAmount || 0,
              userName: order.userName,
            },
            ...existingOrders,
          ],
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
      // Non-blocking
    }
  };

  // Fetch foods from the API
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/foods');
        if (!response.ok) throw new Error('Failed to fetch foods');
        const data = await response.json();
        setFoods(data);
      } catch (error) {
        toast.error('Failed to load food items');
      } finally {
        setLoading(false);
      }
    };
    fetchFoods();
  }, []);

  // Fetch cart from database
  useEffect(() => {
    const fetchCart = async () => {
      const userId = getUserId();
      try {
        const cartData = await CartService.getCart(userId);
        setDbCart(cartData);
        // Sync with local cart
        const localCartItems: LocalCartItem[] = cartData.items.map(item => ({
          _id: item.foodId,
          name: item.name,
          description: '',
          price: item.price,
          category: item.category || '',
          image: item.image || '',
          isAvailable: true,
          preparationTime: 0,
          ingredients: [],
          nutritionalInfo: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          quantity: item.quantity
        }));
        setCart(localCartItems);
      } catch (error) {
        console.error('Error fetching cart:', error);
      }
    };
    fetchCart();
  }, []);

  // Fetch seat availability
  const fetchSeatAvailability = async () => {
    setLoadingSeats(true);
    try {
      const response = await SeatService.getSeatStatus();
      if (response.success) {
        const statusMap: { [key: number]: 'available' | 'occupied' | 'blocked' } = {};
        const detailsMap: { [key: number]: any } = {};

        response.seats.forEach((seat: any) => {
          // Block if seat.status is occupied OR there is any booking info present with time remaining
          const isBlocked = seat.status === 'occupied' || (seat.booking && seat.booking.expiresAt && new Date(seat.booking.expiresAt) > new Date());

          if (isBlocked) {
            statusMap[seat.seatNumber] = 'blocked';
          } else {
            statusMap[seat.seatNumber] = 'available';
          }

          // Store details for tooltips and time remaining
          detailsMap[seat.seatNumber] = seat;
        });

        setSeatStatus(statusMap);
        setSeatDetails(detailsMap);
      }
    } catch (error) {
      console.error('Error fetching seat availability:', error);
    } finally {
      setLoadingSeats(false);
    }
  };

  // Fetch seat availability on component mount and periodically
  useEffect(() => {
    fetchSeatAvailability();

    // Refresh seat availability every 15 seconds for better real-time blocking
    const interval = setInterval(fetchSeatAvailability, 15000);

    return () => clearInterval(interval);
  }, []);

  // Handle adding items to cart
  const addToCart = async (item: Food) => {
    setCartLoading(true);
    try {
      const userId = getUserId();

      // Add to database cart
      const updatedCart = await CartService.addToCart(userId, {
        foodId: item._id,
        name: item.name,
        price: item.price,
        quantity: 1,
        image: item.image,
        category: item.category
      });

      // Update local state
      setDbCart(updatedCart);
      const localCartItems: LocalCartItem[] = updatedCart.items.map(cartItem => ({
        _id: cartItem.foodId,
        name: cartItem.name,
        description: '',
        price: cartItem.price,
        category: cartItem.category || '',
        image: cartItem.image || '',
        isAvailable: true,
        preparationTime: 0,
        ingredients: [],
        nutritionalInfo: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        quantity: cartItem.quantity
      }));
      setCart(localCartItems);

      toast.success(`Added ${item.name} to cart`);
    } catch (error) {
      toast.error('Failed to add item to cart');
      console.error('Error adding to cart:', error);
    } finally {
      setCartLoading(false);
    }
  };

  // Handle removing items from cart
  const removeFromCart = async (itemId: string) => {
    try {
      const userId = getUserId();

      // Remove from database cart
      const updatedCart = await CartService.removeFromCart(userId, itemId);

      // Update local state
      setDbCart(updatedCart);
      const localCartItems: LocalCartItem[] = updatedCart.items.map(cartItem => ({
        _id: cartItem.foodId,
        name: cartItem.name,
        description: '',
        price: cartItem.price,
        category: cartItem.category || '',
        image: cartItem.image || '',
        isAvailable: true,
        preparationTime: 0,
        ingredients: [],
        nutritionalInfo: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        quantity: cartItem.quantity
      }));
      setCart(localCartItems);

      toast.info("Item removed from cart");
    } catch (error) {
      toast.error('Failed to remove item from cart');
      console.error('Error removing from cart:', error);
    }
  };

  // Calculate total price
  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Handle checkout process
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    setShowPaymentOptions(true);
  };

  // Handle Razorpay payment
  const handleRazorpayPayment = async () => {
    try {
      const userId = getUserId();
      const amount = getTotalPrice();

      // Get user information from localStorage
      const userInfo = localStorage.getItem('user-info');
      let userName = "Guest User";

      if (userInfo) {
        try {
          const user = JSON.parse(userInfo);
          userName = user.name || "Guest User";
        } catch (parseError) {
          console.error('Error parsing user info:', parseError);
        }
      }

      // Create Razorpay order
      const response = await fetch('http://localhost:5000/api/payments/create-cart-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          cartItems: dbCart ? dbCart.items : cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          totalAmount: amount
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment order');
      }

      const data = await response.json();

      // Ensure we have an order id available for subsequent seat booking
      if (data?.order?.id) {
        setCurrentOrderId(data.order.id);
      }

      // Initialize Razorpay payment
      const options = {
        key: 'rzp_test_R9Gsfwn9dWKpPN',
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'Yendine Food',
        description: 'Food Order Payment',
        order_id: data.order.id,
        handler: async function (response: any) {
          try {
            // Verify payment with user information and order details
            const verifyResponse = await fetch('http://localhost:5000/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: userId,
                userName: userName,
                amount: amount,
                orderDetails: {
                  items: dbCart ? dbCart.items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price
                  })) : cart.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price
                  })),
                  totalAmount: amount
                }
              }),
            });

            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              if (verifyData.success) {
                toast.success('Payment successful! Payment details stored in database.');

                // Create order in database for Razorpay payment
                try {
                  const created = await createOrderInDatabase('razorpay', 'completed', data.order.id, response.razorpay_payment_id);
                  toast.success('Order created successfully in database!');
                  if (created) recordOrder(created);
                } catch (orderError) {
                  console.error('Error creating order in database:', orderError);
                }

                // Complete order with seat booking (skip order creation to avoid duplicates)
                if (selectedSeats.length > 0) {
                  // For Razorpay payments, use the payment-verified seat booking endpoint
                  try {
                    const bookingData = {
                      seats: selectedSeats,
                      orderId: data.order.id, // Use Razorpay order ID
                      userId: userId,
                      userName: userName,
                      orderDetails: {
                        items: dbCart ? dbCart.items.map(item => ({
                          name: item.name,
                          quantity: item.quantity,
                          price: item.price
                        })) : cart.map(item => ({
                          name: item.name,
                          quantity: item.quantity,
                          price: item.price
                        })),
                        totalAmount: amount
                      },
                      razorpayOrderId: data.order.id,
                      razorpayPaymentId: response.razorpay_payment_id,
                      razorpaySignature: response.razorpay_signature
                    };

                    console.log('Booking seats after Razorpay payment:', bookingData);

                    // Use the payment-verified seat booking endpoint
                    const seatResponse = await fetch('http://localhost:5000/api/seats/book-after-payment', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(bookingData),
                    });

                    if (seatResponse.ok) {
                      const seatData = await seatResponse.json();
                      toast.success(`Seats ${selectedSeats.join(', ')} booked successfully for 30 minutes!`);
                      console.log('Seats booked after payment:', seatData);
                    } else {
                      const seatError = await seatResponse.json();
                      console.error('Seat booking error:', seatError);
                      toast.error('Payment successful but seat booking failed. Please contact support.');
                    }
                  } catch (seatError) {
                    console.error('Error booking seats after payment:', seatError);
                    toast.error('Payment successful but seat booking failed. Please contact support.');
                  }
                }

                // Complete order without calling handleCompleteOrder to avoid duplicate seat booking
                toast.success("Order completed successfully!");

                // Clear database cart
                const clearUserId = getUserId();
                try {
                  await CartService.clearCart(clearUserId);
                  setDbCart(null);
                } catch (error) {
                  console.error('Error clearing cart:', error);
                }

                setCart([]);
                setSelectedSeats([]);
                setCurrentOrderId("");

                // Refresh seat availability after booking
                await fetchSeatAvailability();
              } else {
                toast.error('Payment verification failed');
              }
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            toast.error('Payment verification failed');
            console.error('Payment verification error:', error);
          }
        },
        prefill: {
          name: userName,
          email: userId !== 'guest' ? userId : '',
        },
        theme: {
          color: '#10B981',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error) {
      toast.error('Failed to initiate payment');
      console.error('Payment error:', error);
    }
  };

  // Handle payment method selection
  const handlePaymentMethodSelect = async (method: string) => {
    setSelectedPaymentMethod(method);
    setShowPaymentOptions(false);

    if (method === 'cash') {
      // For cash on delivery, generate order ID and complete order with seat booking
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCurrentOrderId(orderId);
      handleCompleteOrder();
    } else if (method === 'razorpay') {
      // For Razorpay, create order and initiate payment
      await handleRazorpayPayment();
    } else {
      // For other payment methods, proceed directly to order completion
      handleCompleteOrder();
    }
  };

  // Function to create order in database
  const createOrderInDatabase = async (paymentMethod: string, paymentStatus: string = 'pending', razorpayOrderId?: string, razorpayPaymentId?: string) => {
    try {
      const userId = getUserId();
      const userInfo = localStorage.getItem('user-info');
      let userName = "Guest User";

      if (userInfo) {
        try {
          const user = JSON.parse(userInfo);
          userName = user.name || "Guest User";
        } catch (parseError) {
          console.error('Error parsing user info:', parseError);
        }
      }

      const orderData = {
        userId,
        userName,
        items: dbCart ? dbCart.items.map(item => ({
          foodId: item.foodId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          category: item.category
        })) : cart.map(item => ({
          foodId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          category: item.category
        })),
        totalAmount: getTotalPrice(),
        paymentMethod,
        paymentStatus,
        razorpayOrderId,
        razorpayPaymentId,
        selectedSeats: selectedSeats.length > 0 ? selectedSeats : [],
        orderNotes: selectedSeats.length > 0 ? `Seats booked: ${selectedSeats.join(', ')}` : undefined
      };

      const response = await fetch('http://localhost:5000/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create order in database');
      }

      const orderResult = await response.json();
      console.log('Order created in database:', orderResult);
      return orderResult.order;
    } catch (error) {
      console.error('Error creating order in database:', error);
      toast.error('Failed to create order in database');
      throw error;
    }
  };

  // Handle order completion
  const handleCompleteOrder = async (skipOrderCreation: boolean = false) => {
    if (selectedSeats.length > 0) {
      // If seats are selected, book them
      if (!currentOrderId) {
        // For cash payments, generate order ID first
        const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setCurrentOrderId(orderId);
        console.log('Generated order ID for cash payment:', orderId);
      }

      // Now book the seats
      await handleBookSeats();
    } else {
      // Complete order without seat booking
      try {
        // Create order in database for cash on delivery
        if (!skipOrderCreation) {
          const created = await createOrderInDatabase('cash', 'completed');
          if (created) recordOrder(created);
        }
        toast.success("Order placed successfully and stored in database!");

        // Clear database cart
        const clearUserId = getUserId();
        try {
          await CartService.clearCart(clearUserId);
          setDbCart(null);
        } catch (error) {
          console.error('Error clearing cart:', error);
        }

        setCart([]);
        setSelectedSeats([]);
        setCurrentOrderId("");
      } catch (error) {
        console.error('Error completing order:', error);
      }
    }
  };



  // Handle UPI payment
  const handleUPIPayment = () => {
    const amount = getTotalPrice();
    const upiUrl = `upi://pay?pa=yendine@upi&pn=Yendine%20Food&am=${amount}&cu=INR&tn=Food%20Order`;

    // Try to open UPI app, fallback to showing QR code
    window.open(upiUrl, '_blank');
    toast.success("Opening UPI payment app...");
  };

  // Generate QR code for UPI payment
  const generateUPIQRCode = () => {
    const amount = getTotalPrice();
    const upiString = `upi://pay?pa=yendine@upi&pn=Yendine%20Food&am=${amount}&cu=INR&tn=Food%20Order`;
    return upiString;
  };

  // Handle seat selection
  const handleSeatSelect = (seatNumber: number) => {
    setSelectedSeats(prev => [...prev, seatNumber]);
  };

  // Handle seat deselection
  const handleSeatDeselect = (seatNumber: number) => {
    setSelectedSeats(prev => prev.filter(seat => seat !== seatNumber));
  };

  // Function to handle seat booking submission
  const handleBookSeats = async () => {
    console.log('🚀 handleBookSeats called with:', {
      selectedSeats,
      currentOrderId,
      selectedPaymentMethod
    });

    if (selectedSeats.length === 0) {
      console.log('No seats selected, skipping seat booking');
      return; // No seats selected, just complete the order
    }

    if (!currentOrderId) {
      console.error('❌ Missing currentOrderId:', currentOrderId);
      toast.error('Order could not be identified. Please try placing the order again.');
      throw new Error('Missing order id for seat booking');
    }

    console.log('✅ Starting seat booking process...', { selectedSeats, currentOrderId });
    setSeatBookingLoading(true);

    try {
      // Get user information from localStorage
      const userInfo = localStorage.getItem('user-info');
      let userName = "Guest User";
      let userId = null;

      if (userInfo) {
        try {
          const user = JSON.parse(userInfo);
          userName = user.name || "Guest User";
          userId = user.email; // Using email as userId for now
        } catch (parseError) {
          console.error('Error parsing user info:', parseError);
        }
      }

      console.log('👤 User info:', { userName, userId });

      const bookingData = {
        seats: selectedSeats,
        orderId: currentOrderId,
        userId: userId,
        userName: userName,
        orderDetails: {
          items: dbCart ? dbCart.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })) : cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          totalAmount: getTotalPrice()
        }
      };

      console.log('📝 Sending booking data to server:', bookingData);

      const response = await SeatService.bookSeatsForCash(bookingData);
      console.log('✅ Seat booking response:', response);

      // Create order in database after successful seat booking
      try {
        const created = await createOrderInDatabase('cash', 'completed');
        if (created) recordOrder(created);
        toast.success(`Seats ${selectedSeats.join(', ')} booked successfully for 30 minutes! Order stored in database.`);
      } catch (orderError) {
        console.error('Error creating order in database:', orderError);
        toast.success(`Seats ${selectedSeats.join(', ')} booked successfully for 30 minutes!`);
      }

      // Clear database cart
      const clearCartUserId = getUserId();
      try {
        await CartService.clearCart(clearCartUserId);
        setDbCart(null);
      } catch (error) {
        console.error('Error clearing cart:', error);
      }

      setCart([]);
      setSelectedSeats([]);
      setCurrentOrderId("");

      // Refresh seat availability after booking
      await fetchSeatAvailability();
    } catch (error: any) {
      console.error('❌ Seat booking error:', error);
      toast.error(error.message || "Failed to book seats.");
    } finally {
      setSeatBookingLoading(false);
    }
  };

  // Group foods by category for display
  const foodsByCategory = foods.reduce<Record<string, Food[]>>((acc, food) => {
    if (!acc[food.category]) {
      acc[food.category] = [];
    }
    acc[food.category].push(food);
    return acc;
  }, {});

  // Recommendation logic using content-based filtering
  const recommendations = generateContentBasedRecommendations(foods, cart as any, getUserId());

  // Fallback: If no recommendations, show popular items
  const fallbackRecommendations = recommendations.length === 0 ?
    foods.slice(0, 2).map(item => ({ ...item, reason: ['Popular item'] })) :
    recommendations;

  // Debug: Log recommendation details
  console.log('Food recommendations:', {
    totalFoods: foods.length,
    recommendationsCount: recommendations.length,
    fallbackCount: fallbackRecommendations.length,
    recommendations: recommendations.map(r => ({ name: r.name, category: r.category, reasonCount: r.reason.length })),
    cartItems: cart.length
  });

  // Handle feedback change
  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFeedback(e.target.value);
    if (feedbackRef.current) {
      feedbackRef.current.style.height = "auto";
      feedbackRef.current.style.height = feedbackRef.current.scrollHeight + "px";
    }
  };

  // Handle feedback submission
  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) {
      toast.error("Please enter your feedback.");
      return;
    }
    setSubmitting(true);
    try {
      await FeedbackService.createFeedback({ feedback: feedback.trim() });
      toast.success("Thank you for your feedback!");
      setFeedback("");
      if (feedbackRef.current) feedbackRef.current.style.height = "32px";
    } catch (error) {
      toast.error("Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DefaultLayout>
      <div className="container py-8 t">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-quicktap-creamy">Campus Food Ordering</h1>
        </div>



        {/* Food Recommendation Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3 text-quicktap-creamy/60">Recommended food</h2>

          {fallbackRecommendations.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-muted-foreground text-sm">No recommendations at this time. Try adding some items to your cart!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 place-self-center  ">
              {fallbackRecommendations.map(item => (
                <Card key={item._id} className=" hover:scale-105 duration-200 transition-all w-[200px] rounded-3xl flex flex-col items-center gap-3 p-3 hover:shadow-md ">
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    className="w-[100px] h-[100px] object-cover rounded-[50%]"
                  />
                  <div className="text-center flex-1 capitalize">
                    <p className="font-medium text-md">{item.name}</p>
                    <p className="text-sm text-muted-foreground">₹{item.price}</p>
                    <p className="text-sm text-quicktap-teal">{item.category}</p>

                    <Button
                      size="sm"
                      onClick={() => addToCart(item)}
                      disabled={!item.isAvailable || cartLoading}
                      className="w-full bg-quicktap-green/80 hover:bg-quicktap-green text-white mt-3"
                    >
                      {cartLoading ? 'Adding...' : 'Add to Cart'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Recommendation Stats */}
          <div className="mt-4 text-center text-quicktap-lightGray/70 text-sm ">
            <p>
              AI-powered recommendations from available items
              {recommendations.length === 0 && fallbackRecommendations.length > 0 &&
                ' (using popular items as fallback)'
              }
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Food Menu Section */}
          <div className="md:col-span-2 space-y-6">
            <Tabs defaultValue={activeDay} onValueChange={setActiveDay}>
              <TabsContent key={activeDay} value={activeDay}>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading food items...</p>
                  </div>
                ) : foods.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No food items available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(foodsByCategory).map(([category, items]) => (
                      <div key={category} className="col-span-2">
                        <h3 className="text-lg font-semibold mb-4 capitalize text-quicktap-creamy ">{category}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {items.map(item => (
                            <FoodItem key={item._id} item={item} onAddToCart={addToCart} cartLoading={cartLoading} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          {/* Cart Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Your Order</CardTitle>
                <CardDescription>{cart.length} items in cart</CardDescription>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4 capitalize">
                    {cart.map(item => (
                      <div key={item._id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} x ₹{item.price}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">₹{item.price * item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item._id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-0 h-8 w-8"
                          >
                            ✕
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-4 mt-4">
                      <div className="flex justify-between">
                        <span className="font-bold">Total:</span>
                        <span className="font-bold">₹{getTotalPrice()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <Button
                className="w-full bg-quicktap-darkGray hover:bg-quicktap-green/90 text-white hover:text-white"
                onClick={handleCheckout}
                disabled={cart.length === 0}
              >
                Pay Now (₹{getTotalPrice()})
              </Button>
            </Card>
          </div>
        </div>
        {/* 
        {/* Payment Options Modal */}
        {showPaymentOptions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">Select Payment Method</h3>

              {/* Selected Seats Summary */}
              {selectedSeats.length > 0 && (
                <div className="mb-4 p-3 bg-quicktap-teal/10 border border-quicktap-teal/20 rounded">
                  <p className="text-sm font-medium text-quicktap-teal">
                    Selected Seats: {selectedSeats.join(', ')}
                  </p>
                </div>
              )}

              {/* Payment Method Selection */}
              <div className="mb-6">
                <div className="space-y-3">
                  <Button
                    className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handlePaymentMethodSelect("razorpay")}
                  >
                    <span className="mr-2"><ReceiptIndianRupeeIcon></ReceiptIndianRupeeIcon></span>
                    Pay with Razorpay
                  </Button>
                  <Button
                    className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handlePaymentMethodSelect("cash")}
                  >
                    <span className="mr-2"><IndianRupee /></span>
                    Cash on Delivery
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowPaymentOptions(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Order Confirmation Popup */}
        {showOrderPopup && lastOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-2">Order Confirmed</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Thank you, {lastOrder.userName || 'User'}! Your order has been placed successfully.
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Order Time</span>
                  <span>{new Date(lastOrder.createdAt || Date.now()).toLocaleString()}</span>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Items</p>
                  <div className="text-xs text-muted-foreground grid gap-1">
                    {(lastOrder.items || []).map((it: any, i: number) => (
                      <div key={i}>{it.name} ×{it.quantity} (₹{it.price})</div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="font-semibold">Total</span>
                  <span className="font-semibold">₹{lastOrder.totalAmount}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button className="flex-1 bg-quicktap-teal hover:bg-quicktap-teal/90 text-white" onClick={() => setShowOrderPopup(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DefaultLayout>
  );
}
