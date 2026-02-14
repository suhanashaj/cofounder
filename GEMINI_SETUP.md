# Gemini AI Integration Guide

## 🚀 Setup Instructions

### Step 1: Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key" or "Create API Key"
4. Copy your API key

### Step 2: Configure Environment Variables

1. Create a `.env` file in your project root (if it doesn't exist):
   ```bash
   # In the cofounder directory
   touch .env
   ```

2. Add your Gemini API key to `.env`:
   ```
   REACT_APP_GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Important**: Make sure `.env` is in your `.gitignore` file to keep your API key secure!

### Step 3: Restart Your Development Server

After adding the API key, restart your React app:
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm start
```

## 📚 Available AI Features

### 1. **Match Suggestions**
Get AI-powered analysis of potential cofounder matches:

```javascript
import { getMatchSuggestions } from '../utils/gemini';

const suggestions = await getMatchSuggestions(userProfile, potentialMatches);
console.log(suggestions);
```

### 2. **Bio Generation**
Generate professional bio suggestions:

```javascript
import { generateBioSuggestion } from '../utils/gemini';

const bioSuggestion = await generateBioSuggestion({
  role: "Founder",
  skills: "React, Node.js, Product Design",
  domain: "FinTech",
  experience: "5 years"
});
```

### 3. **Conversation Starters**
Get personalized ice-breakers for messaging:

```javascript
import { generateConversationStarters } from '../utils/gemini';

const starters = await generateConversationStarters(myProfile, theirProfile);
// Returns: ["Hi! I noticed you're working in FinTech...", ...]
```

### 4. **Compatibility Analysis**
Analyze skill and domain compatibility:

```javascript
import { analyzeCompatibility } from '../utils/gemini';

const analysis = await analyzeCompatibility(profile1, profile2);
// Returns: { score: 85, strengths: [...], concerns: [...], summary: "..." }
```

## 🎯 Example Usage in Components

### Example: Adding AI Suggestions to FindCoFounder Component

```javascript
import React, { useState } from 'react';
import { getMatchSuggestions } from '../utils/gemini';

function FindCoFounder() {
  const [aiSuggestions, setAiSuggestions] = useState('');
  const [loading, setLoading] = useState(false);

  const getAISuggestions = async () => {
    setLoading(true);
    try {
      const suggestions = await getMatchSuggestions(
        currentUserProfile,
        filteredUsers
      );
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('AI Error:', error);
      alert('Failed to get AI suggestions');
    }
    setLoading(false);
  };

  return (
    <div>
      <button onClick={getAISuggestions} disabled={loading}>
        {loading ? 'Analyzing...' : '🤖 Get AI Match Suggestions'}
      </button>
      {aiSuggestions && (
        <div className="ai-suggestions">
          <h3>AI Recommendations</h3>
          <p>{aiSuggestions}</p>
        </div>
      )}
    </div>
  );
}
```

## 🔒 Security Best Practices

1. **Never commit your `.env` file** - Keep API keys secret
2. **Use environment variables** - Don't hardcode API keys in your code
3. **Rate limiting** - Be mindful of API usage limits
4. **Error handling** - Always wrap API calls in try-catch blocks

## 💡 Feature Ideas

Here are some ways you can use Gemini AI in your platform:

- ✅ **Smart Matching**: AI-powered cofounder recommendations
- ✅ **Profile Enhancement**: Auto-generate professional bios
- ✅ **Conversation Helpers**: Suggest ice-breakers for first messages
- ✅ **Compatibility Scoring**: Analyze skill and domain fit
- 🔮 **Pitch Deck Review**: AI feedback on startup pitches
- 🔮 **Skill Gap Analysis**: Identify missing skills in a founding team
- 🔮 **Market Insights**: Generate industry trend summaries
- 🔮 **Interview Questions**: Generate cofounder interview questions

## 🐛 Troubleshooting

### "API key not valid" Error
- Double-check your API key in `.env`
- Make sure the variable name is exactly `REACT_APP_GEMINI_API_KEY`
- Restart your development server after adding the key

### "Module not found" Error
- Run `npm install @google/generative-ai` again
- Check that the import path is correct

### Rate Limit Errors
- Gemini has usage limits on the free tier
- Consider implementing caching for repeated queries
- Add loading states to prevent multiple simultaneous requests

## 📖 Additional Resources

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Google AI Studio](https://makersuite.google.com/)
- [Gemini Pricing](https://ai.google.dev/pricing)

## 🎉 Next Steps

1. Get your API key from Google AI Studio
2. Add it to your `.env` file
3. Restart your development server
4. Start using AI features in your components!

Happy coding! 🚀
