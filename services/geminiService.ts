
import { GoogleGenAI } from "@google/genai";
import { TopicSuggestion, TopicResponse, ContentConfig, ContentPackage, SearchSource, SeoAnalysisResult, TechnicalSeo, UserIntent, GroundingLink } from "../types";
import { KNET_BRAIN_DATA } from "../data/brainData";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
당신은 '한국범용인증센터(certbiz.com)'의 수석 마케팅 기획자이자 SEO 컨텐츠 전문가입니다.

[목표]
사용자에게 실질적인 도움이 되는 정보성 컨텐츠(법령, 제도, 절차 등)를 제공하여 신뢰를 얻은 후, 
자연스럽게 한국범용인증센터의 상품으로 연결하는 것입니다.

[컨텐츠 비율 및 구조 원칙 - 중요!]
1. **정보 제공 (Value) 80% : 홍보 (Promo) 20%** 비율을 엄격히 준수하십시오.
2. **서론(Lead) 및 본문 초반부에는 절대 상품을 직접적으로 홍보하지 마십시오.** 
   - 사용자의 문제(연말정산, 전자입찰 등)를 먼저 해결해주는 유용한 정보로 시작해야 합니다.
   - 인증서 상품 언급은 해결책(Solution) 단계에서 자연스럽게 등장해야 합니다.
3. **시각적 구조화 (Visual Hierarchy):** 
   - 긴 줄글을 피하고, H2/H3 제목, 불릿 포인트, 번호 매기기를 적극 활용하여 가독성을 극대화하십시오.
   - 표(Table)를 적극 활용하여 복잡한 정보를 정리하십시오.

[마크다운(Markdown) 작성 절대 규칙]
1. **Bold 공백 금지:** ** 텍스트 ** (X) -> **텍스트** (O). 별표 안쪽에 공백을 넣지 마십시오.
2. **명확한 헤더:** # (H1)은 제목에만 사용하고, 본문은 ## (H2), ### (H3)를 사용하여 위계를 명확히 하십시오.

[뇌데이터 및 팩트체크]
${KNET_BRAIN_DATA}
위 데이터를 기반으로 정확한 가격과 정보를 제공하되, 법령/세율 등은 Google Search를 통해 최신 정보를 확인하십시오.
`;

const MODEL_NAME = 'gemini-2.5-flash';

// Robust JSON Parser
const parseJsonFromResponse = (text: string) => {
  try {
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1]);
    }
    
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    
    let startIdx = -1;
    if (firstBrace !== -1 && firstBracket !== -1) {
      startIdx = Math.min(firstBrace, firstBracket);
    } else if (firstBrace !== -1) {
      startIdx = firstBrace;
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
    }

    const lastBrace = text.lastIndexOf('}');
    const lastBracket = text.lastIndexOf(']');
    const endIdx = Math.max(lastBrace, lastBracket);

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const jsonStr = text.substring(startIdx, endIdx + 1);
      return JSON.parse(jsonStr);
    }

    return JSON.parse(text);
  } catch (e) {
    console.error("JSON Parsing Failed:", e);
    console.error("Raw Text:", text);
    throw new Error("AI 응답을 처리하는 중 오류가 발생했습니다. (JSON 형식 불일치)");
  }
};

// 텍스트 전처리
const cleanTextForAnalysis = (text: string): string => {
  if (!text) return "";
  let cleaned = text.replace(/[\u{1F600}-\u{1F6FF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  cleaned = cleaned.replace(/[^a-zA-Z0-9가-힣\s\n.,!?'"()\-%\/]/g, ' '); 
  cleaned = cleaned.replace(/[ \t]+/g, ' ').trim();
  return cleaned;
};

// 0. 초기 트렌드 키워드 가져오기
export const getTrendingKeywords = async (): Promise<string[]> => {
  const prompt = `
  현재 시점 한국의 '사업자 인증서', '전자입찰', '법인설립', '전자세금계산서', '연말정산', '4대보험' 등과 관련된 
  실시간 검색어 또는 마케팅적으로 주목해야 할 핫한 키워드 10개를 추천해주세요.
  
  [출력 형식]
  JSON 배열 문자열로만 출력하세요. 예: ["사업자 범용 공동인증서", "나라장터 입찰", ...]
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      },
    });
    
    if (!response.text) return ["사업자 범용인증서", "전자세금계산서", "나라장터"];
    const parsed = parseJsonFromResponse(response.text);
    return Array.isArray(parsed) ? parsed : ["사업자 범용인증서", "전자세금계산서", "나라장터"];
  } catch (e) {
    console.warn("Trending keywords fetch failed, using fallback.", e);
    return ["사업자 범용인증서", "전자세금계산서 발행", "홈택스 로그인", "나라장터 입찰", "법인인감증명서"];
  }
};

