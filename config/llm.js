import openai from './openai.js';
import genAI from './google.js';
import dotenv from 'dotenv';
dotenv.config();

const LLM_PROVIDER = process.env.LLM_PROVIDER || 'openai';

const callLLM = async ({ prompt, system, model = 'gpt-4' }) => {
  if (LLM_PROVIDER === 'openai') {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: system || 'Eres un asistente experto.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    });
    return response.choices[0].message.content.trim();
  }

  if (LLM_PROVIDER === 'google') {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    return text.trim();
  }

  throw new Error(`LLM_PROVIDER "${LLM_PROVIDER}" no soportado`);
};

export default callLLM;
