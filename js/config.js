// Configuração do Tailwind CSS
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        surface: {
          light: '#ffffff',
          'light-alt': '#f8fafc',
          dark: '#0f172a',
          'dark-card': '#1e293b',
          'dark-border': '#334155'
        }
      }
    }
  }
};

// Inicialização do Firebase Firestore
const firebaseConfig = {
  apiKey: "AIzaSyDlIrwGjx0i4IyW5y3AYN6OXO1rCT5jETo",
  authDomain: "finanzio-d7992.firebaseapp.com",
  projectId: "finanzio-d7992",
  storageBucket: "finanzio-d7992.firebasestorage.app",
  messagingSenderId: "23222566879",
  appId: "1:23222566879:web:db6fdc9eb13e73e71c8e6a"
};

try {
  firebase.initializeApp(firebaseConfig);
  window._fbDB = firebase.firestore();
  window._fbReady = true;
  console.log("✅ Firebase conectado!");
  document.dispatchEvent(new Event('firebase-ready'));
} catch (e) {
  console.error("❌ Firebase erro:", e.message);
}