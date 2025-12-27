
// login.js - النسخة النهائية والمصححة

// 1. استيراد الخدمات
import { auth, db } from "./firebase-config.js";
import { 
    sendSignInLinkToEmail, 
    isSignInWithEmailLink, 
    signInWithEmailLink,
    onAuthStateChanged,
    GoogleAuthProvider,
    GithubAuthProvider,
    MicrosoftAuthProvider,
    signInWithRedirect,   // ✅ التغيير الجذري: استخدام Redirect
    getRedirectResult,    // ✅ استقبال النتيجة بعد العودة
    setPersistence,
    browserLocalPersistence,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";

import { ref, get } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-database.js";

// 2. إعدادات الاستمرارية
setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Error setting persistence:", error);
});

// 3. دوال التنقل (جعلناها global لتعمل مع HTML)
window.openPage = function(pageId) {
    document.querySelectorAll('.page, .full-page').forEach(page => {
        page.classList.remove('active');
        if (page.style.display === 'block') page.style.display = 'none';
    });
    const pageToShow = document.getElementById(pageId);
    if (pageToShow) {
        pageToShow.classList.add('active');
        pageToShow.style.display = 'block';
    }
};

window.closePage = function(pageId) {
    const pageToClose = document.getElementById(pageId);
    if (pageToClose) {
        pageToClose.classList.remove('active');
        pageToClose.style.display = 'none';
    }
    const loginPage = document.getElementById('loginPage');
    if (loginPage) {
        loginPage.classList.add('active');
        loginPage.style.display = 'block';
    }
};

// 4. معالجة العودة من جوجل/جيت هب (هذا الكود يعمل فور فتح الصفحة)
getRedirectResult(auth)
    .then((result) => {
        if (result) {
            console.log("✅ تم تسجيل الدخول بنجاح عبر Redirect:", result.user);
            // onAuthStateChanged ستقوم بالتوجيه تلقائياً
        }
    })
    .catch((error) => {
        console.error("❌ خطأ في تسجيل الدخول:", error);
        alert("فشل تسجيل الدخول: " + error.message);
    });

// 5. انتظار تحميل الصفحة بالكامل (الحل لمشكلة الأزرار لا تستجيب)
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 الصفحة جاهزة، جاري ربط الأزرار...");

    // --- إعداد Recaptcha للهاتف ---
    const phoneSubmitBtn = document.getElementById('phoneSubmit');
    if (phoneSubmitBtn) {
        try {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'phoneSubmit', {
                'size': 'invisible',
                'callback': (response) => { console.log("Recaptcha solved"); }
            });
            window.recaptchaVerifier.render();
        } catch (e) {
            console.error("Recaptcha Error:", e);
        }
    }

    // --- زر جوجل (Google) ---
    const googleBtn = document.getElementById('googleLogin');
    if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            console.log("تم الضغط على زر جوجل");
            const provider = new GoogleAuthProvider();
            signInWithRedirect(auth, provider); // استخدام Redirect
        });
    }

    // --- زر مايكروسوفت (Microsoft) ---
    const microsoftBtn = document.getElementById('microsoftLogin');
    if (microsoftBtn) {
        microsoftBtn.addEventListener('click', () => {
            console.log("تم الضغط على زر مايكروسوفت");
            const provider = new MicrosoftAuthProvider();
            signInWithRedirect(auth, provider);
        });
    }

    // --- زر جيت هب (GitHub) ---
    const githubBtn = document.getElementById('githubLogin');
    if (githubBtn) {
        githubBtn.addEventListener('click', () => {
            console.log("تم الضغط على زر جيت هب");
            const provider = new GithubAuthProvider();
            signInWithRedirect(auth, provider);
        });
    }

    // --- زر الإيميل (Email Link) ---
    const emailBtn = document.getElementById('emailSubmit');
    if (emailBtn) {
        emailBtn.addEventListener('click', async () => {
            const emailInput = document.getElementById('emailInput');
            const email = emailInput ? emailInput.value : "";
            if (!email) { alert("أدخل الإيميل"); return; }
            
            const actionCodeSettings = {
                url: window.location.origin + '/login.html',
                handleCodeInApp: true,
            };

            try {
                await sendSignInLinkToEmail(auth, email, actionCodeSettings);
                window.localStorage.setItem('emailForSignIn', email);
                window.openPage('emailVerificationPage');
                document.getElementById('verificationEmailDisplay').textContent = email;
            } catch (error) {
                console.error(error);
                alert(error.message);
            }
        });
    }

    // --- زر الهاتف (Phone Auth) ---
    if (phoneSubmitBtn) {
        phoneSubmitBtn.addEventListener('click', async () => {
            const phoneVal = document.getElementById('phoneInput').value;
            if (!phoneVal) { alert("أدخل رقم الهاتف"); return; }
            
            const phoneNumber = '+20' + phoneVal;
            try {
                const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
                window.confirmationResult = confirmationResult;
                window.openPage('phoneVerificationPage');
            } catch (error) {
                console.error(error);
                alert("خطأ في إرسال الرمز: " + error.message);
                window.recaptchaVerifier.render().then(widgetId => grecaptcha.reset(widgetId));
            }
        });
    }

    // --- زر التحقق من كود الهاتف ---
    const verifyPhoneBtn = document.getElementById('verifyPhone');
    if (verifyPhoneBtn) {
        verifyPhoneBtn.addEventListener('click', async () => {
            const inputs = document.querySelectorAll('.verification-input');
            let code = '';
            inputs.forEach(input => code += input.value);
            
            if (code.length < 4) { alert("أدخل الرمز كاملاً"); return; }

            try {
                await window.confirmationResult.confirm(code);
                console.log("تم التحقق بنجاح");
            } catch (error) {
                alert("الرمز خطأ");
            }
        });
    }

    // --- التحقق من رابط الإيميل عند العودة ---
    if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) email = window.prompt('أكد بريدك الإلكتروني:');
        
        signInWithEmailLink(auth, email, window.location.href)
            .then(() => {
                window.localStorage.removeItem('emailForSignIn');
                // onAuthStateChanged سيكمل الباقي
            })
            .catch((err) => alert("رابط غير صالح: " + err.message));
    }

}); // نهاية DOMContentLoaded

// 6. مراقب حالة الدخول (التوجيه النهائي)
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("المستخدم مسجل دخول:", user.uid);
        const userRef = ref(db, 'users/' + user.uid);
        
        try {
            const snapshot = await get(userRef);
            if (!snapshot.exists()) {
                if (!window.location.pathname.includes('id.html')) {
                    window.location.href = 'id.html'; // توجيه للملف الشخصي
                }
            } else {
                if (!window.location.pathname.includes('index.html')) {
                    window.location.href = 'index.html'; // توجيه للرئيسية
                }
            }
        } catch (e) {
            console.error(e);
        }
    }
});
