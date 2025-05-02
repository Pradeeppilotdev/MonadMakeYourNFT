// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/token/ERC721/ERC721.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/access/Ownable.sol";

contract MonadNFT is ERC721 {
    uint256 private _tokenIds;
    uint256 public constant MINT_PRICE = 0.01 ether;
    uint256 public constant MAX_TOKENS = 10000;

    // Mapping from token ID to metadata
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => address) private _creators;
    mapping(uint256 => uint256) private _creationTimestamps;

    // Events
    event NFTMinted(address indexed creator, uint256 indexed tokenId, string uri);
    event NFTTransferred(address indexed from, address indexed to, uint256 indexed tokenId);

    constructor() ERC721("Monad Whiteboard NFT", "MONAD") {}

    function mintNFT(address to, string memory metadata) public payable returns (uint256) {
        require(_tokenIds < MAX_TOKENS, "Maximum token limit reached");
        require(msg.value >= MINT_PRICE, "Insufficient payment");
        require(bytes(metadata).length > 0, "Metadata cannot be empty");

        _tokenIds++;
        uint256 newTokenId = _tokenIds;

        // Store metadata
        _tokenURIs[newTokenId] = metadata;
        _creators[newTokenId] = msg.sender;
        _creationTimestamps[newTokenId] = block.timestamp;

        // Mint the token
        _safeMint(to, newTokenId);

        emit NFTMinted(msg.sender, newTokenId, metadata);
        return newTokenId;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721: token does not exist");
        return _tokenURIs[tokenId];
    }

    function getCreator(uint256 tokenId) public view returns (address) {
        require(_exists(tokenId), "ERC721: token does not exist");
        return _creators[tokenId];
    }

    function getCreationTimestamp(uint256 tokenId) public view returns (uint256) {
        require(_exists(tokenId), "ERC721: token does not exist");
        return _creationTimestamps[tokenId];
    }

    function withdraw() public {
        uint256 balance = address(this).balance;
        payable(msg.sender).transfer(balance);
    }

    function getMintPrice() public pure returns (uint256) {
        return MINT_PRICE;
    }

    function getTokenCount() public view returns (uint256) {
        return _tokenIds;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        // Only check token existence for transfers, not for minting
        if (from != address(0)) {
            require(_exists(tokenId), "ERC721: token does not exist");
        }
    }

    function transferNFT(address from, address to, uint256[] memory tokenIds) public returns (bool) {
        require(from != to, "ERC721: transfer to self");
        require(tokenIds.length > 0, "ERC721: empty token batch");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(
                _isApprovedOrOwner(msg.sender, tokenIds[i]),
                "ERC721: transfer caller is not owner nor approved"
            );
            _transfer(from, to, tokenIds[i]);
            emit NFTTransferred(from, to, tokenIds[i]);
        }
        
        return true;
    }
}