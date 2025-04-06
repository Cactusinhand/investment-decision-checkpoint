# 投资决策评估系统

[English](README.md) | [中文](README_zh.md)

## 概述

本项目是一个复杂的 Web 应用程序，旨在帮助投资者做出更理性、数据驱动的投资决策。通过利用结构化的评估框架和先进的 AI 能力，该系统旨在量化投资决策过程的质量，识别潜在的认知偏差，并提高风险回报权衡的透明度。

应用程序的核心是基于多阶段评分系统的评估引擎。它评估投资论证的各个方面，包括：

*   目标的清晰度
*   市场和公司分析
*   估值逻辑
*   入场和退出策略定义
*   风险识别和缓解计划
*   投资组合管理考虑
*   应急计划

## 主要特点

*   **量化评分：** 在七个关键决策阶段实施加权评分算法，提供决策质量的可量化度量。
*   **AI 驱动分析：** 与 AI 模型（例如，带有 `deepseek-reasoner` 的 DeepSeek API）集成，以评估逻辑一致性、买卖规则的自洽性以及推理中潜在偏差等定性方面。
*   **主观性处理：** 采用基于规则的检查、关键字分析和 NLP 技术来更客观地解释和评分主观用户输入。
*   **可操作反馈：** 根据评估分数和已识别的弱点生成量身定制的建议，旨在减少非理性并改善风险管理。
*   **动态调整：** 考虑用户特定参数（例如，风险承受能力、投资期限）以个性化反馈。
*   **关注过程，而非完美：** 主要目标不是获得完美分数，而是培养更具纪律性、透明度和偏差意识的投资过程。

## 目标受众

该工具适用于寻求以下目标的个人投资者、财务顾问和投资分析师：

*   提高其投资决策的严谨性和结构性。
*   识别和减轻常见的行为偏差。
*   更清晰地了解其策略的潜在风险和回报。
*   维护其投资推理和评估的书面记录。

## 技术栈

*   **前端：** React, TypeScript, Tailwind CSS
*   **后端/评估逻辑：** Node.js, TypeScript
*   **AI 集成：** DeepSeek API（或类似 API）

## 入门（开发）

本项目是使用 [Create React App](https://github.com/facebook/create-react-app) 初始化的。

## 可用脚本

在项目目录中，您可以运行：

### `npm start`

在开发模式下运行应用程序。
打开 [http://localhost:3000](http://localhost:3000) 在浏览器中查看。

当您进行更改时，页面将重新加载。
您可能还会在控制台中看到任何 lint 错误。

### `npm test`

在交互式监视模式下启动测试运行器。
有关更多信息，请参阅关于[运行测试](https://facebook.github.io/create-react-app/docs/running-tests)的部分。

### `npm run build`

将应用程序构建为生产版本到 `build` 文件夹。
它以生产模式正确捆绑 React 并优化构建以获得最佳性能。

构建被压缩，文件名包含哈希值。
您的应用程序已准备好部署！

有关更多信息，请参阅关于[部署](https://facebook.github.io/create-react-app/docs/deployment)的部分。

### `npm run eject`

**注意：这是一项单向操作。一旦 `eject`，您将无法返回！**

如果您对构建工具和配置选择不满意，可以随时 `eject`。此命令将从您的项目中删除单个构建依赖项。

取而代之的是，它会将所有配置文件和传递依赖项（webpack、Babel、ESLint 等）直接复制到您的项目中，以便您完全控制它们。除 `eject` 之外的所有命令仍将有效，但它们将指向复制的脚本，以便您可以调整它们。此时，您需要自己处理。

您不必使用 `eject`。精选的功能集适用于中小型部署，您不应感到有义务使用此功能。但是，我们理解，如果您准备好进行自定义时无法进行，此工具将毫无用处。

## 了解更多

您可以在 [Create React App 文档](https://facebook.github.io/create-react-app/docs/getting-started)中了解更多信息。

要学习 React，请查看 [React 文档](https://reactjs.org/)。

### 代码拆分

本节已移至此处：[https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### 分析包大小

本节已移至此处：[https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### 制作渐进式 Web 应用

本节已移至此处：[https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### 高级配置

本节已移至此处：[https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### `npm run build` 压缩失败

本节已移至此处：[https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## 部署

此应用程序非常适合部署在像 [Vercel](https://vercel.com/) 这样的平台上。

### Vercel 部署和环境变量

要启用由 DeepSeek API 提供支持的 AI 增强分析功能，您需要在 Vercel 项目中配置环境变量。

1.  **获取您的 DeepSeek API 密钥：** 从 [DeepSeek 平台](https://platform.deepseek.com/)获取您的 API 密钥。
2.  **在 Vercel 中设置环境变量：**
    *   转到您在 Vercel 上的项目仪表板。
    *   导航到 **Settings** > **Environment Variables**。
    *   添加一个新的环境变量：
        *   **名称 (Name):** `REACT_APP_DEEPSEEK_API_KEY` （必须使用此特定名称，因为项目使用 Create React App 约定将变量暴露给前端。如果您使用不同的构建工具，如 Vite，则名称应为 `VITE_DEEPSEEK_API_KEY`）。
        *   **值 (Value):** 在此处粘贴您的 DeepSeek API 密钥。
    *   **范围 (Scope):** 选择您希望密钥可用的环境（例如，Production、Preview、Development）。
    *   保存变量。
3.  **部署/重新部署：** 在 Vercel 上触发新的部署。Vercel 将在构建过程中自动注入环境变量，并在运行时通过 `process.env.REACT_APP_DEEPSEEK_API_KEY` 使其对您的应用程序可用。

**注意：** 直接将 API 密钥暴露给前端（即使通过带前缀的环境变量）也存在一定的安全风险。对于需要更高安全性的生产应用程序，请考虑在 Vercel 上实现后端代理或无服务器函数来处理 API 调用，从而将密钥安全地保留在服务器端。 