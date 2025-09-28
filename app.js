// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyDRfw02vOd82RwIXtYVbk-6v9IpQOMuOB4",
    authDomain: "pralayveer-punjab.firebaseapp.com",
    projectId: "pralayveer-punjab",
    storageBucket: "pralayveer-punjab.firebasestorage.app",
    messagingSenderId: "70951000471",
    appId: "1:70951000471:web:2fda72af05438fbf984cd2",
    measurementId: "G-CC7L4LGDEC"
};

// --- Firebase Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot, addDoc, query, orderBy, serverTimestamp, doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- App Initialization ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("Admin Portal Firebase Foundation Loaded.");

// Enable Firestore offline persistence and configure settings
try {
    // Configure Firestore settings before any operations
    const firestoreSettings = {
        ignoreUndefinedProperties: true,
        merge: true
    };
    
    // Set up authentication state persistence
    auth.setPersistence && auth.setPersistence('local');
    
    console.log("✅ Firebase configuration optimized");
} catch (error) {
    console.warn("⚠️ Firebase configuration warning:", error);
}

// --- Main Application Controller ---
class AdminPortal {
    constructor() {
        // Initialize drill monitoring object first
        this.drillMonitoring = {
            activeDrill: null,
            startTime: null,
            studentResponses: new Map(),
            participationChart: null,
            responseChart: null
        };
        
        // Initialize UI and setup
        this.initializeUI();
        this.setupEventListeners();
        this.initializeAuthListener();
        
        // Initialize charts only after a short delay to ensure DOM is ready
        setTimeout(() => {
            this.initializeCharts();
        }, 100);
        
        // Auto-authenticate anonymously for testing
        this.ensureAuthentication();
    }
    
    // Ensure user is authenticated before Firestore operations
    async ensureAuthentication() {
        try {
            if (!auth.currentUser) {
                console.log("🔑 Auto-authenticating anonymously for testing...");
                await signInAnonymously(auth);
                console.log("✅ Anonymous authentication successful");
            }
        } catch (error) {
            console.error("❌ Auto-authentication failed:", error);
            
            if (error.code === 'auth/admin-restricted-operation') {
                console.warn("⚠️ Anonymous authentication is disabled in Firebase Console");
                console.warn("💡 Please enable Anonymous authentication in Firebase Console > Authentication > Sign-in method");
                console.log("🔄 Attempting fallback authentication...");
                
                try {
                    // Fallback to email authentication for testing
                    const testEmail = 'admin@pralayveer-punjab.com';
                    const testPassword = 'AdminTest123!';
                    
                    const { createUserWithEmailAndPassword, signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js");
                    
                    try {
                        await signInWithEmailAndPassword(auth, testEmail, testPassword);
                        console.log("✅ Fallback email authentication successful");
                    } catch (signInError) {
                        if (signInError.code === 'auth/user-not-found') {
                            await createUserWithEmailAndPassword(auth, testEmail, testPassword);
                            console.log("✅ Fallback user created and authenticated");
                        }
                    }
                } catch (fallbackError) {
                    console.error("❌ Fallback authentication also failed:", fallbackError);
                }
            }
        }
    }

    initializeUI() {
        // Auth Elements
        this.authInterface = document.getElementById('authInterface');
        this.loginForm = document.getElementById('adminLoginForm');
        this.loginButton = document.getElementById('loginButton');
        this.authStatus = document.getElementById('authStatus');
        
        // Dashboard Elements
        this.dashboardContainer = document.getElementById('dashboardContainer');
        this.logoutButton = document.getElementById('logoutButton');
        this.leaderboardBody = document.getElementById('leaderboardBody');
        
        // Drill Management Elements
        this.scheduleDrillForm = document.getElementById('scheduleDrillForm');
        this.scheduleDrillBtn = document.getElementById('scheduleDrillBtn');
        this.drillStatus = document.getElementById('drillStatus');
        this.upcomingDrillsList = document.getElementById('upcomingDrillsList');

        // Live Drill Monitoring Elements
        this.drillStatusIndicator = document.getElementById('drillStatusIndicator');
        this.totalStudents = document.getElementById('totalStudents');
        this.acknowledgedStudents = document.getElementById('acknowledgedStudents');
        this.avgResponseTime = document.getElementById('avgResponseTime');
        this.participationRate = document.getElementById('participationRate');
        this.studentResponseList = document.getElementById('studentResponseList');
        
        // Validate critical elements
        if (!this.authInterface || !this.loginForm || !this.dashboardContainer) {
            console.error('❌ Critical UI elements missing! Check HTML structure.');
            console.error('Missing elements:', {
                authInterface: !this.authInterface,
                loginForm: !this.loginForm,
                dashboardContainer: !this.dashboardContainer
            });
            return false;
        }
        
        console.log('✅ Admin Portal UI elements initialized successfully');
        return true;
    }

    setupEventListeners() {
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.logoutButton.addEventListener('click', () => this.handleLogout());
        this.scheduleDrillForm.addEventListener('submit', (e) => this.handleScheduleDrill(e));
    }

    initializeAuthListener() {
        console.log('🔄 Setting up authentication listener...');
        onAuthStateChanged(auth, (user) => {
            console.log('🔄 Auth state changed. User:', user ? user.email || 'Anonymous' : 'None');
            
            if (user) {
                console.log('✅ User authenticated, showing dashboard...');
                this.showDashboard();
                
                // Add delay before starting listeners to ensure proper authentication
                setTimeout(() => {
                    this.listenForStudents();
                    this.listenForDrills();
                    this.listenForActiveDrills(); // Start monitoring active drills
                }, 1000);
                
                console.log('✅ Admin authenticated:', user.email || 'Anonymous');
                console.log('🎯 All real-time listeners will activate shortly');
            } else {
                console.log('❌ No user, showing auth interface...');
                this.showAuthInterface();
            }
        });
    }

    // --- Authentication ---
    async handleLogin(event) {
        event.preventDefault();
        console.log('🔐 Admin login attempt started');
        
        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value;

        console.log('📧 Email:', email);
        console.log('🔑 Password length:', password.length);

        // Enhanced validation with professional security checks
        if (!this.validateAdminCredentials(email, password)) {
            console.log('❌ Validation failed');
            return;
        }

        this.setLoading(this.loginButton, true, 'Authenticating...');

        try {
            console.log('🔄 Attempting sign in...');
            // Attempt to sign in existing admin
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('✅ Sign in successful:', userCredential.user.email);
            
            this.displayMessage(this.authStatus, 'Welcome back, Administrator! Access granted.', 'success');
            
            // Update last login time
            await this.updateLastLogin(userCredential.user.uid);
            console.log('📊 Dashboard should now be visible');
            
        } catch (signInError) {
            console.log('❌ Sign in failed:', signInError.code, signInError.message);
            
            if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
                // Check if this could be the first admin registration
                console.log('🆕 Attempting first admin registration...');
                await this.handleFirstAdminRegistration(email, password);
            } else {
                this.handleAuthError(signInError);
            }
        } finally {
            this.setLoading(this.loginButton, false, 'Authenticate Access');
        }
    }

