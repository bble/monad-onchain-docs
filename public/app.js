// On-Chain Collaborative Editor - 完整应用逻辑
// 实现钱包连接、文档状态重构、实时协作编辑等功能

console.log('On-Chain Collaborative Editor loaded successfully!');

// 配置常量
const CONTRACT_ADDRESS = "0x63c23F3c18F220B39788f2CD8CF9978e7bc375eA"; // Monad 测试网部署的合约地址
const CONTRACT_ABI = [
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "address", "name": "author", "type": "address"},
            {"indexed": false, "internalType": "uint256", "name": "position", "type": "uint256"},
            {"indexed": false, "internalType": "string", "name": "text", "type": "string"}
        ],
        "name": "TextInserted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "address", "name": "author", "type": "address"},
            {"indexed": false, "internalType": "uint256", "name": "position", "type": "uint256"},
            {"indexed": false, "internalType": "uint256", "name": "length", "type": "uint256"}
        ],
        "name": "TextDeleted",
        "type": "event"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "_position", "type": "uint256"},
            {"internalType": "string", "name": "_text", "type": "string"}
        ],
        "name": "insertText",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "_position", "type": "uint256"},
            {"internalType": "uint256", "name": "_length", "type": "uint256"}
        ],
        "name": "deleteText",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// 全局变量
let provider;
let signer;
let contract;
let userAddress;
let docState = ""; // 本地文档状态
let isApplyingRemoteChange = false; // 防止事件循环的标志

// 防抖相关变量
let debounceTimer = null;
let pendingChanges = []; // 待处理的更改
let isProcessingChanges = false; // 是否正在处理更改

// DOM 元素引用
const connectButton = document.getElementById('connectButton');
const saveButton = document.getElementById('saveButton');
const walletStatus = document.getElementById('walletStatus');
const walletAddress = document.getElementById('walletAddress');
const editor = document.getElementById('editor');
const status = document.getElementById('status');

// 应用初始化
window.addEventListener('load', function() {
    console.log('页面加载完成，初始化应用...');
    
    // 检查 Ethers.js 是否加载
    if (typeof ethers === 'undefined') {
        console.error('Ethers.js 库未正确加载，请检查网络连接或 CDN 状态');
        updateStatus('Ethers.js 库加载失败，请刷新页面重试', 'error');
        return;
    }
    
    console.log('Ethers.js 库加载成功，版本:', ethers.version);
    
    // 绑定事件监听器
    connectButton.addEventListener('click', connectWallet);
    saveButton.addEventListener('click', () => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
            processPendingChanges();
        }
    });
    editor.addEventListener('input', handleTextInput);
    
    // 检查是否已连接钱包
    checkWalletConnection();
});

/**
 * 检查网络健康状态
 */
async function checkNetworkHealth() {
    try {
        // 尝试获取最新的几个区块
        const currentBlock = await provider.getBlockNumber();
        const block1 = await provider.getBlock(currentBlock);
        const block2 = await provider.getBlock(currentBlock - 1);
        
        // 检查区块时间戳是否合理
        const timeDiff = block1.timestamp - block2.timestamp;
        const isHealthy = timeDiff > 0 && timeDiff < 300; // 区块间隔应该在 0-300 秒之间
        
        console.log('网络健康检查:', {
            currentBlock,
            timeDiff,
            isHealthy
        });
        
        return isHealthy;
    } catch (error) {
        console.warn('网络健康检查失败:', error);
        return false;
    }
}

/**
 * 切换到 Monad 测试网
 */
