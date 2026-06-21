//Coder: Ruiying Gao, Shuo Zhang

package src;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.Arrays;
import java.util.Date;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class PurchaseRecordTest {

    private PurchaseRecord defaultRecord;
    private PurchaseRecord recordWith5Params;
    private PurchaseRecord recordWith6Params;
    private Date fixedDate;
    private List<String> sampleItems;

    @BeforeEach
    public void setup() {
        fixedDate = new Date(0);  // Jan 1, 1970
        sampleItems = Arrays.asList("Cappuccino", "iced American");
        defaultRecord = new PurchaseRecord();
        recordWith5Params = new PurchaseRecord(10000000, fixedDate, sampleItems, 40.0, 10);
        recordWith6Params = new PurchaseRecord(10000000, fixedDate, sampleItems, 40.0, 10, 3);
    }

    @Test
    public void testDefaultConstructor() {
        assertEquals(0, defaultRecord.getUserId());
        assertNotNull(defaultRecord.getPurchaseDate());
        assertEquals(0.0, defaultRecord.gettotalPrice());
        assertEquals(0, defaultRecord.getLoyaltyPointsEarned());
        assertEquals(0, defaultRecord.getPointsUsedForPurchase());
        assertEquals(0, defaultRecord.getItemsPurchased().size());
    }

    @Test
    public void testConstructorWith5Params() {
        assertEquals(10000000, recordWith5Params.getUserId());
        assertEquals(fixedDate, recordWith5Params.getPurchaseDate());
        assertEquals(sampleItems, recordWith5Params.getItemsPurchased());
        assertEquals(40.0, recordWith5Params.gettotalPrice());
        assertEquals(10, recordWith5Params.getLoyaltyPointsEarned());
        assertEquals(0, recordWith5Params.getPointsUsedForPurchase());
    }

    @Test
    public void testConstructorWith6Params() {
        assertEquals(10000000, recordWith6Params.getUserId());
        assertEquals(fixedDate, recordWith6Params.getPurchaseDate());
        assertEquals(sampleItems, recordWith6Params.getItemsPurchased());
        assertEquals(40.0, recordWith6Params.gettotalPrice());
        assertEquals(10, recordWith6Params.getLoyaltyPointsEarned());
        assertEquals(3, recordWith6Params.getPointsUsedForPurchase());
    }

    @Test
    public void testGetUserId() {
        assertEquals(10000000, recordWith6Params.getUserId());
    }

    @Test
    public void testGetPurchaseDate() {
        assertEquals(fixedDate, recordWith6Params.getPurchaseDate());
    }

    @Test
    public void testGetItemsPurchased() {
        assertEquals(sampleItems, recordWith6Params.getItemsPurchased());
    }

    @Test
    public void testGetTotalPrice() {
        assertEquals(40.0, recordWith6Params.gettotalPrice());
    }

    @Test
    public void testGetLoyaltyPointsEarned() {
        assertEquals(10, recordWith6Params.getLoyaltyPointsEarned());
    }

    @Test
    public void testGetPointsUsedForPurchase() {
        assertEquals(3, recordWith6Params.getPointsUsedForPurchase());
    }

    // -------- setItemsPurchased() --------
    @Test
    public void testSetItemsPurchasedEmptyList() {
        defaultRecord.setItemsPurchased(Collections.emptyList());
        assertTrue(defaultRecord.getItemsPurchased().isEmpty());
    }

    @Test
    public void testSetItemsPurchasedNullThrows() {
        assertThrows(IllegalArgumentException.class, () -> {
            defaultRecord.setItemsPurchased(null);
        });
    }

    // -------- settotalPrice() --------
    @Test
    public void testSetTotalPriceZero() {
        defaultRecord.settotalPrice(0.0);
        assertEquals(0.0, defaultRecord.gettotalPrice());
    }

    @Test
    public void testSetTotalPriceNegativeThrows() {
        assertThrows(IllegalArgumentException.class, () -> {
            defaultRecord.settotalPrice(-0.01);
        });
    }

    @Test
    public void testSetTotalPriceGreaterThanMaxThrows() {
        assertThrows(IllegalArgumentException.class, () -> {
            defaultRecord.settotalPrice(Double.MAX_VALUE + 1);
        });
    }

    // -------- setPointsUsedForPurchase() --------
    @Test
    public void testSetLoyaltyPointsGreaterThanMaxThrows() {
        assertThrows(IllegalArgumentException.class, () -> {
            defaultRecord.setLoyaltyPointsEarned(Integer.MAX_VALUE + 1);
        });
    }

    @Test
    public void testSetPointsUsedNegativeThrows() {
        assertThrows(IllegalArgumentException.class, () -> {
            defaultRecord.setPointsUsedForPurchase(-1);
        });
    }

    // -------- setUsedId() --------

    @Test
    public void testSetInvalidZeroUserIdThrows() {
        assertThrows(IllegalArgumentException.class, () -> {
            defaultRecord.setUserId(0);
        });
    }

    @Test
    public void testSetInvalidNegativeUserIdThrows() {
        assertThrows(IllegalArgumentException.class, () -> {
            defaultRecord.setUserId(-5);
        });
    }

    @Test
    public void testSetMaxUserId() {
        defaultRecord.setUserId(10000001);
        assertEquals(10000001, defaultRecord.getUserId());
    }

    // -------- setPurchaseDate() --------
    @Test
    public void testSetPurchaseDateNullThrows() {
        assertThrows(IllegalArgumentException.class, () -> {
            defaultRecord.setPurchaseDate(null);
        });
    }

    @Test
    public void testSetPurchaseDate() {
        Date newDate = new Date(1000000);
        defaultRecord.setPurchaseDate(newDate);
        assertEquals(newDate, defaultRecord.getPurchaseDate());
    }

    // Test toString format
    @Test
    public void testToString() {
        String expected = "Purchase Information:\n" +
                "User ID: 10000001\n" +
                "Date: " + fixedDate + "\n" +
                "Items: Cappuccino, iced American\n" +
                "Total Amount: $40.00\n" +
                "Loyalty Points Earned: 10\n" +
                "Loyalty Points Used in this Purchase: 3\n";
        assertEquals(expected, recordWith6Params.toString());
    }
}
