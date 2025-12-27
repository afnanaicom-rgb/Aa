// afnan.js - Settings page functionality

// Translations
const translations = {
    en: {
        settings: "Settings",
        darkMode: "Dark Mode",
        darkModeDesc: "Switch between light and dark theme",
        language: "Language",
        languageDesc: "Select your preferred language",
        privacyPolicy: "Privacy Policy",
        privacyPolicyDesc: "Read our privacy policy",
        termsOfService: "Terms of Service",
        termsOfServiceDesc: "Read our terms of service"
    },
    ar: {
        settings: "الإعدادات",
        darkMode: "الوضع الليلي",
        darkModeDesc: "التبديل بين الوضع الفاتح والداكن",
        language: "اللغة",
        languageDesc: "اختر لغتك المفضلة",
        privacyPolicy: "سياسة الخصوصية",
        privacyPolicyDesc: "اقرأ سياسة الخصوصية الخاصة بنا",
        termsOfService: "شروط الخدمة",
        termsOfServiceDesc: "اقرأ شروط الخدمة الخاصة بنا"
    },
    zh: {
        settings: "设置",
        darkMode: "深色模式",
        darkModeDesc: "在浅色和深色主题之间切换",
        language: "语言",
        languageDesc: "选择您的首选语言",
        privacyPolicy: "隐私政策",
        privacyPolicyDesc: "阅读我们的隐私政策",
        termsOfService: "服务条款",
        termsOfServiceDesc: "阅读我们的服务条款"
    },
    fr: {
        settings: "Paramètres",
        darkMode: "Mode Sombre",
        darkModeDesc: "Basculer entre le thème clair et sombre",
        language: "Langue",
        languageDesc: "Sélectionnez votre langue préférée",
        privacyPolicy: "Politique de Confidentialité",
        privacyPolicyDesc: "Lire notre politique de confidentialité",
        termsOfService: "Conditions d'Utilisation",
        termsOfServiceDesc: "Lire nos conditions d'utilisation"
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const languageSelect = document.getElementById('languageSelect');
    
    // Load saved preferences
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedLanguage = localStorage.getItem('language') || 'en';
    
    // Apply saved theme
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }
    
    // Apply saved language
    languageSelect.value = savedLanguage;
    applyLanguage(savedLanguage);
    
    // Dark mode toggle handler
    darkModeToggle.addEventListener('change', () => {
        if (darkModeToggle.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    });
    
    // Language change handler
    languageSelect.addEventListener('change', () => {
        const selectedLanguage = languageSelect.value;
        localStorage.setItem('language', selectedLanguage);
        applyLanguage(selectedLanguage);
        
        // Update direction for Arabic
        if (selectedLanguage === 'ar') {
            document.documentElement.setAttribute('dir', 'rtl');
            document.documentElement.setAttribute('lang', 'ar');
        } else if (selectedLanguage === 'zh') {
            document.documentElement.setAttribute('dir', 'ltr');
            document.documentElement.setAttribute('lang', 'zh');
        } else if (selectedLanguage === 'fr') {
            document.documentElement.setAttribute('dir', 'ltr');
            document.documentElement.setAttribute('lang', 'fr');
        } else {
            document.documentElement.setAttribute('dir', 'ltr');
            document.documentElement.setAttribute('lang', 'en');
        }
    });
});

function applyLanguage(lang) {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
}
