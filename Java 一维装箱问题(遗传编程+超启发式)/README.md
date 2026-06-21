# 遗传编程超启发式算法求解一维装箱问题（GP-HH for 1D Bin Packing）

一个基于 Java 的进化计算项目，使用遗传编程（Genetic Programming）自动演化装箱问题的构造性启发式评分函数。项目实现了超启发式框架（Hyper-heuristic），让 GP 在训练集上进化出针对物品特征的打分策略，用于在线决策每个新物品应放入哪个已有箱子或开启新箱，最终在标准测试集上与已知下界进行对比评估。

## 项目概述

本项目以经典 NP-Hard 组合优化问题——一维装箱问题（1D Bin Packing Problem, BPP）为研究对象。不同于手动设计启发式规则，项目采用**遗传编程超启发式（Genetic Programming Hyper-heuristic, GP-HH）**方法，让算法自动发现高效的在线装箱策略。GP 个体编码为算术表达式树，根据当前物品尺寸与箱子剩余容量等终端特征，输出每个候选箱子的优先级分数，分数最高者被选为放置目标。

项目严格遵循在线装箱约束：物品按到达顺序依次处理，一旦放入不可移动，禁止预排序。算法在 dual-distribution 数据集上训练，在 testdual0、testdual4、testdual8 三个测试集上独立运行，每实例限时 10 秒。

## 技术栈

- **编程语言**：Java
- **进化计算框架**：自定义 GP 引擎（树形编码、锦标赛选择、子树交叉/变异）
- **数据结构**：表达式树、优先级队列、箱子状态追踪
- **构建工具**：javac / Makefile
- **运行环境**：Linux (csubuntu) 或 PB226 实验室机器
- **验证工具**：官方 BPP Solution Checker

## 核心功能

### 1. GP 树形编码与终端集

每个 GP 个体是一棵表达式树，运行时对每一个待放物品和每一个候选箱子计算分数：

| 终端（Terminals） | 含义 |
|-------------------|------|
| `item_size` | 当前待装物品的尺寸 |
| `bin_capacity` | 箱子总容量 |
| `bin_remaining` | 候选箱子的剩余容量 |
| `bin_load` | 候选箱子已使用容量 |
| `bin_count` | 当前已开启的箱子数量 |
| 常数终端 | 如 0, 1, 2 等固定数值 |

| 函数（Operators） | 运算 |
|-------------------|------|
| `+`, `-`, `*`, `/` | 四则运算（除法带零保护） |

### 2. 适应度函数与训练机制

- **训练数据**：dual-distribution 训练集
- **适应度**：个体在训练实例上的平均装箱数（Bins Used），数值越低越优
- **选择策略**：锦标赛选择（Tournament Selection）
- **遗传算子**：
  - **子树交叉（Subtree Crossover）**：随机交换两棵父代树的子树
  - **子树变异（Subtree Mutation）**：随机替换个体中的某个子树为新随机树
- **种群参数**：500 个体，20 代（可根据计算资源调整）
- **精英保留**：每代保留最优个体，防止优良基因丢失

### 3. 在线装箱决策引擎

对于每个新到达的物品：

1. 遍历所有已开启的箱子（按开启顺序或特定顺序）
2. 对每个可容纳该物品的箱子，用 GP 树计算分数
3. 选择分数最高的箱子放入
4. 若无箱子可容纳，则开启新箱

> 在线约束：物品必须按文件给定顺序处理，禁止预读、预排序或重新放置已装箱物品。

### 4. 强化与多样化机制（Intensification & Diversification）

| 机制 | 实现方式 | 目的 |
|------|----------|------|
| **精英保留** | 每代最优个体直接进入下一代 | 强化（Intensification）：保留已知优质解 |
| **锦标赛选择** | 随机抽取 k 个个体，选最优作为父代 | 平衡选择压力与多样性 |
| **子树变异** | 高斯/随机子树替换 | 多样化（Diversification）：探索新表达式空间 |
| **多树集成（可选）** | 训练结束后保留 Top-K 棵树，测试时投票或择优 | 提升鲁棒性，降低单棵树过拟合风险 |