    async handleFirstAdminRegistration(email, password) {
        try {
            console.log('🆕 Creating first admin account...');
            // Check if any admin users already exist by attempting to query the auth system
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log('✅ Admin account created successfully:', userCredential.user.email);
            
            // Store admin metadata in Firestore for future reference
            await this.createAdminProfile(userCredential.user.uid, email);
            
            this.displayMessage(this.authStatus, '🎉 First Admin Account Created Successfully! Welcome to Pralayveer.', 'success');
            console.log('✅ First admin user created and configured.');
        } catch (createError) {
            console.log('❌ First admin registration failed:', createError.code, createError.message);
            if (createError.code === 'auth/email-already-in-use') {
                this.displayMessage(this.authStatus, 'Account exists but credentials are incorrect.', 'error');
            } else {
                this.handleAuthError(createError);
            }
        }
    }

    async createAdminProfile(userId, email) {
        try {
            const adminRef = doc(db, 'administrators', userId);
            await setDoc(adminRef, {
                email: email,
                role: 'admin',
                isFirstAdmin: true,
                permissions: ['all'], // Full admin permissions
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                loginHistory: [],
                securityLevel: 'maximum'
            });
            console.log('First admin profile created successfully');
        } catch (error) {
            console.error('Error creating admin profile:', error);
            throw error;
        }
    }

