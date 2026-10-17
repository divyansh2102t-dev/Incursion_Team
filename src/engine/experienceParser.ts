import { WorkExperienceItem, ClubActivityItem, MemberProfile, CustomKeywordWeight, WorkExperienceConfig } from '@/types';

/**
 * Premier Tier-1 Research Institutes & Labs (India & Global)
 */
const TIER1_RESEARCH_INSTITUTES = [
  // IITs
  /\bIIT\s*(?:Bombay|Delhi|Madras|Kharagpur|Kanpur|Roorkee|Guwahati|Hyderabad|BHU|Varanasi|Indore|Gandhinagar|Bhubaneswar|Ropar|Patna|Mandi|Jodhpur|Tirupati|Palakkad|Goa|Jammu|Dharwad|Bhilai)?\b/i,
  /\bIndian\s*Institute\s*of\s*Technology\b/i,

  // NITs
  /\bNIT\s*(?:Trichy|Tiruchirappalli|Surathkal|Karnataka|Warangal|Rourkela|Nagpur|VNIT|Jaipur|MNIT|Allahabad|MNNIT|Calicut|Durgapur|Silchar|Hamirpur|Kurukshetra|Jamshedpur|Bhopal|MANIT|Surat|SVNIT|Patna|Raipur|Meghalaya)?\b/i,
  /\bNational\s*Institute\s*of\s*Technology\b/i,

  // IIITs
  /\bIIIT\s*(?:Hyderabad|Bangalore|Delhi|Allahabad|Gwalior|Jabalpur|Kancheepuram)?\b/i,
  /\bIndian\s*Institute\s*of\s*Information\s*Technology\b/i,

  // Indian Premier Research Labs & Universities
  /\bIISc\b|\bIndian\s*Institute\s*of\s*Science\b/i,
  /\bBITS\s*Pilani\b|\bBirla\s*Institute\s*of\s*Technology\b/i,
  /\bTIFR\b|\bTata\s*Institute\s*of\s*Fundamental\s*Research\b/i,
  /\bISRO\b|\bIndian\s*Space\s*Research\s*Organisation\b/i,
  /\bDRDO\b|\bDefence\s*Research\b/i,
  /\bCSIR\b|\bC-DAC\b/i,

  // Global Elite Universities & Research Labs
  /\bMIT\b|\bMassachusetts\s*Institute\s*of\s*Technology\b/i,
  /\bStanford\b/i,
  /\bCarnegie\s*Mellon\b|\bCMU\b/i,
  /\bHarvard\b/i,
  /\bUC\s*Berkeley\b|\bUniversity\s*of\s*California[,\s]*Berkeley\b/i,
  /\bOxford\b|\bCambridge\b/i,
  /\bPrinceton\b|\bCaltech\b/i,
  /\bETH\s*Zurich\b|\bEPFL\b/i,
  /\bNUS\b|\bNational\s*University\s*of\s*Singapore\b/i,
  /\bNTU\b|\bNanyang\s*Technological\s*University\b/i,
  /\bMax\s*Planck\b/i,
  /\bCERN\b/i,
];

const RESEARCH_ROLE_PATTERNS = [
  /\b(?:research\s*(?:intern|fellow|assistant|scholar|associate)|undergraduate\s*researcher|visiting\s*(?:researcher|student|fellow)|project\s*intern|summer\s*research\s*intern|lab\s*intern|lab\s*assistant|student\s*researcher)\b/i,
  /\b(?:research\s*project|scientific\s*intern|co-author|published\s*paper|paper\s*accepted)\b/i,
];

/**
 * Famous / Tier-1 Global Tech Companies & High-Value Unicorns
 */
