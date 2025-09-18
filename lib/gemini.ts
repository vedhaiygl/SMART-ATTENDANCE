import { GoogleGenAI } from "@google/genai";
import type { Course } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAIInsights = async (course: Course): Promise<string> => {
    if (!process.env.API_KEY) {
      throw new Error("API key is not configured.");
    }

    if (!course || course.sessions.length < 3) {
        return Promise.resolve("Not enough session data to perform an analysis. Please conduct at least 3 sessions.");
    }

    const model = "gemini-2.5-flash";

    // Format the data for the prompt
    const formattedData = course.sessions.map(session => {
        const totalStudents = course.students.length;
        const presentCount = course.attendance.filter(a => a.sessionId === session.id && a.status === 'Present').length;
        const percentage = totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(1) : "0.0";
        return `- ${new Date(session.date).toLocaleDateString()}: ${percentage}% attendance`;
    }).join('\n');

    const prompt = `
        You are an expert educational analyst providing advice to a university instructor.
        
        Analyze the following attendance data for the course: "${course.name}". The data shows the attendance percentage for each session, ordered chronologically.
        
        Data:
        ${formattedData}
        
        Based on this data, please do the following:
        1.  **Analysis:** Briefly identify one or two key patterns or trends in student attendance.
        2.  **Recommendations:** Provide exactly three distinct, actionable, and creative strategies that the instructor could implement to improve student engagement and attendance.
        
        Format your response in simple markdown, like this example:
        
        **Analysis:**
        I've noticed a consistent drop in attendance for sessions held on Fridays.
        
        **Recommendations:**
        1.  **Introduce Interactive Polls:** Start Friday sessions with a quick, engaging poll related to the week's topic to immediately capture attention.
        2.  **Connect to Real-World Applications:** Dedicate a small portion of Friday lectures to showing how the concepts apply to current industry trends or news.
        3.  **Peer Teaching Moment:** Create short, 5-minute segments where students break into pairs to explain a concept to each other. This encourages active participation.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error fetching AI insights:", error);
        throw new Error("Failed to get insights from the AI. Please check your connection or API key.");
    }
};

export const getAIAssistedCatchUpPlan = async (courseName: string, sessionDate: string): Promise<string> => {
    if (!process.env.API_KEY) {
      throw new Error("API key is not configured.");
    }

    const model = "gemini-2.5-flash";

    const prompt = `
        You are a friendly and helpful academic assistant.
        A student missed their university lecture for the course "${courseName}" on ${new Date(sessionDate).toLocaleDateString()}.

        Create a concise, personalized 3-step catch-up plan for this student. The plan should be encouraging and easy to follow.

        Please include:
        1.  **Key Concepts to Review:** Briefly list the most important topics they likely missed.
        2.  **Actionable Task:** Suggest a specific type of practice problem to solve or a small exercise to complete.
        3.  **External Resource:** Recommend one high-quality, free external resource (like a specific YouTube video, Khan Academy link, or a well-known article) to help them understand the material.

        Format the response in simple markdown. Start with a brief, encouraging sentence. For example: "No problem, here is a simple plan to get you caught up!".

        Example response format:
        
        No problem, here is a simple plan to get you caught up!
        
        **1. Key Concepts to Review:**
        -   First, focus on understanding the core principles of [Concept A].
        -   Then, make sure you are comfortable with [Concept B].
        
        **2. Actionable Task:**
        To solidify your understanding, try to [specific task, e.g., "solve three basic exercises on page 54 of the textbook" or "write a short summary of how Concept A and B are related"].
        
        **3. External Resource:**
        For a great visual explanation, watch the "[Relevant Video Title]" video on the [Channel Name] YouTube channel. It covers these topics really well.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error fetching AI catch-up plan:", error);
        throw new Error("Failed to get a catch-up plan from the AI. Please check your connection or API key.");
    }
};