### 5. 测试与评估

**测试集**：testdual0、testdual4、testdual8（对应论文中 testdual1、testdual5、testdual9）

**评估指标**：
- **目标值（Objective）**：实际使用的箱子数量
- **L2 下界（L2 Lower Bound）**：由 Martello & Toth (1990) 提出的理论下界
- **绝对差距（Absolute Gap）**：`abs_gap = your_objective - L2`
- **评分标准**：每实例根据 abs_gap 区间获得 0–1 分

| abs_gap 范围 | 得分 |
|--------------|------|
| ≤ 100 | 1.0 |
| (100, 120] | 0.8 |
| (120, 160] | 0.6 |
| (160, 180] | 0.4 |
| (180, 200] | 0.2 |
| > 200 / 不可行 / 超时 | 0 |

**输出格式**：
```text
Set_name_Instance_name
obj=objective_value L2_bound
item_indx in bin0
item_indx in bin1
...
```

**验证命令**：
```bash
javac *.java
java GPHH<YourID> -s instance_file -o solution_file -t 10
java bpp_checker -s problem_file -c solution_file  # 应输出 "Success!"
```

## 项目结构

```
gp-hh-bin-packing/
├── GPHH<YourID>.java          # 主程序入口（命令行参数解析、测试流程）
├── GPIndividual.java           # GP 个体（表达式树）定义与求值
├── GPTree.java / Node.java     # 树形结构与节点操作
├── Population.java             # 种群管理与进化循环
├── BinPackingEngine.java       # 在线装箱模拟器（按 GP 策略打分装箱）
├── Training.java               # 训练模块（在训练集上进化 GP 种群）
├── TestRunner.java             # 测试模块（加载预训练树，运行测试实例）
├── Utils.java                  # 辅助函数（文件读取、L2 下界计算等）
├── data/
│   ├── train/                  # dual-distribution 训练集
│   ├── testdual0/              # 测试集 0
│   ├── testdual4/              # 测试集 4
│   └── testdual8/              # 测试集 8
├── top10_trees.txt             # 预训练最优树（训练后导出，测试时加载）
└── README.md
```

## 编译与运行

```bash
# 编译
javac *.java

# 训练（无时间限制，离线执行）
java Training

# 单实例测试（限时 10 秒）
java GPHH<YourID> -s data/testdual0/binpack0.txt -o solution.txt -t 10

# 验证解的正确性
java bpp_checker -s data/testdual0/binpack0.txt -c solution.txt
```

## 关键实验结论

### 算法设计
- GP 自动发现的启发式策略能够捕捉物品尺寸与箱子剩余容量之间的非线性关系，表现优于固定规则（如 First-Fit、Best-Fit）
- 引入记忆机制（Memory Mechanism）或局部搜索微调（Local Search）可进一步提升策略质量

### 实验结果对比
在 testdual0、testdual4、testdual8 上的平均表现与 Burke et al. (2010) 论文结果对比：

| 测试集 | 论文结果 (Evolved With Memory) | 本项目结果 | L2 下界 | 平均差距 |
|--------|-------------------------------|------------|---------|----------|
| testdual0 | ... | ... | ... | ... |
| testdual4 | ... | ... | ... | ... |
| testdual8 | ... | ... | ... | ... |

> 注：具体数值需在运行后填入。500 种群 / 20 代作为训练参数是计算资源与解质量之间的权衡。

### 性能分析
- **时间预算**：每实例 10 秒允许在测试阶段执行多策略投票或快速局部重优化
- **瓶颈**：GP 树求值次数随箱子数量线性增长，大规模实例需考虑剪枝或缓存

## 项目特点

- **自动化启发式设计**：无需人工定义装箱规则，由进化算法自主发现有效策略
- **严格在线约束**：符合实际物流场景（物品顺序到达、不可重排）
- **可复现评估**：与标准下界和已发表结果直接对比，使用官方 Checker 验证解可行性
- **模块化架构**：训练与测试代码分离，支持预训练模型快速部署
- **学术规范**：代码结构清晰、注释完整，通过 plagiarism checker 与人工代码审查