// Intelligent Gender Detection Engine for Hackathon Recruitment & SIH Diversity Compliance
// Evaluates explicit registration column data, pronouns in bio, and first-name heuristics.

export const FEMALE_FIRST_NAMES = new Set([
  // Indian / South Asian Common Female Names
  'priya', 'neha', 'ananya', 'pooja', 'shreya', 'sneha', 'riya', 'aditi', 'divya', 'tanvi',
  'aarohi', 'kavya', 'isha', 'meera', 'nikita', 'ishita', 'nisha', 'maya', 'shruti', 'anjali',
  'swati', 'ritu', 'simran', 'deepa', 'sonia', 'rhea', 'kriti', 'preeti', 'sunita', 'rekha',
  'aishwarya', 'deepika', 'vidya', 'vidhi', 'diya', 'khushi', 'parul', 'richa', 'komal', 'radhika',
  'pallavi', 'megha', 'shweta', 'sakshi', 'srishti', 'drishti', 'trisha', 'payal', 'akanksha',
  'shivani', 'mansi', 'garima', 'bhavya', 'chetna', 'hema', 'geeta', 'sushma', 'rashmi', 'chhavi',
  'sonam', 'twinkle', 'roshni', 'muskan', 'palak', 'vanshika', 'sanjana', 'harshita', 'nandini',
  'shubhangi', 'vaishnavi', 'purvi', 'charu', 'tanu', 'tripti', 'barkha', 'mahi', 'anushka',
  'jhanvi', 'janvi', 'sheetal', 'suhani', 'tara', 'kiran', 'jyoti', 'mona', 'madhu', 'lata',
  'seema', 'sapna', 'shalini', 'alpana', 'archana', 'anupama', 'vartika', 'ritika', 'ruchika',
  'aradhana', 'alisha', 'tamanna', 'hena', 'niharika', 'pragya', 'prerna', 'prachi', 'devika',
  'juhi', 'dimple', 'raveena', 'kajol', 'amrita', 'kareena', 'karishma', 'madhuri', 'sridevi',

  // Anglo, Western & Latin Common Female Names
  'sarah', 'emily', 'jessica', 'emma', 'sophia', 'olivia', 'ava', 'mia', 'isabella', 'chloe',
  'anna', 'maria', 'elena', 'camila', 'amelia', 'harper', 'evelyn', 'abigail', 'ella', 'elizabeth',
  'sofia', 'avery', 'scarlett', 'grace', 'victoria', 'riley', 'aria', 'lily', 'aubrey', 'zoey',
  'hannah', 'layla', 'nora', 'lillian', 'addison', 'willow', 'lucy', 'stella', 'natalie', 'hazel',
  'violet', 'aurora', 'savannah', 'audrey', 'brooklyn', 'bella', 'claire', 'skylar', 'zoe', 'leah',
  'caroline', 'genesis', 'aaliyah', 'kennedy', 'kinsley', 'allison', 'alice', 'gabriella', 'madelyn',
  'cora', 'ruby', 'eva', 'serenity', 'autumn', 'adeline', 'hailey', 'gianna', 'valentina', 'isla',
  'eliana', 'quinn', 'sadie', 'piper', 'lydia', 'alexa', 'josephine', 'emery', 'julia', 'delilah',
  'ariana', 'vivian', 'kaylee', 'sophie', 'brielle', 'madeline', 'peyton', 'rylee', 'clara', 'hadley',
  'melanie', 'mackenzie', 'reagan', 'adalynn', 'liliana', 'aubree', 'jade', 'katherine', 'isabelle',
  'natalia', 'amy', 'laura', 'rachel', 'rebecca', 'michelle', 'stephanie', 'nicole', 'amanda',
  'jennifer', 'melissa', 'samantha', 'angela', 'heather', 'tiffany', 'christina', 'lisa', 'kelly',
  'mary', 'patricia', 'linda', 'barbara', 'susan', 'margaret', 'dorothy', 'betty', 'helen',

  // Asian & Middle Eastern Common Female Names
  'zainab', 'fatima', 'ayesha', 'mariam', 'noor', 'leila', 'layla', 'yuki', 'mei', 'lin',
  'sakura', 'hana', 'yuna', 'min', 'jiwoo', 'soojin', 'chae', 'hye', 'ji', 'wei', 'ting',
  'yan', 'fang', 'jing', 'xia', 'lian', 'hena'
]);

export interface GenderDetectionResult {
  isFemale: boolean;
  gender: 'female' | 'male' | 'non_binary' | 'other' | 'unspecified';
  confidence: 'explicit' | 'pronoun' | 'name_heuristic' | 'none';
  matchReason?: string;
}

export function detectMemberGender(params: {
  rawGender?: string;
  name?: string;
  roleOrBio?: string;
}): GenderDetectionResult {
  const { rawGender, name, roleOrBio } = params;

  // 1. Explicit Gender Column (highest authority)
  if (rawGender && rawGender.trim()) {
    const cleanGender = rawGender.trim().toLowerCase();

    if (
      cleanGender === 'female' ||
      cleanGender === 'f' ||
      cleanGender === 'woman' ||
      cleanGender === 'women' ||
      cleanGender === 'girl' ||
      cleanGender === 'she/her' ||
      cleanGender === 'she'
    ) {
      return {
        isFemale: true,
        gender: 'female',
        confidence: 'explicit',
        matchReason: `Declared in registration: "${rawGender.trim()}"`,
      };
    }

    if (
      cleanGender === 'male' ||
      cleanGender === 'm' ||
      cleanGender === 'man' ||
      cleanGender === 'men' ||
      cleanGender === 'boy' ||
      cleanGender === 'he/him' ||
      cleanGender === 'he'
    ) {
      return {
        isFemale: false,
        gender: 'male',
        confidence: 'explicit',
        matchReason: `Declared in registration: "${rawGender.trim()}"`,
      };
    }

    if (cleanGender.includes('non-binary') || cleanGender.includes('non binary')) {
      return {
        isFemale: false,
        gender: 'non_binary',
        confidence: 'explicit',
        matchReason: 'Non-binary',
      };
    }
  }

  // 2. Pronoun & Keyword Signals in bio / role
  if (roleOrBio && roleOrBio.trim()) {
    const lowerBio = roleOrBio.toLowerCase();

    if (/\b(she\/her|she\s*\/\s*her|ms\.|mrs\.|female developer|women in tech|girl hacker)\b/i.test(lowerBio)) {
      return {
        isFemale: true,
        gender: 'female',
        confidence: 'pronoun',
        matchReason: 'Pronoun / Female identity in bio ("she/her")',
      };
    }

    if (/\b(he\/him|he\s*\/\s*him|mr\.)\b/i.test(lowerBio)) {
      return {
        isFemale: false,
        gender: 'male',
        confidence: 'pronoun',
        matchReason: 'Pronoun in bio ("he/him")',
      };
    }
  }

  // 3. First-Name Heuristic Dictionary (Indian & Global coverage)
  if (name && name.trim()) {
    // Extract first token/given name
    const cleanName = name.trim().toLowerCase().replace(/[^a-z\s]/g, '');
    const tokens = cleanName.split(/\s+/).filter(Boolean);
    const firstName = tokens[0] || '';

    if (firstName && FEMALE_FIRST_NAMES.has(firstName)) {
      return {
        isFemale: true,
        gender: 'female',
        confidence: 'name_heuristic',
        matchReason: `Name pattern match: "${firstName.toUpperCase()}"`,
      };
    }
  }

  // Default unspecified
  return {
    isFemale: false,
    gender: 'unspecified',
    confidence: 'none',
  };
}
