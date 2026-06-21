//coder: Ruiying Gao, Shuo Zhang
package src;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import java.util.Date;
import java.util.List;
import java.text.SimpleDateFormat;
import java.text.ParseException;
import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.io.ByteArrayInputStream;
import java.util.Scanner;
import java.lang.reflect.Field;

class AppTest {
    private final ByteArrayOutputStream outputStreamCaptor = new ByteArrayOutputStream();
    private final SimpleDateFormat dateFormat = new SimpleDateFormat("dd/MM/yyyy");
    private static PrintStream originalOut;
    private static ByteArrayInputStream testIn;
    private static Field scannerField;

    @BeforeEach
    void setUp() throws ParseException {
        try {
            // Get scanner field from App class
            scannerField = App.class.getDeclaredField("scanner");
            scannerField.setAccessible(true);
            
            // Save original System.out
            originalOut = System.out;
            
            // Set output capture
            System.setOut(new PrintStream(outputStreamCaptor));
            
            // Clear all users and purchase records
            Field usersField = App.class.getDeclaredField("users");
            Field purchaseRecordsField = App.class.getDeclaredField("purchaseRecords");
            usersField.setAccessible(true);
            purchaseRecordsField.setAccessible(true);
            ((List<?>)usersField.get(null)).clear();
            ((List<?>)purchaseRecordsField.get(null)).clear();
            
            // Initialize test data
            setupTestData();
            
            outputStreamCaptor.reset();
        } catch (NoSuchFieldException | IllegalAccessException e) {
            fail("Could not access fields: " + e.getMessage());
        }
    }

    private void setupTestData() {
        // Add test users
        provideInput("Anna\nRegular\n");
        App.addUser();
        provideInput("John\nRegular\n");
        App.addUser();
        
        // Add 3 purchase records for Anna
        String purchaseInput = "1\n01/01/2025\nCappuccino,iced American\n40.0\nn\n";
        provideInput(purchaseInput);
        App.recordNewPurchase();
        
        purchaseInput = "1\n01/01/2025\nLatte\n20.0\nn\n";
        provideInput(purchaseInput);
        App.recordNewPurchase();
        
        purchaseInput = "1\n01/01/2025\nEspresso\n30.0\nn\n";
        provideInput(purchaseInput);
        App.recordNewPurchase();
    }

    private void provideInput(String data) {
        try {
            testIn = new ByteArrayInputStream(data.getBytes());
            System.setIn(testIn);
            scannerField.set(null, new Scanner(System.in));
        } catch (IllegalAccessException e) {
            fail("Could not set scanner field: " + e.getMessage());
        }
    }

