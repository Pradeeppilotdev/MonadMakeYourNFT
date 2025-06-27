// Deployment script for OnChainSVGArt contract
// Run with: npx hardhat run deploy-onchain.js --network monad-testnet

const hre = require("hardhat");

async function main() {
    console.log("Deploying OnChainSVGArt contract...");

    // Get the contract factory
    const OnChainSVGArt = await hre.ethers.getContractFactory("OnChainSVGArt");
    
    // Deploy the contract
    const onChainArt = await OnChainSVGArt.deploy();
    
    // Wait for deployment to complete
    await onChainArt.waitForDeployment();
    
    // Get the deployed contract address
    const address = await onChainArt.getAddress();
    
    console.log("OnChainSVGArt deployed to:", address);
    console.log("Contract address for config.js:", address);
    
    // Verify the contract (optional)
    try {
        console.log("Verifying contract...");
        await hre.run("verify:verify", {
            address: address,
            constructorArguments: [],
        });
        console.log("Contract verified successfully!");
    } catch (error) {
        console.log("Verification failed:", error.message);
    }
    
    console.log("\n=== DEPLOYMENT COMPLETE ===");
    console.log("Contract Address:", address);
    console.log("Network:", hre.network.name);
    console.log("\nUpdate your config.js with:");
    console.log(`ONCHAIN_CONTRACT_ADDRESS: '${address}'`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 