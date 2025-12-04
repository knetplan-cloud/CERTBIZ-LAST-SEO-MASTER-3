
export enum AppMode {
  SEO_CHECK = 'seo_check',
  TOPIC_IDEA = 'topic_idea',
  CONTENT_CONFIG = 'content_config',
  CONTENT_GEN = 'content_gen'
}

export type SearchSource = 'ALL' | 'PORTAL' | 'AI';

// [UPDATED] 5가지 컨텐츠 타입으로 재정비
export type ContentType = 'Information' | 'Guide' | 'Review' | 'Issue' | 'Comparison';

export interface TopicSuggestion {
  id: string;
  title: string;
  sourceType: 'PORTAL' | 'AI' | 'HYBRID';
  rank: number;
  reason: string;
  keywords: string[];
  expectedTraffic: 'High' | 'Medium' | 'Low';
  contentTypeBadge?: ContentType;
}

export interface GroundingLink {
  title: string;
  url: string;
}

export interface TopicResponse {
  summary: string;
  insightSources?: string[];
  groundingLinks?: GroundingLink[];
  items: TopicSuggestion[];
}

export type ContentPlatform = 'OrganicBlog' | 'NaverCardNews' | 'NaverOfficial' | 'Tistory' | 'Shorts';
export type ParagraphCount = 5 | 6 | 7 | 8 | 9 | 10 | 11;
export type ToneType = 'Polite' | 'Formal' | 'Soft' | 'Honorific' | 'AI_Recommend';
export type DesignConcept = 'SimpleIllust' | 'TypoCard' | 'WebCapture' | 'DeviceCloseup';
export type TargetPersona = 'Beginner_Owner' | 'Manager' | 'Veteran_CEO' | 'General_Standard';
export type ContentAddon = 'SummaryTable' | 'QnA' | 'Checklist' | 'RealCase' | 'Tips' | 'Comparison' | 'Warning';
export type UserIntent = 'Know' | 'Do' | 'Commercial' | 'Go';

export interface ContentConfig {
  topic: string;
  keywords: string[];
  contentType: ContentType;
  platform: ContentPlatform;
  paragraphCount: ParagraphCount;
  tone: ToneType;
  designConcept: DesignConcept;
  targetPersona: TargetPersona; 
  addons: ContentAddon[]; 
  generationMode?: 'Lite' | 'Expert';
}

export interface FactCheckItem {
  item: string;
  result: string;
  source: string;
  status: 'Verified' | 'Corrected' | 'Uncertain';
}

export interface ContentStructureItem {
  stage: string;
  intent: string;
  contentSummary: string;
  keywordsUsed: string[];
}

export interface ContentPackage {
  config: ContentConfig;
  structure?: ContentStructureItem[];
  blogPost: {
    title: string;
    lead: string;
    body: string;
    tableOfContents: string[];
    seoAnalysis: string;
    // [NEW] 배너 설정 추가
    bannerConfig?: {
      mainCopy: string;
      subCopy: string;
      ctaText: string;
      bgColor: string;
    };
  };
  shortsScript?: {
    title: string;
    scenes: Array<{
      time: string;
      visual: string;
      audio: string;
    }>;
  };
  imagePrompts: Array<{
    paragraphIndex: number; 
    conceptName: string; 
    koreanPrompt: string; 
    englishPrompt: string; 
    referenceUrl?: string; 
  }>;
  seoMeta: {
    metaTitle: string;
    metaDescription: string;
    ogTitle?: string;
    ogDescription?: string;
    slug?: string;
    mainKeywords: string[];
    subKeywords: string[];
    hashtags: string[];
    structuredData: object;
  };
  factCheck?: FactCheckItem[];
  groundingLinks?: GroundingLink[];
}

export interface TechnicalSeo {
  recommendedImageCount: number;
  imageStrategy: Array<{
    position: string;
    content: string; // 이미지 내용 설명
    alt: string;     // Alt 태그
    prompt: string;  // [NEW] 생성 프롬프트
  }>;
  metaTitle: string;
  metaDescription: string;
  hashtags: string[];
  jsonLd: object;
  slug: string; // [NEW] URL Slug
}

export interface SeoAnalysisResult {
  score: number;
  intentAnalysis: {
    actualType: 'Know' | 'Do' | 'Go' | 'Mixed';
    targetType: UserIntent;
    gapAnalysis: string;
    fit: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    reason: string;
  };
  // [UPDATED] 경쟁사 분석 구조화
  competitorAnalysis: Array<{
    name: string;
    insight: string;
  }>;
  keywordDensity: string;
  readability: string;
  improvements: string[];
  recommendedHeadlines: Array<{ type: string; text: string; }>;
  technicalSeo?: TechnicalSeo;
}
