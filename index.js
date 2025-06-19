import fs from 'fs-extra';
import slugify from 'slugify';
import readline from 'readline';
import callLLM from './config/llm.js';

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

const generatePlanningQuestions = async (objetivo, nivel, isSpanish) => {
  const prompt = isSpanish
    ? `Tu rol es el de un planificador experto. A partir del objetivo del usuario: "${objetivo}" y el nivel de profundidad "${nivel}", genera una lista de entre 5 y 10 preguntas clave que te permitan:\n\n- Comprender el contexto completo del usuario.\n- Identificar recursos existentes y limitaciones.\n- Saber qué espera lograr exactamente.\n- Detectar posibles dependencias o pasos intermedios.\n- Recopilar detalles que te permitan generar un plan con tareas y subtareas, bien ordenadas.\n\nEvita preguntas genéricas, haz preguntas que te permitan armar un plan de acción útil para una IA. Si el nivel es "Medio" o "Complejo", diseña las preguntas para poder generar subtareas y fases.\n\nAdemás, devuelve un campo extra llamado 'folder_name' que sea un resumen corto del objetivo, seguro para usar como nombre de carpeta (máximo 40 caracteres, solo minúsculas, guiones, sin espacios ni caracteres especiales).\n\nResponde en JSON con esta estructura:\n{\n  "tema": "${objetivo}",\n  "nivel_de_profundidad": "${nivel}",\n  "preguntas": ["Pregunta 1", "Pregunta 2", ...],\n  "folder_name": "nombre-carpeta-corto"\n}`
    : `You are an expert planner. Based on the user's goal: "${objetivo}" and the detail level "${nivel}", generate a list of 5 to 10 key questions that will help you:\n\n- Understand the user's full context.\n- Identify existing resources and limitations.\n- Know exactly what they expect to achieve.\n- Detect possible dependencies or intermediate steps.\n- Gather details that allow you to generate a plan with tasks and subtasks, well ordered.\n\nAvoid generic questions, ask questions that will help you build a useful action plan for an AI. If the level is "Medium" or "Complex", design the questions so you can generate subtasks and phases.\n\nAlso, return an extra field called 'folder_name' which is a short summary of the goal, safe to use as a folder name (max 40 characters, only lowercase, dashes, no spaces or special characters).\n\nReply in JSON with this structure:\n{\n  "tema": "${objetivo}",\n  "nivel_de_profundidad": "${nivel}",\n  "preguntas": ["Question 1", "Question 2", ...],\n  "folder_name": "short-folder-name"\n}`;
  const content = await callLLM({ prompt });
  try {
    const cleaned = content.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('❌ Error al parsear JSON:', content);
    return null;
  }
};

const generateChecklistFromPlan = async (objetivo, nivel, preguntas, respuestas, isSpanish) => {
  const prompt = isSpanish
    ? `Tu tarea es generar un checklist en formato Markdown (con checkboxes "- [ ]") que ayude a lograr el siguiente objetivo:\n\n🎯 Objetivo: "${objetivo}"\n🔍 Nivel de detalle: ${nivel}\n\nBasate en estas preguntas clave que se hicieron:\n${preguntas.map((q, i) => `Q${i + 1}: ${q}`).join('\n')}\n\nY en las respuestas del usuario:\n${preguntas.map((q) => `- ${q}\n  → ${respuestas[q] || "(sin respuesta)"}`).join('\n')}\n\nInstrucciones para generar el checklist:\n- Usa "- [ ] 1. Tarea principal" y si hay subtareas usa numeración jerárquica (1.1., 1.1.1., etc.) y la indentación correspondiente:\n  - [ ] 1. Tarea principal\n    - [ ] 1.1. Subtarea 1.1\n      - [ ] 1.1.1. Subtarea 1.1.1\n- Sé claro y preciso, orientado a la acción concreta.\n- No agregues explicaciones fuera del checklist.\n- El resultado debe ser útil para alguien que quiera completar ese objetivo paso a paso.\n\nEmpieza directamente con la checklist.`
    : `Your task is to generate a checklist in Markdown format (with checkboxes "- [ ]") to help achieve the following goal:\n\nObjective: "${objetivo}"\nLevel of detail: ${nivel}\n\nBased on these key questions that were asked:\n${preguntas.map((q, i) => `Q${i + 1}: ${q}`).join('\n')}\n\nAnd the user's answers:\n${preguntas.map((q) => `- ${q}\n  -> ${respuestas[q] || "(no answer)"}`).join('\n')}\n\nInstructions to generate the checklist:\n- Use "- [ ] 1. Main task" and if there are subtasks, use hierarchical numbering (1.1., 1.1.1., etc.) and the corresponding indentation:\n  - [ ] 1. Main task\n    - [ ] 1.1. Subtask 1.1\n      - [ ] 1.1.1. Subtask 1.1.1\n- Be clear and precise, action-oriented.\n- Do not add explanations outside the checklist.\n- The result should be useful for someone who wants to complete that goal step by step.\n\nStart directly with the checklist.`;
  return await callLLM({ prompt, system: isSpanish ? 'Eres un asistente experto en planificación paso a paso.' : 'You are an expert assistant in step-by-step planning.' });
};

