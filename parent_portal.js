// Parent Portal JavaScript for PralayVeer
class ParentPortalSystem {
    constructor() {
        this.parentData = null;
        this.children = [];
        this.notifications = [];
        this.emergencyAlerts = [];
        this.isEmergencyActive = false;
        
        this.init();
    }

    async init() {
        console.log("👨‍👩‍👧‍👦 Initializing Parent Portal System...");
        
        try {
            await this.loadParentData();
            await this.loadChildrenData();
            await this.loadNotifications();
            await this.setupEventListeners();
            await this.setupRealTimeUpdates();
            
            console.log("✅ Parent Portal System initialized successfully");
        } catch (error) {
            console.error("❌ Error initializing Parent Portal:", error);
        }
    }

    // Load parent data
    async loadParentData() {
        // In production, this would get the authenticated parent's data
        this.parentData = {
            id: 'parent_001',
            name: 'Sarah Johnson',
            email: 'sarah.johnson@email.com',
            phone: '+1-555-0123',
            emergencyContact: '+1-555-0124',
            children: ['STU001', 'STU002'],
            notifications: {
                emergency: true,
                drills: true,
                progress: true,
                events: true
            },
            preferredLanguage: 'en'
        };

        // Update UI with parent info
        document.getElementById('parentName').textContent = this.parentData.name;
        document.getElementById('childrenCount').textContent = `${this.parentData.children.length} Children`;
    }

