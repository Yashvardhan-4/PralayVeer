// === Pralayveer Student App - Complete Implementation ===
// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDRfw02vOd82RwIXtYVbk-6v9IpQOMuOB4",
    authDomain: "pralayveer-punjab.firebaseapp.com",
    projectId: "pralayveer-punjab",
    storageBucket: "pralayveer-punjab.firebasestorage.app",
    messagingSenderId: "70951000471",
    appId: "1:70951000471:web:2fda72af05438fbf984cd2",
    measurementId: "G-CC7L4LGDEC"
};

// Firebase Imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, signInAnonymously, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, getDocs, onSnapshot, collection, query, orderBy, where, updateDoc, addDoc, limit, increment } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
// External AI endpoint (set window.PRALAYVEER_AI_ENDPOINT before this script). Must be a secured backend.
const EXTERNAL_AI_ENDPOINT = window.PRALAYVEER_AI_ENDPOINT || null;

console.log("🚀 Pralayveer Student App - Firebase Foundation Loaded");

// Enable Firestore offline persistence and configure settings
try {
    // Configure Firestore settings before any operations
    const firestoreSettings = {
        ignoreUndefinedProperties: true,
        merge: true
    };
    
    // Set up authentication state persistence
    // Correct modular persistence API
    if (setPersistence && browserLocalPersistence) {
        setPersistence(auth, browserLocalPersistence)
            .then(() => console.log('✅ Auth persistence set to browserLocalPersistence'))
            .catch(err => console.warn('⚠️ Failed to set auth persistence', err));
    }
    
    console.log("✅ Student App Firebase configuration optimized");
} catch (error) {
    console.warn("⚠️ Student App Firebase configuration warning:", error);
}

// === Main Student App Controller ===
class StudentApp {
    constructor() {
        console.log("🎓 Initializing Student App...");
        
        // Initialize app state
        this.currentUser = null;
        this.studentData = null;
        this.currentQuiz = null;
        this.currentDrill = null;
        
        // Auto-authenticate anonymously for testing
        this.ensureAuthentication();
        
        // Question bank for daily quiz
        this.questionBank = [
            {
                topic: "Fire Safety",
                question: "What should you do first when you discover a fire?",
                options: ["Use a fire extinguisher", "Alert others and call for help", "Try to put it out with water"],
                answer: 1,
                points: 25,
                explanation: "The first priority is always to alert others and call for professional help."
            },
            {
                topic: "Fire Safety", 
                question: "What does the 'P' in P.A.S.S. fire extinguisher technique stand for?",
                options: ["Pull the pin", "Point at the fire", "Press the trigger"],
                answer: 0,
                points: 20,
                explanation: "P.A.S.S. stands for Pull, Aim, Squeeze, Sweep."
            },
            {
                topic: "Earthquake Safety",
                question: "During an earthquake, what is the safest action?",
                options: ["Run outside immediately", "Stand in a doorway", "Drop, Cover, and Hold On"],
                answer: 2,
                points: 30,
                explanation: "Drop, Cover, and Hold On is the internationally recommended earthquake safety technique."
            },
            {
                topic: "Earthquake Safety",
                question: "If you're outdoors during an earthquake, you should:",
                options: ["Stay in open areas away from buildings", "Find shelter under a tree", "Lie flat on the ground"],
                answer: 0,
                points: 25,
                explanation: "Open areas away from buildings, power lines, and trees are safest during outdoor earthquakes."
            },
            {
                topic: "First Aid",
                question: "What's the first step for treating a minor burn?",
                options: ["Apply ice directly", "Run under cool water for 10-20 minutes", "Apply butter or oil"],
                answer: 1,
                points: 20,
                explanation: "Cool running water helps reduce tissue damage and pain from burns."
            },
            {
                topic: "Emergency Preparedness",
                question: "How much water should be stored per person for emergency preparedness?",
                options: ["1 gallon per day for 3 days", "2 gallons per day for 1 day", "1 liter per day for 7 days"],
                answer: 0,
                points: 15,
                explanation: "Emergency preparedness guidelines recommend 1 gallon per person per day for at least 3 days."
            }
        ];
        
        // Initialize UI elements and setup
        this.initializeElements();
        this.setupEventListeners();
        this.initializeAuthState();

    // Admin capability flags
    this.isAdmin = false;
    this.userRoleLoaded = false;

        // Attempt to integrate AI Quiz Generator if loaded
        if (window.AIQuizGenerator) {
            try {
                this.aiQuiz = new window.AIQuizGenerator();
                console.log("🤖 AI Quiz Generator integrated into Student App");
                // Pre-generate a seed bank for adaptive mode
                this.infiniteQuestionSeed = [...(this.aiQuiz.questionBank||[])];
            } catch (e) {
                console.warn("⚠️ Failed to initialize AI Quiz Generator:", e);
            }
        } else {
            console.log("ℹ️ AIQuizGenerator script not loaded yet (ai_quiz_generator.js)");
        }
        // Adaptive / Endless session state
        this.adaptiveSession = null; // { questions:[], index:0, correct:0, startedAt, mode:'adaptive'|'endless' }
        
        console.log("✅ Student App initialization complete");
    }

    // === Lightweight Sound System ===
    playTone(type='success') {
        try {
            const ctx = this._audioCtx || (this._audioCtx = new (window.AudioContext||window.webkitAudioContext)());
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sine';
            const now = ctx.currentTime;
            const base = type === 'error' ? 160 : type === 'tap' ? 280 : 440;
            if (type === 'success') {
                o.frequency.setValueAtTime(base, now);
                o.frequency.linearRampToValueAtTime(base*1.5, now+0.18);
            } else if (type === 'error') {
                o.frequency.setValueAtTime(base, now);
                o.frequency.linearRampToValueAtTime(base*0.6, now+0.25);
            } else if (type === 'streak') {
                o.frequency.setValueAtTime(520, now);
                o.frequency.exponentialRampToValueAtTime(880, now+0.25);
            } else {
                o.frequency.setValueAtTime(base, now);
            }
            g.gain.setValueAtTime(0.001, now);
            g.gain.exponentialRampToValueAtTime(0.25, now+0.04);
            g.gain.exponentialRampToValueAtTime(0.0001, now+0.4);
            o.connect(g).connect(ctx.destination);
            o.start();
            o.stop(now+0.42);
        } catch(e) {}
    }

    // === Toast System ===
    showToast(message, opts = {}) {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const div = document.createElement('div');
        const iconMap = { success:'✅', error:'⚠️', info:'ℹ️', streak:'🔥', xp:'✨' };
        const icon = iconMap[opts.type] || 'ℹ️';
        div.className = 'app-toast';
        div.innerHTML = `<span>${icon}</span><span>${message}</span>`;
        container.appendChild(div);
        setTimeout(()=>div.remove(), opts.duration || 5000);
        if (opts.sound) this.playTone(opts.sound);
    }

    // === XP Count Up & Circle Animation ===
    animateXP(previous, target) {
        if (!this.studentPoints) return;
        const start = performance.now();
        const duration = 800;
        const el = this.studentPoints;
        el.classList.remove('xp-pulse');
        void el.offsetWidth;
        el.classList.add('xp-pulse');
        const step = (now)=>{
            const t = Math.min(1,(now-start)/duration);
            const eased = t<0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
            const val = Math.floor(previous + (target-previous)*eased);
            el.textContent = val.toLocaleString();
            if (t<1) requestAnimationFrame(step); else el.textContent = target.toLocaleString();
        };
        requestAnimationFrame(step);
    }

    updateCircularProgress(pct) {
        if (!this.progressCircle) return;
        const circle = this.progressCircle;
        circle.classList.add('progress-anim');
        const circumference = 2 * Math.PI * 45;
        const offset = circumference * (1 - pct/100);
        circle.style.strokeDashoffset = offset;
        if (this.progressPercentage) this.progressPercentage.textContent = Math.round(pct)+"%";
    }
    
