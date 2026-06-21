package src;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class PurchaseRecord {
    private int userId;
    private Date purchaseDate;
    private List<String> itemsPurchased;
    private double totalPrice;
    private int loyaltyPointsEarned;
    private int pointsUsedForPurchase; 

    public PurchaseRecord() {
        this.userId = 0;
        this.purchaseDate = new Date();
        this.itemsPurchased = new ArrayList<>();
        this.totalPrice = 0.0;
        this.loyaltyPointsEarned = 0;
        this.pointsUsedForPurchase = 0;
    }

    public PurchaseRecord(int userId, Date purchaseDate, List<String> itemsPurchased, double totalPrice, int loyaltyPointsEarned) {
        this(userId, purchaseDate, itemsPurchased, totalPrice, loyaltyPointsEarned, 0);
    }

    public PurchaseRecord(int userId, Date purchaseDate, List<String> itemsPurchased, double totalPrice, int loyaltyPointsEarned, int pointsUsedForPurchase) {
        setUserId(userId);
        setPurchaseDate(purchaseDate);
        setItemsPurchased(itemsPurchased);
        settotalPrice(totalPrice);
        setLoyaltyPointsEarned(loyaltyPointsEarned);
        setPointsUsedForPurchase(pointsUsedForPurchase);
    }

    public int getUserId() {
        return userId;
    }

    public Date getPurchaseDate() {
        return purchaseDate;
    }

    public List<String> getItemsPurchased() {
        return itemsPurchased;
    }

    public double gettotalPrice() {
        return totalPrice;
    }

    public int getLoyaltyPointsEarned() {
        return loyaltyPointsEarned;
    }

    public int getPointsUsedForPurchase() {
        return pointsUsedForPurchase;
    }

    public void setUserId(int userId) {
        this.userId = userId;
    }

    public void setPurchaseDate(Date purchaseDate) {
        this.purchaseDate = purchaseDate;
    }

    public void setItemsPurchased(List<String> itemsPurchased) {
        this.itemsPurchased = itemsPurchased;
    }

    public void settotalPrice(double totalPrice) {
        this.totalPrice = totalPrice;
    }

    public void setLoyaltyPointsEarned(int loyaltyPointsEarned) {
        this.loyaltyPointsEarned = loyaltyPointsEarned;
    }

    public void setPointsUsedForPurchase(int pointsUsedForPurchase) {
        this.pointsUsedForPurchase = pointsUsedForPurchase;
    }

    @Override
    public String toString() {
        String info = "Purchase Information:\n";
        info += "User ID: " + this.getUserId() + "\n";
        info += "Date: " + this.getPurchaseDate() + "\n";
        info += "Items: " + String.join(", ", this.getItemsPurchased()) + "\n";
        info += "Total Amount: $" + String.format("%.2f", this.gettotalPrice()) + "\n";
        info += "Loyalty Points Earned: " + this.getLoyaltyPointsEarned() + "\n";
        info += "Loyalty Points Used in this Purchase: " + this.getPointsUsedForPurchase() + "\n";
        return info;
    }
}