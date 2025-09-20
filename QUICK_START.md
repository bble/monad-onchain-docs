# 快速开始指南

## 🚀 5 分钟快速部署

### 1. 配置私钥
```bash
# 编辑 hardhat.config.js，替换私钥
vim hardhat.config.js
```

### 2. 部署合约
```bash
npx hardhat run scripts/deploy.js --network monadTestnet
```

### 3. 更新合约地址
```bash
# 复制部署输出的合约地址，更新 public/app.js
vim public/app.js
# 将 CONTRACT_ADDRESS 替换为实际地址
```

### 4. 启动前端
```bash
npm install -g live-server
cd public
live-server --port=8000 --open
```

### 5. 测试协作
- 打开两个浏览器窗口
- 分别连接不同的 MetaMask 账户
- 开始实时协作编辑！

## 📋 检查清单

- [ ] MetaMask 已安装并配置 Monad 测试网
- [ ] 钱包中有足够的 MON 测试代币
- [ ] 私钥已正确配置在 hardhat.config.js
- [ ] 合约已成功部署到 Monad 测试网
- [ ] 合约地址已更新到 public/app.js
- [ ] 本地服务器已启动并可以访问
- [ ] 两个浏览器窗口都已连接钱包
- [ ] 协作编辑功能正常工作

## 🔧 常用命令

```bash
# 编译合约
npx hardhat compile

# 运行测试
npx hardhat test

# 清理缓存
npx hardhat clean

# 查看帮助
npx hardhat help
```

## 📞 需要帮助？

查看完整文档：
- [详细运行指南](RUN_INSTRUCTIONS.md)
- [使用指南](USAGE_GUIDE.md)
- [安全配置](SECURITY_CONFIG.md)
