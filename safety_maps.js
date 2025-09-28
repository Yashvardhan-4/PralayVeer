// Safety Maps JavaScript - PralayVeer Live 2D Campus Safety System
class SafetyMapsSystem {
    constructor() {
        this.map = null;
        this.userLocation = null;
        this.safetyAssets = [];
        this.evacuationRoutes = [];
        this.emergencyMode = false;
        this.routeLayers = [];
        this.assetMarkers = new Map();
        this.editMode = false;
        this.movingAssetId = null;
        
        this.init();
    }

    async init() {
        console.log("🗺️ Initializing Safety Maps System...");
        
        try {
            await this.initializeMap();
            await this.loadSafetyAssets();
            await this.setupEventListeners();
            await this.requestUserLocation();
            
            console.log("✅ Safety Maps System initialized successfully");
        } catch (error) {
            console.error("❌ Error initializing Safety Maps:", error);
        }
    }

    // Initialize Leaflet Map
    async initializeMap() {
    // PCCOE Pune coordinates (approximate main campus center)
    // Updated authoritative anchor provided by user
    const defaultLat = 18.652557134651307;
    const defaultLng = 73.76278007709611;

        this.map = L.map('map').setView([defaultLat, defaultLng], 18);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors | PralayVeer Safety Maps',
            maxZoom: 22
        }).addTo(this.map);

        // Add custom map controls
        this.addCustomControls();

        // Draw academic building footprint (approximate polygon - editable)
        this.buildingFootprint = L.polygon([
            [18.65274, 73.76255],
            [18.65272, 73.76296],
            [18.65237, 73.76299],
            [18.65233, 73.76257]
        ], {
            color: '#6366f1',
            weight: 2,
            fillColor: '#6366f1',
            fillOpacity: 0.15,
            dashArray: '4,4'
        }).addTo(this.map).bindTooltip('Academic Block', {permanent:false, direction:'center'});

        // Placeholder heat / congestion layer (initially hidden)
        this.congestionLayer = L.layerGroup().addTo(this.map);
        this.congestionLayer.addTo(this.map);
        this.congestionLayerVisible = false;

        // Arrowhead decorator storage
        this.routeDecorators = [];
        
        console.log("🗺️ Map initialized successfully");
    }

    // Load Safety Assets from database or predefined data
    async loadSafetyAssets() {
        // Sample safety assets data (in production, this would come from Firebase)
        // NOTE: Coordinates translated to align with updated campus anchor (delta applied from original cluster)
        this.safetyAssets = [
            {
                id: 'pccoe_main_gate',
                type: 'emergency_exit',
                name: 'Main Gate / Primary Assembly',
                coordinates: [18.652804, 73.762384],
                status: 'active',
                capacity: '800 people',
                details: 'Primary evacuation congregation area near main entrance.'
            },
            {
                id: 'pccoe_quad',
                type: 'safe_zone',
                name: 'Central Quadrangle Safe Zone',
                coordinates: [18.652394, 73.762624],
                status: 'active',
                capacity: '400 people',
                details: 'Open paved quadrangle suitable for interim gathering.'
            },
            {
                id: 'pccoe_library_exit',
                type: 'emergency_exit',
                name: 'Library Side Exit',
                coordinates: [18.652184, 73.763034],
                status: 'active',
                capacity: '200 people',
                details: 'Secondary exit adjacent to library wing.'
            },
            {
                id: 'pccoe_fire_ext_admin',
                type: 'fire_extinguisher',
                name: 'Fire Extinguisher - Admin Block',
                coordinates: [18.652574, 73.762544],
                status: 'active',
                lastChecked: '2025-09-01',
                details: 'CO2 & ABC dual unit near reception.'
            },
            {
                id: 'pccoe_fire_ext_lab',
                type: 'fire_extinguisher',
                name: 'Fire Extinguisher - Lab Corridor',
                coordinates: [18.652254, 73.762804],
                status: 'active',
                lastChecked: '2025-09-01',
                details: 'ABC Type 6kg between Labs L3 & L4.'
            },
            {
                id: 'pccoe_first_aid',
                type: 'first_aid',
                name: 'First Aid & Medical Desk',
                coordinates: [18.652714, 73.762704],
                status: 'active',
                staff: '3 trained responders',
                details: 'Basic trauma kit, hydration & emergency supplies.'
            },
            {
                id: 'pccoe_sports_ground',
                type: 'safe_zone',
                name: 'Sports Ground Secondary Zone',
                coordinates: [18.651974, 73.763314],
                status: 'active',
                capacity: '1000 people',
                details: 'Large open field for overflow / extended evacuation staging.'
            }
        ];

        // Evacuation routes
        this.evacuationRoutes = [
            {
                id: 'r_main_to_gate',
                name: 'Quadrangle → Main Gate',
                coordinates: [
                    [18.652394, 73.762624],
                    [18.652540, 73.762500],
                    [18.652804, 73.762384]
                ],
                priority: 'high',
                estimatedTime: '1 min',
                startAssetId: 'pccoe_quad',
                endAssetId: 'pccoe_main_gate'
            },
            {
                id: 'r_lab_to_first_aid',
                name: 'Lab Wing → First Aid Desk',
                coordinates: [
                    [18.652254, 73.762804],
                    [18.652470, 73.762760],
                    [18.652714, 73.762704]
                ],
                priority: 'medium',
                estimatedTime: '2 min',
                startAssetId: 'pccoe_fire_ext_lab',
                endAssetId: 'pccoe_first_aid'
            },
            {
                id: 'r_library_to_ground',
                name: 'Library Exit → Sports Ground',
                coordinates: [
                    [18.652184, 73.763034],
                    [18.652080, 73.763170],
                    [18.651974, 73.763314]
                ],
                priority: 'medium',
                estimatedTime: '3 min',
                startAssetId: 'pccoe_library_exit',
                endAssetId: 'pccoe_sports_ground'
            }
        ];

        // Place assets on map
        this.renderSafetyAssets();
        this.populateAssetList();
        
        console.log("🛡️ Safety assets loaded successfully");

        // Auto expand drawer first time for visibility
        const drawer = document.getElementById('drawer');
        const label = document.getElementById('drawerLabel');
        if (drawer && drawer.classList.contains('drawer-collapsed')) {
            drawer.classList.remove('drawer-collapsed');
            if (label) label.textContent = 'Hide Assets';
            setTimeout(()=> { if (this.map) this.map.invalidateSize(); }, 350);
        }
    }

    // Render safety assets on the map
    renderSafetyAssets() {
        this.safetyAssets.forEach(asset => {
            const { icon, color } = this.getAssetStyle(asset.type);
            
            const marker = L.circleMarker(asset.coordinates, {
                radius: 8,
                fillColor: color,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(this.map);

            // Create popup content
            const popupContent = `
                <div class="safety-asset-popup">
                    <div class="flex items-center space-x-2 mb-2">
                        <span class="text-lg">${icon}</span>
                        <h3 class="font-semibold text-gray-800">${asset.name}</h3>
                    </div>
                    <p class="text-sm text-gray-600 mb-2">${asset.details}</p>
                    <div class="text-xs text-gray-500">
                        <p><strong>Status:</strong> <span class="text-green-600">${asset.status}</span></p>
                        ${asset.lastChecked ? `<p><strong>Last Checked:</strong> ${asset.lastChecked}</p>` : ''}
                        ${asset.capacity ? `<p><strong>Capacity:</strong> ${asset.capacity}</p>` : ''}
                        ${asset.staff ? `<p><strong>Staff:</strong> ${asset.staff}</p>` : ''}
                    </div>
                    <div class="mt-2 pt-2 border-t">
                        <button onclick="safetyMaps.navigateToAsset('${asset.id}')" 
                                class="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded">
                            Navigate Here
                        </button>
                    </div>
                </div>
            `;

            marker.bindPopup(popupContent, {
                maxWidth: 300,
                className: 'custom-popup'
            });

            // Highlight relevant evacuation routes when marker clicked
            marker.on('click', () => {
                this.highlightRoutesForAsset(asset.id);
                if (this.editMode) {
                    const select = document.getElementById('editAssetSelect');
                    if (select) select.value = asset.id;
                }
            });

            this.assetMarkers.set(asset.id, marker);
        });
    }

    // Get styling for different asset types
    getAssetStyle(type) {
        const styles = {
            fire_extinguisher: { icon: '🧯', color: '#ef4444' },
            emergency_exit: { icon: '🚪', color: '#22c55e' },
            safe_zone: { icon: '🛡️', color: '#3b82f6' },
            first_aid: { icon: '🏥', color: '#eab308' }
        };
        return styles[type] || { icon: '📍', color: '#6b7280' };
    }

    // Populate sidebar asset list
    populateAssetList() {
        const assetList = document.getElementById('assetList');
        assetList.innerHTML = '';

        this.safetyAssets.forEach(asset => {
            const { icon, color } = this.getAssetStyle(asset.type);
            
            const assetElement = document.createElement('div');
            assetElement.className = 'bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors';
            assetElement.innerHTML = `
                <div class="flex items-start space-x-3">
                    <div class="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold" 
                         style="background-color: ${color}">
                        ${icon}
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="text-sm font-medium text-gray-800 truncate">${asset.name}</h4>
                        <p class="text-xs text-gray-500 mt-1">${asset.details}</p>
                        <div class="flex items-center mt-2">
                            <div class="w-2 h-2 rounded-full ${asset.status === 'active' ? 'bg-green-400' : 'bg-red-400'} mr-2"></div>
                            <span class="text-xs font-medium ${asset.status === 'active' ? 'text-green-600' : 'text-red-600'}">${asset.status}</span>
                        </div>
                    </div>
                </div>
            `;
            
            assetElement.addEventListener('click', () => {
                this.map.setView(asset.coordinates, 20);
                this.highlightRoutesForAsset(asset.id);
            });
            
            assetList.appendChild(assetElement);
        });
    }

    // Request user location
    async requestUserLocation() {
        if (!navigator.geolocation) {
            this.updateLocationStatus('error', 'Geolocation not supported');
            return;
        }

        this.updateLocationStatus('detecting', 'Detecting location...');

        const handlePosition = (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            this.userLocation = [latitude, longitude];
            this.gpsAccuracy = accuracy; // meters
            this.showUserLocation();
            this.updateLocationStatus('success', `Accuracy ±${Math.round(accuracy)}m`);
            this.updateNearestExitsList();
        };

        const handleError = (error) => {
            console.error('Geolocation error:', error);
            this.updateLocationStatus('error', 'Location access denied');
        };

        navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 20000
        });

        // Watch position for live updates (throttled)
        if (!this.watchId) {
            let lastUpdate = 0;
            this.watchId = navigator.geolocation.watchPosition((pos) => {
                const now = Date.now();
                if (now - lastUpdate < 3000) return; // 3s throttle
                lastUpdate = now;
                handlePosition(pos);
            }, handleError, { enableHighAccuracy: true, maximumAge: 5000 });
        }
    }

    // Show user location on map
    showUserLocation() {
        if (!this.userLocation) return;

        // Remove existing user marker
        if (this.userMarker) {
            this.map.removeLayer(this.userMarker);
        }

        // Add user location marker
        this.userMarker = L.circleMarker(this.userLocation, {
            radius: 9,
            fillColor: '#2563eb',
            color: '#93c5fd',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
        }).addTo(this.map);

        // Accuracy circle
        if (this.accuracyCircle) this.map.removeLayer(this.accuracyCircle);
        if (this.gpsAccuracy && this.gpsAccuracy < 150) { // show only if reasonable
            this.accuracyCircle = L.circle(this.userLocation, {
                radius: this.gpsAccuracy,
                color: '#3b82f6',
                weight: 1,
                fillColor: '#3b82f6',
                fillOpacity: 0.08
            }).addTo(this.map);
        }

        this.userMarker.bindPopup(`
            <div class="text-center">
                <p class="font-semibold text-blue-600">📍 Your Location</p>
                <p class="text-xs text-gray-500 mt-1">Real-time GPS position</p>
            </div>
        `);

        // Center map on user location
        this.map.setView(this.userLocation, 19);

        // Update distances if already rendered
        this.updateNearestExitsList();
    }

    // Update location status display
    updateLocationStatus(status, message) {
        const statusElement = document.getElementById('locationStatus');
        const textElement = document.getElementById('locationText');
        
        const statusColors = {
            detecting: 'bg-yellow-400',
            success: 'bg-green-400',
            error: 'bg-red-400'
        };
        
        statusElement.className = `w-3 h-3 rounded-full ${statusColors[status] || 'bg-gray-400'}`;
        textElement.textContent = message;
    }

    // Setup event listeners
    setupEventListeners() {
        // Back to app button
        document.getElementById('backToApp').addEventListener('click', () => {
            window.location.href = 'student_app.html';
        });

        // Show all routes button
        document.getElementById('showAllRoutes').addEventListener('click', () => {
            this.showAllEvacuationRoutes();
        });

        // Find nearest exit button
        document.getElementById('findNearestExit').addEventListener('click', () => {
            this.findNearestExit();
        });

        // Emergency mode button
        document.getElementById('activateEmergencyMode').addEventListener('click', () => {
            this.activateEmergencyMode();
        });

        // Deactivate emergency button
        document.getElementById('deactivateEmergency').addEventListener('click', () => {
            this.deactivateEmergencyMode();
        });

        // Asset edit panel events
        const editPanel = document.getElementById('assetEditPanel');
        if (editPanel) {
            // Long-press (desktop: shift+E) to toggle editor quickly could be added later
            this.setupAssetEditorUI();
        }

        // Drawer toggle logic
        const drawer = document.getElementById('drawer');
        const drawerBtn = document.getElementById('drawer-handle-btn');
        const drawerLabel = document.getElementById('drawerLabel');
        if (drawer && drawerBtn) {
            drawerBtn.addEventListener('click', () => {
                const collapsed = drawer.classList.toggle('drawer-collapsed');
                drawerLabel.textContent = collapsed ? 'Show Assets' : 'Hide Assets';
                setTimeout(()=> { if (this.map) this.map.invalidateSize(); }, 360);
            });
        }
    }

    // Show all evacuation routes
    showAllEvacuationRoutes() {
        // Clear existing routes
        this.clearRoutes();

        this.evacuationRoutes.forEach(route => {
            const polyline = L.polyline(route.coordinates, {
                color: route.priority === 'high' ? '#ef4444' : '#f59e0b',
                weight: 4,
                opacity: 0.8,
                className: 'exit-route-line'
            }).addTo(this.map);

            this.addArrowheads(polyline);

            polyline.bindPopup(`
                <div>
                    <h4 class="font-semibold text-gray-800">${route.name}</h4>
                    <p class="text-sm text-gray-600">Estimated time: ${route.estimatedTime}</p>
                    <p class="text-sm text-gray-600">Priority: ${route.priority}</p>
                </div>
            `);

            this.routeLayers.push(polyline);
        });

        console.log("🛤️ All evacuation routes displayed");
    }

    // Find nearest exit
    findNearestExit() {
        if (!this.userLocation) {
            alert('Please enable location access to find nearest exit');
            return;
        }

        const exits = this.safetyAssets.filter(asset => asset.type === 'emergency_exit');
        let nearestExit = null;
        let minDistance = Infinity;

        exits.forEach(exit => {
            const distance = this.calculateDistance(this.userLocation, exit.coordinates);
            if (distance < minDistance) {
                minDistance = distance;
                nearestExit = exit;
            }
        });

        if (nearestExit) {
            // Clear existing routes
            this.clearRoutes();

            // Draw route to nearest exit
            const routeLine = L.polyline([this.userLocation, nearestExit.coordinates], {
                color: '#22c55e',
                weight: 5,
                opacity: 1,
                className: 'exit-route-line'
            }).addTo(this.map);

            this.routeLayers.push(routeLine);

            // Show popup with instructions
            const distance = Math.round(minDistance * 1000); // Convert to meters
            alert(`🚪 Nearest exit: ${nearestExit.name}\nDistance: ${distance}m\nRoute highlighted in green`);

            // Center map to show both user and exit
            const group = new L.featureGroup([this.userMarker, L.marker(nearestExit.coordinates)]);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    // Calculate distance between two coordinates
    calculateDistance(coord1, coord2) {
        const R = 6371; // Earth's radius in km
        const dLat = (coord2[0] - coord1[0]) * Math.PI / 180;
        const dLon = (coord2[1] - coord1[1]) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // Format distance (km float) into readable string
    formatDistance(km) {
        if (km < 1) {
            return `${Math.round(km * 1000)} m`;
        }
        return `${km.toFixed(2)} km`;
    }

    // Update nearest exits distance list UI
    updateNearestExitsList() {
        const listContainer = document.getElementById('nearestExitsList');
        if (!listContainer) return; // HTML not present

        if (!this.userLocation) {
            listContainer.innerHTML = '<p class="text-[10px] text-slate-400">Location required to compute distances.</p>';
            return;
        }

        const exits = this.safetyAssets.filter(a => a.type === 'emergency_exit');
        if (exits.length === 0) {
            listContainer.innerHTML = '<p class="text-[10px] text-slate-400">No exits configured.</p>';
            return;
        }

        const enriched = exits.map(exit => ({
            ...exit,
            distanceKm: this.calculateDistance(this.userLocation, exit.coordinates)
        })).sort((a,b) => a.distanceKm - b.distanceKm);

        listContainer.innerHTML = '';
        enriched.forEach(exit => {
            const row = document.createElement('button');
            row.className = 'w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-700/40 hover:bg-slate-600/40 text-left transition';
            row.innerHTML = `
                <span class="truncate mr-3 text-[11px] font-medium">${exit.name}</span>
                <span class="text-[10px] text-emerald-300 font-semibold">${this.formatDistance(exit.distanceKm)}</span>
            `;
            row.addEventListener('click', () => {
                this.map.setView(exit.coordinates, 20);
                this.highlightRoutesForAsset(exit.id);
            });
            listContainer.appendChild(row);
        });
    }

    // Highlight evacuation routes associated with an asset
    highlightRoutesForAsset(assetId) {
        // Find routes where asset is start or end
        const relatedRoutes = this.evacuationRoutes.filter(r => r.startAssetId === assetId || r.endAssetId === assetId);

        // If no predefined route, fallback to drawing a straight line from user to asset (if user located)
        if (relatedRoutes.length === 0) {
            if (this.userLocation) {
                const asset = this.safetyAssets.find(a => a.id === assetId);
                if (asset) {
                    this.clearRoutes();
                    const line = L.polyline([this.userLocation, asset.coordinates], {
                        color: '#f97316',
                        weight: 5,
                        opacity: 0.9
                    }).addTo(this.map);
                    this.routeLayers.push(line);
                    const group = new L.featureGroup([this.userMarker, L.marker(asset.coordinates)]);
                    this.map.fitBounds(group.getBounds().pad(0.15));
                }
            }
            return;
        }

        // Clear old routes and draw highlighted ones
        this.clearRoutes();
        relatedRoutes.forEach(route => {
            const polyline = L.polyline(route.coordinates, {
                color: '#facc15',
                weight: 6,
                opacity: 1,
                className: 'exit-route-line'
            }).addTo(this.map);
            polyline.bindPopup(`<div class=\"text-sm\"><strong>${route.name}</strong><br/>Priority: ${route.priority}</div>`);
            this.routeLayers.push(polyline);
            this.addArrowheads(polyline);
        });

        // Fit bounds to all highlighted routes
        if (this.routeLayers.length > 0) {
            const group = new L.featureGroup(this.routeLayers);
            this.map.fitBounds(group.getBounds().pad(0.15));
        }
    }

    // Activate emergency mode
    activateEmergencyMode() {
        this.emergencyMode = true;
        document.getElementById('emergencyOverlay').classList.remove('hidden');
        
        // Show all evacuation routes in emergency colors
        this.clearRoutes();
        this.evacuationRoutes.forEach(route => {
            const polyline = L.polyline(route.coordinates, {
                color: '#dc2626',
                weight: 6,
                opacity: 1,
                className: 'exit-route-line'
            }).addTo(this.map);
            this.routeLayers.push(polyline);
            this.addArrowheads(polyline);
        });

        // Update status indicator
        const statusElement = document.querySelector('.emergency-pulse');
        if (statusElement) {
            statusElement.className = 'w-3 h-3 bg-red-500 rounded-full emergency-pulse';
            statusElement.nextElementSibling.textContent = 'EMERGENCY ACTIVE';
        }

        console.log("🚨 Emergency mode activated");
    }

    // Deactivate emergency mode
    deactivateEmergencyMode() {
        this.emergencyMode = false;
        document.getElementById('emergencyOverlay').classList.add('hidden');
        
        // Clear emergency routes
        this.clearRoutes();

        // Update status indicator
        const statusElement = document.querySelector('.emergency-pulse');
        if (statusElement) {
            statusElement.className = 'w-3 h-3 bg-green-400 rounded-full emergency-pulse';
            statusElement.nextElementSibling.textContent = 'All Clear';
        }

        console.log("✅ Emergency mode deactivated");
    }

    // Clear all route overlays
    clearRoutes() {
        this.routeLayers.forEach(layer => this.map.removeLayer(layer));
        this.routeLayers = [];
        if (this.routeDecorators) {
            this.routeDecorators.forEach(d => this.map.removeLayer(d));
            this.routeDecorators = [];
        }
    }

    // Navigate to specific asset
    navigateToAsset(assetId) {
        const asset = this.safetyAssets.find(a => a.id === assetId);
        if (asset) {
            this.map.setView(asset.coordinates, 20);
            
            if (this.userLocation) {
                // Draw navigation route
                this.clearRoutes();
                const routeLine = L.polyline([this.userLocation, asset.coordinates], {
                    color: '#3b82f6',
                    weight: 4,
                    opacity: 0.8,
                    className: 'exit-route-line'
                }).addTo(this.map);

                this.routeLayers.push(routeLine);
            }
            // Additionally highlight any formal route segments linked to this asset
            this.highlightRoutesForAsset(asset.id);
        }
    }

    // Add custom map controls
    addCustomControls() {
        // Add custom zoom control
        const zoomControl = L.control.zoom({
            position: 'bottomright'
        });
        this.map.addControl(zoomControl);

        // Add scale control
        L.control.scale({
            position: 'bottomleft',
            metric: true,
            imperial: false
        }).addTo(this.map);

        // Recenter FAB
        const recenter = L.control({ position: 'bottomright' });
        recenter.onAdd = () => {
            const btn = L.DomUtil.create('button', 'leaflet-bar bg-white text-slate-700 font-medium');
            btn.style.width = '34px';
            btn.style.height = '34px';
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
            btn.style.justifyContent = 'center';
            btn.style.cursor = 'pointer';
            btn.title = 'Recenter';
            btn.innerHTML = '⌖';
            btn.onclick = (e) => {
                e.preventDefault();
                if (this.userLocation) {
                    this.map.setView(this.userLocation, 19);
                } else {
                    this.map.setView([defaultLat, defaultLng], 18);
                }
            };
            return btn;
        };
        recenter.addTo(this.map);

        // Indoor / Outdoor mode scaffold toggle (affects styling only for now)
        const modeToggle = L.control({ position: 'bottomleft' });
        modeToggle.onAdd = () => {
            const div = L.DomUtil.create('div','leaflet-bar');
            div.style.display='flex';
            const btn = L.DomUtil.create('button','bg-white text-xs px-2 py-1');
            btn.textContent = 'Indoor';
            btn.style.cursor='pointer';
            btn.onclick = () => {
                this.indoorMode = !this.indoorMode;
                btn.textContent = this.indoorMode ? 'Outdoor' : 'Indoor';
                this.toggleIndoorModeVisual();
            };
            div.appendChild(btn);
            return div;
        };
        modeToggle.addTo(this.map);

        // Add an Edit toggle control (for coordinate correction) - restricted to manual use
        const editToggle = L.control({ position: 'topleft' });
        editToggle.onAdd = () => {
            const btn = L.DomUtil.create('button','bg-white text-[11px] px-2 py-1 font-medium');
            btn.textContent = 'Edit Assets';
            btn.style.cursor='pointer';
            btn.onclick = () => {
                this.editMode = !this.editMode;
                btn.textContent = this.editMode ? 'Done' : 'Edit Assets';
                const panel = document.getElementById('assetEditPanel');
                if (panel) panel.classList.toggle('hidden', !this.editMode);
                if (this.editMode) {
                    this.populateEditSelect();
                    this.refreshAssetJsonOutput();
                } else {
                    this.movingAssetId = null;
                }
            };
            return btn;
        };
        editToggle.addTo(this.map);
    }

    // ================= ASSET EDITOR =================
    setupAssetEditorUI() {
        const select = document.getElementById('editAssetSelect');
        const moveBtn = document.getElementById('startMoveAsset');
        const saveBtn = document.getElementById('saveAssetsLocal');
        const loadBtn = document.getElementById('loadAssetsLocal');
        const clearBtn = document.getElementById('clearAssetsLocal');
        const closeBtn = document.getElementById('closeEditPanel');
        const status = document.getElementById('editStatusMsg');

        this.map.on('click', (e) => {
            if (this.editMode && this.movingAssetId) {
                const asset = this.safetyAssets.find(a => a.id === this.movingAssetId);
                if (asset) {
                    asset.coordinates = [e.latlng.lat, e.latlng.lng];
                    const marker = this.assetMarkers.get(asset.id);
                    if (marker) {
                        marker.setLatLng(e.latlng);
                    }
                    this.movingAssetId = null;
                    if (status) status.textContent = `Updated ${asset.id} to ${asset.coordinates[0].toFixed(6)}, ${asset.coordinates[1].toFixed(6)}`;
                    this.refreshAssetJsonOutput();
                }
            }
        });

        if (moveBtn) moveBtn.onclick = () => {
            if (!select.value) return;
            this.movingAssetId = select.value;
            if (status) status.textContent = `Tap a new map location for ${this.movingAssetId}...`;
        };

        if (saveBtn) saveBtn.onclick = () => {
            localStorage.setItem('pv_asset_overrides', JSON.stringify(this.safetyAssets));
            if (status) status.textContent = 'Saved to localStorage.';
        };

        if (loadBtn) loadBtn.onclick = () => {
            const raw = localStorage.getItem('pv_asset_overrides');
            if (!raw) { if (status) status.textContent = 'No saved data.'; return; }
            try {
                const data = JSON.parse(raw);
                if (Array.isArray(data)) {
                    this.safetyAssets = data;
                    // Re-render markers
                    this.assetMarkers.forEach(m => this.map.removeLayer(m));
                    this.assetMarkers.clear();
                    this.renderSafetyAssets();
                    if (status) status.textContent = 'Loaded saved asset positions.';
                    this.populateEditSelect();
                    this.refreshAssetJsonOutput();
                }
            } catch (e) {
                console.error(e);
                if (status) status.textContent = 'Load failed (bad JSON).';
            }
        };

        if (clearBtn) clearBtn.onclick = () => {
            localStorage.removeItem('pv_asset_overrides');
            if (status) status.textContent = 'Cleared local saved data.';
        };

        if (closeBtn) closeBtn.onclick = () => {
            const panel = document.getElementById('assetEditPanel');
            panel.classList.add('hidden');
            this.editMode = false;
        };
    }

    populateEditSelect() {
        const select = document.getElementById('editAssetSelect');
        if (!select) return;
        select.innerHTML = '';
        this.safetyAssets.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a.id;
            opt.textContent = `${a.name} (${a.type})`;
            select.appendChild(opt);
        });
    }

    refreshAssetJsonOutput() {
        const out = document.getElementById('assetJsonOutput');
        if (!out) return;
        out.value = JSON.stringify(this.safetyAssets, null, 2);
    }

    // Add arrowheads to a polyline (simple manual implementation)
    addArrowheads(polyline) {
        const latlngs = polyline.getLatLngs();
        for (let i = 0; i < latlngs.length - 1; i++) {
            const start = latlngs[i];
            const end = latlngs[i + 1];
            const arrow = this._createArrowhead(start, end);
            arrow.addTo(this.map);
            this.routeDecorators.push(arrow);
        }
    }

    _createArrowhead(start, end) {
        // Calculate bearing
        const dx = end.lng - start.lng;
        const dy = end.lat - start.lat;
        const angle = Math.atan2(dy, dx);
        const size = 0.00005; // approx arrow size
        const tip = end;
        const left = L.latLng(
            end.lat - size * Math.sin(angle - Math.PI / 6),
            end.lng - size * Math.cos(angle - Math.PI / 6)
        );
        const right = L.latLng(
            end.lat - size * Math.sin(angle + Math.PI / 6),
            end.lng - size * Math.cos(angle + Math.PI / 6)
        );
        return L.polygon([tip, left, right], {
            color: '#fbbf24',
            weight: 1,
            fillColor: '#facc15',
            fillOpacity: 0.9
        });
    }

    toggleIndoorModeVisual() {
        if (this.indoorMode) {
            if (!this.indoorOverlay) {
                this.indoorOverlay = L.rectangle(this.buildingFootprint.getBounds(), {
                    color: '#14b8a6',
                    weight: 1,
                    dashArray: '2,4',
                    fillColor: '#14b8a6',
                    fillOpacity: 0.05
                }).addTo(this.map).bindTooltip('Indoor (Prototype)');
            }
        } else {
            if (this.indoorOverlay) {
                this.map.removeLayer(this.indoorOverlay);
                this.indoorOverlay = null;
            }
        }
    }
}

// Initialize the safety maps system when the page loads
let safetyMaps;
document.addEventListener('DOMContentLoaded', () => {
    safetyMaps = new SafetyMapsSystem();
});

// Export for global access
window.safetyMaps = safetyMaps;