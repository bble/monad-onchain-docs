// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title OnChainDoc
 * @dev 去中心化协作文档的事件日志合约
 * @notice 此合约不直接存储文档内容，而是记录所有文档编辑操作作为事件日志
 * @author 高级程序员
 */
contract OnChainDoc {
    
    /**
     * @dev 文本插入事件
     * @param author 执行插入操作的作者地址（索引参数，便于查询）
     * @param position 插入文本的位置（从0开始计算）
     * @param text 插入的文本内容
     * @notice 当用户在文档中插入文本时触发此事件
     */
    event TextInserted(
        address indexed author,
        uint256 position,
        string text
    );

    /**
     * @dev 文本删除事件
     * @param author 执行删除操作的作者地址（索引参数，便于查询）
     * @param position 删除文本的起始位置（从0开始计算）
     * @param length 删除文本的长度（字符数）
     * @notice 当用户在文档中删除文本时触发此事件
     */
    event TextDeleted(
        address indexed author,
        uint256 position,
        uint256 length
    );

    /**
     * @dev 在文档中插入文本
     * @param _position 插入位置（从0开始计算）
     * @param _text 要插入的文本内容
     * @notice 此函数会验证输入参数并发出TextInserted事件
     * @notice 不直接修改文档状态，仅记录操作日志
     */
    function insertText(uint256 _position, string memory _text) public {
        // 验证文本内容不为空
        require(bytes(_text).length > 0, "OnChainDoc: Text content cannot be empty");
        
        // 发出文本插入事件
        emit TextInserted(msg.sender, _position, _text);
    }

    /**
     * @dev 从文档中删除文本
     * @param _position 删除文本的起始位置（从0开始计算）
     * @param _length 删除文本的长度（字符数）
     * @notice 此函数会验证输入参数并发出TextDeleted事件
     * @notice 不直接修改文档状态，仅记录操作日志
     */
    function deleteText(uint256 _position, uint256 _length) public {
        // 验证删除长度大于0
        require(_length > 0, "OnChainDoc: Delete length must be greater than zero");
        
        // 发出文本删除事件
        emit TextDeleted(msg.sender, _position, _length);
    }
}
