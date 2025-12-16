const GROK_API_KEY = ""; // your key

export async function improveWithGrok(inputText) {
  if (!inputText || inputText.trim() === "") return { summary: "", suggestions: [] };

  try {
    const response = await fetch("https://api.groq.com/openai/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        input: `
Improve this social media post: "${inputText}".
Return exactly 3 alternative improved versions.
Each version must:
- Be concise, catchy, grammatically correct
- Include relevant emojis and hashtags extracted from the text
- Return only the improved text (no explanations)
Format output like this:
1. <text with emojis and hashtags>
2. <text with emojis and hashtags>
3. <text with emojis and hashtags>
        `,
        max_output_tokens: 500,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    console.log("Full Grok API response:", data);

    // --- Take only the first output_text block that has numbered suggestions ---
    let text = "";
    for (const item of data?.output || []) {
      if (!item?.content) continue;
      const outputTextObj = item.content.find(c => c.type === "output_text" && c.text?.trim());
      if (outputTextObj) {
        text = outputTextObj.text.trim();
        break; // STOP after first valid block to avoid duplicates
      }
    }

    // --- Extract numbered suggestions ---
    const suggestionMatches = text.match(/^\d+\.\s(.+)$/gm) || [];
    const uniqueSuggestions = [...new Set(suggestionMatches.map(s => s.replace(/^\d+\.\s/, "").trim()))];

    // --- Limit to max 3 suggestions ---
    const suggestions = uniqueSuggestions.slice(0, 3);

    return {
      summary: "Here are some suggestions to improve your post:",
      suggestions,
    };
  } catch (err) {
    console.error("Grok improve error:", err);
    return { summary: "AI could not generate suggestions.", suggestions: [] };
  }
}