    // Ensure user is authenticated before Firestore operations
    async ensureAuthentication() {
        try {
            if (!auth.currentUser) {
                console.log("🔑 Student App: Auto-authenticating anonymously for testing...");
                await signInAnonymously(auth);
                console.log("✅ Student App: Anonymous authentication successful");
                // Proactively create minimal student profile for anonymous users
                if (!this.studentData) {
                    await this.ensureStudentProfile();
                }
            }
        } catch (error) {
            console.error("❌ Student App: Auto-authentication failed:", error);
            
            if (error.code === 'auth/admin-restricted-operation') {
                console.warn("⚠️ Anonymous authentication is disabled in Firebase Console");
                console.warn("💡 Please enable Anonymous authentication in Firebase Console > Authentication > Sign-in method");
                console.log("🔄 Attempting fallback authentication...");
                
                try {
                    // Fallback to email authentication for testing
                    const testEmail = 'student@pralayveer-punjab.com';
                    const testPassword = 'StudentTest123!';
                    
                    const { createUserWithEmailAndPassword, signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
                    
                    try {
                        await signInWithEmailAndPassword(auth, testEmail, testPassword);
                        console.log("✅ Student App: Fallback email authentication successful");
                    } catch (signInError) {
                        if (signInError.code === 'auth/user-not-found') {
                            await createUserWithEmailAndPassword(auth, testEmail, testPassword);
                            console.log("✅ Student App: Fallback user created and authenticated");
                        }
                    }
                } catch (fallbackError) {
                    console.error("❌ Student App: Fallback authentication also failed:", fallbackError);
                }
            }
        }
    }

    // === UI Element Initialization ===
    initializeElements() {
        console.log("🔧 Initializing UI elements...");
        
        try {
            // Auth Screen Elements
            this.authScreen = document.getElementById('studentAuthScreen');
            this.appContainer = document.getElementById('studentAppContainer');
            this.loginTab = document.getElementById('loginTab');
            this.registerTab = document.getElementById('registerTab');
            this.loginForm = document.getElementById('studentLoginForm');
            this.registerForm = document.getElementById('studentRegisterForm');
            this.authMessage = document.getElementById('studentAuthMessage');
            
            // Auth Input Elements
            this.loginEmail = document.getElementById('loginEmail');
            this.loginPassword = document.getElementById('loginPassword');
            this.registerName = document.getElementById('registerName');
            this.registerEmail = document.getElementById('registerEmail');
            this.registerPhone = document.getElementById('registerPhone');
            this.registerLocation = document.getElementById('registerLocation');
            this.registerOrganization = document.getElementById('registerOrganization');
            this.registerPassword = document.getElementById('registerPassword');
            this.loginBtn = document.getElementById('loginBtn');
            this.registerBtn = document.getElementById('registerBtn');
            
            // Main App Elements
            this.studentWelcome = document.getElementById('studentWelcome');
            this.studentLevel = document.getElementById('studentLevel');
            this.studentLevelText = document.getElementById('studentLevelText');
            this.studentPoints = document.getElementById('studentPoints');
            this.studentStreak = document.getElementById('studentStreak');
            this.progressCircle = document.getElementById('progressCircle');
            this.progressPercentage = document.getElementById('progressPercentage');
            this.logoutBtn = document.getElementById('studentLogout');
            this.profileAvatarBtn = document.getElementById('profileAvatarBtn');
            this.profileAvatarImg = document.getElementById('profileAvatarImg');
            this.profileAvatarLetter = document.getElementById('profileAvatarLetter');
            this.profileSlideOver = document.getElementById('profileSlideOver');
            this.slideEditProfileBtn = document.getElementById('slideEditProfileBtn');
            this.slideLogoutBtn = document.getElementById('slideLogoutBtn');
            this.closeSlideOverBtn = document.getElementById('closeSlideOverBtn');
            this.slideAvatarImg = document.getElementById('slideAvatarImg');
            this.slideAvatarLetter = document.getElementById('slideAvatarLetter');
            this.slideProfileName = document.getElementById('slideProfileName');
            this.slideProfileEmail = document.getElementById('slideProfileEmail');
            this.slideLevelBadge = document.getElementById('slideLevelBadge');
            this.slideStreakBadge = document.getElementById('slideStreakBadge');
            this.slidePoints = document.getElementById('slidePoints');
            this.slideCurrentStreak = document.getElementById('slideCurrentStreak');
            this.slideLongestStreak = document.getElementById('slideLongestStreak');
            this.slideQuizzes = document.getElementById('slideQuizzes');
            this.slideChangePhotoBtn = document.getElementById('slideChangePhotoBtn');
            this.avatarFileInput = document.getElementById('avatarFileInput');
            
            // Navigation
            this.screens = document.querySelectorAll('.screen');
            this.navButtons = document.querySelectorAll('.nav-btn');
            
            // Badge Elements
            this.badgeContainer = document.getElementById('badgeContainer');
            this.badges = document.querySelectorAll('.badge');
            
            // Drill Alert Elements
            this.drillAlert = document.getElementById('drillAlert');
            this.noDrillAlert = document.getElementById('noDrillAlert');
            this.nextDrillInfo = document.getElementById('nextDrillInfo');
            this.drillModeOverlay = document.getElementById('drillModeOverlay');
            this.drillName = document.getElementById('drillName');
            this.acknowledgeDrillBtn = document.getElementById('acknowledgeDrillBtn');
            this.cancelDrillBtn = document.getElementById('cancelDrillBtn');
            this.stopActiveDrillBtn = document.getElementById('stopActiveDrillBtn');
            this.adminUpcomingActions = document.getElementById('adminUpcomingDrillActions');
            this.adminActiveActions = document.getElementById('adminActiveDrillActions');
            
            // Quiz Elements
            this.dailyQuizBtn = document.getElementById('dailyQuizBtn');
            this.quizStatus = document.getElementById('quizStatus');
            this.quizModal = document.getElementById('quizModal');
            this.quizQuestion = document.getElementById('quizQuestion');
            this.quizOptions = document.getElementById('quizOptions');
            this.quizResult = document.getElementById('quizResult');
            this.closeQuizBtn = document.getElementById('closeQuizBtn');
            
            // Leaderboard
            this.fullLeaderboardList = document.getElementById('fullLeaderboardList');
            
            // Profile Elements
            this.profileInitials = document.getElementById('profileInitials');
            this.profileName = document.getElementById('profileName');
            this.profileEmail = document.getElementById('profileEmail');
            this.profileJoinDate = document.getElementById('profileJoinDate');
            this.profileTotalPoints = document.getElementById('profileTotalPoints');
            this.profileCurrentLevel = document.getElementById('profileCurrentLevel');
            this.profileQuizzesCompleted = document.getElementById('profileQuizzesCompleted');
            this.profileDrillsParticipated = document.getElementById('profileDrillsParticipated');
            this.profileCurrentStreak = document.getElementById('profileCurrentStreak');
            this.profileLongestStreak = document.getElementById('profileLongestStreak');
            this.recentActivity = document.getElementById('recentActivity');
            this.editProfileBtn = document.getElementById('editProfileBtn');
            
            // Profile Edit Modal
            this.profileEditModal = document.getElementById('profileEditModal');
            this.profileEditForm = document.getElementById('profileEditForm');
            this.editProfileName = document.getElementById('editProfileName');
            this.editProfilePhone = document.getElementById('editProfilePhone');
            this.editProfileLocation = document.getElementById('editProfileLocation');
            this.editProfileOrganization = document.getElementById('editProfileOrganization');
            this.closeProfileEditBtn = document.getElementById('closeProfileEditBtn');
            this.cancelProfileEditBtn = document.getElementById('cancelProfileEditBtn');
            this.saveProfileBtn = document.getElementById('saveProfileBtn');
            
            // Progress bars for achievements
            this.fireProgressBar = document.getElementById('fireProgressBar');
            this.earthquakeProgressBar = document.getElementById('earthquakeProgressBar');
            this.masterProgressBar = document.getElementById('masterProgressBar');
            this.fireProgress = document.getElementById('fireProgress');
            this.earthquakeProgress = document.getElementById('earthquakeProgress');
            this.masterProgress = document.getElementById('masterProgress');
            
            // Validate critical elements
            const criticalElements = [
                this.authScreen, this.appContainer, this.loginForm, this.registerForm
            ];
            
            for (let element of criticalElements) {
                if (!element) {
                    throw new Error(`Critical UI element not found: ${element}`);
                }
            }
            
            console.log("✅ UI elements initialized successfully");
            
        } catch (error) {
            console.error("❌ Error initializing UI elements:", error);
            this.showMessage("App initialization failed. Please refresh the page.", 'error');
        }
    }

    // === Event Listeners Setup ===
    setupEventListeners() {
        console.log("🎯 Setting up event listeners...");
        
        try {
            // Auth Tab Switching
            this.loginTab.addEventListener('click', () => this.switchAuthTab('login'));
            this.registerTab.addEventListener('click', () => this.switchAuthTab('register'));
            
            // Form Submissions
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
            this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
            
            // App Navigation
            this.logoutBtn.addEventListener('click', () => this.handleLogout());
            this.navButtons.forEach(btn => {
                btn.addEventListener('click', () => this.switchScreen(btn.dataset.screen));
            });
            
            // Quiz System
            this.dailyQuizBtn.addEventListener('click', () => this.startDailyQuiz());
            this.closeQuizBtn.addEventListener('click', () => this.closeQuizModal());
            // Advanced AI adaptive quiz button (optional)
            this.advancedQuizBtn = document.getElementById('advancedQuizBtn');
            if (this.advancedQuizBtn) {
                this.advancedQuizBtn.addEventListener('click', () => this.startAdaptiveQuiz());
            }
            this.endlessQuizBtn = document.getElementById('endlessQuizBtn');
            if (this.endlessQuizBtn) {
                this.endlessQuizBtn.addEventListener('click', () => this.startEndlessQuiz());
            }
            // Adaptive navigation controls (added in HTML)
            this.adaptivePrevBtn = document.getElementById('adaptivePrevBtn');
            this.adaptiveNextBtn = document.getElementById('adaptiveNextBtn');
            this.adaptiveSubmitBtn = document.getElementById('adaptiveSubmitBtn');
            this.endlessAddMoreBtn = document.getElementById('endlessAddMoreBtn');
            if (this.adaptivePrevBtn) this.adaptivePrevBtn.addEventListener('click', () => this.navigateAdaptive(-1));
            if (this.adaptiveNextBtn) this.adaptiveNextBtn.addEventListener('click', () => this.navigateAdaptive(1));
            if (this.adaptiveSubmitBtn) this.adaptiveSubmitBtn.addEventListener('click', () => this.finishAdaptiveSession());
            if (this.endlessAddMoreBtn) this.endlessAddMoreBtn.addEventListener('click', () => this.extendEndlessSession());
            
            // Drill System
            this.acknowledgeDrillBtn.addEventListener('click', () => {
                console.log("🔘 Acknowledge button clicked!");
                this.acknowledgeDrill();
            });
            
            // Fallback click detection for acknowledge button
            this.acknowledgeDrillBtn.addEventListener('mousedown', () => {
                console.log("🔘 Acknowledge button mousedown detected!");
                this.acknowledgeDrill();
            });
            
            // Touch support for mobile devices
            this.acknowledgeDrillBtn.addEventListener('touchstart', () => {
                console.log("🔘 Acknowledge button touch detected!");
                this.acknowledgeDrill();
            });

            if (this.cancelDrillBtn) this.cancelDrillBtn.addEventListener('click', () => this.cancelScheduledDrill());
            if (this.stopActiveDrillBtn) this.stopActiveDrillBtn.addEventListener('click', () => this.stopActiveDrill());
            
            // Profile System (make all optional to avoid breaking if markup changed)
            if (this.editProfileBtn) this.editProfileBtn.addEventListener('click', () => this.showProfileEditModal());
            if (this.closeProfileEditBtn) this.closeProfileEditBtn.addEventListener('click', () => this.hideProfileEditModal());
            if (this.cancelProfileEditBtn) this.cancelProfileEditBtn.addEventListener('click', () => this.hideProfileEditModal());
            if (this.profileEditForm) this.profileEditForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
            if (this.profileAvatarBtn) {
                this.profileAvatarBtn.addEventListener('click', () => this.toggleSlideOver(true));
            } else {
                console.warn('Avatar button not found at setup time');
            }
            if (this.closeSlideOverBtn) {
                this.closeSlideOverBtn.addEventListener('click', () => this.toggleSlideOver(false));
            } else {
                console.warn('Close slide-over button missing');
            }
            if (this.slideEditProfileBtn) this.slideEditProfileBtn.addEventListener('click', () => { this.showProfileEditModal(); this.toggleSlideOver(false); });
            if (this.slideLogoutBtn) this.slideLogoutBtn.addEventListener('click', () => { this.handleLogout(); this.toggleSlideOver(false); });
            const backdrop = document.getElementById('profileSlideBackdrop');
            if (backdrop) backdrop.addEventListener('click', () => this.toggleSlideOver(false));
            if (this.slideChangePhotoBtn) this.slideChangePhotoBtn.addEventListener('click', () => this.triggerAvatarSelect());
            if (this.avatarFileInput) this.avatarFileInput.addEventListener('change', (e)=>this.handleAvatarFile(e));
            
            console.log("✅ Event listeners setup complete");
            
        } catch (error) {
            console.error("❌ Error setting up event listeners:", error);
        }
    }

    // === Authentication State Management ===
    initializeAuthState() {
        console.log("🔐 Initializing authentication state...");
        
        onAuthStateChanged(auth, (user) => {
            console.log("🔄 Auth state changed:", user ? 'User logged in' : 'User logged out');
            
            if (user) {
                this.currentUser = user;
                console.log("👤 Current user:", user.email || 'Anonymous');
                this.showApp();
                
                // Add delay before starting listeners to ensure proper authentication
                setTimeout(() => {
                    if (user.email) {
                        // Only listen to profile if not anonymous
                        this.listenToStudentProfile(user.uid);
                    }
                    this.loadUserRole();
                    this.listenForDrills();
                    this.listenForLeaderboard();
                    this.listenForRecentQuizAttempts();
                    this.listenForEvacuationRecords();
                }, 1000);
            } else {
                this.currentUser = null;
                this.studentData = null;
                this.showAuthScreen();
            }
        });
    }

    // === Recent Quiz Attempts Listener ===
    listenForRecentQuizAttempts() {
        if (!this.currentUser) return;
        try {
            const attemptsQ = query(
                collection(db, 'quizAttempts'),
                where('userId', '==', this.currentUser.uid),
                orderBy('createdAt', 'desc'),
                limit(10)
            );
            onSnapshot(attemptsQ, (snap) => {
                const attempts = [];
                snap.forEach(d => attempts.push({ id: d.id, ...d.data() }));
                this.renderRecentQuizAttempts(attempts);
            }, (err) => {
                console.error('❌ Recent quiz attempts listener error', err);
                if (err.message && err.message.includes('index')) {
                    // Index exists but still building OR missing. Use fallback fetch.
                    (async () => {
                        try {
                            const baseQ = query(collection(db, 'quizAttempts'), where('userId', '==', this.currentUser.uid), limit(25));
                            const snap = await getDocs(baseQ);
                            const data = [];
                            snap.forEach(d => data.push({ id: d.id, ...d.data() }));
                            data.sort((a,b)=> (b.createdAt?.toMillis?.()||0) - (a.createdAt?.toMillis?.()||0));
                            this.renderRecentQuizAttempts(data.slice(0,10));
                            const statusEl = document.getElementById('recentQuizSummary');
                            if (statusEl && !statusEl.querySelector('.index-hint')) statusEl.insertAdjacentHTML('beforeend', '<div class="index-hint text-[10px] text-amber-600 mt-1">Index building... using fallback data.</div>');
                        } catch(fetchErr){
                            console.warn('Fallback fetch for quizAttempts (snapshot error) failed', fetchErr);
                        }
                    })();
                }
            });
        } catch (e) {
            console.error('❌ Failed to set recent quiz attempts listener', e);
            if (e.message && e.message.includes('index')) {
                // Fallback: fetch without ordered composite (client-side sort)
                (async () => {
                    try {
                        const baseQ = query(collection(db, 'quizAttempts'), where('userId', '==', this.currentUser.uid), limit(25));
                        const snap = await getDocs(baseQ);
                        const data = [];
                        snap.forEach(d => data.push({ id: d.id, ...d.data() }));
                        data.sort((a,b)=> (b.createdAt?.toMillis?.()||0) - (a.createdAt?.toMillis?.()||0));
                        this.renderRecentQuizAttempts(data.slice(0,10));
                        const statusEl = document.getElementById('recentQuizSummary');
                        if (statusEl) statusEl.insertAdjacentHTML('beforeend', '<div class="text-[10px] text-amber-600 mt-1">Using fallback (create index for faster real-time updates).</div>');
                    } catch(fetchErr){
                        console.warn('Fallback fetch for quizAttempts failed', fetchErr);
                    }
                })();
            }
        }
    }

    // === Render Recent Quiz Attempts ===
    renderRecentQuizAttempts(attempts) {
        const listEl = document.getElementById('recentQuizList');
        const summaryEl = document.getElementById('recentQuizSummary');
        const accFill = document.getElementById('quizAccuracyFill');
        const accPct = document.getElementById('quizAccuracyPct');
        const accBar = document.getElementById('quizAccuracyBar');
        if (!listEl || !summaryEl) return;
        if (!attempts.length) {
            summaryEl.textContent = 'No quiz attempts yet.';
            listEl.innerHTML = '';
            accBar && accBar.classList.add('hidden');
            return;
        }
        const correct = attempts.filter(a => a.isCorrect).length;
        const accuracy = Math.round((correct / attempts.length) * 100);
        summaryEl.innerHTML = `<span class="font-medium text-gray-800">${correct}/${attempts.length}</span> correct (last ${attempts.length})`;
        if (accBar) accBar.classList.remove('hidden');
        if (accFill) accFill.style.width = accuracy + '%';
        if (accPct) accPct.textContent = accuracy + '%';
        listEl.innerHTML = attempts.slice(0,5).map(a => {
            const time = a.createdAt?.toDate ? a.createdAt.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : (a.createdAtIso || '').split('T')[1]?.substring(0,5) || '';
            return `<div class="flex items-start p-2 border rounded-lg ${a.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}">
                <div class="flex-1 pr-2">
                    <p class="text-xs font-medium text-gray-700 line-clamp-2">${a.question}</p>
                    <p class="text-[10px] mt-1 ${a.isCorrect ? 'text-green-600' : 'text-red-600'}">${a.isCorrect ? 'Correct +' + a.pointsAwarded + ' XP' : 'Incorrect'}</p>
                </div>
                <span class="text-[10px] text-gray-500 ml-1">${time}</span>
            </div>`;
        }).join('');
    }

    // === Evacuation Records Listener ===
    listenForEvacuationRecords() {
        if (!this.currentUser) return;
        try {
            const evacQ = query(
                collection(db, 'evacuation_records'),
                where('studentId', '==', this.currentUser.uid),
                orderBy('timestamp', 'desc'),
                limit(5)
            );
            onSnapshot(evacQ, (snap) => {
                const records = [];
                snap.forEach(d => records.push({ id: d.id, ...d.data() }));
                this.renderEvacuationSummary(records);
            }, (err) => {
                console.error('❌ Evacuation records listener error', err);
                if (err.message && err.message.includes('index')) {
                    (async () => {
                        try {
                            const baseQ = query(collection(db, 'evacuation_records'), where('studentId', '==', this.currentUser.uid), limit(15));
                            const snap = await getDocs(baseQ);
                            const data = [];
                            snap.forEach(d => data.push({ id: d.id, ...d.data() }));
                            data.sort((a,b)=> (b.timestamp?.toMillis?.()||0) - (a.timestamp?.toMillis?.()||0));
                            this.renderEvacuationSummary(data.slice(0,5));
                            const statusEl = document.getElementById('evacSummaryStatus');
                            if (statusEl && !statusEl.querySelector('.index-hint')) statusEl.insertAdjacentHTML('beforeend', '<div class="index-hint text-[10px] text-amber-600 mt-1">Index building... using fallback data.</div>');
                        } catch(fetchErr){
                            console.warn('Fallback fetch for evacuation_records (snapshot error) failed', fetchErr);
                        }
                    })();
                }
            });
        } catch (e) {
            console.error('❌ Failed to set evacuation records listener', e);
            if (e.message && e.message.includes('index')) {
                (async () => {
                    try {
                        const baseQ = query(collection(db, 'evacuation_records'), where('studentId', '==', this.currentUser.uid), limit(15));
                        const snap = await getDocs(baseQ);
                        const data = [];
                        snap.forEach(d => data.push({ id: d.id, ...d.data() }));
                        data.sort((a,b)=> (b.timestamp?.toMillis?.()||0) - (a.timestamp?.toMillis?.()||0));
                        this.renderEvacuationSummary(data.slice(0,5));
                        const statusEl = document.getElementById('evacSummaryStatus');
                        if (statusEl) statusEl.insertAdjacentHTML('beforeend', '<div class="text-[10px] text-amber-600 mt-1">Using fallback (create index for real-time ordering).</div>');
                    } catch(fetchErr){
                        console.warn('Fallback fetch for evacuation_records failed', fetchErr);
                    }
                })();
            }
        }
    }

    // === Render Evacuation Summary ===
    renderEvacuationSummary(records) {
        const statusEl = document.getElementById('evacSummaryStatus');
        const latestEl = document.getElementById('evacLatest');
        if (!statusEl || !latestEl) return;
        if (!records.length) {
            statusEl.textContent = 'No evacuation check-ins yet.';
            latestEl.innerHTML = '';
            return;
        }
        const last = records[0];
        const ts = last.timestamp?.toDate ? last.timestamp.toDate() : (last.timestamp instanceof Date ? last.timestamp : null);
        const tsText = ts ? ts.toLocaleString() : '';
        const total = records.length;
        statusEl.innerHTML = `<span class="font-medium text-gray-800">${total}</span> recent check-in${total>1?'s':''}. Last at <span class="font-medium">${tsText}</span>`;
        latestEl.innerHTML = records.map(r => {
            const t = r.timestamp?.toDate ? r.timestamp.toDate() : (r.timestamp instanceof Date ? r.timestamp : null);
            return `<div class="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                <div class="pr-2">
                    <p class="font-medium text-gray-700">${r.safeZoneName || 'Safe Zone'}</p>
                    <p class="text-[10px] text-gray-500">${r.drillType || 'Drill'}</p>
                </div>
                <div class="text-right text-[10px] text-gray-500">${t ? t.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}</div>
            </div>`;
        }).join('');
    }

    // === Authentication Tab Switching ===
    switchAuthTab(activeTab) {
        console.log(`🔄 Switching to ${activeTab} tab`);
        
        // Update tab styles
        document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
        
        if (activeTab === 'login') {
            this.loginTab.classList.add('active');
            this.loginForm.classList.add('active');
        } else {
            this.registerTab.classList.add('active');
            this.registerForm.classList.add('active');
        }
        
        // Clear any previous messages
        this.clearMessage();
    }

    // === Student Login Handler ===
    async handleLogin(e) {
        e.preventDefault();
        console.log("🔐 Processing login...");
        
        const email = this.loginEmail.value.trim();
        const password = this.loginPassword.value.trim();
        
        // Validation
        if (!this.validateInputs(email, password)) return;
        
        this.setButtonLoading(this.loginBtn, true, 'Signing In...');
        
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log("✅ Login successful:", userCredential.user.email);
            
            this.showMessage("Welcome back! Loading your dashboard...", 'success');
            
        } catch (error) {
            console.error("❌ Login error:", error);
            this.handleAuthError(error);
            
        } finally {
            this.setButtonLoading(this.loginBtn, false, 'Sign In');
        }
    }

