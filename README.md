# Investment Decision Evaluation System

[English](README.md) | [中文](README_zh.md)

## Overview

This project is a sophisticated web application designed to assist investors in making more rational and data-driven investment decisions. By leveraging a structured evaluation framework and advanced AI capabilities, the system aims to quantify the quality of the investment decision-making process, identify potential cognitive biases, and enhance the transparency of risk-reward trade-offs.

The core of the application is an evaluation engine based on a multi-stage scoring system. It assesses various aspects of an investment thesis, including:

*   Clarity of objectives
*   Market and company analysis
*   Valuation reasoning
*   Entry and exit strategy definition
*   Risk identification and mitigation planning
*   Portfolio management considerations
*   Contingency planning

## Key Features

*   **Quantitative Scoring:** Implements a weighted scoring algorithm across seven key decision stages, providing a quantifiable measure of decision quality.
*   **AI-Powered Analysis:** Integrates with AI models (e.g., DeepSeek API with `deepseek-reasoner`) to evaluate qualitative aspects like logical consistency, self-coherence of buy/sell rules, and potential biases in reasoning.
*   **Subjectivity Handling:** Employs rule-based checks, keyword analysis, and NLP techniques to interpret and score subjective user inputs more objectively.
*   **Actionable Feedback:** Generates tailored suggestions based on the evaluation score and identified weaknesses, aiming to reduce irrationality and improve risk management.
*   **Dynamic Adjustments:** Considers user-specific parameters (e.g., risk tolerance, investment horizon) to personalize feedback.
*   **Focus on Process, Not Perfection:** The primary goal is not to achieve a perfect score but to foster a more disciplined, transparent, and bias-aware investment process.

## Target Audience

This tool is intended for individual investors, financial advisors, and investment analysts who seek to:

*   Improve the rigor and structure of their investment decision-making.
*   Identify and mitigate common behavioral biases.
*   Gain clearer insights into the potential risks and rewards of their strategies.
*   Maintain a documented record of their investment reasoning and evaluation.

## Technical Stack

*   **Frontend:** React, TypeScript, Tailwind CSS
*   **Backend/Evaluation Logic:** Node.js, TypeScript
*   **AI Integration:** DeepSeek API (or similar)

## Getting Started (Development)

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## Deployment

This application is well-suited for deployment on platforms like [Vercel](https://vercel.com/).

### Vercel Deployment and Environment Variables

To enable the AI-enhanced analysis features powered by the DeepSeek API, you need to configure an environment variable in your Vercel project.

1.  **Get your DeepSeek API Key:** Obtain your API key from the [DeepSeek Platform](https://platform.deepseek.com/).
2.  **Set Environment Variable in Vercel:**
    *   Go to your project dashboard on Vercel.
    *   Navigate to **Settings** > **Environment Variables**.
    *   Add a new environment variable:
        *   **Name:** `REACT_APP_DEEPSEEK_API_KEY` (This specific name is required because the project uses Create React App conventions to expose the variable to the frontend. If you use a different build tool like Vite, the name should be `VITE_DEEPSEEK_API_KEY`).
        *   **Value:** Paste your DeepSeek API key here.
    *   **Scope:** Choose the environments where you want the key to be available (e.g., Production, Preview, Development).
    *   Save the variable.
3.  **Deploy/Redeploy:** Trigger a new deployment on Vercel. Vercel will automatically inject the environment variable during the build process and make it available to your application at runtime (`process.env.REACT_APP_DEEPSEEK_API_KEY`).

**Note:** Exposing API keys directly to the frontend (even via environment variables with prefixes) carries some security risks. For production applications requiring higher security, consider implementing a backend proxy or serverless function on Vercel to handle API calls, keeping the key securely on the server-side.

### Firebase Storage CORS Configuration

To upload files from the deployed application, the Firebase Storage bucket must allow cross-origin requests from your deployment domain. Create a `cors.json` file such as:

```json
[
  {
    "origin": ["https://your-app-domain.com"],
    "method": ["GET", "PUT", "POST", "DELETE"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type"]
  }
]
```

Apply the configuration to your bucket using the [gsutil](https://cloud.google.com/storage/docs/gsutil) tool:

```bash
gsutil cors set cors.json gs://your-project-id.appspot.com
```

Be sure to replace `your-project-id` with your actual Firebase project ID.
