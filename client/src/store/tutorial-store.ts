import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TutorialState {
  isFirstTimeUser: boolean;
  tutorialStep: 'waiting' | 'product-highlight' | 'cart-highlight' | 'cart-opened' | 'completed';
  hasSeenTutorial: boolean;
}

interface TutorialActions {
  setFirstTimeUser: (isFirstTime: boolean) => void;
  setTutorialStep: (step: TutorialState['tutorialStep']) => void;
  completeTutorial: () => void;
  resetTutorial: () => void;
  startTutorial: () => void;
}

type TutorialStore = TutorialState & TutorialActions;

export const useTutorialStore = create<TutorialStore>()(
  persist(
    (set, get) => ({
      // State
      isFirstTimeUser: false,
      tutorialStep: 'waiting',
      hasSeenTutorial: false,

      // Actions
      setFirstTimeUser: (isFirstTime: boolean) => {
        set({ isFirstTimeUser: isFirstTime });
        if (isFirstTime && !get().hasSeenTutorial) {
          set({ tutorialStep: 'waiting' });
        }
      },

      setTutorialStep: (step: TutorialState['tutorialStep']) => {
        set({ tutorialStep: step });
      },

      startTutorial: () => {
        if (get().isFirstTimeUser && !get().hasSeenTutorial) {
          set({ tutorialStep: 'product-highlight' });
        }
      },

      completeTutorial: () => {
        set({ 
          tutorialStep: 'completed',
          hasSeenTutorial: true,
          isFirstTimeUser: false
        });
      },

      resetTutorial: () => {
        set({ 
          isFirstTimeUser: false,
          tutorialStep: 'waiting',
          hasSeenTutorial: false
        });
      }
    }),
    {
      name: 'tutorial-storage',
      partialize: (state) => ({ hasSeenTutorial: state.hasSeenTutorial })
    }
  )
);