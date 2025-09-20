// On-Chain Collaborative Editor - 完整应用逻辑
// 实现钱包连接、文档状态重构、实时协作编辑等功能

console.log('On-Chain Collaborative Editor loaded successfully!');

// 配置常量
const CONTRACT_ADDRESS = "0x63c23F3c18F220B39788f2CD8CF9978e7bc375eA"; // Monad 测试网部署的合约地址
const CONTRACT_ABI = [
    // 事件定义
    "event TextInserted(address indexed author, uint256 position, string text)",
    "event TextDeleted(address indexed author, uint256 position, uint256 length)",
    
    // 函数定义
    "function insertText(uint256 _position, string memory _text) public",
    "function deleteText(uint256 _position, uint256 _length) public"
];

// 全局变量
let provider;
let signer;
let contract;
let userAddress;
let docState = ""; // 本地文档状态
let isApplyingRemoteChange = false; // 防止事件循环的标志

// DOM 元素引用
const connectButton = document.getElementById('connectButton');
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
    editor.addEventListener('input', handleTextInput);
    
    // 检查是否已连接钱包
    checkWalletConnection();
});

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
            const blockNumber = await provider.getBlockNumber();
            console.log('当前区块号:', blockNumber);
        } catch (networkError) {
            console.warn('网络连接测试失败:', networkError);
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
}

/**
 * 断开钱包连接
 */
async function disconnectWallet() {
    walletStatus.textContent = '钱包未连接';
    walletAddress.textContent = '请连接您的 MetaMask 钱包';
    connectButton.textContent = '连接钱包';
    connectButton.onclick = connectWallet;
    
    editor.disabled = true;
    editor.value = '';
    docState = '';
    
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
    if (!contract) return;
    
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
    
    try {
        const newValue = event.target.value;
        const oldValue = docState;
        
        // 计算差异
        const diff = calculateDiff(oldValue, newValue);
        
        if (diff.type === 'insert') {
            await handleInsertion(diff);
        } else if (diff.type === 'delete') {
            await handleDeletion(diff);
        }
        
    } catch (error) {
        console.error('处理文本输入失败:', error);
        updateStatus('处理编辑失败: ' + error.message, 'error');
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
 * 处理插入操作
 */
async function handleInsertion(diff) {
    try {
        updateStatus('发送插入交易...', 'loading');
        
        const tx = await contract.insertText(diff.position, diff.text);
        updateStatus('等待交易确认...', 'loading');
        
        await tx.wait();
        
        // 更新本地状态
        docState = docState.slice(0, diff.position) + diff.text + docState.slice(diff.position);
        
        updateStatus('插入成功！', 'success');
        
    } catch (error) {
        console.error('插入操作失败:', error);
        updateStatus('插入失败: ' + error.message, 'error');
        
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
        
        const tx = await contract.deleteText(diff.position, diff.length);
        updateStatus('等待交易确认...', 'loading');
        
        await tx.wait();
        
        // 更新本地状态
        docState = docState.slice(0, diff.position) + docState.slice(diff.position + diff.length);
        
        updateStatus('删除成功！', 'success');
        
    } catch (error) {
        console.error('删除操作失败:', error);
        updateStatus('删除失败: ' + error.message, 'error');
        
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
