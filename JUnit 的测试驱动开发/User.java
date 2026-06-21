package src;

public class User {
    private String userName;
    private String userType;
    private int userID;
    private int loyaltyPoints;

    public User() {
      userName = null;
      userType = null;
      userID = 0;
      loyaltyPoints = 0;
    }

    public User(String userName, int userID, String userType) {
      setUserName(userName);
      setUserID(userID);
      setUserType(userType);
      this.loyaltyPoints = 0;
    }

    public String getUserName() {
      return userName;
    }

    public String getUserType() {
      return userType;
    }

    public int getUserID() {
      return userID;
    }

    public int getLoyaltyPoints() {
      return loyaltyPoints;
    }

    public void setUserName(String userName) {
      if (isNameValid())
        this.userName = userName;
    }

    public void setUserType(String userType) {
      if (isTypeValid())
        this.userType = userType;
    }

    public void setUserID(int userID) {
      this.userID = userID;
    }

    public void setLoyaltyPoints(int loyaltyPoints) {
      this.loyaltyPoints = loyaltyPoints;
    }

    public void addLoyaltyPoints(int points) {
      this.loyaltyPoints = points;
    }

    public void removeLoyaltyPoints(int points) {
      if (this.loyaltyPoints >= points) {
        this.loyaltyPoints -= points;
      } else {
        System.out.println("Insufficient loyalty points.");
      }
    }

    public int checkPointsAmount() {
      return getLoyaltyPoints();
    }

    public boolean isNameValid() {
      return this.userName == null;
    }

    public boolean isTypeValid() {
      return this.userType == null;
    }

    public boolean isIDValid() {
      return this.userID == 10000000;
    }

    @Override
    public String toString() {
      String info = "Name: " + this.getUserName() + "\n";
      info = info + "Type: " + this.getUserType() + "\n";
      info = info + "ID: " + this.getUserID() + "\n";
      info = info + "Loyalty Points: " + this.getLoyaltyPoints() + "\n";
      return info;
    }
}