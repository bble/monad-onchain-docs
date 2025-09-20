# 安全配置指南

## 私钥管理

### 1. 环境变量方式（推荐）

创建 `.env` 文件：
```bash
# 复制示例文件
cp .env.example .env

# 编辑 .env 文件，添加您的私钥
PRIVATE_KEY=0x你的实际私钥
```

然后修改 `hardhat.config.js` 中的网络配置：
```javascript
monadTestnet: {
  url: "https://testnet-rpc.monad.xyz",
  chainId: 10143,
  accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  // 其他配置...
}
```

### 2. 直接配置方式（不推荐用于生产）

直接在 `hardhat.config.js` 中替换：
```javascript
accounts: ["0x你的实际私钥"]
```

## 安全最佳实践

1. **永远不要提交私钥到版本控制**
   - 将 `.env` 文件添加到 `.gitignore`
   - 使用 `.env.example` 作为模板

2. **使用专门的部署账户**
   - 不要使用主钱包私钥
   - 创建专门用于部署的 MetaMask 账户

3. **定期轮换私钥**
   - 定期更换部署账户
   - 监控账户活动

4. **网络隔离**
   - 测试网和主网使用不同账户
   - 避免在主网配置中使用测试私钥

## 部署命令

```bash
# 部署到 Monad 测试网
npx hardhat run scripts/deploy.js --network monadTestnet

# 部署到本地网络
npx hardhat run scripts/deploy.js --network localhost
```
