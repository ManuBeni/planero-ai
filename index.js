import fs from 'fs-extra';
import readline from 'readline';
import callLLM from './config/llm.js';

// Centralized texts for both languages
const TEXTS = {
  en: {
    welcome: '\n🧠 Planning Questions Generator with AI\n',
    askGoal: '🎯 What is your goal to plan? ',
    askLevel: '📊 What level of detail do you want? (Simple / Medium / Complex): ',
    errorGoal: '❌ Error: You must enter a valid goal and level.',
    errorQuestions: '❌ Error generating questions.',
    savedQuestions: '\n✅ Questions saved for the plan "',
    answerIntro: '\n📝 We are going to answer ',
    answerOutro: ' questions. You can leave any blank if you don\'t know yet.\n',
    answerPrompt: '➡️ ',
    answerYour: '\nYour answer: ',
    checklistSuccess: '\n✅ Checklist successfully generated at: '
  },
  es: {
    welcome: '\n🧠 Generador de preguntas de planificación con IA\n',
    askGoal: '🎯 ¿Cuál es tu objetivo a planificar? ',
    askLevel: '📊 ¿Qué nivel de detalle deseas? (Simple / Medio / Complejo): ',
    errorGoal: '❌ Error: Debes ingresar un objetivo y un nivel válido.',
    errorQuestions: '❌ Error al generar preguntas.',
    savedQuestions: '\n✅ Preguntas guardadas para el plan "',
    answerIntro: '\n📝 Vamos a responder ',
    answerOutro: ' preguntas. Puedes dejar alguna en blanco si no lo sabes aún.\n',
    answerPrompt: '➡️ ',
    answerYour: '\nTu respuesta: ',
    checklistSuccess: '\n✅ Checklist generado con éxito en: '
  }
};

// Centralized prompt templates for both languages
const PROMPTS = {
  planningQuestions: {
    en: ({ objetivo, nivel }) => `You are an expert planner. Based on the user's goal: "${objetivo}" and the detail level "${nivel}", generate a list of 5 to 10 key questions that will help you:\n\n- Understand the user's full context.\n- Identify existing resources and limitations.\n- Know exactly what they expect to achieve.\n- Detect possible dependencies or intermediate steps.\n- Gather details that allow you to generate a plan with tasks and subtasks, well ordered.\n\nAvoid generic questions, ask questions that will help you build a useful action plan for an AI. If the level is "Medium" or "Complex", design the questions so you can generate subtasks and phases.\n\nAlso, return an extra field called 'folder_name' which is a short summary of the goal, safe to use as a folder name (max 40 characters, only lowercase, dashes, no spaces or special characters).\n\nReply in JSON with this structure:\n{\n  "tema": "${objetivo}",\n  "nivel_de_profundidad": "${nivel}",\n  "preguntas": ["Question 1", "Question 2", ...],\n  "folder_name": "short-folder-name"\n}`,
    es: ({ objetivo, nivel }) => `Tu rol es el de un planificador experto. A partir del objetivo del usuario: "${objetivo}" y el nivel de profundidad "${nivel}", genera una lista de entre 5 y 10 preguntas clave que te permitan:\n\n- Comprender el contexto completo del usuario.\n- Identificar recursos existentes y limitaciones.\n- Saber qué espera lograr exactamente.\n- Detectar posibles dependencias o pasos intermedios.\n- Recopilar detalles que te permitan generar un plan con tareas y subtareas, bien ordenadas.\n\nEvita preguntas genéricas, haz preguntas que te permitan armar un plan de acción útil para una IA. Si el nivel es "Medio" o "Complejo", diseña las preguntas para poder generar subtareas y fases.\n\nAdemás, devuelve un campo extra llamado 'folder_name' que sea un resumen corto del objetivo, seguro para usar como nombre de carpeta (máximo 40 caracteres, solo minúsculas, guiones, sin espacios ni caracteres especiales).\n\nResponde en JSON con esta estructura:\n{\n  "tema": "${objetivo}",\n  "nivel_de_profundidad": "${nivel}",\n  "preguntas": ["Pregunta 1", "Pregunta 2", ...],\n  "folder_name": "nombre-carpeta-corto"\n}`
  },
  checklist: {
    en: ({ objetivo, nivel, preguntas, respuestas }) => `Your task is to generate a checklist in Markdown format (with checkboxes "- [ ]") to help achieve the following goal:\n\nObjective: "${objetivo}"\nLevel of detail: ${nivel}\n\nBased on these key questions that were asked:\n${preguntas.map((q, i) => `Q${i + 1}: ${q}`).join('\n')}\n\nAnd the user's answers:\n${preguntas.map((q) => `- ${q}\n  -> ${respuestas[q] || "(no answer)"}`).join('\n')}\n\nInstructions to generate the checklist:\n- Use "- [ ] 1. Main task" and if there are subtasks, use hierarchical numbering (1.1., 1.1.1., etc.) and the corresponding indentation:\n  - [ ] 1. Main task\n    - [ ] 1.1. Subtask 1.1\n      - [ ] 1.1.1. Subtask 1.1.1\n- Be clear and precise, action-oriented.\n- Do not add explanations outside the checklist.\n- The result should be useful for someone who wants to complete that goal step by step.\n\nStart directly with the checklist.`,
    es: ({ objetivo, nivel, preguntas, respuestas }) => `Tu tarea es generar un checklist en formato Markdown (con checkboxes "- [ ]") que ayude a lograr el siguiente objetivo:\n\n🎯 Objetivo: "${objetivo}"\n🔍 Nivel de detalle: ${nivel}\n\nBasate en estas preguntas clave que se hicieron:\n${preguntas.map((q, i) => `Q${i + 1}: ${q}`).join('\n')}\n\nY en las respuestas del usuario:\n${preguntas.map((q) => `- ${q}\n  → ${respuestas[q] || "(sin respuesta)"}`).join('\n')}\n\nInstrucciones para generar el checklist:\n- Usa "- [ ] 1. Tarea principal" y si hay subtareas usa numeración jerárquica (1.1., 1.1.1., etc.) y la indentación correspondiente:\n  - [ ] 1. Tarea principal\n    - [ ] 1.1. Subtarea 1.1\n      - [ ] 1.1.1. Subtarea 1.1.1\n- Sé claro y preciso, orientado a la acción concreta.\n- No agregues explicaciones fuera del checklist.\n- El resultado debe ser útil para alguien que quiera completar ese objetivo paso a paso.\n\nEmpieza directamente con la checklist.`
  }
};

