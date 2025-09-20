import "@nomicfoundation/hardhat-toolbox";

/** @type import('hardhat/config').HardhatUserConfig */
export default {
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
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
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
