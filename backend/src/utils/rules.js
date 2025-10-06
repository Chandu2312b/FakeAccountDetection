// Deterministic, explainable rule engine. No ML.
// Each rule contributes a weighted risk. Total risk is mapped to Trust Score (0-100).

/*
Explainable, proportional rule weights (max total 100):
- Honeypot interaction: up to 25 (binary)
- High post rate: up to 15 (scaled by posts/day ~ 0 → 40+)
- Follow spikes: up to 15 (scaled by follows/day ~ 0 → 100+)
- Duplicate content: up to 10 (scaled by duplicates ~ 0 → 10+)
- IP sharing: up to 10 (scaled by cluster size ~ 0 → 10+)
- Account freshness: up to 15 (scaled by age 0 → 30 days)
- Low follower ratio: up to 10 (scaled by ratio 0.02 → 0.3)
TrustScore = max(0, 100 - totalRisk). Category: 0–30 Safe, 31–60 Suspicious, 61+ High Risk.
*/

const WEIGHTS = {
  HONEYPOT: 25,
  HIGH_POST_RATE: 15,
  FOLLOW_SPIKE: 15,
  DUP_CONTENT: 10,
  IP_SHARING: 10,
  FRESH_ACCOUNT: 15,
  LOW_FOLLOWER_RATIO: 10
};

export function computeRiskAndTrust(input) {
  const {
    followerCount = 0,
    followingCount = 0,
    postsCount = 0,
    accountAgeDays = 0,
    samplePost = '',
    isHoneypotInteractor = false,
    duplicateContentCount = 0,
    sharedIpCount = 0,
    recentPostsPerDay = 0,
    recentFollowsPerDay = 0
  } = input;

  let totalRisk = 0;
  const reasons = [];
  const evidence = {};

  if (isHoneypotInteractor) {
    totalRisk += WEIGHTS.HONEYPOT;
    reasons.push('HONEYPOT_INTERACTION');
    evidence.honeypotInteractions = 1;
  }

  // Derive posts/day from lifetime as a fallback if recent not available
  const lifetimePostsPerDay = accountAgeDays > 0 ? postsCount / Math.max(1, accountAgeDays) : 0;
  const postsPerDay = recentPostsPerDay || lifetimePostsPerDay;
  // Scale: 0 risk at <=5/day, max risk at >=40/day
  const postRateNorm = Math.max(0, Math.min(1, (postsPerDay - 5) / (40 - 5)));
  if (postRateNorm > 0) {
    const add = +(WEIGHTS.HIGH_POST_RATE * postRateNorm).toFixed(2);
    totalRisk += add;
    reasons.push('HIGH_POST_RATE');
    evidence.postsPerDay = +postsPerDay.toFixed(2);
  }

  // Derive follows/day from lifetime following increase as fallback
  const lifetimeFollowsPerDay = accountAgeDays > 0 ? followingCount / Math.max(1, accountAgeDays) : 0;
  const followsPerDay = recentFollowsPerDay || lifetimeFollowsPerDay;
  // Scale: 0 risk at <=10/day, max at >=100/day
  const followRateNorm = Math.max(0, Math.min(1, (followsPerDay - 10) / (100 - 10)));
  if (followRateNorm > 0) {
    const add = +(WEIGHTS.FOLLOW_SPIKE * followRateNorm).toFixed(2);
    totalRisk += add;
    reasons.push('FOLLOW_SPIKE');
    evidence.followsPerDay = +followsPerDay.toFixed(2);
  }

  const hasSpamPhrase = !!(samplePost && samplePost.toLowerCase().match(/free\s+(crypto|gift|airdrop)/));
  // Scale duplicate content: 0 at 0, max at >=10
  const dupNorm = Math.max(0, Math.min(1, (duplicateContentCount + (hasSpamPhrase ? 3 : 0)) / 10));
  if (dupNorm > 0) {
    const add = +(WEIGHTS.DUP_CONTENT * dupNorm).toFixed(2);
    totalRisk += add;
    reasons.push('DUPLICATE_CONTENT');
    evidence.duplicateContentCount = duplicateContentCount;
    if (hasSpamPhrase) evidence.spamPhrase = true;
  }

  // Scale IP sharing: 0 at 0-1, max at >=10
  const ipNorm = Math.max(0, Math.min(1, (sharedIpCount - 1) / (10 - 1)));
  if (ipNorm > 0) {
    const add = +(WEIGHTS.IP_SHARING * ipNorm).toFixed(2);
    totalRisk += add;
    reasons.push('IP_SHARING');
    evidence.sharedIpCount = sharedIpCount;
  }

  // Freshness: scale 0..30 days from max to 0
  const freshNorm = Math.max(0, Math.min(1, (30 - Math.min(30, accountAgeDays)) / 30));
  if (freshNorm > 0) {
    const add = +(WEIGHTS.FRESH_ACCOUNT * freshNorm).toFixed(2);
    totalRisk += add;
    reasons.push('FRESH_ACCOUNT');
    evidence.accountAgeDays = accountAgeDays;
  }

  const followerRatio = followingCount > 0 ? followerCount / followingCount : 0;
  // Low ratio scaling: 0 risk at >=0.3 or following small; max risk at <=0.02 with following>50
  const ratioNormBase = followerRatio >= 0.3 ? 0 : Math.max(0, Math.min(1, (0.3 - Math.max(0.02, followerRatio)) / (0.3 - 0.02)));
  const ratioNorm = (followingCount > 50) ? ratioNormBase : 0;
  if (ratioNorm > 0) {
    const add = +(WEIGHTS.LOW_FOLLOWER_RATIO * ratioNorm).toFixed(2);
    totalRisk += add;
    reasons.push('LOW_FOLLOWER_RATIO');
    evidence.followerRatio = Number(followerRatio.toFixed(3));
  }

  const trustScore = Math.max(0, Math.round(100 - totalRisk));
  let riskCategory = 'Safe';
  if (totalRisk >= 61) riskCategory = 'High Risk';
  else if (totalRisk >= 31) riskCategory = 'Suspicious';

  return {
    trustScore,
    riskCategory,
    totalRisk: +totalRisk.toFixed(2),
    reasonCodes: reasons,
    evidence
  };
}


