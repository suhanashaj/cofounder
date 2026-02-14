import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API
// You'll need to get your API key from: https://makersuite.google.com/app/apikey
const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "YOUR_API_KEY_HERE";

const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Generate AI-powered cofounder match suggestions
 * @param {Object} userProfile - The user's profile data
 * @param {Array} potentialMatches - Array of potential cofounder profiles
 * @returns {Promise<string>} - AI-generated match analysis
 */
export async function getMatchSuggestions(userProfile, potentialMatches) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `
You are an expert cofounder matching advisor. Analyze the following user profile and potential matches, then provide personalized recommendations.

User Profile:
- Name: ${userProfile.fullName || userProfile.username}
- Role: ${userProfile.role}
- Skills: ${userProfile.skills}
- Domain: ${userProfile.domain}
- Bio: ${userProfile.bio}

Potential Matches:
${potentialMatches.map((match, idx) => `
${idx + 1}. ${match.fullName || match.username}
   - Role: ${match.role}
   - Skills: ${match.skills}
   - Domain: ${match.domain}
   - Bio: ${match.bio}
`).join('\n')}

Provide a brief analysis (2-3 sentences) for each match explaining why they would or wouldn't be a good cofounder match. Focus on complementary skills, shared vision, and potential synergies.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}

/**
 * Generate a professional bio suggestion based on user's skills and domain
 * @param {Object} userData - User's basic information
 * @returns {Promise<string>} - AI-generated bio suggestion
 */
export async function generateBioSuggestion(userData) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `
Generate a professional, compelling bio (2-3 sentences) for a ${userData.role} with the following details:
- Skills: ${userData.skills}
- Domain: ${userData.domain}
- Experience Level: ${userData.experience || "Not specified"}

The bio should be concise, professional, and highlight their unique value proposition as a potential cofounder.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}

/**
 * Generate conversation starters for connecting with a potential cofounder
 * @param {Object} myProfile - Current user's profile
 * @param {Object} theirProfile - Potential cofounder's profile
 * @returns {Promise<Array<string>>} - Array of conversation starter suggestions
 */
export async function generateConversationStarters(myProfile, theirProfile) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `
Generate 3 personalized conversation starters for someone reaching out to a potential cofounder.

My Profile:
- Role: ${myProfile.role}
- Skills: ${myProfile.skills}
- Domain: ${myProfile.domain}

Their Profile:
- Name: ${theirProfile.fullName || theirProfile.username}
- Role: ${theirProfile.role}
- Skills: ${theirProfile.skills}
- Domain: ${theirProfile.domain}

Provide 3 brief, friendly, and professional conversation starters (1-2 sentences each) that reference their skills or domain to show genuine interest.
Format as a JSON array of strings.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Try to parse as JSON, fallback to splitting by newlines
        try {
            return JSON.parse(text);
        } catch {
            return text.split('\n').filter(line => line.trim().length > 0).slice(0, 3);
        }
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}

/**
 * Analyze skill compatibility between two profiles
 * @param {Object} profile1 - First user's profile
 * @param {Object} profile2 - Second user's profile
 * @returns {Promise<Object>} - Compatibility analysis with score and insights
 */
export async function analyzeCompatibility(profile1, profile2) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `
Analyze the compatibility between these two potential cofounders and provide a compatibility score (0-100) with reasoning.

Profile 1:
- Role: ${profile1.role}
- Skills: ${profile1.skills}
- Domain: ${profile1.domain}

Profile 2:
- Role: ${profile2.role}
- Skills: ${profile2.skills}
- Domain: ${profile2.domain}

Provide your response in the following JSON format:
{
  "score": <number 0-100>,
  "strengths": ["strength1", "strength2"],
  "concerns": ["concern1", "concern2"],
  "summary": "Brief 2-3 sentence summary"
}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        try {
            // Try to extract JSON from the response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (parseError) {
            console.error("JSON parse error:", parseError);
        }

        // Fallback response
        return {
            score: 75,
            strengths: ["Complementary skills", "Shared domain interest"],
            concerns: ["Need to discuss vision alignment"],
            summary: text.substring(0, 200)
        };
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}

export default {
    getMatchSuggestions,
    generateBioSuggestion,
    generateConversationStarters,
    analyzeCompatibility
};
