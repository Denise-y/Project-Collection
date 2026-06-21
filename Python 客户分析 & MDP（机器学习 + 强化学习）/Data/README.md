# Database Table Schemas

## Table: customer_survey

| Column Name | Data Type |
|------------|-----------|
| Customer_ID | int(11) NOT NULL |
| Cust_Sex | text |
| Cust_Income | int(11) DEFAULT NULL |
| Cust_Race | text |
| Cust_Age | text |
| Cust_Children | text |
| Cust_Rel_Status | text |

## Table: customers

| Column Name | Data Type |
|------------|-----------|
| Customer_ID | int(11) NOT NULL |
| First_Name | text |
| Last_Name | text |
| Customer_Address | text |
| Customer_City | text |
| Customer_State | text |
| Customer_Zip | int(11) DEFAULT NULL |
| Customer_Phone_Number | text |


## Table: items

| Column Name | Data Type |
|------------|-----------|
| Item_ID | int(11) NOT NULL |
| Item_Name | text |
| Price_Per_Item | double DEFAULT NULL |
| Bell | Pepper' |
| Green | Beans' |
| Sweet | Potato' |
| American | Cheese' |
| Ice | Cream' |
| Cream | Cheese' |
| White | Bread' |
| Wheat | Bread' |
| Ranch | Dressing' |
| Italian | Dressing' |
| French | Dressing' |
| Thousand | Island Dressing' |
| Blue | Cheese Dressing' |
| Russian | Dressing' |
| Greek | Dressing' |
| Bacon | Bits' |
| Potatoe | Chips' |
| Beef | Jerky' |
| Iced | Tea' |
| Tea | Bags' |
| Tortilla | Chips' |
| Tomato | Soup' |
| Chicken | Noodle Soup' |
| Clam | Chowder' |
| Trail | Mix' |
| Black | Beans' |
| Pinto | Beans' |
| Kidney | Beans' |
| Taco | Seasoning' |
| Meatloaf | Mix' |
| Roast | Beef' |
| Swiss | Cheese' |
| Pancake | Mix' |
| Waffle | Mix' |
| Maple | Syrup' |
| Orange | Juice' |
| Apple | Juice' |
| Peanut | Butter' |
| Dog | Food' |
| Cat | Food' |
| Brown | Rice' |
| White | Rice' |
| Olive | Oil' |
| Sour | Cream' |
| Soy | Sauce' |
| Granola | Bars' |
| Baby | Food' |
| Whipped | Cream' |
| Hot | Dogs' |
| Bread | Crumbs' |
| Lima | Beans' |
| Red | Beans' |
| Chia | Seeds' |
| Canola | Oil' |
| Tomato | Sauce' |
| Alfredo | Sauce' |
| Baking | Powder' |
| Brownie | Mix' |
| Baking | Soda' |
| Vanilla | Extract' |
| Sunflower | Seeds' |
| Candy | Bar' |
| Coffee | Cake' |
| English | Muffins' |
| Chocolate | Syrup' |
| Ice | Cream Cones' |
| Pie | Crust' |
| Condensed | Milk' |

## Table: sales

| Column Name | Data Type |
|------------|-----------|
| Sale_ID | int(11) NOT NULL |
| Customer_ID | int(11) NOT NULL |
| Store_ID | int(11) NOT NULL |
| Sale_Week | int(11) NOT NULL |

## Table: stores

| Column Name | Data Type |
|------------|-----------|
| Store_ID | int(11) NOT NULL |
| Store_Name | text |
| Store_Size | text |
| Store_Address | text |
| Store_City | text |
| Store_State | text |
| Store_Zip | text |
| Store_Phone_Number | text |
| s | Corner' |
| 467 | Thunderbirds Way' |
| s | Store' |
| 813 | Suns Drive' |
| s | Extravaganza' |
| 5554 | Rawhide Road' |
| s | Alley' |
| 212 | Bravehearts Street' |
| s | Deli' |
| 77 | Senators Drive' |
| s | Market' |
| 93 | Spinners Road' |
| s | Emporium' |
| 611 | Pelican Street' |
| s | Mart' |
| 712 | Witches Way' |
| s | Bazaar' |
| 89 | Nava Road' |
| s | Shop' |
| 10001 | Main Street' |
| s | Barter' |
| 887 | Navigators Street' |
| s | Exchange' |
| 655 | Pesky Drive' |

## Table: transactions

| Column Name | Data Type |
|------------|-----------|
| Sale_ID | int(11) NOT NULL |
| Item_ID | int(11) NOT NULL |
| Amount_Purchased | int(11) DEFAULT NULL |
| Item_Discount | decimal(4 |
| DEFAULT | NULL |



