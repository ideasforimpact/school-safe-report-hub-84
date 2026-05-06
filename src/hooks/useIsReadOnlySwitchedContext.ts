import { useEmployeeStore } from '@/store/EmployeeContext';

export const useIsReadOnlySwitchedContext = (): boolean => {
  const { state } = useEmployeeStore();
  return state.isSwitchedContext === true && state.switchedAccessLevel === 'R';
};
