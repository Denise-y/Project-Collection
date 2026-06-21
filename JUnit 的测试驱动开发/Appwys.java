public static void displayAllUsers() {
    if (users == null) {
        System.out.println("User list is not initialized.");
        return;
    }
    if (users.isEmpty()) {
        System.out.println("No users available");
        return;
    }
    for (int j = 0; j < users.size(); j++) {
        User user = users.get(j);
        System.out.println("\n[User " + (j + 1) + "]");
        System.out.println(user.toString());
    }
}

public static void findPurchaseByDate() {
    System.out.print("Enter Purchase Date (dd/MM/yyyy): ");
    String dateStr = scanner.next();
    int recordNum = 0;

    SimpleDateFormat fmt = new SimpleDateFormat("dd/MM/yyyy");
    try {
        Date parsedDate = fmt.parse(dateStr);
        for (PurchaseRecord record : purchaseRecords) {
            Date purchasedDate = record.getPurchaseDate();
            if (fmt.format(parsedDate).equals(fmt.format(purchasedDate))) {
                System.out.println(record.toString());
                recordNum = 1;
            }
        }
    } catch (ParseException e) {
        System.out.println("Invalid date format");
        return;
    }

    if (recordNum == 0) {
        System.out.println("No purchases found on " + dateStr);
    } else {
        System.out.println(recordNum + " purchases found on " + dateStr);
    }
}


 public static void recordNewPurchase() 
        double paid_price = 0;
        if (usePointsChoice.equals("y")) {
            System.out.print("Enter the number of points to use: ");
            int pointsToUse = scanner.nextInt();
            if (pointsToUse > 0 && pointsToUse <= customer.getLoyaltyPoints()) {
                customer.removeLoyaltyPoints(pointsToUse);
                pointsUsedForPurchase = pointsToUse;
                System.out.println("Successfully used " + pointsToUse + " loyalty points.");
            } else if (pointsToUse > customer.getLoyaltyPoints()) {
                System.out.println("Insufficient loyalty points.");
            } else {
                System.out.println("Invalid point usage amount.");
            }

            // Use pervious loyalty points for deduction (10 point for every $1 spent)
            paid_price = price - pointsToUse/10;
            scanner.nextLine(); // Consume newline
        } else {
            scanner.nextLine(); // Consume newline
        }