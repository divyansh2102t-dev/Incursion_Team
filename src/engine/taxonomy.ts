import { RoleCategory } from '@/types';

export interface SkillDefinition {
  name: string;
  category: RoleCategory;
  patterns: RegExp[];
  weight: number;
}

export const SKILL_TAXONOMY: SkillDefinition[] = [
  // Frontend
  { name: 'React', category: 'frontend', patterns: [/\breact(\.js)?\b/i], weight: 1.0 },
  { name: 'Next.js', category: 'frontend', patterns: [/\bnext(\.js)?\b/i], weight: 1.2 },
  { name: 'Vue.js', category: 'frontend', patterns: [/\bvue(\.js)?\b/i], weight: 1.0 },
  { name: 'Angular', category: 'frontend', patterns: [/\bangular\b/i], weight: 1.0 },
  { name: 'Svelte', category: 'frontend', patterns: [/\bsvelte\b/i], weight: 1.1 },
  { name: 'Tailwind CSS', category: 'frontend', patterns: [/\btailwind(css)?\b/i], weight: 1.0 },
  { name: 'TypeScript', category: 'frontend', patterns: [/\btypescript\b|\bts\b/i], weight: 1.1 },
  { name: 'HTML/CSS/JS', category: 'frontend', patterns: [/\b(html5?|css3?|javascript)\b/i], weight: 0.8 },

  // Backend
  { name: 'Node.js', category: 'backend', patterns: [/\bnode(\.js)?\b/i], weight: 1.0 },
  { name: 'Python', category: 'backend', patterns: [/\bpython\b/i], weight: 1.0 },
  { name: 'FastAPI', category: 'backend', patterns: [/\bfastapi\b/i], weight: 1.1 },
  { name: 'Django / Flask', category: 'backend', patterns: [/\b(django|flask)\b/i], weight: 1.0 },
  { name: 'Go (Golang)', category: 'backend', patterns: [/\b(golang|go)\b/i], weight: 1.2 },
  { name: 'Rust', category: 'backend', patterns: [/\brust\b/i], weight: 1.3 },
  { name: 'Java / Spring', category: 'backend', patterns: [/\b(spring\s*boot|java)\b/i], weight: 1.0 },
  { name: 'PostgreSQL / SQL', category: 'backend', patterns: [/\b(postgres(ql)?|sql|mongodb|redis|prisma)\b/i], weight: 1.0 },
  { name: 'GraphQL / REST', category: 'backend', patterns: [/\b(graphql|rest\s*api|trpc)\b/i], weight: 1.0 },

  // AI & ML
  { name: 'PyTorch', category: 'ai_ml', patterns: [/\bpytorch\b/i], weight: 1.3 },
  { name: 'TensorFlow / Keras', category: 'ai_ml', patterns: [/\b(tensorflow|keras)\b/i], weight: 1.2 },
  { name: 'LLM / GenAI / LangChain', category: 'ai_ml', patterns: [/\b(llm|gemini|openai|langchain|rag|huggingface|transformers|agent(s)?)\b/i], weight: 1.4 },
  { name: 'Computer Vision', category: 'ai_ml', patterns: [/\b(opencv|computer\s*vision|yolo)\b/i], weight: 1.2 },
  { name: 'NLP', category: 'ai_ml', patterns: [/\b(nlp|natural\s*language)\b/i], weight: 1.2 },
  { name: 'Scikit-Learn / Pandas', category: 'ai_ml', patterns: [/\b(scikit-learn|sklearn|pandas|numpy)\b/i], weight: 0.9 },

  // Mobile
  { name: 'Flutter', category: 'mobile', patterns: [/\bflutter\b|\bdart\b/i], weight: 1.1 },
  { name: 'React Native', category: 'mobile', patterns: [/\breact\s*native\b/i], weight: 1.1 },
  { name: 'Swift / iOS', category: 'mobile', patterns: [/\b(swift|swiftui|ios)\b/i], weight: 1.2 },
  { name: 'Kotlin / Android', category: 'mobile', patterns: [/\b(kotlin|android\s*studio)\b/i], weight: 1.2 },

  // Design & UI/UX
  { name: 'Figma', category: 'design', patterns: [/\bfigma\b/i], weight: 1.2 },
  { name: 'UI/UX Design', category: 'design', patterns: [/\b(ui\/ux|ux\s*design|user\s*research|prototyping)\b/i], weight: 1.0 },
  { name: 'Design Systems', category: 'design', patterns: [/\bdesign\s*system\b/i], weight: 1.1 },

  // DevOps & Cloud
  { name: 'Docker / Containers', category: 'devops', patterns: [/\bdocker|container(s)?\b/i], weight: 1.1 },
  { name: 'Kubernetes', category: 'devops', patterns: [/\b(kubernetes|k8s)\b/i], weight: 1.3 },
  { name: 'AWS / Cloud / GCP', category: 'devops', patterns: [/\b(aws|gcp|google\s*cloud|azure|cloud)\b/i], weight: 1.0 },
  { name: 'CI/CD & GitHub Actions', category: 'devops', patterns: [/\b(ci\/cd|github\s*actions|pipeline)\b/i], weight: 1.0 },
];

