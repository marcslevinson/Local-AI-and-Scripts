# Master Tool

This is the master tool for visualizing and interfacing with various tools. The goal is to provide a centralized platform to manage and interact with different tools efficiently. The project uses Ionic, Tailwind CSS, and Capacitor to build and iterate as a normal web app in the browser, then wrap it for iOS/Android later.

## Features
- Centralized interface for multiple tools
- Visualization of tool outputs
- Easy navigation and management

## Getting Started
1. Clone the repository.
2. Install Node.js and npm if you haven't already.
3. Install Ionic CLI and Capacitor CLI:
   ```bash
   npm install -g @ionic/cli @capacitor/cli
   ```
4. Install project dependencies:
   ```bash
   npm install
   ```
5. Run the app in the browser:
   ```bash
   ionic serve
   ```
6. Build for iOS/Android:
   ```bash
   ionic build
   npx cap add ios
   npx cap add android
   npx cap open ios
   npx cap open android
   ```

## Contributing
Feel free to contribute by adding new tools, improving existing ones, or enhancing the user interface.
