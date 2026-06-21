import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import static org.junit.Assert.*;

public class AppIntegrationTest {

    private App app;

    @Before
    public void setUp() {
        app = new App();
        App.purchaseRecords.clear();
        App.users.clear();
    }

    @After
    public void tearDown() {
        App.purchaseRecords.clear();
        App.users.clear();
    }

    @Test
    public void testAddUser() {
        app.addUser();
        assertEquals(1, App.users.size());
        assertNotNull(App.users.get(0));
    }

    @Test
    public void testDeleteUser() {
        app.addUser();
        app.addUser();
        app.deleteUser();
        assertEquals(1, App.users.size());
    }

    @Test
    public void testViewUserPurchaseHistory() {
        app.addUser();
        app.recordNewPurchase();
        app.viewUserPurchaseHistory();
        // 验证输出内容，可以使用Mockito或PowerMock来模拟System.out
    }

    @Test
    public void testRecordNewPurchase() {
        app.addUser();
        app.recordNewPurchase();
        assertEquals(1, App.purchaseRecords.size());
        assertNotNull(App.purchaseRecords.get(0));
    }

    @Test
    public void testDeletePurchaseRecord() {
        app.addUser();
        app.recordNewPurchase();
        app.deletePurchaseRecord();
        assertEquals(0, App.purchaseRecords.size());
    }

    @Test
    public void testLoyaltyPoints() {
        app.addUser();
        app.recordNewPurchase();
        User user = App.users.get(0);
        assertEquals(10, user.getLoyaltyPoints());
    }

    @Test
    public void testDataConsistency() {
        app.addUser();
        app.recordNewPurchase();
        app.deleteUser();
        assertEquals(0, App.users.size());
        assertEquals(0, App.purchaseRecords.size());
    }

    @Test(expected = ParseException.class)
    public void testInvalidDate() {
        app.findPurchaseByDate();
        String invalidDate = "invalid-date";
        new SimpleDateFormat("dd/MM/yyyy").parse(invalidDate);
    }

    import static org.mockito.Mockito.*;

    @Test
    public void testUserInput() {
        Scanner mockScanner = mock(Scanner.class);
        when(mockScanner.next()).thenReturn("H").thenReturn("X");
        App.scanner = mockScanner;
        app.main(new String[]{});
        verify(mockScanner, times(2)).next();
    }
}