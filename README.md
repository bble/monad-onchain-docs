# On-Chain Collaborative Editor on Monad

基于 Monad 区块链的去中心化协作文档编辑器。

## 项目结构

```
onchain-docs/
├── contracts/           # Solidity 智能合约
│   └── OnChainDoc.sol   # 主要合约文件
├── scripts/             # 部署脚本
│   └── deploy.js        # 合约部署脚本
├── public/              # 前端界面
│   ├── index.html       # 主页面
│   └── app.js          # 前端逻辑
├── hardhat.config.js    # Hardhat 配置
└── README.md           # 项目说明
```

## 功能特性

### 智能合约
- **事件日志模式**：不直接存储文档内容，仅记录编辑操作
- **Gas 高效**：使用事件而非状态存储，降低成本
- **协作友好**：支持多用户同时编辑，通过事件同步

### 前端界面
- **现代化设计**：响应式布局，适配各种设备
- **钱包集成**：支持 OKX 钱包和 MetaMask 钱包连接
- **实时反馈**：显示连接状态和操作结果
- **用户友好**：直观的操作界面和清晰的状态提示

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置网络
编辑 `hardhat.config.js` 文件，将 `YOUR_METAMASK_PRIVATE_KEY` 替换为您的实际私钥。

### 3. 部署合约
```bash
# 部署到 Monad 测试网
npx hardhat run scripts/deploy.js --network monadTestnet

# 部署到本地网络
npx hardhat run scripts/deploy.js --network localhost
```

### 4. 启动前端
在 `public` 目录中打开 `index.html` 文件，或使用本地服务器：
```bash
# 使用 Python 启动本地服务器
cd public
python -m http.server 8000

# 或使用 Node.js
npx serve public
```

### 5. 使用应用
1. 打开浏览器访问前端界面
2. 点击"连接钱包"按钮连接 MetaMask
3. 确保网络切换到 Monad 测试网
4. 开始编辑文档（功能将在后续版本中完善）

## 技术栈

- **区块链**: Solidity, Hardhat, Ethers.js
- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **网络**: Monad Testnet
- **钱包**: MetaMask

## 开发计划

- [ ] 完善文档编辑功能
- [ ] 实现实时协作同步
- [ ] 添加用户权限管理
- [ ] 优化 Gas 消耗
- [ ] 添加合约验证
- [ ] 实现批量操作

## 安全注意事项

⚠️ **重要提醒**：
- 永远不要将真实私钥提交到版本控制系统
- 使用测试网络进行开发，避免在主网部署未经验证的合约
- 定期备份重要数据
- 仔细检查所有交易细节

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request 来改进项目！
