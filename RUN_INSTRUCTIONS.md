# On-Chain Collaborative Editor - 完整运行指南

## 概述

本指南将带您完成从部署智能合约到运行完整 DApp 的所有步骤。您将学会如何部署合约到 Monad 测试网，配置前端应用，并测试协作编辑功能。

## 前置要求

- Node.js (v16 或更高版本)
- MetaMask 钱包扩展
- Monad 测试网代币 (用于支付 gas 费用)

## 第一步：配置网络和私钥

### 1.1 配置 Hardhat 网络

编辑 `hardhat.config.js` 文件，将占位符私钥替换为您的实际 MetaMask 私钥：

```javascript
monadTestnet: {
  url: "https://testnet-rpc.monad.xyz",
  chainId: 10143,
  accounts: [
    "0x您的实际私钥" // 替换 "YOUR_METAMASK_PRIVATE_KEY"
  ]
}
```

⚠️ **安全提醒**：永远不要将真实私钥提交到版本控制系统！

### 1.2 获取私钥步骤

1. 打开 MetaMask 钱包
2. 点击账户详情
3. 点击"导出私钥"
4. 输入密码确认
5. 复制私钥（以 0x 开头的 64 位十六进制字符串）

## 第二步：部署智能合约

### 2.1 安装依赖

确保已安装所有必要的依赖：

```bash
npm install
```

### 2.2 部署到 Monad 测试网

运行部署命令：

```bash
npx hardhat run scripts/deploy.js --network monadTestnet
```

### 2.3 记录部署信息

部署成功后，您将看到类似以下的输出：

```
Deploying OnChainDoc contract...
OnChainDoc contract deployed to: 0x1234567890abcdef1234567890abcdef12345678
Contract deployment verified successfully!
Deployment completed successfully!
```

**重要**：请复制并保存合约地址 `0x1234567890abcdef1234567890abcdef12345678`

### 2.4 获取完整 ABI

合约的 ABI 已经在 `public/app.js` 中定义，但如果您需要完整的 ABI，可以：

1. 查看编译产物：
   ```bash
   npx hardhat compile
   cat artifacts/contracts/OnChainDoc.sol/OnChainDoc.json | jq '.abi'
   ```

2. 或者使用 Hardhat 验证工具获取验证后的 ABI

## 第三步：配置前端应用

### 3.1 更新合约地址

编辑 `public/app.js` 文件，找到以下行：

```javascript
const CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
```

将其替换为实际的合约地址：

```javascript
const CONTRACT_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";
```

### 3.2 验证 ABI 配置

确认 `CONTRACT_ABI` 常量包含正确的函数和事件定义：

```javascript
const CONTRACT_ABI = [
    "event TextInserted(address indexed author, uint256 position, string text)",
    "event TextDeleted(address indexed author, uint256 position, uint256 length)",
    "function insertText(uint256 _position, string memory _text) public",
    "function deleteText(uint256 _position, uint256 _length) public"
];
```

## 第四步：安装和启动本地服务器

### 4.1 安装 live-server

安装一个简单易用的本地 Web 服务器：

```bash
npm install -g live-server
```

或者使用其他服务器：

```bash
# 使用 Python (如果已安装)
python -m http.server 8000

# 使用 Node.js serve 包
npx serve public

# 使用 PHP (如果已安装)
php -S localhost:8000
```

### 4.2 启动服务器

进入 public 目录并启动服务器：

```bash
cd public
live-server --port=8000 --open
```

或者直接指定目录：

```bash
live-server public --port=8000 --open
```

服务器启动后，浏览器会自动打开 `http://localhost:8000`

## 第五步：连接钱包和测试

### 5.1 连接 MetaMask

1. 在浏览器中打开应用
2. 点击"连接钱包"按钮
3. 在 MetaMask 中确认连接请求
4. 确保网络切换到 Monad 测试网

### 5.2 添加 Monad 测试网

如果 MetaMask 中没有 Monad 测试网，请手动添加：

- **网络名称**：Monad Testnet
- **RPC URL**：https://testnet-rpc.monad.xyz
- **链 ID**：10143
- **符号**：MON
- **区块浏览器**：https://testnet-explorer.monad.xyz

### 5.3 获取测试代币