const collectUserResponses = async (preguntas, isSpanish) => {
  const intro = isSpanish
    ? `\n📝 Vamos a responder ${preguntas.length} preguntas. Puedes dejar alguna en blanco si no lo sabes aún.\n`
    : `\nWe are going to answer ${preguntas.length} questions. You can leave any blank if you don't know yet.\n`;
  const promptPrefix = isSpanish ? '➡️ ' : '-> ';
  const promptSuffix = isSpanish ? '\nTu respuesta: ' : '\nYour answer: ';
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

  // Texts for both languages
  const texts = {
    welcome: isSpanish ? '\n🧠 Generador de preguntas de planificación con IA\n' : '\nPlanning Questions Generator with AI\n',
    askGoal: isSpanish ? '🎯 ¿Cuál es tu objetivo a planificar? ' : 'What is your goal to plan? ',
    askLevel: isSpanish ? '📊 ¿Qué nivel de detalle deseas? (Simple / Medio / Complejo): ' : 'What level of detail do you want? (Simple / Medium / Complex): ',
    errorGoal: isSpanish ? '❌ Error: Debes ingresar un objetivo y un nivel válido.' : 'Error: You must enter a valid goal and level.',
    errorQuestions: isSpanish ? '❌ Error al generar preguntas.' : 'Error generating questions.',
    savedQuestions: isSpanish ? '\n✅ Preguntas guardadas para el plan "' : '\nQuestions saved for the plan "',
    answerIntro: isSpanish ? '\n📝 Vamos a responder ' : '\nWe are going to answer ',
    answerOutro: isSpanish ? ' preguntas. Puedes dejar alguna en blanco si no lo sabes aún.\n' : ' questions. You can leave any blank if you don\'t know yet.\n',
    answerPrompt: isSpanish ? '➡️ ' : '-> ',
    answerYour: isSpanish ? '\nTu respuesta: ' : '\nYour answer: ',
    checklistSuccess: isSpanish ? '\n✅ Checklist generado con éxito en: ' : '\nChecklist successfully generated at: '
  };

  console.log(texts.welcome);

  const objetivo = await ask(texts.askGoal);
  const nivel = await ask(texts.askLevel);

  if (!objetivo || !nivel) {
    console.log(texts.errorGoal);
    return;
  }

  // Pass language to generatePlanningQuestions and generateChecklistFromPlan
  const plan = await generatePlanningQuestions(objetivo, nivel, isSpanish);
  if (!plan || !Array.isArray(plan.preguntas)) {
    console.log(texts.errorQuestions);
    return;
  }

  const preguntasFiltradas = plan.preguntas.slice(0, 8);
  plan.preguntas = preguntasFiltradas;

  // Usar el folder_name devuelto por la LLM
  let folderName = plan.folder_name || plan.tema;
  folderName = folderName
    .replace(/[`"'\n]/g, '')
    .replace(/[^a-zA-Z0-9\-_]/g, '-')
    .toLowerCase()
    .slice(0, 40);
  const folder = `./plans/${folderName}`;
  await fs.ensureDir(folder);

  // Crear subcarpeta q&a para los archivos intermedios
  const qaFolder = `${folder}/q&a`;
  await fs.ensureDir(qaFolder);

  // Guardar los archivos .json intermedios en q&a
  const respuestas = await collectUserResponses(plan.preguntas, isSpanish);
  const respuestasPath = `${qaFolder}/user_responses.json`;
  await fs.writeJson(respuestasPath, respuestas, { spaces: 2 });

  // Si en el futuro hay más archivos .json intermedios, también irían en qaFolder

  const checklist = await generateChecklistFromPlan(plan.tema, plan.nivel_de_profundidad, plan.preguntas, respuestas, isSpanish);
  const checklistPath = `${folder}/${folderName}.md`;
  await fs.writeFile(checklistPath, checklist, 'utf-8');

  console.log(`${texts.checklistSuccess}${checklistPath}`);
};

run();