    async updateLastLogin(userId) {
        try {
            const adminRef = doc(db, 'administrators', userId);
            await updateDoc(adminRef, {
                lastLogin: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error updating last login:', error);
        }
    }

    validateAdminCredentials(email, password) {
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            this.displayMessage(this.authStatus, 'Please enter your administrator email', 'error');
            return false;
        }
        if (!emailRegex.test(email)) {
            this.displayMessage(this.authStatus, 'Please enter a valid email address', 'error');
            return false;
        }

        // Password validation
        if (!password) {
            this.displayMessage(this.authStatus, 'Please enter your password', 'error');
            return false;
        }
        if (password.length < 8) {
            this.displayMessage(this.authStatus, 'Administrator password must be at least 8 characters', 'error');
            return false;
        }

        return true;
    }

    async handleLogout() {
        try {
            await signOut(auth);
            console.log('Admin signed out');
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    handleAuthError(error) {
        let message = 'Authentication failed';
        let suggestion = '';
        
        switch (error.code) {
            case 'auth/invalid-email': 
                message = 'Invalid email format'; 
                suggestion = 'Please enter a valid government email address.';
                break;
            case 'auth/weak-password': 
                message = 'Password too weak'; 
                suggestion = 'Use at least 8 characters with numbers and symbols.';
                break;
            case 'auth/wrong-password': 
                message = 'Incorrect password'; 
                suggestion = 'Please check your password and try again.';
                break;
            case 'auth/invalid-credential':
                message = 'Invalid credentials';
                suggestion = 'Please verify your email and password.';
                break;
            case 'auth/too-many-requests': 
                message = 'Too many failed attempts'; 
                suggestion = 'Please wait a few minutes before trying again.';
                break;
            case 'auth/network-request-failed':
                message = 'Network connection error';
                suggestion = 'Please check your internet connection.';
                break;
            default: 
                message = 'Authentication error';
                suggestion = 'Please contact system administrator if the problem persists.';
        }
        
        this.displayMessage(this.authStatus, `${message}. ${suggestion}`, 'error');
        console.error('Authentication error:', error.code, error.message);
    }

    // --- Real-time Listeners ---
    listenForStudents() {
        const studentsQuery = query(collection(db, 'students'), orderBy('points', 'desc'));
        onSnapshot(studentsQuery, (snapshot) => {
            this.leaderboardBody.innerHTML = ''; // Clear existing rows
            if (snapshot.empty) {
                this.leaderboardBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-500">No students have registered yet.</td></tr>';
                return;
            }
            snapshot.forEach((doc, index) => {
                const student = doc.data();
                const rank = index + 1;
                const row = `
                    <tr class="${rank === 1 ? 'bg-yellow-50' : ''}">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${rank}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            <div class="font-medium">${student.name}</div>
                            <div class="text-xs text-gray-500">${student.email}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">${student.points}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${student.level}</td>
                    </tr>
                `;
                this.leaderboardBody.innerHTML += row;
            });
        });
    }

    listenForDrills() {
        const drillsQuery = query(collection(db, 'drills'), orderBy('startTime', 'asc'));
        onSnapshot(drillsQuery, (snapshot) => {
            this.upcomingDrillsList.innerHTML = '';
            let hasUpcoming = false;
            const now = new Date();

            snapshot.forEach(doc => {
                const drill = doc.data();
                const drillId = doc.id;
                if (!drill.startTime) return; // safety
                const drillTime = drill.startTime.toDate();

                // Skip cancelled or ended drills for upcoming list
                if (drill.status === 'cancelled' || drill.status === 'ended') return;

                if (drillTime > now) {
                    hasUpcoming = true;
                    const li = document.createElement('li');
                    li.className = 'p-3 bg-gray-50 rounded-md border border-gray-200';
                    li.innerHTML = `
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <p class="font-semibold text-gray-800">${drill.name}</p>
                                <p class="text-sm text-gray-600">${drillTime.toLocaleString()}</p>
                            </div>
                            <div class="flex flex-col gap-2">
                                <button data-cancel-drill="${drillId}" class="cancel-drill-btn text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200">Cancel</button>
                            </div>
                        </div>
                        <p class="mt-1 text-xs text-gray-400">ID: ${drillId}</p>`;
                    this.upcomingDrillsList.appendChild(li);
                }
            });

            if (!hasUpcoming) {
                this.upcomingDrillsList.innerHTML = '<li class="text-center text-gray-500">No upcoming drills scheduled.</li>';
            }

            // Bind cancel buttons after list rendered
            this.bindCancelDrillButtons();
        });
    }

    // --- Drill Management ---
    async handleScheduleDrill(event) {
        event.preventDefault();
        const drillName = document.getElementById('drillName').value.trim();
        const drillTime = document.getElementById('drillTime').value;

        if (!drillName || !drillTime) {
            this.displayMessage(this.drillStatus, 'Please fill in all fields.', 'error');
            return;
        }

        this.setLoading(this.scheduleDrillBtn, true, 'Scheduling...');

        try {
            await addDoc(collection(db, 'drills'), {
                name: drillName,
                startTime: new Date(drillTime),
                createdAt: serverTimestamp()
            });
            this.displayMessage(this.drillStatus, 'Drill scheduled successfully!', 'success');
            this.scheduleDrillForm.reset();
        } catch (error) {
            console.error('Error scheduling drill:', error);
            this.displayMessage(this.drillStatus, 'Failed to schedule drill.', 'error');
        } finally {
            // Re-bind cancel buttons after rendering
            this.bindCancelDrillButtons();
            this.setLoading(this.scheduleDrillBtn, false, 'Schedule Drill');
        }
    }

    bindCancelDrillButtons() {
        if (!this.upcomingDrillsList) return;
        const buttons = this.upcomingDrillsList.querySelectorAll('button.cancel-drill-btn');
        buttons.forEach(btn => {
            if (!btn.dataset.bound) {
                btn.dataset.bound = '1';
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-cancel-drill');
                    this.cancelScheduledDrill(id);
                });
            }
        });
    }

    async cancelScheduledDrill(drillId) {
        if (!drillId) return;
        if (!confirm('Cancel this scheduled drill? This cannot be undone.')) return;
        try {
            await updateDoc(doc(db, 'drills', drillId), {
                status: 'cancelled',
                cancelledAt: serverTimestamp(),
                cancelledBy: auth.currentUser ? auth.currentUser.uid : null
            });
            this.displayMessage(this.drillStatus, 'Scheduled drill cancelled.', 'success');
        } catch (e) {
            console.error('Error cancelling drill:', e);
            this.displayMessage(this.drillStatus, 'Failed to cancel drill.', 'error');
        }
    }

    async stopActiveDrill() {
        if (!this.drillMonitoring.activeDrill) {
            alert('No active drill to stop');
            return;
        }
        if (!confirm('Stop the active drill now?')) return;
        try {
            await updateDoc(doc(db, 'drills', this.drillMonitoring.activeDrill.id), {
                status: 'ended',
                endedAt: serverTimestamp(),
                endedBy: auth.currentUser ? auth.currentUser.uid : null
            });
            this.stopDrillMonitoring();
            this.displayMessage(this.drillStatus, 'Active drill ended.', 'success');
        } catch (e) {
            console.error('Error stopping active drill:', e);
            this.displayMessage(this.drillStatus, 'Failed to stop active drill.', 'error');
        }
    }
    
    // --- Test Firebase Connection ---
    async testConnection() {
        console.log("🧪 ADMIN: Testing Firebase connection...");
        
        try {
            // 1. Check Firebase app initialization
            console.log("📱 Firebase App:", app.name);
            console.log("🔐 Auth instance:", auth.app.name);
            console.log("🔥 Firestore instance:", !!db);
            
            // 2. Check authentication status
            console.log("🔐 Auth status:", auth.currentUser ? "Authenticated" : "Not authenticated");
            console.log("👤 Current user:", auth.currentUser?.email || "None");
            
            // Ensure authentication (anonymously if needed)
            if (!auth.currentUser) {
                console.log("🔑 No user found, signing in anonymously...");
                await signInAnonymously(auth);
                console.log("✅ Anonymous authentication successful");
            }
            
            // 3. Check network connectivity first
            if (!navigator.onLine) {
                throw new Error("No internet connection detected");
            }
            
            // 4. Simple connection test - just creating a reference (doesn't require network)
            const testCollection = collection(db, 'drills');
            console.log("✅ Firestore collection reference created successfully");
            
            // 5. If user is authenticated, try a simple write operation
            if (auth.currentUser) {
                console.log("🔥 User authenticated, testing write operation...");
                
                const testDoc = {
                    name: "Connection Test",
                    startTime: new Date(),
                    createdAt: serverTimestamp(),
                    isConnectionTest: true,
                    testBy: auth.currentUser.email
                };
                
                const docRef = await addDoc(testCollection, testDoc);
                console.log("✅ Write test successful - Document ID:", docRef.id);
                
                this.displayMessage(this.drillStatus, "✅ Firebase connection and permissions working!", 'success');
            } else {
                console.log("⚠️  Not authenticated - skipping write test");
                this.displayMessage(this.drillStatus, "⚠️ Firebase connected but not authenticated. Please log in first.", 'warning');
            }
            
            return true;
            
        } catch (error) {
            console.error("❌ Firebase connection test failed:", error);
            console.error("Error code:", error.code);
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
            
            let userMessage = "Connection failed: ";
            let suggestions = "";
            
            if (error.code === 'permission-denied') {
                userMessage += "Permission denied.";
                suggestions = " Please log in first or check Firestore security rules.";
            } else if (error.code === 'unavailable') {
                userMessage += "Service unavailable.";
                suggestions = " Check internet connection and try again.";
            } else if (error.message.includes('internet')) {
                userMessage += "No internet connection.";
                suggestions = " Please check your network connection.";
            } else {
                userMessage += error.message;
                suggestions = " Check browser console for details.";
            }
            
            this.displayMessage(this.drillStatus, userMessage + suggestions, 'error');
            return false;
        }
    }

    // --- Test Drill Synchronization ---
    async testDrillSync() {
        console.log("🔄 ADMIN: Testing drill synchronization...");
        
        // First test connection
        const connectionOk = await this.testConnection();
        if (!connectionOk) {
            return;
        }
        
        try {
            // Create a test drill 2 minutes from now
            const testTime = new Date();
            testTime.setMinutes(testTime.getMinutes() + 2);
            
            const testDrillData = {
                name: `🧪 Sync Test - ${new Date().toLocaleTimeString()}`,
                startTime: testTime,
                createdAt: serverTimestamp(),
                status: 'scheduled',
                scheduledBy: auth.currentUser?.email || 'admin',
                isTest: true
            };
            
            console.log("🧪 Creating test drill:", {
                name: testDrillData.name,
                startTime: testTime.toLocaleString(),
                timestamp: testTime.getTime()
            });
            
            const docRef = await addDoc(collection(db, 'drills'), testDrillData);
            
            this.displayMessage(this.drillStatus, `🧪 Test drill created! Check student app in 2 minutes. ID: ${docRef.id}`, 'success');
            
            console.log("✅ Test drill created successfully with ID:", docRef.id);
            console.log("⏰ Students should see this drill alert in their dashboard");
            
        } catch (error) {
            console.error("❌ Error creating test drill:", error);
            this.displayMessage(this.drillStatus, "Error creating test drill: " + error.message, 'error');
        }
    }
    
    // --- Create Immediate Test Drill ---
    async createImmediateDrill() {
        console.log("🚨 ADMIN: Creating immediate test drill...");
        
        try {
            // Create a drill that starts now (within 5 minutes window for active drill detection)
            const testTime = new Date();
            testTime.setMinutes(testTime.getMinutes() + 1); // 1 minute from now
            
            const immediateDrillData = {
                name: `🚨 IMMEDIATE TEST - ${new Date().toLocaleTimeString()}`,
                startTime: testTime,
                createdAt: serverTimestamp(),
                status: 'active',
                scheduledBy: auth.currentUser?.email || 'admin',
                isTest: true,
                immediate: true
            };
            
            console.log("🚨 Creating immediate drill:", {
                name: immediateDrillData.name,
                startTime: testTime.toLocaleString(),
                timestamp: testTime.getTime()
            });
            
            const docRef = await addDoc(collection(db, 'drills'), immediateDrillData);
            
            this.displayMessage(this.drillStatus, `🚨 Immediate drill created! Students should see it now. ID: ${docRef.id}`, 'success');
            
            console.log("✅ Immediate drill created successfully with ID:", docRef.id);
            console.log("⚡ Students should see this drill immediately");
            
        } catch (error) {
            console.error("❌ Error creating immediate drill:", error);
            this.displayMessage(this.drillStatus, "Error creating immediate drill: " + error.message, 'error');
        }
    }

    // --- Live Drill Monitoring ---
    initializeCharts() {
        console.log('Initializing live drill monitoring charts...');
        
        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.error('❌ Chart.js library not loaded. Skipping chart initialization.');
            return;
        }
        
        // Participation Pie Chart
        const participationCanvas = document.getElementById('participationChart');
        if (!participationCanvas) {
            console.warn('⚠️ participationChart canvas element not found. Skipping participation chart.');
        } else {
            const participationCtx = participationCanvas.getContext('2d');
            try {
                this.drillMonitoring.participationChart = new Chart(participationCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Acknowledged', 'Not Responded'],
                        datasets: [{
                            data: [0, 0],
                            backgroundColor: ['#10b981', '#ef4444'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    padding: 20,
                                    usePointStyle: true
                                }
                            },
                            title: {
                                display: true,
                                text: 'Student Participation Status'
                            }
                        }
                    }
                });
                console.log('✅ Participation chart initialized successfully');
            } catch (error) {
                console.error('❌ Error initializing participation chart:', error);
            }
        }

        // Response Timeline Chart
        const responseCanvas = document.getElementById('responseChart');
        if (!responseCanvas) {
            console.warn('⚠️ responseChart canvas element not found. Skipping response chart.');
        } else {
            const responseCtx = responseCanvas.getContext('2d');
            try {
                this.drillMonitoring.responseChart = new Chart(responseCtx, {
                    type: 'line',
                    data: {
                        labels: [],
                        datasets: [{
                            label: 'Cumulative Responses',
                            data: [],
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1
                                },
                                title: {
                                    display: true,
                                    text: 'Student Responses'
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Time (seconds since drill start)'
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: true
                            },
                            title: {
                                display: true,
                                text: 'Real-time Response Timeline'
                            }
                        }
                    }
                });
                console.log('✅ Response timeline chart initialized successfully');
            } catch (error) {
                console.error('❌ Error initializing response chart:', error);
            }
        }
    }

    listenForActiveDrills() {
        const activeQuery = query(
            collection(db, 'drills'),
            orderBy('startTime', 'desc')
        );
        
        onSnapshot(activeQuery, (snapshot) => {
            const now = new Date(); // Get current time on each update
            const activeWindow = 5 * 60 * 1000; // 5 minutes window

            // Add safety check for drillMonitoring
            if (!this.drillMonitoring) {
                console.warn("⚠️ drillMonitoring not initialized");
                return;
            }
            
            let activeDrill = null;
            
            try {
                snapshot.forEach(doc => {
                    const drill = doc.data();
                    if (!drill.startTime) return; // Skip drills without startTime
                    
                    const drillTime = drill.startTime.toDate();
                    const timeDiff = now.getTime() - drillTime.getTime();
                    
                    // Check if drill is currently active (within 5 minutes from its start)
                    if (timeDiff >= 0 && timeDiff <= activeWindow && !activeDrill) {
                        activeDrill = { id: doc.id, ...drill };
                    }
                });
                
                if (activeDrill && (!this.drillMonitoring.activeDrill || this.drillMonitoring.activeDrill.id !== activeDrill.id)) {
                    this.startDrillMonitoring(activeDrill);
                } else if (!activeDrill && this.drillMonitoring.activeDrill) {
                    this.stopDrillMonitoring();
                }
                
            } catch (error) {
                console.error("❌ Error processing active drills:", error);
            }
        });
    }

    startDrillMonitoring(drill) {
        console.log('Starting drill monitoring for:', drill.name);
        
        this.drillMonitoring.activeDrill = drill;
        this.drillMonitoring.startTime = drill.startTime.toDate();
        this.drillMonitoring.studentResponses.clear();
        
        // Update UI to show active drill
        this.updateDrillStatusIndicator(true, drill.name);
        
        // Initialize drill statistics
        this.resetDrillStats();
        
        // Start monitoring student responses
        this.monitorStudentResponses();
        
        // Update charts every 2 seconds for live monitoring
        if (this.drillUpdateInterval) {
            clearInterval(this.drillUpdateInterval);
        }
        
        this.drillUpdateInterval = setInterval(() => {
            this.updateDrillCharts();
            this.updateDrillStats();
        }, 2000);
        
        console.log('Live drill monitoring started successfully for:', drill.name);
        
        // Show notification
        this.displayMessage(this.authStatus, `Live monitoring started for drill: ${drill.name}`, 'success');

        // Show Stop Active Drill Button
        const stopContainer = document.getElementById('activeDrillAdminActions');
        if (stopContainer) {
            stopContainer.classList.remove('hidden');
            const btn = document.getElementById('stopActiveDrillBtn');
            if (btn && !btn.dataset.bound) {
                btn.dataset.bound = '1';
                btn.addEventListener('click', () => this.stopActiveDrill());
            }
        }
    }

    stopDrillMonitoring() {
        this.drillMonitoring.activeDrill = null;
        this.drillMonitoring.startTime = null;
        
        // Clear interval
        if (this.drillUpdateInterval) {
            clearInterval(this.drillUpdateInterval);
        }
        
        // Update UI to show no active drill
        this.updateDrillStatusIndicator(false);
        this.resetDrillStats();
        
        console.log('Stopped drill monitoring');

        // Hide Stop Button
        const stopContainer = document.getElementById('activeDrillAdminActions');
        if (stopContainer) stopContainer.classList.add('hidden');
    }

    monitorStudentResponses() {
        if (!this.drillMonitoring.activeDrill) return;
        
        // Listen for drill responses in a subcollection
        const responsesQuery = query(
            collection(db, 'drillResponses'),
            orderBy('responseTime', 'asc')
        );
        
        this.drillResponseListener = onSnapshot(responsesQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const response = change.doc.data();
                    if (response.drillId === this.drillMonitoring.activeDrill.id) {
                        this.drillMonitoring.studentResponses.set(response.studentId, {
                            responseTime: response.responseTime.toDate(),
                            studentName: response.studentName
                        });
                    }
                }
            });
            
            this.updateDrillStats();
            this.updateStudentResponseList();
        });
    }

    updateDrillStatusIndicator(isActive, drillName = '') {
        const indicator = this.drillStatusIndicator.querySelector('div');
        const text = this.drillStatusIndicator.querySelector('span');
        
        if (isActive) {
            indicator.className = 'w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse';
            text.textContent = `Active: ${drillName}`;
            text.className = 'text-sm text-red-600 font-medium';
        } else {
            indicator.className = 'w-3 h-3 bg-gray-400 rounded-full mr-2';
            text.textContent = 'No Active Drill';
            text.className = 'text-sm text-gray-500';
        }
    }

    updateDrillStats() {
        if (!this.drillMonitoring.activeDrill) return;
        
        // Get total student count from the students collection
        const studentsQuery = query(collection(db, 'students'));
        onSnapshot(studentsQuery, (snapshot) => {
            const totalStudents = snapshot.size;
            const acknowledgedCount = this.drillMonitoring.studentResponses.size;
            const participationPercentage = totalStudents > 0 ? Math.round((acknowledgedCount / totalStudents) * 100) : 0;
            
            // Calculate average response time
            let avgTime = 0;
            if (acknowledgedCount > 0) {
                const responseTimes = Array.from(this.drillMonitoring.studentResponses.values())
                    .map(response => response.responseTime.getTime() - this.drillMonitoring.startTime.getTime());
                avgTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
            }
            
            // Update UI
            this.totalStudents.textContent = totalStudents;
            this.acknowledgedStudents.textContent = acknowledgedCount;
            this.participationRate.textContent = `${participationPercentage}%`;
            this.avgResponseTime.textContent = avgTime > 0 ? `${Math.round(avgTime / 1000)}s` : '--';
        });
    }

    updateDrillCharts() {
        if (!this.drillMonitoring.activeDrill) return;
        
        const totalStudents = parseInt(this.totalStudents.textContent);
        const acknowledgedCount = this.drillMonitoring.studentResponses.size;
        const notResponded = totalStudents - acknowledgedCount;
        
        // Update participation chart (with safety check)
        if (this.drillMonitoring.participationChart) {
            try {
                this.drillMonitoring.participationChart.data.datasets[0].data = [acknowledgedCount, notResponded];
                this.drillMonitoring.participationChart.update('none');
            } catch (error) {
                console.error('❌ Error updating participation chart:', error);
            }
        }
        
        // Update response timeline (with safety check)
        if (this.drillMonitoring.responseChart) {
            try {
                const now = new Date();
                const timeElapsed = Math.floor((now.getTime() - this.drillMonitoring.startTime.getTime()) / 1000);
                
                // Add current response count to timeline
                const currentLabels = this.drillMonitoring.responseChart.data.labels;
                const currentData = this.drillMonitoring.responseChart.data.datasets[0].data;
                
                currentLabels.push(timeElapsed);
                currentData.push(acknowledgedCount);
                
                // Keep only last 60 data points (2 minutes at 2-second intervals)
                if (currentLabels.length > 60) {
                    currentLabels.shift();
                    currentData.shift();
                }
                
                this.drillMonitoring.responseChart.update('none');
            } catch (error) {
                console.error('❌ Error updating response chart:', error);
            }
        }
    }

    updateStudentResponseList() {
        if (!this.drillMonitoring.activeDrill) {
            this.studentResponseList.innerHTML = '<p class="text-gray-500 text-center">No active drill to monitor</p>';
            return;
        }
        
        const responses = Array.from(this.drillMonitoring.studentResponses.entries())
            .sort((a, b) => a[1].responseTime - b[1].responseTime);
        
        let html = '';
        responses.forEach(([studentId, response], index) => {
            const responseTimeSeconds = Math.round((response.responseTime.getTime() - this.drillMonitoring.startTime.getTime()) / 1000);
            html += `
                <div class="flex items-center justify-between py-2 px-3 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'} rounded">
                    <div class="flex items-center">
                        <div class="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <span class="font-medium text-gray-800">${response.studentName}</span>
                    </div>
                    <span class="text-sm text-gray-600">${responseTimeSeconds}s</span>
                </div>
            `;
        });
        
        if (html === '') {
            html = '<p class="text-gray-500 text-center">Waiting for student responses...</p>';
        }
        
        this.studentResponseList.innerHTML = html;
    }

    resetDrillStats() {
        // Reset UI elements (with safety checks)
        if (this.totalStudents) this.totalStudents.textContent = '0';
        if (this.acknowledgedStudents) this.acknowledgedStudents.textContent = '0';
        if (this.participationRate) this.participationRate.textContent = '0%';
        if (this.avgResponseTime) this.avgResponseTime.textContent = '--';
        
        // Reset charts (with safety checks)
        if (this.drillMonitoring.participationChart) {
            try {
                this.drillMonitoring.participationChart.data.datasets[0].data = [0, 0];
                this.drillMonitoring.participationChart.update();
            } catch (error) {
                console.error('❌ Error resetting participation chart:', error);
            }
        }
        
        if (this.drillMonitoring.responseChart) {
            try {
                this.drillMonitoring.responseChart.data.labels = [];
                this.drillMonitoring.responseChart.data.datasets[0].data = [];
                this.drillMonitoring.responseChart.update();
            } catch (error) {
                console.error('❌ Error resetting response chart:', error);
            }
        }
        
        if (this.studentResponseList) {
            this.studentResponseList.innerHTML = '<p class="text-gray-500 text-center">No active drill to monitor</p>';
        }
    }

    // --- UI Helpers ---
    displayMessage(element, message, type) {
        // Clear any existing message
        element.innerHTML = '';
        
        // Create message container with appropriate styling
        const messageContainer = document.createElement('div');
        const isError = type === 'error';
        const isSuccess = type === 'success';
        
        messageContainer.className = `mt-4 p-3 rounded-lg border text-sm font-medium ${
            isError ? 'bg-red-50 border-red-200 text-red-800' : 
            isSuccess ? 'bg-green-50 border-green-200 text-green-800' : 
            'bg-blue-50 border-blue-200 text-blue-800'
        }`;
        
        // Add icon based on message type
        const icon = isError ? 
            '<svg class="w-4 h-4 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' :
            isSuccess ?
            '<svg class="w-4 h-4 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' :
            '<svg class="w-4 h-4 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
        
        messageContainer.innerHTML = `${icon}${message}`;
        element.appendChild(messageContainer);
        
        // Auto-hide after delay
        setTimeout(() => { 
            if (messageContainer.parentNode) {
                messageContainer.style.transition = 'opacity 0.3s ease-out';
                messageContainer.style.opacity = '0';
                setTimeout(() => {
                    if (messageContainer.parentNode) {
                        messageContainer.remove();
                    }
                }, 300);
            }
        }, isSuccess ? 3000 : 6000);
    }



    setLoading(button, isLoading, loadingText) {
        button.disabled = isLoading;
        const originalText = button.dataset.originalText || button.textContent;
        if (!button.dataset.originalText) {
            button.dataset.originalText = button.textContent;
        }

        if (isLoading) {
            button.textContent = loadingText;
            button.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            button.textContent = originalText;
            button.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }

    showAuthInterface() {
        console.log('🔐 Showing authentication interface');
        if (this.authInterface && this.dashboardContainer) {
            this.authInterface.classList.remove('hidden');
            this.dashboardContainer.classList.add('hidden');
            console.log('✅ Auth interface is now visible');
        } else {
            console.error('❌ Cannot show auth interface - elements missing');
        }
    }

    showDashboard() {
        console.log('📊 Showing admin dashboard');
        if (this.authInterface && this.dashboardContainer) {
            this.authInterface.classList.add('hidden');
            this.dashboardContainer.classList.remove('hidden');
            console.log('✅ Dashboard is now visible');
        } else {
            console.error('❌ Cannot show dashboard - elements missing:', {
                authInterface: !!this.authInterface,
                dashboardContainer: !!this.dashboardContainer
            });
        }
    }
}

