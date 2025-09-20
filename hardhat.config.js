require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // Solidity 编译器配置
  solidity: {
    version: "0.8.24", // 指定 Solidity 编译器版本
    settings: {
      optimizer: {
        enabled: true,   // 启用优化器以减少 gas 消耗
        runs: 200       // 优化运行次数
      }
    }
  },

  // 网络配置
  networks: {
    // 本地开发网络（Hardhat 内置）
    hardhat: {
      chainId: 31337
    },

    // Monad 测试网配置
    monadTestnet: {
      url: "https://testnet-rpc.monad.xyz", // Monad 测试网 RPC 端点
      chainId: 10143,                      // Monad 测试网链 ID
      accounts: [
        // ⚠️  重要安全提示：
        // 请将 "YOUR_METAMASK_PRIVATE_KEY" 替换为您的实际 MetaMask 私钥
        // 私钥格式：以 "0x" 开头的 64 位十六进制字符串
        // 示例：accounts: ["0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"]
        // 
        // 🔒 安全建议：
        // 1. 永远不要将真实私钥提交到版本控制系统
        // 2. 使用环境变量 (.env 文件) 来存储敏感信息
        // 3. 考虑使用专门的部署账户而非主钱包
        "YOUR_METAMASK_PRIVATE_KEY"
      ],
      gasPrice: "auto", // 自动设置 gas 价格
      timeout: 60000    // 请求超时时间（毫秒）
    },

    // 本地网络配置（可选）
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    }
  },

  // 路径配置
  paths: {
    sources: "./contracts",    // 合约源码目录
    tests: "./test",          // 测试文件目录
    cache: "./cache",         // 缓存目录
    artifacts: "./artifacts"  // 编译产物目录
  },

  // Gas 报告配置（可选）
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY
  }
};