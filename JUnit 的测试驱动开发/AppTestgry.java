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
    void displayPurchaseHistory() {
        // Test: Display multiple records
        App.displayPurchaseHistory();
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("Purchase Record"));
        assertTrue(output.contains("Cappuccino"));
        assertTrue(output.contains("iced American"));
        assertTrue(output.contains("Latte"));
        assertTrue(output.contains("Espresso"));
        
        // Test: No records available
        outputStreamCaptor.reset();
        provideInput("1\n");
        App.deletePurchaseRecord();
        provideInput("1\n");
        App.deletePurchaseRecord();
        provideInput("1\n");
        App.deletePurchaseRecord();
        
        outputStreamCaptor.reset();
        App.displayPurchaseHistory();
        output = outputStreamCaptor.toString();
        assertTrue(output.contains("No records available"));
    }

    @Test
    void findPurchaseByDate() {
        // Test: Find purchase on valid date
        provideInput("01/01/2025\n");
        App.findPurchaseByDate();
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("01/01/2025"));
        assertTrue(output.contains("Cappuccino"));
        
        // Test: No purchase found
        outputStreamCaptor.reset();
        provideInput("31/12/2020\n");
        App.findPurchaseByDate();
        output = outputStreamCaptor.toString();
        assertTrue(output.contains("No purchases found on 31/12/2020"));
    }

    @Test
    void recordNewPurchase() {
        // Test: Valid purchase
        String input = "1\n01/01/2025\nCappuccino,iced American\n40.0\nn\n";
        provideInput(input);
        App.recordNewPurchase();
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("Purchase recorded successfully"));
        assertTrue(output.contains("4 loyalty points"));  // 40.0/10 = 4 points
        
        // Test: Invalid price (negative)
        outputStreamCaptor.reset();
        input = "1\n01/01/2025\nCappuccino\n-40.0\n";
        provideInput(input);
        App.recordNewPurchase();
        output = outputStreamCaptor.toString();
        assertTrue(output.contains("Price cannot be negative") || output.contains("Invalid"));
        
        // Test: Using loyalty points
        outputStreamCaptor.reset();
        input = "1\n01/01/2025\nCappuccino,iced American\n40.0\ny\n2\n";
        provideInput(input);
        App.recordNewPurchase();
        output = outputStreamCaptor.toString();
        assertTrue(output.contains("Successfully used 2 loyalty points"));
        
        // Test: No loyalty points used
        outputStreamCaptor.reset();
        input = "1\n01/01/2025\nCappuccino\n20.0\nn\n";
        provideInput(input);
        App.recordNewPurchase();
        output = outputStreamCaptor.toString();
        assertFalse(output.contains("loyalty points used"));
        assertTrue(output.contains("20.0"));
        
        // Test: Invalid loyalty points
        outputStreamCaptor.reset();
        input = "1\n01/01/2025\nCappuccino,iced American\n40.0\ny\n5\n";
        provideInput(input);
        App.recordNewPurchase();
        output = outputStreamCaptor.toString();
        assertTrue(output.contains("Insufficient loyalty points"));
    }

    @Test
    void viewUserPurchaseHistory() {
        // Test: Valid user with purchase history
        provideInput("1\n");  // Anna
        App.viewUserPurchaseHistory();
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("iced American"));
        assertTrue(output.contains("Cappuccino"));
        
        // Test: Invalid index
        outputStreamCaptor.reset();
        provideInput("0\n");  // Invalid index
        App.viewUserPurchaseHistory();
        output = outputStreamCaptor.toString();
        assertTrue(output.contains("Invalid user index"));
        
        // Test: User with no purchases
        outputStreamCaptor.reset();
        provideInput("2\n");  // John
        App.viewUserPurchaseHistory();
        output = outputStreamCaptor.toString();
        assertTrue(output.contains("No purchase history found"));
    }

    @Test
    void listUsersWithPointsAbove() {
        // Test: Users with points > 50 (User1 = 60 points, User2 = 30 points, Threshold = 50)
        // Clear previous purchase records and points
        provideInput("1\n");
        App.deletePurchaseRecord();
        provideInput("1\n");
        App.deletePurchaseRecord();
        provideInput("1\n");
        App.deletePurchaseRecord();

        provideInput("1\n01/01/2025\nItem\n600.0\nn\n");  // Add 60 points to Anna
        App.recordNewPurchase();
        provideInput("2\n01/01/2025\nItem\n300.0\nn\n");  // Add 30 points to John
        App.recordNewPurchase();
        
        outputStreamCaptor.reset();
        provideInput("50\n");
        App.listUsersWithPointsAbove();
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("Anna"));
        assertFalse(output.contains("John"));
        
        // Clear previous purchase records and points
        provideInput("1\n");
        App.deletePurchaseRecord();
        provideInput("1\n");
        App.deletePurchaseRecord();
        
        // Test: No users with points above threshold (User1 = 30 points, User2 = 20 points, Threshold = 50)
        provideInput("1\n01/01/2025\nItem\n300.0\nn\n");  // Add 30 points to Anna
        App.recordNewPurchase();
        provideInput("2\n01/01/2025\nItem\n200.0\nn\n");  // Add 20 points to John
        App.recordNewPurchase();
        
        outputStreamCaptor.reset();
        provideInput("50\n");
        App.listUsersWithPointsAbove();
        output = outputStreamCaptor.toString();
        assertTrue(output.contains("No users found with loyalty points greater than 50"));
        
        // Test: Invalid threshold
        outputStreamCaptor.reset();
        provideInput("-5\n");
        App.listUsersWithPointsAbove();
        output = outputStreamCaptor.toString();
        assertTrue(output.contains("Threshold cannot be negative"));
    }

    @Test
    void listUsersWithPurchaseRecords() {
        // Test: Users with purchase records
        App.listUsersWithPurchaseRecords();
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("Anna"));
        assertFalse(output.contains("John"));
        
        // Test: No users with records
        outputStreamCaptor.reset();
        provideInput("1\n");
        App.deletePurchaseRecord();
        provideInput("1\n");
        App.deletePurchaseRecord();
        provideInput("1\n");
        App.deletePurchaseRecord();
        
        outputStreamCaptor.reset();
        App.listUsersWithPurchaseRecords();
        output = outputStreamCaptor.toString();
        assertTrue(output.contains("No users have purchase records"));
    }

    @Test
    void deletePurchaseRecord() {
        // Test: Valid record to delete
        provideInput("1\n");
        App.deletePurchaseRecord();
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("successfully") || !output.contains("not found"));
        
        // Test: Invalid record index
        outputStreamCaptor.reset();
        provideInput("999\n");
        App.deletePurchaseRecord();
        output = outputStreamCaptor.toString();
        assertTrue(output.contains("Purchase record not found") || output.contains("Invalid"));
        
        // Test: Invalid purchase price
        outputStreamCaptor.reset();
        provideInput("1\n01/01/2025\nCappuccino\n-5.0\n");
        App.recordNewPurchase();
        output = outputStreamCaptor.toString();
        assertTrue(output.contains("Price cannot be negative") || output.contains("Invalid"));
    }

    @Test
    void displayAllUsers() {
        // First clear all users by deleting them
        provideInput("1\n");  // Delete first user
        App.deleteUser();
        provideInput("1\n");  // Delete second user
        App.deleteUser();
        
        // Test: Empty user list
        outputStreamCaptor.reset();
        App.displayAllUsers();
        String output = outputStreamCaptor.toString().trim();
        assertEquals("No users available", output);
        
        // Add test users
        provideInput("Anna\nRegular\n");
        App.addUser();
        provideInput("John\nRegular\n");
        App.addUser();
        provideInput("User3\nRegular\n");
        App.addUser();
        
        // Test: Display users
        outputStreamCaptor.reset();
        App.displayAllUsers();
        output = outputStreamCaptor.toString();
        assertTrue(output.contains("Anna"));
        assertTrue(output.contains("John"));
        assertTrue(output.contains("User3"));
    }
}