const TIER1_COMPANIES: Array<{ name: string; pattern: RegExp }> = [
  // FAANG / Big Tech
  { name: 'Google', pattern: /\b(?:google|alphabet)\b/i },
  { name: 'Microsoft', pattern: /\bmicrosoft\b/i },
  { name: 'Amazon / AWS', pattern: /\b(?:amazon|aws|amazon\s*web\s*services)\b/i },
  { name: 'Meta / Facebook', pattern: /\b(?:meta|facebook|instagram)\b/i },
  { name: 'Apple', pattern: /\bapple\b/i },
  { name: 'Netflix', pattern: /\bnetflix\b/i },

  // AI & Global Tech Titans
  { name: 'Nvidia', pattern: /\bnvidia\b/i },
  { name: 'OpenAI', pattern: /\bopenai\b/i },
  { name: 'Uber', pattern: /\buber\b/i },
  { name: 'Stripe', pattern: /\bstripe\b/i },
  { name: 'Databricks', pattern: /\bdatabricks\b/i },
  { name: 'Snowflake', pattern: /\bsnowflake\b/i },
  { name: 'Palantir', pattern: /\bpalantir\b/i },
  { name: 'Salesforce', pattern: /\bsalesforce\b/i },
  { name: 'Adobe', pattern: /\badobe\b/i },
  { name: 'Atlassian', pattern: /\batlassian\b/i },
  { name: 'Oracle', pattern: /\boracle\b/i },
  { name: 'Cisco', pattern: /\bcisco\b/i },
  { name: 'Intel', pattern: /\bintel\b/i },
  { name: 'AMD', pattern: /\bamd\b/i },
  { name: 'IBM', pattern: /\bibm\b/i },
  { name: 'Qualcomm', pattern: /\bqualcomm\b/i },
  { name: 'Twitter / X', pattern: /\b(?:twitter|x\s*corp)\b/i },
  { name: 'ByteDance', pattern: /\b(?:bytedance|tiktok)\b/i },
  { name: 'Airbnb', pattern: /\bairbnb\b/i },
  { name: 'Spotify', pattern: /\bspotify\b/i },
  { name: 'Coinbase', pattern: /\bcoinbase\b/i },
  { name: 'GitHub', pattern: /\bgithub\b/i },

  // Premier Quant & Fintech
  { name: 'Goldman Sachs', pattern: /\bgoldman\s*sachs\b/i },
  { name: 'Morgan Stanley', pattern: /\bmorgan\s*stanley\b/i },
  { name: 'Jane Street', pattern: /\bjane\s*street\b/i },
  { name: 'Citadel', pattern: /\bcitadel\b/i },
  { name: 'D.E. Shaw', pattern: /\bd\.?\s*e\.?\s*shaw\b/i },
  { name: 'Two Sigma', pattern: /\btwo\s*sigma\b/i },
  { name: 'Bloomberg', pattern: /\bbloomberg\b/i },
  { name: 'JPMorgan', pattern: /\bjpmorgan|\bj\.p\.\s*morgan\b/i },

  // Premier Tech Unicorns (India & Global)
  { name: 'Flipkart', pattern: /\bflipkart\b/i },
  { name: 'Swiggy', pattern: /\bswiggy\b/i },
  { name: 'Zomato', pattern: /\bzomato\b/i },
  { name: 'Razorpay', pattern: /\brazorpay\b/i },
  { name: 'Cred', pattern: /\bcred\b/i },
  { name: 'Postman', pattern: /\bpostman\b/i },
  { name: 'Hasura', pattern: /\bhasura\b/i },
  { name: 'Groww', pattern: /\bgroww\b/i },
  { name: 'PhonePe', pattern: /\bphonepe\b/i },
  { name: 'Zepto', pattern: /\bzepto\b/i },
  { name: 'Zoho', pattern: /\bzoho\b/i },
  { name: 'Freshworks', pattern: /\bfreshworks\b/i },
];

/**
 * Spam / Fake Work Experience Indicators
 */
const SPAM_WORK_PATTERNS: Array<{ reason: string; pattern: RegExp }> = [
  {
    reason: 'Paid training course or certificate disguised as employment',
    pattern: /\b(?:training\s*cum\s*internship|virtual\s*(?:internship|experience\s*program)|certificate\s*course|summer\s*training\s*at|trainee\s*at\s*(?:training|institute|academy|classes))\b/i,
  },
  {
    reason: 'Unverified self-proclaimed founder/CEO on single-person project',
    pattern: /\b(?:founder|ceo|co-founder)\s*(?:at|of)\s*(?:stealth|myself|self|freelance|independent|personal\s*project)\b/i,
  },
  {
    reason: 'Vague generic placeholder without recognizable company name',
    pattern: /\b(?:software|web|frontend|backend)\s*intern\s*at\s*(?:independent|freelance|client|self-employed|startup\s*project)\b/i,
  },
  {
    reason: 'Ultra-short superficial program duration (< 2 weeks)',
    pattern: /\b(?:1\s*week|2\s*weeks?|5\s*days?|10\s*days?)\s*(?:internship|program|experience)\b/i,
  },
];

/**
 * College Clubs & Extracurricular Activities
 */
const HIGH_IMPACT_CLUB_ROLES = [
  /\b(?:lead|lead\s*organizer|president|chairperson|chair|vice\s*president|vice\s*chair|head|convener|organizer|secretary|director)\b/i,
];