// 1. 주제 추천
export const recommendTopics = async (
  keyword: string, 
  sourceFilter: SearchSource,
  excludeKeywords: string[] = [] 
): Promise<TopicResponse> => {
  const prompt = `
  키워드: '${keyword}'
  제외할 키워드/주제: ${excludeKeywords.join(', ')} (이 내용과 중복되지 않는 새로운 주제를 찾아주세요)
  
  위 키워드와 관련하여, 현재 시점(Real-time)에서 컨텐츠로 다루기에 가장 적합한 주제 10가지를 추천해주세요.
  반드시 Google Search 도구를 사용하여 최신 정보를 확인하십시오.

  [필수: 팩트 검증 (Fact Verification)]
  - 세금, 법령, 지원금 정책과 관련된 '금액'과 '날짜'는 검색 결과와 정확히 일치해야 합니다.
  - 검색 결과에 없는 미래 예측(예: 2025년 1월 기준 2천만원 등)은 절대 포함하지 마십시오.

  [분석 기준]
  1. 포털(PORTAL): 네이버/구글 검색 상위 노출 경쟁력이 있는 주제 - 70% 비중
  2. AI: ChatGPT나 Gemini가 답변하기 좋아하는 질문 패턴 - 30% 비중
  3. 트렌드: 최근 1개월 내 문서 발행량이 급증한 이슈
  
  [출력 요구사항]
  - **반드시 아래 JSON 객체 포맷을 준수하세요.**
  
  {
    "summary": "한국어 요약 (팩트 위주)",
    "insightSources": ["국세청", "00신문"], 
    "items": [
      {
        "id": "unique_id_1",
        "title": "주제 제목",
        "sourceType": "PORTAL", 
        "rank": 1,
        "reason": "추천 근거 (한국어)",
        "keywords": ["키워드1", "키워드2"],
        "expectedTraffic": "High",
        "contentTypeBadge": "Information" 
      }
    ]
  }
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }],
      responseMimeType: 'application/json'
    },
  });

  const parsed = parseJsonFromResponse(response.text || "{}");
  
  // Grounding Metadata 추출
  let groundingLinks: GroundingLink[] = [];
  if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
    groundingLinks = response.candidates[0].groundingMetadata.groundingChunks
      .filter((chunk: any) => chunk.web?.uri && chunk.web?.title)
      .map((chunk: any) => ({
        title: chunk.web.title,
        url: chunk.web.uri
      }));
  }

  return {
    ...parsed,
    groundingLinks
  };
};

// 2. SEO 점검 (Analyze SEO)
export const analyzeSeo = async (keyword: string, content: string, title?: string): Promise<SeoAnalysisResult> => {
  const prompt = `
  [SEO 정밀 진단]
  타겟 키워드: ${keyword}
  제목: ${title || "제목 없음"}
  본문 내용:
  ${content.substring(0, 3000)}... (생략)

  위 컨텐츠를 Google SEO 가이드라인 및 네이버 검색 로직에 맞춰 분석해주세요.
  경쟁 문서들을 Google Search로 검색하여 비교 분석하십시오.

  [출력 요구사항]
  JSON 형식으로 출력하세요.
  {
    "score": 0~100,
    "intentAnalysis": {
      "actualType": "Know" | "Do" | "Go" | "Mixed",
      "targetType": "Know" | "Do" | "Commercial" | "Go",
      "gapAnalysis": "의도 분석 내용",
      "fit": "Excellent" | "Good" | "Fair" | "Poor",
      "reason": "이유"
    },
    "competitorAnalysis": [
       { "name": "경쟁사 또는 상위 블로그 제목", "insight": "벤치마킹 포인트" }
    ],
    "keywordDensity": "분석 내용",
    "readability": "가독성 분석",
    "improvements": ["개선점1", "개선점2"],
    "recommendedHeadlines": [{ "type": "H1", "text": "추천 제목" }],
    "technicalSeo": {
        "recommendedImageCount": 5,
        "imageStrategy": [
            { "position": "서론", "content": "이미지 설명", "alt": "SEO Alt 태그", "prompt": "이미지 생성 프롬프트" }
        ],
        "metaTitle": "메타 타이틀",
        "metaDescription": "메타 디스크립션",
        "hashtags": ["#태그1"],
        "slug": "url-slug-suggestion",
        "jsonLd": {} 
    }
  }
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }],
      responseMimeType: 'application/json'
    },
  });

  return parseJsonFromResponse(response.text || "{}");
};

