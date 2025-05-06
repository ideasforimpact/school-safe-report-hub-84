
import { useState } from 'react';
import { AssessmentQuestion } from '@/types/assessment';

export const useSectionNavigation = (questions: AssessmentQuestion[] = []) => {
  const [currentSection, setCurrentSection] = useState(0);
  
  // Group questions into sections of 5 for easier navigation
  const QUESTIONS_PER_PAGE = 5;
  const groupedQuestions = questions ? (() => {
    const groups = [];
    for (let i = 0; i < questions.length; i += QUESTIONS_PER_PAGE) {
      groups.push(questions.slice(i, i + QUESTIONS_PER_PAGE));
    }
    return groups;
  })() : [];
  
  const currentQuestions = groupedQuestions[currentSection] || [];
  const isFirstSection = currentSection === 0;
  const isLastSection = currentSection === groupedQuestions.length - 1;
  
  const goToNextSection = () => {
    setCurrentSection(prev => Math.min(groupedQuestions.length - 1, prev + 1));
  };

  const goToPreviousSection = () => {
    setCurrentSection(prev => Math.max(0, prev - 1));
  };

  return {
    currentSection,
    setCurrentSection,
    groupedQuestions,
    currentQuestions,
    isFirstSection,
    isLastSection,
    goToNextSection,
    goToPreviousSection
  };
};
