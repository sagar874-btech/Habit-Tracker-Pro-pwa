# Habit-Tracker-Pro-pwa

A modern Progressive Web App (PWA) for tracking daily habits with offline support, analytics, and beautiful UI.

## Features

- **Progressive Web App** - Install on any device
- **Offline First** - Works without internet using IndexedDB
- **Analytics Dashboard** - Beautiful charts and statistics
- **Push Notifications** - Daily reminders
- **Dark Mode** - Easy on the eyes
- **Calendar View** - Monthly heatmap visualization
- **Streak Tracking** - Monitor your consistency
- **Category System** - Organize habits by type

## Getting Started

### Prerequisites
- Node.js 14+ installed
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/habit-tracker-pwa.git
cd habit-tracker-pwa
```

2. Install dependencies
```bash
npm install
```

3. Start development server
```bash
npm start
```

4. Build for production
```bash
npm run build
```

## PWA Installation

The app will prompt users to install it on their device. Once installed:
- Works offline
- Appears in app drawer/home screen
- Launches like a native app

## Technologies Used

- **React** - UI framework
- **IndexedDB** - Local database storage
- **Recharts** - Data visualization
- **Lucide React** - Beautiful icons
- **Tailwind CSS** - Utility-first styling
- **Service Workers** - Offline functionality

##  Project Structure
```
Habit-Tracker-Pro-pwa/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── service-worker.js
├── src/
│   ├── App.js
│   └── index.js
├── package.json
└── README.md
```

## Features Breakdown

### Dashboard
- Quick stats overview
- Today's completion status
- 30-day completion rate
- Best streak display

### Habits Management
- Add/Edit/Delete habits
- Category assignment
- 7-day quick view
- Streak tracking

### Analytics
- 30-day trend chart
- Category distribution
- Completion statistics
- Visual insights

### Calendar
- Monthly heatmap view
- Color-coded completion rates
- Navigate through months
- Visual progress tracking

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Author

Your Name - [@yourusername](https://github.com/yourusername)

## Acknowledgments

- Icons by [Lucide](https://lucide.dev/)
- Charts by [Recharts](https://recharts.org/)
- Styling by [Tailwind CSS](https://tailwindcss.com/)
```

---

### **File 9: `LICENSE`**
```
MIT License

Copyright (c) 2024 sagar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
