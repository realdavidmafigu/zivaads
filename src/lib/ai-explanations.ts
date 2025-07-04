export interface PerformanceMetrics {
  ctr: number;
  cpm: number;
  cpc: number;
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  frequency: number;
}

export interface ExplanationResult {
  text: string;
  sentiment: 'good' | 'okay' | 'problem';
  emoji: string;
  color: 'green' | 'yellow' | 'red';
}

export interface AIInsight {
  what: string;
  why: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

// Convert CTR to plain English
export function explainCTR(ctr: number): ExplanationResult {
  const clicksPer100 = Math.round(ctr * 100);
  
  if (ctr >= 3.0) {
    return {
      text: `${clicksPer100} out of 100 people clicked your ad - this is excellent! Most businesses get 1-2 clicks per 100 views.`,
      sentiment: 'good',
      emoji: '😊',
      color: 'green'
    };
  } else if (ctr >= 1.5) {
    return {
      text: `${clicksPer100} out of 100 people clicked your ad - this is good. You're doing better than average.`,
      sentiment: 'okay',
      emoji: '😐',
      color: 'yellow'
    };
  } else {
    return {
      text: `${clicksPer100} out of 100 people clicked your ad - this is low. People aren't very interested in your ad.`,
      sentiment: 'problem',
      emoji: '😟',
      color: 'red'
    };
  }
}

// Convert CPM to local context
export function explainCPM(cpm: number): ExplanationResult {
  const costPer1000 = cpm / 100; // Convert to dollars per 1000 impressions
  
  if (cpm <= 5) {
    return {
      text: `It costs you $${costPer1000.toFixed(2)} to reach 1,000 people - this is very cheap! You're getting great value.`,
      sentiment: 'good',
      emoji: '😊',
      color: 'green'
    };
  } else if (cpm <= 15) {
    return {
      text: `It costs you $${costPer1000.toFixed(2)} to reach 1,000 people - this is reasonable for your market.`,
      sentiment: 'okay',
      emoji: '😐',
      color: 'yellow'
    };
  } else {
    return {
      text: `It costs you $${costPer1000.toFixed(2)} to reach 1,000 people - this is expensive. You might want to adjust your targeting.`,
      sentiment: 'problem',
      emoji: '😟',
      color: 'red'
    };
  }
}

// Convert CPC to understandable terms
export function explainCPC(cpc: number): ExplanationResult {
  if (cpc <= 0.30) {
    return {
      text: `Each click costs you $${cpc.toFixed(2)} - this is very cheap! You're getting visitors at a great price.`,
      sentiment: 'good',
      emoji: '😊',
      color: 'green'
    };
  } else if (cpc <= 0.80) {
    return {
      text: `Each click costs you $${cpc.toFixed(2)} - this is a fair price for website visitors.`,
      sentiment: 'okay',
      emoji: '😐',
      color: 'yellow'
    };
  } else {
    return {
      text: `Each click costs you $${cpc.toFixed(2)} - this is expensive. You're paying a lot for each visitor.`,
      sentiment: 'problem',
      emoji: '😟',
      color: 'red'
    };
  }
}

// Explain frequency
export function explainFrequency(frequency: number): ExplanationResult {
  if (frequency <= 1.5) {
    return {
      text: `People see your ad ${frequency.toFixed(1)} times on average - this is perfect! Not too much, not too little.`,
      sentiment: 'good',
      emoji: '😊',
      color: 'green'
    };
  } else if (frequency <= 3.0) {
    return {
      text: `People see your ad ${frequency.toFixed(1)} times on average - this is okay, but getting a bit high.`,
      sentiment: 'okay',
      emoji: '😐',
      color: 'yellow'
    };
  } else {
    return {
      text: `People see your ad ${frequency.toFixed(1)} times on average - this is too much! People might get annoyed.`,
      sentiment: 'problem',
      emoji: '😟',
      color: 'red'
    };
  }
}

// Generate performance grade (A-F)
export function performanceGrade(metrics: PerformanceMetrics): string {
  let score = 0;
  
  // CTR scoring (0-25 points)
  if (metrics.ctr >= 3.0) score += 25;
  else if (metrics.ctr >= 1.5) score += 15;
  else if (metrics.ctr >= 0.5) score += 5;
  
  // CPC scoring (0-25 points)
  if (metrics.cpc <= 0.30) score += 25;
  else if (metrics.cpc <= 0.80) score += 15;
  else if (metrics.cpc <= 1.50) score += 5;
  
  // CPM scoring (0-25 points)
  if (metrics.cpm <= 5) score += 25;
  else if (metrics.cpm <= 15) score += 15;
  else if (metrics.cpm <= 30) score += 5;
  
  // Frequency scoring (0-25 points)
  if (metrics.frequency <= 1.5) score += 25;
  else if (metrics.frequency <= 3.0) score += 15;
  else if (metrics.frequency <= 5.0) score += 5;
  
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

// Calculate customer acquisition cost
export function customerCostExplainer(clicks: number, spend: number, conversionRate: number = 0.02): string {
  if (clicks === 0) return "No clicks yet, so we can't calculate customer cost.";
  
  const costPerClick = spend / clicks;
  const estimatedCustomers = Math.round(clicks * conversionRate);
  const customerCost = estimatedCustomers > 0 ? spend / estimatedCustomers : 0;
  
  if (estimatedCustomers === 0) {
    return `Each click costs you $${costPerClick.toFixed(2)}. With typical conversion rates, you might need 50 clicks to get 1 customer.`;
  }
  
  return `Each new customer costs you about $${customerCost.toFixed(2)}. You got ${estimatedCustomers} customers from ${clicks} clicks.`;
}

// Generate AI insights
export function generateAIInsights(metrics: PerformanceMetrics): AIInsight[] {
  const insights: AIInsight[] = [];
  
  // CTR insights
  if (metrics.ctr < 1.0) {
    insights.push({
      what: "Your click-through rate is low",
      why: "People are seeing your ad but not clicking. This could mean your ad image, text, or offer isn't compelling enough.",
      action: "Try changing your ad image, making your headline more exciting, or offering a better deal. Test different versions to see what works.",
      priority: 'high'
    });
  }
  
  // CPM insights
  if (metrics.cpm > 20) {
    insights.push({
      what: "Your ads are expensive to show",
      why: "You're paying a lot to reach people. This might be because your target audience is competitive or your ad quality score is low.",
      action: "Try targeting a broader audience, improving your ad quality, or using different ad formats.",
      priority: 'medium'
    });
  }
  
  // CPC insights
  if (metrics.cpc > 1.0) {
    insights.push({
      what: "Each visitor costs you a lot",
      why: "You're paying more than $1 for each person who clicks. This might be because your competitors are bidding high or your targeting is too narrow.",
      action: "Consider broadening your audience, using different keywords, or improving your ad quality score.",
      priority: 'high'
    });
  }
  
  // Frequency insights
  if (metrics.frequency > 3.0) {
    insights.push({
      what: "People are seeing your ad too much",
      why: "The same people are seeing your ad repeatedly, which can lead to ad fatigue and wasted money.",
      action: "Try reducing your budget, expanding your audience, or creating fresh ad content.",
      priority: 'medium'
    });
  }
  
  // Positive insights
  if (metrics.ctr > 2.5 && metrics.cpc < 0.5) {
    insights.push({
      what: "Your campaign is performing well!",
      why: "You're getting good click rates at a low cost. Your ad is resonating with your audience.",
      action: "Consider increasing your budget to reach more people, or try similar ads for other products.",
      priority: 'low'
    });
  }
  
  return insights;
}

// Generate overall performance summary
export function generatePerformanceSummary(metrics: PerformanceMetrics): string {
  const grade = performanceGrade(metrics);
  const ctrExplanation = explainCTR(metrics.ctr);
  const cpcExplanation = explainCPC(metrics.cpc);
  
  let summary = `Your campaign gets a grade of ${grade}. `;
  
  if (grade === 'A' || grade === 'B') {
    summary += "You're doing great! ";
  } else if (grade === 'C') {
    summary += "You're doing okay, but there's room for improvement. ";
  } else {
    summary += "Your campaign needs some work. ";
  }
  
  summary += `${ctrExplanation.text} ${cpcExplanation.text}`;
  
  return summary;
}

// Convert technical metrics to simple explanations
export function convertToSimpleLanguage(metrics: PerformanceMetrics) {
  return {
    ctr: explainCTR(metrics.ctr),
    cpm: explainCPM(metrics.cpm),
    cpc: explainCPC(metrics.cpc),
    frequency: explainFrequency(metrics.frequency),
    grade: performanceGrade(metrics),
    customerCost: customerCostExplainer(metrics.clicks, metrics.spend),
    insights: generateAIInsights(metrics),
    summary: generatePerformanceSummary(metrics)
  };
} 