    // === Student Registration Handler ===
    async handleRegister(e) {
        e.preventDefault();
        console.log("📝 Processing registration...");
        
        const name = this.registerName.value.trim();
        const email = this.registerEmail.value.trim();
        const phone = this.registerPhone.value.trim();
        const location = this.registerLocation.value.trim();
        const organization = this.registerOrganization.value.trim();
        const password = this.registerPassword.value.trim();
        
        // Enhanced validation
        if (!this.validateInputs(email, password, name)) return;
        
        this.setButtonLoading(this.registerBtn, true, 'Creating Account...');
        
        try {
            // Create Firebase user account
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log("✅ Registration successful:", userCredential.user.email);
            
            // Create student profile in Firestore with additional details
            await this.createStudentProfile(userCredential.user.uid, {
                name,
                email,
                phone,
                location,
                organization
            });
            
            this.showMessage("Account created successfully! Welcome to Pralayveer!", 'success');
            
        } catch (error) {
            console.error("❌ Registration error:", error);
            this.handleAuthError(error);
            
        } finally {
            this.setButtonLoading(this.registerBtn, false, 'Create Account');
        }
    }

    // === Create Student Profile in Firestore ===
    async createStudentProfile(userId, profileData) {
        console.log("📄 Creating student profile for:", profileData.email);
        
        try {
            const studentRef = doc(db, 'students', userId);
            const studentData = {
                name: profileData.name,
                email: profileData.email,
                phone: profileData.phone || '',
                location: profileData.location || '',
                organization: profileData.organization || '',
                points: 0,
                level: 1,
                lastQuizDate: null,
                lastLoginDate: new Date().toISOString(),
                currentStreak: 1,
                longestStreak: 1,
                joinedAt: new Date().toISOString(),
                weakestTopic: null,
                completedQuizzes: 0,
                averageScore: 0,
                badges: [],
                drillsParticipated: 0,
                recentActivities: []
            };
            
            await setDoc(studentRef, studentData);
            console.log("✅ Student profile created successfully");
            
        } catch (error) {
            console.error("❌ Error creating student profile:", error);
            throw error;
        }
    }

    // === Real-time Student Profile Listener ===
    listenToStudentProfile(userId) {
        console.log("👂 Setting up student profile listener for:", userId);
        
        const studentRef = doc(db, 'students', userId);
        
        onSnapshot(studentRef, async (doc) => {
            if (doc.exists()) {
                this.studentData = doc.data();
                console.log("📊 Student data updated:", this.studentData);
                this.updateDashboardUI(this.studentData);
                this.updateProfileDisplay(this.studentData);
            } else {
                console.warn("⚠️ Student profile not found, creating default profile...");
                try {
                    // Create default student profile
                    const defaultStudentData = {
                        name: 'Anonymous Student',
                        email: this.currentUser.email || 'anonymous@pralayveer.com',
                        class: 'Not Set',
                        rollNumber: 'AUTO-' + Date.now().toString().slice(-6),
                        phone: 'Not Set',
                        points: 0,
                        quizzesTaken: 0,
                        drillsParticipated: 0,
                        completedQuizzes: 0,
                        achievements: [],
                        joinedDate: new Date()
                    };
                    
                    await setDoc(studentRef, defaultStudentData);
                    console.log("✅ Default student profile created");
                    // The listener will fire again with the new data
                } catch (error) {
                    console.error("❌ Error creating default student profile:", error);
                }
            }
        }, (error) => {
            console.error("❌ Error listening to student profile:", error);
        });
    }

