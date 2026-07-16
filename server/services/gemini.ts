import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

// Initialize Gemini client (fallback to warning if key is missing)
const apiKey = process.env.GEMINI_API_KEY;
let genAI: GoogleGenerativeAI | null = null;

if (!apiKey) {
  console.warn("[gemini] GEMINI_API_KEY is not set. The application will use mock classification fallback.");
} else {
  genAI = new GoogleGenerativeAI(apiKey);
}

// Converts a local file path into the generative model's expected format
function fileToGenerativePart(filePath: string, mimeType: string) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType
    },
  };
}

export interface ClassifiedProduct {
  name: string;
  description: string;
  price: string;
  originalPrice: string | null;
  category: string;
  ageGroup: string;
  sizes: string[];
}

/**
 * Classifies a kid's garment using Gemini from its image and Instagram caption.
 */
export async function classifyGarment(localImagePath: string, caption: string): Promise<ClassifiedProduct> {
  const defaultFallback: ClassifiedProduct = {
    name: "New Arrivals Garment",
    description: caption || "Premium cotton apparel for children.",
    price: "999.00",
    originalPrice: null,
    category: "T-Shirts",
    ageGroup: "3-5 Years",
    sizes: ["2-3Y", "3-4Y", "4-5Y"]
  };

  if (!genAI) {
    console.warn("[gemini] No API Key set. Using default fallback classification.");
    return parseMockFallback(caption, defaultFallback);
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    // Resolve local path
    const absolutePath = path.resolve(process.cwd(), localImagePath.replace(/^\//, ''));
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found at ${absolutePath}`);
    }

    // Determine mime type
    let mimeType = "image/jpeg";
    const ext = path.extname(absolutePath).toLowerCase();
    if (ext === ".png") mimeType = "image/png";
    if (ext === ".webp") mimeType = "image/webp";

    const imagePart = fileToGenerativePart(absolutePath, mimeType);

    const prompt = `
You are a senior e-commerce catalog operations agent for "Rajouri Kids", a kid's clothing boutique in Delhi, India.
Analyze the attached product image and the associated Instagram caption to extract e-commerce catalog details.

Instagram Caption:
"""
${caption}
"""

Extract and return a JSON object with these exact fields:
1. "name": A clean, retail-ready product title (e.g., "Peach Embroidered Frock" or "Blue Denim Dungarees"). Keep it concise and clean.
2. "description": A descriptive, engaging summary of the product. Combine details from the caption and what you see in the image (e.g., fabric type, embroidery, styling).
3. "price": The selling price in INR as a decimal string (e.g. "899.00"). Look for patterns like "899/-", "Rs.899", "₹899", "899 INR". If no price is found, default to "999.00".
4. "originalPrice": The original price before sale (if a discount/sale is mentioned, e.g. "Was 1299 now 899") as a decimal string, or null if no original/higher price is mentioned.
5. "category": Must be exactly one of: "T-Shirts", "Dresses", "Shorts", "Corsets", "Skirts" (Choose the closest match based on the garment type).
6. "ageGroup": Must be exactly one of: "0-2 Years", "3-5 Years", "6-8 Years", "9-12 Years". Infer from sizes or age hints in the caption. If not specified, choose the best fit based on the visual model size.
7. "sizes": An array of available kids size tags (age-based, e.g. ["0-6M", "6-12M", "1-2Y"] for babies or ["2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y", "7-8Y", "8-9Y", "9-10Y", "10-11Y", "11-12Y"] for older kids). Use sizes appropriate to the ageGroup. If none are found, output ["2-3Y", "3-4Y", "4-5Y"].

Your output must be raw JSON conforming to this schema. Do not write markdown, code blocks, or explanations.
`;

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    console.log("[gemini] Raw response text:", responseText);

    const parsed = JSON.parse(responseText.trim()) as ClassifiedProduct;

    // Verify categories and ageGroups match constraints
    const validCategories = ["T-Shirts", "Dresses", "Shorts", "Corsets", "Skirts"];
    const validAgeGroups = ["0-2 Years", "3-5 Years", "6-8 Years", "9-12 Years"];

    if (!validCategories.includes(parsed.category)) {
      parsed.category = "T-Shirts"; // fallback
    }
    if (!validAgeGroups.includes(parsed.ageGroup)) {
      parsed.ageGroup = "3-5 Years"; // fallback
    }

    return parsed;
  } catch (error) {
    console.error("[gemini] Error calling Gemini API:", error);
    return parseMockFallback(caption, defaultFallback);
  }
}

/**
 * Simple regex parsing fallback if API is unavailable
 */
function parseMockFallback(caption: string, defaults: ClassifiedProduct): ClassifiedProduct {
  if (!caption) return defaults;

  const result = { ...defaults };
  
  // Try to parse price (e.g. 899/- or Rs 899 or 899 INR)
  const priceRegex = /(?:₹|rs\.?|inr)?\s*(\d+)(?:\s*\/-|\s*inr)?/i;
  const match = caption.match(priceRegex);
  if (match) {
    result.price = `${match[1]}.00`;
  }

  // Try to parse age/size hints
  if (caption.includes("0-2") || caption.toLowerCase().includes("months") || caption.toLowerCase().includes("toddler")) {
    result.ageGroup = "0-2 Years";
  } else if (caption.includes("3-5") || caption.includes("3Y") || caption.includes("4Y") || caption.includes("5Y")) {
    result.ageGroup = "3-5 Years";
  } else if (caption.includes("6-8") || caption.includes("6Y") || caption.includes("7Y") || caption.includes("8Y")) {
    result.ageGroup = "6-8 Years";
  } else if (caption.includes("9-12") || caption.includes("9Y") || caption.includes("10Y") || caption.includes("11Y") || caption.includes("12Y")) {
    result.ageGroup = "9-12 Years";
  }

  // Try to guess category
  const lowerCaption = caption.toLowerCase();
  if (lowerCaption.includes("dress") || lowerCaption.includes("frock") || lowerCaption.includes("skirt")) {
    result.category = "Dresses";
  } else if (lowerCaption.includes("short")) {
    result.category = "Shorts";
  } else if (lowerCaption.includes("corset") || lowerCaption.includes("jumpsuit") || lowerCaption.includes("romper") || lowerCaption.includes("dungaree")) {
    result.category = "Corsets";
  } else if (lowerCaption.includes("t-shirt") || lowerCaption.includes("tee") || lowerCaption.includes("top")) {
    result.category = "T-Shirts";
  }

  // Set descriptive name
  const lines = caption.split("\n").filter(l => l.trim().length > 0);
  if (lines.length > 0) {
    const titleSuggestion = lines[0].replace(/[#*_\-\[\]]/g, '').trim();
    if (titleSuggestion.length > 5 && titleSuggestion.length < 40) {
      result.name = titleSuggestion;
    }
  }

  return result;
}
