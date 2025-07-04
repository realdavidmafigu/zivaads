export interface PerformanceMetrics {
  ctr: number; // Click-through rate (as decimal, e.g., 0.02 for 2%)
  cpc: number; // Cost per click (in USD)
  spend?: number; // Optional: total spend
  clicks?: number; // Optional: total clicks
  impressions?: number; // Optional: total impressions
}

export interface PerformanceResult {
  emoji: string;
  message: string;
  status: 'good' | 'okay' | 'bad';
  suggestions: string[];
}

// Performance thresholds (can be adjusted based on industry standards)
const THRESHOLDS = {
  CTR: {
    GOOD: 0.015, // 1.5% and above
    OKAY: 0.008, // 0.8% to 1.5%
    BAD: 0.008   // Below 0.8%
  },
  CPC: {
    GOOD: 1.50,  // $1.50 and below
    OKAY: 2.50,  // $1.50 to $2.50
    BAD: 2.50    // Above $2.50
  }
};

// Message templates for different performance levels
const MESSAGES = {
  GOOD: [
    "People are clicking! This ad is doing great! 🎉",
    "Excellent performance! Your audience loves this ad!",
    "This ad is a winner! Keep it running!",
    "Great engagement! Your message is resonating well!",
    "Outstanding results! This ad is performing beautifully!"
  ],
  OKAY: [
    "This ad is okay but could do better.",
    "Not bad, but there's room for improvement.",
    "Decent performance - consider some tweaks.",
    "It's working, but we can make it work better.",
    "Average results - let's optimize this!"
  ],
  BAD: [
    "Your ad is tired. Try a new image or message.",
    "This ad needs some love. Time for a refresh!",
    "Not getting the clicks we want. Let's fix this!",
    "Your audience isn't responding. Let's try something new.",
    "This ad needs attention. Time to optimize!"
  ]
};

// Suggestions for improvement
const SUGGESTIONS = {
  GOOD: [
    "Consider increasing budget to scale this success",
    "Test similar creatives to expand on this winning formula",
    "Look for similar audiences to target"
  ],
  OKAY: [
    "Try refreshing the ad creative",
    "Test different ad copy or headlines",
    "Consider adjusting your target audience",
    "Review your landing page for better conversion"
  ],
  BAD: [
    "Create new ad creatives with fresh images",
    "Rewrite your ad copy with stronger calls-to-action",
    "Review and refine your target audience",
    "Check if your landing page is optimized",
    "Consider pausing this ad and starting fresh"
  ]
};

/**
 * Evaluates Facebook ad performance and returns user-friendly feedback
 * @param metrics - Performance metrics object
 * @returns PerformanceResult with emoji, message, status, and suggestions
 */
export function evaluatePerformance(metrics: PerformanceMetrics): PerformanceResult {
  const { ctr, cpc } = metrics;
  
  // Determine CTR performance
  let ctrScore: 'good' | 'okay' | 'bad';
  if (ctr >= THRESHOLDS.CTR.GOOD) {
    ctrScore = 'good';
  } else if (ctr >= THRESHOLDS.CTR.OKAY) {
    ctrScore = 'okay';
  } else {
    ctrScore = 'bad';
  }
  
  // Determine CPC performance
  let cpcScore: 'good' | 'okay' | 'bad';
  if (cpc <= THRESHOLDS.CPC.GOOD) {
    cpcScore = 'good';
  } else if (cpc <= THRESHOLDS.CPC.OKAY) {
    cpcScore = 'okay';
  } else {
    cpcScore = 'bad';
  }
  
  // Overall performance logic
  let overallStatus: 'good' | 'okay' | 'bad';
  let emoji: string;
  
  if (ctrScore === 'good' && cpcScore === 'good') {
    overallStatus = 'good';
    emoji = '😊';
  } else if (ctrScore === 'bad' || cpcScore === 'bad') {
    overallStatus = 'bad';
    emoji = '😟';
  } else {
    overallStatus = 'okay';
    emoji = '😐';
  }
  
  // Special cases for better user experience
  if (ctrScore === 'good' && cpcScore === 'bad') {
    // High CTR but high CPC - might be worth it
    overallStatus = 'okay';
    emoji = '🤔';
  }
  
  if (ctrScore === 'bad' && cpcScore === 'good') {
    // Low CTR but low CPC - might be okay for awareness
    overallStatus = 'okay';
    emoji = '😐';
  }
  
  // Get random message from appropriate category
  const messageArray = MESSAGES[overallStatus.toUpperCase() as keyof typeof MESSAGES];
  const message = messageArray[Math.floor(Math.random() * messageArray.length)];
  
  // Get suggestions
  const suggestions = SUGGESTIONS[overallStatus.toUpperCase() as keyof typeof SUGGESTIONS];
  
  return {
    emoji,
    message,
    status: overallStatus,
    suggestions
  };
}