    // === Real-time Drill Listener ===
    listenForDrills() {
        console.log("👂 Setting up drill listener...");
        
        // Query for ALL drills, ordered by startTime ascending to get the next upcoming one
        const drillsQuery = query(
            collection(db, 'drills'),
            orderBy('startTime', 'asc')
        );
        
        onSnapshot(drillsQuery, (snapshot) => {
            console.log("� DRILL SYNC UPDATE - Received from Firestore");
            console.log(`📊 Processing ${snapshot.size} drill documents at ${new Date().toLocaleString()}`);
            
            // Update connection status to show live sync
            this.updateConnectionStatus();
            
            const now = new Date();
            let nextUpcomingDrill = null;
            let activeDrill = null;
            const allDrills = [];
            
            // Process all drills
            snapshot.forEach((doc) => {
                const drill = { id: doc.id, ...doc.data() };
                
                // Ensure startTime exists and convert to Date
                if (!drill.startTime) {
                    console.warn("⚠️ Drill missing startTime:", drill);
                    return;
                }
                
                const drillTime = drill.startTime.toDate();
                const timeDiff = drillTime.getTime() - now.getTime();
                
                console.log(`🔍 Processing drill: ${drill.name}`);
                console.log(`   📅 Scheduled: ${drillTime.toLocaleString()}`);
                console.log(`   ⏰ Time difference: ${Math.round(timeDiff / 1000 / 60)} minutes`);
                
                allDrills.push({ ...drill, drillTime, timeDiff });
            });
            
            // Find active drill (within 5 minutes of start time)
            activeDrill = allDrills.find(drill => Math.abs(drill.timeDiff) <= 5 * 60 * 1000);
            
            // Find next upcoming drill (future drill, closest to now)
            const upcomingDrills = allDrills
                .filter(drill => drill.timeDiff > 0)
                .sort((a, b) => a.timeDiff - b.timeDiff);
            
            nextUpcomingDrill = upcomingDrills[0] || null;
            
            console.log("� Drill Analysis Results:");
            console.log(`   🚨 Active drill: ${activeDrill ? activeDrill.name : 'None'}`);
            console.log(`   📅 Next upcoming: ${nextUpcomingDrill ? nextUpcomingDrill.name : 'None'}`);
            
            // Handle active drill display
            if (activeDrill) {
                console.log("✅ Showing active drill mode:", activeDrill.name);
                this.showDrillMode(activeDrill);
                this.toggleAdminActiveControls(true);
            } else {
                this.hideDrillMode();
                this.toggleAdminActiveControls(false);
            }
            
            // Update drill alert for upcoming drills
            if (nextUpcomingDrill) {
                console.log("✅ Updating drill alert for:", nextUpcomingDrill.name);
                this.updateDrillAlert(nextUpcomingDrill);
                this.toggleAdminUpcomingControls(true, nextUpcomingDrill);
            } else {
                console.log("ℹ️ No upcoming drills found");
                this.updateDrillAlert(null);
                this.toggleAdminUpcomingControls(false);
            }
            
        }, (error) => {
            console.error("❌ Error listening to drills:", error);
            // Show no drills if there's an error
            this.updateDrillAlert(null);
            this.hideDrillMode();
        });
    }

    // === Real-time Leaderboard Listener ===
    listenForLeaderboard() {
        console.log("👂 Setting up leaderboard listener...");
        
        const leaderboardQuery = query(
            collection(db, 'students'),
            orderBy('points', 'desc')
        );
        
        onSnapshot(leaderboardQuery, (snapshot) => {
            const students = [];
            snapshot.forEach((doc) => {
                students.push({ id: doc.id, ...doc.data() });
            });
            
            this.updateLeaderboard(students);
            
        }, (error) => {
            console.error("❌ Error listening to leaderboard:", error);
        });
    }

    // === Update Dashboard UI ===
    updateDashboardUI(data) {
        console.log("🎨 Updating dashboard UI with:", data);
        
        try {
            // Update streak status
            this.updateStreakStatus(data);
            
            // Update welcome message
            this.studentWelcome.textContent = data.name || 'Student';
            // Update avatar letter / image
            if (this.profileAvatarLetter) {
                const letter = (data.name || 'S').trim().charAt(0).toUpperCase();
                this.profileAvatarLetter.textContent = letter || 'S';
            }
            if (this.profileAvatarImg) {
                if (data.photoURL) {
                    this.profileAvatarImg.src = data.photoURL;
                    this.profileAvatarImg.classList.remove('hidden');
                } else {
                    this.profileAvatarImg.classList.add('hidden');
                }
            }
            // Slide-over mirror
            if (this.slideAvatarLetter) this.slideAvatarLetter.textContent = (data.name||'S').charAt(0).toUpperCase();
            if (this.slideAvatarImg) {
                if (data.photoURL) { this.slideAvatarImg.src = data.photoURL; this.slideAvatarImg.classList.remove('hidden'); }
                else this.slideAvatarImg.classList.add('hidden');
            }
            if (this.slideProfileName) this.slideProfileName.textContent = data.name || 'Student';
            if (this.slideProfileEmail) this.slideProfileEmail.textContent = data.email || '—';
            if (this.slideLevelBadge) this.slideLevelBadge.textContent = 'Lvl ' + (Math.floor(data.points/500)+1);
            if (this.slideStreakBadge) {
                if (data.currentStreak) { this.slideStreakBadge.textContent = `🔥 ${data.currentStreak}d`; this.slideStreakBadge.classList.remove('hidden'); }
                else this.slideStreakBadge.classList.add('hidden');
            }
            if (this.slidePoints) this.slidePoints.textContent = (data.points||0).toLocaleString();
            if (this.slideCurrentStreak) this.slideCurrentStreak.textContent = data.currentStreak||0;
            if (this.slideLongestStreak) this.slideLongestStreak.textContent = data.longestStreak||0;
            if (this.slideQuizzes) this.slideQuizzes.textContent = data.completedQuizzes||0;
            
            // Update level and points
            const level = Math.floor(data.points / 500) + 1;
            const pointsInCurrentLevel = data.points % 500;
            const progressPercentage = (pointsInCurrentLevel / 500) * 100;
            
            this.studentLevel.textContent = level;
            this.studentLevelText.textContent = level;
            this.studentPoints.textContent = data.points.toLocaleString();
            
            // Update streak display
            if (this.studentStreak) {
                this.studentStreak.textContent = data.currentStreak || 0;
            }
            
            // Update circular progress
            this.updateCircularProgress(progressPercentage);
            
            // Update badges
            this.updateBadges(data.points);
            
            // Update quiz availability
            this.updateQuizAvailability(data.lastQuizDate);
            
            console.log("✅ Dashboard UI updated successfully");
            
        } catch (error) {
            console.error("❌ Error updating dashboard UI:", error);
        }
    }

