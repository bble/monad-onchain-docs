# On-Chain Collaborative Editor - 使用指南

## 完整功能说明

### 核心功能特性

#### 1. 钱包连接与初始化
- **MetaMask 集成**：自动检测并连接 MetaMask 钱包
- **网络验证**：确保连接到正确的 Monad 测试网
- **合约验证**：验证合约地址配置是否正确

#### 2. 文档状态重构
- **历史事件查询**：从区块链获取所有历史编辑事件
- **时间排序**：按区块号和交易索引排序事件
- **状态重建**：通过应用所有历史事件重构完整文档

#### 3. 实时协作编辑
- **事件监听**：实时监听区块链上的新编辑事件
- **远程同步**：自动应用其他用户的编辑到本地
- **冲突避免**：防止本地和远程编辑冲突

#### 4. 智能差异检测
- **插入检测**：识别文本插入操作
- **删除检测**：识别文本删除操作
- **位置计算**：精确计算编辑位置和长度

#### 5. 用户体验优化
- **光标保持**：智能保持用户光标位置
- **状态反馈**：实时显示操作状态和结果
- **错误恢复**：自动恢复失败的编辑操作

## 使用步骤

### 第一步：部署合约

1. **配置网络**：
   ```bash
   # 编辑 hardhat.config.js，设置正确的私钥
   accounts: ["YOUR_ACTUAL_PRIVATE_KEY"]
   ```

2. **部署合约**：
   ```bash
   npx hardhat run scripts/deploy.js --network monadTestnet
   ```

3. **记录合约地址**：
   复制部署输出中的合约地址

### 第二步：配置前端

1. **更新合约地址**：
   ```javascript
   // 在 public/app.js 中更新
   const CONTRACT_ADDRESS = "0x你的实际合约地址";
   ```

2. **启动前端**：
   ```bash
   cd public
   python -m http.server 8000
   # 或使用其他本地服务器
   ```

### 第三步：使用编辑器

1. **连接钱包**：
   - 点击"连接钱包"按钮
   - 在 MetaMask 中确认连接
   - 确保网络切换到 Monad 测试网

2. **开始编辑**：
   - 等待文档重构完成
   - 在文本框中输入内容
   - 系统自动检测并发送交易

3. **协作编辑**：
   - 多个用户可以同时编辑
   - 实时看到其他用户的编辑
   - 自动同步所有更改

## 技术架构详解

### 事件驱动架构

```javascript
// 文档状态通过事件序列维护
const events = [
  { type: 'insert', position: 0, text: 'Hello' },
  { type: 'insert', position: 5, text: ' World' },
  { type: 'delete', position: 5, length: 6 }
];

// 应用事件序列重构文档
let document = "";
for (const event of events) {
  document = applyEvent(document, event);
}
```

### 差异检测算法

```javascript
// 高效的文本差异检测
function calculateDiff(oldText, newText) {
  // 找到变化开始位置
  let start = 0;
  while (start < Math.min(oldLen, newLen) && oldText[start] === newText[start]) {
    start++;
  }
  
  // 找到变化结束位置
  let oldEnd = oldLen;
  let newEnd = newLen;
  while (oldEnd > start && newEnd > start && oldText[oldEnd - 1] === newText[newEnd - 1]) {
    oldEnd--;
    newEnd--;
  }
  
  // 返回差异信息
  if (newLen > oldLen) {
    return { type: 'insert', position: start, text: newText.slice(start, newEnd) };
  } else if (newLen < oldLen) {
    return { type: 'delete', position: start, length: oldEnd - start };
  }
}
```

### 实时同步机制

```javascript
// 监听区块链事件
contract.on('TextInserted', (author, position, text, event) => {
  if (author !== userAddress) {
    // 应用远程更改
    isApplyingRemoteChange = true;
    docState = applyEvent(docState, event);
    editor.value = docState;
    isApplyingRemoteChange = false;
  }
});
```

## 高级功能

### 1. 光标位置保持

系统智能计算并保持用户光标位置：
- 插入操作：如果插入位置在光标前，光标向后移动
- 删除操作：如果删除位置在光标前，光标向前移动

### 2. 错误处理与恢复

- **网络错误**：自动重试机制
- **交易失败**：回滚到之前状态
- **连接中断**：保存本地状态，重连后同步

### 3. 性能优化

- **批量操作**：合并连续的编辑操作
- **缓存机制**：缓存历史事件减少查询
- **懒加载**：按需加载历史数据

## 故障排除

### 常见问题

1. **钱包连接失败**：
   - 确保 MetaMask 已安装
   - 检查网络设置
   - 确认账户权限

2. **合约地址错误**：
   - 验证合约地址格式
   - 确保网络匹配
   - 检查合约是否已部署

3. **文档同步问题**：
   - 检查网络连接
   - 验证事件监听器
   - 查看浏览器控制台错误

### 调试技巧

1. **查看控制台**：
   ```javascript
   // 打开浏览器开发者工具
   // 查看 Console 标签页的日志
   ```

2. **检查合约状态**：
   ```javascript
   // 在控制台中执行
   console.log(window.app.contract());
   console.log(window.app.docState());
   ```

3. **监控事件**：
   ```javascript
   // 监听所有合约事件
   contract.on('*', (event) => {
     console.log('合约事件:', event);
   });
   ```

## 扩展功能建议

1. **用户管理**：添加用户权限和身份验证
2. **版本控制**：实现文档版本历史和回滚
3. **冲突解决**：处理并发编辑冲突
4. **离线支持**：支持离线编辑和同步
5. **富文本编辑**：支持格式化文本和媒体

## 安全注意事项

1. **私钥安全**：永远不要在代码中硬编码私钥
2. **网络安全**：确保连接到正确的网络
3. **数据验证**：验证所有用户输入
4. **权限控制**：限制合约访问权限

这个协作编辑器实现了完整的去中心化文档编辑功能，支持多用户实时协作，是区块链技术在文档协作领域的有趣应用！
