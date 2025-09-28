// QR Code Verification System for PralayVeer
class QRVerificationSystem {
    constructor() {
        this.html5QrCode = null;
        this.isScanning = false;
        this.studentData = null;
        this.evacuationRecords = [];
        
        this.init();
    }

    async init() {
        console.log("🔍 Initializing QR Verification System...");
        
        try {
            await this.loadStudentData();
            await this.loadEvacuationRecords();
            this.setupEventListeners();
            this.updateUI();
            
            console.log("✅ QR Verification System initialized successfully");
        } catch (error) {
            console.error("❌ Error initializing QR Verification:", error);
        }
    }

    // Load current student data
    async loadStudentData() {
        // In a real app, this would get the current authenticated user
        // For demo purposes, we'll use sample data
        this.studentData = {
            id: 'STU001',
            name: 'John Doe',
            class: '10-A',
            rollNumber: '101',
            email: 'john.doe@school.edu'
        };

        // Update UI with student info
        const studentInfo = document.getElementById('studentInfo');
        const studentName = document.getElementById('studentName');
        const studentId = document.getElementById('studentId');

        if (studentInfo && studentName && studentId) {
            studentName.textContent = this.studentData.name;
            studentId.textContent = `ID: ${this.studentData.id}`;
            studentInfo.classList.remove('hidden');
        }
    }

    // Load evacuation records from Firebase
    async loadEvacuationRecords() {
        try {
            // In production, this would query Firebase for the student's evacuation records
            // For demo, we'll use sample data
            this.evacuationRecords = [
                {
                    id: 'rec_001',
                    safeZone: 'Main Assembly Point',
                    timestamp: new Date('2024-01-15T10:30:00'),
                    drillType: 'Fire Drill',
                    status: 'completed'
                },
                {
                    id: 'rec_002',
                    safeZone: 'Sports Ground Safe Zone',
                    timestamp: new Date('2024-01-10T14:15:00'),
                    drillType: 'Earthquake Drill',
                    status: 'completed'
                }
            ];

            this.displayEvacuationRecords();
        } catch (error) {
            console.error("❌ Error loading evacuation records:", error);
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Back to app button
        document.getElementById('backToApp').addEventListener('click', () => {
            window.location.href = 'student_app.html';
        });

        // Scanner controls
        document.getElementById('startScanBtn').addEventListener('click', () => {
            this.startScanning();
        });

        document.getElementById('stopScanBtn').addEventListener('click', () => {
            this.stopScanning();
        });

        // Success modal close
        document.getElementById('closeSuccessModal').addEventListener('click', () => {
            this.closeSuccessModal();
        });
    }

    // Start QR code scanning
    async startScanning() {
        try {
            this.html5QrCode = new Html5Qrcode("qr-reader");
            
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            };

            await this.html5QrCode.start(
                { facingMode: "environment" }, // Use back camera
                config,
                (decodedText, decodedResult) => {
                    this.onScanSuccess(decodedText, decodedResult);
                },
                (errorMessage) => {
                    // Handle scan failure (usually just no QR code in view)
                    // We don't need to log this as it happens frequently
                }
            );

            this.isScanning = true;
            this.updateScannerUI();
            this.updateScannerStatus('Scanning... Position QR code within the frame', 'info');

            console.log("📱 QR scanner started successfully");
        } catch (error) {
            console.error("❌ Error starting QR scanner:", error);
            this.updateScannerStatus('Error starting camera. Please check permissions.', 'error');
        }
    }

    // Stop QR code scanning
    async stopScanning() {
        if (this.html5QrCode && this.isScanning) {
            try {
                await this.html5QrCode.stop();
                this.html5QrCode.clear();
                this.isScanning = false;
                this.updateScannerUI();
                this.updateScannerStatus('Scanner stopped. Click "Start Scanning" to resume.', 'info');
                
                console.log("🛑 QR scanner stopped");
            } catch (error) {
                console.error("❌ Error stopping QR scanner:", error);
            }
        }
    }

    // Handle successful QR code scan
    async onScanSuccess(decodedText, decodedResult) {
        console.log("🎯 QR Code detected:", decodedText);
        
        try {
            // Stop scanning immediately
            await this.stopScanning();
            
            // Parse QR code data
            const qrData = this.parseQRCode(decodedText);
            
            if (qrData && qrData.type === 'safe_zone') {
                await this.processEvacuationCheckIn(qrData);
            } else {
                this.updateScannerStatus('Invalid QR code. Please scan a valid safe zone QR code.', 'error');
                // Auto-restart scanning after error
                setTimeout(() => {
                    this.startScanning();
                }, 2000);
            }
        } catch (error) {
            console.error("❌ Error processing QR code:", error);
            this.updateScannerStatus('Error processing QR code. Please try again.', 'error');
        }
    }

    // Parse QR code data
    parseQRCode(qrText) {
        try {
            // Expected QR format: {"type":"safe_zone","id":"sz_001","name":"Main Assembly Point","capacity":500}
            const data = JSON.parse(qrText);
            
            if (data.type === 'safe_zone' && data.id && data.name) {
                return data;
            }
            
            return null;
        } catch (error) {
            // Try alternative format: PRALAYVEER_SAFE_ZONE_sz_001_Main Assembly Point
            if (qrText.startsWith('PRALAYVEER_SAFE_ZONE_')) {
                const parts = qrText.split('_');
                if (parts.length >= 4) {
                    return {
                        type: 'safe_zone',
                        id: parts[3],
                        name: parts.slice(4).join(' '),
                        capacity: 500 // Default capacity
                    };
                }
            }
            
            return null;
        }
    }

