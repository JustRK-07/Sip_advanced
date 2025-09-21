import { feedbackScript } from './feedback';

export type ScriptTemplate = {
    id: string;
    name: string;
    description: string;
    script: string;
};

export const scriptTemplates: ScriptTemplate[] = [
    {
        id: 'feedback',
        name: 'Customer Feedback Survey',
        description: 'Collect feedback about recent support interactions',
        script: feedbackScript,
    },
    // Add more script templates here
];

export function getScriptTemplate(id: string): ScriptTemplate | undefined {
    return scriptTemplates.find(template => template.id === id);
}

export function getAllScriptTemplates(): ScriptTemplate[] {
    return scriptTemplates;
} 