async function switchToMonadTestnet() {
    try {
        // 尝试切换到 Monad 测试网
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x279F' }], // 10143 的十六进制
        });
        console.log('已切换到 Monad 测试网');
    } catch (switchError) {
        // 如果网络不存在，尝试添加网络
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0x279F', // 10143 的十六进制
                        chainName: 'Monad Testnet',
                        rpcUrls: ['https://testnet-rpc.monad.xyz'],
                        nativeCurrency: {
                            name: 'MON',
                            symbol: 'MON',
                            decimals: 18
                        },
                        blockExplorerUrls: ['https://testnet-explorer.monad.xyz']
                    }]
                });
                console.log('已添加并切换到 Monad 测试网');
            } catch (addError) {
                console.error('添加 Monad 测试网失败:', addError);
                throw new Error('请手动添加 Monad 测试网到 MetaMask');
            }
        } else {
            console.error('切换网络失败:', switchError);
            throw new Error('请手动切换到 Monad 测试网');
        }
    }
}

/**
 * 检查钱包连接状态
 */
async function checkWalletConnection() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                await connectWallet();
            }
        } catch (error) {
            console.error('检查钱包连接失败:', error);
        }
    }
}

/**
 * 连接钱包
 */
async function connectWallet() {
    try {
        updateStatus('正在连接钱包...', 'loading');
        
        // 检查 MetaMask 是否安装
        if (typeof window.ethereum === 'undefined') {
            throw new Error('请安装 MetaMask 钱包');
        }

        // 请求账户访问权限
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });

        if (accounts.length === 0) {
            throw new Error('未获取到账户');
        }

        // 初始化 Ethers.js
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        userAddress = accounts[0];
        
        // 获取网络信息
        const network = await provider.getNetwork();
        console.log('当前网络:', network);

        // 检查是否在正确的网络
        if (network.chainId !== 10143) {
            console.log('当前不在 Monad 测试网，尝试切换到 Monad 测试网...');
            updateStatus('正在切换到 Monad 测试网...', 'loading');
            await switchToMonadTestnet();
            updateStatus('已切换到 Monad 测试网', 'success');
        }

        // 检查合约地址是否已配置
        if (CONTRACT_ADDRESS === "YOUR_DEPLOYED_CONTRACT_ADDRESS") {
            throw new Error('请先在代码中配置正确的合约地址');
        }

        // 初始化合约
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        console.log('合约初始化成功:', CONTRACT_ADDRESS);

        // 测试网络连接
        try {
            console.log('测试网络连接...');
            const networkTest = await testNetworkConnection();
            if (!networkTest) {
                throw new Error('网络连接测试失败');
            }
            
            // 检查网络是否健康
            const networkHealth = await checkNetworkHealth();
            if (!networkHealth) {
                console.warn('网络可能不稳定，建议稍后重试');
            }
        } catch (networkError) {
            console.warn('网络连接测试失败:', networkError);
            throw new Error('网络连接失败，请检查网络设置');
        }

        // 更新 UI
        updateWalletUI(userAddress);
        updateStatus('钱包连接成功！', 'success');
        
        // 初始化文档
        await initializeDocument();

    } catch (error) {
        console.error('连接钱包失败:', error);
        updateStatus('连接钱包失败: ' + error.message, 'error');
    }
}

/**
 * 更新钱包 UI
 */
function updateWalletUI(address) {
    walletStatus.textContent = '钱包已连接';
    walletAddress.textContent = `${address.slice(0, 6)}...${address.slice(-4)}`;
    connectButton.textContent = '断开连接';
    connectButton.onclick = disconnectWallet;
    saveButton.style.display = 'inline-block';
}

/**
 * 断开钱包连接
 */
async function disconnectWallet() {
    walletStatus.textContent = '钱包未连接';
    walletAddress.textContent = '请连接您的 MetaMask 钱包';
    connectButton.textContent = '连接钱包';
    connectButton.onclick = connectWallet;
    saveButton.style.display = 'none';
    
    editor.disabled = true;
    editor.value = '';
    docState = '';
    
    // 清除防抖定时器
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
    }
    pendingChanges = [];
    isProcessingChanges = false;
    
    // 移除事件监听器
    if (contract) {
        contract.removeAllListeners();
    }
    
    updateStatus('钱包已断开连接', 'success');
}

/**
 * 初始化文档 - 从区块链事件重构文档状态
 */
