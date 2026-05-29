import { AITool } from '../types/tools';

export const defaultTools: AITool[] = [
  {
    id: 'summarizer',
    name: 'Concept Summarizer',
    description: 'Summarize articles, research text, lecture notes, or books into beautiful structured guides.',
    icon: 'FileText',
    inputs: [
      {
        id: 'content',
        label: 'Source Material / Paste Text',
        type: 'textarea',
        placeholder: 'Paste the article text, notes, or paragraphs you need summarized here...',
      },
      {
        id: 'length',
        label: 'Summary Format',
        type: 'select',
        defaultValue: 'standard',
        options: [
          { label: 'Standard (Detailed key points + outline)', value: 'standard' },
          { label: 'Executive (Brief summary & high-level takeaways)', value: 'executive' },
          { label: 'Extremely Dense (Deep comprehensive concept summary)', value: 'dense' },
        ],
      },
    ],
    systemPrompt: 'You are an elite academic editor. Summarize the provided content into a highly structured, clean Markdown outline. Highlight main takeaways, define core technical terms, list details in clean bullet lists, and output a concise closing "takeaway" box.',
    userPromptTemplate: 'Please summarize this text:\n\nFormat: {{length}}\n\nSource Content:\n"""\n{{content}}\n"""',
  },
  {
    id: 'quiz-generator',
    name: 'Exam Quiz Generator',
    description: 'Generate high-fidelity quiz questions (MCQs & short doubts) to test active recall.',
    icon: 'HelpCircle',
    inputs: [
      {
        id: 'topic',
        label: 'Subject / Topic / Text source',
        type: 'textarea',
        placeholder: 'Enter study topic or paste text to generate questions from...',
      },
      {
        id: 'count',
        label: 'Number of Questions',
        type: 'select',
        defaultValue: '5',
        options: [
          { label: '3 Questions', value: '3' },
          { label: '5 Questions', value: '5' },
          { label: '10 Questions', value: '10' },
        ],
      },
      {
        id: 'difficulty',
        label: 'Difficulty Level',
        type: 'select',
        defaultValue: 'medium',
        options: [
          { label: 'Beginner (Basic definitions & recall)', value: 'easy' },
          { label: 'Intermediate (Conceptual & application)', value: 'medium' },
          { label: 'Advanced (Analysis & complex reasoning)', value: 'hard' },
        ],
      },
    ],
    systemPrompt: 'You are a rigorous university professor. Generate a high-fidelity quiz with the specified number of questions. Provide Multiple Choice Questions (with options A, B, C, D) and Short Answer Questions. Under each question, write an expandable "Answer & Explanation" dropdown block in Markdown detailing the correct answer, step-by-step logic, and why other options are incorrect.',
    userPromptTemplate: 'Please generate a quiz based on this topic/source:\n\nTopic/Source:\n{{topic}}\n\nNumber of Questions: {{count}}\nDifficulty: {{difficulty}}',
  },
  {
    id: 'flashcard-generator',
    name: 'Flashcard Generator',
    description: 'Convert lectures or source notes into a list of premium active-recall flashcard sets.',
    icon: 'Layers',
    inputs: [
      {
        id: 'material',
        label: 'Study Material / Topic',
        type: 'textarea',
        placeholder: 'Paste notes or topic guidelines to create flashcards...',
      },
      {
        id: 'style',
        label: 'Recall Style',
        type: 'select',
        defaultValue: 'qa',
        options: [
          { label: 'Question & Answer (Standard)', value: 'qa' },
          { label: 'Concept & Definition (Term identification)', value: 'definition' },
          { label: 'Fill-in-the-Blank (Cloze deletion)', value: 'fill' },
        ],
      },
    ],
    systemPrompt: 'You are a cognitive science expert specializing in space repetition active recall. Convert the provided study notes into a premium set of flashcards. Format each card clearly in Markdown using a styled block with headers "CARD FRONT (Question/Prompt)" and "CARD BACK (Core Answer/Explanation)". Ensure explanations are concise, dense, and focus on high-yield recall.',
    userPromptTemplate: 'Please generate flashcards from this study material:\n\nMaterial:\n{{material}}\n\nRecall Style: {{style}}',
  },
  {
    id: 'doubt-solver',
    name: 'Socratic Doubt Solver',
    description: 'Get deep, step-by-step guidance on complex questions or science/math problems.',
    icon: 'BrainCircuit',
    inputs: [
      {
        id: 'question',
        label: 'Your Question / Problem',
        type: 'textarea',
        placeholder: 'Type your question or paste a math/physics/code problem you are stuck on...',
      },
      {
        id: 'academicLevel',
        label: 'Academic Level',
        type: 'select',
        defaultValue: 'undergrad',
        options: [
          { label: 'Middle / High School', value: 'school' },
          { label: 'Undergraduate College', value: 'undergrad' },
          { label: 'Graduate Research (Complex details)', value: 'grad' },
        ],
      },
    ],
    systemPrompt: 'You are an inspiring Socratic tutor. Rather than just giving the direct answer immediately, break down the underlying core concepts step-by-step. Guide the student on *how* to think about the problem. Present the logical foundations, equations, or structural blocks. Explain *why* each step works, and ask a single conceptual follow-up question at the end to check their understanding.',
    userPromptTemplate: 'I am stuck on this doubt:\n\nQuestion/Problem:\n"""\n{{question}}\n"""\n\nAcademic Level: {{academicLevel}}',
  },
  {
    id: 'study-planner',
    name: 'Study Plan Generator',
    description: 'Formulate weekly study plans and revision timelines to prepare for exams.',
    icon: 'Calendar',
    inputs: [
      {
        id: 'subject',
        label: 'Subject Goal / Exam Outline',
        type: 'text',
        placeholder: 'e.g., AP Calculus BC Exam, React Native Architecture...',
      },
      {
        id: 'timeline',
        label: 'Preparation Timeframe',
        type: 'select',
        defaultValue: '4weeks',
        options: [
          { label: '1 Week (Intensive cram plan)', value: '1week' },
          { label: '4 Weeks (Steady review plan)', value: '4weeks' },
          { label: '12 Weeks (Comprehensive syllabus plan)', value: '12weeks' },
        ],
      },
      {
        id: 'frequency',
        label: 'Hours Committed per Day',
        type: 'select',
        defaultValue: '2hours',
        options: [
          { label: '1 Hour (Light revision)', value: '1hour' },
          { label: '2-3 Hours (Standard preparation)', value: '2hours' },
          { label: '4+ Hours (Dedicated study boot)', value: '4hours' },
        ],
      },
    ],
    systemPrompt: 'You are an academic counselor. Compile a personalized, day-by-day study roadmap in Markdown based on the goals and committed hourly load. Break it into weekly themes. For each week, define target topics, specific active study actions (e.g. flashcard review, mock problems), diagnostic check suggestions, and tips for energy management.',
    userPromptTemplate: 'Please design a study plan for this objective:\n\nObjective: {{subject}}\nTimeframe: {{timeline}}\nTime Commitment: {{frequency}} per day',
  },
];
