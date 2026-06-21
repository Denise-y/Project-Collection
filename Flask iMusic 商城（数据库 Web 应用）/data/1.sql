.headers on
.mode column
SELECT Customer.CustomerID AS 'Customer ID', 
        Customer.FirstName ||' '||UPPER(Customer.LastName) AS Name, 
        Customer.Email AS Email, 
        Customer.City AS City, 
        COUNT(Invoice.InvoiceID) AS '#Invoices', 
        ROUND(SUM(Invoice.Total),2) AS 'Total Amount', 
        ROUND(AVG(Invoice.Total),2) AS 'Average Amount'
FROM Customer
LEFT JOIN Invoice 
ON Customer.CustomerID = Invoice.CustomerID 
GROUP BY Customer.CustomerID
HAVING Customer.Country ='Canada'
UNION
SELECT 'Total' AS 'Customer ID' , 
        NULL AS Name, 
        NULL AS Email, 
        NULL AS City,
        COUNT(*) AS '#Invoices',
        ROUND(SUM(Invoice.Total),2) AS 'Total Amount',
        ROUND(AVG(Invoice.Total),2) AS 'Average Amount'
FROM Customer
LEFT JOIN Invoice 
ON Customer.CustomerID = Invoice.CustomerID 
WHERE Customer.Country ='Canada'