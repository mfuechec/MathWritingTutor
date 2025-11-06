import { registerRootComponent } from 'expo';

// App with Enhanced UI and GPT-4o validation integration
import App from './AppEnhanced';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