const GENERAL_CLUB_ROLES = [
  /\b(?:core\s*team|coordinator|executive\s*member|technical\s*lead|web\s*lead|mentor|member|volunteer)\b/i,
];

const CLUB_ORGANIZATIONS = [
  { name: 'GDSC (Google Developer Student Clubs)', pattern: /\b(?:gdsc|google\s*developer\s*student\s*clubs?)\b/i },
  { name: 'IEEE Student Branch', pattern: /\bieee(?:\s*student\s*branch|\s*sb|\s*chapter)?\b/i },
  { name: 'ACM Student Chapter', pattern: /\bacm(?:\s*student\s*chapter)?\b/i },
  { name: 'E-Cell (Entrepreneurship Cell)', pattern: /\b(?:e-?cell|entrepreneurship\s*cell)\b/i },
  { name: 'Coding / Programming Club', pattern: /\b(?:coding\s*club|programming\s*club|codechef\s*chapter|geeksforgeeks\s*chapter|gfg\s*chapter)\b/i },
  { name: 'Robotics & Automation Club', pattern: /\b(?:robotics\s*club|automation\s*society)\b/i },
  { name: 'AI / ML Society', pattern: /\b(?:ai\s*club|ml\s*club|data\s*science\s*club|artificial\s*intelligence\s*society)\b/i },
  { name: 'Open Source / FOSS Society', pattern: /\b(?:open\s*source\s*society|foss\s*club|linux\s*user\s*group|lug)\b/i },
  { name: 'Hackathon Organizing Committee', pattern: /\b(?:hackathon\s*(?:organizer|lead|convenor|core\s*team)|tedx\s*(?:organizer|team))\b/i },
  { name: 'Rotaract / Enactus Society', pattern: /\b(?:rotaract|enactus)\b/i },
];

export interface ExtractedExperienceAnalysis {
  workExperiences: WorkExperienceItem[];
  clubActivities: ClubActivityItem[];
  matchedCustomKeywords: string[];
  hasResearchInternship: boolean;
  hasTier1Company: boolean;
  hasSpamExperience: boolean;
  hasClubLeadership: boolean;
  rawExperienceScoreBonus: number;
}

/**
 * Analyzes raw resume text and discovers work experiences, research internships (IIT/NIT/IIIT),
 * tier-1 famous companies, spam work experiences, and club/leadership roles.
 */
