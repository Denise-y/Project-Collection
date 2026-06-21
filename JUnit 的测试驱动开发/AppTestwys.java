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
    // ... 省略其他代码 ...

    @Test
    void test_RecordNewPurchase_WithEmptyInput() {
        // Test: Empty user input
        provideInput("\n");
        App.recordNewPurchase();
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("Invalid user index"));

        // Test: Empty date input
        outputStreamCaptor.reset();
        provideInput("1\n\n");
        App.recordNewPurchase();
        output = outputStreamCaptor.toString();
        assertTrue(output.contains("Invalid date format"));

        // Test: Empty items input
        outputStreamCaptor.reset();
        provideInput("1\n01/01/2025\n\n");
        App.recordNewPurchase();
        output = outputStreamCaptor.toString();
        assertTrue(output.contains("Items cannot be empty"));

        // Test: Empty price input
        outputStreamCaptor.reset();
        provideInput("1\n01/01/2025\nitem1\n");
        App.recordNewPurchase();
        output = outputStreamCaptor.toString();
        assertTrue(output.contains("Price cannot be empty"));
    }

    @Test
    void test_FindPurchaseByDate_WithInvalidFormat() {
        // Test: Invalid date format
        provideInput("01-01-2025\n");
        App.findPurchaseByDate();
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("Invalid date format"));
    }


    @Test
    void test_DeleteUser_WithInvalidIndex() {
        // Test: Invalid user index
        provideInput("999\n");
        App.deleteUser();
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("Invalid user index"));
    }
    
    @Test
    void test_DisplayAllUsers_ExceptionHandling() {
        // Test: Display users with null user list
        App.users = null;
        outputStreamCaptor.reset();
        App.displayAllUsers();
        String output = outputStreamCaptor.toString();
        assertTrue(output.contains("User list is not initialized"));
    }
}


    // ... 省略其他代码 ...
}