async function initializeDocument() {
    try {
        updateStatus('重构文档...', 'loading');
        
        console.log('开始查询历史事件...');
        console.log('合约地址:', CONTRACT_ADDRESS);
        console.log('当前网络:', await provider.getNetwork());
        
        // 查询所有历史事件
        const insertFilter = contract.filters.TextInserted();
        const deleteFilter = contract.filters.TextDeleted();
        
        // 获取当前区块号，只查询最近的一些区块
        const currentBlock = await provider.getBlockNumber();
        console.log('当前区块号:', currentBlock);
        
        // 只查询最近 100 个区块，避免查询范围过大
        const fromBlock = Math.max(0, currentBlock - 100);
        console.log('查询范围:', fromBlock, '到', currentBlock);
        
        console.log('查询插入事件...');
        let insertEvents, deleteEvents;
        
        try {
            insertEvents = await contract.queryFilter(insertFilter, fromBlock, currentBlock);
            console.log('查询删除事件...');
            deleteEvents = await contract.queryFilter(deleteFilter, fromBlock, currentBlock);
        } catch (queryError) {
            console.warn('查询失败，尝试更小的范围...', queryError);
            // 如果查询失败，尝试只查询最近 10 个区块
            const smallFromBlock = Math.max(0, currentBlock - 10);
            console.log('尝试查询范围:', smallFromBlock, '到', currentBlock);
            
            insertEvents = await contract.queryFilter(insertFilter, smallFromBlock, currentBlock);
            deleteEvents = await contract.queryFilter(deleteFilter, smallFromBlock, currentBlock);
        }
        
        console.log(`找到 ${insertEvents.length} 个插入事件，${deleteEvents.length} 个删除事件`);
        
        // 合并事件数组
        const allEvents = [...insertEvents, ...deleteEvents];
        
        // 按时间顺序排序
        allEvents.sort((a, b) => {
            if (a.blockNumber !== b.blockNumber) {
                return a.blockNumber - b.blockNumber;
            }
            return a.transactionIndex - b.transactionIndex;
        });
        
        console.log('按时间排序的事件:', allEvents.length);
        
        // 应用所有事件重构文档
        let reconstructedDoc = "";
        for (const event of allEvents) {
            reconstructedDoc = applyEvent(reconstructedDoc, event);
        }
        
        // 更新全局状态和编辑器
        docState = reconstructedDoc;
        editor.value = reconstructedDoc;
        editor.disabled = false;
        
        updateStatus('文档加载完成', 'success');
        
        // 开始监听实时更新
        listenForLiveUpdates();
        
        // 添加测试按钮（临时）
        addTestButton();
        
    } catch (error) {
        console.error('文档初始化失败:', error);
        console.error('错误详情:', {
            message: error.message,
            code: error.code,
            reason: error.reason,
            data: error.data
        });
        
        // 如果是 RPC 错误，提供更友好的错误信息
        if (error.message && error.message.includes('RPC')) {
            updateStatus('网络连接失败，请检查网络设置或稍后重试', 'error');
        } else {
            updateStatus('文档初始化失败: ' + error.message, 'error');
        }
        
        // 即使初始化失败，也启用编辑器让用户可以尝试编辑
        editor.disabled = false;
        updateStatus('编辑器已启用，您可以尝试编辑', 'success');
    }
}

/**
 * 应用单个事件到文档
 */
function applyEvent(document, event) {
    if (event.event === 'TextInserted') {
        const [author, position, text] = event.args;
        const pos = parseInt(position);
        return document.slice(0, pos) + text + document.slice(pos);
    } else if (event.event === 'TextDeleted') {
        const [author, position, length] = event.args;
        const pos = parseInt(position);
        const len = parseInt(length);
        return document.slice(0, pos) + document.slice(pos + len);
    }
    return document;
}

/**
 * 监听实时更新
 */