export function extractWorkAndClubExperiences(
  text: string,
  customKeywords: Array<{ keyword: string; weight: number }> = []
): ExtractedExperienceAnalysis {
  if (!text || text.trim().length === 0) {
    return {
      workExperiences: [],
      clubActivities: [],
      matchedCustomKeywords: [],
      hasResearchInternship: false,
      hasTier1Company: false,
      hasSpamExperience: false,
      hasClubLeadership: false,
      rawExperienceScoreBonus: 0,
    };
  }

  const workExperiences: WorkExperienceItem[] = [];
  const clubActivities: ClubActivityItem[] = [];
  const cleanText = text.replace(/\r\n/g, '\n');

  // 1. Scan for Research Internships in IIT/NIT/IIIT and Top Research Labs
  const isResearchRole = RESEARCH_ROLE_PATTERNS.some((p) => p.test(cleanText));
  const matchedResearchInstitute = TIER1_RESEARCH_INSTITUTES.find((p) => p.test(cleanText));

  if (isResearchRole && matchedResearchInstitute) {
    const match = cleanText.match(matchedResearchInstitute);
    const instituteName = match ? match[0].trim() : 'Tier-1 Research Institute';
    workExperiences.push({
      title: 'Research Intern / Scholar',
      organization: instituteName,
      isResearchInternship: true,
      isTier1Company: false,
      isSpamOrSuspicious: false,
    });
  }

  // 2. Scan for Tier-1 Famous Companies
  for (const comp of TIER1_COMPANIES) {
    if (comp.pattern.test(cleanText)) {
      // Check if this appears in an employment/work context (intern, engineer, developer, analyst)
      const workContextRegex = new RegExp(
        `(?:intern|engineer|developer|analyst|associate|specialist|designer|co-op)\\s*(?:at|@|in)?\\s*${comp.name}|${comp.name}\\s*(?:-|\\||•)\\s*(?:intern|engineer|developer|sde)`,
        'i'
      );
      const isEmployedThere = workContextRegex.test(cleanText) || cleanText.toLowerCase().includes(`at ${comp.name.toLowerCase()}`);

      if (isEmployedThere || cleanText.includes(comp.name)) {
        // Prevent duplicate additions
        if (!workExperiences.some((w) => w.organization.toLowerCase() === comp.name.toLowerCase())) {
          workExperiences.push({
            title: 'Software / Engineering Intern',
            organization: comp.name,
            isResearchInternship: false,
            isTier1Company: true,
            isSpamOrSuspicious: false,
          });
        }
      }
    }
  }

  // 3. Scan for Spam / Fake Work Experiences
  for (const spam of SPAM_WORK_PATTERNS) {
    const match = cleanText.match(spam.pattern);
    if (match) {
      workExperiences.push({
        title: 'Unverified / Course Certificate Experience',
        organization: match[0].trim(),
        isResearchInternship: false,
        isTier1Company: false,
        isSpamOrSuspicious: true,
        suspiciousReason: spam.reason,
      });
      break;
    }
  }

  // 4. Scan for Clubs & Extracurricular Leadership
  for (const club of CLUB_ORGANIZATIONS) {
    if (club.pattern.test(cleanText)) {
      const isHighImpact = HIGH_IMPACT_CLUB_ROLES.some((r) => r.test(cleanText));
      const isGeneralRole = GENERAL_CLUB_ROLES.some((r) => r.test(cleanText));

      let roleTitle = 'Member / Core Team';
      if (isHighImpact) {
        const roleMatch = cleanText.match(/(?:lead|president|chairperson|chair|head|convener|organizer|secretary)/i);
        roleTitle = roleMatch ? roleMatch[0].toUpperCase() : 'LEAD';
      }

      if (isHighImpact || isGeneralRole || cleanText.includes(club.name)) {
        clubActivities.push({
          role: roleTitle,
          clubName: club.name,
          isHighImpactLead: isHighImpact,
        });
      }
    }
  }

  // 5. Scan for Explicit Custom Keywords (Case-Insensitive)
  const matchedCustomKeywords: string[] = [];
  for (const ck of customKeywords) {
    const cleanKw = ck.keyword.trim();
    if (!cleanKw) continue;
    // Word boundary or substring regex
    const kwRegex = new RegExp(`(?:\\b|_)${cleanKw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}(?:\\b|_)`, 'i');
    if (kwRegex.test(cleanText)) {
      matchedCustomKeywords.push(cleanKw);
    }
  }

  const hasResearchInternship = workExperiences.some((w) => w.isResearchInternship && !w.isSpamOrSuspicious);
  const hasTier1Company = workExperiences.some((w) => w.isTier1Company && !w.isSpamOrSuspicious);
  const hasSpamExperience = workExperiences.some((w) => w.isSpamOrSuspicious);
  const hasClubLeadership = clubActivities.some((c) => c.isHighImpactLead);

  return {
    workExperiences,
    clubActivities,
    matchedCustomKeywords,
    hasResearchInternship,
    hasTier1Company,
    hasSpamExperience,
    hasClubLeadership,
    rawExperienceScoreBonus: 0,
  };
}

/**
 * Scans candidate across all digital channels (Resume text, GitHub, LinkedIn, form fields)
 * for organizer-defined case-insensitive keywords and calculates point bonuses.
 */