// 3. 컨텐츠 생성 (Generate Content Package)
export const generateContentPackage = async (config: ContentConfig): Promise<ContentPackage> => {
  const prompt = `
  [블로그 컨텐츠 생성 요청]
  
  1. 주제: ${config.topic}
  2. 핵심 키워드: ${config.keywords.join(', ')}
  3. 타겟 독자: ${config.targetPersona}
  4. 형식: ${config.contentType} (${config.platform})
  5. 어조: ${config.tone}
  6. 단락 수: ${config.paragraphCount}개
  7. 디자인 컨셉: ${config.designConcept}
  8. 포함할 요소: ${config.addons.join(', ')}

  [지시사항]
  - 반드시 Google Search를 사용하여 최신 법령, 세율, 정책, 날짜 정보를 확인하고 'factCheck' 항목에 기록하십시오.
  - 마크다운 작성 시 **Bold** 안에 절대 공백을 넣지 마십시오. (예: **텍스트** O, ** 텍스트 ** X)
  - 정보 80%, 홍보 20% 비율을 지키십시오. 서론에서는 상품 홍보 금지.
  - 표(Table)를 최소 1개 이상 포함하여 정보를 구조화하십시오.
  - 가장 하단에 배치할 배너(Banner)의 카피라이팅과 컬러 코드를 제안하십시오.

  [출력 형식]
  JSON으로 출력하십시오.
  {
    "config": ${JSON.stringify(config)},
    "structure": [{ "stage": "서론", "intent": "흥미유발", "contentSummary": "...", "keywordsUsed": [] }],
    "blogPost": {
      "title": "SEO 최적화된 매력적인 제목",
      "lead": "독자의 흥미를 끄는 서론 (300자 내외)",
      "body": "전체 본문 (마크다운 포맷, H2/H3 사용, 표 포함)",
      "tableOfContents": ["목차1", "목차2"],
      "seoAnalysis": "SEO 적용 포인트 요약",
      "bannerConfig": {
         "mainCopy": "배너 메인 카피",
         "subCopy": "서브 카피",
         "ctaText": "버튼 텍스트",
         "bgColor": "#HexCode"
      }
    },
    "shortsScript": {
       "title": "숏츠 제목",
       "scenes": [{ "time": "0-5s", "visual": "화면 설명", "audio": "대사" }]
    },
    "imagePrompts": [
      { "paragraphIndex": 0, "conceptName": "${config.designConcept}", "koreanPrompt": "한글 프롬프트", "englishPrompt": "English Prompt" }
    ],
    "seoMeta": {
      "metaTitle": "메타 타이틀",
      "metaDescription": "메타 설명",
      "mainKeywords": ["키워드"],
      "subKeywords": ["서브키워드"],
      "hashtags": ["#태그"],
      "structuredData": {}
    },
    "factCheck": [
      { "item": "검증 항목", "result": "검증 결과 (연도/금액)", "source": "출처(국세청 등)", "status": "Verified" }
    ]
  }
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }],
      responseMimeType: 'application/json'
    },
  });

  const parsed = parseJsonFromResponse(response.text || "{}");
  
  // Grounding Metadata 추출
  let groundingLinks: GroundingLink[] = [];
  if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
    groundingLinks = response.candidates[0].groundingMetadata.groundingChunks
      .filter((chunk: any) => chunk.web?.uri && chunk.web?.title)
      .map((chunk: any) => ({
        title: chunk.web.title,
        url: chunk.web.uri
      }));
  }

  return {
    ...parsed,
    groundingLinks
  };
};
