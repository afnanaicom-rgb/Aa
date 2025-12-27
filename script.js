// script.js

import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { getDatabase, ref, push, onValue, set, remove } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-database.js";

// --- Global Variables and Constants ---
const TYPING_TEXT = "تحدث مع afnanai الآن";
const TYPING_INTERVAL = 100; // ms
const TYPING_DELAY = 20000; // 20 seconds

// Initialize Firebase Database
const db = getDatabase();
let currentChatId = null;
let currentUserId = null;

// --- Utility Functions ---

function simulateTyping(element, text, delay) {
    let index = 0;
    element.textContent = '';
    const interval = setInterval(() => {
        if (index < text.length) {
            element.textContent += text.charAt(index);
            index++;
        } else {
            clearInterval(interval);
            setTimeout(() => simulateTyping(element, text, delay), delay);
        }
    }, TYPING_INTERVAL);
    return interval;
}

// --- Main Logic ---

document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('chatInput');
    const inputWrapper = document.getElementById('inputWrapper');
    const sendButton = document.getElementById('sendButton');
    const chatArea = document.getElementById('chatArea');
    const welcomeContent = document.getElementById('welcomeContent');
    const sidebar = document.getElementById('sidebar');
    const menuButton = document.getElementById('menuButton');
    const newChatButton = document.getElementById('newChatButton');
    const suggestionGrid = document.getElementById('suggestionGrid');
    const suggestionCards = document.querySelectorAll('.suggestion-card');
    const headerLoginButton = document.getElementById('headerLoginButton');
    const userAccountDiv = document.getElementById('userAccount');
    const userNameSpan = document.getElementById('userName');
    const userEmailSpan = document.getElementById('userEmail');
    const userProfileImage = document.getElementById('userProfileImage');
    const logoutButton = document.getElementById('logoutButton');
    const toolsButton = document.getElementById('toolsButton');
    const imageInput = document.getElementById('imageInput');
    const fileInput = document.getElementById('fileInput');
    const toolsModal = document.getElementById('toolsModal');
    const typingTextElement = document.getElementById('typingText');
    const chatHistoryList = document.getElementById('chatHistoryList');

    let isGenerating = false;
    let assistantResponseTimeout = null;
    let messageToEdit = null;
    let typingInterval = null;
    let isChatActive = false;

    const ICONS = {
        send: "<i class='bx bx-up-arrow-alt'></i>",
        stop: "<i class='bx bx-stop'></i>",
        edit: "<i class='bx bx-check'></i>"
    };
    
    // Start typing effect on load
    typingInterval = simulateTyping(typingTextElement, TYPING_TEXT, TYPING_DELAY);

    function autoResize() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    }

    function toggleSidebar() { 
        sidebar.classList.toggle('visible'); 
    }
    
    function startNewChat() {
        chatArea.innerHTML = '';
        welcomeContent.classList.remove('hidden');
        chatArea.classList.remove('visible');
        suggestionGrid.classList.remove('hidden');
        resetInputArea();
        isChatActive = false;
        currentChatId = null; // Reset current chat ID
        // Restart typing effect
        if (typingInterval) clearInterval(typingInterval);
        typingInterval = simulateTyping(typingTextElement, TYPING_TEXT, TYPING_DELAY);
        
        // Remove active class from all history items
        document.querySelectorAll('.chat-history-item').forEach(item => item.classList.remove('active'));
    }

    function addMessage(content, type, saveToDb = true) {
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${type}-wrapper`;
        
        let messageDiv;
        let actionBar = document.createElement('div');
        actionBar.className = 'action-bar';

        if (type === 'assistant') {
            const avatar = document.createElement('img');
            avatar.src = 'logo.png';
            avatar.alt = 'Afnan Avatar';
            avatar.className = 'assistant-avatar';
            wrapper.appendChild(avatar);

            const contentWrapper = document.createElement('div');
            contentWrapper.className = 'message-content-wrapper';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'assistant-name';
            nameSpan.textContent = 'Afnan';
            contentWrapper.appendChild(nameSpan);

            messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}`;
            messageDiv.textContent = content;
            contentWrapper.appendChild(messageDiv);
            
            actionBar.innerHTML = `
                <button class="action-btn-copy" title="نسخ"><i class='bx bx-copy'></i></button>
                <button title="مشاركة"><i class='bx bx-share-alt'></i></button>
                <button title="إعجاب"><i class='bx bx-like'></i></button>
            `;
            contentWrapper.appendChild(actionBar);
            wrapper.appendChild(contentWrapper);

        } else { // User
            const contentWrapper = document.createElement('div');
            contentWrapper.className = 'user-message-content-wrapper';
            
            // User info (profile image and name)
            const userInfo = document.createElement('div');
            userInfo.className = 'user-message-info';
            
            const userImg = document.createElement('img');
            userImg.className = 'user-message-avatar';
            // Get user info from auth
            if (auth.currentUser) {
                if (auth.currentUser.photoURL) {
                    userImg.src = auth.currentUser.photoURL;
                } else {
                    userImg.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath fill="%23999" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/%3E%3C/svg%3E';
                }
                const userName = document.createElement('span');
                userName.className = 'user-message-name';
                userName.textContent = auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'أنت';
                userInfo.appendChild(userImg);
                userInfo.appendChild(userName);
            }
            
            contentWrapper.appendChild(userInfo);
            
            messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}`;
            messageDiv.textContent = content;
            contentWrapper.appendChild(messageDiv);

            actionBar.innerHTML = `
                <button class="action-btn-copy" title="نسخ"><i class='bx bx-copy'></i></button>
                <button class="action-btn-edit" title="تعديل"><i class='bx bx-pencil'></i></button>
            `;
            actionBar.style.display = 'none'; // Hide by default
            contentWrapper.appendChild(actionBar);
            
            // Show action bar on click
            contentWrapper.addEventListener('click', () => {
                actionBar.style.display = actionBar.style.display === 'none' ? 'flex' : 'none';
            });
            
            wrapper.appendChild(contentWrapper);
        }

        chatArea.appendChild(wrapper);
        chatArea.scrollTop = chatArea.scrollHeight;

        // Save to Firebase
        if (saveToDb && currentUserId) {
            if (!currentChatId) {
                // Start a new chat
                const newChatRef = push(ref(db, `users/${currentUserId}/chats`));
                currentChatId = newChatRef.key;
                // Set initial chat title (first user message)
                set(newChatRef, { title: content.substring(0, 30) + '...', timestamp: Date.now() });
            }
            
            // Add message to the chat
            push(ref(db, `users/${currentUserId}/chats/${currentChatId}/messages`), {
                content: content,
                type: type,
                timestamp: Date.now()
            });
        }
    }

    function startChatMode() {
        welcomeContent.classList.add('hidden');
        chatArea.classList.add('visible');
        suggestionGrid.classList.add('hidden');
        isChatActive = true;
        // Stop typing effect
        if (typingInterval) clearInterval(typingInterval);
    }
    
    function updateSendButton(state) {
        sendButton.innerHTML = ICONS[state];
        if (state === 'stop') {
            sendButton.classList.add('stop-generation');
        } else {
            sendButton.classList.remove('stop-generation');
        }
    }

    function resetInputArea() {
        textarea.value = '';
        autoResize.call(textarea);
        messageToEdit = null;
        if (isGenerating) stopGeneration();
        updateSendButton('send');
    }

    function saveEdit() {
        if (!messageToEdit) return;
        const newContent = textarea.value.trim();
        if (newContent) {
            messageToEdit.textContent = newContent;
            // TODO: Update message in Firebase
        }
        resetInputArea();
    }

    function stopGeneration() {
        if (assistantResponseTimeout) {
            clearTimeout(assistantResponseTimeout);
            assistantResponseTimeout = null;
        }
        isGenerating = false;
        updateSendButton('send');
    }

    function handleSend() {
        if (isGenerating) {
            stopGeneration();
            return;
        }

        if (messageToEdit) {
            saveEdit();
            return;
        }

        const message = textarea.value.trim();
        if (!message) return;

        if (!isChatActive) startChatMode();
        
        addMessage(message, 'user');
        resetInputArea();

        isGenerating = true;
        updateSendButton('stop');

        // Simulate assistant response
        assistantResponseTimeout = setTimeout(() => {
            addMessage('هذا رد تجريبي من Afnan للتحقق من التصميم. يمكنك تجربة أزرار النسخ والتعديل والإعجاب.', 'assistant');
            isGenerating = false;
            updateSendButton('send');
        }, 2000);
    }

    // --- Chat History Functions ---
    function loadChatHistory(userId) {
        const chatsRef = ref(db, `users/${userId}/chats`);
        onValue(chatsRef, (snapshot) => {
            chatHistoryList.innerHTML = ''; // Clear current list
            snapshot.forEach((childSnapshot) => {
                const chatId = childSnapshot.key;
                const chatData = childSnapshot.val();
                
                const item = document.createElement('div');
                item.className = 'chat-history-item';
                item.setAttribute('data-chat-id', chatId);
                // Show only first 3 characters + ...
                const shortTitle = chatData.title ? chatData.title.substring(0, 3) + '...' : 'New Chat';
                item.innerHTML = `<i class='bx bx-message-square-detail'></i><span>${shortTitle}</span>`;
                
                item.addEventListener('click', () => {
                    loadChat(chatId);
                });
                
                chatHistoryList.appendChild(item);
            });
        });
    }

    function loadChat(chatId) {
        // Set active chat
        currentChatId = chatId;
        
        // Update active class in sidebar
        document.querySelectorAll('.chat-history-item').forEach(item => item.classList.remove('active'));
        document.querySelector(`.chat-history-item[data-chat-id="${chatId}"]`).classList.add('active');
        
        // Load messages
        const messagesRef = ref(db, `users/${currentUserId}/chats/${chatId}/messages`);
        onValue(messagesRef, (snapshot) => {
            chatArea.innerHTML = ''; // Clear current chat area
            startChatMode(); // Ensure chat area is visible
            
            snapshot.forEach((childSnapshot) => {
                const message = childSnapshot.val();
                addMessage(message.content, message.type, false); // Don't save again
            });
        }, { onlyOnce: true }); // Load once, then rely on real-time updates if needed
    }

    // --- Firebase Auth Listener and UI Update ---
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            currentUserId = user.uid;
            headerLoginButton.style.display = 'none';
            logoutButton.style.display = 'flex';
            
            // Update user info in sidebar
            userNameSpan.textContent = user.displayName || user.email.split('@')[0];
            userEmailSpan.textContent = user.email;
            userEmailSpan.style.display = 'block';
            
            if (user.photoURL) {
                userProfileImage.src = user.photoURL;
                userProfileImage.style.display = 'block';
            } else {
                // Hide image and show default icon (if you had one)
                userProfileImage.style.display = 'none';
            }
            
            // Load chat history
            loadChatHistory(user.uid);

        } else {
            // User is signed out
            currentUserId = null;
            headerLoginButton.style.display = 'flex';
            logoutButton.style.display = 'none';
            userNameSpan.textContent = 'حسابك';
            userEmailSpan.style.display = 'none';
            userProfileImage.style.display = 'none';
            chatHistoryList.innerHTML = ''; // Clear history
        }
    });

    // --- Logout Handler ---
    logoutButton.addEventListener('click', async () => {
        try {
            await signOut(auth);
            // Redirection is handled by auth-guard.js on index.html
            // For login.html, the listener will update the UI
        } catch (error) {
            console.error("Error signing out:", error);
            alert("حدث خطأ أثناء تسجيل الخروج.");
        }
    });

    // --- Tools Modal Handler ---
    toolsButton.addEventListener('click', () => {
        toolsModal.classList.toggle('active');
    });
    
    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
        const toolsButton = document.getElementById('toolsButton');
        const toolsModal = document.getElementById('toolsModal');
        
        // Check if the click is outside the button and the modal, and if the modal is active
        if (toolsModal.classList.contains('active') && !toolsButton.contains(e.target) && !toolsModal.contains(e.target)) {
            toolsModal.classList.remove('active');
        }
    });
    
    // Handle tool selection
    document.querySelectorAll('.tool-item').forEach(item => {
        item.addEventListener('click', () => {
            const tool = item.dataset.tool;
            toolsModal.classList.remove('active');
            
            switch(tool) {
                case 'image':
                    imageInput.click();
                    break;
                case 'file':
                    fileInput.click();
                    break;
                case 'srish':
                    console.log('Srish Search activated');
                    // Add Srish Search functionality here
                    break;
                case 'dabri':
                    console.log('Dabri Search activated');
                    // Add Dabri Search functionality here
                    break;
                case 'deepthinking':
                    console.log('Deep Thinking activated');
                    // Add Deep Thinking functionality here
                    break;
                case 'createimage':
                    console.log('Create Image activated');
                    // Add Create Image functionality here
                    break;
            }
        });
    });

    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // In a real app, you would upload the file to Firebase Storage here
            // For now, we just show a message
            const message = `تم اختيار صورة: ${file.name}. (يجب تفعيل ميزة رفع الصور في التطبيق الفعلي)`;
            if (!isChatActive) startChatMode();
            addMessage(message, 'user');
            resetInputArea();
        }
    });

    // --- Event Listeners ---
    menuButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent click from closing sidebar immediately
        toggleSidebar();
    });
    newChatButton.addEventListener('click', startNewChat);

    textarea.addEventListener('input', autoResize);
    textarea.addEventListener('focus', () => inputWrapper.classList.add('focused'));
    textarea.addEventListener('blur', () => inputWrapper.classList.remove('focused'));

    sendButton.addEventListener('click', handleSend);
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    suggestionCards.forEach(card => {
        card.addEventListener('click', () => {
            textarea.value = card.querySelector('span').textContent;
            textarea.focus();
            autoResize.call(textarea);
        });
    });

    chatArea.addEventListener('click', (e) => {
        const copyBtn = e.target.closest('.action-btn-copy');
        const editBtn = e.target.closest('.action-btn-edit');

        if (copyBtn) {
            const textToCopy = copyBtn.closest('.message-wrapper').querySelector('.message').textContent;
            navigator.clipboard.writeText(textToCopy).then(() => {
                console.log('Copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
        }

        if (editBtn) {
            const messageToEditElement = editBtn.closest('.message-wrapper').querySelector('.message');
            startEdit(messageToEditElement);
        }
    });

    // New: Close sidebar when clicking outside
    document.addEventListener('click', (e) => {
        const isClickInsideSidebar = sidebar.contains(e.target);
        const isClickOnMenuButton = menuButton.contains(e.target);

        if (sidebar.classList.contains('visible') && !isClickInsideSidebar && !isClickOnMenuButton) {
            toggleSidebar();
        }
    });
});
