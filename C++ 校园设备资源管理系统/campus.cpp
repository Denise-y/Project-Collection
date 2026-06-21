// 20616309 scyyw25 Yushan Wang
// No external tools or sources were used.
#include <iostream>
#include <sstream>
#include <vector>
#include <string>
#include <memory>
#include <algorithm>
#include <iomanip>
#include <cctype>
#include <limits>

class Resource {
protected:
    std::string id;
    std::string name;
    std::string owner;
    bool isBorrowed;

public:
    Resource(std::string id, std::string name, std::string owner)
        : id(std::move(id)), name(std::move(name)), owner(std::move(owner)), isBorrowed(false) {}

    virtual ~Resource() = default;

    virtual int maxBorrowDays() const = 0;
    virtual double penaltyPerDay() const = 0;
    virtual std::string getType() const = 0;

    virtual void display() const {
        std::cout << "[" << getType() << "] ID: " << id
                  << " Name: " << name
                  << " Owner: " << owner
                  << " Available: " << (isBorrowed ? "No" : "Yes") << "\n";
    }

    const std::string& getID() const { return id; }
    const std::string& getName() const { return name; }
    const std::string& getOwner() const { return owner; }
    bool getIsBorrowed() const { return isBorrowed; }
    void setBorrowed(bool status) { isBorrowed = status; }
};

class Laptop : public Resource {
public:
    using Resource::Resource;
    int maxBorrowDays() const override { return 7; }
    double penaltyPerDay() const override { return 20.0; }
    std::string getType() const override { return "Laptop"; }
};

class Camera : public Resource {
public:
    using Resource::Resource;
    int maxBorrowDays() const override { return 3; }
    double penaltyPerDay() const override { return 15.0; }
    std::string getType() const override { return "Camera"; }
};

class Projector : public Resource {
public:
    using Resource::Resource;
    int maxBorrowDays() const override { return 1; }
    double penaltyPerDay() const override { return 50.0; }
    std::string getType() const override { return "Projector"; }
};

class Ebike : public Resource {
public:
    using Resource::Resource;
    int maxBorrowDays() const override { return 1; }
    double penaltyPerDay() const override { return 30.0; }
    std::string getType() const override { return "Ebike"; }
};

class CampusResourceSystem {
private:
    std::vector<std::unique_ptr<Resource>> resources;

    bool isValidID(const std::string& id, const std::string& type) const {
        if (id.size() != 4) return false;
        if (!isupper(static_cast<unsigned char>(id[0]))) return false;
        if (!isdigit(static_cast<unsigned char>(id[1])) ||
            !isdigit(static_cast<unsigned char>(id[2])) ||
            !isdigit(static_cast<unsigned char>(id[3]))) return false;

        char expected = 0;
        if (type == "Laptop") expected = 'L';
        else if (type == "Camera") expected = 'C';
        else if (type == "Projector") expected = 'P';
        else if (type == "Ebike") expected = 'E';
        else return false;

        if (id[0] != expected) return false;

        for (const auto& r : resources) {
            if (r->getID() == id) return false;
        }
        return true;
    }

    bool isValidName(const std::string& s) const {
        if (s.empty()) return false;
        if (!isalpha(static_cast<unsigned char>(s[0]))) return false;
        for (char c : s) {
            if (!isalnum(static_cast<unsigned char>(c)) && c != '-') return false;
        }
        return true;
    }

    auto findByID(const std::string& id) const {
        return std::find_if(resources.begin(), resources.end(),
            [&id](const auto& r) { return r->getID() == id; });
    }

    bool isNonNegativeInteger(const std::string& s) const {
        if (s.empty()) return false;
        for (char c : s) {
            if (!std::isdigit(static_cast<unsigned char>(c))) {
                return false;
            }
        }
        return true;
    }

    bool readSingle(std::string& out) const {
        std::string line;
        std::getline(std::cin, line);
        if (line.empty()) return false;

        std::istringstream iss(line);
        if (!(iss >> out)) return false;

        std::string leftover;
        if (iss >> leftover) return false;

        return true;
    }

    bool readTwo(std::string& a, std::string& b) const {
        std::string line;
        std::getline(std::cin, line);
        if (line.empty()) return false;

        std::istringstream iss(line);
        if (!(iss >> a >> b)) return false;

        std::string leftover;
        if (iss >> leftover) return false;

        return true;
    }

    bool readThree(std::string& a, std::string& b, std::string& c) const {
        std::string line;
        std::getline(std::cin, line);
        if (line.empty()) return false;

        std::istringstream iss(line);
        if (!(iss >> a >> b >> c)) return false;

        std::string leftover;
        if (iss >> leftover) return false;

        return true;
    }

public:
    void addResource() {
        while (true) {
            std::string type;
            std::cout << "Enter resource type (Laptop/Camera/Projector/Ebike): ";

            if (!readSingle(type) || 
                (type != "Laptop" && type != "Camera" && 
                 type != "Projector" && type != "Ebike")) {
                std::cout << "Invalid input. Try again.\n";
                continue;
            }
            
            std::string id, name, owner;
            std::cout << "Enter ID, Name, Owner: ";

            if (!readThree(id, name, owner) || !isValidID(id, type) || !isValidName(name) || !isValidName(owner)) {
                std::cout << "Invalid input. Try again.\n";
                continue;
            }

            std::unique_ptr<Resource> ptr;
            if (type == "Laptop") ptr = std::make_unique<Laptop>(id, name, owner);
            else if (type == "Camera") ptr = std::make_unique<Camera>(id, name, owner);
            else if (type == "Projector") ptr = std::make_unique<Projector>(id, name, owner);
            else ptr = std::make_unique<Ebike>(id, name, owner);

            resources.push_back(std::move(ptr));
            std::cout << "Resource " << id << " added.\n";
            break;
        }
    }