function listenForLiveUpdates() {
    if (!contract) {
        console.log('合约未初始化，无法监听事件');
        return;
    }
    
    console.log('开始监听实时更新...');
    
    // 监听文本插入事件
    contract.on('TextInserted', async (author, position, text, event) => {
        try {
            // 检查是否是远程更改
            if (author.toLowerCase() !== userAddress.toLowerCase()) {
                console.log('收到远程插入事件:', { author, position, text });
                
                isApplyingRemoteChange = true;
                
                // 保存光标位置
                const cursorPos = editor.selectionStart;
                
                // 应用事件到本地状态
                docState = applyEvent(docState, event);
                
                // 更新编辑器
                editor.value = docState;
                
                // 智能恢复光标位置
                let newCursorPos = cursorPos;
                const insertPos = parseInt(position);
                if (insertPos <= cursorPos) {
                    newCursorPos = cursorPos + text.length;
                }
                
                editor.setSelectionRange(newCursorPos, newCursorPos);
                
                updateStatus(`远程插入: "${text.slice(0, 20)}${text.length > 20 ? '...' : ''}"`, 'success');
                
                isApplyingRemoteChange = false;
            }
        } catch (error) {
            console.error('处理远程插入事件失败:', error);
            isApplyingRemoteChange = false;
        }
    });
    
    // 监听文本删除事件
    contract.on('TextDeleted', async (author, position, length, event) => {
        try {
            // 检查是否是远程更改
            if (author.toLowerCase() !== userAddress.toLowerCase()) {
                console.log('收到远程删除事件:', { author, position, length });
                
                isApplyingRemoteChange = true;
                
                // 保存光标位置
                const cursorPos = editor.selectionStart;
                
                // 应用事件到本地状态
                docState = applyEvent(docState, event);
                
                // 更新编辑器
                editor.value = docState;
                
                // 智能恢复光标位置
                let newCursorPos = cursorPos;
                const deletePos = parseInt(position);
                const deleteLen = parseInt(length);
                if (deletePos < cursorPos) {
                    newCursorPos = Math.max(deletePos, cursorPos - deleteLen);
                }
                
                editor.setSelectionRange(newCursorPos, newCursorPos);
                
                updateStatus(`远程删除: ${length} 个字符`, 'success');
                
                isApplyingRemoteChange = false;
            }
        } catch (error) {
            console.error('处理远程删除事件失败:', error);
            isApplyingRemoteChange = false;
        }
    });
}

/**
 * 处理本地文本输入
 */
async function handleTextInput(event) {
    // 如果正在应用远程更改，忽略本地输入
    if (isApplyingRemoteChange) {
        return;
    }
    
    // 如果正在处理更改，忽略新的输入
    if (isProcessingChanges) {
        return;
    }
    
    const newValue = event.target.value;
    const oldValue = docState;
    
    // 计算差异
    const diff = calculateDiff(oldValue, newValue);
    
    if (diff.type === 'none') {
        return; // 没有变化
    }
    
    // 清除之前的防抖定时器
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }
    
    // 将更改添加到待处理列表
    pendingChanges.push(diff);
    
    // 暂时禁用防抖，直接处理
    await processPendingChanges();
}

/**
 * 处理所有待处理的更改
 */
async function processPendingChanges() {
    if (pendingChanges.length === 0 || isProcessingChanges) {
        return;
    }
    
    isProcessingChanges = true;
    updateStatus('处理编辑更改...', 'loading');
    
    try {
        console.log('处理待处理的更改:', pendingChanges.length, '个');
        
        // 合并所有更改为一个最终状态
        let finalText = docState;
        for (const change of pendingChanges) {
            if (change.type === 'insert') {
                finalText = finalText.slice(0, change.position) + change.text + finalText.slice(change.position);
            } else if (change.type === 'delete') {
                finalText = finalText.slice(0, change.position) + finalText.slice(change.position + change.length);
            }
        }
        
        // 计算最终差异（从原始状态到最终状态）
        const finalDiff = calculateDiff(docState, finalText);
        
        if (finalDiff.type === 'insert') {
            await handleInsertion(finalDiff);
        } else if (finalDiff.type === 'delete') {
            await handleDeletion(finalDiff);
        }
        
        // 清空待处理列表
        pendingChanges = [];
        
    } catch (error) {
        console.error('处理待处理更改失败:', error);
        updateStatus('处理编辑失败: ' + error.message, 'error');
        
        // 恢复编辑器状态
        editor.value = docState;
    } finally {
        isProcessingChanges = false;
    }
}

