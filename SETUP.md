# SVMS app: setup commands (run in the Codespace terminal)

npx create-expo-app@latest svms
cd svms

# 1. delete the starter files
rm -rf app src components hooks constants scripts app-example
sed -i 's/"userInterfaceStyle": "automatic"/"userInterfaceStyle": "dark"/' app.json

# 2. add the packages the app needs (all work in Expo Go)
npx expo install react-native-svg react-native-webview expo-location @expo/vector-icons
npm install firebase

# 3. upload svms-code.zip into the svms folder (drag and drop in the Codespaces file explorer), then:
unzip -o svms-code.zip && rm svms-code.zip

# 4. run
npx expo start --tunnel
