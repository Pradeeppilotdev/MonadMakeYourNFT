class NFTMinter {
    constructor(web3, contractAddress = '0xa3c34e3a52b9566d7F6cB63792402E2379Cff46a') {
        this.web3 = web3;
        this.contractAddress = contractAddress;
        this.contract = null;
        // Pinata API configuration
        this.pinataApiKey = '3404a3e98a33ffa31157';
        this.pinataSecretKey = '7e18618551d18a5e0aecd13ca19daac3b5bbee0a75f62ea0c33dc885ed4df57f';
        this.initializeContract();
    }

    async uploadToPinata(data, isJson = false) {
        try {
            console.log('Uploading to Pinata...');
            const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
            
            // Create form data
            const formData = new FormData();
            const blob = new Blob([data], { type: isJson ? 'application/json' : 'image/jpeg' });
            formData.append('file', blob);

            // Make request to Pinata
            const response = await axios.post(url, formData, {
                maxBodyLength: 'Infinity',
                headers: {
                    'Content-Type': `multipart/form-data`,
                    'pinata_api_key': this.pinataApiKey,
                    'pinata_secret_api_key': this.pinataSecretKey
                }
            });

            console.log('Pinata upload successful:', response.data);
            return response.data.IpfsHash;
        } catch (error) {
            console.error('Error uploading to Pinata:', error);
            throw new Error('Failed to upload to Pinata: ' + error.message);
        }
    }

    async initializeContract() {
        try {
            console.log('Initializing contract at address:', this.contractAddress);
            
            // Contract ABI
            const contractABI = [
                {
                    "inputs": [],
                    "stateMutability": "nonpayable",
                    "type": "constructor"
                },
                {
                    "inputs": [],
                    "name": "getMintPrice",
                    "outputs": [
                        {
                            "internalType": "uint256",
                            "name": "",
                            "type": "uint256"
                        }
                    ],
                    "stateMutability": "pure",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "getTokenCount",
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
                    "anonymous": false,
                    "inputs": [
                        {
                            "indexed": true,
                            "internalType": "address",
                            "name": "creator",
                            "type": "address"
                        },
                        {
                            "indexed": true,
                            "internalType": "uint256",
                            "name": "tokenId",
                            "type": "uint256"
                        },
                        {
                            "indexed": false,
                            "internalType": "string",
                            "name": "uri",
                            "type": "string"
                        }
                    ],
                    "name": "NFTMinted",
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
                    "name": "NFTTransferred",
                    "type": "event"
                },
                {
                    "inputs": [
                        {
                            "internalType": "uint256",
                            "name": "tokenId",
                            "type": "uint256"
                        }
                    ],
                    "name": "getCreationTimestamp",
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
                    "name": "getCreator",
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
                            "internalType": "address",
                            "name": "to",
                            "type": "address"
                        },
                        {
                            "internalType": "string",
                            "name": "uri",
                            "type": "string"
                        }
                    ],
                    "name": "mintNFT",
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
                            "internalType": "uint256[]",
                            "name": "tokenIds",
                            "type": "uint256[]"
                        }
                    ],
                    "name": "transferNFT",
                    "outputs": [
                        {
                            "internalType": "bool",
                            "name": "",
                            "type": "bool"
                        }
                    ],
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
            
            // Create contract instance
            this.contract = new this.web3.eth.Contract(contractABI, this.contractAddress);
            
            // Verify contract deployment
            const code = await this.web3.eth.getCode(this.contractAddress);
            console.log('Contract code length:', code.length);
            console.log('Contract code (first 100 chars):', code.substring(0, 100));
            
            if (code === '0x') {
                throw new Error('Contract not deployed at this address');
            }

            // Verify contract functions
            try {
                console.log('Attempting to call getMintPrice...');
                const mintPrice = await this.contract.methods.getMintPrice().call();
                console.log('Contract getMintPrice function verified. Mint price:', mintPrice);
                
                console.log('Attempting to call getTokenCount...');
                const tokenCount = await this.contract.methods.getTokenCount().call();
                console.log('Contract getTokenCount function verified. Token count:', tokenCount);
            } catch (error) {
                console.error('Detailed error when verifying contract functions:', {
                    message: error.message,
                    code: error.code,
                    data: error.data,
                    stack: error.stack
                });
                throw new Error('Contract functions not accessible. Please verify contract deployment.');
            }
        } catch (error) {
            console.error('Error initializing contract:', error);
            throw error;
        }
    }

    async mintNFT(imageData, account) {
        try {
            console.log('Starting NFT minting process...');
            console.log('Account:', account);
            console.log('Contract address:', this.contractAddress);
            
            // Verify contract is initialized
            if (!this.contract) {
                throw new Error('Contract not initialized');
            }

            // Get current token count first
            const tokenCount = await this.contract.methods.getTokenCount().call();
            console.log('Current token count:', tokenCount);

            // Check if max tokens reached
            if (tokenCount >= 10000) {
                throw new Error('Maximum token limit reached');
            }

            // Convert base64 to blob
            const base64Data = imageData.split(',')[1] || imageData;
            const binary = atob(base64Data);
            const array = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                array[i] = binary.charCodeAt(i);
            }
            const blob = new Blob([array], { type: 'image/png' });

            // Create form data for image upload
            const imageFormData = new FormData();
            imageFormData.append('file', blob, 'nft-image.png');

            // Upload image to Pinata
            const imageResponse = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', imageFormData, {
                maxBodyLength: 'Infinity',
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'pinata_api_key': this.pinataApiKey,
                    'pinata_secret_api_key': this.pinataSecretKey
                }
            });

            const imageIPFSHash = imageResponse.data.IpfsHash;
            console.log('Image uploaded to IPFS:', imageIPFSHash);

            // Create metadata JSON with direct gateway URLs
            const metadata = {
                name: "Monad Whiteboard NFT #" + (parseInt(tokenCount) + 1),
                description: "A unique whiteboard drawing minted as an NFT on the Monad blockchain",
                image: `https://ipfs.io/ipfs/${imageIPFSHash}`,
                animation_url: `https://ipfs.io/ipfs/${imageIPFSHash}`,
                image_url: `https://ipfs.io/ipfs/${imageIPFSHash}`,
                external_url: `https://ipfs.io/ipfs/${imageIPFSHash}`,
                attributes: [
                    {
                        trait_type: "Creation Date",
                        value: new Date().toISOString()
                    },
                    {
                        trait_type: "Creator",
                        value: account
                    },
                    {
                        trait_type: "IPFS Hash",
                        value: imageIPFSHash
                    }
                ],
                background_color: "000000"
            };

            // Upload metadata to Pinata
            const metadataResponse = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', metadata, {
                headers: {
                    'Content-Type': 'application/json',
                    'pinata_api_key': this.pinataApiKey,
                    'pinata_secret_api_key': this.pinataSecretKey
                }
            });

            const metadataIPFSHash = metadataResponse.data.IpfsHash;
            console.log('Metadata uploaded to IPFS:', metadataIPFSHash);
            
            // Construct the metadata URI using direct gateway URL
            const metadataURI = `https://ipfs.io/ipfs/${metadataIPFSHash}`;
            console.log('Metadata URI for contract:', metadataURI);
            
            // Log the metadata content for verification
            console.log('Metadata content:', JSON.stringify(metadata, null, 2));
            
            // Verify metadata is accessible
            try {
                const verifyMetadata = await axios.get(metadataURI);
                console.log('Metadata verification successful:', verifyMetadata.data);
            } catch (error) {
                console.warn('Metadata verification warning:', error.message);
            }

            // Get the mint price from the contract
            const mintPrice = await this.contract.methods.getMintPrice().call();
            console.log('Mint price:', mintPrice);

            // Get account balance
            const balance = await this.web3.eth.getBalance(account);
            console.log('Account balance:', balance);

            // Check if balance is sufficient
            if (balance < mintPrice) {
                throw new Error('Insufficient balance for minting');
            }

            // Get current gas price
            const gasPrice = await this.web3.eth.getGasPrice();
            console.log('Current gas price:', gasPrice);

            // Estimate gas for the transaction
            const gasEstimate = await this.contract.methods.mintNFT(
                account,
                metadataURI
            ).estimateGas({ from: account, value: mintPrice });
            
            console.log('Estimated gas:', gasEstimate);

            // Prepare transaction parameters with higher gas limit
            const txParams = {
                from: account,
                value: mintPrice,
                gas: Math.floor(gasEstimate * 1.2), // Add 20% buffer to gas estimate
                gasPrice: gasPrice
            };

            console.log('Transaction parameters:', txParams);

            // Call the mintNFT function with IPFS hash
            const result = await this.contract.methods.mintNFT(
                account,
                metadataURI
            ).send(txParams);

            console.log('Minting successful:', result);
            
            // Verify the token URI after minting
            try {
                const tokenId = result.events.NFTMinted.returnValues.tokenId;
                const storedURI = await this.contract.methods.tokenURI(tokenId).call();
                console.log('Stored token URI:', storedURI);
                if (storedURI !== metadataURI) {
                    console.warn('Warning: Stored URI does not match expected URI');
                }
            } catch (error) {
                console.warn('Token URI verification warning:', error.message);
            }

            return result;
        } catch (error) {
            console.error('Detailed minting error:', {
                message: error.message,
                code: error.code,
                data: error.data,
                stack: error.stack
            });
            
            // Check for specific error conditions
            if (error.message.includes('insufficient funds')) {
                throw new Error('Insufficient funds for transaction. Please ensure you have enough ETH for the mint price and gas fees.');
            } else if (error.message.includes('gas required exceeds allowance')) {
                throw new Error('Transaction requires more gas than allowed. Please try with a smaller image or contact support.');
            } else if (error.message.includes('execution reverted')) {
                throw new Error('Transaction reverted. Please ensure the contract is properly deployed and you have the correct permissions.');
            } else if (error.message.includes('Maximum token limit reached')) {
                throw new Error('Maximum token limit reached. No more NFTs can be minted.');
            } else {
                throw new Error(`Minting failed: ${error.message}`);
            }
        }
    }

    async optimizeImage(imageData) {
        try {
            // Remove header from base64 if present
            const base64Data = imageData.split(',')[1] || imageData;
            
            // Convert to binary
            const binary = atob(base64Data);
            
            // Create array buffer
            const array = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                array[i] = binary.charCodeAt(i);
            }
            
            // Create blob
            const blob = new Blob([array], { type: 'image/png' });
            
            // Create canvas for resizing
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Wait for image to load
            await new Promise((resolve) => {
                img.onload = resolve;
                img.src = URL.createObjectURL(blob);
            });
            
            // Calculate new dimensions (max 400px to reduce gas costs)
            const maxSize = 400;
            let width = img.width;
            let height = img.height;
            
            if (width > maxSize || height > maxSize) {
                if (width > height) {
                    height = Math.round((height * maxSize) / width);
                    width = maxSize;
                } else {
                    width = Math.round((width * maxSize) / height);
                    height = maxSize;
                }
            }
            
            // Resize image
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            // Get compressed base64 with lower quality
            const compressedData = canvas.toDataURL('image/jpeg', 0.6);
            
            // Check if the compressed data is too large (limit to 100KB)
            const base64Size = compressedData.length;
            if (base64Size > 100000) {
                throw new Error('Image too large after compression. Please try with a simpler drawing.');
            }
            
            console.log('Image optimized. Original size:', base64Data.length, 'Compressed size:', base64Size);
            return compressedData.split(',')[1];
        } catch (error) {
            console.error('Error optimizing image:', error);
            throw new Error('Failed to optimize image for minting: ' + error.message);
        }
    }

    async getTokenURI(tokenId) {
        try {
            return await this.contract.methods.tokenURI(tokenId).call();
        } catch (error) {
            console.error('Error getting token URI:', error);
            throw error;
        }
    }

    async getCreator(tokenId) {
        try {
            return await this.contract.methods.getCreator(tokenId).call();
        } catch (error) {
            console.error('Error getting creator:', error);
            throw error;
        }
    }

    async getCreationTimestamp(tokenId) {
        try {
            return await this.contract.methods.getCreationTimestamp(tokenId).call();
        } catch (error) {
            console.error('Error getting creation timestamp:', error);
            throw error;
        }
    }
}

// Function to connect the whiteboard to the NFT minter
async function connectToNFTMinter(whiteboard, contractAddress, web3) {
    try {
        console.log('Connecting NFT minter...', { contractAddress });
        
        // Create NFT minter instance
        const nftMinter = new NFTMinter(web3, contractAddress);
        
        // Initialize the contract
        await nftMinter.initializeContract();
        
        // Set the minter in the whiteboard
        whiteboard.setNFTMinter(nftMinter);
        
        console.log('NFT minter connected successfully');
        
        // Get the mint button
        const mintBtn = document.getElementById('mintNFT');
        if (mintBtn) {
            mintBtn.disabled = false;
        }
        
        return nftMinter;
    } catch (error) {
        console.error('Error connecting NFT minter:', error);
        alert('Failed to initialize NFT minting. Please try reconnecting your wallet.');
        throw error;
    }
} 