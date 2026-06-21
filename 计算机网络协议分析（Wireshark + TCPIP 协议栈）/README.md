# 网络协议深度分析（Network Protocol Deep Dive）

一个基于 Wireshark 的网络抓包分析项目，系统性地剖析 TCP、UDP、DNS、HTTP 和 FTP 等核心互联网协议的实际行为。通过捕获真实网络流量，验证理论课堂中的协议机制，并对比不同工具（Wireshark vs nslookup）的输出差异。

## 项目概述

本项目使用 Wireshark 对访问 httpbin.org 的全过程进行抓包，深入分析从 DNS 解析、TCP 连接建立、HTTP 请求响应到数据传输的完整网络栈行为。项目结合理论分析与可视化图表，展示协议在实际网络环境中的表现。

## 技术栈

- **抓包工具**：Wireshark
- **网络工具**：nslookup
- **分析对象**：TCP、UDP、DNS、HTTP、FTP 协议
- **可视化**：Wireshark 内置图表（TCP RTT Graph、Time-Sequence Graph）

## 核心分析内容

### 1. TCP 三次握手分析
- 捕获并解析 TCP 连接建立过程
- 分析交换的关键参数：
  - **MSS**（最大报文段长度）
  - **接收窗口大小**（Window Size）
  - 其他 TCP 选项（SACK、Timestamp 等）

### 2. HTTP 图像传输 TCP 流分析
- 定位 HTTP 请求对应的 TCP 流
- 详细解析 TCP 报文组件：
  - 报文段数量
  - 标志位（SYN、ACK、FIN、PSH 等）
  - 原始序列号与确认号
  - 源/目的端口与 IP 地址
- 统计 FTP 传输所需报文段数量
- 绘制并解释：
  - **TCP RTT 图**（往返时间分析）
  - **TCP Stream Time-Sequence Graph**（时序分析）

### 3. DNS 解析过程分析
- 定位 httpbin.org 的 DNS 查询与响应
- 详细描述：
  - DNS 查询报文结构（问题部分、查询类型）
  - DNS 响应报文结构（回答部分、权威记录、附加记录）
  - 查询与响应的报文交互流程

### 4. nslookup 工具对比
- 使用 nslookup 查询 httpbin.org 的 IP 地址
- 识别其权威名称服务器（Authoritative Name Server）
- 提取并解释 nslookup 输出的其他相关信息
- **对比分析**：Wireshark 捕获的 DNS 报文 vs nslookup 命令输出

### 5. UDP 报文分析
- 选取非 DNS 的 UDP 报文进行深入分析
- 解析 UDP 报文组件：
  - 报文段数量
  - 源/目的端口
  - 长度、校验和等字段
  - 承载的上层应用协议
- 协议设计讨论：
  - 该应用层协议的目的
  - 为何选择 UDP 而非 TCP 作为传输层
  - 该协议是否也能使用 TCP？原因分析

## 分析框架

| 协议层级 | 分析重点 | 工具/方法 |
|----------|----------|-----------|
| 应用层 | HTTP 请求/响应、DNS 查询 | Wireshark 协议解析 |
| 传输层 | TCP 握手、UDP 报文、端口、序列号 | Wireshark 报文详情 |
| 网络层 | IP 地址、路由、分片 | IP 报头分析 |
| 数据链路层 | MAC 地址、帧结构 | 底层帧捕获 |

## 项目特点

- **理论与实践结合**：将课堂协议理论与真实网络流量对照
- **多工具验证**：Wireshark 抓包 + nslookup 命令行工具交叉验证
- **可视化驱动**：利用 Wireshark 图表功能直观展示协议行为
- **深度解析**：不仅识别协议，更深入分析设计决策（如 UDP vs TCP 选型）
- **完整网络栈**：从 DNS 到 TCP 到应用层，覆盖访问网站的完整流程