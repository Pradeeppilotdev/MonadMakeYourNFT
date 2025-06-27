// Configuration file for Magical Board
// You can customize these settings as needed

const CONFIG = {
    // Stability AI Configuration (Alternative to Playground AI)
    STABILITY_AI: {
        // Get your API key from: https://platform.stability.ai/
        // Sign up for free and get API credits
        API_KEY: 'sk-QIxpQyASNSD4XDWD7liUKZn2Oa9mqiGYfpdBeD7I63ArMsQ4', // Set your API key here
        
        // Default settings for image generation
        DEFAULT_MODEL: 'stable-diffusion-xl-1024-v1-0',
        DEFAULT_SIZE: '1024x1024',
        DEFAULT_STEPS: 30,
        DEFAULT_SAMPLES: 1,
        BASE_URL: 'https://api.stability.ai/v1/generation'
    },
    
    // Monad Blockchain Configuration
    MONAD: {
        CHAIN_ID: '0x279f', // 10143 in hex
        CHAIN_ID_DEC: 10143,
        CONTRACT_ADDRESS: '0xC71d614c27A3B01890412d252138C5A1bFE69791',
        ONCHAIN_CONTRACT_ADDRESS:'0xD63fF68E1293d8296369DB5E8c2b2E141AA82225', // Set this after deploying the OnChainSVGArt contract
        RPC_URL: 'https://testnet-rpc.monad.xyz/',
        EXPLORER_URL: 'https://testnet.monadexplorer.com/'
    },
    
    // App Configuration
    APP: {
        MAX_CANVAS_SIZE: 2048,
        DEFAULT_CANVAS_COLOR: '#ffffff',
        AUTO_SAVE_INTERVAL: 30000, // 30 seconds
        MAX_UNDO_STEPS: 50
    }
};

// Instructions for setting up Stability AI:
/*
1. Go to https://platform.stability.ai/
2. Sign up for a free account
3. Navigate to your API settings
4. Copy your API key
5. Replace the API_KEY value above with your key
6. Uncomment the line below to enable real AI generation
*/

// To enable real AI generation, uncomment and set your API key:
// CONFIG.STABILITY_AI.API_KEY = 'your-api-key-here';

// Export configuration
window.CONFIG = CONFIG; 