/**
 * Gets a more detailed explanation based on specific metrics
 * @param metrics - Performance metrics object
 * @returns Detailed explanation string
 */
export function getDetailedExplanation(metrics: PerformanceMetrics): string {
  const { ctr, cpc } = metrics;
  const ctrPercent = (ctr * 100).toFixed(2);
  
  if (ctr >= THRESHOLDS.CTR.GOOD && cpc <= THRESHOLDS.CPC.GOOD) {
    return `Your ad has a great click-through rate of ${ctrPercent}% and costs only $${cpc.toFixed(2)} per click. This is excellent performance!`;
  } else if (ctr >= THRESHOLDS.CTR.GOOD && cpc > THRESHOLDS.CPC.GOOD) {
    return `Your ad gets good clicks (${ctrPercent}%) but costs $${cpc.toFixed(2)} per click. Consider optimizing for lower costs.`;
  } else if (ctr < THRESHOLDS.CTR.OKAY && cpc <= THRESHOLDS.CPC.GOOD) {
    return `Your ad costs only $${cpc.toFixed(2)} per click, but the click rate is low (${ctrPercent}%). Try improving your ad creative.`;
  } else {
    return `Your ad has a low click rate (${ctrPercent}%) and high cost per click ($${cpc.toFixed(2)}). This needs immediate attention.`;
  }
}

/**
 * Gets performance insights for specific metrics
 * @param metrics - Performance metrics object
 * @returns Array of insight strings
 */
export function getPerformanceInsights(metrics: PerformanceMetrics): string[] {
  const insights: string[] = [];
  const { ctr, cpc, spend, clicks, impressions } = metrics;
  
  // CTR insights
  if (ctr >= THRESHOLDS.CTR.GOOD) {
    insights.push("Your click-through rate is above average - great job!");
  } else if (ctr < THRESHOLDS.CTR.OKAY) {
    insights.push("Your click-through rate is below average - consider refreshing your ad creative.");
  }
  
  // CPC insights
  if (cpc <= THRESHOLDS.CPC.GOOD) {
    insights.push("Your cost per click is very efficient!");
  } else if (cpc > THRESHOLDS.CPC.OKAY) {
    insights.push("Your cost per click is higher than ideal - consider optimizing your targeting.");
  }
  
  // Additional insights if we have more data
  if (clicks && impressions) {
    const reachRate = (clicks / impressions) * 100;
    if (reachRate < 0.5) {
      insights.push("Very few people are clicking - your ad might not be resonating with your audience.");
    }
  }
  
  if (spend && clicks) {
    const avgSpendPerClick = spend / clicks;
    if (avgSpendPerClick > 5) {
      insights.push("You're spending a lot per click - consider more targeted advertising.");
    }
  }
  
  return insights;
}

/**
 * Formats CTR for display
 * @param ctr - Click-through rate as decimal
 * @returns Formatted string
 */
export function formatCTR(ctr: number): string {
  return `${(ctr * 100).toFixed(2)}%`;
}

/**
 * Formats CPC for display
 * @param cpc - Cost per click
 * @returns Formatted string
 */
export function formatCPC(cpc: number): string {
  return `$${cpc.toFixed(2)}`;
} 