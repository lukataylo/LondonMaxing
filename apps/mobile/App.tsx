/**
 * Grudge Map — native iOS map shell.
 *
 * This app requires a native dev build (NOT Expo Go):
 *   npx expo run:ios
 *
 * react-native-maps bundles a native module that Expo Go does not include.
 */
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NativeMapScreen } from "./src/NativeMapScreen";

export default function App() {
  return (
    <SafeAreaProvider>
      <NativeMapScreen />
    </SafeAreaProvider>
  );
}
