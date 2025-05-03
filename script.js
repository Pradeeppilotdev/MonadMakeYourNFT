class Whiteboard {
    constructor() {
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

        // Initialize the canvas and tools
        this.setupCanvas();
        this.setupTools();
        this.setupEventListeners();
        
        // Initialize emoji picker immediately
        this.setupEmojiPicker();
        this.setupNFTMinting();
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
        
        // Fill drawing canvas with white
        this.drawingCtx.fillStyle = 'white';
        this.drawingCtx.fillRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        
        // Initialize drawing context properties
        this.drawingCtx.lineCap = 'round';
        this.drawingCtx.lineJoin = 'round';
        
        this.redrawCanvas();
    }

    setupEventListeners() {
        // Mouse events for drawing
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (['pencil', 'brush', 'spray', 'eraser', 'blur', 'smudge', 'dotted'].includes(this.currentTool)) {
                this.isDrawing = true;
                this.lastX = x;
                this.lastY = y;
                return;
            }

            // Handle element manipulation
            const currentTime = new Date().getTime();
            const timeSinceLastClick = currentTime - this.lastClickTime;
            const element = this.findElementAtPosition(x, y);

            if (timeSinceLastClick < this.doubleClickThreshold && element) {
                this.selectedElement = element;
                this.isCropping = true;
                this.isDragging = false;
            } else if (element) {
                this.selectedElement = element;
                this.isDragging = true;
                this.isCropping = false;
                this.dragStartX = x - element.x;
                this.dragStartY = y - element.y;
            } else {
                this.selectedElement = null;
                this.isDragging = false;
                this.isCropping = false;
            }

            this.lastClickTime = currentTime;
            this.redrawCanvas();
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

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
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isDrawing = false;
            this.isDragging = false;
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
                imageInput.click();
            });

            imageInput.addEventListener('change', (e) => {
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
                this.ctx.fillStyle = 'white';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.saveState();
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
    }

    setupTools() {
        // Drawing tools
        const tools = {
            'pencil': () => {
                this.clearActiveStates();
                this.currentTool = 'pencil';
                document.getElementById('pencil').classList.add('active');
                document.getElementById('textControls').style.display = 'none';
            },
            'brush': () => {
                this.clearActiveStates();
                this.currentTool = 'brush';
                document.getElementById('brush').classList.add('active');
                document.getElementById('textControls').style.display = 'none';
            },
            'spray': () => {
                this.clearActiveStates();
                this.currentTool = 'spray';
                document.getElementById('spray').classList.add('active');
                document.getElementById('textControls').style.display = 'none';
            },
            'eraser': () => {
                this.clearActiveStates();
                this.currentTool = 'eraser';
                document.getElementById('eraser').classList.add('active');
                document.getElementById('textControls').style.display = 'none';
            },
            'text': () => {
                this.clearActiveStates();
                this.currentTool = 'text';
                document.getElementById('text').classList.add('active');
                document.getElementById('textControls').style.display = 'block';
            },
            'blur': () => {
                this.clearActiveStates();
                this.currentTool = 'blur';
                document.getElementById('blur').classList.add('active');
            },
            'smudge': () => {
                this.clearActiveStates();
                this.currentTool = 'smudge';
                document.getElementById('smudge').classList.add('active');
            },
            'dotted': () => {
                this.clearActiveStates();
                this.currentTool = 'dotted';
                document.getElementById('dotted').classList.add('active');
            },
            'crop': () => {
                this.clearActiveStates();
                this.currentTool = 'crop';
                document.getElementById('crop').classList.add('active');
                this.startCropMode();
            },
            'resize': () => {
                this.clearActiveStates();
                this.currentTool = 'resize';
                document.getElementById('resize').classList.add('active');
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
        this.drawingCtx.beginPath();
        this.drawingCtx.setLineDash([5, 5]);
        this.drawingCtx.moveTo(this.lastX, this.lastY);
        this.drawingCtx.lineTo(x, y);
        this.drawingCtx.strokeStyle = this.color;
        this.drawingCtx.lineWidth = this.size;
        this.drawingCtx.stroke();
        this.drawingCtx.setLineDash([]);
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
        this.currentHistoryIndex++;
        this.history = this.history.slice(0, this.currentHistoryIndex);
        this.history.push({
            elements: JSON.parse(JSON.stringify(this.elements)),
            drawingCanvas: this.drawingCanvas.toDataURL()
        });
    }

    undo() {
        if (this.currentHistoryIndex > 0) {
            this.currentHistoryIndex--;
            const state = this.history[this.currentHistoryIndex];
            this.elements = JSON.parse(JSON.stringify(state.elements));
            
            const img = new Image();
            img.onload = () => {
                this.drawingCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.drawingCtx.drawImage(img, 0, 0);
                this.redrawCanvas();
            };
            img.src = state.drawingCanvas;
        }
    }

    redo() {
        if (this.currentHistoryIndex < this.history.length - 1) {
            this.currentHistoryIndex++;
            const state = this.history[this.currentHistoryIndex];
            
            const img = new Image();
            img.onload = () => {
                this.drawingCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.drawingCtx.drawImage(img, 0, 0);
                this.redrawCanvas();
            };
            img.src = state.drawingCanvas;
        }
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
            this.ctx.rotate(element.rotation);
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
                    this.ctx.drawImage(
                        element.content,
                        -element.width/2,
                        -element.height/2,
                        element.width,
                        element.height
                    );
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
            }
            
            this.ctx.restore();
        });
    }

    setupNFTMinting() {
        const mintBtn = document.getElementById('mintNFT');
        if (mintBtn) {
            mintBtn.addEventListener('click', async () => {
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
                    await this._mintNFTFlow(mintBtn);
                });
            });
        }
    }

    async _mintNFTFlow(mintBtn) {
        try {
            // Show loading state
            mintBtn.disabled = true;
            mintBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Minting...';

            // Get the current canvas state
            const imageData = this.canvas.toDataURL('image/png');
            
            // Get current account
            const accounts = await window.web3.eth.getAccounts();
            if (!accounts || accounts.length === 0) {
                throw new Error('No wallet connected');
            }
            
            // Mint the NFT
            const result = await this.nftMinter.mintNFT(imageData, accounts[0]);
            
            // Show success message
            showNotification(`NFT minted successfully!<br>Transaction Hash: <a href='https://testnet.monadexplorer.com/tx/${result.transactionHash}' target='_blank' style='color:#fff;text-decoration:underline;'>${result.transactionHash.slice(0, 10)}...</a>`, 'success', 7000);
            
            // Refresh the NFT display
            await this.initializeNFTDisplay();
            
            console.log('Minting successful:', result);
        } catch (error) {
            console.error('Error minting NFT:', error);
            showNotification(`Failed to mint NFT: ${error.message}`, 'error', 7000);
        } finally {
            // Reset button state
            mintBtn.disabled = false;
            mintBtn.innerHTML = '<i class="fas fa-magic"></i> Mint as NFT';
        }
    }

    setNFTMinter(minter) {
        this.nftMinter = minter;
        const mintBtn = document.getElementById('mintNFT');
        if (mintBtn) {
            mintBtn.disabled = !minter;
        }
        // Initialize NFT display when minter is set
        if (minter) {
            this.initializeNFTDisplay();
        }
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
}

// Initialize the whiteboard when the page loads
window.addEventListener('load', () => {
    new Whiteboard();
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