export const HACKATHON_ACHIEVEMENT_PATTERNS = [
  /\b(winner|1st\s*place|first\s*place|champion)\b/i,
  /\b(finalist|top\s*3|top\s*5|top\s*10|runner-?up|2nd\s*place|3rd\s*place)\b/i,
  /\b(best\s*hack|best\s*ui|track\s*winner|mlh)\b/i,
  /\b(smart\s*india\s*hackathon|sih|ethindia|hacknitr|hackathon)\b/i,
];

export function extractSkillsAndRoles(text: string): {
  skills: string[];
  roleDistribution: Record<RoleCategory, number>;
  hackathonMentionCount: number;
} {
  if (!text) {
    return {
      skills: [],
      roleDistribution: { frontend: 0, backend: 0, ai_ml: 0, mobile: 0, design: 0, devops: 0, general: 0 },
      hackathonMentionCount: 0,
    };
  }

  const foundSkills: Set<string> = new Set();
  const categoryScores: Record<RoleCategory, number> = {
    frontend: 0,
    backend: 0,
    ai_ml: 0,
    mobile: 0,
    design: 0,
    devops: 0,
    general: 0,
  };

  for (const item of SKILL_TAXONOMY) {
    for (const pattern of item.patterns) {
      if (pattern.test(text)) {
        foundSkills.add(item.name);
        categoryScores[item.category] += item.weight;
        break;
      }
    }
  }

  // Count hackathon achievements / mentions
  let hackathonMentionCount = 0;
  for (const p of HACKATHON_ACHIEVEMENT_PATTERNS) {
    const matches = text.match(new RegExp(p, 'gi'));
    if (matches) {
      hackathonMentionCount += matches.length;
    }
  }

  // Normalize role distribution
  const total = Object.values(categoryScores).reduce((a, b) => a + b, 0);
  const roleDistribution: Record<RoleCategory, number> = {
    frontend: total > 0 ? Number((categoryScores.frontend / total).toFixed(2)) : 0,
    backend: total > 0 ? Number((categoryScores.backend / total).toFixed(2)) : 0,
    ai_ml: total > 0 ? Number((categoryScores.ai_ml / total).toFixed(2)) : 0,
    mobile: total > 0 ? Number((categoryScores.mobile / total).toFixed(2)) : 0,
    design: total > 0 ? Number((categoryScores.design / total).toFixed(2)) : 0,
    devops: total > 0 ? Number((categoryScores.devops / total).toFixed(2)) : 0,
    general: total === 0 ? 1 : 0,
  };

  return {
    skills: Array.from(foundSkills),
    roleDistribution,
    hackathonMentionCount,
  };
}
