import { useAppContext } from '../context/AppContext';

export function useBetsOdds() {
  const { odds, setOdd } = useAppContext();
  return { odds, setOdd };
}
