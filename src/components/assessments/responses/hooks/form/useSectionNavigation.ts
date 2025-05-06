
import { useState } from 'react';
import { AssessmentQuestion } from '@/types/assessment';

export const useSectionNavigation = (questions: AssessmentQuestion[] = []) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
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
  
  const isFirstQuestion = currentSection === 0 && currentQuestionIndex === 0;
  const isLastQuestion = isLastSection && currentQuestionIndex === currentQuestions.length - 1;
  
  const goToNextSection = () => {
    if (!isLastSection) {
      setCurrentSection(prev => prev + 1);
      setCurrentQuestionIndex(0);
    }
  };

  const goToPreviousSection = () => {
    if (!isFirstSection) {
      setCurrentSection(prev => prev - 1);
      setCurrentQuestionIndex(0);
    }
  };
  
  const goToNextQuestion = () => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (!isLastSection) {
      goToNextSection();
    }
  };
  
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (!isFirstSection) {
      goToPreviousSection();
      // Set to the last question of the previous section
      const prevSectionQuestions = groupedQuestions[currentSection - 1] || [];
      setCurrentQuestionIndex(Math.max(0, prevSectionQuestions.length - 1));
    }
  };

  return {
    currentSection,
    setCurrentSection,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    groupedQuestions,
    currentQuestions,
    isFirstSection,
    isLastSection,
    isFirstQuestion,
    isLastQuestion,
    goToNextSection,
    goToPreviousSection,
    goToNextQuestion,
    goToPreviousQuestion
  };
};
