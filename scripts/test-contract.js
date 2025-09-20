const hre = require("hardhat");

async function main() {
    console.log("测试合约调用...");
    
    // 获取合约实例
    const contractAddress = "0x63c23F3c18F220B39788f2CD8CF9978e7bc375eA";
    const OnChainDoc = await hre.ethers.getContractFactory("OnChainDoc");
    const contract = OnChainDoc.attach(contractAddress);
    
    // 获取签名者
    const [signer] = await hre.ethers.getSigners();
    console.log("签名者地址:", await signer.getAddress());
    
    // 检查余额
    const balance = await signer.provider.getBalance(await signer.getAddress());
    console.log("余额:", balance.toString(), "wei");
    
    // 测试插入文本
    try {
        console.log("测试插入文本...");
        const tx = await contract.insertText(0, "Hello World");
        console.log("交易哈希:", tx.hash);
        
        const receipt = await tx.wait();
        console.log("交易确认:", receipt.status === 1 ? "成功" : "失败");
        
        if (receipt.status === 1) {
            console.log("✅ 合约调用成功！");
        } else {
            console.log("❌ 交易失败");
        }
        
    } catch (error) {
        console.error("❌ 合约调用失败:", error);
        console.error("错误详情:", {
            message: error.message,
            code: error.code,
            reason: error.reason
        });
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