    // Load children data
    async loadChildrenData() {
        // In production, this would query Firebase for children data
        this.children = [
            {
                id: 'STU001',
                name: 'Emma Johnson',
                grade: '5-A',
                rollNumber: '101',
                status: 'safe',
                lastSeen: new Date(),
                drillPerformance: 85,
                completedDrills: 12,
                safetyLevel: 3,
                recentActivities: [
                    { type: 'drill', description: 'Completed fire drill', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
                    { type: 'badge', description: 'Earned First Aid badge', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                    { type: 'exercise', description: 'Participated in evacuation exercise', date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
                ],
                currentLocation: 'Classroom 5-A',
                emergencyContact: this.parentData.phone
            },
            {
                id: 'STU002',
                name: 'Alex Johnson',
                grade: '8-B',
                rollNumber: '202',
                status: 'safe',
                lastSeen: new Date(),
                drillPerformance: 92,
                completedDrills: 18,
                safetyLevel: 4,
                recentActivities: [
                    { type: 'leadership', description: 'Led evacuation group', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
                    { type: 'badge', description: 'Earned Leadership badge', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
                    { type: 'quiz', description: 'Completed advanced first aid quiz', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                ],
                currentLocation: 'Classroom 8-B',
                emergencyContact: this.parentData.phone
            }
        ];

        this.updateChildrenStatus();
    }

    // Load notifications
    async loadNotifications() {
        this.notifications = [
            {
                id: 'notif_001',
                type: 'success',
                title: 'Fire Drill Completed Successfully',
                message: 'All students evacuated safely in 3 minutes 45 seconds. Both Emma and Alex participated and performed excellently.',
                timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                read: false,
                priority: 'high'
            },
            {
                id: 'notif_002',
                type: 'info',
                title: 'Scheduled Earthquake Drill',
                message: 'Reminder: Earthquake drill scheduled for next Friday at 2:00 PM. Please ensure your children are prepared.',
                timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                read: false,
                priority: 'medium'
            },
            {
                id: 'notif_003',
                type: 'info',
                title: 'Safety Equipment Update',
                message: 'New fire extinguishers installed in all classrooms. Emergency exits have been clearly marked with updated signage.',
                timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                read: true,
                priority: 'low'
            }
        ];

        this.updateNotificationBadge();
    }

    // Setup event listeners
    setupEventListeners() {
        // Emergency contact button
        document.getElementById('emergencyContactBtn').addEventListener('click', () => {
            this.showEmergencyModal();
        });

        // Close emergency modal
        document.getElementById('closeEmergencyModal').addEventListener('click', () => {
            this.closeEmergencyModal();
        });

        // Notifications button
        document.getElementById('notificationsBtn').addEventListener('click', () => {
            this.showNotifications();
        });

        // Dismiss alert button
        const dismissBtn = document.getElementById('dismissAlert');
        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                this.dismissEmergencyAlert();
            });
        }

        // Quick action buttons (you can expand these)
        document.addEventListener('click', (e) => {
            if (e.target.textContent?.includes('Send Message to School')) {
                this.sendMessageToSchool();
            } else if (e.target.textContent?.includes('View Safety Reports')) {
                this.viewSafetyReports();
            } else if (e.target.textContent?.includes('Update Preferences')) {
                this.updatePreferences();
            }
        });
    }

    // Setup real-time updates
    async setupRealTimeUpdates() {
        // Simulate real-time updates every 30 seconds
        setInterval(() => {
            this.checkForUpdates();
        }, 30000);

        // Listen for emergency broadcasts
        this.listenForEmergencyAlerts();
    }

    // Update children status display
    updateChildrenStatus() {
        const statusContainer = document.getElementById('childrenStatus');
        statusContainer.innerHTML = '';

        this.children.forEach(child => {
            const statusElement = document.createElement('div');
            statusElement.className = 'flex items-center justify-between';
            
            const statusClass = child.status === 'safe' ? 'text-green-600' : 
                              child.status === 'evacuated' ? 'text-orange-600' : 'text-red-600';
            const statusIcon = child.status === 'safe' ? '✅' : 
                             child.status === 'evacuated' ? '🚨' : '⚠️';
            const statusText = child.status === 'safe' ? 'Safe' : 
                             child.status === 'evacuated' ? 'Evacuated' : 'Alert';

            statusElement.innerHTML = `
                <span class="text-gray-600">${child.name}</span>
                <span class="${statusClass} text-sm font-medium">${statusIcon} ${statusText}</span>
            `;
            
            statusContainer.appendChild(statusElement);
        });
    }

    // Update notification badge
    updateNotificationBadge() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        const badge = document.getElementById('notificationBadge');
        
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    // Show emergency modal
    showEmergencyModal() {
        document.getElementById('emergencyModal').classList.remove('hidden');
    }

    // Close emergency modal
    closeEmergencyModal() {
        document.getElementById('emergencyModal').classList.add('hidden');
    }

    // Show notifications
    showNotifications() {
        // Create notifications dropdown or modal
        const notificationModal = this.createNotificationModal();
        document.body.appendChild(notificationModal);
        
        // Mark notifications as read
        this.notifications.forEach(n => n.read = true);
        this.updateNotificationBadge();
    }

    // Create notification modal
    createNotificationModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.id = 'notificationModal';
        
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-hidden">
                <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-gray-800">Notifications</h3>
                    <button onclick="this.closest('#notificationModal').remove()" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div class="p-6 overflow-y-auto max-h-80">
                    ${this.notifications.map(notification => `
                        <div class="flex items-start space-x-4 p-4 ${this.getNotificationBgClass(notification.type)} rounded-lg mb-4">
                            <div class="w-8 h-8 ${this.getNotificationIconBgClass(notification.type)} rounded-full flex items-center justify-center flex-shrink-0">
                                ${this.getNotificationIcon(notification.type)}
                            </div>
                            <div class="flex-1">
                                <div class="flex items-center justify-between">
                                    <h4 class="font-medium text-gray-800">${notification.title}</h4>
                                    <span class="text-sm text-gray-500">${this.formatTimeAgo(notification.timestamp)}</span>
                                </div>
                                <p class="text-sm text-gray-600 mt-1">${notification.message}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        return modal;
    }

    // Get notification styling classes
    getNotificationBgClass(type) {
        const classes = {
            success: 'bg-green-50',
            info: 'bg-blue-50',
            warning: 'bg-yellow-50',
            error: 'bg-red-50'
        };
        return classes[type] || 'bg-gray-50';
    }

    getNotificationIconBgClass(type) {
        const classes = {
            success: 'bg-green-100',
            info: 'bg-blue-100',
            warning: 'bg-yellow-100',
            error: 'bg-red-100'
        };
        return classes[type] || 'bg-gray-100';
    }

    getNotificationIcon(type) {
        const icons = {
            success: '<svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>',
            info: '<svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
            warning: '<svg class="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>',
            error: '<svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>'
        };
        return icons[type] || icons.info;
    }

    // Format time ago
    formatTimeAgo(date) {
        const now = new Date();
        const diffInMs = now - date;
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        
        if (diffInDays === 0) {
            const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
            if (diffInHours === 0) {
                const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
                return `${diffInMinutes} minutes ago`;
            }
            return `${diffInHours} hours ago`;
        } else if (diffInDays === 1) {
            return 'Yesterday';
        } else {
            return `${diffInDays} days ago`;
        }
    }

    // Listen for emergency alerts
    listenForEmergencyAlerts() {
        // In production, this would use Firebase real-time listeners
        // For demo, we'll simulate emergency scenarios
        
        // Simulate an emergency alert after 10 seconds (for testing)
        setTimeout(() => {
            if (Math.random() < 0.3) { // 30% chance of demo emergency
                this.triggerEmergencyAlert({
                    type: 'fire_drill',
                    message: 'Fire drill in progress at Greenwood Elementary. All students are safely evacuated.',
                    timestamp: new Date(),
                    status: 'in_progress'
                });
            }
        }, 10000);
    }

    // Trigger emergency alert
    triggerEmergencyAlert(alert) {
        this.isEmergencyActive = true;
        
        // Update emergency status
        const statusElement = document.getElementById('emergencyStatus');
        statusElement.className = 'flex items-center space-x-2 bg-red-500 bg-opacity-30 rounded-lg px-3 py-2';
        statusElement.innerHTML = `
            <div class="w-3 h-3 bg-red-500 rounded-full alert-pulse"></div>
            <span class="text-white text-sm font-medium">Emergency Active</span>
        `;
        
        // Show emergency alert banner
        const alertBanner = document.getElementById('emergencyAlert');
        const alertMessage = document.getElementById('alertMessage');
        const alertTime = document.getElementById('alertTime');
        
        alertMessage.textContent = alert.message;
        alertTime.textContent = `Alert issued at ${alert.timestamp.toLocaleTimeString()}`;
        alertBanner.classList.remove('hidden');
        
        // Update children status to "evacuated" during emergency
        this.children.forEach(child => {
            child.status = 'evacuated';
        });
        this.updateChildrenStatus();
        
        // Send push notification (if supported)
        this.sendPushNotification('Emergency Alert', alert.message);
        
        console.log("🚨 Emergency alert triggered:", alert);
    }

    // Dismiss emergency alert
    dismissEmergencyAlert() {
        const alertBanner = document.getElementById('emergencyAlert');
        alertBanner.classList.add('hidden');
        
        // Reset emergency status
        this.isEmergencyActive = false;
        const statusElement = document.getElementById('emergencyStatus');
        statusElement.className = 'flex items-center space-x-2 bg-green-500 bg-opacity-20 rounded-lg px-3 py-2';
        statusElement.innerHTML = `
            <div class="w-3 h-3 bg-green-400 rounded-full"></div>
            <span class="text-white text-sm font-medium">All Clear</span>
        `;
        
        // Update children status back to "safe"
        this.children.forEach(child => {
            child.status = 'safe';
        });
        this.updateChildrenStatus();
    }

    // Send push notification
    sendPushNotification(title, message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/favicon.ico',
                tag: 'emergency-alert'
            });
        } else if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(title, {
                        body: message,
                        icon: '/favicon.ico',
                        tag: 'emergency-alert'
                    });
                }
            });
        }
    }

    // Check for updates
    async checkForUpdates() {
        try {
            // In production, this would check Firebase for new data
            // For demo, we'll simulate occasional updates
            
            if (Math.random() < 0.1) { // 10% chance of new notification
                const newNotification = {
                    id: 'notif_' + Date.now(),
                    type: 'info',
                    title: 'System Update',
                    message: 'Safety systems are functioning normally. All children are accounted for.',
                    timestamp: new Date(),
                    read: false,
                    priority: 'low'
                };
                
                this.notifications.unshift(newNotification);
                this.updateNotificationBadge();
            }
        } catch (error) {
            console.error("❌ Error checking for updates:", error);
        }
    }

    // Quick action methods
    sendMessageToSchool() {
        alert('Message to School feature would open a contact form or messaging interface.');
    }

    viewSafetyReports() {
        alert('Safety Reports feature would display detailed safety analytics and reports.');
    }

    updatePreferences() {
        alert('Preferences feature would allow parents to customize notification settings and preferences.');
    }

    // Get system statistics
    getSystemStats() {
        return {
            totalChildren: this.children.length,
            safeChildren: this.children.filter(c => c.status === 'safe').length,
            totalNotifications: this.notifications.length,
            unreadNotifications: this.notifications.filter(n => !n.read).length,
            emergencyActive: this.isEmergencyActive,
            lastUpdate: new Date()
        };
    }
}

// Initialize Parent Portal System
let parentPortal;
document.addEventListener('DOMContentLoaded', () => {
    parentPortal = new ParentPortalSystem();
});

// Export for global access
window.parentPortal = parentPortal;