    void removeResource() {
        std::string id;
        std::cout << "Enter resource ID to remove: ";
        if (!readSingle(id)) {
            std::cout << "Invalid input. Try again.\n";
            return;
        }

        auto it = findByID(id);
        if (it == resources.end() || (*it)->getIsBorrowed()) {
            std::cout << "Invalid input. Try again.\n";
            return;
        }
        resources.erase(it);
        std::cout << "Resource " << id << " removed.\n";
    }

    void borrowResource() {
        std::string id;
        std::cout << "Enter resource ID to borrow: ";
        if (!readSingle(id)) {
            std::cout << "Invalid input. Try again.\n";
            return;
        }

        auto it = findByID(id);
        if (it == resources.end() || (*it)->getIsBorrowed()) {
            std::cout << "Invalid input. Try again.\n";
            return;
        }
        (*it)->setBorrowed(true);
        std::cout << "Resource " << id << " borrowed.\n";
    }

    void returnResource() {
        std::string id, daysStr;
        std::cout << "Enter resource ID and days overdue: ";

        if (!readTwo(id, daysStr) || !isNonNegativeInteger(daysStr)) {
            std::cout << "Invalid input. Try again.\n";
            return;
        }

        int daysOverdue = std::stoi(daysStr);
        auto it = findByID(id);
        if (it == resources.end() || !(*it)->getIsBorrowed()) {
            std::cout << "Invalid input. Try again.\n";
            return;
        }

        (*it)->setBorrowed(false);
        std::cout << std::fixed << std::setprecision(2);
        if (daysOverdue == 0) {
            std::cout << "No penalty.\n";
        } else {
            double fee = daysOverdue * (*it)->penaltyPerDay();
            std::cout << "Penalty for " << id << ": CNY " << fee << "\n";
        }
    }

    void displayAll() const {
        for (const auto& r : resources) r->display();
    }

    void filterByAvailability() const {
        std::string s;
        std::cout << "Filter available (1) or unavailable (0): ";
        if (!readSingle(s) || (s != "0" && s != "1")) {
            std::cout << "Invalid input. Try again.\n";
            return;
        }
        int ch = stoi(s);
        for (const auto& r : resources) {
            bool ok = (ch == 1 && !r->getIsBorrowed()) || (ch == 0 && r->getIsBorrowed());
            if (ok) r->display();
        }
    }

    void displaySortedByName() const {
        std::vector<const Resource*> tmp;
        for (const auto& r : resources) tmp.push_back(r.get());

        std::sort(tmp.begin(), tmp.end(), [](const Resource* a, const Resource* b) {
            return a->getName() < b->getName();
        });

        for (const auto& r : tmp) r->display();
    }

    void totalPenaltyForOwner() const {
        std::string owner;
        std::cout << "Enter owner name: ";
        if (!readSingle(owner)) {
            std::cout << "Invalid input. Try again.\n";
            return;
        }

        double total = 0.0;
        for (const auto& r : resources) {
            if (r->getOwner() == owner && r->getIsBorrowed()) {
                total += r->penaltyPerDay();
            }
        }
        std::cout << std::fixed << std::setprecision(2);
        std::cout << "Total penalty rate for " << owner << ": CNY " << total << "/day\n";
    }

    void run() {
        while(true){
            int choice;  
            std::cout << "Campus Resource Management System\n";
            std::cout << "1. Add Resource\n";
            std::cout << "2. Remove Resource\n";
            std::cout << "3. Borrow Resource\n";
            std::cout << "4. Return Resource\n";
            std::cout << "5. Display All Resources\n";
            std::cout << "6. Filter by Availability\n";
            std::cout << "7. Display Sorted by Name\n";
            std::cout << "8. Total Penalty for Owner\n";
            std::cout << "9. Exit\n";

            std::cout << "Enter your choice: ";      
            std::string s;
            if (!readSingle(s)) {
                std::cout << "Invalid input. Try again.\n";
                continue;
            }
            
            try { choice = stoi(s); }
            catch (...) {
                std::cout << "Invalid input. Try again.\n";
                continue;
            }

            if (choice < 1 || choice > 9) {
                std::cout << "Invalid input. Try again.\n";
                continue;
            }
            switch (choice) {
                case 1: addResource(); break;
                case 2: removeResource(); break;
                case 3: borrowResource(); break;
                case 4: returnResource(); break;
                case 5: displayAll(); break;
                case 6: filterByAvailability(); break;
                case 7: displaySortedByName(); break;
                case 8: totalPenaltyForOwner(); break;
                case 9: return;
                default: std::cout << "Invalid input. Try again.\n";        
            }
        }
    }
};

int main() {
    CampusResourceSystem sys;
    sys.run();
    return 0;
}