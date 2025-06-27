class AIGenerator {
    constructor() {
        this.apiKey = window.CONFIG?.STABILITY_AI?.API_KEY || null;
        this.baseUrl = window.CONFIG?.STABILITY_AI?.BASE_URL || 'https://api.stability.ai/v1/generation';
        this.isGenerating = false;
        this.setupEventListeners();
        
        // Check if API key is configured
        if (!this.apiKey) {
            console.log('Stability AI API key not configured. Using demo mode.');
        }
    }

    setupEventListeners() {
        // AI Generate button
        const aiGenerateBtn = document.getElementById('aiGenerate');
        if (aiGenerateBtn) {
            aiGenerateBtn.addEventListener('click', () => this.openModal());
        }

        // Modal close button
        const closeModalBtn = document.getElementById('closeAiModal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.closeModal());
        }

        // Generate image button
        const generateBtn = document.getElementById('generateImage');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateImage());
        }

        // Close modal when clicking outside
        const modal = document.getElementById('aiModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        // Handle Enter key in prompt textarea
        const promptTextarea = document.getElementById('aiPrompt');
        if (promptTextarea) {
            promptTextarea.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    this.generateImage();
                }
            });
        }
    }

    openModal() {
        const modal = document.getElementById('aiModal');
        if (modal) {
            modal.style.display = 'flex';
            // Focus on the prompt textarea
            const promptTextarea = document.getElementById('aiPrompt');
            if (promptTextarea) {
                promptTextarea.focus();
            }
            
            // Show API key status
            if (!this.apiKey) {
                showNotification('Demo mode: Using placeholder images. Add your Stability AI API key in config.js for real AI generation.', 'warning', 6000);
            }
        }
    }

    closeModal() {
        const modal = document.getElementById('aiModal');
        if (modal) {
            modal.style.display = 'none';
            // Reset the form
            this.resetForm();
        }
    }

    resetForm() {
        const promptTextarea = document.getElementById('aiPrompt');
        const resultsSection = document.querySelector('.ai-results-section');
        const resultsGrid = document.getElementById('aiResults');
        
        if (promptTextarea) promptTextarea.value = '';
        if (resultsSection) resultsSection.style.display = 'none';
        if (resultsGrid) resultsGrid.innerHTML = '';
    }

    async generateImage() {
        const prompt = document.getElementById('aiPrompt')?.value.trim();
        const model = document.getElementById('aiModel')?.value || window.CONFIG?.STABILITY_AI?.DEFAULT_MODEL || 'stable-diffusion-xl-1024-v1-0';
        const size = document.getElementById('aiSize')?.value || window.CONFIG?.STABILITY_AI?.DEFAULT_SIZE || '1024x1024';
        const steps = parseInt(document.getElementById('aiSteps')?.value || window.CONFIG?.STABILITY_AI?.DEFAULT_STEPS || '30');
        const generateBtn = document.getElementById('generateImage');
        const loadingDiv = document.querySelector('.ai-loading');
        const resultsSection = document.querySelector('.ai-results-section');

        if (!prompt) {
            showNotification('Please enter a description for the image you want to generate.', 'warning');
            return;
        }

        if (this.isGenerating) {
            showNotification('Already generating an image. Please wait...', 'warning');
            return;
        }

        // Show loading state
        this.isGenerating = true;
        if (generateBtn) generateBtn.disabled = true;
        if (loadingDiv) loadingDiv.style.display = 'block';
        if (resultsSection) resultsSection.style.display = 'block';

        try {
            showNotification('Generating your image with AI...', 'success');

            let imageUrls = [];

            if (this.apiKey) {
                // Real API call
                imageUrls = await this.makeApiCall(prompt, model, size, steps);
            } else {
                // Demo mode with placeholder images
                await new Promise(resolve => setTimeout(resolve, 3000));
                imageUrls = this.getDemoImages(prompt);
            }

            this.displayResults(imageUrls, prompt);

        } catch (error) {
            console.error('Error generating image:', error);
            showNotification('Failed to generate image. Please try again.', 'error');
        } finally {
            // Hide loading state
            this.isGenerating = false;
            if (generateBtn) generateBtn.disabled = false;
            if (loadingDiv) loadingDiv.style.display = 'none';
        }
    }

    getDemoImages(prompt) {
        // Create demo images with different colors and the prompt as text
        const colors = ['#7b2ff2', '#f357a8', '#e302f7', '#b90c9f'];
        return colors.map((color, index) => {
            const encodedPrompt = encodeURIComponent(prompt.substring(0, 50));
            return `https://via.placeholder.com/1024x1024/${color.replace('#', '')}/ffffff?text=AI+Generated+${index + 1}+%0A${encodedPrompt}`;
        });
    }

    displayResults(imageUrls, prompt) {
        const resultsGrid = document.getElementById('aiResults');
        const resultsSection = document.querySelector('.ai-results-section');

        if (!resultsGrid || !resultsSection) return;

        resultsSection.style.display = 'block';
        resultsGrid.innerHTML = '';

        imageUrls.forEach((imageUrl, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'ai-result-item';
            resultItem.innerHTML = `
                <img src="${imageUrl}" alt="AI Generated Image ${index + 1}" loading="lazy">
                <div class="result-actions">
                    <button class="use-image-btn" onclick="aiGenerator.useImage('${imageUrl}', '${prompt.replace(/'/g, "\\'")}')">
                        <i class="fas fa-plus"></i> Use Image
                    </button>
                    <button class="download-btn" onclick="aiGenerator.downloadImage('${imageUrl}', 'ai-generated-${index + 1}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                </div>
            `;
            resultsGrid.appendChild(resultItem);
        });

        const mode = this.apiKey ? 'real AI' : 'demo';
        showNotification(`Generated ${imageUrls.length} images using ${mode}!`, 'success');
    }

    async useImage(imageUrl, prompt) {
        try {
            // Load the image
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                // Add the image to the whiteboard
                if (window.whiteboard) {
                    window.whiteboard.addAIGeneratedImage(img, prompt);
                }
                this.closeModal();
                showNotification('AI generated image added to canvas!', 'success');
            };

            img.onerror = () => {
                showNotification('Failed to load the generated image.', 'error');
            };

            img.src = imageUrl;

        } catch (error) {
            console.error('Error using AI generated image:', error);
            showNotification('Failed to add image to canvas.', 'error');
        }
    }

    async downloadImage(imageUrl, filename) {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            showNotification('Image downloaded successfully!', 'success');
        } catch (error) {
            console.error('Error downloading image:', error);
            showNotification('Failed to download image.', 'error');
        }
    }

    // Method to set API key (for future use)
    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    // Method to make actual API calls to Stability AI
    async makeApiCall(prompt, model, size, steps) {
        if (!this.apiKey) {
            throw new Error('API key not set. Please configure your Stability AI API key in config.js');
        }

        const [width, height] = size.split('x').map(Number);
        
        const requestBody = {
            text_prompts: [
                {
                    text: prompt,
                    weight: 1
                }
            ],
            cfg_scale: 7,
            height: height,
            width: width,
            samples: window.CONFIG?.STABILITY_AI?.DEFAULT_SAMPLES || 1,
            steps: steps,
            style_preset: "photographic"
        };

        console.log('Making API call to Stability AI:', requestBody);

        const response = await fetch(`${this.baseUrl}/${model}/text-to-image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log('API response:', data);
        
        if (!data.artifacts || !Array.isArray(data.artifacts)) {
            throw new Error('Invalid response format from Stability AI API');
        }

        // Convert base64 images to data URLs
        return data.artifacts.map(artifact => {
            if (artifact.base64) {
                return `data:image/png;base64,${artifact.base64}`;
            }
            return null;
        }).filter(url => url);
    }
}

// Initialize AI Generator
const aiGenerator = new AIGenerator();

// Export for use in other files
window.aiGenerator = aiGenerator; 