    @Test
    void displayPurchaseHistory_mutiple() {
        // Test: Display multiple records
        App.displayPurchaseHistory();
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("Purchase Record"));
        assertTrue(output.contains("Cappuccino"));
        assertTrue(output.contains("iced American"));
        assertTrue(output.contains("Latte"));
        assertTrue(output.contains("Espresso"));
    }
        
    @Test
    void displayPurchaseHistory_noRecords() {
        // Test: No records available
        try {
            Field purchaseRecordsField = App.class.getDeclaredField("purchaseRecords");
            purchaseRecordsField.setAccessible(true);
            ((List<?>) purchaseRecordsField.get(null)).clear();

            outputStreamCaptor.reset();
            App.displayPurchaseHistory();
            String output = outputStreamCaptor.toString();

            assertTrue(output.contains("No records available"));
            
        } catch (NoSuchFieldException | IllegalAccessException e) {
            fail("Could not access fields: " + e.getMessage());
        }
    }

    @Test
    void findPurchaseByDate_validDate() {
        // Test: Find purchase on valid date
        provideInput("01/01/2025\n");
        App.findPurchaseByDate();
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("01/01/2025"));
        assertTrue(output.contains("Cappuccino"));
    }
        
    @Test
    void findPurchaseByDate_noPurchase() {
        // Test: No purchase found
        outputStreamCaptor.reset();
        provideInput("31/12/2020\n");
        App.findPurchaseByDate();
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("No purchases found on 31/12/2020"));
    }

    @Test
    void findPurchaseByDate_InvalidDateFormat() {
        // Test: Invalid date format
        provideInput("abc\n");
        App.findPurchaseByDate();
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("No purchases found on abc"));
    }

    @Test
    void findPurchaseByDate_WithIncorrectFormat() {
        // Test: Invalid date format
        provideInput("01-01-2025\n");
        App.findPurchaseByDate();
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("Invalid date format"));
    }

    @Test
    void recordNewPurchase_validPurchase() {
        // Test: Valid purchase
        String input = "1\n01/01/2025\nCappuccino,iced American\n40.0\nn\n";
        provideInput(input);
        App.recordNewPurchase();
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("Purchase recorded successfully"));
        assertTrue(output.contains("4 loyalty points"));  // 40.0/10 = 4 points
    }

    @Test
    void recordNewPurchase_invalidPrice() {
        // Test: Invalid price (negative)
        outputStreamCaptor.reset();
        String input = "1\n01/01/2025\nCappuccino\n-40.0\n";
        provideInput(input);
        App.recordNewPurchase();
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("Price cannot be negative") || output.contains("Invalid"));
    }
        
    @Test
    void recordNewPurchase_useLoyaltyPoints() {
        // Test: Using loyalty points
        outputStreamCaptor.reset();
        String input = "1\n01/01/2025\nCappuccino,iced American\n40.0\ny\n2\n";
        provideInput(input);
        App.recordNewPurchase();
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("Successfully used 2 loyalty points") && output.contains("Price to pay ($):39.8") );
    }
        
    @Test
    void recordNewPurchase_noLoyaltyPoints() {
        // Test: No loyalty points used
        outputStreamCaptor.reset();
        String input = "1\n01/01/2025\nCappuccino\n20.0\nn\n";
        provideInput(input);
        App.recordNewPurchase();
        String output = outputStreamCaptor.toString();
        assertFalse(output.contains("loyalty points used"));
        assertTrue(output.contains("Price to pay ($): 20.0"));
    }    
    
    @Test
    void recordNewPurchase_invalidLoyaltyPoints() {
        // Test: Invalid loyalty points
        outputStreamCaptor.reset();
        String input = "1\n01/01/2025\nCappuccino,iced American\n40.0\ny\n5\n";
        provideInput(input);
        App.recordNewPurchase();
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("Insufficient loyalty points"));
    }

    @Test
    void recordNewPurchase_invalidUserIndex() {
        // Test: Invalid user index
        outputStreamCaptor.reset();
        String input = "a\n01/01/2025\nCappuccino,iced American\n40.0\nn\n";
        provideInput(input);
        App.recordNewPurchase();
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("Invalid choice. Please try again."));
        assertFalse(output.contains("Something went wrong: java.util.InputMismatchException"));
    }

    @Test
    void recordNewPurchase_PointsCalculation() {
        // Test: Points calculation precision (including decimal point amounts)
        String input = "1\n01/01/2025\nItem\n45.5\nn\n";
        provideInput(input);
        App.recordNewPurchase();
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("4 loyalty points"));
    }

    @Test
    void recordNewPurchase_invalidYNInput() {
        // Test: Invalid input other than 'y' or 'n' for loyalty points usage
        outputStreamCaptor.reset();

        // Simulate invalid input 'x'
        String input = "1\n01/01/2025\nCappuccino,iced American\n40.0\nx\nn\n";  // Invalid input 'x' instead of 'y' or 'n'
        provideInput(input);
        App.recordNewPurchase();

        // Check if the message "Invalid input. Please enter 'y' or 'n'." is displayed
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("Invalid input. Please enter 'y' or 'n'."));
    }

    @Test
    void viewUserPurchaseHistory_validUser() {
        // Test: Valid user with purchase history
        provideInput("1\n");  // Anna
        App.viewUserPurchaseHistory();
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("iced American"));
        assertTrue(output.contains("Cappuccino"));
    }
        
    @Test
    void viewUserPurchaseHistory_invalidIndex() {
        // Test: Invalid index
        outputStreamCaptor.reset();
        provideInput("0\n");  // Invalid index
        App.viewUserPurchaseHistory();
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("Invalid choice. Please try again."));
        assertFalse(output.contains("Something went wrong: java.util.InputMismatchException"));
    }
    
    @Test
    void viewUserPurchaseHistory_noPurchases() {
        // Test: User with no purchases
        outputStreamCaptor.reset();
        provideInput("2\n");  // John
        App.viewUserPurchaseHistory();
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("No purchase history found"));
        assertFalse(output.contains("java.lang.IndexOutOfBoundsException"));
    }

    @Test
    void viewUserPurchaseHistory_nonNumericIndex() {
        // Test: Invalid user index (non-numeric)
        outputStreamCaptor.reset();
        provideInput("a\n");
        App.viewUserPurchaseHistory();
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("Invalid choice. Please try again."));
        assertFalse(output.contains("Something went wrong: java.util.InputMismatchException"));
    }

    @Test
    void listUsersWithPointsAbove_validThreshold() {
        // Test: Users with points > 50 (User1 = 60 points, User2 = 30 points, Threshold = 50)
        try {
            Field purchaseRecordsField = App.class.getDeclaredField("purchaseRecords");
            purchaseRecordsField.setAccessible(true);
            ((List<?>) purchaseRecordsField.get(null)).clear();

            Field usersField = App.class.getDeclaredField("users");
            usersField.setAccessible(true);
            List<User> users = (List<User>) usersField.get(null);

            for (User user : users) {
                user.removeLoyaltyPoints(user.getLoyaltyPoints()); 
            }

            provideInput("1\n01/01/2025\nItem\n600.0\nn\n");
            App.recordNewPurchase();
            provideInput("2\n01/01/2025\nItem\n300.0\nn\n");
            App.recordNewPurchase();
            
            outputStreamCaptor.reset();
            provideInput("50\n");
            App.listUsersWithPointsAbove();
            
            String output = outputStreamCaptor.toString();
            
            assertTrue(output.contains("Anna"));
            assertFalse(output.contains("John"));
            
            ((List<?>) purchaseRecordsField.get(null)).clear();  
            for (User user : users) {
                user.removeLoyaltyPoints(user.getLoyaltyPoints());  
            }

        } catch (NoSuchFieldException | IllegalAccessException e) {
            fail("Could not access fields: " + e.getMessage());
        }
    }
    
    @Test
    void listUsersWithPointsAbove_noUsersAboveThreshold() {
        // Test: No users with points above threshold (User1 = 30 points, User2 = 20 points, Threshold = 50)
        provideInput("1\n01/01/2025\nItem\n300.0\nn\n");  // Add 30 points to Anna
        App.recordNewPurchase();
        provideInput("2\n01/01/2025\nItem\n200.0\nn\n");  // Add 20 points to John
        App.recordNewPurchase();
        
        outputStreamCaptor.reset();
        provideInput("50\n");
        App.listUsersWithPointsAbove();
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("No users found with loyalty points greater than 50"));
    }
        
    @Test
    void listUsersWithPointsAbove_invalidThreshold() {
        // Test: Invalid threshold
        outputStreamCaptor.reset();
        provideInput("-5\n");
        App.listUsersWithPointsAbove();
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("Threshold cannot be negative"));
    }

    @Test
    void listUsersWithPurchaseRecords_validUser() {
        // Test: Users with purchase records
        App.listUsersWithPurchaseRecords();
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("Anna"));
        assertFalse(output.contains("John"));
    }
        
    @Test
    void listUsersWithPurchaseRecords_noUsers() {
        // Test: No users with records
        try {
            Field purchaseRecordsField = App.class.getDeclaredField("purchaseRecords");
            purchaseRecordsField.setAccessible(true);
            ((List<?>)purchaseRecordsField.get(null)).clear();
            
            outputStreamCaptor.reset();
            App.listUsersWithPurchaseRecords();
            String output = outputStreamCaptor.toString();
            assertTrue(output.contains("No users"));
        } catch (NoSuchFieldException | IllegalAccessException e) {
            fail("Could not access fields: " + e.getMessage());
        }
    }

    @Test
    void deletePurchaseRecord_validRecord() {
        // Test: Valid record to delete
        provideInput("1\n");
        App.deletePurchaseRecord();
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("successfully") || !output.contains("not found"));
    }
     
    @Test
    void deletePurchaseRecord_invalidRecord() {
        // Test: Invalid record index
        outputStreamCaptor.reset();
        provideInput("999\n");
        App.deletePurchaseRecord();
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("Purchase record not found") || output.contains("Invalid"));
    }
}