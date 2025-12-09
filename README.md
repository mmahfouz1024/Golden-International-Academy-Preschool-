# Golden International Academy & Pre-school

A smart, bilingual (Arabic/English) kindergarten management system featuring an AI-powered assistant for activity planning and daily reporting.

## Features

- **📊 Interactive Dashboard**: Real-time overview of student attendance and school statistics.
- **👶 Student Registry**: Complete management of student profiles and details.
- **📝 Daily Reports**: Detailed tracking of mood, meals, naps, and activities with photo uploads.
- **✨ AI Assistant**: Powered by Google Gemini to generate educational activity plans and draft parent communications.
- **📅 Attendance System**: Efficient daily attendance tracking.
- **👥 User & Class Management**: Role-based access control (Admin, Teacher, Parent) and class organization.
- **📱 Responsive Design**: Optimized for tablets and mobile devices (PWA ready).
- **🌍 Bilingual Support**: Full Arabic and English interface with RTL support.

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide React
- **AI Integration**: Google GenAI SDK (Gemini)
- **Charts**: Recharts

## Setup & Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/golden-academy.git
   cd golden-academy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory and add your Google Gemini API key:
   ```env
   API_KEY=your_api_key_here
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## Building for Production

To create a production build:

```bash
npm run build
```

The output will be in the `dist` directory.

## License

MIT
