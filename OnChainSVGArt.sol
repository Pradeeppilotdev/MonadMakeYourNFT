// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract OnChainSVGArt is ERC721URIStorage, Ownable {
    using Strings for uint256;
    
    uint256 public nextTokenId;
    uint256 public mintPrice = 0; // Free minting, can be changed by owner
    
    // Events
    event ArtMinted(uint256 indexed tokenId, address indexed artist, string svgData);
    event MintPriceUpdated(uint256 newPrice);
    
    constructor() ERC721("OnChain SVG Art", "OCSVG") Ownable(msg.sender) {}
    
    /**
     * @dev Mint a new on-chain SVG NFT
     * @param svg The SVG data to store on-chain
     * @param title Optional title for the artwork
     * @param description Optional description
     */
    function mint(string memory svg, string memory title, string memory description) 
        external 
        payable 
        returns (uint256) 
    {
        require(msg.value >= mintPrice, "Insufficient payment");
        require(bytes(svg).length > 0, "SVG data cannot be empty");
        require(bytes(svg).length < 50000, "SVG too large"); // Gas limit protection
        
        uint256 tokenId = nextTokenId++;
        
        // Create the data URI for the SVG
        string memory imageUri = string(abi.encodePacked(
            "data:image/svg+xml;base64,",
            base64(bytes(svg))
        ));
        
        // Create the metadata JSON
        string memory json = createMetadata(tokenId, title, description, imageUri);
        
        // Create the token URI (data URI)
        string memory tokenUri = string(abi.encodePacked(
            "data:application/json;base64,",
            base64(bytes(json))
        ));
        
        // Mint the token
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenUri);
        
        emit ArtMinted(tokenId, msg.sender, svg);
        return tokenId;
    }
    
    /**
     * @dev Create metadata JSON for the NFT
     */
    function createMetadata(
        uint256 tokenId, 
        string memory title, 
        string memory description, 
        string memory imageUri
    ) internal pure returns (string memory) {
        string memory name = bytes(title).length > 0 
            ? title 
            : string(abi.encodePacked("OnChain SVG Art #", tokenId.toString()));
            
        string memory desc = bytes(description).length > 0 
            ? description 
            : "Fully on-chain SVG NFT created with Magical Board";
        
        return string(abi.encodePacked(
            '{"name":"', name, '",',
            '"description":"', desc, '",',
            '"image":"', imageUri, '",',
            '"attributes":[',
            '{"trait_type":"Type","value":"On-Chain SVG"},',
            '{"trait_type":"Token ID","value":"', tokenId.toString(), '"}',
            ']}'
        ));
    }
    
    /**
     * @dev Get the SVG data for a token (for frontend use)
     */
    function getSVGData(uint256 tokenId) external view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        string memory tokenUri = tokenURI(tokenId);
        
        // Extract SVG from the data URI
        // This is a simplified version - in practice you might want to decode the base64
        return tokenUri;
    }
    
    /**
     * @dev Update mint price (owner only)
     */
    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
        emit MintPriceUpdated(newPrice);
    }
    
    /**
     * @dev Withdraw contract balance (owner only)
     */
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    /**
     * @dev Get total supply
     */
    function totalSupply() external view returns (uint256) {
        return nextTokenId;
    }
    
    /**
     * @dev Check if token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
    
    // --- Base64 encoding functions ---
    
    /**
     * @dev Base64 encode function
     */
    function base64(bytes memory data) internal pure returns (string memory) {
        string memory TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        uint256 len = data.length;
        if (len == 0) return "";
        
        // multiply by 4/3 rounded up
        uint256 encodedLen = 4 * ((len + 2) / 3);
        string memory result = new string(encodedLen + 32);
        
        assembly {
            mstore(result, encodedLen)
            let tablePtr := add(TABLE, 1)
            let dataPtr := data
            let endPtr := add(dataPtr, len)
            let resultPtr := add(result, 32)
            
            for {} lt(dataPtr, endPtr) {}
            {
                dataPtr := add(dataPtr, 3)
                let input := mload(dataPtr)
                
                mstore8(resultPtr, mload(add(tablePtr, and(shr(18, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(12, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(6, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(input, 0x3F))))
                resultPtr := add(resultPtr, 1)
            }
            
            switch mod(len, 3)
            case 1 { mstore(sub(resultPtr, 2), shl(240, 0x3d3d)) }
            case 2 { mstore(sub(resultPtr, 1), shl(248, 0x3d)) }
        }
        
        return result;
    }
} 