

import { GoogleGenAI, Type, Chat } from "@google/genai";
import type { Course, AtRiskStudent } from '../types';

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

export const getAtRiskStudents = async (course: Course): Promise<AtRiskStudent[]> => {
    if (!process.env.API_KEY) {
        throw new Error("API key is not configured.");
    }

    const model = "gemini-2.5-flash";
    const recentSessions = course.sessions.slice(-5).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const studentAttendanceData = course.students.map(student => {
        const attendance = recentSessions.map(session => {
            const record = course.attendance.find(a => a.sessionId === session.id && a.studentId === student.id);
            return record?.status || 'Absent';
        });
        return { studentId: student.id, studentName: student.name, attendance };
    });

    const prompt = `
        You are an expert educational analyst. Analyze the attendance data for the course "${course.name}".
        The data is a list of students and their attendance status ('Present' or 'Absent') for the last ${recentSessions.length} sessions, ordered from most recent to oldest.

        Identify up to 5 students who are most at risk of falling behind based on their attendance. Prioritize students with multiple recent consecutive absences or a clear downward trend in attendance.
        
        For each student you identify, provide their studentId, studentName, and a concise, one-sentence reason for flagging them.

        Here is the attendance data:
        ${JSON.stringify(studentAttendanceData, null, 2)}
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            studentId: { type: Type.STRING },
                            studentName: { type: Type.STRING },
                            reason: { type: Type.STRING },
                        },
                        required: ["studentId", "studentName", "reason"],
                    },
                },
            },
        });
        
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        return result as AtRiskStudent[];
    } catch (error) {
        console.error("Error fetching at-risk students:", error);
        throw new Error("Failed to get analysis from the AI. Please check your connection or API key.");
    }
};


export const generateOutreachEmail = async (studentName: string, courseName: string, reason: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API key is not configured.");
    }

    const model = "gemini-2.5-flash";

    const prompt = `
        You are a caring and supportive university instructor. Write a short, positive, and encouraging email template to a student named "${studentName}" who is enrolled in your course "${courseName}".

        The reason for reaching out is that you've noticed their recent attendance has been slipping. The specific pattern observed is: "${reason}".

        The email should:
        - Be friendly and not accusatory.
        - Express concern for their well-being.
        - Gently mention you've missed them in class recently.
        - Offer support and invite them to office hours or to reply to the email if they're facing challenges.
        - Keep it brief, around 3-4 sentences.

        Start the email with 'Subject: Checking in from ${courseName}' and then 'Hi ${studentName},'.
        Do not include a sign-off like 'Best regards, Dr. Admin'.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating outreach email:", error);
        throw new Error("Failed to generate the email from the AI. Please try again.");
    }
};

export const generateLearningPath = async (courseName: string, studentName: string, attendancePercentage: number): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API key is not configured.");
    }

    const model = "gemini-2.5-flash";

    const isHighPerformer = attendancePercentage >= 85;
    const studentStatus = isHighPerformer ? "has excellent attendance" : "has low attendance";
    const goal = isHighPerformer
        ? "suggest two distinct, challenging, and rewarding enrichment activities or advanced topics to help them dive deeper into the subject."
        : "suggest two distinct, focused, and actionable catch-up resources or exercises to help them get back on track.";

    const prompt = `
        You are an expert academic advisor creating a personalized learning path for a student named "${studentName}" in your "${courseName}" course.
        This student ${studentStatus} with an overall attendance of ${attendancePercentage}%.

        Your task is to ${goal}

        For each suggestion:
        1.  Provide a clear, bolded title using markdown (e.g., **Title**).
        2.  Follow it with a brief, encouraging, one or two-sentence description of the activity or resource.

        Your tone should be supportive and motivational.

        Example format for a high-performer:
        **Deep Dive: The Ethics of AI**
        Explore the ethical implications of artificial intelligence, a topic we only touched on briefly. A great starting point is the documentary "Coded Bias" available on Netflix.

        **Project Idea: Build a Neural Network**
        Challenge yourself by building a simple neural network from scratch to classify images. There are excellent tutorials on YouTube by 3Blue1Brown to guide you.

        Example format for a student needing support:
        **Review Key Concepts: Data Structures**
        Let's solidify the fundamentals. Spend 20 minutes reviewing how arrays and linked lists work using the interactive visualizations on Visualgo.net.

        **Practice Problems: Big O Notation**
        Complete five practice problems on Big O notation on a platform like HackerRank. This will build your confidence in analyzing algorithm efficiency.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating learning path:", error);
        throw new Error("Failed to generate the learning path from the AI. Please try again.");
    }
};

export const startChatWithStudyBuddy = (courses: Course[], studentName: string): Chat => {
    if (!process.env.API_KEY) {
        throw new Error("API key is not configured.");
    }

    const courseInfo = courses
        .filter(course => course.students.some(student => student.name === studentName))
        .map(c => `- ${c.name} (${c.code})`).join('\n');

    const systemInstruction = `
        You are a friendly and encouraging AI Study Buddy for a university student named ${studentName}.
        Your goal is to help them with their studies.
        The student is enrolled in the following courses:
        ${courseInfo}
        
        When answering questions:
        - Keep your responses concise, helpful, and positive.
        - If a question is about a specific course, use the course name in your response.
        - If a question is generic (e.g., "give me a study tip"), provide a general academic tip.
        - If you don't know the answer, say so politely and suggest where they might find it (like asking their instructor).
        - Do not answer questions that are unrelated to academics or the student's courses. Gently guide the conversation back to their studies.
        - Use markdown for formatting, like lists and bolding, to make your answers easy to read.
    `;

    const model = "gemini-2.5-flash";

    const chat = ai.chats.create({
        model,
        config: {
            systemInstruction,
        },
    });
    
    return chat;
};
