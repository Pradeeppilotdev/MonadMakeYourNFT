# Magical Board - AI-Powered Digital Art & NFT Creation Platform

A modern, feature-rich digital art creation platform with AI image generation and NFT minting capabilities on the Monad blockchain.

## ✨ Features

### 🎨 Drawing Tools
- **Multiple Drawing Tools**: Pencil, brush, spray, eraser, blur, smudge, dotted lines
- **Text Tool**: Add custom text with various fonts and sizes
- **Image Upload**: Support for images and GIFs
- **Emoji Picker**: Add emojis to your artwork
- **Undo/Redo**: Full history management
- **Export Options**: Save as PNG or JPG

### 🤖 AI Image Generation
- **Stability AI Integration**: Generate images from text descriptions using Stable Diffusion
- **Multiple Models**: Choose from various AI models (SDXL 1.0, SD 1.6, SD 2.1, etc.)
- **Customizable Settings**: Adjust size, quality, and generation parameters
- **Free Tier**: Available with Stability AI's platform
- **Demo Mode**: Works without API key for testing

### 🪙 NFT Minting
- **Monad Blockchain**: Mint your artwork as NFTs on Monad testnet
- **Smart Contract**: Deployed and ready to use
- **Wallet Integration**: MetaMask support with automatic network switching
- **Metadata Storage**: IPFS-based metadata storage
- **On-Chain NFTs**: Store image data directly in smart contracts (SVG format)

## 🚀 Getting Started

### Prerequisites
- Modern web browser with JavaScript enabled
- MetaMask wallet extension (for NFT minting)
- Stability AI account (for AI generation - optional)

### Installation
1. Clone or download this repository
2. Open `index.html` in your web browser
3. Start creating!

### AI Image Generation Setup

#### Option 1: Demo Mode (No Setup Required)
- The app works immediately in demo mode
- Uses placeholder images to demonstrate the interface
- Perfect for testing and exploration

#### Option 2: Real AI Generation
1. Sign up for a free account at [Stability AI Platform](https://platform.stability.ai/)
2. Navigate to your API settings
3. Copy your API key
4. Open `config.js` in the project
5. Replace `API_KEY: null` with `API_KEY: 'your-api-key-here'`
6. Uncomment the line: `CONFIG.STABILITY_AI.API_KEY = 'your-api-key-here';`

```javascript
// In config.js
CONFIG.STABILITY_AI.API_KEY = 'your-actual-api-key-here';
```

### NFT Minting Setup
1. Install MetaMask browser extension
2. Add Monad Testnet to MetaMask:
   - Network Name: Monad Testnet
   - RPC URL: https://testnet-rpc.monad.xyz/
   - Chain ID: 10143
   - Currency Symbol: MON
3. Get test MON tokens from the faucet
4. Connect your wallet in the app

### On-Chain NFT Setup
1. Deploy the OnChainSVGArt contract to Monad testnet
2. Update `config.js` with the deployed contract address:
   ```javascript
   ONCHAIN_CONTRACT_ADDRESS: 'your-deployed-contract-address'
   ```
3. The "Mint On-Chain" button will be enabled automatically

## 🎯 How to Use

### Creating Art
1. **Choose a Tool**: Select from the drawing tools in the left sidebar
2. **Adjust Settings**: Use the right sidebar to change colors, brush sizes, etc.
3. **Start Drawing**: Click and drag on the canvas to create
4. **Add Elements**: Upload images, add text, or insert emojis
5. **AI Generation**: Click the robot icon to generate AI images from text

### AI Image Generation
1. Click the **🤖 AI Generate** button in the controls sidebar
2. Enter a detailed description of the image you want
3. Choose your preferred model, size, and quality settings
4. Click **Generate Image**
5. Select from the generated images to add to your canvas
6. Download or use the images in your artwork

### Minting NFTs
1. Connect your MetaMask wallet
2. Create your artwork using the drawing tools
3. Click **Mint as NFT** when satisfied
4. Confirm the transaction in MetaMask
5. Your NFT will be minted on Monad testnet!

### Minting On-Chain NFTs
1. Connect your MetaMask wallet
2. Create your artwork using the drawing tools
3. Click **Mint On-Chain** for fully on-chain storage
4. Confirm the transaction in MetaMask
5. Your SVG NFT will be stored directly in the smart contract!

## 🔧 Configuration

### AI Generation Settings
Edit `config.js` to customize AI generation:

```javascript
STABILITY_AI: {
    API_KEY: 'your-api-key',
    DEFAULT_MODEL: 'stable-diffusion-xl-1024-v1-0',
    DEFAULT_SIZE: '1024x1024',
    DEFAULT_STEPS: 30,
    DEFAULT_SAMPLES: 1
}
```

### Available AI Models
- `stable-diffusion-xl-1024-v1-0` - SDXL 1.0 (default)
- `stable-diffusion-v1-6` - Stable Diffusion 1.6
- `stable-diffusion-512-v2-1` - SD 2.1 (512px)
- `stable-diffusion-768-v2-1` - SD 2.1 (768px)
- `stable-diffusion-xl-beta-v2-2-2` - SDXL Beta 2.2.2

### Image Sizes
- `1024x1024` - Square (default)
- `1024x768` - Landscape
- `768x1024` - Portrait
- `512x512` - Small square

## 🛠️ Technical Details

### File Structure
```
MonadicalNFTMint/
├── index.html          # Main application
├── script.js           # Whiteboard functionality
├── aiGenerator.js      # AI image generation
├── nftMinter.js        # NFT minting logic
├── onChainMinter.js    # On-chain NFT minting
├── config.js           # Configuration settings
├── MonadNFT.sol        # Smart contract (IPFS)
├── OnChainSVGArt.sol   # On-chain SVG contract
├── deploy-onchain.js   # Deployment script
├── styles.css          # Styling
└── README.md           # This file
```

### Technologies Used
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Canvas API**: For drawing functionality
- **Web3.js**: Blockchain interaction
- **Stability AI API**: Text-to-image generation
- **IPFS**: Metadata storage
- **Monad Blockchain**: NFT minting

### Smart Contracts
- **MonadNFT.sol**: ERC-721 contract with IPFS metadata storage
  - **Contract Address**: `0xC71d614c27A3B01890412d252138C5A1bFE69791`
- **OnChainSVGArt.sol**: ERC-721 contract with on-chain SVG storage
  - **Contract Address**: Set in `config.js` after deployment
- **Network**: Monad Testnet (Chain ID: 10143)
- **Standard**: ERC-721

## 🎨 Tips for Better Results

### AI Generation
- **Be Specific**: Detailed descriptions work better
- **Use Keywords**: Include style, mood, and composition details
- **Experiment**: Try different models for different styles
- **Quality vs Speed**: Higher step counts = better quality but slower generation

### Drawing
- **Layers**: Use different tools for different effects
- **Undo/Redo**: Don't be afraid to experiment
- **Export**: Save your work regularly
- **NFT Ready**: Consider composition for NFT display

## 🔗 Links

- **Stability AI**: https://platform.stability.ai/
- **Monad Blockchain**: https://monad.xyz/
- **Monad Explorer**: https://testnet.monadexplorer.com/
- **MetaMask**: https://metamask.io/

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🐛 Support

If you encounter any issues:
1. Check the browser console for error messages
2. Ensure your API key is correctly configured (for AI generation)
3. Verify your wallet is connected to Monad testnet (for NFT minting)
4. Check that you have sufficient test MON tokens for gas fees

---

**Happy Creating! 🎨✨** 