    // Process evacuation check-in
    async processEvacuationCheckIn(safeZoneData) {
        const checkInTime = new Date();
        
        const evacuationRecord = {
            id: 'rec_' + Date.now(),
            studentId: this.studentData.id,
            studentName: this.studentData.name,
            safeZoneId: safeZoneData.id,
            safeZoneName: safeZoneData.name,
            timestamp: checkInTime,
            drillType: 'Current Drill', // This would come from active drill data
            status: 'completed',
            coordinates: await this.getCurrentLocation()
        };

        try {
            // Save to Firebase (in production)
            await this.saveEvacuationRecord(evacuationRecord);
            
            // Add to local records
            this.evacuationRecords.unshift(evacuationRecord);
            
            // Update UI
            this.updateEvacuationStatus('Safely Evacuated', 'success');
            this.updateSafeZoneName(safeZoneData.name);
            this.updateCheckInTime(checkInTime);
            this.displayEvacuationRecords();
            
            // Show success modal
            this.showSuccessModal(evacuationRecord);
            
            console.log("✅ Evacuation check-in completed successfully");
        } catch (error) {
            console.error("❌ Error saving evacuation record:", error);
            this.updateScannerStatus('Error saving check-in record. Please try again.', 'error');
        }
    }

    // Save evacuation record to Firebase
    async saveEvacuationRecord(record) {
        try {
            if (window.db) {
                // Save to Firestore
                const docRef = await window.db.collection('evacuation_records').add({
                    ...record,
                    timestamp: new Date() // Firestore timestamp
                });
                
                console.log("💾 Evacuation record saved with ID:", docRef.id);
            }
        } catch (error) {
            console.error("❌ Error saving to Firebase:", error);
            throw error;
        }
    }

    // Get current location
    async getCurrentLocation() {
        return new Promise((resolve) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy
                        });
                    },
                    (error) => {
                        console.warn("Location access denied:", error);
                        resolve(null);
                    },
                    { timeout: 5000, maximumAge: 300000 }
                );
            } else {
                resolve(null);
            }
        });
    }

    // Update scanner UI based on scanning state
    updateScannerUI() {
        const startBtn = document.getElementById('startScanBtn');
        const stopBtn = document.getElementById('stopScanBtn');

        if (this.isScanning) {
            startBtn.classList.add('hidden');
            stopBtn.classList.remove('hidden');
        } else {
            startBtn.classList.remove('hidden');
            stopBtn.classList.add('hidden');
        }
    }

    // Update scanner status message
    updateScannerStatus(message, type = 'info') {
        const statusElement = document.getElementById('scannerStatus');
        const colorClasses = {
            info: 'text-blue-600',
            success: 'text-green-600',
            error: 'text-red-600',
            warning: 'text-yellow-600'
        };

        statusElement.innerHTML = `<p class="${colorClasses[type]} font-medium">${message}</p>`;
    }

    // Update evacuation status
    updateEvacuationStatus(status, type = 'info') {
        const statusElement = document.getElementById('evacuationStatus');
        const colorClasses = {
            info: 'text-gray-600',
            success: 'text-green-600',
            error: 'text-red-600',
            warning: 'text-yellow-600'
        };

        statusElement.textContent = status;
        statusElement.className = `text-sm ${colorClasses[type]} font-medium`;
    }

    // Update safe zone name
    updateSafeZoneName(name) {
        const element = document.getElementById('safeZoneName');
        element.textContent = name;
        element.className = 'text-sm text-green-600 font-medium';
    }

    // Update check-in time
    updateCheckInTime(time) {
        const element = document.getElementById('checkInTime');
        element.textContent = time.toLocaleTimeString();
        element.className = 'text-sm text-green-600 font-medium';
    }

    // Display evacuation records
    displayEvacuationRecords() {
        const container = document.getElementById('recentCheckIns');
        
        if (this.evacuationRecords.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                    <p>No evacuation records yet</p>
                    <p class="text-sm">Scan a QR code to create your first record</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.evacuationRecords.map(record => `
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div class="flex items-center space-x-4">
                    <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <div>
                        <h4 class="font-medium text-gray-800">${record.safeZoneName}</h4>
                        <p class="text-sm text-gray-600">${record.drillType || 'Emergency Drill'}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-sm font-medium text-gray-800">${record.timestamp.toLocaleDateString()}</p>
                    <p class="text-sm text-gray-600">${record.timestamp.toLocaleTimeString()}</p>
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                        ✅ Completed
                    </span>
                </div>
            </div>
        `).join('');
    }

    // Show success modal
    showSuccessModal(record) {
        const modal = document.getElementById('successModal');
        const safeZoneElement = document.getElementById('successSafeZone');
        const timeElement = document.getElementById('successTime');

        safeZoneElement.textContent = record.safeZoneName;
        timeElement.textContent = record.timestamp.toLocaleString();

        modal.classList.remove('hidden');

        // Auto-close modal after 5 seconds
        setTimeout(() => {
            this.closeSuccessModal();
        }, 5000);
    }

    // Close success modal
    closeSuccessModal() {
        const modal = document.getElementById('successModal');
        modal.classList.add('hidden');
    }

    // Update main UI elements
    updateUI() {
        // Set initial status
        this.updateEvacuationStatus('Not Checked In', 'info');
        document.getElementById('safeZoneName').textContent = 'Scan QR to identify';
        document.getElementById('checkInTime').textContent = '--:--';
    }
}

// Initialize QR Verification System
let qrVerification;
document.addEventListener('DOMContentLoaded', () => {
    qrVerification = new QRVerificationSystem();
});

// Export for global access
window.qrVerification = qrVerification;