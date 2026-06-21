package src;

import java.text.ParseException;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Scanner;
import java.text.SimpleDateFormat;
import java.util.Set;

import src.PurchaseRecord;
import src.User;

public class App {
    private static List<PurchaseRecord> purchaseRecords = new ArrayList<>();
    private static ArrayList<User> users = new ArrayList<>();
    private static Scanner scanner = new Scanner(System.in); // Single Scanner instance

    public static void main(String[] args) {

        Date curDate = new Date();

        displayMainMenu();
        while (scanner.hasNextLine()) {
            String choice = scanner.next(); 
            try {
                switch (choice) {
                    case "H":
                        displayPurchaseHistory();
                        break;
                    case "U":
                        displayAllUsers();
                        break;
                    case "F":
                        findPurchaseByDate();
                        break;
                    case "R":
                        recordNewPurchase();
                        break;
                    case "V":
                        viewUserPurchaseHistory();
                        break;
                    case "A":
                        addUser();
                        break;
                    case "P":
                        listUsersWithPointsAbove();
                        break;
                    case "W":
                        listUsersWithPurchaseRecords();
                        break;
                    case "D":
                        deleteUser();
                        break;
                    case "DP": 
                        deletePurchaseRecord();
                        break;
                    case "X":
                        System.out.println("\nGoodbye!");
                        return; // Use return to exit the method
                    default:
                        System.out.println("Invalid choice. Please try again.");
                }
            } catch (Exception e) {
                System.out.println("Something went wrong: " + e.toString() + "\n");
            }
            displayMainMenu();
        }
        scanner.close(); // Close the scanner at the end of the program
    }

    public static void displayMainMenu() {
        System.out.println("\n What do you want to do?");
        System.out.println("[H]: Display purchase history");
        System.out.println("[U]: Display all users");
        System.out.println("[F]: Find purchase by date.");
        System.out.println("[R]: Record new purchase.");
        System.out.println("[V]: View user's purchase history.");
        System.out.println("[A]: Add user.");
        System.out.println("[D]: Delete user.");
        System.out.println("[P]: List users with points above a threshold.");
        System.out.println("[W]: List users with purchase records.");
        System.out.println("[X]: Exit.");
        System.out.print("Enter choice: ");
    }

    public static void displayPurchaseHistory() {
        if (purchaseRecords.isEmpty()) {
            System.out.println("No records available");
            return;
        }
        for (int j = 0; j < purchaseRecords.size(); j++) {
            PurchaseRecord record = purchaseRecords.get(j);
            System.out.println("\nPurchase Record " + (j + 1));
            System.out.println("---------------");
            System.out.println(record.toString());
        }
    }

    public static void displayAllUsers() {
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
        for (PurchaseRecord record : purchaseRecords) {
            Date purchaseDate = record.getPurchaseDate();
            if (dateStr.equals(fmt.format(purchaseDate))) {
                System.out.println(record.toString());
                recordNum = 1;
            }
        }
  
        if (recordNum == 0) {
            System.out.println("No purchases found on " + dateStr);
        }
        else{
            System.out.println(recordNum + " purchases found on " + dateStr);
        }

    }

    public static void recordNewPurchase() {
        System.out.println("\n Who is making the purchase?");
        displayAllUsers();
        System.out.print("\nEnter user index: ");
        int userIndex = scanner.nextInt() - 1;
        if (userIndex < 0) {
            System.out.println("Invalid user index.");
            scanner.nextLine(); // Consume newline
            return;
        }
        User customer = users.get(userIndex);
        scanner.nextLine(); // Consume newline

        System.out.print("Enter purchase date (dd/MM/yyyy): ");
        String dateStr = scanner.nextLine();
        Date purchaseDate = new Date();
        try {
            purchaseDate = new SimpleDateFormat("dd/MM/yyyy").parse(dateStr);
        } catch (ParseException e) {
            throw new RuntimeException(e);
        }

        System.out.print("Enter items purchased (comma-separated): ");
        String items = scanner.nextLine();
        List<String> itemList = List.of(items.split(","));

        System.out.print("Enter total price ($): ");
        double price = scanner.nextDouble();
        scanner.nextLine(); // Consume newline
        
        if (price < 0) {
            System.out.println("Price cannot be negative");
            return;
        }

        // Award loyalty points (1 point for every $10 spent)
        int pointsEarned = (int) (price / 10);
        customer.addLoyaltyPoints(pointsEarned);

        int pointsUsedForPurchase = 0;
        System.out.println("Current loyalty points: " + customer.getLoyaltyPoints());
        System.out.print("Do you want to use any loyalty points for this purchase? (y/n): ");
        String usePointsChoice = scanner.next().toLowerCase();
        scanner.nextLine(); // Consume newline

        double paid_price = price;
        if (usePointsChoice.equals("y")) {
            System.out.print("Enter the number of points to use: ");
            int pointsToUse = scanner.nextInt();
            scanner.nextLine(); // Consume newline
            if (pointsToUse > 0 && pointsToUse <= customer.getLoyaltyPoints()) {
                customer.removeLoyaltyPoints(pointsToUse);
                pointsUsedForPurchase = pointsToUse;
                System.out.println("Successfully used " + pointsToUse + " loyalty points.");
                // Use previous loyalty points for deduction (10 point for every $1 spent)
                paid_price = price - pointsToUse/10;
            } else if (pointsToUse > customer.getLoyaltyPoints()) {
                System.out.println("Insufficient loyalty points.");
            } else {
                System.out.println("Invalid point usage amount.");
            }
        }
        
        System.out.println("Price to pay ($): " + paid_price);

        PurchaseRecord record = new PurchaseRecord(customer.getUserID(), purchaseDate, itemList, price, pointsEarned, pointsUsedForPurchase);
        purchaseRecords.add(record);
        System.out.println("Purchase recorded successfully for user " + customer.getUserName() + ". Earned " + pointsEarned + " loyalty points.");
    }