export function matchMemberCustomKeywords(
  member: MemberProfile,
  customKeywords: CustomKeywordWeight[] = []
): { matchedKeywords: string[]; keywordBonusPoints: number } {
  if (!customKeywords || customKeywords.length === 0) {
    return { matchedKeywords: [], keywordBonusPoints: 0 };
  }

  // Aggregate all textual signals for this member
  const textChunks: string[] = [
    member.name || '',
    member.college || '',
    member.roleOrBio || '',
    member.rawSignals.rawTextSummary || '',
    (member.rawSignals.skills || []).join(' '),
    member.rawSignals.githubUsername || '',
    (member.rawSignals.githubMetrics?.topLanguages || []).join(' '),
    member.rawSignals.linkedinMetrics?.headline || '',
    member.rawSignals.linkedinMetrics?.company || '',
    (member.rawSignals.linkedinMetrics?.extractedSkills || []).join(' '),
    (member.rawSignals.matchedCustomKeywords || []).join(' '),
    ...Object.values(member.customFields || {}),
  ];
  const combinedText = textChunks.join(' ');

  const matchedKeywords: string[] = [];
  let keywordBonusPoints = 0;

  for (const kw of customKeywords) {
    // Check if individual keyword is enabled (defaults to true if undefined)
    if (kw.enabled === false) continue;
    const rawKw = kw.keyword.trim();
    if (!rawKw) continue;
    const escaped = rawKw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(?:\\b|_)${escaped}(?:\\b|_)`, 'i');
    if (regex.test(combinedText)) {
      matchedKeywords.push(rawKw);
      keywordBonusPoints += kw.weight;
    }
  }

  return { matchedKeywords, keywordBonusPoints };
}

export interface TeamExperienceEvaluation {
  experienceScore: number;
  keywordScore: number;
  allMatchedKeywords: string[];
  spamWarnings: string[];
  hasResearchInternship: boolean;
  hasTier1Company: boolean;
  hasClubLeadership: boolean;
  researchCount: number;
  tier1Count: number;
  clubsCount: number;
}

/**
 * Calculates experience score for a team considering research internships,
 * tier-1 global companies, clubs, spam discounts, and organizer weights.
 */
export function evaluateTeamExperienceAndKeywords(
  members: MemberProfile[],
  workConfig?: WorkExperienceConfig,
  customKeywords: CustomKeywordWeight[] = []
): TeamExperienceEvaluation {
  const result: TeamExperienceEvaluation = {
    experienceScore: 0,
    keywordScore: 0,
    allMatchedKeywords: [],
    spamWarnings: [],
    hasResearchInternship: false,
    hasTier1Company: false,
    hasClubLeadership: false,
    researchCount: 0,
    tier1Count: 0,
    clubsCount: 0,
  };

  const isKeywordsEnabled = workConfig?.customKeywordsEnabled !== false;
  const isExpEnabled = workConfig?.enabled !== false;

  // 1. Evaluate Custom Keywords across members
  if (isKeywordsEnabled && customKeywords.length > 0) {
    const matchedSet = new Set<string>();
    let totalKwPoints = 0;

    for (const member of members) {
      const { matchedKeywords, keywordBonusPoints } = matchMemberCustomKeywords(member, customKeywords);
      matchedKeywords.forEach((kw) => matchedSet.add(kw));
      totalKwPoints += keywordBonusPoints;
    }

    result.allMatchedKeywords = Array.from(matchedSet);
    result.keywordScore = totalKwPoints;
  }

  // 2. Evaluate Work Experiences & Clubs across members
  if (isExpEnabled && workConfig) {
    const isBaseExpOn = workConfig.baseWorkExpEnabled !== false;
    const isResearchOn = workConfig.researchInternshipEnabled !== false;
    const isTier1On = workConfig.tier1CompanyEnabled !== false;
    const isClubLeadershipOn = workConfig.clubLeadershipEnabled !== false;
    const isSpamPenaltyOn = workConfig.penalizeSpam !== false;

    let teamExpPoints = 0;

    for (const member of members) {
      let memberExpPoints = 0;
      const exps = member.rawSignals.workExperiences || [];
      const clubs = member.rawSignals.clubActivities || [];

      let hasMemberSpam = false;

      for (const exp of exps) {
        if (exp.isSpamOrSuspicious) {
          hasMemberSpam = true;
          result.spamWarnings.push(
            `Member ${member.name}: ${exp.suspiciousReason || 'Unverified or certificate experience'}`
          );
        } else if (exp.isResearchInternship) {
          result.hasResearchInternship = true;
          result.researchCount++;
          if (isResearchOn) {
            memberExpPoints += workConfig.researchInternshipBonus;
          }
        } else if (exp.isTier1Company) {
          result.hasTier1Company = true;
          result.tier1Count++;
          if (isTier1On) {
            memberExpPoints += workConfig.tier1CompanyBonus;
          }
        } else {
          // Standard verified experience
          if (isBaseExpOn) {
            memberExpPoints += workConfig.baseWorkExpPoints;
          }
        }
      }

      for (const club of clubs) {
        result.clubsCount++;
        if (club.isHighImpactLead) {
          result.hasClubLeadership = true;
          if (isClubLeadershipOn) {
            memberExpPoints += workConfig.clubLeadershipBonus;
          }
        } else {
          memberExpPoints += workConfig.clubMemberBonus || 5;
        }
      }

      // Apply spam penalty if detected for this member
      if (hasMemberSpam && isSpamPenaltyOn) {
        memberExpPoints = Math.round(memberExpPoints * (workConfig.spamPenaltyDiscount ?? 0.5));
      }

      teamExpPoints += memberExpPoints;
    }

    // Cap at organizer-configured max
    result.experienceScore = Math.min(workConfig.maxTotalExperiencePoints || 50, teamExpPoints);
  }

  return result;
}
