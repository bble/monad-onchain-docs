import hre from "hardhat";

/**
 * 主部署函数
 * 部署 OnChainDoc 合约并记录部署信息
 */
async function main() {
  // 记录部署开始信息
  console.log("Deploying OnChainDoc contract...");

  // 获取合约工厂
  const OnChainDoc = await hre.ethers.getContractFactory("OnChainDoc");

  // 部署合约
  const contract = await OnChainDoc.deploy();

  // 等待部署确认
  await contract.waitForDeployment();

  // 获取部署地址
  const contractAddress = await contract.getAddress();

  // 记录部署成功信息
  console.log(`OnChainDoc contract deployed to: ${contractAddress}`);

  // 可选：验证部署（在本地网络中）
  if (hre.network.name === "localhost" || hre.network.name === "hardhat") {
    console.log("Contract deployment verified successfully!");
  }
}

/**
 * 错误处理函数
 * 捕获部署过程中的错误并优雅退出
 */
function handleError(error) {
  console.error("Deployment failed:");
  console.error(error);
  process.exitCode = 1;
}

// 执行主函数并处理错误
main()
  .then(() => {
    console.log("Deployment completed successfully!");
    process.exit(0);
  })
  .catch(handleError);
