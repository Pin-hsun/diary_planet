import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import PlanetScreen from './PlanetScreen';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PlanetScreen />
    </GestureHandlerRootView>
  );
}