确保您的钱包中有足够的 MON 代币支付 gas 费用。如果没有，请访问 Monad 测试网水龙头获取测试代币。

## 第六步：测试协作功能

### 6.1 单用户测试

1. 连接钱包后，等待文档重构完成
2. 在文本框中输入一些内容
3. 观察状态栏显示"插入成功！"
4. 检查 MetaMask 中的交易记录

### 6.2 多用户协作测试

#### 方法一：使用两个浏览器窗口

1. **第一个窗口**：
   - 打开 `http://localhost:8000`
   - 连接第一个 MetaMask 账户
   - 输入一些文本，如 "Hello from User 1"

2. **第二个窗口**：
   - 打开新的浏览器窗口或隐私模式
   - 访问 `http://localhost:8000`
   - 连接不同的 MetaMask 账户
   - 等待几秒钟，应该看到第一个用户的文本
   - 添加更多文本，如 "Hello from User 2"

3. **验证同步**：
   - 在两个窗口之间切换
   - 观察文本是否实时同步
   - 检查状态栏的同步消息

#### 方法二：使用两个不同的浏览器

1. **Chrome**：连接账户 A
2. **Firefox**：连接账户 B
3. 在两个浏览器中同时编辑文档
4. 观察实时同步效果

### 6.3 测试场景

#### 场景 1：基础协作
- 用户 A 输入："这是第一段文本"
- 用户 B 在末尾添加："这是第二段文本"
- 验证：两个用户都能看到完整文本

#### 场景 2：插入操作
- 用户 A 输入："Hello World"
- 用户 B 在 "Hello" 后插入："Beautiful "
- 验证：最终文本为 "Hello Beautiful World"

#### 场景 3：删除操作
- 用户 A 输入："删除这个词"
- 用户 B 删除 "这个"
- 验证：最终文本为 "删除词"

## 故障排除

### 常见问题及解决方案

#### 1. 部署失败
```
Error: insufficient funds
```
**解决方案**：确保钱包中有足够的 MON 代币

#### 2. 连接失败
```
Error: User rejected the request
```
**解决方案**：在 MetaMask 中重新授权连接

#### 3. 文档不同步
**解决方案**：
- 检查网络连接
- 确认两个用户都在同一网络
- 查看浏览器控制台错误信息

#### 4. 交易失败
```
Error: transaction failed
```
**解决方案**：
- 增加 gas 限制
- 检查合约地址是否正确
- 确认网络状态

### 调试技巧

#### 1. 查看控制台日志
```javascript
// 打开浏览器开发者工具 (F12)
// 查看 Console 标签页
console.log('当前文档状态:', window.app.docState());
console.log('合约实例:', window.app.contract());
```

#### 2. 检查网络状态
```javascript
// 在控制台中执行
const provider = window.app.provider();
provider.getNetwork().then(console.log);
```

#### 3. 监听所有事件
```javascript
const contract = window.app.contract();
contract.on('*', (event) => {
  console.log('合约事件:', event);
});
```

## 性能优化建议

### 1. Gas 优化
- 使用较小的文本块进行编辑
- 避免频繁的小幅修改
- 考虑批量操作

### 2. 网络优化
- 使用稳定的网络连接
- 避免在网络不稳定时编辑
- 定期刷新页面重新同步

### 3. 浏览器优化
- 使用现代浏览器（Chrome, Firefox, Safari）
- 确保浏览器版本最新
- 禁用不必要的浏览器扩展

## 扩展功能

### 1. 添加更多网络
在 `hardhat.config.js` 中添加其他网络配置

### 2. 实现批量操作
修改合约以支持批量插入和删除

### 3. 添加用户权限
实现基于角色的访问控制

### 4. 版本控制
添加文档版本历史功能

## 总结

恭喜！您已经成功部署并运行了一个完整的去中心化协作编辑器。这个 DApp 展示了区块链技术在文档协作领域的强大潜力。

### 主要成就
- ✅ 部署了智能合约到 Monad 测试网
- ✅ 配置了完整的前端应用
- ✅ 实现了实时协作编辑功能
- ✅ 测试了多用户同步功能

### 下一步建议
- 尝试更复杂的协作场景
- 探索性能优化方案
- 考虑添加更多功能特性
- 部署到其他测试网络

祝您使用愉快！如有问题，请参考故障排除部分或查看项目文档。
