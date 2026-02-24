# GitHub Copilot Instructions for SplitItUp

## Overview
This document provides guidelines for AI coding agents to effectively contribute to the SplitItUp project. It covers the architecture, developer workflows, project conventions, and integration points.

## Project Architecture
- **TypeScript**: The project is built using TypeScript, ensuring type safety and better tooling support.
- **Expo**: Utilizes Expo for building React Native applications, allowing for rapid development and deployment.
- **Folder Structure**:
  - `app/`: Contains the main application components and screens.
  - `assets/`: Holds images and other static assets.
  - `components/`: Reusable UI components.
  - `constants/`: Configuration and theme constants.
  - `hooks/`: Custom hooks for shared logic.
  - `scripts/`: Utility scripts for project management.

## Developer Workflows
1. **Setting Up the Environment**:
   - Clone the repository and run `npm install` to install dependencies.
   - Use `npm start` to launch the development server.

2. **Coding Standards**:
   - Follow the ESLint rules defined in `eslint.config.js`.
   - Ensure code is well-documented and follows TypeScript conventions.

3. **Testing**:
   - Write tests for new features and components.
   - Use Jest for unit testing as configured in `package.json`.

4. **Debugging**:
   - Utilize React Native Debugger for debugging the application.
   - Log errors and warnings to the console for easier tracking.

## Project Conventions
- **Component Naming**: Use PascalCase for component names (e.g., `ProfileScreen`, `CustomModal`).
- **File Structure**: Organize files by feature and keep related files together.
- **Styling**: Use Tailwind CSS for styling components as defined in `tailwind.config.js`.

## Integration Points
- **API Integration**: Use environment variables for sensitive data (e.g., API keys) as defined in `expo-env.d.ts`.
- **Navigation**: Implement navigation using React Navigation, ensuring smooth transitions between screens.
- **State Management**: Consider using context or state management libraries for managing global state.

## Conclusion
By following these guidelines, AI coding agents can effectively contribute to the SplitItUp project, ensuring consistency and quality in the codebase.