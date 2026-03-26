import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { db } from "../services/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useAuth } from "./AuthContext";

const TutorialContext = createContext();

export function useTutorial() {
  return useContext(TutorialContext);
}

export function TutorialProvider({ children }) {
  const { currentUser, userProfile } = useAuth();

  const [activeTutorial, setActiveTutorial] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedTutorials, setCompletedTutorials] = useState([]);
  const [isReady, setIsReady] = useState(false);

  // Sync completed tutorials from userProfile
  useEffect(() => {
    if (userProfile) {
      setCompletedTutorials(userProfile.completedTutorials || []);
      setIsReady(true);
    }
  }, [userProfile]);

  const isTutorialCompleted = useCallback((tutorialId) => {
    return completedTutorials.includes(tutorialId);
  }, [completedTutorials]);

  const markTutorialCompleted = useCallback(async (tutorialId) => {
    if (!currentUser || isTutorialCompleted(tutorialId)) return;

    const newCompleted = [...completedTutorials, tutorialId];
    setCompletedTutorials(newCompleted);

    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { completedTutorials: newCompleted });
    } catch (error) {
      console.error("Erro ao salvar tutorial concluído:", error);
    }
  }, [currentUser, completedTutorials, isTutorialCompleted]);

  const startTutorial = useCallback((tutorialId) => {
    if (activeTutorial || isTutorialCompleted(tutorialId)) return;
    setActiveTutorial(tutorialId);
    setCurrentStep(0);
  }, [activeTutorial, isTutorialCompleted]);

  const nextStep = useCallback((totalSteps) => {
    if (currentStep + 1 >= totalSteps) {
      // Last step — complete
      if (activeTutorial) {
        markTutorialCompleted(activeTutorial);
      }
      setActiveTutorial(null);
      setCurrentStep(0);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, activeTutorial, markTutorialCompleted]);

  const skipTutorial = useCallback(() => {
    if (activeTutorial) {
      markTutorialCompleted(activeTutorial);
    }
    setActiveTutorial(null);
    setCurrentStep(0);
  }, [activeTutorial, markTutorialCompleted]);

  const value = {
    activeTutorial,
    currentStep,
    completedTutorials,
    isReady,
    startTutorial,
    nextStep,
    skipTutorial,
    isTutorialCompleted
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}
