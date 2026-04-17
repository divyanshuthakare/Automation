#  Playwright Automation Testing Project

##  Overview

This project contains end-to-end automation testing using Playwright for a web application.
It covers the following modules:

* Login Page
* Institute Selection Page
* Role Selection Page
* Dashboard

The goal is to validate UI, Functional, UX, Security, and Performance scenarios.

---

## Tech Stack

* Playwright
* Node.js
* dotenv

---

## 📂 Project Structure

```
tests/
├── login.spec.js
├── institute.spec.js
├── role.spec.js
├── dashboard.spec.js

.env
package.json
playwright.config.js
README.md
```

---

## ⚙️ Setup Instructions

### 1. Install dependencies

```bash
npm install
```

### 2. Install Playwright browsers

```bash
npx playwright install
```

### 3. Create `.env` file

```env
BASE_URL=http://localhost:3000
LOGIN_EMAIL=your_email
LOGIN_PASSWORD=your_password
```

---

## ▶️ Running Tests

### Run all tests

```bash
npx playwright test
```

### Run specific file

```bash
npx playwright test tests/dashboard.spec.js
```

### Run with UI mode

```bash
npx playwright test --ui
```

### Run in headed mode

```bash
npx playwright test --headed
```

---

##  Test Coverage

* UI Testing
* Functional Testing
* UX Testing
* Security Testing
* Performance Testing

---