    public static void addUser() {
        System.out.print("\nEnter user name: ");
        String name = scanner.next();
        System.out.print("\nEnter user type: ");
        String type = scanner.next();
        System.out.println("----------");
        User user = new User(name, users.size()+1, type);
        users.add(user);
        System.out.println("User created successfully: " + name + " id " + (users.size()+1) + " type " + type + ".");
        System.out.println("User created successfully.");
    }

    public static void viewUserPurchaseHistory() {
        System.out.println("\n Whose purchase history do you want to view?");
        displayAllUsers();
        System.out.print("\nEnter user index: ");
        int userIndex = scanner.nextInt() - 1; // Convert to 0-based index
        scanner.nextLine(); // Consume newline
        
        if (userIndex < 0 || userIndex >= users.size()) {
            System.out.println("Invalid user index");
            return;
        }
        
        User user = users.get(userIndex);
        System.out.println("\nPurchase history for user: " + user.getUserName());
        boolean found = false;
        for (PurchaseRecord record : purchaseRecords) {
            if (record.getUserId() == user.getUserID()) {
                System.out.println("---------------");
                System.out.println(record.toString());
                found = true;
            }
        }
        if (!found) {
            System.out.println("No purchase history found for this user.");
        }
    }


    public static void listUsersWithPointsAbove() {
        System.out.print("\nEnter the minimum loyalty point amount: ");
        int minPoints = scanner.nextInt();
        scanner.nextLine(); // Consume newline

        if (minPoints < 0) {
            System.out.println("Threshold cannot be negative");
            return;
        }

        System.out.println("\nUsers with loyalty points greater than " + minPoints + ":");
        boolean found = false;
        for (User user : users) {
            if (user.getLoyaltyPoints() >= minPoints) {
                System.out.println("Name: " + user.getUserName() + ", Points: " + user.getLoyaltyPoints());
                found = true;
            }
        }
        if (!found) {
            System.out.println("No users found with loyalty points greater than " + minPoints);
        }
    }

    public static void listUsersWithPurchaseRecords() {
        Set<Integer> userIdsWithPurchases = new HashSet<>();
        for (PurchaseRecord record : purchaseRecords) {
            userIdsWithPurchases.add(record.getUserId());
        }

        System.out.println("\nUsers with purchase records:");
        if (userIdsWithPurchases.isEmpty()) {
            System.out.println("No users have purchase records");
            return;
        }

        boolean found = false;
        for (User user : users) {
            if (userIdsWithPurchases.contains(user.getUserID())) {
                System.out.println("Name: " + user.getUserName() + ", ID: " + user.getUserID());
                found = true;
            }
        }
        
        if (!found) {
            System.out.println("No users have purchase records");
        }
    }

    public static void deleteUser() {
        System.out.println("\nWhich user do you want to delete?");
        displayAllUsers();
        System.out.print("\nEnter the index of the user to delete: ");
        if (scanner.hasNextInt()) {
            int indexToDelete = scanner.nextInt() - 1;
            scanner.nextLine(); // Consume newline
            User userToDelete = users.get(indexToDelete);
            int userIdToDelete = userToDelete.getUserID();
            users.remove(indexToDelete);
            System.out.println("User " + userToDelete.getUserName() + " (ID: " + userIdToDelete + ") has been deleted.");
        } 
    }

    public static void deletePurchaseRecord() {
        System.out.println("\nWhich purchase record do you want to delete?");
        displayPurchaseHistory();
        System.out.print("\nEnter the index of the purchase record to delete: ");
        if (scanner.hasNextInt()) {
            int indexToDelete = scanner.nextInt() - 1;
            scanner.nextLine(); // Consume newline
            if (indexToDelete >= 0 && indexToDelete < purchaseRecords.size()) {
                PurchaseRecord recordToDelete = purchaseRecords.get(indexToDelete);
                int userId = recordToDelete.getUserId();
                int pointsEarned = recordToDelete.getLoyaltyPointsEarned();

                // Find the user and adjust loyalty points
                for (User user : users) {
                    if (user.getUserID() == userId) {
                        user.removeLoyaltyPoints(pointsEarned); // Remove points earned from the deleted record
                        break;
                    }
                }

                purchaseRecords.remove(indexToDelete);
                System.out.println("Purchase record for User ID " + userId + " on " + recordToDelete.getPurchaseDate() + " has been deleted. Loyalty points adjusted.");
            } else {
                System.out.println("Invalid purchase record index.");
            }
        } else {
            System.out.println("Invalid input. Please enter a number.");
            scanner.next(); // Consume invalid input
            scanner.nextLine(); // Consume newline
        }
    }
}