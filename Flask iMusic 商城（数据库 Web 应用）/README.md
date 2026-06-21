# iMusic 在线音乐商城管理系统（iMusic Online Music Store）

一个基于 Flask + SQLite 的数据库驱动 Web 应用程序，为虚构的在线音乐零售商 iMusic 实现完整的客户数据管理、统计分析和发票生成功能。项目使用 Python 标准库完成所有数据库交互，展示了从数据清洗到业务报表的完整 Web 开发流程。

## 项目概述

本项目接手了一个未完成的 Flask 网站，补全了客户数据批量更新、多维度统计可视化以及专辑购买发票生成三大核心模块。系统基于 Chinook 数据库架构，使用原生 SQL 查询实现复杂的数据聚合与关联操作。

## 技术栈

- **后端框架**：Python 3.12 + Flask 3.0.3
- **数据库**：SQLite 3.44.0（通过 `sqlite3` 标准库直连）
- **前端模板**：HTML + Jinja2（已提供，未修改）
- **数据解析**：Python `csv` 模块（TSV 文件处理）
- **约束**：零第三方 ORM（如 SQLAlchemy）或数据处理库（如 Pandas）

## 核心功能

### 1. 客户数据批量修复（TSV 导入）
- 通过 `/upload` 路由接收 TSV 文件上传
- 使用 `csv` 模块解析制表符分隔的客户数据
- 校验 `CustomerId` 存在性后，批量更新数据库中的电话（Phone）和传真（Fax）字段
- 支持部分更新：若 TSV 中 Fax 列缺失，保留原传真号码不删除
- 异常处理：无效记录静默跳过，失败时重定向回首页不崩溃

### 2. 客户统计分析与聚合报表
- 通过 `/statistics` 路由展示国家维度的客户统计
- **国家下拉菜单**：动态从数据库提取所有不重复国家，按字母升序排列，默认选项为 "All"
- **单客户统计**（按国家筛选）：
  - 客户 ID、姓名（Firstname LASTNAME 格式）、邮箱、城市
  - 发票数量（#Invoices）——包含零发票客户
  - 总消费金额（Total Amount）与平均消费（Average Amount），保留两位小数
- **聚合统计**（表格底部汇总行）：
  - 该国客户总数、总发票数、总消费金额、平均消费金额
- **安全防护**：拦截非法国家参数（如用户篡改 HTML），Flash 提示 "Invalid country selected" 并重定向

### 3. 专辑购买发票生成
- 通过 `/invoice` 路由提供交互式发票创建界面
- **客户选择下拉框**：姓名格式 Firstname LASTNAME，按姓名升序排列，值为 CustomerId
- **自动表单填充**：选择客户后，地址、城市、国家、邮编自动从数据库回填
- **专辑选购表格**：列出所有可购专辑（按艺术家名 + 专辑名升序），显示专辑标题、艺术家名、价格（专辑内所有曲目价格总和，保留两位小数）
- **发票创建逻辑**：
  - 使用 `DATETIME('now')` 自动设置发票日期
  - 在 `Invoice` 表创建记录，并关联客户与所选专辑的全部曲目
  - 支持单次交易购买多张专辑
- **错误处理体系**：
  - 无效客户 → "Invalid customer selected"
  - 无效专辑 → "Invalid album selected"
  - 其他异常 → "An error occured"
  - 成功 → "Invoice generated successfully"

## 数据库架构

基于 Chinook 数据库标准结构，主要涉及以下表：

| 表名 | 用途 |
|------|------|
| `Customer` | 客户基本信息（姓名、地址、电话、国家等） |
| `Invoice` | 发票主记录（日期、客户关联、总金额） |
| `InvoiceLine` | 发票明细（曲目关联、单价、数量） |
| `Album` | 专辑信息（标题、艺术家关联） |
| `Track` | 曲目信息（名称、所属专辑、单价、时长） |

## 项目结构
iMusic/
├── iMusic.py              # 主应用文件（所有后端逻辑）
├── templates/
│   ├── statistics.html    # 统计报表页面（已提供）
│   ├── invoice.html       # 发票生成页面（已提供）
│   └── ...                # 其他模板文件
├── data/
│   └── original_customers.tsv   # 示例 TSV 数据文件
└── database/
└── iMusic.db          # SQLite 数据库

## 关键实现细节

- **SQL 查询**：全部使用原生 SQL 字符串，包含 JOIN、GROUP BY、聚合函数（SUM、AVG、COUNT）、ROUND 格式化
- **事务安全**：发票生成涉及多表插入，确保数据一致性
- **输入验证**：所有用户输入均经过数据库存在性校验，防止注入与篡改
- **零外部依赖**：严格仅使用 Python 标准库 + Flask，符合课程约束

## 运行方式

```bash
# 启动 Flask 应用
python iMusic.py
# 或
python3 iMusic.py

# 访问各功能页面
# 数据上传: http://localhost:5000/upload
# 统计报表: http://localhost:5000/statistics
# 发票生成: http://localhost:5000/invoice

##项目特点
- **真实业务场景**：模拟从遗留系统迁移到线上商城的完整开发流程
- **数据完整性**：处理缺失值（NULL Fax）、零关联记录（无发票客户）等边界情况
- **防御性编程**：用户可能篡改前端数据，后端对所有输入进行二次校验
- **纯原生 SQL 实践**：在不使用 ORM 的情况下，手动编写高效的多表关联查询