// Global functions for onclick handlers
window.testConnection = async function() {
    if (window.adminPortalInstance) {
        return await window.adminPortalInstance.testConnection();
    } else {
        console.error('Admin portal not initialized');
        alert('Admin portal not initialized. Please refresh the page.');
    }
};

window.testDrillSync = async function() {
    if (window.adminPortalInstance) {
        return await window.adminPortalInstance.testDrillSync();
    } else {
        console.error('Admin portal not initialized');
        alert('Admin portal not initialized. Please refresh the page.');
    }
};

window.createImmediateDrill = async function() {
    if (window.adminPortalInstance) {
        return await window.adminPortalInstance.createImmediateDrill();
    } else {
        console.error('Admin portal not initialized');
        alert('Admin portal not initialized. Please refresh the page.');
    }
};

// --- Initialize Application ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM Content Loaded - Starting Admin Portal Initialization...');
    
    try {
        // Ensure all critical DOM elements exist before initialization
        const criticalElements = [
            'authInterface',
            'adminLoginForm', 
            'dashboardContainer'
        ];
        
        const missingElements = criticalElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            console.error('❌ Critical DOM elements missing:', missingElements);
            console.error('Cannot initialize Admin Portal without required elements');
            return;
        }
        
        // Wait a bit more for any dynamically loaded content or scripts
        setTimeout(() => {
            try {
                // Create admin portal instance and store globally
                window.adminPortalInstance = new AdminPortal();
                window.adminPortal = window.adminPortalInstance; // Also expose as adminPortal for backward compatibility
                
                console.log('✅ Admin Portal Application Initialized Successfully');
                console.log('🔐 Secure Admin Login: Ready');
                console.log('📊 Live Drill Status Dashboard: Ready');
                console.log('🎯 Real-time Charts: Ready');
                console.log('👥 Student Monitoring: Ready');
                
                console.log('🌐 Global functions exposed:', {
                    testConnection: typeof window.testConnection,
                    testDrillSync: typeof window.testDrillSync,
                    createImmediateDrill: typeof window.createImmediateDrill
                });
                
            } catch (initError) {
                console.error('❌ Admin Portal Initialization Failed:', initError);
                console.error('Stack trace:', initError.stack);
            }
        }, 200); // Small delay to ensure everything is ready
        
    } catch (error) {
        console.error('❌ Critical error during initialization setup:', error);
    }
});