/**
 * 计算文本差异
 */
function calculateDiff(oldText, newText) {
    const oldLen = oldText.length;
    const newLen = newText.length;
    
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
    
    if (newLen > oldLen) {
        // 插入操作
        return {
            type: 'insert',
            position: start,
            text: newText.slice(start, newEnd)
        };
    } else if (newLen < oldLen) {
        // 删除操作
        return {
            type: 'delete',
            position: start,
            length: oldEnd - start
        };
    }
    
    return { type: 'none' };
}

/**
 * 处理长文本插入（分批处理）
 */
async function handleLongTextInsertion(diff) {
    try {
        const chunkSize = 50; // 每批50个字符
        const text = diff.text;
        let currentPosition = diff.position;
        
        updateStatus('分批处理长文本...', 'loading');
        
        for (let i = 0; i < text.length; i += chunkSize) {
            const chunk = text.slice(i, i + chunkSize);
            console.log(`处理文本块 ${Math.floor(i/chunkSize) + 1}:`, chunk);
            
            const tx = await contract.insertText(currentPosition, chunk);
            console.log('块交易已发送:', tx.hash);
            
            const receipt = await tx.wait();
            console.log('块交易确认:', receipt.status === 1 ? '成功' : '失败');
            
            // 更新位置
            currentPosition += chunk.length;
            
            // 更新本地状态
            docState = docState.slice(0, currentPosition - chunk.length) + chunk + docState.slice(currentPosition - chunk.length);
            
            // 短暂延迟避免网络拥堵
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        updateStatus('长文本插入完成！', 'success');
        
    } catch (error) {
        console.error('长文本插入失败:', error);
        updateStatus('长文本插入失败: ' + error.message, 'error');
        throw error;
    }
}

/**
 * 测试网络连接和 RPC 状态
 */
async function testNetworkConnection() {
    try {
        console.log('测试网络连接...');
        
        // 测试基本连接
        const blockNumber = await provider.getBlockNumber();
        console.log('当前区块号:', blockNumber);
        
        // 测试 gas 价格
        const gasPrice = await provider.getGasPrice();
        console.log('当前 gas 价格:', gasPrice.toString());
        
        // 测试账户余额
        const balance = await provider.getBalance(userAddress);
        console.log('账户余额:', balance.toString());
        
        // 测试网络 ID
        const network = await provider.getNetwork();
        console.log('网络信息:', network);
        
        return true;
    } catch (error) {
        console.error('网络连接测试失败:', error);
        return false;
    }
}

/**
 * 添加测试按钮（临时调试用）
 */
function addTestButton() {
    // 检查是否已经添加了测试按钮
    if (document.getElementById('testButton')) return;
    
    const testButton = document.createElement('button');
    testButton.id = 'testButton';
    testButton.textContent = '测试事件监听';
    testButton.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 1000;
        background: #007bff;
        color: white;
        border: none;
        padding: 10px;
        border-radius: 5px;
        cursor: pointer;
    `;
    
    testButton.onclick = async () => {
        try {
            console.log('测试事件监听...');
            const tx = await contract.insertText(0, '测试文本 ' + Date.now());
            console.log('测试交易已发送:', tx.hash);
            updateStatus('测试交易已发送，请检查控制台', 'success');
        } catch (error) {
            console.error('测试失败:', error);
            updateStatus('测试失败: ' + error.message, 'error');
        }
    };
    
    document.body.appendChild(testButton);
}

/**
 * 处理插入操作
 */
async function handleInsertion(diff) {
    try {
        updateStatus('发送插入交易...', 'loading');
        
        // 让 MetaMask 完全自动处理 gas 设置
        console.log('发送插入交易，参数:', {
            position: diff.position,
            text: diff.text
        });
        
        console.log('准备调用合约 insertText 函数...');
        console.log('合约地址:', contract.address);
        console.log('函数参数:', diff.position, diff.text);
        console.log('文本长度:', diff.text.length);
        console.log('文本字节长度:', new TextEncoder().encode(diff.text).length);
        
        // 移除文本长度限制
        
        // 先测试合约连接
        try {
            const code = await provider.getCode(contract.address);
            console.log('合约代码长度:', code.length);
            if (code === '0x') {
                throw new Error('合约地址无效或未部署');
            }
        } catch (error) {
            console.error('合约验证失败:', error);
            throw error;
        }
        
        // 移除测试交易逻辑
        
        // 移除分批处理逻辑
        
        // 最简单的调用方式
        console.log('尝试调用合约...');
        
        try {
            const tx = await contract.insertText(diff.position, diff.text);
            console.log('交易已发送:', tx.hash);
            updateStatus('等待交易确认...', 'loading');
            
            const receipt = await tx.wait();
            console.log('交易确认:', receipt);
        } catch (error) {
            console.error('合约调用失败:', error);
            throw error;
        }
        
        // 更新本地状态
        docState = docState.slice(0, diff.position) + diff.text + docState.slice(diff.position);
        
        updateStatus('插入成功！', 'success');
        
    } catch (error) {
        console.error('插入操作失败:', error);
        console.error('错误详情:', {
            message: error.message,
            code: error.code,
            reason: error.reason,
            data: error.data
        });
        
        // 提供更友好的错误信息
        let errorMessage = '插入失败: ' + error.message;
        if (error.code === -32603) {
            errorMessage = '交易失败，请检查网络连接或稍后重试';
        } else if (error.message.includes('insufficient funds')) {
            errorMessage = '余额不足，请确保钱包中有足够的 MON 代币';
        }
        
        updateStatus(errorMessage, 'error');
        
        // 恢复编辑器状态
        editor.value = docState;
    }
}

/**
 * 处理删除操作
 */
async function handleDeletion(diff) {
    try {
        updateStatus('发送删除交易...', 'loading');
        
        // 让 MetaMask 完全自动处理 gas 设置
        console.log('发送删除交易，参数:', {
            position: diff.position,
            length: diff.length
        });
        
        // 最简单的调用方式
        try {
            const tx = await contract.deleteText(diff.position, diff.length);
            console.log('交易已发送:', tx.hash);
            updateStatus('等待交易确认...', 'loading');
            
            const receipt = await tx.wait();
            console.log('交易确认:', receipt);
        } catch (error) {
            console.error('合约调用失败:', error);
            throw error;
        }
        
        // 更新本地状态
        docState = docState.slice(0, diff.position) + docState.slice(diff.position + diff.length);
        
        updateStatus('删除成功！', 'success');
        
    } catch (error) {
        console.error('删除操作失败:', error);
        console.error('错误详情:', {
            message: error.message,
            code: error.code,
            reason: error.reason,
            data: error.data
        });
        
        // 提供更友好的错误信息
        let errorMessage = '删除失败: ' + error.message;
        if (error.code === -32603) {
            errorMessage = '交易失败，请检查网络连接或稍后重试';
        } else if (error.message.includes('insufficient funds')) {
            errorMessage = '余额不足，请确保钱包中有足够的 MON 代币';
        }
        
        updateStatus(errorMessage, 'error');
        
        // 恢复编辑器状态
        editor.value = docState;
    }
}

/**
 * 更新状态显示
 */
function updateStatus(message, type = '') {
    status.textContent = message;
    status.className = type ? `status-${type}` : '';
    
    // 自动清除成功状态消息
    if (type === 'success') {
        setTimeout(() => {
            if (status.textContent === message) {
                status.textContent = '准备就绪';
                status.className = '';
            }
        }, 3000);
    }
}

// 导出函数供外部使用
window.app = {
    connectWallet,
    disconnectWallet,
    updateStatus,
    contract: () => contract,
    signer: () => signer,
    provider: () => provider,
    docState: () => docState
};