const ask = (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    })
  );
};

const generatePlanningQuestions = async (objetivo, nivel, texts, isSpanish) => {
  const lang = isSpanish ? 'es' : 'en';
  const prompt = PROMPTS.planningQuestions[lang]({ objetivo, nivel });
  const content = await callLLM({ prompt });
  try {
    const cleaned = content.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error(texts.errorQuestions, content);
    return null;
  }
};

const generateChecklistFromPlan = async (objetivo, nivel, preguntas, respuestas, texts, isSpanish) => {
  const lang = isSpanish ? 'es' : 'en';
  const prompt = PROMPTS.checklist[lang]({ objetivo, nivel, preguntas, respuestas });
  return await callLLM({ prompt, system: isSpanish ? 'Eres un asistente experto en planificación paso a paso.' : 'You are an expert assistant in step-by-step planning.' });
};

const collectUserResponses = async (preguntas, texts, isSpanish) => {
  const intro = texts.answerIntro + preguntas.length + texts.answerOutro;
  const promptPrefix = texts.answerPrompt;
  const promptSuffix = texts.answerYour;
  console.log(intro);
  const respuestas = {};
  for (const pregunta of preguntas) {
    const respuesta = await ask(`${promptPrefix}${pregunta}${promptSuffix}`);
    respuestas[pregunta] = respuesta;
  }
  return respuestas;
};

const run = async () => {
  // Language selection
  const lang = (await ask('Choose language -> [es = Español / en = English]: ')).toLowerCase().trim();
  const isSpanish = lang === 'es';
  const texts = isSpanish ? TEXTS.es : TEXTS.en;

  console.log(texts.welcome);

  const objetivo = await ask(texts.askGoal);
  const nivel = await ask(texts.askLevel);

  if (!objetivo || !nivel) {
    console.log(texts.errorGoal);
    return;
  }

  // Pass texts to all functions
  const plan = await generatePlanningQuestions(objetivo, nivel, texts, isSpanish);
  if (!plan || !Array.isArray(plan.preguntas)) {
    console.log(texts.errorQuestions);
    return;
  }

  const preguntasFiltradas = plan.preguntas.slice(0, 8);
  plan.preguntas = preguntasFiltradas;

  let folderName = plan.folder_name || plan.tema;
  folderName = folderName
    .replace(/[`"'\n]/g, '')
    .replace(/[^a-zA-Z0-9\-_]/g, '-')
    .toLowerCase()
    .slice(0, 40);
  const folder = `./plans/${folderName}`;
  await fs.ensureDir(folder);

  const qaFolder = `${folder}/q&a`;
  await fs.ensureDir(qaFolder);

  const respuestas = await collectUserResponses(plan.preguntas, texts, isSpanish);
  const respuestasPath = `${qaFolder}/user_responses.json`;
  await fs.writeJson(respuestasPath, respuestas, { spaces: 2 });

  const checklist = await generateChecklistFromPlan(plan.tema, plan.nivel_de_profundidad, plan.preguntas, respuestas, texts, isSpanish);
  const checklistPath = `${folder}/${folderName}.md`;
  await fs.writeFile(checklistPath, checklist, 'utf-8');

  console.log(`${texts.checklistSuccess}${checklistPath}`);
};

run();