    // === Streak Management System ===
    updateStreakStatus(data) {
        const today = new Date();
        const lastLogin = data.lastLoginDate ? new Date(data.lastLoginDate) : null;
        
        if (!lastLogin) {
            // First login
            data.currentStreak = 1;
            data.longestStreak = Math.max(data.longestStreak || 0, 1);
            data.lastLoginDate = today.toISOString();
            this.saveStreakData(data);
            return;
        }
        
        const daysDifference = Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24));
        
        if (daysDifference === 0) {
            return; // same day
        } else if (daysDifference === 1) {
            data.currentStreak = (data.currentStreak || 0) + 1;
            data.longestStreak = Math.max(data.longestStreak || 0, data.currentStreak);
            data.lastLoginDate = today.toISOString();
            this.saveStreakData(data);
            this._showStreakUI(data.currentStreak, true);
            this.awardDailyStreakBonus(data.currentStreak);
        } else {
            data.currentStreak = 1;
            data.lastLoginDate = today.toISOString();
            this.saveStreakData(data);
            this._showStreakUI(1, false);
        }
    }

    _showStreakUI(streak, celebrate) {
        const pill = document.getElementById('loginStreakPill');
        const val = document.getElementById('loginStreakValue');
        if (!pill || !val) return;
        val.textContent = streak;
        pill.classList.remove('hidden');
        if (celebrate) {
            pill.classList.remove('xp-pulse');
            void pill.offsetWidth;
            pill.classList.add('xp-pulse');
            if (streak === 1) this.showToast('Streak started! Keep going.', {type:'streak', sound:'tap'});
            else this.showToast(`🔥 ${streak}-day streak!`, {type:'streak', sound:'streak'});
        }
    }

    async awardDailyStreakBonus(streak) {
        if (!this.currentUser || this._dailyBonusGiven) return;
        this._dailyBonusGiven = true;
        const bonus = 10 + Math.min(40, Math.floor(streak/5)*5);
        try {
            const ref = doc(db,'students',this.currentUser.uid);
            await updateDoc(ref, { points: increment(bonus) });
            this.showToast(`+${bonus} XP Daily Bonus`, {type:'xp', sound:'success'});
            const bubble = document.getElementById('xpDeltaBubble');
            if (bubble) {
                bubble.textContent = `+${bonus} XP`;
                bubble.classList.remove('hidden');
                bubble.style.opacity='1';
                bubble.style.transform='translateY(0)';
                setTimeout(()=>{
                    bubble.style.transition='all .6s ease';
                    bubble.style.opacity='0';
                    bubble.style.transform='translateY(-10px)';
                    setTimeout(()=>bubble.classList.add('hidden'),650);
                },1800);
            }
        } catch(e){ console.warn('Daily bonus award failed', e);}        
    }

    // === Save Streak Data ===
    saveStreakData(data) {
        if (this.currentUser) {
            try {
                const studentRef = doc(db, 'students', this.currentUser.uid);
                updateDoc(studentRef, {
                    currentStreak: data.currentStreak,
                    longestStreak: data.longestStreak,
                    lastLoginDate: data.lastLoginDate
                }).catch(error => console.error('❌ Error updating streak:', error));
            } catch (e) {
                console.error('❌ Failed to update streak using modular API', e);
            }
        }
        
        // Celebrate streak milestones
        this.checkStreakMilestones(data.currentStreak);
    }

    // === Check Streak Milestones ===
    checkStreakMilestones(currentStreak) {
        const milestones = [7, 14, 30, 50, 100];
        if (milestones.includes(currentStreak)) {
            this.showStreakCelebration(currentStreak);
        }
    }

    // === Show Streak Celebration ===
    showStreakCelebration(days) {
        console.log(`🔥 Streak milestone reached: ${days} days!`);
        
        // Show a simple alert for now (could be enhanced with a modal later)
        setTimeout(() => {
            alert(`🔥 Amazing! You've maintained a ${days}-day login streak! Keep it up!`);
        }, 1000);
    }

    // === Update Circular Progress ===
    updateCircularProgress(percentage) {
        const circumference = 2 * Math.PI * 45; // radius = 45
        const offset = circumference - (percentage / 100) * circumference;
        
        this.progressCircle.style.strokeDashoffset = offset;
        this.progressPercentage.textContent = `${Math.round(percentage)}%`;
    }

    // === Update Badge System ===
    updateBadges(points) {
        console.log("🏆 Updating badges for points:", points);
        
        // Define badge thresholds
        const badgeThresholds = [
            { className: 'fire-badge', threshold: 500 },
            { className: 'earthquake-badge', threshold: 1000 },
            { className: 'master-badge', threshold: 2000 }
        ];
        
        badgeThresholds.forEach(badge => {
            const badgeElement = document.querySelector(`.${badge.className}`);
            if (badgeElement) {
                if (points >= badge.threshold) {
                    if (!badgeElement.classList.contains('unlocked')) {
                        badgeElement.classList.add('unlocked');
                        console.log(`🎉 Badge unlocked: ${badge.className}`);
                        
                        // Show unlock notification
                        setTimeout(() => {
                            this.showMessage(`🎉 New badge unlocked: ${badge.className.replace('-badge', '')}!`, 'success');
                        }, 500);
                    }
                } else {
                    badgeElement.classList.remove('unlocked');
                }
            }
        });
    }

    // === Update Quiz Availability ===
    updateQuizAvailability(lastQuizDate) {
        const today = new Date().toDateString();
        const lastQuiz = lastQuizDate ? new Date(lastQuizDate).toDateString() : null;
        
        if (lastQuiz === today) {
            // Already taken today
            this.dailyQuizBtn.disabled = true;
            this.dailyQuizBtn.textContent = "Quiz Completed Today";
            this.dailyQuizBtn.classList.add('bg-gray-300', 'cursor-not-allowed');
            this.dailyQuizBtn.classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
            this.quizStatus.textContent = "Come back tomorrow for a new quiz!";
        } else {
            // Available to take
            this.dailyQuizBtn.disabled = false;
            this.dailyQuizBtn.textContent = "Take Today's Quiz";
            this.dailyQuizBtn.classList.remove('bg-gray-300', 'cursor-not-allowed');
            this.dailyQuizBtn.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
            this.quizStatus.textContent = "Earn up to 30 XP points!";
        }
    }

    // === Start Daily Quiz ===
    async startDailyQuiz() {
        console.log("📚 Starting daily quiz...");
        
        if (this.dailyQuizBtn.disabled) return;
        
        // Prefer AI quiz generator basic multiple choice if available
        if (this.aiQuiz && Array.isArray(this.aiQuiz.questionBank) && this.aiQuiz.questionBank.length) {
            const mcQuestions = this.aiQuiz.questionBank.filter(q => q.type === 'multiple_choice');
            const pool = mcQuestions.length ? mcQuestions : this.aiQuiz.questionBank;
            this.currentQuiz = pool[Math.floor(Math.random() * pool.length)];
            // Normalize structure to legacy format used by renderer
            this.currentQuizLegacy = {
                question: this.currentQuiz.question,
                options: this.currentQuiz.options,
                answer: this.currentQuiz.correctAnswer,
                points: this.currentQuiz.points || 20,
                explanation: this.currentQuiz.explanation || 'Great job!'
            };
            this.currentQuiz = this.currentQuizLegacy;
            console.log("🤖 Using AI-generated question:", this.currentQuiz.question);
        } else {
            // Fallback to static bank
            const randomIndex = Math.floor(Math.random() * this.questionBank.length);
            this.currentQuiz = this.questionBank[randomIndex];
        }
        
        console.log("❓ Selected question:", this.currentQuiz.question);
        
        // Display quiz modal
        this.showQuizModal();
    }

    // === Show Quiz Modal ===
    showQuizModal() {
        this.quizModal.classList.remove('hidden');
        this.quizModal.classList.add('flex');
        
        // Set question (guard against null during initial adaptive/endless setup)
        if (this.currentQuiz && this.currentQuiz.question) {
            this.quizQuestion.textContent = this.currentQuiz.question;
        } else if (this.adaptiveSession && this.adaptiveSession.questions?.length) {
            // Preload first question text without mutating currentQuiz yet
            this.quizQuestion.textContent = this.adaptiveSession.questions[0].question || 'Loading question...';
        } else {
            this.quizQuestion.textContent = 'Loading question...';
        }
        
        // Clear previous options and result
        this.quizOptions.innerHTML = '';
        this.quizResult.classList.add('hidden');
        
        // Create option buttons
        if (this.currentQuiz && Array.isArray(this.currentQuiz.options)) {
            this.currentQuiz.options.forEach((option, index) => {
                const button = document.createElement('button');
                button.className = 'quiz-option w-full p-4 text-left rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all';
                button.textContent = option;
                button.onclick = () => this.selectQuizAnswer(index);
                this.quizOptions.appendChild(button);
            });
        } else if (this.adaptiveSession && this.adaptiveSession.questions?.length) {
            // Placeholder options until renderAdaptiveQuestion runs
            const first = this.adaptiveSession.questions[0];
            if (first?.options) {
                first.options.forEach((opt,i)=>{
                    const ph = document.createElement('button');
                    ph.disabled = true;
                    ph.className = 'quiz-option w-full p-4 text-left rounded-lg border-2 border-gray-100 bg-gray-50 text-gray-400';
                    ph.textContent = opt;
                    this.quizOptions.appendChild(ph);
                });
            }
        }
    }

    // === Start Adaptive AI Quiz (multi-question) ===
    startAdaptiveQuiz() {
        if (!this.aiQuiz) {
            this.showMessage('Adaptive quiz engine not available yet.', 'error');
            return;
        }
        console.log('🤖 Starting adaptive AI quiz session (multi-question)');
        try {
            const size = 8; // initial number of questions
            const quiz = this.aiQuiz.generateRandomQuiz ? this.aiQuiz.generateRandomQuiz(size) : null;
            if (!quiz || !Array.isArray(quiz.questions) || !quiz.questions.length) {
                this.showMessage('Unable to generate adaptive quiz.', 'error');
                return;
            }
            this.adaptiveSession = {
                mode: 'adaptive',
                questions: quiz.questions.map(q => this.normalizeAIQuestion(q)),
                index: 0,
                correct: 0,
                startedAt: Date.now()
            };
            this.renderAdaptiveQuestion();
            this.prepareAdaptiveUI();
            const statusEl = document.getElementById('advancedQuizStatus');
            if (statusEl) statusEl.textContent = `Adaptive quiz loaded (${quiz.questions.length} questions)`;
        } catch (e) {
            console.error('❌ Adaptive quiz generation failed', e);
            this.showMessage('Adaptive quiz generation failed.', 'error');
        }
    }

    // === Start Endless Quiz Mode ===
    startEndlessQuiz() {
        if (!this.aiQuiz) {
            this.showMessage('Endless mode unavailable: AI engine not loaded.', 'error');
            return;
        }
        console.log('♾️ Starting Endless Quiz Mode (hybrid)');
        (async () => {
            const batchSize = 15;
            const batch = await this.hybridGenerateQuestions(batchSize, { difficulty: 'mixed' });
            if (!batch.length) {
                this.showMessage('Could not start endless quiz.', 'error');
                return;
            }
            this.adaptiveSession = {
                mode: 'endless',
                questions: batch,
                index: 0,
                correct: 0,
                startedAt: Date.now(),
                totalAnswered: 0
            };
            this.prepareAdaptiveUI(true);
            this.renderAdaptiveQuestion();
            const statusEl = document.getElementById('advancedQuizStatus');
            if (statusEl) statusEl.textContent = 'Endless quiz mode active (hybrid)';
        })();
    }

    // === Extend Endless Session ===
    extendEndlessSession() {
        if (!this.adaptiveSession || this.adaptiveSession.mode !== 'endless') return;
        const addSize = 10;
        (async () => {
            const extra = await this.hybridGenerateQuestions(addSize, { difficulty: 'mixed' });
            if (!extra.length) {
                this.showMessage('No new questions fetched.', 'error');
                return;
            }
            this.adaptiveSession.questions.push(...extra);
            this.showMessage(`Added ${extra.length} more questions!`, 'success');
            this.updateAdaptiveProgress();
        })();
    }

    // === Generate Fresh Questions (infinite) ===
    generateFreshAIQuestions(count = 5) {
        const out = [];
        if (!this.aiQuiz) return out;
        for (let i = 0; i < count; i++) {
            // Use generator methods to create variety
            const typePick = Math.random();
            let qObj = null;
            if (typePick < 0.6) {
                // multiple choice from template pool
                const bank = this.aiQuiz.questionBank.filter(q => q.type === 'multiple_choice');
                if (bank.length) qObj = bank[Math.floor(Math.random()*bank.length)];
            } else if (typePick < 0.85 && this.aiQuiz.createScenarioQuestion) {
                // Safely generate scenario question by selecting template explicitly
                const scenCats = Object.keys(this.aiQuiz.scenarioTemplates || {});
                if (scenCats.length) {
                    const cat = scenCats[Math.floor(Math.random()*scenCats.length)];
                    const templates = this.aiQuiz.scenarioTemplates[cat] || [];
                    if (templates.length) {
                        const tpl = templates[Math.floor(Math.random()*templates.length)];
                        try { qObj = this.aiQuiz.createScenarioQuestion(tpl, cat); } catch(sErr){ console.warn('Scenario generation failed', sErr); }
                    }
                }
            } else if (this.aiQuiz.generateRandomQuiz) {
                const quiz = this.aiQuiz.generateRandomQuiz(1);
                if (quiz?.questions?.length) qObj = quiz.questions[0];
            }
            if (qObj) out.push(qObj);
        }
        // As a fallback ensure at least one from static bank
        if (!out.length && this.questionBank.length) {
            out.push({
                type: 'multiple_choice',
                question: this.questionBank[0].question,
                options: this.questionBank[0].options,
                correctAnswer: this.questionBank[0].answer,
                explanation: this.questionBank[0].explanation,
                points: this.questionBank[0].points
            });
        }
        return out;
    }
    // External AI fetch
    async fetchExternalAIQuestions({ count = 5, topics = [], difficulty = 'mixed' } = {}) {
        if (!EXTERNAL_AI_ENDPOINT) return [];
        if (!this.currentUser) return [];
        try {
            const token = await this.currentUser.getIdToken();
            const res = await fetch(EXTERNAL_AI_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({ count, topics, difficulty, locale: 'en-IN', version: 'v1' })
            });
            if (!res.ok) return [];
            const data = await res.json();
            if (!data?.questions) return [];
            return data.questions.map(q => this.normalizeAIQuestion(q));
        } catch (e) {
            console.warn('External AI fetch failed', e);
            return [];
        }
    }
    async hybridGenerateQuestions(count = 5, opts = {}) {
        let remote = await this.fetchExternalAIQuestions({ count, ...opts });
        if (remote.length < count) {
            const local = this.generateFreshAIQuestions(count - remote.length).map(q => this.normalizeAIQuestion(q));
            remote = remote.concat(local);
        }
        return remote;
    }

    // === Normalize AI Question to internal format ===
    normalizeAIQuestion(raw) {
        return {
            id: raw.id || ('q_' + Math.random().toString(36).slice(2)),
            question: raw.question || raw.text || 'Safety question',
            options: raw.options || raw.choices || ['Yes','No'],
            answer: raw.correctAnswer ?? raw.answer ?? 0,
            explanation: raw.explanation || 'Review safety best practices.',
            points: raw.points || 20,
            topic: raw.topic || (raw.tags && raw.tags[0]) || 'General',
            type: raw.type || 'multiple_choice'
        };
    }

    // === Prepare Adaptive UI ===
    prepareAdaptiveUI(isEndless = false) {
        this.showQuizModal();
        // Switch header icon & title
        const titleEl = document.getElementById('quizTitle');
        const iconEl = document.getElementById('quizIcon');
        if (titleEl) titleEl.textContent = isEndless ? 'Endless Safety Quiz' : 'Adaptive Safety Quiz';
        if (iconEl) iconEl.textContent = isEndless ? '♾️' : '🤖';
        const nav = document.getElementById('adaptiveNav');
        const progWrap = document.getElementById('adaptiveProgressWrapper');
        const addMore = document.getElementById('endlessAddMoreBtn');
        if (nav) nav.classList.remove('hidden');
        if (progWrap) progWrap.classList.remove('hidden');
        if (addMore) {
            if (isEndless) addMore.classList.remove('hidden'); else addMore.classList.add('hidden');
        }
        this.updateAdaptiveProgress();
    }

    // === Render Adaptive Question ===
    renderAdaptiveQuestion() {
        if (!this.adaptiveSession) return;
        const { questions, index } = this.adaptiveSession;
        const q = questions[index];
        this.currentQuiz = q; // reuse existing selection logic
        this.quizQuestion.textContent = q.question;
        this.quizOptions.innerHTML = '';
        q.options.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'quiz-option w-full p-3 text-left rounded-lg border-2 border-gray-200 hover:border-purple-500 transition-all text-sm';
            btn.textContent = opt;
            btn.onclick = () => this.answerAdaptive(i);
            // If already answered store state on q.selected
            if (typeof q.selectedIndex === 'number') {
                btn.onclick = null;
                if (i === q.answer) btn.classList.add('correct');
                else if (i === q.selectedIndex && q.selectedIndex !== q.answer) btn.classList.add('incorrect');
            }
            this.quizOptions.appendChild(btn);
        });
        this.quizResult.classList.add('hidden');
        this.updateAdaptiveControls();
        this.updateAdaptiveProgress();
    }

    // === Adaptive Answer Handler ===
    async answerAdaptive(selectedIndex) {
        if (!this.adaptiveSession) return;
        const q = this.adaptiveSession.questions[this.adaptiveSession.index];
        if (typeof q.selectedIndex === 'number') return; // already answered
        q.selectedIndex = selectedIndex;
        q.isCorrect = selectedIndex === q.answer;
        if (q.isCorrect) this.adaptiveSession.correct += 1;
        // Persist attempt inline (same method reused)
        try {
            await this.updateStudentProgress(q.isCorrect ? q.points : 0, q.isCorrect, { selectedIndex, correctIndex: q.answer });
        } catch (e) { console.warn('Attempt persistence failed (adaptive)', e); }
        this.renderAdaptiveQuestion();
    }

    // === Navigate Adaptive ===
    navigateAdaptive(direction) {
        if (!this.adaptiveSession) return;
        const newIndex = this.adaptiveSession.index + direction;
        if (newIndex < 0 || newIndex >= this.adaptiveSession.questions.length) return;
        this.adaptiveSession.index = newIndex;
        this.renderAdaptiveQuestion();
    }

    // === Update Adaptive Controls State ===
    updateAdaptiveControls() {
        if (!this.adaptiveSession) return;
        const { index, questions, mode } = this.adaptiveSession;
        if (this.adaptivePrevBtn) this.adaptivePrevBtn.disabled = index === 0;
        if (this.adaptiveNextBtn) this.adaptiveNextBtn.disabled = index >= questions.length - 1;
        if (this.adaptiveSubmitBtn) {
            const allAnswered = questions.every(q => typeof q.selectedIndex === 'number');
            this.adaptiveSubmitBtn.classList.toggle('hidden', !(allAnswered && mode === 'adaptive'));
        }
    }

    // === Update Adaptive Progress Display ===
    updateAdaptiveProgress() {
        if (!this.adaptiveSession) return;
        const { questions, index, mode } = this.adaptiveSession;
        const progText = document.getElementById('adaptiveProgressText');
        const progBar = document.getElementById('adaptiveProgressBar');
        if (progText) {
            progText.textContent = mode === 'endless'
                ? `Q ${index+1} • Total ${questions.length}`
                : `Question ${index+1}/${questions.length}`;
        }
        if (progBar) {
            const pct = ((index+1)/questions.length)*100;
            progBar.style.width = pct + '%';
        }
    }

    // === Finish Adaptive Session ===
    finishAdaptiveSession() {
        if (!this.adaptiveSession || this.adaptiveSession.mode !== 'adaptive') return;
        const { questions, correct, startedAt } = this.adaptiveSession;
        const total = questions.length;
        const accuracy = Math.round((correct/total)*100);
        const durationSec = Math.round((Date.now() - startedAt)/1000);
        this.quizResult.classList.remove('hidden');
        this.quizResult.innerHTML = `
            <div class="text-4xl mb-2">📊</div>
            <h3 class="text-xl font-bold mb-2 text-purple-600">Session Complete</h3>
            <p class="text-sm text-gray-600 mb-2">You answered <strong>${correct}/${total}</strong> correctly (${accuracy}%).</p>
            <p class="text-xs text-gray-500 mb-4">Time: ${durationSec}s</p>
            <button onclick="window.studentApp.closeAdaptiveSession()" class="mt-2 px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">Close Session</button>
        `;
        const nav = document.getElementById('adaptiveNav');
        if (nav) nav.classList.add('hidden');
    }

    // === Close Adaptive Session ===
    closeAdaptiveSession() {
        this.adaptiveSession = null;
        this.closeQuizModal();
        const nav = document.getElementById('adaptiveNav');
        if (nav) nav.classList.add('hidden');
        const progWrap = document.getElementById('adaptiveProgressWrapper');
        if (progWrap) progWrap.classList.add('hidden');
    }

    // === Select Quiz Answer ===
    async selectQuizAnswer(selectedIndex) {
        console.log("🎯 Quiz answer selected:", selectedIndex);
        if (!this.currentQuiz) return;
        const options = this.quizOptions.querySelectorAll('.quiz-option');
        const correctIndex = this.currentQuiz.answer;
        const isCorrect = selectedIndex === correctIndex;
        
        options.forEach((option, index) => {
            option.onclick = null;
            if (index === correctIndex) option.classList.add('correct');
            else if (index === selectedIndex && !isCorrect) option.classList.add('incorrect');
        });
        
        // Persist attempt & update progress (await before showing result ensures state consistency)
        try {
            await this.updateStudentProgress(isCorrect ? this.currentQuiz.points : 0, isCorrect, {
                selectedIndex,
                correctIndex
            });
        } catch (e) {
            console.error('❌ Failed to persist quiz attempt:', e);
        }
        
        setTimeout(() => this.showQuizResult(isCorrect), 600);
    }

    // === Show Quiz Result ===
    showQuizResult(isCorrect) {
        this.quizResult.classList.remove('hidden');
        
        const points = isCorrect ? this.currentQuiz.points : 0;
        const emoji = isCorrect ? '🎉' : '😔';
        const message = isCorrect ? 'Correct!' : 'Incorrect';
        const explanation = this.currentQuiz.explanation;
        
        this.quizResult.innerHTML = `
            <div class="text-4xl mb-2">${emoji}</div>
            <h3 class="text-xl font-bold mb-2 ${isCorrect ? 'text-green-600' : 'text-red-600'}">${message}</h3>
            <p class="text-sm text-gray-600 mb-3">${explanation}</p>
            ${isCorrect ? `<p class="text-lg font-semibold text-green-600">+${points} XP Points!</p>` : ''}
            <button onclick="window.studentApp.closeQuizModal()" class="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">Continue</button>
        `;
    }

    // === Update Student Progress ===
    async updateStudentProgress(pointsAwarded, isCorrect, meta = {}) {
        console.log("📈 Updating student progress | points:", pointsAwarded, "correct:", isCorrect);
        if (!this.currentUser) return;
        try {
            // Ensure we have a student profile (handles anonymous users too)
            if (!this.studentData) {
                await this.ensureStudentProfile();
            }
            const safeData = this.studentData || { points:0, completedQuizzes:0, averageScore:0 };
            const studentRef = doc(db, 'students', this.currentUser.uid);
            const attemptsCollection = collection(db, 'quizAttempts');
            const nowIso = new Date().toISOString();
            const prevCompleted = safeData.completedQuizzes || 0;
            const newCompleted = prevCompleted + 1;
            const prevAverage = safeData.averageScore || 0;
            const newAverage = ((prevAverage * prevCompleted) + (isCorrect ? 100 : 0)) / newCompleted;
            const newPointsTotal = (safeData.points || 0) + pointsAwarded;
            const attemptDoc = {
                userId: this.currentUser.uid,
                userEmail: this.currentUser.email || null,
                question: this.currentQuiz.question,
                options: this.currentQuiz.options,
                selectedIndex: meta.selectedIndex,
                correctIndex: meta.correctIndex,
                isCorrect,
                pointsAwarded,
                topic: this.currentQuiz.topic || this.currentQuiz.tags?.[0] || null,
                type: this.currentQuiz.type || (this.currentQuiz.options?.length === 2 ? 'true_false' : 'multiple_choice'),
                createdAt: new Date(),
                createdAtIso: nowIso
            };
            await addDoc(attemptsCollection, attemptDoc);
            await updateDoc(studentRef, {
                points: newPointsTotal,
                lastQuizDate: nowIso,
                completedQuizzes: newCompleted,
                averageScore: newAverage
            });
            // Update local cache to reflect new values immediately
            this.studentData.points = newPointsTotal;
            this.studentData.completedQuizzes = newCompleted;
            this.studentData.averageScore = newAverage;
            this.studentData.lastQuizDate = nowIso;
            console.log("✅ Quiz attempt recorded & student progress updated");
        } catch (error) {
            console.error("❌ Error updating student progress / attempt:", error);
        }
    }

    // === Ensure Student Profile (creates minimal doc if missing) ===
    async ensureStudentProfile() {
        if (!this.currentUser) return null;
        if (this.studentData) return this.studentData;
        try {
            const studentRef = doc(db, 'students', this.currentUser.uid);
            const snap = await getDoc(studentRef);
            if (snap.exists()) {
                this.studentData = snap.data();
                return this.studentData;
            }
            // Create minimal profile (anonymous friendly)
            const minimal = {
                name: this.currentUser.displayName || 'Anonymous Student',
                email: this.currentUser.email || null,
                points: 0,
                level: 1,
                lastQuizDate: null,
                currentStreak: 0,
                longestStreak: 0,
                completedQuizzes: 0,
                averageScore: 0,
                joinedAt: new Date().toISOString()
            };
            await setDoc(studentRef, minimal);
            this.studentData = minimal;
            console.log('🆕 Minimal student profile created for user', this.currentUser.uid);
            return minimal;
        } catch (e) {
            console.warn('Could not ensure student profile', e);
            return null;
        }
    }

    // === Close Quiz Modal ===
    closeQuizModal() {
        this.quizModal.classList.add('hidden');
        this.quizModal.classList.remove('flex');
        this.currentQuiz = null;
    }

    // === Update Drill Alert ===
    updateDrillAlert(nextDrill) {
        console.log("🔔 Updating drill alert display:", nextDrill ? nextDrill.name : 'No drills');
        
        if (nextDrill && nextDrill.startTime) {
            const drillTime = nextDrill.startTime.toDate();
            const timeUntil = this.formatTimeUntil(drillTime);
            
            console.log(`📅 Showing drill alert: ${nextDrill.name} - ${timeUntil}`);
            
            // Show drill alert, hide "no drill" message
            this.drillAlert.classList.remove('hidden');
            this.noDrillAlert.classList.add('hidden');
            this.nextDrillInfo.textContent = `${nextDrill.name} - ${timeUntil}`;
        } else {
            console.log("ℹ️ No upcoming drills, showing 'all clear' message");
            
            // Hide drill alert, show "no drill" message
            this.drillAlert.classList.add('hidden');
            this.noDrillAlert.classList.remove('hidden');
        }
    }

    // === Format Time Until Drill ===
    formatTimeUntil(drillTime) {
        const now = new Date();
        const timeDiff = drillTime.getTime() - now.getTime();
        
        console.log(`⏰ Formatting time until drill: DrillTime=${drillTime.toLocaleString()}, Now=${now.toLocaleString()}, Diff=${Math.round(timeDiff / 1000 / 60)} minutes`);
        
        if (timeDiff <= 0) {
            return "Starting now";
        }
        
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) {
            return `Starting in ${days} day${days > 1 ? 's' : ''} ${hours}h`;
        } else if (hours > 0) {
            return `Starting in ${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `Starting in ${minutes} minute${minutes > 1 ? 's' : ''}`;
        } else {
            return "Starting soon";
        }
    }

    // === Show Drill Mode ===
    showDrillMode(drill) {
        console.log("🚨 Showing drill mode for:", drill.name);
        
        this.currentDrill = drill;
        this.drillName.textContent = drill.name;
        this.drillModeOverlay.classList.remove('hidden');
        this.drillModeOverlay.classList.add('flex');
        // Show admin controls if applicable
        this.toggleAdminActiveControls(true);
    }

    // === Hide Drill Mode ===
    hideDrillMode() {
        this.drillModeOverlay.classList.add('hidden');
        this.drillModeOverlay.classList.remove('flex');
        this.currentDrill = null;
        this.toggleAdminActiveControls(false);
    }

    // === Acknowledge Drill ===
    async acknowledgeDrill() {
        console.log("✅ Acknowledging drill:", this.currentDrill?.name);
        
        if (!this.currentDrill) {
            console.error("❌ No current drill to acknowledge");
            this.showMessage("No active drill to acknowledge.", 'error');
            return;
        }

        // Ensure user is authenticated
        await this.ensureAuthentication();
        
        if (!this.currentUser) {
            console.error("❌ User not authenticated");
            this.showMessage("Authentication required to acknowledge drill.", 'error');
            return;
        }

        if (!this.studentData) {
            console.warn("⚠️ Student data not loaded, creating default profile...");
            try {
                // Create default student profile
                const defaultStudentData = {
                    name: 'Anonymous Student',
                    email: this.currentUser.email || 'anonymous@pralayveer.com',
                    class: 'Not Set',
                    rollNumber: 'AUTO-' + Date.now().toString().slice(-6),
                    phone: 'Not Set',
                    points: 0,
                    quizzesTaken: 0,
                    drillsParticipated: 0,
                    completedQuizzes: 0,
                    achievements: [],
                    joinedDate: new Date()
                };
                
                const studentRef = doc(db, 'students', this.currentUser.uid);
                await setDoc(studentRef, defaultStudentData);
                this.studentData = defaultStudentData;
                console.log("✅ Default student profile created");
            } catch (error) {
                console.error("❌ Error creating student profile:", error);
                this.showMessage("Error creating student profile. Please try again.", 'error');
                return;
            }
        }
        
        try {
            // Ensure a student profile exists (handles anonymous users)
            await this.ensureStudentProfile();
            console.log("🔄 Recording drill response...");
            
            // Record drill response
            const drillResponseRef = await addDoc(collection(db, 'drillResponses'), {
                studentId: this.currentUser.uid,
                studentName: this.studentData.name,
                drillId: this.currentDrill.id,
                drillName: this.currentDrill.name,
                responseTime: new Date(),
                acknowledged: true
            });
            
            console.log("✅ Drill response recorded:", drillResponseRef.id);
            
            // Update student drill participation count
            console.log("🔄 Updating student participation count...");
            const studentRef = doc(db, 'students', this.currentUser.uid);
            const newDrills = (this.studentData.drillsParticipated || 0) + 1;
            const newPoints = (this.studentData.points || 0) + 50;
            try {
                await updateDoc(studentRef, {
                    drillsParticipated: newDrills,
                    points: newPoints
                });
            } catch (updErr) {
                if (updErr?.code === 'not-found' || /No document to update/i.test(updErr?.message||'')) {
                    // Fallback: create the document
                    await setDoc(studentRef, {
                        drillsParticipated: newDrills,
                        points: newPoints,
                        name: this.studentData.name || 'Anonymous Student',
                        email: this.studentData.email || this.currentUser.email || null,
                        level: this.studentData.level || 1,
                        completedQuizzes: this.studentData.completedQuizzes || 0,
                        averageScore: this.studentData.averageScore || 0,
                        joinedAt: this.studentData.joinedAt || new Date().toISOString()
                    }, { merge: true });
                    console.warn('ℹ️ Student doc was missing during drill update - created new profile.');
                } else {
                    throw updErr;
                }
            }
            
            console.log("✅ Student data updated successfully");
            
            // Update local data
            this.studentData.drillsParticipated = newDrills;
            this.studentData.points = newPoints;
            
            this.showMessage("Drill acknowledged! +50 XP for participation.", 'success');
            this.hideDrillMode();
            
        } catch (error) {
            console.error("❌ Error acknowledging drill:", error);
            this.showMessage(`Error acknowledging drill: ${error.message}`, 'error');
        }
    }

    // === Role Loading ===
    async loadUserRole() {
        if (!this.currentUser) return;
        try {
            const roleRef = doc(db, 'userRoles', this.currentUser.uid);
            const snap = await getDoc(roleRef);
            this.isAdmin = false;
            if (snap.exists()) {
                const data = snap.data();
                this.isAdmin = data.role === 'admin' || (Array.isArray(data.roles) && data.roles.includes('admin'));
            }
            this.userRoleLoaded = true;
            console.log('🔐 User role loaded. Admin =', this.isAdmin);
        } catch (e) {
            console.warn('Role load failed', e);
        }
    }

    // === Admin UI Toggles ===
    toggleAdminUpcomingControls(show, drill = null) {
        if (!this.userRoleLoaded || !this.isAdmin || !this.adminUpcomingActions) return;
        if (show && drill) {
            this.adminUpcomingActions.classList.remove('hidden');
            this.cancelDrillBtn.disabled = false;
            this.cancelDrillBtn.dataset.drillId = drill.id;
        } else {
            this.adminUpcomingActions.classList.add('hidden');
            if (this.cancelDrillBtn) this.cancelDrillBtn.removeAttribute('data-drill-id');
        }
    }
    toggleAdminActiveControls(show) {
        if (!this.userRoleLoaded || !this.isAdmin || !this.adminActiveActions) return;
        if (show && this.currentDrill) {
            this.adminActiveActions.classList.remove('hidden');
            this.stopActiveDrillBtn.disabled = false;
            this.stopActiveDrillBtn.dataset.drillId = this.currentDrill.id;
        } else {
            this.adminActiveActions.classList.add('hidden');
            if (this.stopActiveDrillBtn) this.stopActiveDrillBtn.removeAttribute('data-drill-id');
        }
    }

    // === Cancel Scheduled Drill (Admin) ===
    async cancelScheduledDrill() {
        if (!this.isAdmin) return this.showMessage('Admin rights required.', 'error');
        const drillId = this.cancelDrillBtn?.dataset.drillId;
        if (!drillId) return;
        try {
            const drillRef = doc(db, 'drills', drillId);
            await updateDoc(drillRef, { status: 'cancelled', cancelledAt: new Date(), cancelledBy: this.currentUser.uid });
            this.showMessage('Drill cancelled.', 'success');
            this.toggleAdminUpcomingControls(false);
        } catch (e) {
            console.error('❌ Failed to cancel drill', e);
            this.showMessage('Failed to cancel drill.', 'error');
        }
    }

    // === Stop Active Drill (Admin) ===
    async stopActiveDrill() {
        if (!this.isAdmin) return this.showMessage('Admin rights required.', 'error');
        if (!this.currentDrill) return;
        try {
            const drillRef = doc(db, 'drills', this.currentDrill.id);
            await updateDoc(drillRef, { status: 'ended', endedAt: new Date(), endedBy: this.currentUser.uid });
            this.showMessage('Active drill stopped.', 'success');
            this.hideDrillMode();
        } catch (e) {
            console.error('❌ Failed to stop drill', e);
            this.showMessage('Failed to stop active drill.', 'error');
        }
    }

    // === Update Leaderboard ===
    updateLeaderboard(students) {
        console.log("🏆 Updating leaderboard with", students.length, "students");
        
        this.fullLeaderboardList.innerHTML = '';
        
        students.forEach((student, index) => {
            const isCurrentUser = student.id === this.currentUser?.uid;
            const rank = index + 1;
            const medalEmoji = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`;
            
            const listItem = document.createElement('div');
            listItem.className = `leaderboard-item p-4 rounded-lg border border-gray-200 ${isCurrentUser ? 'current-user' : ''} ${rank <= 3 ? 'top-3' : ''}`;
            
            listItem.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <span class="text-xl font-bold">${medalEmoji}</span>
                        <div>
                            <p class="font-semibold ${isCurrentUser ? 'text-white' : 'text-gray-800'}">${student.name}</p>
                            <p class="text-sm ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}">Level ${Math.floor(student.points / 500) + 1}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-bold ${isCurrentUser ? 'text-white' : 'text-blue-600'}">${student.points.toLocaleString()} XP</p>
                        <p class="text-xs ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}">${student.completedQuizzes || 0} quizzes</p>
                    </div>
                </div>
            `;
            
            this.fullLeaderboardList.appendChild(listItem);
        });
    }

    // === Profile Slide Over Toggle ===
    toggleSlideOver(open) {
        if (!this.profileSlideOver) { console.warn('Slide-over element missing'); return; }
        const backdrop = document.getElementById('profileSlideBackdrop');
        if (open) {
            console.log('🔓 Opening profile slide-over');
            this.profileSlideOver.classList.add('open');
            this.profileSlideOver.style.transform = 'translateX(0)';
            if (backdrop) { backdrop.classList.remove('hidden'); backdrop.style.opacity='1'; }
        } else {
            console.log('🔒 Closing profile slide-over');
            this.profileSlideOver.classList.remove('open');
            this.profileSlideOver.style.transform = 'translateX(-100%)';
            if (backdrop) { backdrop.style.opacity='0'; setTimeout(()=>backdrop.classList.add('hidden'),200); }
        }
    }

    // === Avatar Upload Flow ===
    triggerAvatarSelect() {
        if (this.avatarFileInput) this.avatarFileInput.click();
    }
    async handleAvatarFile(e) {
        const file = e.target.files && e.target.files[0];
        if (!file || !this.currentUser) return;
        if (!file.type.startsWith('image/')) { this.showToast('Invalid file type', {type:'error'}); return; }
        const maxSize = 1024*1024*2; // 2MB
        if (file.size > maxSize) { this.showToast('Image too large (max 2MB)', {type:'error'}); return; }
        try {
            this.showToast('Uploading avatar...', {type:'info'});
            // Simple compression via canvas (optional)
            const optimizedBlob = await this._downscaleImage(file, 256);
            const storagePath = `avatars/${this.currentUser.uid}.jpg`;
            const refObj = storageRef(storage, storagePath);
            await uploadBytes(refObj, optimizedBlob, {contentType:'image/jpeg'});
            const url = await getDownloadURL(refObj);
            await updateDoc(doc(db,'students',this.currentUser.uid), { photoURL: url });
            // Immediate UI update
            if (this.profileAvatarImg) { this.profileAvatarImg.src = url; this.profileAvatarImg.classList.remove('hidden'); }
            if (this.slideAvatarImg) { this.slideAvatarImg.src = url; this.slideAvatarImg.classList.remove('hidden'); }
            this.showToast('Avatar updated', {type:'success', sound:'success'});
        } catch(err) {
            console.error('Avatar upload failed', err);
            this.showToast('Upload failed', {type:'error'});
        } finally {
            if (this.avatarFileInput) this.avatarFileInput.value='';
        }
    }
    _downscaleImage(file, size) {
        return new Promise((resolve)=>{
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const max = Math.max(img.width, img.height);
                const scale = size / max;
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img,0,0,canvas.width,canvas.height);
                canvas.toBlob(b=>resolve(b),'image/jpeg',0.85);
            };
            const reader = new FileReader();
            reader.onload = ev => { img.src = ev.target.result; };
            reader.readAsDataURL(file);
        });
    }

    // === Screen Navigation ===
    switchScreen(screenId) {
        console.log("🔄 Switching to screen:", screenId);
        
        // Hide all screens
        this.screens.forEach(screen => screen.classList.remove('active'));
        
        // Show selected screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
        
        // Update navigation
        this.navButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.screen === screenId) {
                btn.classList.add('active');
            }
        });
    }

    // === Logout Handler ===
    async handleLogout() {
        console.log("👋 Logging out user");
        
        try {
            await signOut(auth);
            this.showMessage("Logged out successfully", 'success');
            
        } catch (error) {
            console.error("❌ Logout error:", error);
            this.showMessage("Error logging out. Please try again.", 'error');
        }
    }

    // === Utility Functions ===
    
    validateInputs(email, password, name = null) {
        if (name !== null && !name) {
            this.showMessage("Please enter your full name", 'error');
            return false;
        }
        
        if (!email) {
            this.showMessage("Please enter your email address", 'error');
            return false;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showMessage("Please enter a valid email address", 'error');
            return false;
        }
        
        if (!password) {
            this.showMessage("Please enter your password", 'error');
            return false;
        }
        
        if (password.length < 6) {
            this.showMessage("Password must be at least 6 characters long", 'error');
            return false;
        }
        
        return true;
    }

    // === Profile Display Functions ===
    updateProfileDisplay(studentData) {
        if (!studentData) return;
        
        // Update profile screen elements if they exist
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        const profilePhone = document.getElementById('profile-phone');
        const profileLocation = document.getElementById('profile-location');
        const profileOrganization = document.getElementById('profile-organization');
        const profileLevel = document.getElementById('profile-level');
        const profilePoints = document.getElementById('profile-points');
        const profileCompletedQuizzes = document.getElementById('profile-completed-quizzes');
        const profileAverageScore = document.getElementById('profile-average-score');
        
        if (profileName) profileName.textContent = studentData.name || 'Not Set';
        if (profileEmail) profileEmail.textContent = studentData.email || 'Not Set';
        if (profilePhone) profilePhone.textContent = studentData.phone || 'Not Set';
        if (profileLocation) profileLocation.textContent = studentData.location || 'Not Set';
        if (profileOrganization) profileOrganization.textContent = studentData.organization || 'Not Set';
        if (profileLevel) profileLevel.textContent = studentData.level || 1;
        if (profilePoints) profilePoints.textContent = studentData.points || 0;
        if (profileCompletedQuizzes) profileCompletedQuizzes.textContent = studentData.completedQuizzes || 0;
        if (profileAverageScore) profileAverageScore.textContent = (studentData.averageScore || 0).toFixed(1) + '%';
        
        // Update streak statistics
        if (this.profileCurrentStreak) this.profileCurrentStreak.textContent = studentData.currentStreak || 0;
        if (this.profileLongestStreak) this.profileLongestStreak.textContent = studentData.longestStreak || 0;
        
        // Update edit form with current data
    // Align with HTML input IDs (editProfileName, editProfilePhone, etc.)
    const editName = document.getElementById('editProfileName');
    const editPhone = document.getElementById('editProfilePhone');
    const editLocation = document.getElementById('editProfileLocation');
    const editOrganization = document.getElementById('editProfileOrganization');
        
        if (editName) editName.value = studentData.name || '';
        if (editPhone) editPhone.value = studentData.phone || '';
        if (editLocation) editLocation.value = studentData.location || '';
        if (editOrganization) editOrganization.value = studentData.organization || '';
    }
    
    // === Profile Modal Methods ===
    showProfileEditModal() {
        console.log("📝 Opening profile edit modal");
        if (this.profileEditModal) {
            this.profileEditModal.classList.remove('hidden');
        }
    }
    
    hideProfileEditModal() {
        console.log("❌ Closing profile edit modal");
        if (this.profileEditModal) {
            this.profileEditModal.classList.add('hidden');
        }
    }
    
    handleProfileUpdate(e) {
        e.preventDefault();
        this.updateStudentProfile();
    }
    
    // === Profile Update Function ===
    async updateStudentProfile() {
        const user = auth.currentUser;
        if (!user) return;
        
    const editName = document.getElementById('editProfileName');
    const editPhone = document.getElementById('editProfilePhone');
    const editLocation = document.getElementById('editProfileLocation');
    const editOrganization = document.getElementById('editProfileOrganization');
        
        if (!editName || !editPhone || !editLocation || !editOrganization) {
            console.error("❌ Profile edit form elements not found");
            return;
        }
        
        const name = editName.value.trim();
        const phone = editPhone.value.trim();
        const location = editLocation.value.trim();
        const organization = editOrganization.value.trim();
        
        if (!name) {
            this.showMessage("Name is required!", 'error');
            return;
        }
        
        try {
            const studentRef = doc(db, 'students', user.uid);
            const updateData = {
                name: name,
                phone: phone,
                location: location,
                organization: organization
            };
            
            await updateDoc(studentRef, updateData);
            
            // Update auth profile display name
            await updateProfile(user, {
                displayName: name
            });
            
            // Close modal
            if (this.profileEditModal) this.profileEditModal.classList.add('hidden');
            this.showMessage("Profile updated successfully!", 'success');
            this.showToast('Profile saved', {type:'success', sound:'success'});
            this.playTone('success');
            console.log("✅ Profile updated successfully");
            
        } catch (error) {
            console.error("❌ Error updating profile:", error);
            this.showMessage("Error updating profile. Please try again.", 'error');
        }
    }

    // === Connection Status Management ===
    updateConnectionStatus() {
        const connectionDot = document.getElementById('connectionStatusDot');
        const connectionTimestamp = document.getElementById('connectionTimestamp');
        
        if (connectionDot && connectionTimestamp) {
            connectionDot.className = 'w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse';
            connectionTimestamp.textContent = new Date().toLocaleTimeString();
            console.log("✅ Connection status updated:", new Date().toLocaleTimeString());
        }
    }
    
    // === Test Firebase Connection ===
    async testFirebaseConnection() {
        console.log("🧪 Testing Firebase connection...");
        
        try {
            // 1. Test authentication status
            console.log("🔐 Auth status:", this.currentUser ? "Authenticated" : "Not authenticated");
            console.log("👤 Current user:", this.currentUser?.email || "None");
            
            // Ensure authentication (anonymously if needed)
            if (!auth.currentUser) {
                console.log("🔑 No user found, signing in anonymously...");
                await signInAnonymously(auth);
                console.log("✅ Anonymous authentication successful");
            }
            
            // 2. Test basic Firestore connection
            console.log("🔥 Testing basic Firestore connection...");
            const testCollection = collection(db, 'drills');
            console.log("✅ Firestore collection reference created");
            
            // 3. Test read permissions
            console.log("📖 Testing read permissions...");
            const snapshot = await getDocs(query(testCollection, limit(1)));
            console.log(`✅ Read test successful - ${snapshot.size} documents found`);
            
            // 4. Test real-time listener
            console.log("👂 Testing real-time listener...");
            const unsubscribe = onSnapshot(testCollection, 
                (snapshot) => {
                    console.log(`✅ Real-time listener working - ${snapshot.size} documents`);
                    unsubscribe();
                },
                (error) => {
                    console.error("❌ Real-time listener error:", error);
                }
            );
            
            // 5. Show success message
            this.showMessage("Firebase connection test successful! Check console for details.", 'success');
            
            return true;
            
        } catch (error) {
            console.error("❌ Firebase connection test failed:", error);
            console.error("Error code:", error.code);
            console.error("Error message:", error.message);
            
            // Show user-friendly error
            let userMessage = "Connection test failed: ";
            if (error.code === 'permission-denied') {
                userMessage += "Permission denied. Check Firestore security rules.";
            } else if (error.code === 'unavailable') {
                userMessage += "Service unavailable. Check internet connection.";
            } else {
                userMessage += error.message;
            }
            
            this.showMessage(userMessage, 'error');
            return false;
        }
    }

    handleAuthError(error) {
        let message = 'Authentication failed';
        
        switch (error.code) {
            case 'auth/user-not-found':
                message = 'No account found with this email address';
                break;
            case 'auth/wrong-password':
                message = 'Incorrect password';
                break;
            case 'auth/email-already-in-use':
                message = 'An account already exists with this email address';
                break;
            case 'auth/weak-password':
                message = 'Password is too weak. Please choose a stronger password';
                break;
            case 'auth/invalid-email':
                message = 'Invalid email address format';
                break;
            case 'auth/too-many-requests':
                message = 'Too many failed attempts. Please try again later';
                break;
            default:
                message = 'Authentication error. Please try again';
        }
        
        this.showMessage(message, 'error');
        console.error('Authentication error:', error.code, error.message);
    }

    showMessage(message, type) {
        this.authMessage.textContent = message;
        this.authMessage.className = `mt-4 text-center text-sm message ${type} show`;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.clearMessage();
        }, 5000);
    }

    clearMessage() {
        this.authMessage.textContent = '';
        this.authMessage.className = 'mt-4 text-center text-sm';
    }

    setButtonLoading(button, isLoading, loadingText) {
        if (isLoading) {
            button.disabled = true;
            button.textContent = loadingText;
            button.classList.add('loading');
        } else {
            button.disabled = false;
            button.classList.remove('loading');
        }
    }

    showAuthScreen() {
        console.log("🔐 Showing authentication screen");
        this.authScreen.classList.remove('hidden');
        this.appContainer.classList.add('hidden');
    }

    showApp() {
        console.log("📱 Showing main app interface");
        this.authScreen.classList.add('hidden');
        this.appContainer.classList.remove('hidden');
    }

    // === Record Evacuation Check-In (Unified) ===
    async recordEvacuationCheckIn({ safeZoneId = null, safeZoneName = 'Safe Zone', drillType = 'Drill', status = 'safe', coordinates = null }) {
        if (!this.currentUser) {
            this.showMessage('Authentication required before recording evacuation check-in.', 'error');
            return { ok: false, error: 'not_authenticated' };
        }
        if (!safeZoneName || typeof safeZoneName !== 'string') {
            return { ok: false, error: 'invalid_safe_zone' };
        }
        try {
            const payload = {
                studentId: this.currentUser.uid,
                studentName: this.studentData?.name || this.currentUser.email || 'Anonymous',
                safeZoneId: safeZoneId || null,
                safeZoneName: safeZoneName.trim(),
                drillType,
                status,
                coordinates: coordinates ? {
                    lat: Number(coordinates.lat) || null,
                    lng: Number(coordinates.lng) || null
                } : null,
                timestamp: new Date()
            };
            const ref = await addDoc(collection(db, 'evacuation_records'), payload);
            console.log('✅ Evacuation check-in persisted:', ref.id, payload);
            this.showMessage(`Evacuation check-in recorded at ${payload.safeZoneName}`, 'success');
            return { ok: true, id: ref.id };
        } catch (e) {
            console.error('❌ Failed to record evacuation check-in', e);
            this.showMessage('Failed to record evacuation check-in. Please retry.', 'error');
            return { ok: false, error: e.message };
        }
    }
}

// === Initialize Student App ===
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log("🚀 Initializing Student App...");
        window.studentApp = new StudentApp();
        console.log("✅ Student App initialized successfully");
        
    } catch (error) {
        console.error("❌ Error initializing Student App:", error);
        
        // Show fallback error UI
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed inset-0 bg-red-50 flex items-center justify-center p-4';
        errorDiv.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-lg text-center max-w-md">
                <h2 class="text-xl font-bold text-red-600 mb-2">App Initialization Failed</h2>
                <p class="text-gray-600 mb-4">There was an error loading the Student App. Please refresh the page to try again.</p>
                <button onclick="window.location.reload()" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    Refresh Page
                </button>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }
});

console.log("📚 Pralayveer Student App - Complete Implementation Loaded");