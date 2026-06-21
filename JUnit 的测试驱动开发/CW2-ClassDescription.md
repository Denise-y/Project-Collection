## App Class

### Variables
- `purchaseRecords`: A static list that holds all the purchase records (`List<PurchaseRecord>`).
- `users`: A static list that contains all the users (`ArrayList<User>`).
- `scanner`: A static `Scanner` instance used for reading user input from the console.

### Main Method
The `main` method is the entry point of the application. It initializes the application, displays the main menu using `displayMainMenu()`, and then enters a loop to continuously prompt the user for input and process their choices, and this function accepts case-insensitive input. The loop continues until the user chooses to exit ('X' or 'x'). It uses a `switch` statement to handle different menu options and calls the corresponding methods. Exception handling is included to catch any runtime errors during the execution of menu options. Finally, it closes the `scanner` when the application exits.

### Main Functionalities (Methods)
- `displayMainMenu()`: Displays the main menu options to the user.
- `displayPurchaseHistory()`: Lists all the purchase records currently in `purchaseRecords` with their details.
- `displayAllUsers()`: Shows all the users currently in the `users` list with their details.
- `findPurchaseByDate()`: Allows the user to search for purchase records by specifying a date, if the date format is incorrect, inform the user.
- `recordNewPurchase()`: Enables the creation of a new purchase record, including associating it with a user, recording items and price, and handling loyalty points. The user can get award loyalty points (1 point for every $10 spent), and use pervious loyalty points for deduction (10 point for every $1 spent). The user can not use the points get in current purchase. 
- `addUser()`: Allows adding a new user to the `users` list with an unique id (user id must not be duplicated). The type of the user should be 'normal', 'silver', or 'gold', if not, inform user to reset.
- `viewUserPurchaseHistory()`: Allows the user to view the purchase history for a specific user by user id.
- `listUsersWithPointsAbove()`: Lists users who have loyalty points above a specified threshold.
- `listUsersWithPurchaseRecords()`: Lists users who have at least one purchase record in the system.
- `deleteUser()`: Allows the user to delete an existing user and their associated purchase records from the system.
- `deletePurchaseRecord()`: Allows the user to delete a specific purchase record and adjusts the associated user's loyalty points accordingly (remove points earned from the deleted record and add back points used in the deleted record).
### 变量
- `purchaseRecords`：一个静态列表，用于存储所有采购记录（`List<PurchaseRecord>`）。
- `users`：一个静态列表，包含所有用户（`ArrayList<User>`）。
- `scanner`：一个静态的 `Scanner` 实例，用于从控制台读取用户输入。

### 主方法
`main` 方法是应用程序的入口点。它会初始化应用程序，使用 `displayMainMenu()` 函数显示主菜单，然后进入一个循环，持续提示用户输入并处理他们的选择，该函数接受不区分大小写的输入。循环会一直持续，直到用户选择退出（输入 'X' 或 'x'）。它使用 `switch` 语句来处理不同的菜单选项，并调用相应的方法。异常处理包含在内，用于捕获在执行菜单选项时的任何运行时错误。最后，在应用程序退出时关闭 `scanner`。

### 主要功能（方法）
- `displayMainMenu()`： 向用户展示主菜单选项。
- `displayPurchaseHistory()`： 列出当前存在于 `purchaseRecords` 中的所有购买记录及其详细信息。
- `displayAllUsers()`： 展示当前存在于 `users` 列表中的所有用户及其详细信息。
- `findPurchaseByDate()`： 允许用户通过指定日期来搜索购买记录，如果日期格式不正确，则告知用户。
- `recordNewPurchase()`： 允许创建新的购买记录，包括将其与用户关联、记录商品和价格，并处理忠诚度积分。用户可以获得奖励忠诚度积分（每消费 10 美元获得 1 点），并且可以使用之前的忠诚度积分进行扣除（每消费 1 美元扣除 10 点）。用户不能使用当前购买中获得的积分。
- `addUser()`： 允许将新用户添加到 `users` 列表中，用户 ID 必须是唯一的（用户 ID 不得重复）。用户的类型应为“普通”、“银色”或“金色”，如果不是，则告知用户重置。
- `viewUserPurchaseHistory()`： 允许用户通过用户 ID 查看特定用户的购买历史记录。- `listUsersWithPointsAbove()`: 列出忠诚度积分高于指定阈值的用户。
- `listUsersWithPurchaseRecords()`： 列出系统中至少有一次购买记录的用户。
- `deleteUser()`： 允许用户从系统中删除现有用户及其相关的购买记录。
- `deletePurchaseRecord()`： 允许用户删除特定的购买记录，并相应地调整关联用户的忠诚度积分（从删除的记录中扣除所获积分，并在删除记录中添加所用积分）。

