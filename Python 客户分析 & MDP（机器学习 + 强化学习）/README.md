# 杂货店客户行为分析与马尔可夫决策过程（Grocery Customer Analytics & MDP）

一个基于 Python 的数据科学与机器学习项目，涵盖客户交易数据的完整分析流程：从数据预处理、特征工程、探索性可视化、聚类分析、降维到多分类器对比，最后结合马尔可夫决策过程（MDP）解决客户忠诚度管理的最优策略问题。

## 项目概述

本项目以杂货店交易数据库为数据源，通过系统性的数据分析和机器学习建模，深入挖掘客户消费行为模式。项目分为两大核心部分：**Part I** 聚焦无监督聚类与监督分类，**Part II** 运用 MDP 与价值迭代算法求解零售商客户忠诚度管理的最优策略。

## 技术栈

- **数据处理**：Pandas（数据清洗、特征工程、聚合）
- **机器学习**：scikit-learn（K-Means、PCA、Logistic Regression、Decision Tree、KNN、MLP、Naive Bayes）
- **可视化**：Matplotlib（散点图、聚类图、PCA 降维图）
- **强化学习**：自定义价值迭代 / `mdp4e.py`（MDP 求解）
- **开发环境**：Jupyter Notebook

## 核心功能

### Part I: 聚类与分类

#### 1. 数据预处理与特征工程
基于多表数据库（Customer_Survey、Customers、Sales、Transactions、Items、Stores），构建客户级特征：

| 特征 | 计算方式 |
|------|----------|
| **Number of trips** | 客户交易次数（Sale_ID 去重计数） |
| **Average sale price** | 总消费金额 ÷ 交易次数 |
| **Average item price** | 总消费金额 ÷ 总购买商品数 |

实现路径：合并 Items 价格 → 计算 Line_Total（考虑折扣）→ 按 Sale_ID 聚合 → 按 Customer_ID 汇总

#### 2. 探索性数据分析（EDA）
绘制三组散点图（2×2 子图布局）：
- **Customer Income vs. Number of Trips**：收入与购物频次无显著相关性
- **Customer Income vs. Average Sale Price**：强正相关，高收入客户单次消费更高
- **Customer Income vs. Average Item Price**：收入与商品单价几乎无关，说明价格敏感度不因收入而异

#### 3. K-Means 聚类分析
从四个特征（Num_Trips、Avg_Sale_Price、Avg_Item_Price、Cust_Income）中选取两两组合，共 **6 种特征组合**，分别进行 K-Means 聚类：

- 使用肘部法或轮廓系数确定最优 K 值
- 生成 6 张 2D 聚类可视化图，标注聚类中心
- 分析不同特征组合下的客户分群效果

#### 4. PCA 降维与聚类
- 对四个特征进行标准化后应用 **PCA**
- 取前两个主成分（PC1、PC2）
- 基于主成分进行 K-Means 聚类并可视化
- 对比 PCA 降维前后的聚类效果

#### 5. 多分类器对比实验
基于客户人口统计数据（性别、收入、年龄、子女数、婚姻状态）构建标签：
- **Low**：平均消费价格最低的 1/3 客户
- **Medium**：中间 1/3
- **High**：最高的 1/3

使用 70-30 或 80-20 划分训练/测试集，对比四类分类器：

| 分类器 | 准确率 |
|--------|--------|
| Logistic Regression | ~54.9% |
| Decision Tree | ~52.9% |
| K-Nearest Neighbors | ~51.1% |
| Neural Network (MLP) | ~55.1% |

**结论**：神经网络在该实验设置下表现最优，但所有模型准确率均处于 50-55% 区间，提示人口统计特征对消费等级的预测能力有限。

### Part II: MDP 客户忠诚度管理

#### 6. 马尔可夫决策过程建模
将零售商客户忠诚度管理建模为 MDP：

**状态空间（States）**：
- **Active (A)**：高频活跃客户
- **Hesitant (H)**：购物频次下降客户
- **At Risk (R)**：长期未购物客户

**动作空间（Actions）**：
- **Promote (P)**：发送优惠券/促销
- **Maintain (M)**：维持常规服务

**奖励函数（Rewards）**：
| 状态 | 奖励 |
|------|------|
| Active | +5（忠诚客户收益）|
| Hesitant | -1（潜在流失损失）|
| At Risk | -3（严重流失损失）|

**状态转移概率**：基于历史数据定义各状态-动作组合下的转移概率矩阵

#### 7. 价值迭代求解最优策略
使用 **Value Iteration** 算法（ε = 0.001，γ = 0.9）求解：

- 每个状态的最优价值函数 V*(s)
- 每个状态的最优策略 π*(s)（选择 Promote 或 Maintain）

目标：最大化零售商的长期期望客户价值，平衡促销成本与客户留存收益。

## 项目结构

```
customer_analytics_mdp/
├── FAIcw2-XXX.ipynb          # 主笔记本（代码 + Markdown 报告）
├── mdp4e.py                  # MDP 求解工具（提供）
├── data/                     # 数据库文件
│   └── grocery_store.db
└── README.md
```

## 运行方式

```bash
# 安装依赖
pip install sklearn pandas matplotlib

# 启动 Jupyter Notebook
jupyter notebook

# 打开 FAIcw2-XXX.ipynb，按顺序运行各单元格
```

## 关键实验结论

### 聚类分析
- 不同特征组合产生显著不同的聚类结构
- 收入与消费价格组合聚类效果最明显
- PCA 降维后聚类保留了主要数据结构

### 分类分析
- 人口统计特征对客户消费等级预测能力较弱
- 神经网络略优于传统模型，但提升有限
- 提示需要引入更多行为特征（如购物时间、品类偏好）提升模型性能

### MDP 策略
- 价值迭代收敛后，各状态最优策略指导零售商在何时投入促销资源
- 折扣因子 γ = 0.9 平衡短期收益与长期客户价值

## 项目特点

- **完整数据流水线**：从原始多表数据到可建模特征的一站式处理
- **多维度分析**：EDA + 聚类 + 降维 + 分类 + 强化学习，覆盖数据科学核心技能
- **业务导向**：所有分析围绕实际零售业务问题（客户分群、消费预测、忠诚度管理）
- **算法对比**：系统对比多种机器学习与搜索/优化算法，培养算法选型能力
- **理论结合实践**：MDP 抽象建模与实际零售场景紧密结合
