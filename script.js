class Whiteboard {
    constructor() {
        // Monanimal properties FIRST!
        this.isMonanimalMode = false;
        this.monanimalTraits = {
            head: [],
            eyes: [],
            mouth: [],
            crown: [],
            dress: [],
            hand: [],
            nose: []
        };
        this.selectedTraitCategory = 'head';
        console.log('Initializing Whiteboard...');
        this.canvas = document.getElementById('whiteboard');
        this.ctx = this.canvas.getContext('2d');
        
        // Create separate canvases for drawings and images
        this.drawingCanvas = document.createElement('canvas');
        this.imageCanvas = document.createElement('canvas');
        
        // Get contexts
        this.drawingCtx = this.drawingCanvas.getContext('2d');
        this.imageCtx = this.imageCanvas.getContext('2d');
        
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.history = [];
        this.currentHistoryIndex = -1;
        this.currentTool = 'pencil';
        this.color = '#000000';
        this.size = 5;
        this.blurRadius = 10;
        this.smudgeRadius = 20;
        this.isCropping = false;
        this.cropStartX = 0;
        this.cropStartY = 0;
        this.cropEndX = 0;
        this.cropEndY = 0;
        this.isResizing = false;
        this.resizeStartX = 0;
        this.resizeStartY = 0;
        this.resizeScale = 1;
        this.dottedLineDash = [5, 5];
        this.uploadedImage = null;
        this.uploadedGif = null;
        this.gifFrame = 0;
        this.gifInterval = null;
        this.draggableElements = [];
        this.nftMinter = null;

        // Add pixel tracking for proper erasing
        this.drawnPixels = new Set(); // Track which pixels have been drawn
        this.baseCanvas = document.createElement('canvas'); // Store clean canvas state
        this.baseCanvas.width = this.canvas.width;
        this.baseCanvas.height = this.canvas.height;
        this.baseCtx = this.baseCanvas.getContext('2d');
        this.baseCtx.fillStyle = 'white';
        this.baseCtx.fillRect(0, 0, this.baseCanvas.width, this.baseCanvas.height);

        // Add new properties for drag and drop
        this.draggedElement = null;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.cropMode = false;
        this.cropSelection = null;
        this.isDragging = false;

        // Add new properties for double-click handling
        this.doubleClickTimeout = null;
        this.lastClickTime = 0;
        this.doubleClickThreshold = 300; // milliseconds
        this.selectedImage = null;
        this.baseDrawingImage = null; // Store the base drawing

        // Add text properties
        this.isAddingText = false;
        this.textContent = '';
        this.fontSize = 24;
        this.fontFamily = 'Arial';
        this.textX = 0;
        this.textY = 0;

        // Add element management properties
        this.elements = [];
        this.selectedElement = null;
        this.isDragging = false;
        this.isCropping = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.lastClickTime = 0;
        this.doubleClickThreshold = 300;

        // Add pixelated board properties
        this.isPixelatedMode = false;
        this.pixelSize = 20; // Size of each pixel
        this.pixelGrid = []; // 2D array to store pixel colors
        this.pixelCanvas = document.createElement('canvas');
        this.pixelCtx = this.pixelCanvas.getContext('2d');
        this.pixelColors = [
            // Primary Colors
            '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
            
            // Secondary Colors
            '#FF8000', '#8000FF', '#0080FF', '#FF0080', '#80FF00', '#00FF80',
            
            // Warm Colors
            '#FF4000', '#FF6000', '#FFA000', '#FFC000', '#FFE000', '#FFFF40',
            
            // Cool Colors
            '#0040FF', '#0060FF', '#0080FF', '#00A0FF', '#00C0FF', '#00E0FF',
            
            // Pastels
            '#FFB3B3', '#B3FFB3', '#B3B3FF', '#FFFFB3', '#FFB3FF', '#B3FFFF',
            
            // Earth Tones
            '#8B4513', '#A0522D', '#CD853F', '#DEB887', '#F5DEB3', '#F5F5DC',
            
            // Grayscale
            '#FFFFFF', '#F0F0F0', '#E0E0E0', '#D0D0D0', '#C0C0C0', '#B0B0B0',
            '#A0A0A0', '#909090', '#808080', '#707070', '#606060', '#505050',
            '#404040', '#303030', '#202020', '#101010', '#000000'
        ];
        this.selectedPixelColor = '#FF0000';

        // Initialize the canvas and tools
        this.setupCanvas();
        this.setupTools();
        this.setupEventListeners();
        
        // Initialize emoji picker immediately
        this.setupEmojiPicker();
        this.setupNFTMinting();
        this.setupMonanimalBuilder();

        // In constructor
        this.lastDot = null;
        this.actions = [];
        this.currentHistoryIndex = -1;
        // Only load from localStorage on first page load
        if (!window._whiteboardLoadedOnce) {
            const savedActions = localStorage.getItem('whiteboardActions');
            if (savedActions) {
                try {
                    this.actions = JSON.parse(savedActions);
                } catch (e) {
                    this.actions = [];
                }
            }
            window._whiteboardLoadedOnce = true;
        }
        // Only push initial state if history is empty
        if (this.history.length === 0) {
            this.saveState();
        }

        // Add to constructor
        this.isEyedropperActive = false;
        this.lastHoveredPixel = null;
    }

    setupCanvas() {
        // Set canvas dimensions
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        
        // Set drawing canvas dimensions
        this.drawingCanvas.width = this.canvas.width;
        this.drawingCanvas.height = this.canvas.height;
        
        // Set image canvas dimensions
        this.imageCanvas.width = this.canvas.width;
        this.imageCanvas.height = this.canvas.height;
        
        // Set pixel canvas dimensions
        this.pixelCanvas.width = this.canvas.width;
        this.pixelCanvas.height = this.canvas.height;
        
        // Fill drawing canvas with white
        this.drawingCtx.fillStyle = 'white';
        this.drawingCtx.fillRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        
        // Initialize drawing context properties
        this.drawingCtx.lineCap = 'round';
        this.drawingCtx.lineJoin = 'round';
        
        // Initialize pixel grid
        this.initializePixelGrid();
        
        this.redrawCanvas();
    }

    // Initialize pixel grid
    initializePixelGrid() {
        const cols = Math.ceil(this.canvas.width / this.pixelSize);
        const rows = Math.ceil(this.canvas.height / this.pixelSize);
        
        this.pixelGrid = [];
        for (let row = 0; row < rows; row++) {
            this.pixelGrid[row] = [];
            for (let col = 0; col < cols; col++) {
                this.pixelGrid[row][col] = '#FFFFFF'; // White by default
            }
        }
    }

    // Switch to pixelated mode
    enablePixelatedMode() {
        this.isPixelatedMode = true;
        this.canvas.classList.add('pixelated-mode-active');
        this.drawPixelGrid();
        this.setupPixelColorPicker();
        this.redrawCanvas();
    }

    // Switch back to whiteboard mode
    disablePixelatedMode() {
        this.isPixelatedMode = false;
        this.canvas.classList.remove('pixelated-mode-active');
        this.removePixelColorPicker();
        this.redrawCanvas();
    }

    // Draw the pixel grid
    drawPixelGrid() {
        this.pixelCtx.clearRect(0, 0, this.pixelCanvas.width, this.pixelCanvas.height);
        
        const cols = this.pixelGrid[0].length;
        const rows = this.pixelGrid.length;
        
        // Draw each pixel
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * this.pixelSize;
                const y = row * this.pixelSize;
                const color = this.pixelGrid[row][col];
                
                this.pixelCtx.fillStyle = color;
                this.pixelCtx.fillRect(x, y, this.pixelSize, this.pixelSize);
                
                // Draw grid lines
                this.pixelCtx.strokeStyle = '#E0E0E0';
                this.pixelCtx.lineWidth = 1;
                this.pixelCtx.strokeRect(x, y, this.pixelSize, this.pixelSize);
            }
        }

        if (this.lastHoveredPixel) {
            const { row, col } = this.lastHoveredPixel;
            if (row >= 0 && row < rows && col >= 0 && col < cols) {
                const hoverX = col * this.pixelSize;
                const hoverY = row * this.pixelSize;
                this.pixelCtx.fillStyle = this.selectedPixelColor;
                this.pixelCtx.globalAlpha = 0.5;
                this.pixelCtx.fillRect(hoverX, hoverY, this.pixelSize, this.pixelSize);
                this.pixelCtx.globalAlpha = 1.0;
                this.pixelCtx.strokeStyle = '#7b2ff2';
                this.pixelCtx.lineWidth = 2;
                this.pixelCtx.strokeRect(hoverX, hoverY, this.pixelSize, this.pixelSize);
            }
        }
    }

    // Handle pixel clicking
    handlePixelClick(x, y) {
        if (!this.isPixelatedMode) return;
        
        const col = Math.floor(x / this.pixelSize);
        const row = Math.floor(y / this.pixelSize);
        
        if (row >= 0 && row < this.pixelGrid.length && col >= 0 && col < this.pixelGrid[0].length) {
            // Normal pixel coloring only (no eyedropper logic)
            this.pixelGrid[row][col] = this.selectedPixelColor;
            this.drawPixelGrid();
            this.redrawCanvas();
            this.saveState(); // Save state after each pixel change
        }
    }

    // Handle pixel hover for visual feedback
    handlePixelHover(x, y) {
        if (!this.isPixelatedMode) return;
        
        const col = Math.floor(x / this.pixelSize);
        const row = Math.floor(y / this.pixelSize);
        
        if (row >= 0 && row < this.pixelGrid.length && col >= 0 && col < this.pixelGrid[0].length) {
            this.lastHoveredPixel = { row, col };
        } else {
            this.lastHoveredPixel = null;
        }
        this.drawPixelGrid();
        this.redrawCanvas();
    }

    // Setup pixel color picker UI
    setupPixelColorPicker() {
        // Remove existing color picker if any
        this.removePixelColorPicker();
        
        // Create color picker container
        const colorPickerContainer = document.createElement('div');
        colorPickerContainer.id = 'pixelColorPicker';
        colorPickerContainer.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: white;
            border: 2px solid #7b2ff2;
            border-radius: 12px;
            padding: 15px 15px 15px 15px;
            box-shadow: 0 4px 20px rgba(123,47,242,0.2);
            z-index: 10000;
            max-width: 600px;
            min-width: 180px;
            min-height: 120px;
            width: 280px;
            height: 420px;
            max-height: 80vh;
            overflow-y: auto;
            cursor: grab;
            resize: none;
            box-sizing: border-box;
        `;
        colorPickerContainer.setAttribute('draggable', 'false');

        // --- STATIC RESIZE HANDLES (STICKY) ---
        // Bottom-right handle
        const resizeHandleBR = document.createElement('div');
        resizeHandleBR.style.cssText = `
            position: sticky;
            float: right;
            right: 0;
            bottom: 0;
            width: 24px;
            height: 24px;
            cursor: se-resize;
            z-index: 10002;
            background: #f8f8ff;
            border-radius: 0 0 12px 0;
            display: flex;
            align-items: flex-end;
            justify-content: flex-end;
            border-top: 1px solid #eee;
            border-left: 1px solid #eee;
        `;
        // resizeHandleBR.innerHTML = `<svg width="18" height="18" style="opacity:0.5;" viewBox="0 0 18 18"><path d="M3 15h12M6 12h9M9 9h6" stroke="#7b2ff2" stroke-width="2"/></svg>`;
        // colorPickerContainer.appendChild(resizeHandleBR);

        // Top-left handle
        const resizeHandleTL = document.createElement('div');
        resizeHandleTL.style.cssText = `
            position: sticky;
            float: left;
            left: 0;
            top: 0;
            width: 24px;
            height: 24px;
            cursor: nw-resize;
            z-index: 10002;
            background: #f8f8ff;
            border-radius: 12px 0 0 0;
            display: flex;
            align-items: flex-start;
            justify-content: flex-start;
            border-bottom: 1px solid #eee;
            border-right: 1px solid #eee;
        `;
        resizeHandleTL.innerHTML = `<svg width="18" height="18" style="opacity:0.5;transform:rotate(180deg);" viewBox="0 0 18 18"><path d="M3 15h12M6 12h9M9 9h6" stroke="#7b2ff2" stroke-width="2"/></svg>`;
        colorPickerContainer.appendChild(resizeHandleTL);

        // --- Resize logic for both handles ---
        let isResizingBR = false, isResizingTL = false, startW = 0, startH = 0, startX = 0, startY = 0, startLeft = 0, startTop = 0;
        resizeHandleBR.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            isResizingBR = true;
            startW = colorPickerContainer.offsetWidth;
            startH = colorPickerContainer.offsetHeight;
            startX = e.clientX;
            startY = e.clientY;
            document.body.style.userSelect = 'none';
        });
        resizeHandleTL.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            isResizingTL = true;
            startW = colorPickerContainer.offsetWidth;
            startH = colorPickerContainer.offsetHeight;
            startX = e.clientX;
            startY = e.clientY;
            // For moving the panel as we resize from top-left
            const rect = colorPickerContainer.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
        });
        document.addEventListener('mousemove', (e) => {
            if (isResizingBR) {
                let newW = Math.max(180, Math.min(600, startW + (e.clientX - startX)));
                let newH = Math.max(120, startH + (e.clientY - startY));
                colorPickerContainer.style.width = newW + 'px';
                colorPickerContainer.style.height = newH + 'px';
            }
            if (isResizingTL) {
                let dx = e.clientX - startX;
                let dy = e.clientY - startY;
                let newW = Math.max(180, Math.min(600, startW - dx));
                let newH = Math.max(120, startH - dy);
                let newLeft = startLeft + dx;
                let newTop = startTop + dy;
                colorPickerContainer.style.width = newW + 'px';
                colorPickerContainer.style.height = newH + 'px';
                colorPickerContainer.style.left = newLeft + 'px';
                colorPickerContainer.style.top = newTop + 'px';
                colorPickerContainer.style.right = 'auto';
            }
        });
        document.addEventListener('mouseup', () => {
            if (isResizingBR || isResizingTL) {
                isResizingBR = false;
                isResizingTL = false;
                document.body.style.userSelect = '';
            }
        });

        // --- DRAGGABLE LOGIC ---
        let isDragging = false, dragOffsetX = 0, dragOffsetY = 0;
        colorPickerContainer.addEventListener('mousedown', (e) => {
            // Only drag if not clicking on a button/input
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'LABEL') return;
            isDragging = true;
            dragOffsetX = e.clientX - colorPickerContainer.getBoundingClientRect().left;
            dragOffsetY = e.clientY - colorPickerContainer.getBoundingClientRect().top;
            colorPickerContainer.style.cursor = 'grabbing';
        });
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                let newLeft = e.clientX - dragOffsetX;
                let newTop = e.clientY - dragOffsetY;
                // Clamp to viewport
                newLeft = Math.max(0, Math.min(window.innerWidth - colorPickerContainer.offsetWidth, newLeft));
                newTop = Math.max(0, Math.min(window.innerHeight - 40, newTop));
                colorPickerContainer.style.left = newLeft + 'px';
                colorPickerContainer.style.top = newTop + 'px';
                colorPickerContainer.style.right = 'auto';
            }
        });
        document.addEventListener('mouseup', () => {
            isDragging = false;
            colorPickerContainer.style.cursor = 'grab';
        });
        // Set initial position
        colorPickerContainer.style.left = '';
        colorPickerContainer.style.top = '100px';
        colorPickerContainer.style.right = '20px';

        // --- MINIMIZE BUTTON ---
        const minimizeBtn = document.createElement('button');
        minimizeBtn.innerHTML = '<span style="font-size:18px;">&minus;</span>';
        minimizeBtn.title = 'Minimize';
        minimizeBtn.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            width: 28px;
            height: 28px;
            background: #f0f0f0;
            color: #7b2ff2;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
            font-weight: bold;
            z-index: 10001;
        `;
        colorPickerContainer.appendChild(minimizeBtn);

        // Minimized state
        let minimized = false;
        const minimizedBtn = document.createElement('button');
        minimizedBtn.innerHTML = '<span style="font-size:20px;">🎨</span>';
        minimizedBtn.title = 'Show Color Palette';
        minimizedBtn.className = 'tool'; // Match sidebar tool style
        minimizedBtn.style.cssText = `
            display: none;
            background: rgba(107, 70, 193, 0.1);
            color: #7b2ff2;
            border: 1px solid var(--monad-border);
            padding: 0.75rem;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            transition: all 0.3s ease;
            margin: 0.5rem 0;
        `;
        // Find the left sidebar
        const toolsSidebar = document.querySelector('.tools-sidebar');
        // Add to sidebar but hidden initially
        if (toolsSidebar) toolsSidebar.appendChild(minimizedBtn);
        minimizedBtn.style.display = 'none'; // Always hide on initial load

        minimizeBtn.onclick = () => {
            colorPickerContainer.style.display = 'none';
            minimizedBtn.style.display = 'flex';
            minimized = true;
        };
        minimizedBtn.onclick = () => {
            colorPickerContainer.style.display = 'block';
            minimizedBtn.style.display = 'none'; // Always hide when restoring
            minimized = false;
        };

        // Add title
        const title = document.createElement('h3');
        title.textContent = 'Pixel Colors';
        title.style.cssText = `
            margin: 0 0 15px 0;
            color: #7b2ff2;
            font-size: 16px;
            text-align: center;
            font-weight: 600;
        `;
        colorPickerContainer.appendChild(title);
        
        // Create color grid with better organization
        const colorGrid = document.createElement('div');
        colorGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            gap: 6px;
            margin-bottom: 15px;
        `;
        
        // Color categories for better organization
        const colorCategories = [
            { name: 'Primary', colors: this.pixelColors.slice(0, 6) },
            { name: 'Secondary', colors: this.pixelColors.slice(6, 12) },
            { name: 'Warm', colors: this.pixelColors.slice(12, 18) },
            { name: 'Cool', colors: this.pixelColors.slice(18, 24) },
            { name: 'Pastels', colors: this.pixelColors.slice(24, 30) },
            { name: 'Earth', colors: this.pixelColors.slice(30, 36) },
            { name: 'Grays', colors: this.pixelColors.slice(36) }
        ];
        
        colorCategories.forEach(category => {
            // Add category label
            const categoryLabel = document.createElement('div');
            categoryLabel.textContent = category.name;
            categoryLabel.style.cssText = `
                grid-column: 1 / -1;
                font-size: 12px;
                font-weight: 600;
                color: #666;
                margin-top: 10px;
                margin-bottom: 5px;
                text-align: left;
                border-bottom: 1px solid #eee;
                padding-bottom: 3px;
            `;
            colorGrid.appendChild(categoryLabel);
            
            // Add colors for this category
            category.colors.forEach(color => {
                const colorBtn = document.createElement('div');
                colorBtn.className = 'pixel-color-btn';
                colorBtn.style.cssText = `
                    width: 24px;
                    height: 24px;
                    background-color: ${color};
                    border: 2px solid ${color === this.selectedPixelColor ? '#7b2ff2' : '#ddd'};
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                `;
                
                colorBtn.onclick = () => {
                    this.selectedPixelColor = color;
                    // Update all color buttons
                    colorGrid.querySelectorAll('.pixel-color-btn').forEach(btn => {
                        btn.style.borderColor = '#ddd';
                        btn.style.transform = 'scale(1)';
                    });
                    colorBtn.style.borderColor = '#7b2ff2';
                    colorBtn.style.transform = 'scale(1.1)';
                };
                
                colorBtn.onmouseenter = () => {
                    if (color !== this.selectedPixelColor) {
                        colorBtn.style.transform = 'scale(1.05)';
                        colorBtn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
                    }
                };
                
                colorBtn.onmouseleave = () => {
                    if (color !== this.selectedPixelColor) {
                        colorBtn.style.transform = 'scale(1)';
                        colorBtn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    }
                };
                
                colorGrid.appendChild(colorBtn);
            });
        });
        
        colorPickerContainer.appendChild(colorGrid);
        
        // Add custom color picker
        const customColorLabel = document.createElement('label');
        customColorLabel.textContent = 'Custom Color:';
        customColorLabel.style.cssText = `
            display: block;
            margin-bottom: 8px;
            font-size: 13px;
            color: #666;
            font-weight: 600;
        `;
        colorPickerContainer.appendChild(customColorLabel);
        
        const customColorInput = document.createElement('input');
        customColorInput.type = 'color';
        customColorInput.value = this.selectedPixelColor;
        customColorInput.style.cssText = `
            width: 100%;
            height: 35px;
            border: 2px solid #ddd;
            border-radius: 6px;
            cursor: pointer;
            background: white;
        `;
        
        customColorInput.onchange = (e) => {
            this.selectedPixelColor = e.target.value;
        };
        
        colorPickerContainer.appendChild(customColorInput);
        
        // Add pixel size indicator and controls
        const pixelSizeLabel = document.createElement('label');
        pixelSizeLabel.textContent = 'Pixel Size:';
        pixelSizeLabel.style.cssText = `
            display: block;
            margin-top: 15px;
            margin-bottom: 8px;
            font-size: 13px;
            color: #666;
            font-weight: 600;
        `;
        colorPickerContainer.appendChild(pixelSizeLabel);
        
        const pixelSizeContainer = document.createElement('div');
        pixelSizeContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
        `;
        
        const decreaseBtn = document.createElement('button');
        decreaseBtn.textContent = '-';
        decreaseBtn.style.cssText = `
            width: 30px;
            height: 30px;
            background: #7b2ff2;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
        `;
        
        const pixelSizeDisplay = document.createElement('span');
        pixelSizeDisplay.textContent = `${this.pixelSize}px`;
        pixelSizeDisplay.style.cssText = `
            font-size: 14px;
            font-weight: 600;
            color: #333;
            min-width: 50px;
            text-align: center;
        `;
        
        const increaseBtn = document.createElement('button');
        increaseBtn.textContent = '+';
        increaseBtn.style.cssText = `
            width: 30px;
            height: 30px;
            background: #7b2ff2;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
        `;
        
        const updatePixelSize = (newSize) => {
            this.pixelSize = newSize;
            pixelSizeDisplay.textContent = `${this.pixelSize}px`;
            this.initializePixelGrid();
            this.drawPixelGrid();
            this.redrawCanvas();
        };
        
        decreaseBtn.onclick = () => {
            const newSize = Math.max(8, this.pixelSize - 2);
            updatePixelSize(newSize);
        };
        
        increaseBtn.onclick = () => {
            const newSize = Math.min(50, this.pixelSize + 2);
            updatePixelSize(newSize);
        };
        
        pixelSizeContainer.appendChild(decreaseBtn);
        pixelSizeContainer.appendChild(pixelSizeDisplay);
        pixelSizeContainer.appendChild(increaseBtn);
        colorPickerContainer.appendChild(pixelSizeContainer);
        
        // Add mode toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = 'Switch to Whiteboard';
        toggleBtn.style.cssText = `
            width: 100%;
            margin-top: 15px;
            padding: 10px;
            background: #7b2ff2;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            transition: background 0.2s ease;
        `;
        
        toggleBtn.onmouseenter = () => {
            toggleBtn.style.background = '#6a1fb2';
        };
        
        toggleBtn.onmouseleave = () => {
            toggleBtn.style.background = '#7b2ff2';
        };
        
        toggleBtn.onclick = () => {
            this.disablePixelatedMode();
        };
        
        colorPickerContainer.appendChild(toggleBtn);
        
        document.body.appendChild(colorPickerContainer);
    }

    // Remove pixel color picker
    removePixelColorPicker() {
        const existingPicker = document.getElementById('pixelColorPicker');
        if (existingPicker) {
            existingPicker.remove();
        }
        // Also hide minimized button if it exists (robust: check entire document)
        document.querySelectorAll('button[title="Show Color Palette"]').forEach(btn => {
            btn.style.display = 'none';
        });
    }

    setupEventListeners() {
        // Mouse events for drawing
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            let clickedOnHandle = false;
            // 1. Handle logic for handles (rotate/delete)
            if (this.selectedElement) {
                const bounds = this.getElementBounds(this.selectedElement);
                const cx = this.selectedElement.x + bounds.width/2;
                const cy = this.selectedElement.y + bounds.height/2;
                const angle = this.selectedElement.rotation || 0;
                const relX = Math.cos(-angle) * (x - cx) - Math.sin(-angle) * (y - cy);
                const relY = Math.sin(-angle) * (x - cx) + Math.cos(-angle) * (y - cy);
                // Rotation handle
                const handleRadius = 16;
                const handleOffset = 40;
                const handleX = 0;
                const handleY = -bounds.height/2 - handleOffset;
                if (Math.hypot(relX - handleX, relY - handleY) < handleRadius) {
                    isRotating = true;
                    rotateElement = this.selectedElement;
                    rotateStartAngle = Math.atan2(y - cy, x - cx) - (this.selectedElement.rotation || 0);
                    clickedOnHandle = true;
                    return;
                }
                // Delete button
                const deleteRadius = 16;
                const deleteX = bounds.width/2 + 10;
                const deleteY = -bounds.height/2 - 10;
                if (Math.hypot(relX - deleteX, relY - deleteY) < deleteRadius) {
                    // Delete the selected element
                    this.elements = this.elements.filter(el => el !== this.selectedElement);
                    this.selectedElement = null;
                    this.isDragging = false;
                    this.isCropping = false;
                    this.isDrawing = false;
                    this.redrawCanvas();
                    this.saveState();
                    clickedOnHandle = true;
                    return;
                }
            }
            // 2. If clicking on an element (not a handle), select and start crop/resize
            const element = this.findElementAtPosition(x, y);
            if (element && !clickedOnHandle) {
                if (["crop", "resize"].includes(this.currentTool)) {
                    this.selectedElement = element;
                    this.isDragging = this.currentTool === "resize";
                    this.isCropping = this.currentTool === "crop";
                    this.dragStartX = x - element.x;
                    this.dragStartY = y - element.y;
                    this.redrawCanvas();
                    return;
                }
                // (other tool logic can go here if needed)
            }
            // 3. If clicking empty space, clear selection
            if (!element && !clickedOnHandle) {
                this.selectedElement = null;
                this.isDragging = false;
                this.isCropping = false;
                this.isDrawing = false;
                this.redrawCanvas();
            }
            // (rest of your mousedown logic for drawing, etc.)
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Handle pixel hover in pixelated mode
            if (this.isPixelatedMode) {
                this.handlePixelHover(x, y);
                return;
            }

            // Crop/Resize logic for images, emojis, text, and monanimal characters
            if ((this.isCropping || this.isDragging) && this.selectedElement && (this.selectedElement.type === 'image' || this.selectedElement.type === 'emoji' || this.selectedElement.type === 'text' || this.selectedElement.type === 'monanimal')) {
                if (this.isDragging) {
                    // Resize: update width/height based on mouse position
                    const newWidth = Math.max(10, x - this.selectedElement.x);
                    const newHeight = Math.max(10, y - this.selectedElement.y);
                    this.selectedElement.width = newWidth;
                    this.selectedElement.height = newHeight;
                    console.log('Resizing', this.selectedElement.type, 'to', newWidth, newHeight);
                } else if (this.isCropping) {
                    // Crop: update position and size (simple drag for now)
                    this.selectedElement.x = x - this.dragStartX;
                    this.selectedElement.y = y - this.dragStartY;
                    console.log('Cropping/moving', this.selectedElement.type, 'to', this.selectedElement.x, this.selectedElement.y);
                }
                this.redrawCanvas();
                return;
            }

            // Default move logic
            if (this.isDrawing) {
                this.draw(e);
                this.lastX = x;
                this.lastY = y;
                return;
            }

            if (this.selectedElement) {
                if (this.isDragging) {
                    this.selectedElement.x = x - this.dragStartX;
                    this.selectedElement.y = y - this.dragStartY;
                } else if (this.isCropping) {
                    const dx = x - (this.selectedElement.x + this.selectedElement.width/2);
                    const dy = y - (this.selectedElement.y + this.selectedElement.height/2);
                    const scale = Math.max(0.1, Math.sqrt(dx*dx + dy*dy) / Math.sqrt(this.selectedElement.width*this.selectedElement.width/4 + this.selectedElement.height*this.selectedElement.height/4));
                    this.selectedElement.scale = scale;
                }
                this.redrawCanvas();
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            if (this.isDrawing) {
                this.isDrawing = false;
                this.saveState();
            } else if (this.isDragging || this.isCropping) {
                this.saveState();
            }
            this.isDragging = false;
            this.isCropping = false;
            this.lastDot = null;
            this.currentAction = null;
            // Do NOT clear selectedElement; keep it for further edits
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isDrawing = false;
            this.isDragging = false;
            this.lastHoveredPixel = null;
            this.drawPixelGrid();
            this.redrawCanvas();
        });

        // Touch events for mobile support
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        });

        // Tool controls
        const colorPicker = document.getElementById('colorPicker');
        if (colorPicker) {
            colorPicker.addEventListener('input', (e) => {
                this.color = e.target.value;
            });
        }

        const sizeSlider = document.getElementById('sizeSlider');
        if (sizeSlider) {
            sizeSlider.addEventListener('input', (e) => {
                this.size = parseInt(e.target.value);
            });
        }

        // File upload handlers
        const uploadImageBtn = document.getElementById('uploadImage');
        const imageInput = document.getElementById('imageInput');
        if (uploadImageBtn && imageInput) {
            uploadImageBtn.addEventListener('click', () => {
                console.log('Upload button clicked');
                imageInput.value = '';
                imageInput.click();
            });

            imageInput.addEventListener('change', (e) => {
                console.log('Image input changed');
                const file = e.target.files[0];
                if (file) {
                    this.handleImageUpload(file);
                }
            });
        }

        // GIF upload handler
        const uploadGifBtn = document.getElementById('uploadGif');
        const gifInput = document.getElementById('gifInput');
        if (uploadGifBtn && gifInput) {
            uploadGifBtn.addEventListener('click', () => {
                gifInput.click();
            });

            gifInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const img = new Image();
                        img.onload = () => {
                            this.uploadedGif = img;
                            this.startGifAnimation();
                        };
                        img.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Save and clear handlers
        const savePNGBtn = document.getElementById('savePNG');
        if (savePNGBtn) {
            savePNGBtn.addEventListener('click', () => {
                this.saveImage('png');
            });
        }

        const saveJPGBtn = document.getElementById('saveJPG');
        if (saveJPGBtn) {
            saveJPGBtn.addEventListener('click', () => {
                this.saveImage('jpeg');
            });
        }

        const clearBtn = document.getElementById('clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearCanvas();
            });
        }

        // Undo/Redo handlers
        const undoBtn = document.getElementById('undo');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                this.undo();
            });
        }

        const redoBtn = document.getElementById('redo');
        if (redoBtn) {
            redoBtn.addEventListener('click', () => {
                this.redo();
            });
        }

        this.canvas.addEventListener('click', (e) => {
            if (this.currentTool === 'text' && this.textContent) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.addText(x, y);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+Z for undo
            if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }
            
            // Ctrl+Shift+Z or Ctrl+Y for redo
            if ((e.ctrlKey && e.shiftKey && e.key === 'Z') || (e.ctrlKey && e.key === 'y')) {
                e.preventDefault();
                this.redo();
            }
            
            // Ctrl+Shift+S to show SVG size info
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                this.showSVGSizeInfo();
            }
            
            // Pixel size adjustment in pixelated mode
            if (this.isPixelatedMode) {
                if (e.key === '+' || e.key === '=') {
                    e.preventDefault();
                    this.pixelSize = Math.min(50, this.pixelSize + 2);
                    this.initializePixelGrid();
                    this.drawPixelGrid();
                    this.redrawCanvas();
                } else if (e.key === '-') {
                    e.preventDefault();
                    this.pixelSize = Math.max(8, this.pixelSize - 2);
                    this.initializePixelGrid();
                    this.drawPixelGrid();
                    this.redrawCanvas();
                }
            }
        });

        // Mouse wheel for pixel size adjustment in pixelated mode - DISABLED
        // this.canvas.addEventListener('wheel', (e) => {
        //     if (this.isPixelatedMode) {
        //         e.preventDefault();
        //         const delta = e.deltaY > 0 ? -2 : 2;
        //         const newSize = Math.max(8, Math.min(50, this.pixelSize + delta));
        //         if (newSize !== this.pixelSize) {
        //             this.pixelSize = newSize;
        //             this.initializePixelGrid();
        //             this.drawPixelGrid();
        //             this.redrawCanvas();
        //             
        //             // Update pixel size display if color picker is open
        //             const pixelSizeDisplay = document.querySelector('#pixelColorPicker span');
        //             if (pixelSizeDisplay && pixelSizeDisplay.textContent.includes('px')) {
        //                 pixelSizeDisplay.textContent = `${this.pixelSize}px`;
        //             }
        //         }
        //     }
        // });

        // --- In setupEventListeners, improve handle hit detection and tool state reset ---
        let isRotating = false;
        let rotateStartAngle = 0;
        let rotateElement = null;

        this.canvas.addEventListener('mousedown', (e) => {
            if (!this.selectedElement) return;
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const bounds = this.getElementBounds(this.selectedElement);
            // Center of element
            const cx = this.selectedElement.x + bounds.width/2;
            const cy = this.selectedElement.y + bounds.height/2;
            const angle = this.selectedElement.rotation || 0;
            // Calculate mouse position relative to element center, rotated
            const relX = Math.cos(-angle) * (x - cx) - Math.sin(-angle) * (y - cy);
            const relY = Math.sin(-angle) * (x - cx) + Math.cos(-angle) * (y - cy);
            // Rotation handle (above element)
            const handleRadius = 16;
            const handleOffset = 40;
            const handleX = 0;
            const handleY = -bounds.height/2 - handleOffset;
            if (Math.hypot(relX - handleX, relY - handleY) < handleRadius) {
                isRotating = true;
                rotateElement = this.selectedElement;
                rotateStartAngle = Math.atan2(y - cy, x - cx) - (this.selectedElement.rotation || 0);
                return;
            }
            // Delete button (top-right corner)
            const deleteRadius = 16;
            const deleteX = bounds.width/2 + 10;
            const deleteY = -bounds.height/2 - 10;
            if (Math.hypot(relX - deleteX, relY - deleteY) < deleteRadius) {
                // Delete the selected element
                this.elements = this.elements.filter(el => el !== this.selectedElement);
                this.selectedElement = null;
                this.isDragging = false;
                this.isCropping = false;
                this.isDrawing = false;
                this.redrawCanvas();
                this.saveState();
                // Reset tool state to allow further actions
                // (Keep currentTool as is, but clear selection)
                return;
            }
        });
        this.canvas.addEventListener('mousemove', (e) => {
            if (isRotating && rotateElement) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const bounds = this.getElementBounds(rotateElement);
                const cx = rotateElement.x + bounds.width/2;
                const cy = rotateElement.y + bounds.height/2;
                rotateElement.rotation = Math.atan2(y - cy, x - cx) - rotateStartAngle;
                this.redrawCanvas();
            }
        });
        this.canvas.addEventListener('mouseup', () => {
            if (isRotating) {
                isRotating = false;
                rotateElement = null;
                this.saveState();
            }
        });
        // --- End improved handle logic ---
    }

    setupTools() {
        // Drawing tools
        const tools = {
            'pencil': () => {
                this.clearActiveStates();
                this.currentTool = 'pencil';
                document.getElementById('pencil').classList.add('active');
                document.getElementById('textToolPopover').style.display = 'none';
            },
            'brush': () => {
                this.clearActiveStates();
                this.currentTool = 'brush';
                document.getElementById('brush').classList.add('active');
                document.getElementById('textToolPopover').style.display = 'none';
            },
            'spray': () => {
                this.clearActiveStates();
                this.currentTool = 'spray';
                document.getElementById('spray').classList.add('active');
                document.getElementById('textToolPopover').style.display = 'none';
            },
            'eraser': () => {
                this.clearActiveStates();
                this.currentTool = 'eraser';
                document.getElementById('eraser').classList.add('active');
                document.getElementById('textToolPopover').style.display = 'none';
            },
            'text': () => {
                this.clearActiveStates();
                this.currentTool = 'text';
                document.getElementById('text').classList.add('active');
                document.getElementById('textToolPopover').style.display = 'flex';
            },
            'blur': () => {
                this.clearActiveStates();
                this.currentTool = 'blur';
                document.getElementById('blur').classList.add('active');
                document.getElementById('textToolPopover').style.display = 'none';
            },
            'smudge': () => {
                this.clearActiveStates();
                this.currentTool = 'smudge';
                document.getElementById('smudge').classList.add('active');
                document.getElementById('textToolPopover').style.display = 'none';
            },
            'dotted': () => {
                this.clearActiveStates();
                this.currentTool = 'dotted';
                document.getElementById('dotted').classList.add('active');
                document.getElementById('textToolPopover').style.display = 'none';
            },
            'crop': () => {
                this.clearActiveStates();
                this.currentTool = 'crop';
                document.getElementById('crop').classList.add('active');
                document.getElementById('textToolPopover').style.display = 'none';
                this.startCropMode();
            },
            'resize': () => {
                this.clearActiveStates();
                this.currentTool = 'resize';
                document.getElementById('resize').classList.add('active');
                document.getElementById('textToolPopover').style.display = 'none';
                this.startResizeMode();
            }
        };

        // Add event listeners to all tools
        Object.keys(tools).forEach(toolId => {
            const toolElement = document.getElementById(toolId);
            if (toolElement) {
                toolElement.addEventListener('click', tools[toolId]);
            }
        });

        // Setup text controls
        const textInput = document.getElementById('textInput');
        const fontFamily = document.getElementById('fontFamily');
        const fontSize = document.getElementById('fontSize');
        const fontSizeValue = document.getElementById('fontSizeValue');

        if (textInput) {
            textInput.addEventListener('input', (e) => {
                this.textContent = e.target.value;
            });
        }

        if (fontFamily) {
            fontFamily.addEventListener('change', (e) => {
                this.fontFamily = e.target.value;
            });
        }

        if (fontSize) {
            fontSize.addEventListener('input', (e) => {
                this.fontSize = parseInt(e.target.value);
                fontSizeValue.textContent = `${this.fontSize}px`;
            });
        }
    }

    clearActiveStates() {
        // Clear all active states
        document.querySelectorAll('.tool').forEach(tool => {
            tool.classList.remove('active');
        });
        
        // Reset drawing state
        this.isDrawing = false;
        this.isDragging = false;
        this.isCropping = false;
        this.isResizing = false;
        this.selectedImage = null;
        this.isAddingText = false;
        
        // Reset element selection
        this.selectedElement = null;
        
        // Reset drawing tool state
        if (['pencil', 'brush', 'spray', 'eraser', 'blur', 'smudge', 'dotted'].includes(this.currentTool)) {
            this.isDrawing = false;
        }
    }

    setupEmojiPicker() {
        console.log('Setting up emoji picker...');
        
        // Get elements and log their existence
        const emojiPicker = document.getElementById('emojiPicker');
        const emojiContainer = document.getElementById('emojiContainer');
        const emojiGrid = document.querySelector('.emoji-grid');

        console.log('Found elements:', {
            emojiPicker: emojiPicker ? 'Found' : 'Not found',
            emojiContainer: emojiContainer ? 'Found' : 'Not found',
            emojiGrid: emojiGrid ? 'Found' : 'Not found'
        });

        if (!emojiPicker || !emojiContainer || !emojiGrid) {
            console.error('Missing required elements:', {
                emojiPicker: emojiPicker,
                emojiContainer: emojiContainer,
                emojiGrid: emojiGrid
            });
            return;
        }

        // Clear and populate emoji grid with purple-themed emojis
        emojiGrid.innerHTML = '';
        const emojis = [
            '💜', '🟣', '☂️', '🔮', '👾', '🎆', '🌂', '🪀', '🎪', '🦄',
            '🌸', '🍇', '💫', '⚡', '🌌', '🎭', '🎨', '🎰', '🎮', '🎲',
            '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '✨', '⭐',
            '🌟', '💫', '🎇', '🎆', '🔮', '🪄', '🎭', '👻', '🦹', '🧙‍♀️'
        ];
        
        emojis.forEach(emoji => {
            const button = document.createElement('button');
            button.textContent = emoji;
            button.title = emoji;
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.addEmoji(emoji);
                emojiContainer.classList.remove('visible');
                emojiContainer.style.display = 'none';
            });
            emojiGrid.appendChild(button);
        });

        console.log('Adding click listener to emoji picker button');
        
        // Remove any existing click listeners
        const newEmojiPicker = emojiPicker.cloneNode(true);
        emojiPicker.parentNode.replaceChild(newEmojiPicker, emojiPicker);
        
        // Add click listener
        newEmojiPicker.addEventListener('click', (e) => {
            console.log('Emoji picker clicked - before handling');
            e.preventDefault();
            e.stopPropagation();
            
            const wasVisible = emojiContainer.classList.contains('visible');
            console.log('Was visible before:', wasVisible);
            
            emojiContainer.classList.toggle('visible');
            
            const isVisible = emojiContainer.classList.contains('visible');
            console.log('Is visible after:', isVisible);
            
            // Force display style
            emojiContainer.style.display = isVisible ? 'flex' : 'none';
            
            console.log('Current container state:', {
                classList: emojiContainer.classList.toString(),
                display: emojiContainer.style.display,
                computedDisplay: window.getComputedStyle(emojiContainer).display
            });
        });

        console.log('Click listener added successfully');
        
        // Close emoji picker when clicking outside
        document.addEventListener('click', (e) => {
            if (emojiContainer.classList.contains('visible') && 
                !emojiContainer.contains(e.target) && 
                e.target !== newEmojiPicker) {
                emojiContainer.classList.remove('visible');
                emojiContainer.style.display = 'none';
            }
        });

        // Prevent clicks inside the emoji container from closing it
        emojiContainer.addEventListener('click', (e) => {
            if (e.target === emojiContainer) {
                emojiContainer.classList.remove('visible');
                emojiContainer.style.display = 'none';
            } else {
                e.stopPropagation();
            }
        });
    }

    addEmoji(emoji) {
        const element = {
            type: 'emoji',
            content: emoji,
            x: this.canvas.width / 2 - 25,
            y: this.canvas.height / 2 - 25,
            width: 50,
            height: 50,
            rotation: 0,
            scale: 1
        };
        this.elements.push(element);
        this.redrawCanvas();
        this.saveState();
    }

    draw(e) {
        if (!this.isDrawing) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        switch (this.currentTool) {
            case 'pencil':
                this.drawPencil(x, y);
                break;
            case 'brush':
                this.drawBrush(x, y);
                break;
            case 'spray':
                this.drawSpray(x, y);
                break;
            case 'eraser':
                this.drawEraser(x, y);
                break;
            case 'blur':
                this.applyBlur(x, y);
                break;
            case 'smudge':
                this.applySmudge(x, y);
                break;
            case 'dotted':
                this.drawDottedLine(x, y);
                break;
        }
    }

    drawPencil(x, y) {
        this.drawingCtx.beginPath();
        this.drawingCtx.moveTo(this.lastX, this.lastY);
        this.drawingCtx.lineTo(x, y);
        this.drawingCtx.strokeStyle = this.color;
        this.drawingCtx.lineWidth = this.size;
        this.drawingCtx.stroke();
        this.redrawCanvas();

        if (!this.currentAction) {
            this.currentAction = {
                type: 'pencil',
                color: this.color,
                size: this.size,
                points: [{x: this.lastX, y: this.lastY}]
            };
            this.actions.push(this.currentAction);
        }
        this.currentAction.points.push({x, y});
        this.saveActionsToStorage();
    }

    drawBrush(x, y) {
        this.drawingCtx.beginPath();
        this.drawingCtx.moveTo(this.lastX, this.lastY);
        this.drawingCtx.lineTo(x, y);
        this.drawingCtx.strokeStyle = this.color;
        this.drawingCtx.lineWidth = this.size * 2;
        this.drawingCtx.stroke();
        this.redrawCanvas();
    }

    drawSpray(x, y) {
        const density = 50;
        const radius = this.size * 2;

        this.drawingCtx.fillStyle = this.color;
        for (let i = 0; i < density; i++) {
            const offsetX = (Math.random() * 2 - 1) * radius;
            const offsetY = (Math.random() * 2 - 1) * radius;
            const sprayX = x + offsetX;
            const sprayY = y + offsetY;

            this.drawingCtx.beginPath();
            this.drawingCtx.arc(sprayX, sprayY, 1, 0, Math.PI * 2);
            this.drawingCtx.fill();
        }
        this.redrawCanvas();
    }

    drawEraser(x, y) {
        this.drawingCtx.save();
        this.drawingCtx.beginPath();
        this.drawingCtx.arc(x, y, this.size * 2, 0, Math.PI * 2);
        this.drawingCtx.globalCompositeOperation = 'destination-out';
        this.drawingCtx.fillStyle = 'rgba(255, 255, 255, 1)';
        this.drawingCtx.fill();
        this.drawingCtx.restore();
        this.redrawCanvas();
    }

    drawDottedLine(x, y) {
        const dotSpacing = Math.max(4, this.size * 2);
        const dotRadius = Math.max(1, this.size / 2);
        if (!this.lastDot) {
            this.lastDot = { x: this.lastX, y: this.lastY };
        }
        let prevX = this.lastDot.x;
        let prevY = this.lastDot.y;
        const dx = x - prevX;
        const dy = y - prevY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance === 0) return;
        const steps = Math.floor(distance / dotSpacing);
        for (let i = 1; i <= steps; i++) {
            const t = i * dotSpacing / distance;
            const dotX = prevX + dx * t;
            const dotY = prevY + dy * t;
            this.drawingCtx.beginPath();
            this.drawingCtx.arc(dotX, dotY, dotRadius, 0, 2 * Math.PI);
            this.drawingCtx.fillStyle = this.color;
            this.drawingCtx.fill();
            this.lastDot = { x: dotX, y: dotY };
        }
        this.redrawCanvas();
    }

    applyBlur(x, y) {
        const imageData = this.drawingCtx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        const radius = this.blurRadius;
        
        for (let i = 0; i < data.length; i += 4) {
            const pixelX = (i / 4) % this.canvas.width;
            const pixelY = Math.floor((i / 4) / this.canvas.width);
            
            if (Math.abs(pixelX - x) < radius && Math.abs(pixelY - y) < radius) {
                const distance = Math.sqrt(Math.pow(pixelX - x, 2) + Math.pow(pixelY - y, 2));
                if (distance < radius) {
                    const blurFactor = 1 - (distance / radius);
                    data[i] = data[i] * (1 - blurFactor) + 255 * blurFactor;
                    data[i + 1] = data[i + 1] * (1 - blurFactor) + 255 * blurFactor;
                    data[i + 2] = data[i + 2] * (1 - blurFactor) + 255 * blurFactor;
                }
            }
        }
        
        this.drawingCtx.putImageData(imageData, 0, 0);
        this.redrawCanvas();
    }

    applySmudge(x, y) {
        const radius = this.smudgeRadius;
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = radius * 2;
        tempCanvas.height = radius * 2;

        // Get the area around the cursor from drawing canvas
        const imageData = this.drawingCtx.getImageData(
            Math.max(0, x - radius),
            Math.max(0, y - radius),
            Math.min(radius * 2, this.canvas.width - x + radius),
            Math.min(radius * 2, this.canvas.height - y + radius)
        );

        // Create a temporary canvas with the image data
        tempCtx.putImageData(imageData, 0, 0);

        // Apply a simple blur effect
        const tempImageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = tempImageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 0) {
                data[i] = Math.max(0, data[i] - 10);
                data[i + 1] = Math.max(0, data[i + 1] - 10);
                data[i + 2] = Math.max(0, data[i + 2] - 10);
                data[i + 3] = Math.max(0, data[i + 3] - 20);
            }
        }
        
        tempCtx.putImageData(tempImageData, 0, 0);

        // Draw the smudged area back to drawing canvas
        const offsetX = (Math.random() - 0.5) * 3;
        const offsetY = (Math.random() - 0.5) * 3;
        
        this.drawingCtx.globalCompositeOperation = 'source-over';
        this.drawingCtx.drawImage(
            tempCanvas,
            x - radius + offsetX,
            y - radius + offsetY
        );
        
        // Update display
        this.redrawCanvas();
    }

    startCropMode() {
        this.isCropping = true;
        this.cropStartX = 0;
        this.cropStartY = 0;
        this.cropEndX = 0;
        this.cropEndY = 0;
    }

    exitCropMode() {
        this.isCropping = false;
    }

    startResizeMode() {
        this.isResizing = true;
        this.resizeStartX = 0;
        this.resizeStartY = 0;
        this.resizeScale = 1;
    }

    exitResizeMode() {
        this.isResizing = false;
    }

    startMovingCrop(e) {
        const cropOverlay = document.getElementById('cropOverlay');
        const startX = e.clientX;
        const startY = e.clientY;
        const startLeft = parseInt(cropOverlay.style.left);
        const startTop = parseInt(cropOverlay.style.top);

        const moveCrop = (e) => {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            cropOverlay.style.left = `${startLeft + dx}px`;
            cropOverlay.style.top = `${startTop + dy}px`;
        };

        const stopMoving = () => {
            document.removeEventListener('mousemove', moveCrop);
            document.removeEventListener('mouseup', stopMoving);
        };

        document.addEventListener('mousemove', moveCrop);
        document.addEventListener('mouseup', stopMoving);
    }

    startResizing(e, handle) {
        const cropOverlay = document.getElementById('cropOverlay');
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = parseInt(cropOverlay.style.width);
        const startHeight = parseInt(cropOverlay.style.height);
        const startLeft = parseInt(cropOverlay.style.left);
        const startTop = parseInt(cropOverlay.style.top);

        const resize = (e) => {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            if (handle.classList.contains('top-left')) {
                cropOverlay.style.left = `${startLeft + dx}px`;
                cropOverlay.style.top = `${startTop + dy}px`;
                cropOverlay.style.width = `${startWidth - dx}px`;
                cropOverlay.style.height = `${startHeight - dy}px`;
            } else if (handle.classList.contains('top-right')) {
                cropOverlay.style.top = `${startTop + dy}px`;
                cropOverlay.style.width = `${startWidth + dx}px`;
                cropOverlay.style.height = `${startHeight - dy}px`;
            } else if (handle.classList.contains('bottom-left')) {
                cropOverlay.style.left = `${startLeft + dx}px`;
                cropOverlay.style.width = `${startWidth - dx}px`;
                cropOverlay.style.height = `${startHeight + dy}px`;
            } else if (handle.classList.contains('bottom-right')) {
                cropOverlay.style.width = `${startWidth + dx}px`;
                cropOverlay.style.height = `${startHeight + dy}px`;
            }
        };

        const stopResizing = () => {
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResizing);
        };

        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResizing);
    }

    startGifAnimation() {
        if (this.gifInterval) {
            clearInterval(this.gifInterval);
        }

        const element = {
            type: 'gif',
            image: this.uploadedGif,
            x: 0,
            y: 0,
            width: this.canvas.width,
            height: this.canvas.height
        };
        this.draggableElements.push(element);

        this.gifInterval = setInterval(() => {
            this.redrawCanvas();
        }, 100);
    }

    saveState() {
        // Save current state to history
        const state = {
            drawingCanvas: this.drawingCanvas.toDataURL(),
            elements: JSON.parse(JSON.stringify(this.elements)),
            actions: JSON.parse(JSON.stringify(this.actions)),
            pixelGrid: this.isPixelatedMode ? JSON.parse(JSON.stringify(this.pixelGrid)) : null
            // Do NOT store isPixelatedMode in history
        };
        // Remove any states after current index
        this.history = this.history.slice(0, this.currentHistoryIndex + 1);
        // Prevent duplicate states (compare to last state)
        const lastState = this.history[this.history.length - 1];
        if (lastState &&
            lastState.drawingCanvas === state.drawingCanvas &&
            JSON.stringify(lastState.elements) === JSON.stringify(state.elements) &&
            JSON.stringify(lastState.actions) === JSON.stringify(state.actions) &&
            JSON.stringify(lastState.pixelGrid) === JSON.stringify(state.pixelGrid)
        ) {
            // No change, don't push duplicate
            return;
        }
        // Add new state
        this.history.push(state);
        this.currentHistoryIndex++;
        // Limit history size to prevent memory issues
        if (this.history.length > 50) {
            this.history.shift();
            this.currentHistoryIndex--;
        }
        // Save to localStorage
        this.saveActionsToStorage();
    }

    undo() {
        if (this.currentHistoryIndex > 0) {
            this.currentHistoryIndex--;
            this.restoreState(this.history[this.currentHistoryIndex]);
        }
    }

    redo() {
        if (this.currentHistoryIndex < this.history.length - 1) {
            this.currentHistoryIndex++;
            this.restoreState(this.history[this.currentHistoryIndex]);
        }
    }

    restoreState(state) {
        // Restore drawing canvas
        const img = new Image();
        img.onload = () => {
            this.drawingCtx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
            this.drawingCtx.drawImage(img, 0, 0);
            // Redraw after image is loaded
            this.redrawCanvas();
        };
        img.src = state.drawingCanvas;
        // Restore elements
        this.elements = state.elements || [];
        // Restore actions
        this.actions = state.actions || [];
        // Restore pixel grid if in pixelated mode
        if (this.isPixelatedMode) {
            if (state.pixelGrid) {
                this.pixelGrid = state.pixelGrid;
                this.drawPixelGrid();
            } else {
                // If no pixelGrid in state, clear the grid
                this.initializePixelGrid();
                this.drawPixelGrid();
            }
        }
        // Do NOT switch mode based on undo/redo
        // this.redrawCanvas(); // Now called after image load
    }

    saveImage(format) {
        const link = document.createElement('a');
        link.download = `whiteboard.${format}`;
        link.href = this.canvas.toDataURL(`image/${format}`);
        link.click();
    }

    findElementAtPosition(x, y) {
        // Search in reverse order (top to bottom)
        for (let i = this.elements.length - 1; i >= 0; i--) {
            const element = this.elements[i];
            const bounds = this.getElementBounds(element);
            
            if (x >= bounds.x && x <= bounds.x + bounds.width &&
                y >= bounds.y && y <= bounds.y + bounds.height) {
                return element;
            }
        }
        return null;
    }

    getElementBounds(element) {
        const scale = element.scale || 1;
        return {
            x: element.x,
            y: element.y,
            width: element.width * scale,
            height: element.height * scale
        };
    }

    redrawCanvas() {
        // Clear main canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw white background
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw from drawing canvas onto main canvas
        this.ctx.drawImage(this.drawingCanvas, 0, 0);
        
        // Draw all elements
        this.elements.forEach(element => {
            this.ctx.save();
            // Apply transformations
            this.ctx.translate(element.x + element.width/2, element.y + element.height/2);
            this.ctx.rotate(element.rotation || 0);
            this.ctx.scale(element.scale, element.scale);
            
            switch (element.type) {
                case 'text':
                    this.ctx.font = `${element.fontSize}px ${element.fontFamily}`;
                    this.ctx.fillStyle = element.color;
                    this.ctx.textBaseline = 'middle';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(element.content, 0, 0);
                    break;
                    
                case 'image':
                case 'monanimal':
                    if (
                        element.content &&
                        (element.content instanceof HTMLImageElement ||
                         element.content instanceof HTMLCanvasElement)
                    ) {
                        this.ctx.drawImage(
                            element.content,
                            -element.width/2,
                            -element.height/2,
                            element.width,
                            element.height
                        );
                    }
                    break;
                    
                case 'emoji':
                    this.ctx.font = `${element.height}px Arial`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(element.content, 0, 0);
                    break;
            }
            
            // Draw selection/crop handles if element is selected
            if (this.selectedElement === element) {
                this.ctx.strokeStyle = '#7b2ff2';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([5, 5]);
                
                const bounds = this.getElementBounds(element);
                this.ctx.strokeRect(
                    -bounds.width/2,
                    -bounds.height/2,
                    bounds.width,
                    bounds.height
                );
                
                if (this.isCropping) {
                    const handleSize = 8;
                    this.ctx.fillStyle = '#7b2ff2';
                    this.ctx.setLineDash([]);
                    
                    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, y]) => {
                        this.ctx.fillRect(
                            x * bounds.width/2 - handleSize/2,
                            y * bounds.height/2 - handleSize/2,
                            handleSize,
                            handleSize
                        );
                    });
                }

                // --- Draw handles in rotated context ---
                // Draw rotation handle (above the element)
                const handleRadius = 12;
                const handleOffset = 40;
                const handleX = 0;
                const handleY = -bounds.height/2 - handleOffset;
                this.ctx.beginPath();
                this.ctx.arc(handleX, handleY, handleRadius, 0, 2 * Math.PI);
                this.ctx.fillStyle = '#fff';
                this.ctx.strokeStyle = '#7b2ff2';
                this.ctx.lineWidth = 2;
                this.ctx.fill();
                this.ctx.stroke();
                this.ctx.font = '16px Arial';
                this.ctx.fillStyle = '#7b2ff2';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('⟳', handleX, handleY);
                // Draw delete button (top-right corner)
                const deleteSize = 24;
                const deleteX = bounds.width/2 + 10;
                const deleteY = -bounds.height/2 - 10;
                this.ctx.beginPath();
                this.ctx.arc(deleteX, deleteY, deleteSize/2, 0, 2 * Math.PI);
                this.ctx.fillStyle = '#fff';
                this.ctx.strokeStyle = '#e74c3c';
                this.ctx.lineWidth = 2;
                this.ctx.fill();
                this.ctx.stroke();
                this.ctx.font = '18px Arial';
                this.ctx.fillStyle = '#e74c3c';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('🗑', deleteX, deleteY);
                // --- End handles ---
            }
            this.ctx.restore();
        });
        
        // Draw pixelated board on top if in pixelated mode
        if (this.isPixelatedMode) {
            this.ctx.drawImage(this.pixelCanvas, 0, 0);
        }
    }

    setupNFTMinting() {
        const mintBtn = document.getElementById('mintNFT');
        const onChainMintBtn = document.getElementById('mintOnChainNFT');
        const testMinimalSVGBtn = document.getElementById('testMinimalSVG');
        
        if (mintBtn) {
            mintBtn.addEventListener('click', () => this._mintNFTFlow(mintBtn));
        }
        
        if (onChainMintBtn) {
            onChainMintBtn.addEventListener('click', () => this._mintOnChainNFTFlow(onChainMintBtn));
        }
        
        if (testMinimalSVGBtn) {
            testMinimalSVGBtn.addEventListener('click', () => this.testMinimalSVGMinting());
        }
    }

    // Load Monanimal traits from the traits folder
    async loadMonanimalTraits() {
        const traitCategories = ['head', 'eyes', 'mouth', 'crown', 'dress', 'hand', 'nose'];
        
        for (const category of traitCategories) {
            this.monanimalTraits[category] = [];
            try {
                // For now, we'll use a simple naming convention
                // In a real implementation, you'd scan the directory
                const traitFiles = this.getTraitFilesForCategory(category);
                for (const file of traitFiles) {
                    const img = new Image();
                    img.src = `Monanimal Traits/${category}/${file}`;
                    await new Promise((resolve) => {
                        img.onload = () => {
                            this.monanimalTraits[category].push({
                                name: file,
                                image: img,
                                category: category
                            });
                            resolve();
                        };
                        img.onerror = () => resolve(); // Skip failed loads
                    });
                }
            } catch (error) {
                console.log(`Could not load traits for ${category}:`, error);
            }
        }
        console.log('Loaded Monanimal traits:', this.monanimalTraits);
    }

    // Get trait files for each category (you can customize this based on your actual files)
    getTraitFilesForCategory(category) {
        const traitFiles = {
            head: [
                'monanimalhead.png',
                'Picsart_25-07-03_22-50-27-175.png',
                'ChatGPT Image Jun 30, 2025, 03_49_14 PM.png',
                'ChatGPT Image Jun 29, 2025, 10_40_57 PM.png',
                'chog.png',
                'allowit.png',
                'ChatGPT Image Jun 29, 2025, 09_33_29 PM.png'
            ],
            eyes: [
                'Picsart_25-06-30_20-14-16-512.png',
                'ChatGPT Image Jun 30, 2025, 04_47_38 PM.png',
                'ChatGPT Image Jun 30, 2025, 06_20_51 PM.png',
                'ChatGPT Image Jun 30, 2025, 04_08_19 PM.png'
            ],
            mouth: [
                'IMG_20250630_193739_480.png',
                'IMG_20250630_193738_130.png',
                'ChatGPT Image Jun 30, 2025, 06_37_56 PM.png',
                'ChatGPT Image Jun 30, 2025, 06_34_49 PM.png',
                'ChatGPT Image Jun 30, 2025, 06_31_45 PM.png',
                '12_1_720.png',
                'ChatGPT Image Jun 30, 2025, 06_23_03 PM.png'
            ],
            crown: ['crown1.png',
                    'crown2.png',
                    'crown3.png',
                    'crown4.png'
                   ], // Add actual crown files
            dress: ['dress1.png',
                    'dress2.png',
                    'dress3.png',
                    'dress4.png'
                   ], // Add actual dress files
            hand: ['hand1.png', 
                   'hand2.png',
                   'hand3.png',
                   'hand4.png'
                  ], // Add actual hand files
            nose: ['nose1.png',
                   'nose2.png',
                   'nose3.png',
                   'nose4.png'
                  ] // Add actual nose files
        };
        return traitFiles[category] || [];
    }

    // Setup Monanimal character builder
    setupMonanimalBuilder() {
        const monanimalBtn = document.getElementById('monanimalBuilder');
        if (monanimalBtn) {
            monanimalBtn.addEventListener('click', () => {
                this.toggleMonanimalMode();
            });
        }
        
        // Load traits when initializing
        this.loadMonanimalTraits();
    }

    // Toggle Monanimal mode
    toggleMonanimalMode() {
        this.isMonanimalMode = !this.isMonanimalMode;
        
        if (this.isMonanimalMode) {
            this.enableMonanimalMode();
        } else {
            this.disableMonanimalMode();
        }
    }

    // Enable Monanimal mode
    enableMonanimalMode() {
        this.isMonanimalMode = true;
        this.canvas.classList.add('monanimal-mode-active');
        this.setupMonanimalPartsCatalog();
        this.redrawCanvas();
    }

    // Disable Monanimal mode
    disableMonanimalMode() {
        this.isMonanimalMode = false;
        this.canvas.classList.remove('monanimal-mode-active');
        this.removeMonanimalPartsCatalog();
        this.redrawCanvas();
    }

    // Setup Monanimal parts catalog
    setupMonanimalPartsCatalog() {
        this.removeMonanimalPartsCatalog();
        
        const catalogContainer = document.createElement('div');
        catalogContainer.id = 'monanimalPartsCatalog';
        catalogContainer.style.cssText = `
            position: fixed;
            top: 100px;
            left: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: 2px solid #4a5568;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            z-index: 10000;
            width: 400px;
            max-height: 80vh;
            overflow-y: auto;
            color: white;
            font-family: 'Arial', sans-serif;
        `;

        // Title
        const title = document.createElement('h3');
        title.textContent = '🐾 Monanimal Parts Catalog';
        title.style.cssText = `
            margin: 0 0 15px 0;
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        `;
        catalogContainer.appendChild(title);

        // Instructions
        const instructions = document.createElement('p');
        instructions.textContent = 'Click any part to add it to the canvas!';
        instructions.style.cssText = `
            margin: 0 0 15px 0;
            text-align: center;
            font-size: 14px;
            opacity: 0.9;
        `;
        catalogContainer.appendChild(instructions);

        // Trait categories
        const categories = ['head', 'eyes', 'mouth', 'crown', 'dress', 'hand', 'nose'];
        const categoryLabels = {
            head: '👤 Heads',
            eyes: '👁️ Eyes', 
            mouth: '👄 Mouths',
            crown: '👑 Crowns',
            dress: '👗 Dresses',
            hand: '✋ Hands',
            nose: '👃 Noses'
        };

        categories.forEach(category => {
            const categoryContainer = document.createElement('div');
            categoryContainer.style.cssText = `
                margin-bottom: 20px;
            `;

            const categoryLabel = document.createElement('h4');
            categoryLabel.textContent = categoryLabels[category];
            categoryLabel.style.cssText = `
                margin: 0 0 10px 0;
                font-weight: bold;
                font-size: 16px;
                border-bottom: 2px solid rgba(255,255,255,0.3);
                padding-bottom: 5px;
            `;
            categoryContainer.appendChild(categoryLabel);

            const partsGrid = document.createElement('div');
            partsGrid.style.cssText = `
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
            `;

            // Add parts for this category
            this.monanimalTraits[category].forEach((trait, index) => {
                const partBtn = document.createElement('button');
                partBtn.style.cssText = `
                    width: 100%;
                    height: 80px;
                    background: rgba(255,255,255,0.1);
                    border: 2px solid rgba(255,255,255,0.3);
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    position: relative;
                `;
                
                // Create preview of the part
                const partPreview = document.createElement('canvas');
                partPreview.width = 60;
                partPreview.height = 60;
                partPreview.style.cssText = `
                    border-radius: 6px;
                    background: white;
                `;
                const ctx = partPreview.getContext('2d');
                ctx.drawImage(trait.image, 0, 0, 60, 60);
                partBtn.appendChild(partPreview);
                
                // Hover effects
                partBtn.onmouseenter = () => {
                    partBtn.style.transform = 'translateY(-3px) scale(1.05)';
                    partBtn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
                    partBtn.style.borderColor = 'rgba(255,255,255,0.8)';
                };
                
                partBtn.onmouseleave = () => {
                    partBtn.style.transform = 'translateY(0) scale(1)';
                    partBtn.style.boxShadow = 'none';
                    partBtn.style.borderColor = 'rgba(255,255,255,0.3)';
                };
                
                partBtn.onclick = () => {
                    this.addMonanimalPartToCanvas(trait);
                };
                
                partsGrid.appendChild(partBtn);
            });

            categoryContainer.appendChild(partsGrid);
            catalogContainer.appendChild(categoryContainer);
        });

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            width: 30px;
            height: 30px;
            background: rgba(255,255,255,0.2);
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
        `;
        closeBtn.onclick = () => {
            this.disableMonanimalMode();
        };
        catalogContainer.appendChild(closeBtn);

        document.body.appendChild(catalogContainer);
    }

    // Add individual Monanimal part to canvas
    addMonanimalPartToCanvas(trait) {
        const element = {
            type: 'monanimal',
            content: trait.image,
            x: this.canvas.width / 2 - 100,
            y: this.canvas.height / 2 - 100,
            width: 200,
            height: 200,
            rotation: 0,
            scale: 1,
            traitInfo: {
                name: trait.name,
                category: trait.category
            }
        };
        this.elements.push(element);
        this.redrawCanvas();
        this.saveState();
        
        showNotification(`Added ${trait.category} part to canvas! 🐾`, 'success');
    }

    // Remove Monanimal parts catalog
    removeMonanimalPartsCatalog() {
        const existingCatalog = document.getElementById('monanimalPartsCatalog');
        if (existingCatalog) {
            existingCatalog.remove();
        }
    }

    async _mintNFTFlow(mintBtn) {
        if (!window.ethereum || !window.web3) {
            showNotification('Please connect your wallet first!', 'warning');
            return;
        }

        // Check if NFT minter is set
        if (!this.nftMinter) {
            showNotification('Whooossssshhh!!! Kaboooommmm!! Gmalakaaa!! Gmonadddd!! Heres your NFT', 'error');
            return;
        }

        // Always show confirmation before minting
        showConfirmation('Are you sure you want to mint this NFT?', async () => {
            try {
                mintBtn.disabled = true;
                mintBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Minting...';

                // Get the canvas data
                const canvas = this.canvas;
                const imageData = canvas.toDataURL('image/png');

                // Get the user's wallet address
                const accounts = await window.web3.eth.getAccounts();
                const account = accounts[0];

                // Mint the NFT
                const result = await this.nftMinter.mintNFT(imageData, account);

                showNotification('NFT minted successfully! 🎉', 'success');
                console.log('NFT minted:', result);

                // Refresh NFT display
                await this.initializeNFTDisplay();

            } catch (error) {
                console.error('Error minting NFT:', error);
                showNotification('Failed to mint NFT: ' + error.message, 'error');
            } finally {
                mintBtn.disabled = false;
                mintBtn.innerHTML = '<i class="fas fa-magic"> Mint as NFT</i>';
            }
        });
    }

    async _mintOnChainNFTFlow(onChainMintBtn) {
        if (!window.ethereum || !window.web3) {
            showNotification('Please connect your wallet first!', 'warning');
            return;
        }

        // Check if on-chain minter is set
        if (!window.onChainMinter) {
            showNotification('On-chain contract not configured. Please set the contract address in config.js', 'warning');
            return;
        }

        // Check SVG size before minting
        const svgInfo = window.onChainMinter.getSVGSizeInfo();
        if (svgInfo.error) {
            showNotification('Error checking SVG size: ' + svgInfo.error, 'error');
            return;
        }

        // Show SVG size info
        let sizeMessage = `SVG Size: ${svgInfo.size} characters (${svgInfo.percentage}% of limit)\n${svgInfo.recommendation}`;
        
        if (svgInfo.isTooLarge) {
            showNotification(`SVG too large! ${sizeMessage}`, 'error');
            return;
        }

        if (svgInfo.isLarge) {
            const proceed = confirm(`${sizeMessage}\n\nThis may result in high gas costs. Continue?`);
            if (!proceed) return;
        }

        // Show confirmation before minting
        showConfirmation(`Are you sure you want to mint this as an ON-CHAIN NFT?\n\nSVG Size: ${svgInfo.size} characters\n${svgInfo.recommendation}\n\nThis will store the image data directly in the smart contract.`, async () => {
            try {
                onChainMintBtn.disabled = true;
                onChainMintBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Minting On-Chain...';

                // Get the canvas
                const canvas = this.canvas;

                // Mint the on-chain NFT
                const result = await window.onChainMinter.mintOnChainNFT(
                    canvas, 
                    'On-Chain SVG Art', 
                    'Fully on-chain SVG NFT created with Magical Board'
                );

                showNotification('On-chain NFT minted successfully! 🎉 (Image stored in smart contract)', 'success');
                console.log('On-chain NFT minted:', result);

            } catch (error) {
                console.error('Error minting on-chain NFT:', error);
                showNotification('Failed to mint on-chain NFT: ' + error.message, 'error');
            } finally {
                onChainMintBtn.disabled = false;
                onChainMintBtn.innerHTML = '<i class="fas fa-link"> Mint On-Chain</i>';
            }
        });
    }

    /**
     * Test minimal SVG minting to verify contract functionality
     */
    async testMinimalSVGMinting() {
        if (!window.ethereum || !window.web3) {
            showNotification('Please connect your wallet first!', 'warning');
            return;
        }

        if (!window.onChainMinter) {
            showNotification('On-chain contract not configured. Please set the contract address in config.js', 'warning');
            return;
        }

        showConfirmation('Test minting with a minimal SVG to verify contract functionality?\n\nThis will mint a simple test NFT with a basic SVG.', async () => {
            try {
                const result = await window.onChainMinter.testMinimalSVGMinting();
                showNotification('✅ Minimal SVG test successful! Contract is working correctly.', 'success');
                console.log('Minimal SVG test result:', result);
            } catch (error) {
                console.error('Minimal SVG test failed:', error);
                showNotification('❌ Minimal SVG test failed: ' + error.message, 'error');
            }
        });
    }

    setNFTMinter(minter) {
        this.nftMinter = minter;
        window.isWalletConnected = true;
        // Enable mint buttons when wallet is connected
        const mintBtn = document.getElementById('mintNFT');
        const onChainMintBtn = document.getElementById('mintOnChainNFT');
        const toggleBtn = document.getElementById('onChainModeToggle');
        if (mintBtn) mintBtn.disabled = false;
        // Only enable Mint On-Chain if wallet is connected AND toggle is ON
        if (onChainMintBtn && toggleBtn) {
            const isOn = toggleBtn.getAttribute('aria-pressed') === 'true';
            onChainMintBtn.disabled = !(window.isWalletConnected && isOn);
        }
        console.log('NFT Minter set:', minter);
    }

    async initializeNFTDisplay() {
        const nftGrid = document.getElementById('nftGrid');
        if (!nftGrid || !this.nftMinter) return;

        try {
            // Clear existing content
            nftGrid.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Loading your NFTs...</span>
                </div>
            `;

            // Get current account
            const accounts = await window.web3.eth.getAccounts();
            if (!accounts || accounts.length === 0) {
                throw new Error('No wallet connected');
            }

            // Fetch NFTs for the current account
            const nfts = await this.nftMinter.getNFTsByOwner(accounts[0]);
            
            // Clear loading spinner
            nftGrid.innerHTML = '';

            if (!nfts || nfts.length === 0) {
                nftGrid.innerHTML = `
                    <div class="no-nfts-message">
                        <i class="fas fa-paint-brush"></i>
                        <p>You haven't minted any NFTs yet. Start creating!</p>
                    </div>
                `;
                return;
            }

            // Display each NFT
            nfts.forEach(async (nft, index) => {
                const tokenURI = await this.nftMinter.contract.methods.tokenURI(nft.tokenId).call();
                const metadata = await this.fetchNFTMetadata(tokenURI);
                
                const nftCard = document.createElement('div');
                nftCard.className = 'nft-card';
                nftCard.innerHTML = `
                    <img src="${metadata.image}" alt="NFT ${nft.tokenId}" class="nft-image">
                    <div class="nft-info">
                        <h3 class="nft-title">Monad NFT #${nft.tokenId}</h3>
                        <div class="nft-details">
                            <p>Created: ${new Date(nft.timestamp * 1000).toLocaleDateString()}</p>
                            <p><a href="https://testnet.monadexplorer.com/token/${this.nftMinter.contract._address}/instance/${nft.tokenId}" target="_blank">View on Explorer</a></p>
                        </div>
                    </div>
                `;

                nftGrid.appendChild(nftCard);
            });
        } catch (error) {
            console.error('Error loading NFTs:', error);
            nftGrid.innerHTML = `
                <div class="no-nfts-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error loading NFTs. Please try again later.</p>
                </div>
            `;
        }
    }

    async fetchNFTMetadata(tokenURI) {
        try {
            // If the URI is an IPFS URI, convert it to use a gateway
            if (tokenURI.startsWith('ipfs://')) {
                tokenURI = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
            }
            
            const response = await fetch(tokenURI);
            const metadata = await response.json();
            
            // Convert IPFS image URL to gateway URL if needed
            if (metadata.image && metadata.image.startsWith('ipfs://')) {
                metadata.image = metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
            }
            
            return metadata;
        } catch (error) {
            console.error('Error fetching NFT metadata:', error);
            return {
                name: 'Unknown NFT',
                image: 'https://via.placeholder.com/400?text=NFT+Image+Not+Found'
            };
        }
    }

    handleImageUpload(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const element = {
                    type: 'image',
                    content: img,
                    x: 0,
                    y: 0,
                    width: this.canvas.width,
                    height: this.canvas.height,
                    rotation: 0,
                    scale: 1
                };
                this.elements.push(element);
                this.redrawCanvas();
                this.saveState();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    addAIGeneratedImage(img, prompt) {
        // Calculate appropriate size for the AI generated image
        const maxWidth = this.canvas.width * 0.8;
        const maxHeight = this.canvas.height * 0.8;
        
        let width = img.width;
        let height = img.height;
        
        // Scale down if too large
        if (width > maxWidth || height > maxHeight) {
            const scale = Math.min(maxWidth / width, maxHeight / height);
            width *= scale;
            height *= scale;
        }
        
        // Center the image on canvas
        const x = (this.canvas.width - width) / 2;
        const y = (this.canvas.height - height) / 2;
        
        const element = {
            type: 'image',
            content: img,
            x: x,
            y: y,
            width: width,
            height: height,
            rotation: 0,
            scale: 1,
            isAIGenerated: true,
            prompt: prompt
        };
        
        this.elements.push(element);
        this.redrawCanvas();
        this.saveState();
        
        // Show notification
        showNotification('AI generated image added to canvas!', 'success');
    }

    addText(x, y) {
        const element = {
            type: 'text',
            content: this.textContent,
            x: x,
            y: y,
            width: this.drawingCtx.measureText(this.textContent).width,
            height: this.fontSize,
            fontSize: this.fontSize,
            fontFamily: this.fontFamily,
            color: this.color,
            rotation: 0,
            scale: 1
        };
        
        this.elements.push(element);
        this.redrawCanvas();
        this.saveState();
        
        // Clear the text input
        const textInput = document.getElementById('textInput');
        if (textInput) {
            textInput.value = '';
            this.textContent = '';
        }
    }

    /**
     * Export the current whiteboard as a highly optimized SVG (vector)
     */
    exportAsSVG() {
        const width = +this.canvas.width;
        const height = +this.canvas.height;
        let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`;
        svg += `<rect width="100%" height="100%" fill="white"/>`;
        
        // If in pixelated mode, export pixel grid
        if (this.isPixelatedMode) {
            const cols = this.pixelGrid[0].length;
            const rows = this.pixelGrid.length;
            
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const x = col * this.pixelSize;
                    const y = row * this.pixelSize;
                    const color = this.pixelGrid[row][col];
                    
                    // Only add non-white pixels to save space
                    if (color !== '#FFFFFF') {
                        svg += `<rect x="${x}" y="${y}" width="${this.pixelSize}" height="${this.pixelSize}" fill="${color}"/>`;
                    }
                }
            }
        } else {
            // Export regular drawing actions
            for (const action of this.actions) {
                if ((action.type === 'pencil' || action.type === 'brush') && action.points.length >= 2) {
                    // Limit decimals for all points
                    const d = action.points.map((pt, i) =>
                        (i === 0
                            ? `M${pt.x.toFixed(1)},${pt.y.toFixed(1)}`
                            : `L${pt.x.toFixed(1)},${pt.y.toFixed(1)}`)
                    ).join('');
                    svg += `<path d="${d}" stroke="${action.color}" stroke-width="${Number(action.size).toFixed(1)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
                }
                if (action.type === 'text' && action.content) {
                    svg += `<text x="${Number(action.x).toFixed(1)}" y="${Number(action.y).toFixed(1)}" font-family="${action.fontFamily || 'Arial'}" font-size="${Number(action.fontSize || 24).toFixed(1)}" fill="${action.color || '#000'}">${action.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>`;
                }
                // Add more types as needed (eraser, shapes, etc.)
            }
        }
        
        svg += '</svg>';
        // Remove all unnecessary whitespace and newlines
        svg = svg.replace(/\s{2,}/g, ' ').replace(/\n/g, '').replace(/>\s+</g, '><').trim();
        return svg;
    }

    /**
     * Export pixelated board as SVG
     */
    exportPixelatedAsSVG() {
        const width = +this.canvas.width;
        const height = +this.canvas.height;
        let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`;
        svg += `<rect width="100%" height="100%" fill="white"/>`;
        
        const cols = this.pixelGrid[0].length;
        const rows = this.pixelGrid.length;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * this.pixelSize;
                const y = row * this.pixelSize;
                const color = this.pixelGrid[row][col];
                
                // Only add non-white pixels to save space
                if (color !== '#FFFFFF') {
                    svg += `<rect x="${x}" y="${y}" width="${this.pixelSize}" height="${this.pixelSize}" fill="${color}"/>`;
                }
            }
        }
        
        svg += '</svg>';
        // Remove all unnecessary whitespace and newlines
        svg = svg.replace(/\s{2,}/g, ' ').replace(/\n/g, '').replace(/>\s+</g, '><').trim();
        return svg;
    }

    // Save actions to localStorage
    saveActionsToStorage() {
        localStorage.setItem('whiteboardActions', JSON.stringify(this.actions));
    }

    setupOnChainModeToggle() {
        const toggleBtn = document.getElementById('onChainModeToggle');
        const onChainMintBtn = document.getElementById('mintOnChainNFT');
        const toolIds = ['pencil', 'brush', 'spray', 'eraser', 'text', 'blur', 'smudge', 'dotted', 'crop', 'resize'];
        const controlIds = ['uploadImage', 'uploadGif', 'emojiPicker', 'savePNG', 'saveJPG', 'clear', 'undo', 'redo'];
        const colorPicker = document.getElementById('colorPicker');
        const sizeSlider = document.getElementById('sizeSlider');
        const infoId = 'onChainInfoMsg';

        function setOnChainMode(enabled) {
            // Enable/disable pixelated mode
            if (enabled) {
                this.enablePixelatedMode();
            } else {
                this.disablePixelatedMode();
            }
            
            // Only pencil and color picker enabled
            toolIds.forEach(id => {
                const btn = document.getElementById(id);
                if (btn) {
                    if (id === 'pencil') btn.classList.remove('disabled');
                    else btn.classList.add('disabled');
                }
            });
            controlIds.forEach(id => {
                const btn = document.getElementById(id);
                if (btn) {
                    // Allow clear/undo/redo
                    if (['clear', 'undo', 'redo'].includes(id)) btn.classList.remove('disabled');
                    else btn.classList.add('disabled');
                }
            });
            if (colorPicker) colorPicker.disabled = !enabled;
            if (sizeSlider) sizeSlider.disabled = !enabled;
            // Enable/disable Mint On-Chain button: only if wallet is connected and toggle is ON
            if (onChainMintBtn) onChainMintBtn.disabled = !(window.isWalletConnected && enabled);
            // Disable AI Generate Image button in On-Chain Mode
            const aiGenBtn = document.getElementById('aiGenerate');
            if (aiGenBtn) aiGenBtn.disabled = !!enabled;
            // Show info message
            let info = document.getElementById(infoId);
            if (enabled) {
                if (!info) {
                    info = document.createElement('div');
                    info.id = infoId;
                    info.style = 'color:#e302f7;font-weight:600;text-align:center;margin:10px 0;';
                    info.innerText = 'On-Chain Mode: Pixelated board enabled for gas-efficient SVG NFTs. Click pixels to color them!';
                    document.querySelector('.app-header').appendChild(info);
                }
            } else {
                if (info) info.remove();
                // Re-enable all tools/controls
                toolIds.forEach(id => {
                    const btn = document.getElementById(id);
                    if (btn) btn.classList.remove('disabled');
                });
                controlIds.forEach(id => {
                    const btn = document.getElementById(id);
                    if (btn) btn.classList.remove('disabled');
                });
                if (colorPicker) colorPicker.disabled = false;
                if (sizeSlider) sizeSlider.disabled = false;
                // Re-enable AI Generate Image button
                const aiGenBtn = document.getElementById('aiGenerate');
                if (aiGenBtn) aiGenBtn.disabled = false;
            }
        }
        
        // Bind the function to the whiteboard instance
        const boundSetOnChainMode = setOnChainMode.bind(this);
        
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const isOn = toggleBtn.getAttribute('aria-pressed') === 'true';
                toggleBtn.setAttribute('aria-pressed', (!isOn).toString());
                boundSetOnChainMode(!isOn);
            });
            // Set initial state
            boundSetOnChainMode(toggleBtn.getAttribute('aria-pressed') === 'true');
        }
    }

    /**
     * Display current SVG size information for debugging
     */
    showSVGSizeInfo() {
        if (!window.onChainMinter) {
            console.log('On-chain minter not initialized');
            return;
        }
        
        const svgInfo = window.onChainMinter.getSVGSizeInfo();
        if (svgInfo.error) {
            console.error('Error getting SVG size:', svgInfo.error);
            return;
        }
        
        console.log('=== SVG Size Information ===');
        console.log(`Size: ${svgInfo.size} characters`);
        console.log(`Max allowed: ${svgInfo.maxSize} characters`);
        console.log(`Percentage of limit: ${svgInfo.percentage}%`);
        console.log(`Status: ${svgInfo.isTooLarge ? 'TOO LARGE' : svgInfo.isLarge ? 'LARGE (warning)' : 'GOOD'}`);
        console.log(`Recommendation: ${svgInfo.recommendation}`);
        console.log('===========================');
        
        // Also show in notification
        showNotification(`SVG Size: ${svgInfo.size} chars (${svgInfo.percentage}% of limit)`, svgInfo.isTooLarge ? 'error' : svgInfo.isLarge ? 'warning' : 'success');
    }

    // Clear pixelated board
    clearPixelatedBoard() {
        const cols = this.pixelGrid[0].length;
        const rows = this.pixelGrid.length;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                this.pixelGrid[row][col] = '#FFFFFF'; // Reset to white
            }
        }
        
        this.drawPixelGrid();
        this.redrawCanvas();
        this.saveState(); // Save state after clearing
    }

    // Override clear functionality to handle both modes
    clearCanvas() {
        if (this.isPixelatedMode) {
            this.clearPixelatedBoard();
        } else {
            // Clear regular whiteboard
            this.drawingCtx.fillStyle = 'white';
            this.drawingCtx.fillRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
            this.elements = [];
            this.actions = [];
            // Do NOT reset currentHistoryIndex here!
            this.redrawCanvas();
        }
        this.saveState();
    }

    setupModeSwitchButton() {
        const modeSwitchBtn = document.getElementById('modeSwitchBtn');
        if (!modeSwitchBtn) return;
        const updateBtn = () => {
            if (this.isPixelatedMode) {
                modeSwitchBtn.textContent = 'Switch to Whiteboard';
            } else {
                modeSwitchBtn.textContent = 'Switch to Pixelated Board';
            }
            modeSwitchBtn.disabled = false;
            modeSwitchBtn.style.opacity = '1';
        };
        modeSwitchBtn.onclick = () => {
            if (this.isPixelatedMode) {
                this.disablePixelatedMode();
            } else {
                this.enablePixelatedMode();
            }
            updateBtn();
        };
        // Update on mode change
        const origEnable = this.enablePixelatedMode.bind(this);
        this.enablePixelatedMode = (...args) => { origEnable(...args); updateBtn(); };
        const origDisable = this.disablePixelatedMode.bind(this);
        this.disablePixelatedMode = (...args) => { origDisable(...args); updateBtn(); };
        updateBtn();
    }
}

// Initialize the whiteboard when the page loads
window.addEventListener('load', () => {
    window.whiteboard = new Whiteboard();
    window.whiteboard.setupOnChainModeToggle();
    window.whiteboard.setupModeSwitchButton();
});

// Notification function
function showNotification(message, type = 'success', duration = 4000) {
    const container = document.getElementById('notificationContainer');
    if (!container) return;

    // Choose icon based on type
    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    else if (type === 'error') iconClass = 'fa-circle-xmark';
    else if (type === 'warning') iconClass = 'fa-triangle-exclamation';

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span class="icon"><i class="fa-solid ${iconClass}"></i></span>
        <span>${message}</span>
    `;

    container.appendChild(notification);

    // Auto-remove after duration
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);
}

// Confirmation function
function showConfirmation(message, onYes, onNo) {
    const container = document.getElementById('notificationContainer');
    if (!container) return;

    // Remove any existing confirmations
    Array.from(container.children).forEach(child => {
        if (child.classList.contains('confirmation')) child.remove();
    });

    const notification = document.createElement('div');
    notification.className = 'notification warning confirmation';
    notification.innerHTML = `
        <span class="icon"><i class="fa-solid fa-triangle-exclamation"></i></span>
        <span style="flex:1;">${message}</span>
        <button class="yes-btn" style="margin-left:10px;background:#7b2ff2;color:#fff;border:none;padding:6px 16px;border-radius:6px;cursor:pointer;font-weight:600;">Yes</button>
        <button class="no-btn" style="margin-left:6px;background:#fff;color:#7b2ff2;border:none;padding:6px 16px;border-radius:6px;cursor:pointer;font-weight:600;">No</button>
    `;
    container.appendChild(notification);

    notification.querySelector('.yes-btn').onclick = () => {
        notification.remove();
        if (onYes) onYes();
    };
    notification.querySelector('.no-btn').onclick = () => {
        notification.remove();
        if (onNo) onNo();
    };
}