## PurchaseRecord Class

### Variables
- `userId`: An integer representing the unique identifier of the user who made the purchase.
- `purchaseDate`: A `Date` object indicating the date of the purchase.
- `itemsPurchased`: A `List` of `String` objects containing the names of the items purchased.
- `totalPrice`: A double representing the total price of the purchase.
- `loyaltyPointsEarned`: An integer storing the loyalty points earned from this purchase.
- `pointsUsedForPurchase`: An integer storing the loyalty points used during this purchase.

### Main Method
This class does not have a `main` method. It is a data class used by the `App` class.

### Functionalities (Methods)
1.  **Constructor(s)**
    - `PurchaseRecord()`: Default constructor.
    - `PurchaseRecord(int userId, Date purchaseDate, List<String> itemsPurchased, double totalPrice, int loyaltyPointsEarned)`: Constructor without points used.
    - `PurchaseRecord(int userId, Date purchaseDate, List<String> itemsPurchased, double totalPrice, int loyaltyPointsEarned, int pointsUsedForPurchase)`: Full constructor.
2.  **Getters**
    - `getUserId()`
    - `getPurchaseDate()`
    - `getItemsPurchased()`
    - `gettotalPrice()`
    - `getLoyaltyPointsEarned()`
    - `getPointsUsedForPurchase()`
3.  **Setters**
    - `setUserId(int userId)`
    - `setPurchaseDate(Date purchaseDate)`
    - `setItemsPurchased(List<String> itemsPurchased)`
    - `settotalPrice(double totalPrice)`
    - `setLoyaltyPointsEarned(int loyaltyPointsEarned)`
    - `setPointsUsedForPurchase(int pointsUsedForPurchase)`
4.  `toString()`
    Returns a formatted String representation of the `PurchaseRecord` object, displaying all its attributes.

## User Class

### Variables
- `userName`: A String representing the name of the user.
- `userType`: A String indicating the type of user.
- `userID`: An integer representing the unique identifier of the user.
- `loyaltyPoints`: An integer storing the current loyalty points of the user.

### Main Method
This class does not have a `main` method. It is a data class used by the `App` class.

### Functionalities (Methods)
1.  **Constructor(s)**
    - `User()`: Default constructor.
    - `User(String userName, int userID, String userType)`: Constructor to initialize user details.
2.  **Getters**
    - `getUserName()`
    - `getUserType()`
    - `getUserID()`
    - `getLoyaltyPoints()`
3.  **Setters**
    - `setUserName(String userName)`
    - `setUserType(String userType)`
    - `setUserID(int userID)`
    - `setLoyaltyPoints(int loyaltyPoints)`
4.  `addLoyaltyPoints(int points)`
    Increases the user's loyalty points, the input point can only be positive value.
5.  `removeLoyaltyPoints(int points)`
    Decreases the user's loyalty points, with a check for sufficient points and the input point can only be positive value.
6.  `checkPointsAmount()`
    Returns the current loyalty points.
7.  `isNameValid()`
    Checks if the userName is not be used.
8.  `isTypeValid()`
    Checks if the userType is either not set or is set to 'normal', 'silver', or 'gold'. Rejects other values.
9.  `isIDValid()`
    Checks whether the userID is in not duplicated and in the range of [0,10000000].
10. `toString()`
    Returns a formatted String representation of the `User` object.