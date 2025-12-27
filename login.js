
// استيراد الخدمات من ملف الإعدادات
import { auth, db } from "./firebase-config.js";

// استيراد دوال المصادقة
import { 
    sendSignInLinkToEmail, 
    isSignInWithEmailLink, 
    signInWithEmailLink,
    onAuthStateChanged,
    GoogleAuthProvider,
    GithubAuthProvider,
    MicrosoftAuthProvider,
    signInWithRedirect,   // ✅ تم التعديل: استخدام Redirect
    getRedirectResult,    // ✅ تم التعديل: جلب النتيجة بعد العودة
    setPersistence,
    browserLocalPersistence,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";

// استيراد دوال قاعدة البيانات
import { ref, get } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-database.js";

// ضبط استمرارية تسجيل الدخول
setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Error setting persistence:", error);
});

// --- دوال التنقل ---
window.openPage = function(pageId) {
    document.querySelectorAll('.page, .full-page').forEach(page => {
        page.classList.remove('active');
        if (page.style.display === 'block') {
            page.style.display = 'none';
        }
    });
    
    const pageToShow = document.getElementById(pageId);
    if (pageToShow) {
        pageToShow.classList.add('active');
        pageToShow.style.display = 'block';
    } else {
        console.error(`Page with id="${pageId}" not found.`);
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

// =========================================================
// معالجة نتيجة الـ Redirect (تعمل فور تحميل الصفحة)
// =========================================================
getRedirectResult(auth)
    .then((result) => {
        if (result) {
            console.log("Redirect Login Successful:", result.user);
            // لا نحتاج للتوجيه هنا يدوياً لأن onAuthStateChanged ستقوم بالواجب
            // وتقوم بفحص قاعدة البيانات
        }
    })
    .catch((error) => {
        console.error("Redirect Login Error:", error);
        alert("فشل تسجيل الدخول: " + error.message);
    });


// =========================================================
// تشغيل الكود بعد تحميل الصفحة
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded. Ready for Redirect login.");

    // --- إعداد reCAPTCHA (لتسجيل الدخول بالهاتف) ---
    const phoneSubmitBtn = document.getElementById('phoneSubmit');
    if (phoneSubmitBtn) {
        try {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'phoneSubmit', {
                'size': 'invisible',
                'callback': (response) => {
                    console.log("reCAPTCHA solved.");
                }
            });
            window.recaptchaVerifier.render().catch(err => {
                 console.error("Recaptcha render error:", err);
            });
        } catch (e) {
            console.error("Error initializing RecaptchaVerifier:", e);
        }
    }

    // --- إعدادات رابط البريد الإلكتروني ---
    const actionCodeSettings = {
        url: window.location.origin + '/login.html',
        handleCodeInApp: true,
    };

    // 1. معالجة تسجيل الدخول بالبريد
    const emailBtn = document.getElementById('emailSubmit');
    if (emailBtn) {
        emailBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            const emailInput = document.getElementById('emailInput');
            const email = emailInput ? emailInput.value : "";
            
            if (!email) {
                alert("الرجاء إدخال بريدك الإلكتروني.");
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert("الرجاء إدخال بريد إلكتروني صحيح.");
                return;
            }

            try {
                await sendSignInLinkToEmail(auth, email, actionCodeSettings);
                window.localStorage.setItem('emailForSignIn', email);
                window.openPage('emailVerificationPage');
                const displayEmail = document.getElementById('verificationEmailDisplay');
                if(displayEmail) displayEmail.textContent = email;
            } catch (error) {
                console.error("Error sending sign-in link:", error);
                alert("حدث خطأ: " + error.message);
            }
        });
    }

    // 2. معالجة تسجيل الدخول بجوجل (Redirect) ✅
    const googleBtn = document.getElementById('googleLogin');
    if (googleBtn) {
        googleBtn.addEventListener('click', function(e) {
            e.preventDefault(); // منع أي سلوك افتراضي
            const provider = new GoogleAuthProvider();
            // استخدام Redirect بدلاً من Popup
            signInWithRedirect(auth, provider);
        });
    }

    // 3. معالجة تسجيل الدخول بجيت هب (Redirect) ✅
    const githubBtn = document.getElementById('githubLogin');
    if (githubBtn) {
        githubBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const provider = new GithubAuthProvider();
            signInWithRedirect(auth, provider);
        });
    }

    // 4. معالجة تسجيل الدخول بمايكروسوفت (Redirect) ✅
    const microsoftBtn = document.getElementById('microsoftLogin');
    if (microsoftBtn) {
        microsoftBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const provider = new MicrosoftAuthProvider();
            signInWithRedirect(auth, provider);
        });
    }

    // 5. إرسال رمز التحقق للهاتف
    if (phoneSubmitBtn) {
        phoneSubmitBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            const phoneInputEl = document.getElementById('phoneInput');
            const phoneVal = phoneInputEl ? phoneInputEl.value : "";
            
            if (!phoneVal) {
                alert("الرجاء إدخال رقم الهاتف.");
                return;
            }
            
            const phoneNumber = '+20' + phoneVal; 
            const appVerifier = window.recaptchaVerifier;

            try {
                console.log(`Sending code to ${phoneNumber}...`);
                const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
                window.confirmationResult = confirmationResult;
                window.openPage('phoneVerificationPage');
            } catch (error) {
                console.error("Error sending phone verification code:", error);
                alert("حدث خطأ: " + error.message);
                if(window.recaptchaVerifier) {
                    window.recaptchaVerifier.render().then(function(widgetId) {
                        grecaptcha.reset(widgetId);
                    });
                }
            }
        });
    }

    // 6. التحقق من الرمز المدخل للهاتف
    const verifyPhoneBtn = document.getElementById('verifyPhone');
    if (verifyPhoneBtn) {
        verifyPhoneBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            const inputs = document.querySelectorAll('#phoneVerificationPage .verification-input');
            let code = '';
            inputs.forEach(input => {
                code += input.value;
            });

            if (code.length < 4) { 
                alert("الرجاء إدخال الرمز كاملاً.");
                return;
            }

            if (!window.confirmationResult) {
                alert("جلسة منتهية. الرجاء طلب الرمز مرة أخرى.");
                window.openPage('phoneLoginPage');
                return;
            }

            try {
                await window.confirmationResult.confirm(code);
                console.log("Phone verification successful");
            } catch (error) {
                console.error("Error verifying code:", error);
                alert("الرمز غير صحيح أو انتهت صلاحيته.");
            }
        });
    }

    // 7. التحقق من رابط تسجيل الدخول بالبريد
    if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
            email = window.prompt('الرجاء تأكيد بريدك الإلكتروني لإكمال عملية تسجيل الدخول.');
        }
        
        if (email) {
            signInWithEmailLink(auth, email, window.location.href)
                .then(() => {
                    window.localStorage.removeItem('emailForSignIn');
                })
                .catch((error) => {
                    console.error("Error signing in with email link:", error);
                    alert("حدث خطأ في الرابط: " + error.message);
                });
        }
    }
}); 

// 8. مراقبة حالة المصادقة (هذا الجزء سيعمل تلقائياً بعد العودة من Google Redirect)
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("User is signed in:", user.uid);
        try {
            const userRef = ref(db, 'users/' + user.uid);
            const snapshot = await get(userRef);
            
            const currentPath = window.location.pathname;
            
            // التوجيه بناءً على وجود بيانات المستخدم
            if (!snapshot.exists()) {
                if (!currentPath.includes('id.html')) {
                    console.log("New user, redirecting to id.html...");
                    setTimeout(() => { window.location.href = 'https://studio.afnanai.com/id.html'; }, 1000);
                }
            } else {
                if (!currentPath.includes('index.html')) {
                    console.log("Existing user, redirecting to index.html...");
                    setTimeout(() => { window.location.href = 'https://studio.afnanai.com/index.html'; }, 1000);
                }
            }
        } catch (error) {
            console.error("Error checking user data:", error);
        }
    }
});
