class OnChainMinter {
    constructor() {
        this.contract = null;
        this.web3 = null;
        this.contractAddress = null;
        this.contractABI = null;
    }

    /**
     * Initialize the on-chain minter with contract details
     */
    async initialize(web3, contractAddress) {
        this.web3 = web3;
        this.contractAddress = contractAddress;
        
        // Contract ABI for the OnChainSVGArt contract
        this.contractABI = [
            {
                "inputs": [],
                "stateMutability": "nonpayable",
                "type": "constructor"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "owner",
                        "type": "address"
                    },
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "approved",
                        "type": "address"
                    },
                    {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    }
                ],
                "name": "Approval",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "owner",
                        "type": "address"
                    },
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "operator",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "internalType": "bool",
                        "name": "approved",
                        "type": "bool"
                    }
                ],
                "name": "ApprovalForAll",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    },
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "artist",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "internalType": "string",
                        "name": "svgData",
                        "type": "string"
                    }
                ],
                "name": "ArtMinted",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "newPrice",
                        "type": "uint256"
                    }
                ],
                "name": "MintPriceUpdated",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "previousOwner",
                        "type": "address"
                    },
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "newOwner",
                        "type": "address"
                    }
                ],
                "name": "OwnershipTransferred",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "from",
                        "type": "address"
                    },
                    {
                        "indexed": true,
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    }
                ],
                "name": "Transfer",
                "type": "event"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    }
                ],
                "name": "approve",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "owner",
                        "type": "address"
                    }
                ],
                "name": "balanceOf",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    }
                ],
                "name": "getApproved",
                "outputs": [
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    }
                ],
                "name": "getSVGData",
                "outputs": [
                    {
                        "internalType": "string",
                        "name": "",
                        "type": "string"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "owner",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "operator",
                        "type": "address"
                    }
                ],
                "name": "isApprovedForAll",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "string",
                        "name": "svg",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "title",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "description",
                        "type": "string"
                    }
                ],
                "name": "mint",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "payable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "mintPrice",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "name",
                "outputs": [
                    {
                        "internalType": "string",
                        "name": "",
                        "type": "string"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "nextTokenId",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "owner",
                "outputs": [
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    }
                ],
                "name": "ownerOf",
                "outputs": [
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "renounceOwnership",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "from",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    }
                ],
                "name": "safeTransferFrom",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "from",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "bytes",
                        "name": "data",
                        "type": "bytes"
                    }
                ],
                "name": "safeTransferFrom",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "operator",
                        "type": "address"
                    },
                    {
                        "internalType": "bool",
                        "name": "approved",
                        "type": "bool"
                    }
                ],
                "name": "setApprovalForAll",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "newPrice",
                        "type": "uint256"
                    }
                ],
                "name": "setMintPrice",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "bytes4",
                        "name": "interfaceId",
                        "type": "bytes4"
                    }
                ],
                "name": "supportsInterface",
                "outputs": [
                    {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "symbol",
                "outputs": [
                    {
                        "internalType": "string",
                        "name": "",
                        "type": "string"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    }
                ],
                "name": "tokenURI",
                "outputs": [
                    {
                        "internalType": "string",
                        "name": "",
                        "type": "string"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "totalSupply",
                "outputs": [
                    {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "from",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "tokenId",
                        "type": "uint256"
                    }
                ],
                "name": "transferFrom",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "newOwner",
                        "type": "address"
                    }
                ],
                "name": "transferOwnership",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "withdraw",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ];

        this.contract = new this.web3.eth.Contract(this.contractABI, this.contractAddress);
        console.log('OnChain Minter initialized with contract:', this.contractAddress);
    }

    /**
     * Convert canvas to SVG
     */
    canvasToSVG(canvas) {
        const width = canvas.width;
        const height = canvas.height;
        const pngData = canvas.toDataURL('image/png');
        // SVG with embedded PNG
        return `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <image href="${pngData}" width="${width}" height="${height}" />
            </svg>
        `;
    }

    /**
     * Convert canvas to optimized SVG (better implementation)
     */
    canvasToOptimizedSVG(canvas) {
        const width = canvas.width;
        const height = canvas.height;
        
        // Create a more sophisticated SVG conversion
        // This would ideally track the actual drawing commands
        let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`;
        
        // Add white background
        svg += `<rect width="100%" height="100%" fill="white"/>`;
        
        // Add a placeholder for the actual artwork
        // In a real implementation, you'd convert the canvas drawing commands to SVG paths
        svg += `<text x="50%" y="50%" text-anchor="middle" font-family="Arial" font-size="24" fill="#666">Artwork will be converted to SVG paths</text>`;
        svg += `<text x="50%" y="70%" text-anchor="middle" font-family="Arial" font-size="16" fill="#999">For on-chain storage</text>`;
        
        svg += '</svg>';
        
        return svg;
    }

    /**
     * Mint an on-chain SVG NFT
     */
    async mintOnChainNFT(canvas, title = '', description = '') {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }

        try {
            // Use the whiteboard's SVG export for true vector SVG
            const svg = window.whiteboard.exportAsSVG();
            
            // Enhanced SVG size checking with user feedback
            const svgSize = svg.length;
            const maxSize = 50000; // Contract limit
            const warningSize = 40000; // Warning threshold
            
            console.log(`SVG size: ${svgSize} characters`);
            
            if (svgSize > maxSize) {
                throw new Error(`SVG too large for on-chain storage (${svgSize} chars). Maximum allowed: ${maxSize} chars. Please simplify your artwork.`);
            }
            
            if (svgSize > warningSize) {
                console.warn(`SVG is large (${svgSize} chars). This may cause high gas costs.`);
                if (!confirm(`Your SVG is ${svgSize} characters (close to the ${maxSize} limit). This may result in high gas costs. Continue?`)) {
                    return null;
                }
            }
            
            const accounts = await this.web3.eth.getAccounts();
            const account = accounts[0];
            const mintPrice = await this.contract.methods.mintPrice().call();
            const transaction = {
                from: account,
                value: mintPrice,
                gas: 5000000
            };
            const result = await this.contract.methods.mint(svg, title, description)
                .send(transaction);
            console.log('On-chain NFT minted:', result);
            return result;
        } catch (error) {
            console.error('Error minting on-chain NFT:', error);
            
            // Enhanced error messages
            if (error.message.includes('SVG too large')) {
                throw new Error(`SVG Size Error: ${error.message}. Try using fewer drawing elements or simpler artwork.`);
            } else if (error.message.includes('execution reverted')) {
                throw new Error(`Transaction Failed: The contract rejected the transaction. This could be due to:\n1. SVG size too large\n2. Invalid SVG format\n3. Gas limit exceeded\n\nTry with a simpler drawing first.`);
            } else if (error.message.includes('insufficient funds')) {
                throw new Error(`Insufficient Funds: Make sure you have enough ETH for gas fees and mint price.`);
            } else {
                throw new Error(`Minting Error: ${error.message}`);
            }
        }
    }

    /**
     * Test minting with a minimal SVG to verify contract functionality
     */
    async testMinimalSVGMinting() {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }

        try {
            // Create a minimal test SVG
            const minimalSVG = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
                <rect width="100" height="100" fill="white"/>
                <circle cx="50" cy="50" r="20" fill="blue"/>
                <text x="50" y="80" text-anchor="middle" font-family="Arial" font-size="12" fill="black">Test</text>
            </svg>`;
            
            console.log(`Testing with minimal SVG (${minimalSVG.length} characters):`, minimalSVG);
            
            const accounts = await this.web3.eth.getAccounts();
            const account = accounts[0];
            const mintPrice = await this.contract.methods.mintPrice().call();
            const transaction = {
                from: account,
                value: mintPrice,
                gas: 5000000
            };
            
            const result = await this.contract.methods.mint(minimalSVG, 'Test NFT', 'Minimal test SVG')
                .send(transaction);
            
            console.log('✅ Minimal SVG test successful:', result);
            return result;
        } catch (error) {
            console.error('❌ Minimal SVG test failed:', error);
            throw error;
        }
    }

    /**
     * Get current SVG size and provide recommendations
     */
    getSVGSizeInfo() {
        try {
            const svg = window.whiteboard.exportAsSVG();
            const size = svg.length;
            const maxSize = 50000;
            const warningSize = 40000;
            
            return {
                size: size,
                maxSize: maxSize,
                warningSize: warningSize,
                isTooLarge: size > maxSize,
                isLarge: size > warningSize,
                percentage: Math.round((size / maxSize) * 100),
                recommendation: size > maxSize 
                    ? 'Simplify your artwork - remove some elements'
                    : size > warningSize 
                    ? 'Consider simplifying to reduce gas costs'
                    : 'Size is good for on-chain minting'
            };
        } catch (error) {
            return {
                error: 'Could not get SVG size info',
                details: error.message
            };
        }
    }

    /**
     * Get NFT metadata
     */
    async getNFTMetadata(tokenId) {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }

        try {
            const tokenURI = await this.contract.methods.tokenURI(tokenId).call();
            
            // Parse the data URI
            if (tokenURI.startsWith('data:application/json;base64,')) {
                const base64Data = tokenURI.replace('data:application/json;base64,', '');
                const jsonString = atob(base64Data);
                return JSON.parse(jsonString);
            }
            
            return null;
        } catch (error) {
            console.error('Error getting NFT metadata:', error);
            throw error;
        }
    }

    /**
     * Get user's on-chain NFTs
     */
    async getUserNFTs(address) {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }

        try {
            const balance = await this.contract.methods.balanceOf(address).call();
            const nfts = [];

            // Get all tokens owned by the user
            for (let i = 0; i < balance; i++) {
                // This is a simplified approach - in practice you'd need to track token IDs
                // For now, we'll just return the balance
                nfts.push({
                    tokenId: i,
                    owner: address
                });
            }

            return nfts;
        } catch (error) {
            console.error('Error getting user NFTs:', error);
            throw error;
        }
    }
}

// Export for use in other files
window.OnChainMinter = OnChainMinter; 