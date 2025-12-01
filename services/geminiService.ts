import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeProductImage = async (
  imageBase64: string,
  userAllergens: string[]
): Promise<AnalysisResult> => {
  
  if (userAllergens.length === 0) {
    throw new Error("Nenhum alérgeno configurado.");
  }

  const model = "gemini-2.5-flash";

  const prompt = `
    Analise esta imagem de um rótulo de produto ou alimento.
    
    A lista de alergias do usuário é: ${userAllergens.join(", ")}.
    
    TAREFAS:
    1. Identifique os ingredientes no texto da imagem.
    2. EXPANDA INTELIGENTEMENTE a lista do usuário buscando por VARIAÇÕES e DERIVADOS.
       Exemplo: Se o usuário listou "Glúten", você DEVE buscar por: Trigo, Centeio, Cevada, Malte, Sêmola, Espelta, Triticale, etc.
       Exemplo: Se "Leite", busque por Soro de Leite, Caseína, Lactose, etc.
    
    3. Classifique o risco (RiskLevel):
       - 'DANGER' (Vermelho): Se encontrar o nome EXATO da alergia ou um ingrediente principal óbvio.
       - 'WARNING' (Amarelo): Se encontrar uma VARIAÇÃO, um DERIVADO, um sinônimo menos comum, ou avisos de "Pode conter traços" / "Contém traços".
       - 'SAFE' (Verde): Se não houver nenhuma menção, variação ou derivado.

    4. Retorne o raciocínio em Português do Brasil.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: {
              type: Type.STRING,
              enum: ["SAFE", "WARNING", "DANGER"],
              description: "Nível de risco: SAFE (Seguro), WARNING (Atenção/Variação), DANGER (Perigo/Exato).",
            },
            detectedAllergens: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista dos ingredientes ou variações encontradas.",
            },
            reasoning: {
              type: Type.STRING,
              description: "Explicação curta e direta em Português sobre a análise.",
            },
          },
          required: ["riskLevel", "detectedAllergens", "reasoning"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Sem resposta do modelo.");

    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Erro na análise Gemini:", error);
    throw new Error("Não foi possível analisar a imagem. Tente novamente com uma foto mais nítida.");
  }
};